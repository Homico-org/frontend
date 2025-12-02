# Homi Frontend

Next.js-based frontend for the Homi marketplace platform.

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- Axios (HTTP Client)
- React Hook Form

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/          # React components
│   ├── common/         # Shared components
│   ├── auth/           # Authentication components
│   ├── client/         # Client-specific components
│   └── pro/            # Pro-specific components
├── lib/                # Utilities and helpers
│   └── api.ts          # Axios configuration
├── store/              # Zustand stores
│   └── authStore.ts    # Authentication state
├── types/              # TypeScript types
│   └── index.ts        # Shared types
└── styles/             # CSS files
    └── globals.css     # Global styles
```

## Available Components

### Common Components
- `SearchBar` - Search input with submit
- `CategoryCard` - Category display card
- `ProCard` - Professional profile card

### Utilities
- `api.ts` - Configured axios instance with auth interceptors
- `authStore.ts` - Authentication state management

## Design System

### Colors
- Primary: `#ff6b47` (coral/peach)
- Neutral grays for text and backgrounds

### Component Classes
- `.btn` - Base button styles
- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.btn-outline` - Outlined button
- `.card` - Card container
- `.input` - Form input
- `.container-custom` - Page container

## Pages to Implement

- `/login` - User login
- `/register` - User registration
- `/search` - Search results
- `/pro/[id]` - Pro profile detail
- `/dashboard/client` - Client dashboard
- `/dashboard/pro` - Pro dashboard
- `/projects/new` - Create project request
- `/chat` - Messaging interface
- `/settings` - User settings

## Building for Production

```bash
npm run build
npm run start
```

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3001)
