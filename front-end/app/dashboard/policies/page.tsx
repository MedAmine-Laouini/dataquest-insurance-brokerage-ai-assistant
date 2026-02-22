'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Loader2 } from 'lucide-react'
import { containerVariants, itemVariants } from '@/lib/animations'
import { apiFetch } from '@/lib/api'

interface BundlePolicy {
  id: number
  bundle_name: string
  description: string
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<BundlePolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/api/policies')
      .then(data => {
        setPolicies(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Coverage Bundles</h1>
            <p className="text-muted-foreground mt-1">All available insurance bundle policies and their descriptions.</p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-3 text-sm">Loading policies...</span>
          </div>
        ) : error ? (
          <div className="text-destructive py-16 text-center text-sm">Failed to load: {error}</div>
        ) : policies.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">No policies found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold w-16">ID</th>
                  <th className="px-6 py-4 font-semibold w-64">Bundle Name</th>
                  <th className="px-6 py-4 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {policies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-xs border border-primary/20">
                        {policy.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {policy.bundle_name.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground leading-relaxed">
                      {policy.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
