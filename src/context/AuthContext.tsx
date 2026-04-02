'use client'
import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
    user: any
    userRole: string | null
    profile: any | null
    loading: boolean
    showAuthModal: boolean
    setShowAuthModal: (show: boolean) => void
    showVerificationModal: boolean
    setShowVerificationModal: (show: boolean) => void
    requireAuth: (callback: () => void) => void
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null)
    const [userRole, setUserRole] = useState<string | null>(null)
    const [profile, setProfile] = useState<any | null>(null)
    const [loading, setLoading] = useState(true)
    const [isMounted, setIsMounted] = useState(false)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [showVerificationModal, setShowVerificationModal] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const fetchProfile = React.useCallback(async (u: any = user) => {
        if (!u) {
            setUserRole(null)
            setProfile(null)
            return
        }
        try {
            const res = await fetch('/api/auth/me')
            if (res.ok) {
                const data = await res.json()
                setUserRole(data.role)
                setProfile(data)
            }
        } catch (e) {
            console.error('Fetch role error:', e)
        }
    }, [user])

    useEffect(() => {
        if (!isMounted) return

        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const currentUser = session?.user ?? null

            setUser((prev: any) => {
                if (prev?.id === currentUser?.id) return prev
                return currentUser
            })

            if (currentUser) {
                await fetchProfile(currentUser)
            }
            setLoading(false)
        }

        getSession()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            const currentUser = session?.user ?? null

            if (event === 'SIGNED_IN' && currentUser) {
                // Silently log login IP and device metadata
                fetch('/api/auth/log', { method: 'POST' }).catch(e => console.error('Auth log fail:', e))
            }

            setUser((prev: any) => {
                if (prev?.id === currentUser?.id) return prev
                return currentUser
            })

            if (currentUser) {
                await fetchProfile(currentUser)
            } else {
                setUserRole(null)
                setProfile(null)
            }
        })

        return () => subscription.unsubscribe()
    }, [isMounted])

    // Helper to check auth before performing an action
    const requireAuth = React.useCallback((callback: () => void) => {
        if (loading) return
        if (!user) {
            setShowAuthModal(true)
            return
        }
        callback()
    }, [user, loading])

    return (
        <AuthContext.Provider value={{
            user,
            userRole,
            profile,
            loading,
            showAuthModal,
            setShowAuthModal,
            showVerificationModal,
            setShowVerificationModal,
            requireAuth,
            refreshProfile: fetchProfile
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
