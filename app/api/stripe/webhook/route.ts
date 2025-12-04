import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminDb } from '@/lib/firebase-admin';
import Stripe from 'stripe';
import admin from 'firebase-admin';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// Server-side versions of usage limits (for webhooks)
function getDefaultUsageForServer() {
  return {
    maxCustomers: 50,
    maxMonthlyStamps: 500,
    currentMonthStamps: 0,
    monthStartedAt: admin.firestore.Timestamp.now(),
    maxActivityFeedItems: 10,
    canUploadLogo: true,
    minStampCardStamps: 3,
    maxStampCardStamps: 50,
  };
}

function getProUsageForServer() {
  return {
    maxCustomers: -1,
    maxMonthlyStamps: -1,
    currentMonthStamps: 0,
    monthStartedAt: admin.firestore.Timestamp.now(),
    maxActivityFeedItems: 100,
    canUploadLogo: true,
    minStampCardStamps: 3,
    maxStampCardStamps: 50,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Handle successful checkout
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Get subscription details
  const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId) as any;
  const priceId = subscriptionData.items.data[0].price.id;

  // Find business by Stripe customer ID or metadata
  const businessId = session.metadata?.businessId;

  if (!businessId) {
    console.error('No businessId in session metadata');
    return;
  }

  const businessRef = adminDb.collection('businesses').doc(businessId);

  // Update business to Pro tier
  await businessRef.update({
    'subscription.tier': 'pro',
    'subscription.status': 'active',
    'subscription.stripeCustomerId': customerId,
    'subscription.stripeSubscriptionId': subscriptionId,
    'subscription.stripePriceId': priceId,
    'subscription.cancelAtPeriodEnd': false,
    'usage': getProUsageForServer(),
    'updatedAt': admin.firestore.Timestamp.now(),
  });
}


// Handle subscription updates
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find business by Stripe customer ID
  const business = await findBusinessByCustomerId(customerId);

  if (!business) {
    console.error(`No business found for customer ${customerId}`);
    return;
  }

  const businessRef = adminDb.collection('businesses').doc(business.id);

    // Safely convert Unix timestamps (seconds) to Firestore Timestamps
  const currentPeriodStart = subscription.items.data[0].current_period_start
    ? admin.firestore.Timestamp.fromMillis(subscription.items.data[0].current_period_start * 1000)
    : admin.firestore.Timestamp.now();

  const currentPeriodEnd = subscription.items.data[0].current_period_end
    ? admin.firestore.Timestamp.fromMillis(subscription.items.data[0].current_period_end * 1000)
    : null;

  const cancelAt = subscription.cancel_at
    ? admin.firestore.Timestamp.fromMillis(subscription.cancel_at * 1000)
    : null;

  // Update subscription status and dates
  await businessRef.update({
    'subscription.status': subscription.status,
    'subscription.currentPeriodStart': currentPeriodStart,
    'subscription.currentPeriodEnd': currentPeriodEnd,
    'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end || false,
    'subscription.cancelAt': cancelAt,
    'updatedAt': admin.firestore.Timestamp.now(),
  });
}

// Handle subscription cancellation
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find business by Stripe customer ID
  const business = await findBusinessByCustomerId(customerId);

  if (!business) {
    console.error(`No business found for customer ${customerId}`);
    return;
  }

  const businessRef = adminDb.collection('businesses').doc(business.id);

  // Downgrade to Free tier (keep data, restore Free limits)
  await businessRef.update({
    'subscription.tier': 'free',
    'subscription.status': 'canceled',
    'subscription.cancelAtPeriodEnd': false,
    'subscription.cancelAt': null,
    'usage': getDefaultUsageForServer(),
    'updatedAt': admin.firestore.Timestamp.now(),
  });
}

// Handle payment failures
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find business by Stripe customer ID
  const business = await findBusinessByCustomerId(customerId);

  if (!business) {
    console.error(`No business found for customer ${customerId}`);
    return;
  }

  const businessRef = adminDb.collection('businesses').doc(business.id);

  // Update subscription status to past_due
  await businessRef.update({
    'subscription.status': 'past_due',
    'updatedAt': admin.firestore.Timestamp.now(),
  });
}

// Handle successful payment
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find business by Stripe customer ID
  const business = await findBusinessByCustomerId(customerId);

  if (!business) {
    console.error(`No business found for customer ${customerId}`);
    return;
  }

  const businessRef = adminDb.collection('businesses').doc(business.id);

  // Get the billing period from the invoice
  const periodStart = invoice.lines.data[0].period.start
    ? admin.firestore.Timestamp.fromMillis(invoice.lines.data[0].period.start * 1000)
    : null;

  const periodEnd = invoice.lines.data[0].period.end
    ? admin.firestore.Timestamp.fromMillis(invoice.lines.data[0].period.end * 1000)
    : null;

  // Update subscription with correct billing period
  await businessRef.update({
    'subscription.status': 'active',
    'subscription.currentPeriodStart': periodStart,
    'subscription.currentPeriodEnd': periodEnd,
    'updatedAt': admin.firestore.Timestamp.now(),
  });
}

// Helper function to find business by Stripe customer ID
async function findBusinessByCustomerId(customerId: string): Promise<any | null> {
  const snapshot = await adminDb
    .collection('businesses')
    .where('subscription.stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}
