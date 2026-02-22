'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type User = {
    id: number
    email: string
    role: 'admin' | 'broker'
    name: string
    is_active: boolean
}

type AuthContextType = {
    user: User | null
    token: string | null
    login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
    register: (email: string, name: string, password: string, role?: string) => Promise<{ ok: boolean; error?: string }>
    logout: () => void
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    login: async () => ({ ok: false }),
    register: async () => ({ ok: false }),
    logout: () => { },
    isLoading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Restore session from localStorage
        const storedToken = localStorage.getItem('marcos_token')
        const storedUser = localStorage.getItem('marcos_user')
        if (storedToken && storedUser) {
            setToken(storedToken)
            setUser(JSON.parse(storedUser))
        }
        setIsLoading(false)
    }, [])

    const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
        try {
            const res = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })
            if (!res.ok) {
                const data = await res.json()
                return { ok: false, error: data.detail || 'Login failed' }
            }
            const data = await res.json()
            setToken(data.access_token)
            setUser(data.user)
            localStorage.setItem('marcos_token', data.access_token)
            localStorage.setItem('marcos_user', JSON.stringify(data.user))
            router.push('/dashboard')
            return { ok: true }
        } catch {
            return { ok: false, error: 'Network error. Is the backend running?' }
        }
    }

    const register = async (email: string, name: string, password: string, role: string = 'broker'): Promise<{ ok: boolean; error?: string }> => {
        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name, password, role }),
            })
            if (!res.ok) {
                const data = await res.json()
                return { ok: false, error: data.detail || 'Registration failed' }
            }
            const data = await res.json()
            setToken(data.access_token)
            setUser(data.user)
            localStorage.setItem('marcos_token', data.access_token)
            localStorage.setItem('marcos_user', JSON.stringify(data.user))
            router.push('/dashboard')
            return { ok: true }
        } catch {
            return { ok: false, error: 'Network error. Is the backend running?' }
        }
    }

    const logout = () => {
        setUser(null)
        setToken(null)
        localStorage.removeItem('marcos_token')
        localStorage.removeItem('marcos_user')
        router.push('/')
    }

    // Route protection
    useEffect(() => {
        if (!isLoading) {
            const isAuthPage = pathname === '/login' || pathname === '/signup'
            const isDashboard = pathname?.startsWith('/dashboard')

            if (!user && isDashboard) {
                router.push('/login')
            } else if (user && isAuthPage) {
                router.push('/dashboard')
            }
        }
    }, [user, isLoading, pathname, router])

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
