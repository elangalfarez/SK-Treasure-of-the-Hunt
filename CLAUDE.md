# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 Progressive Web App (PWA) for a treasure hunt game at Supermal Karawaci. The app uses TypeScript, React 19, and Tailwind CSS with a custom dark theme featuring gold accents. Built with shadcn/ui components and integrates with Supabase for backend services.

## Core Development Commands

### Development & Build
- `npm run dev` - Start development server
- `npm run build` - Build production application  
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

### Package Management
- Uses both `npm` and `pnpm` (check lock files before installing)
- Use `pnpm install` for dependency installation when pnpm-lock.yaml exists

## Application Architecture

### App Router Structure (Next.js 15)
- Uses App Router with TypeScript
- Pages are organized by feature: `/dashboard`, `/scanner/[locationId]`, `/photo/[locationId]`, `/quiz/[locationId]`
- Layout configured as PWA with dark theme and custom branding

### Key Features
1. **Registration System**: Multi-step registration with signup codes and phone verification
2. **QR Code Scanning**: Real camera integration using `qr-scanner` library with manual fallback
3. **Photo Capture**: Location-based selfie requirements 
4. **Quiz System**: Location-specific questions with attempt tracking
5. **Progress Tracking**: Player progress through multiple treasure hunt locations

### Database Schema (Supabase)
- `signup_codes`: Registration codes with usage tracking
- `players`: User registration and profile data
- `locations`: Treasure hunt locations with quiz data
- `player_progress`: Progress tracking per location per player

### State Management
- Uses localStorage for player session persistence
- Supabase client for real-time data operations
- No complex state management library - relies on React hooks and local storage

### Styling System
- **Theme**: Dark theme with custom gold (`#D4AF37`) and gray color palette
- **Components**: shadcn/ui component library with custom variants
- **Layout**: Mobile-first responsive design optimized for PWA usage
- **Custom Colors**: `primary`, `gold`, `onyx-gray`, `text-light`, `text-muted` defined in tailwind.config.ts

### Component Architecture
- **UI Components**: Located in `/components/ui/` - pure shadcn/ui components
- **Business Components**: Custom components like `Header.tsx` in `/components/`
- **Page Components**: Feature-specific pages in `/app/` directory
- **Utilities**: Helper functions in `/lib/utils.ts` and `/lib/supabase.ts`

## Key Dependencies

### Core Framework
- **Next.js 15**: App Router, TypeScript, React 19
- **Tailwind CSS**: Styling with custom theme configuration
- **@supabase/supabase-js**: Backend integration

### UI & User Experience  
- **shadcn/ui**: Complete UI component library (@radix-ui based)
- **lucide-react**: Icon library
- **qr-scanner**: QR code scanning with camera access
- **sonner**: Toast notifications
- **next-themes**: Theme management

### Forms & Validation
- **react-hook-form**: Form state management
- **zod**: Schema validation
- **@hookform/resolvers**: Form validation integration

## Development Guidelines

### File Organization
- Keep page components in `/app/` directory following Next.js App Router conventions
- Reusable UI components go in `/components/ui/`
- Business logic and API calls centralized in `/lib/supabase.ts`
- Utility functions in `/lib/utils.ts`

### Styling Conventions
- Use custom color palette defined in tailwind.config.ts
- Follow mobile-first responsive design principles
- Maintain consistent spacing and typography using Tailwind utilities
- Use custom color variables: `text-light`, `text-muted`, `gold`, `primary`, `onyx-gray`

### Component Patterns
- Use TypeScript interfaces for all props and data structures
- Implement proper error handling with user-friendly messages  
- Follow shadcn/ui component patterns for consistency
- Use React hooks for state management (useState, useEffect, useRef)

### API Integration
- All Supabase operations go through `/lib/supabase.ts` API layer
- Handle loading states and error conditions consistently
- Use localStorage for session persistence across app restarts
- Implement proper TypeScript interfaces for all database entities

## Environment Requirements
- Requires Supabase environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## PWA Configuration
- Configured as PWA with manifest.json
- Optimized for mobile installation
- Dark theme with Indonesian language support
- Custom app icons and branding for Supermal Karawaci treasure hunt theme