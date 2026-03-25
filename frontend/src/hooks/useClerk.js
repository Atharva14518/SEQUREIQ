/**
 * useOptionalClerk — safe hook that works with or without Clerk.
 * Returns { user, isLoaded } regardless of whether ClerkProvider is mounted.
 */
import { useState, useEffect } from 'react'

const HAS_CLERK = !!(
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.startsWith('pk_')
)
export { HAS_CLERK }
export const DEMO_USER_ID = 'demo-user'

// Hook: returns user info (null when no Clerk)
export function useOptionalUser() {
  // We can't conditionally call hooks, so when Clerk is present we
  // do a dynamic trick via a wrapper component. For simplicity just
  // expose the value after a mount effect.
  const [state, setState] = useState({ user: null, isLoaded: !HAS_CLERK })

  useEffect(() => {
    if (!HAS_CLERK) return
    // Dynamically read from window if ClerkProvider populated it
    const check = () => {
      const clerk = window.Clerk
      if (clerk) {
        setState({ user: clerk.user || null, isLoaded: true })
      }
    }
    check()
    const interval = setInterval(check, 500)
    return () => clearInterval(interval)
  }, [])

  return state
}
