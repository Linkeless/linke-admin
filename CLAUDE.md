# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 admin dashboard application called "linke-admin" built with:
- React 19 + TypeScript
- Tailwind CSS v4 with shadcn/ui components
- App Router architecture
- ESLint with Next.js TypeScript configuration

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Architecture

### Directory Structure
- `app/` - Next.js App Router pages and layouts
  - `login/` - Authentication pages
  - `layout.tsx` - Root layout with Geist fonts
  - `globals.css` - Global Tailwind styles
- `components/` - React components
  - `ui/` - shadcn/ui base components (button, card, input, label)
  - `login-form.tsx` - Login form component
- `lib/` - Utilities and configurations
  - `utils.ts` - Contains `cn()` utility for Tailwind class merging
- `public/` - Static assets

### Key Configurations
- **Aliases**: `@/` points to project root, configured in both `tsconfig.json` and `components.json`
- **shadcn/ui**: New York style variant with neutral base color, CSS variables enabled
- **Tailwind**: v4 with PostCSS integration, styles in `app/globals.css`
- **TypeScript**: Strict mode enabled with Next.js plugin

### Component System
Uses shadcn/ui component library with Lucide React icons. Components follow the established pattern in `components/ui/` with proper TypeScript interfaces and Tailwind styling via the `cn()` utility function.