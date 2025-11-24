# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RewardyClub is a Next.js 16 application built with React 19, TypeScript, and Tailwind CSS 4. It's a digital stamp card platform connecting customers with local businesses, replacing traditional paper punch cards with a mobile-first web application.

**Status**: Phase 1 MVP Complete - Core authentication, customer dashboard, and business dashboard with QR scanning functionality implemented.

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
4. Copy Firebase config to `.env.local` (replace placeholder values)
5. Deploy Firestore security rules: `firebase deploy --only firestore:rules`

The `.env.local` file contains placeholder values that must be replaced with your actual Firebase credentials.

## Architecture

### App Router Structure

This project uses Next.js App Router (not Pages Router). All routes are defined in the `app/` directory:

- `app/page.tsx` - Login page with Google OAuth and user type selection
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

### Core Libraries and Data Layer

**Firebase Integration** (`lib/firebase.ts`):
- Initializes Firebase app, Auth, and Firestore
- Enables offline persistence for better mobile experience
- Exports `auth`, `db`, and `googleProvider`

**Database Helpers** (`lib/firestore.ts`):
- User management: `createUser()`, `getUser()`, `getUserByMemberId()`
- Stamp cards: `getUserStampCards()`, `getOrCreateStampCard()`, `addStampToCard()`
- Business: `getBusinessByOwnerId()`, `createBusiness()`, `getBusinessStats()`
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

### Styling

- Uses Tailwind CSS 4 with the new `@import "tailwindcss"` syntax (not the old @tailwind directives)
- CSS variables defined in `app/globals.css` for theming
- Dark mode support via `prefers-color-scheme` media query
- Custom theme variables: `--color-background`, `--color-foreground`, `--font-sans`, `--font-mono`

### TypeScript Configuration

- Path alias `@/*` maps to root directory (e.g., `@/app/components/Button`)
- Strict mode enabled
- Target: ES2017
- JSX runtime: `react-jsx` (automatic JSX transform, no need to import React in JSX files)

## Important Business Logic

### Stamp Validation Rules (lib/firestore.ts:144-169)

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

## Key Conventions

- Server Components are the default; add 'use client' only when needed
- Use relative imports for components in the same feature area
- Use path alias `@/` for cross-cutting imports
- Follow Next.js App Router conventions for routing (folder-based routing with page.tsx files)
- Component files use PascalCase (e.g., `StampCard.tsx`)
- Utility files use camelCase (e.g., `firestore.ts`)
