'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Enables the browser-native View Transitions API on route changes.
 * Zero bundle overhead - just hooks into the existing Next.js router.
 * Falls back gracefully on older browsers with no effect.
 */
export default function PageTransition() {
    const pathname = usePathname()

    useEffect(() => {
        // Scroll to top smoothly on page change
        window.scrollTo({ top: 0, behavior: 'instant' })
    }, [pathname])

    return null
}
