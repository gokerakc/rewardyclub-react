import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
  arrayUnion,
  addDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Business, StampCard, Transaction, BusinessStats } from '@/types';
import { getDefaultSubscription, getDefaultUsage, shouldResetMonthlyStamps, canAddStamp, canAddCustomer } from './subscription';

// ===========================
// User Management
// ===========================

export async function createUser(uid: string, userData: Partial<User>): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    const timestamp = Timestamp.now();

    const newUser: User = {
      uid,
      email: userData.email || '',
      displayName: userData.displayName || '',
      photoURL: userData.photoURL,
      userType: userData.userType || 'customer',
      memberId: userData.userType === 'customer' ? await generateMemberId() : '',
      createdAt: timestamp,
      lastLoginAt: timestamp,
    };

    await setDoc(userRef, newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user account');
  }
}

export async function getUser(uid: string): Promise<User | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to fetch user data');
  }
}

export async function updateUserLoginTime(uid: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      lastLoginAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating login time:', error);
  }
}

// ===========================
// Member ID Generation
// ===========================

export async function generateMemberId(): Promise<string> {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100000 + Math.random() * 900000); // 6-digit number
  return `RC-${year}-${randomNum}`;
}

// ===========================
// Stamp Cards
// ===========================

export async function getUserStampCards(userId: string): Promise<StampCard[]> {
  try {
    const cardsRef = collection(db, 'stampCards');
    const q = query(
      cardsRef,
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const cards: StampCard[] = [];

    querySnapshot.forEach((doc) => {
      cards.push({ id: doc.id, ...doc.data() } as StampCard);
    });

    return cards;
  } catch (error) {
    console.error('Error fetching stamp cards:', error);
    throw new Error('Failed to load your stamp cards');
  }
}

export async function getOrCreateStampCard(
  userId: string,
  businessId: string
): Promise<StampCard> {
  try {
    // Check if card already exists
    const cardsRef = collection(db, 'stampCards');
    const q = query(
      cardsRef,
      where('userId', '==', userId),
      where('businessId', '==', businessId),
      where('isRedeemed', '==', false)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as StampCard;
    }

    // Create new card
    const business = await getBusiness(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    // Check if business can add more customers (subscription limit)
    if (!canAddCustomer(business)) {
      throw new Error('LIMIT_CUSTOMERS');
    }

    const timestamp = Timestamp.now();
    const newCard: Omit<StampCard, 'id'> = {
      userId,
      businessId,
      businessName: business.name,
      businessType: business.businessType,
      logoURL: business.logoURL,
      totalStamps: business.stampCardConfig.totalStamps,
      currentStamps: 0,
      reward: business.stampCardConfig.reward,
      colorClass: business.stampCardConfig.colorClass,
      stamps: [],
      isCompleted: false,
      isRedeemed: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const cardRef = await addDoc(collection(db, 'stampCards'), newCard);

    // Update business stats
    await updateDoc(doc(db, 'businesses', businessId), {
      'stats.activeCards': increment(1),
      'stats.totalCustomers': increment(1),
    });

    // Log transaction
    await logTransaction({
      type: 'card_created',
      customerId: userId,
      businessId,
      stampCardId: cardRef.id,
      metadata: { businessName: business.name },
      timestamp,
    });

    return { id: cardRef.id, ...newCard } as StampCard;
  } catch (error) {
    console.error('Error creating stamp card:', error);
    throw new Error('Failed to create stamp card');
  }
}

export async function addStampToCard(
  cardId: string,
  businessOwnerId: string
): Promise<boolean> {
  try {
    const cardRef = doc(db, 'stampCards', cardId);
    const cardSnap = await getDoc(cardRef);

    if (!cardSnap.exists()) {
      throw new Error('Stamp card not found');
    }

    const card = cardSnap.data() as StampCard;

    // Validation: Check if card is already completed or redeemed
    if (card.isCompleted || card.isRedeemed) {
      throw new Error('This card has already been completed or redeemed');
    }

    // Validation: Check if stamp limit reached
    if (card.currentStamps >= card.totalStamps) {
      throw new Error('Stamp card is already full');
    }

    // Validation: Check cooldown (15 minutes)
    if (card.stamps.length > 0) {
      const lastStamp = card.stamps[card.stamps.length - 1];
      const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;

      if (lastStamp.stampedAt.toMillis() > fifteenMinutesAgo) {
        throw new Error('Please wait 15 minutes between stamps');
      }
    }

    // Validation: Check monthly stamp limit for subscription tier
    const businessRef = doc(db, 'businesses', card.businessId);
    const businessSnap = await getDoc(businessRef);

    if (!businessSnap.exists()) {
      throw new Error('Business not found');
    }

    const business = businessSnap.data() as Business;

    // Check if month has reset (30 days passed)
    if (shouldResetMonthlyStamps(business)) {
      await updateDoc(businessRef, {
        'usage.currentMonthStamps': 0,
        'usage.monthStartedAt': Timestamp.now(),
      });
      // Update local business object
      business.usage.currentMonthStamps = 0;
      business.usage.monthStartedAt = Timestamp.now();
    }

    // Check if business can add more stamps this month
    if (!canAddStamp(business)) {
      throw new Error('LIMIT_MONTHLY_STAMPS');
    }

    const timestamp = Timestamp.now();
    const newStamp = {
      stampedAt: timestamp,
      stampedBy: businessOwnerId,
    };

    const newStampCount = card.currentStamps + 1;
    const isNowCompleted = newStampCount === card.totalStamps;

    // Update card
    const updateData: any = {
      stamps: arrayUnion(newStamp),
      currentStamps: increment(1),
      updatedAt: timestamp,
    };

    if (isNowCompleted) {
      updateData.isCompleted = true;
      updateData.completedAt = timestamp;
    }

    await updateDoc(cardRef, updateData);

    // Update business stats
    await updateDoc(doc(db, 'businesses', card.businessId), {
      'stats.totalStampsIssued': increment(1),
      'usage.currentMonthStamps': increment(1),
    });

    // Log transaction
    await logTransaction({
      type: 'stamp_added',
      customerId: card.userId,
      businessId: card.businessId,
      stampCardId: cardId,
      metadata: {
        stampNumber: newStampCount,
        isCompleted: isNowCompleted,
      },
      timestamp,
    });

    return true;
  } catch (error) {
    console.error('Error adding stamp:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to add stamp');
  }
}

export async function getStampCardByCustomerId(
  customerId: string,
  businessId: string
): Promise<StampCard | null> {
  try {
    const cardsRef = collection(db, 'stampCards');
    const q = query(
      cardsRef,
      where('userId', '==', customerId),
      where('businessId', '==', businessId),
      where('isRedeemed', '==', false),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as StampCard;
  } catch (error) {
    console.error('Error fetching stamp card:', error);
    throw new Error('Failed to find customer stamp card');
  }
}

// ===========================
// Business
// ===========================

export async function getBusinessByOwnerId(ownerId: string): Promise<Business | null> {
  try {
    const businessesRef = collection(db, 'businesses');
    const q = query(businessesRef, where('ownerId', '==', ownerId), limit(1));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Business;
  } catch (error) {
    console.error('Error fetching business:', error);
    throw new Error('Failed to load business data');
  }
}

export async function getBusiness(businessId: string): Promise<Business | null> {
  try {
    const businessRef = doc(db, 'businesses', businessId);
    const businessSnap = await getDoc(businessRef);

    if (businessSnap.exists()) {
      return { id: businessSnap.id, ...businessSnap.data() } as Business;
    }
    return null;
  } catch (error) {
    console.error('Error fetching business:', error);
    throw new Error('Failed to load business data');
  }
}

export async function getBusinessStats(businessId: string): Promise<BusinessStats> {
  try {
    const business = await getBusiness(businessId);

    if (!business) {
      throw new Error('Business not found');
    }

    return business.stats;
  } catch (error) {
    console.error('Error fetching business stats:', error);
    throw new Error('Failed to load business statistics');
  }
}

export async function createBusiness(businessData: Partial<Business>): Promise<string> {
  try {
    const timestamp = Timestamp.now();

    const newBusiness: Omit<Business, 'id'> = {
      ownerId: businessData.ownerId || '',
      name: businessData.name || '',
      businessType: businessData.businessType || 'other',
      email: businessData.email || '',
      ...(businessData.phone && { phone: businessData.phone }),
      stampCardConfig: businessData.stampCardConfig || {
        totalStamps: 10,
        reward: 'Free Item',
        colorClass: 'from-orange-500 to-orange-600',
      },
      stats: {
        totalCustomers: 0,
        activeCards: 0,
        totalStampsIssued: 0,
      },
      subscription: getDefaultSubscription(),
      usage: getDefaultUsage(),
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const businessRef = await addDoc(collection(db, 'businesses'), newBusiness);
    return businessRef.id;
  } catch (error) {
    console.error('Error creating business:', error);
    throw new Error('Failed to create business');
  }
}

export async function updateBusiness(
  businessId: string,
  updates: Partial<Business>
): Promise<void> {
  try {
    const businessRef = doc(db, 'businesses', businessId);
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    await updateDoc(businessRef, updateData);
  } catch (error) {
    console.error('Error updating business:', error);
    throw new Error('Failed to update business settings');
  }
}

export async function getUserByMemberId(memberId: string): Promise<User | null> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('memberId', '==', memberId), limit(1));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return doc.data() as User;
  } catch (error) {
    console.error('Error fetching user by member ID:', error);
    throw new Error('Customer not found');
  }
}

// ===========================
// Transactions
// ===========================

export async function logTransaction(transaction: Partial<Transaction>): Promise<void> {
  try {
    const timestamp = transaction.timestamp || Timestamp.now();

    const newTransaction: Omit<Transaction, 'id'> = {
      type: transaction.type || 'stamp_added',
      customerId: transaction.customerId || '',
      businessId: transaction.businessId || '',
      stampCardId: transaction.stampCardId,
      metadata: transaction.metadata || {},
      timestamp,
    };

    await addDoc(collection(db, 'transactions'), newTransaction);
  } catch (error) {
    console.error('Error logging transaction:', error);
    // Don't throw - transactions are for audit trail, shouldn't block main operations
  }
}

export async function getRecentTransactions(
  businessId: string,
  limitCount: number = 20
): Promise<Transaction[]> {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('businessId', '==', businessId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];

    querySnapshot.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() } as Transaction);
    });

    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Failed to load activity feed');
  }
}
