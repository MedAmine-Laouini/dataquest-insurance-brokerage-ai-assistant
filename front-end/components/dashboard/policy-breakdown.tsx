'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { apiFetch } from '@/lib/api'

const COLORS = ['var(--chart-1)', 'var(--chart-2)', '#10b981', '#f59e0b']

export function PolicyBreakdown() {
  const [data, setData] = useState<{ name: string; value: number }[]>([])

  useEffect(() => {
    apiFetch('/api/dashboard/stats')
      .then(stats => {
        const bundleData = Object.entries(stats.bundle_distribution || {})
          .map(([name, value]) => ({ name, value: value as number }))
          .sort((a, b) => b.value - a.value)
        setData(bundleData)
      })
      .catch(() => {})
  }, [])
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="bg-card backdrop-blur-sm rounded-lg border border-border p-6"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Bundle Distribution</h3>
        <p className="text-sm text-muted-foreground mt-1">Coverage bundle breakdown</p>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
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
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span style={{ color: 'var(--foreground)', fontSize: '12px' }}>{value}</span>
            )}
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
