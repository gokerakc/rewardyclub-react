# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RewardyClub is a Next.js 16 application built with React 19, TypeScript, and Tailwind CSS 4. It's a digital stamp card platform connecting customers with local businesses, replacing traditional paper punch cards with a mobile-first web application.

**Brand**: Orange color scheme (#ea580c) throughout the application.

**Status**: Phase 2 Complete - Full-featured MVP with:
- ✅ Landing page with product value proposition
- ✅ Authentication (Google OAuth) with user type selection
- ✅ Customer dashboard with QR code and real-time stamp cards
- ✅ Business dashboard with QR scanner, statistics, and activity feed
- ✅ Business settings with logo upload, stamp configuration, and reward management
- ✅ Firebase Storage integration for business logos
- ✅ Firestore composite indexes for optimized queries
- ✅ Responsive mobile-first design

## Development Commands

- **Start development server**: `npm run dev` (runs on http://localhost:3000)
- **Build for production**: `npm run build`
- **Start production server**: `npm start`
- **Run linter**: `npm run lint`

## Firebase Setup Required

Before running the application, you need to:

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Google Authentication (Authentication → Sign-in method → Google)
3. Create a Firestore database (Firestore Database → Create database → Start in test mode)
4. Enable Firebase Storage (Storage → Get Started)
5. Copy Firebase config to `.env.local` (replace placeholder values)
6. Deploy Firestore security rules: `firebase deploy --only firestore:rules`
7. Deploy Firestore indexes: `firebase deploy --only firestore:indexes`
8. Deploy Storage security rules: `firebase deploy --only storage`
9. Configure Storage CORS (see below)

The `.env.local` file contains placeholder values that must be replaced with your actual Firebase credentials.

**Important**: The Firestore indexes are required for queries with multiple where clauses and orderBy. If you get an error saying "The query requires an index", make sure you've deployed the indexes from `firestore.indexes.json`.

### Firebase Storage CORS Configuration

To allow logo uploads from localhost during development, you need to configure CORS for Firebase Storage:

**Option 1: Using Google Cloud Console (Easiest)**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to Cloud Storage → Buckets
4. Click on your bucket (usually `[project-id].appspot.com`)
5. Go to the "Configuration" tab
6. Click "Edit CORS configuration"
7. Paste the contents of `storage.cors.json`
8. Save

**Option 2: Using gsutil (Command Line)**
```bash
# Install Google Cloud SDK if not already installed
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Apply CORS configuration
gsutil cors set storage.cors.json gs://YOUR_BUCKET_NAME.appspot.com
```

Replace `YOUR_PROJECT_ID` with your Firebase project ID and `YOUR_BUCKET_NAME` with your storage bucket name (found in Firebase Console → Storage).

## Architecture

### App Router Structure

This project uses Next.js App Router (not Pages Router). All routes are defined in the `app/` directory:

- `app/page.tsx` - Landing page explaining the product value proposition
- `app/login/page.tsx` - Login page with Google OAuth and user type selection
- `app/layout.tsx` - Root layout wrapped with AuthProvider (Geist Sans & Geist Mono fonts)
- `app/customer/dashboard/page.tsx` - Customer dashboard showing QR code and stamp cards
- `app/business/dashboard/page.tsx` - Business dashboard with QR scanner and statistics

### Component Architecture

Components are organized by feature:

**Customer Components** (`components/customer/`):
- `RewardCard.tsx` - Displays customer's QR code for scanning
- `StampCard.tsx` - Shows individual stamp card progress with visual stamps
- `StampCardList.tsx` - Lists all stamp cards with loading/empty states

**Business Components** (`components/business/`):
- `StatsCard.tsx` - Reusable stat display card (customers, cards, stamps)
- `QRScanner.tsx` - Camera-based QR code scanner using html5-qrcode
- `RecentActivity.tsx` - Transaction feed showing recent stamp additions
- `BusinessSettings.tsx` - Settings modal for logo upload, business name, stamp count, and reward configuration

### Core Libraries and Data Layer

**Firebase Integration** (`lib/firebase.ts`):
- Initializes Firebase app, Auth, Firestore, and Storage
- Enables offline persistence for better mobile experience
- Exports `auth`, `db`, `storage`, and `googleProvider`

**Database Helpers** (`lib/firestore.ts`):
- User management: `createUser()`, `getUser()`, `getUserByMemberId()`
- Stamp cards: `getUserStampCards()`, `getOrCreateStampCard()`, `addStampToCard()`
- Business: `getBusinessByOwnerId()`, `createBusiness()`, `updateBusiness()`, `getBusinessStats()`
- Transactions: `logTransaction()`, `getRecentTransactions()`
- Member ID generation: Format `RC-YYYY-XXXXXX` (e.g., RC-2024-789456)

**Authentication** (`contexts/AuthContext.tsx`):
- Global auth state using React Context
- Auto-creates user document in Firestore on first login
- Handles user type selection (customer/business)
- Provides `loginWithGoogle()` and `logout()` functions

**Type Definitions** (`types/index.ts`):
- Full TypeScript interfaces for User, Business, StampCard, Transaction
- Ensures type safety across the application

### Client vs Server Components

- All dashboard pages and interactive components use 'use client' directive
- Server Components used for static layouts
- When adding interactivity, state, or browser APIs, components must have 'use client' at the top

### Styling & Branding

- Uses Tailwind CSS 4 with the new `@import "tailwindcss"` syntax (not the old @tailwind directives)
- **Primary Color**: Orange (#ea580c, #f97316) - used throughout UI for buttons, accents, and highlights
- CSS variables defined in `app/globals.css` for theming
- Dark mode support via `prefers-color-scheme` media query
- Custom theme variables: `--color-background`, `--color-foreground`, `--font-sans`, `--font-mono`
- Custom favicon: `app/icon.png` (loyalty program logo)

### TypeScript Configuration

- Path alias `@/*` maps to root directory (e.g., `@/app/components/Button`)
- Strict mode enabled
- Target: ES2017
- JSX runtime: `react-jsx` (automatic JSX transform, no need to import React in JSX files)

## Features

### For Customers
- **Universal QR Code**: Single QR code works at all participating businesses
- **Digital Stamp Cards**: Track progress across multiple businesses in one app
- **Real-time Updates**: See stamps added instantly via Firestore listeners
- **Progress Tracking**: Visual progress bars and stamp grids
- **Reward Visibility**: Clear display of rewards and completion status

### For Businesses
- **QR Code Scanning**: Scan customer QR codes with device camera (html5-qrcode)
- **Business Settings**:
  - Upload custom logo (Firebase Storage, max 2MB)
  - Configure stamp count (3-50 stamps)
  - Set custom reward text
  - Update business name
- **Dashboard Analytics**: Track customers, active cards, and stamps issued
- **Activity Feed**: Real-time transaction history
- **Simple Onboarding**: Create account in under 5 minutes

## Important Business Logic

### Stamp Validation Rules (lib/firestore.ts:179-211)

The `addStampToCard()` function implements these validations:
- **Cooldown period**: 15 minutes between stamps (same customer, same business)
- **Stamp limit**: Cannot exceed `totalStamps` configured for the card
- **Completed cards**: Cannot add stamps to completed or redeemed cards
- **Auto-completion**: Card is marked complete when `currentStamps === totalStamps`

### Member ID Format

- Format: `RC-YYYY-XXXXXX`
- Example: `RC-2024-789456`
- RC = Rewardy Club prefix
- YYYY = Current year
- XXXXXX = Random 6-digit number
- Validated in business dashboard before processing scans

### Real-Time Updates

- Customer dashboard uses Firestore `onSnapshot` for real-time stamp updates
- Business dashboard shows live transaction feed
- All subscriptions properly cleaned up on component unmount

### Business Settings & Logo Management

- Businesses can upload logos via Firebase Storage
- Logo validation: Images only, max 2MB
- Old logos automatically deleted when replaced
- Logos stored at: `logos/{businessId}_{timestamp}.{ext}`
- Changes to stamp configuration apply only to new cards (existing cards unchanged)
- Settings changes trigger automatic dashboard refresh

## Key Conventions

- Server Components are the default; add 'use client' only when needed
- Use relative imports for components in the same feature area
- Use path alias `@/` for cross-cutting imports
- Follow Next.js App Router conventions for routing (folder-based routing with page.tsx files)
- Component files use PascalCase (e.g., `StampCard.tsx`)
- Utility files use camelCase (e.g., `firestore.ts`)

## Configuration Files

- `firestore.rules` - Firestore security rules
- `firestore.indexes.json` - Composite indexes for complex queries
- `storage.rules` - Firebase Storage security rules (images only, 2MB max, authenticated uploads)
- `storage.cors.json` - CORS configuration for Storage (allows localhost and production domains)
- `firebase.json` - Firebase deployment configuration
