'use client'

import React, { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { apiFetch } from '@/lib/api'

export function ClientDistribution() {
  const [data, setData] = useState<{ status: string; value: number }[]>([])

  useEffect(() => {
    apiFetch('/api/dashboard/stats')
      .then(stats => {
        const regionData = Object.entries(stats.region_distribution || {})
          .map(([status, value]) => ({ status, value: value as number }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10)
        setData(regionData)
      })
      .catch(() => {})
  }, [])
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className="bg-card backdrop-blur-sm rounded-lg border border-border p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Client Regions</h3>
        <p className="text-sm text-muted-foreground mt-1">Distribution by region code</p>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="status"
            stroke="var(--border)"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          />
          <YAxis
            stroke="var(--border)"
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
            }}
            labelStyle={{ color: 'var(--foreground)' }}
            itemStyle={{ color: 'var(--foreground)' }}
          />
          <Bar dataKey="value" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
