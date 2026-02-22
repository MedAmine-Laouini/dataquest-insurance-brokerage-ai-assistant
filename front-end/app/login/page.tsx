'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Lock, Mail, ArrowRight } from 'lucide-react'
import { useAuth } from '@/components/auth-provider'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isHovered, setIsHovered] = useState(false)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const { login } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (email && password) {
            setError('')
            setSubmitting(true)
            const result = await login(email, password)
            if (!result.ok) {
                setError(result.error || 'Login failed')
            }
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md p-8 relative z-10"
            >
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-sm">AI</span>
                        </div>
                        <span className="font-semibold text-foreground text-xl">Marcos AI</span>
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground mb-3">Welcome back</h1>
                    <p className="text-muted-foreground">Sign in to your broker account</p>
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground border border-border">
                        <p><strong>Default accounts:</strong></p>
                        <p className="mt-1">Admin: <span className="text-primary">admin@marcos.ai</span> / <span className="text-primary">admin123</span></p>
                        <p>Broker: <span className="text-primary">broker@marcos.ai</span> / <span className="text-primary">broker123</span></p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-500">
                                {error}
                            </div>
                        )}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground block">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-foreground block">Password</label>
                                <Link href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            className="w-full relative group overflow-hidden rounded-lg bg-primary text-primary-foreground py-3 px-4 font-medium disabled:opacity-50"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {submitting ? 'Signing in...' : 'Sign In'}
                                <motion.span
                                    animate={{ x: isHovered ? 4 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ArrowRight className="w-4 h-4" />
                                </motion.span>
                            </span>
                            <div className="absolute inset-0 h-full w-full scale-0 rounded-lg transition-all duration-300 group-hover:scale-100 group-hover:bg-primary/90/50 z-0" />
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-muted-foreground">
                        Don't have an account?{' '}
                        <Link href="/signup" className="font-medium text-primary hover:text-primary/80 transition-colors">
                            Request access
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
