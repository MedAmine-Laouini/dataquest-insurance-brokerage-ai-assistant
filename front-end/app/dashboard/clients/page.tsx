'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Loader2 } from 'lucide-react'
import { containerVariants, itemVariants } from '@/lib/animations'
import { apiFetch } from '@/lib/api'

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  useEffect(() => {
    setLoading(true)
    apiFetch(`/api/clients?skip=${page * PAGE_SIZE}&limit=${PAGE_SIZE}`)
      .then(data => {
        setClients(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [page])

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-foreground">Clients</h1>
        <p className="text-muted-foreground mt-2">Browse client records from the training dataset.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-3">Loading clients...</span>
          </div>
        ) : error ? (
          <div className="text-red-500 py-12 text-center">Failed to load: {error}</div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No clients found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold">User ID</th>
                    <th className="px-6 py-4 font-semibold">Region</th>
                    <th className="px-6 py-4 font-semibold">Employment</th>
                    <th className="px-6 py-4 font-semibold">Income</th>
                    <th className="px-6 py-4 font-semibold">Bundle</th>
                    <th className="px-6 py-4 font-semibold">Agency Type</th>
                    <th className="px-6 py-4 font-semibold">Cancelled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clients.map((client, idx) => (
                    <tr key={idx} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{client.user_id}</td>
                      <td className="px-6 py-4">{client.region_code || 'N/A'}</td>
                      <td className="px-6 py-4">{client.employment_status || 'N/A'}</td>
                      <td className="px-6 py-4">{client.estimated_annual_income ? `$${Number(client.estimated_annual_income).toLocaleString()}` : 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {client.purchased_coverage_bundle || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{client.broker_agency_type || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${client.policy_cancelled ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {client.policy_cancelled ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">Page {page + 1}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={clients.length < PAGE_SIZE}
                className="px-4 py-2 text-sm rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
