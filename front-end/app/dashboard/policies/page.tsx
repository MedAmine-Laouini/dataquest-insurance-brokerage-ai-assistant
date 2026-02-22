'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Loader2 } from 'lucide-react'
import { containerVariants, itemVariants } from '@/lib/animations'
import { apiFetch } from '@/lib/api'

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([])
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
        <h1 className="text-3xl font-bold text-foreground">Policies</h1>
        <p className="text-muted-foreground mt-2">View and manage all active policies and their details.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-3">Loading policies...</span>
          </div>
        ) : error ? (
          <div className="text-red-500 py-12 text-center">Failed to load: {error}</div>
        ) : policies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No policies found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">Policy ID</th>
                  <th className="px-6 py-4 font-semibold">Name</th>
                  <th className="px-6 py-4 font-semibold">Category</th>
                  <th className="px-6 py-4 font-semibold">Target Customer</th>
                  <th className="px-6 py-4 font-semibold">Base Premium (TND)</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {policies.map((policy, idx) => (
                  <tr key={idx} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">{policy.policy_id}</td>
                    <td className="px-6 py-4 font-medium text-foreground truncate max-w-[200px]" title={policy.policy_name}>
                      {policy.policy_name}
                    </td>
                    <td className="px-6 py-4">{policy.policy_category}</td>
                    <td className="px-6 py-4">{policy.target_customer}</td>
                    <td className="px-6 py-4 font-medium">{policy.base_premium_tnd} TND</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${policy.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted/30 text-muted-foreground'
                        }`}>
                        {policy.is_active ? 'Active' : 'Inactive'}
                      </span>
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
