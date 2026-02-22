'use client'

import React from 'react'
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

const data = [
  { month: 'Jan', policies: 45, matches: 38 },
  { month: 'Feb', policies: 52, matches: 42 },
  { month: 'Mar', policies: 48, matches: 39 },
  { month: 'Apr', policies: 61, matches: 51 },
  { month: 'May', policies: 55, matches: 47 },
  { month: 'Jun', policies: 67, matches: 58 },
  { month: 'Jul', policies: 72, matches: 63 },
  { month: 'Aug', policies: 68, matches: 59 },
  { month: 'Sep', policies: 81, matches: 71 },
  { month: 'Oct', policies: 89, matches: 78 },
  { month: 'Nov', policies: 95, matches: 85 },
  { month: 'Dec', policies: 102, matches: 92 },
]

export function PerformanceChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="bg-card backdrop-blur-sm rounded-lg border border-border p-6 col-span-2"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Performance Trend</h3>
        <p className="text-sm text-muted-foreground mt-1">Policies and matches over time</p>
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
            dataKey="policies"
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
