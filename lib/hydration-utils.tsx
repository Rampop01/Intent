'use client'

import { useEffect, useState } from 'react'

// Hook to check if component has hydrated
export function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false)

  useEffect(() => {
    setHasHydrated(true)
  }, [])

  return hasHydrated
}

// Component to wrap UI elements that might cause hydration issues
export function HydrationSafeWrapper({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const hasHydrated = useHasHydrated()

  if (!hasHydrated) {
    return <>{fallback}</>
  }

  return <>{children}</>
}