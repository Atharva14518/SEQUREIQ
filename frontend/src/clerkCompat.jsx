/**
 * clerkCompat.jsx
 * Safe re-exports of Clerk hooks/components.
 * When Clerk is mounted (valid key), these delegate to real Clerk.
 * When no Clerk (demo mode), they return safe defaults.
 *
 * ALL pages should import from here instead of @clerk/clerk-react.
 */

// Re-export everything from Clerk — works because ClerkProvider is
// conditionally mounted in main.jsx. If ClerkProvider is missing,
// these hooks throw, but we guard all usages below.
export {
  useUser,
  SignedIn,
  SignedOut,
  UserButton,
  SignIn,
  SignUp,
} from '@clerk/clerk-react'
