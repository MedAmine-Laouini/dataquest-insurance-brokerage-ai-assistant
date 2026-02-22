'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Loader2 } from 'lucide-react'
import { containerVariants, itemVariants } from '@/lib/animations'
import { apiFetch } from '@/lib/api'

export default function InsuranceCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch('/api/insurance-companies')
      .then(data => {
        setCompanies(data)
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
        <h1 className="text-3xl font-bold text-foreground">Insurance Companies</h1>
        <p className="text-muted-foreground mt-2">Manage your insurance company partnerships and availability.</p>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-3">Loading companies...</span>
          </div>
        ) : error ? (
          <div className="text-red-500 py-12 text-center">Failed to load: {error}</div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No companies found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-semibold">ID</th>
                  <th className="px-6 py-4 font-semibold">Company Name</th>
                  <th className="px-6 py-4 font-semibold">HQ Location</th>
                  <th className="px-6 py-4 font-semibold">Specialization</th>
                  <th className="px-6 py-4 font-semibold">Claim Approval Rate</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {companies.map((company, idx) => (
                  <tr key={idx} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">{company.company_id}</td>
                    <td className="px-6 py-4 font-medium text-foreground">{company.company_name}</td>
                    <td className="px-6 py-4">{company.headquarters_location}</td>
                    <td className="px-6 py-4">{company.primary_specialization}</td>
                    <td className="px-6 py-4 text-emerald-500 font-medium">{(company.claim_approval_rate * 100).toFixed(1)}%</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${company.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted/30 text-muted-foreground'
                        }`}>
                        {company.is_active ? 'Active' : 'Inactive'}
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
