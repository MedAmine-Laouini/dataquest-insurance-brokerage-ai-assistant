'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, RefreshCw, TrendingUp } from 'lucide-react'
import { fetchGlobalExplanation, GlobalExplanation } from '@/lib/classification-data'

const IMPORTANCE_TABS = [
  { key: 'composite_score', label: 'Composite', color: 'bg-primary' },
  { key: 'gain',   label: 'Gain',   color: 'bg-violet-500' },
  { key: 'cover',  label: 'Cover',  color: 'bg-amber-500'  },
  { key: 'weight', label: 'Weight', color: 'bg-cyan-500'   },
] as const

type MetricKey = (typeof IMPORTANCE_TABS)[number]['key']

/**
 * GlobalFeatureImportance
 * -----------------------
 * Fetches and renders global XGBoost feature importances from the backend.
 * Shows three importance metrics (gain, cover, weight) plus a composite.
 * Includes a refresh button for live updates.
 */
export function GlobalFeatureImportance() {
  const [data, setData]     = useState<GlobalExplanation | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState<MetricKey>('composite_score')
  const [showTop, setShowTop] = useState(10)

  const load = async () => {
    setLoading(true)
    const result = await fetchGlobalExplanation()
    setData(result)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const features  = data?.features ?? []
  const displayed = [...features]
    .sort((a, b) => (b[tab] as number) - (a[tab] as number))
    .slice(0, showTop)
  const maxScore  = Math.max(...displayed.map((f) => f[tab] as number), 1)

  const currentTab = IMPORTANCE_TABS.find((t) => t.key === tab)!

  return (
    <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Global Feature Importance</h3>
          {data && (
            <span className="text-xs text-muted-foreground bg-muted/50 border border-border px-2 py-0.5 rounded-full">
              {data.source === 'mock' ? 'Demo data' : 'Live model'}
            </span>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Metric tabs */}
      <div className="flex gap-2">
        {IMPORTANCE_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
              tab === t.key
                ? 'bg-primary/10 border border-primary/30 text-primary'
                : 'bg-muted/30 border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Bars */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-36 h-3 bg-muted/40 rounded animate-pulse" />
              <div className="flex-1 h-4 bg-muted/40 rounded animate-pulse" style={{ width: `${80 - i * 7}%` }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {displayed.map((f, idx) => {
            const score = f[tab] as number
            const pct   = (score / maxScore) * 100
            return (
              <motion.div
                key={f.feature}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center gap-2 group"
              >
                <span className="w-44 text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate text-right flex-shrink-0">
                  {f.feature.replace(/_/g, ' ')}
                </span>
                <div className="flex-1 h-4 bg-muted/20 rounded-sm overflow-hidden">
                  <motion.div
                    className={`h-full rounded-sm ${currentTab.color} opacity-75`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.4, ease: 'easeOut', delay: idx * 0.03 }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground w-10 text-right flex-shrink-0">
                  {score.toFixed(1)}
                </span>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Show more / less */}
      {features.length > 10 && (
        <button
          onClick={() => setShowTop((n) => (n === 10 ? features.length : 10))}
          className="text-xs text-primary hover:underline self-center mt-1 flex items-center gap-1"
        >
          <TrendingUp className="w-3 h-3" />
          {showTop === 10 ? `Show all ${features.length} features` : 'Show fewer'}
        </button>
      )}

      {/* Source note */}
      <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
        <strong>Gain</strong>: average loss reduction when feature is used for splitting. &nbsp;
        <strong>Cover</strong>: average number of samples affected. &nbsp;
        <strong>Weight</strong>: number of times feature appears in trees.
      </p>
    </div>
  )
}