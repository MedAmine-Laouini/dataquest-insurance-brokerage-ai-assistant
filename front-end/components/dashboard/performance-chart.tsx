'use client'

import React, { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { apiFetch } from '@/lib/api'

const MONTH_ORDER = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function PerformanceChart() {
  const [data, setData] = useState<{ month: string; clients: number }[]>([])

  useEffect(() => {
    apiFetch('/api/dashboard/stats')
      .then(stats => {
        const monthlyData = MONTH_ORDER
          .filter(m => stats.monthly_distribution?.[m] !== undefined)
          .map(m => ({
            month: m.slice(0, 3),
            clients: stats.monthly_distribution[m] as number,
          }))
        setData(monthlyData)
      })
      .catch(() => {})
  }, [])
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-card backdrop-blur-sm rounded-lg border border-border p-6 col-span-2"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Clients by Month</h3>
        <p className="text-sm text-muted-foreground mt-1">Policy start month distribution</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="month"
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
          <Line
            type="monotone"
            dataKey="clients"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
          />
          <Line
            type="monotone"
            dataKey="matches"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
