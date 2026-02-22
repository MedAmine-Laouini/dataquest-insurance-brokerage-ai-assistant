'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileSpreadsheet,
  X,
  ChevronRight,
  CheckCircle2,
  Brain,
  BarChart3,
  Users,
  Target,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { BUNDLE_INFO, PredictionResult } from '@/lib/classification-data'
import { PredictionResultPanel } from './prediction-result-panel'

// ─── Dummy batch results ───────────────────────────────────────────────────────

interface BatchRow {
  rowIndex: number
  userId: string
  name: string
  age: number
  region: string
  income: number
  employment: string
  result: PredictionResult
}

const makeDummy = (
  rowIndex: number,
  userId: string,
  name: string,
  age: number,
  region: string,
  income: number,
  employment: string,
  bundleId: number,
  confidence: number
): BatchRow => {
  const probs = Array(10).fill(0) as number[]
  probs[bundleId] = confidence
  let remaining = 100 - confidence
  const others = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter((i) => i !== bundleId)
  others.forEach((i, idx) => {
    const share = idx === others.length - 1 ? remaining : Math.floor(remaining / (others.length - idx))
    probs[i] = share
    remaining -= share
  })

  return {
    rowIndex,
    userId,
    name,
    age,
    region,
    income,
    employment,
    result: {
      predictedBundle: bundleId,
      confidence,
      classProbabilities: probs,
      bundleInfo: BUNDLE_INFO[bundleId],
    },
  }
}

const DUMMY_BATCH: BatchRow[] = [
  makeDummy(1,  'USR_001', 'Alex Rivera',      28, 'West',  48000,  'Employed',      1, 72),
  makeDummy(2,  'USR_002', 'Sarah Chen',        38, 'East',  112000, 'Employed',      5, 84),
  makeDummy(3,  'USR_003', 'Marcus Johnson',    52, 'South', 240000, 'Self-Employed', 7, 91),
  makeDummy(4,  'USR_004', 'Priya Patel',       44, 'North', 78000,  'Employed',      3, 67),
  makeDummy(5,  'USR_005', 'Elena Rodriguez',   31, 'East',  62000,  'Employed',      2, 78),
  makeDummy(6,  'USR_006', 'James O\'Brien',    59, 'South', 185000, 'Retired',       7, 88),
  makeDummy(7,  'USR_007', 'Yuki Tanaka',       26, 'West',  41000,  'Employed',      0, 65),
  makeDummy(8,  'USR_008', 'Fatima Al-Rashidi', 47, 'North', 98000,  'Self-Employed', 6, 76),
  makeDummy(9,  'USR_009', 'Daniel Park',       35, 'East',  130000, 'Employed',      5, 82),
  makeDummy(10, 'USR_010', 'Amara Osei',        41, 'South', 67000,  'Employed',      4, 71),
  makeDummy(11, 'USR_011', 'Lucas Ferreira',    29, 'West',  55000,  'Employed',      1, 69),
  makeDummy(12, 'USR_012', 'Isabelle Dupont',   63, 'North', 320000, 'Retired',       9, 79),
]

// ─── Tier badge helper ─────────────────────────────────────────────────────────

const TIER_STYLE: Record<string, string> = {
  Basic:      'bg-slate-500/10 text-slate-400 border-slate-500/20',
  Standard:   'bg-blue-500/10  text-blue-400  border-blue-500/20',
  Premium:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Enterprise: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

const CONF_BAR = (c: number) =>
  c >= 80 ? 'bg-emerald-500' : c >= 65 ? 'bg-amber-500' : 'bg-rose-500'

const CONF_TEXT = (c: number) =>
  c >= 80 ? 'text-emerald-500' : c >= 65 ? 'text-amber-500' : 'text-rose-500'

// ─── Summary stats ─────────────────────────────────────────────────────────────

const avgConf = Math.round(DUMMY_BATCH.reduce((a, b) => a + b.result.confidence, 0) / DUMMY_BATCH.length)
const bundleDist = DUMMY_BATCH.reduce<Record<number, number>>((acc, r) => {
  acc[r.result.predictedBundle] = (acc[r.result.predictedBundle] ?? 0) + 1
  return acc
}, {})
const topBundle = BUNDLE_INFO[Number(Object.entries(bundleDist).sort((a, b) => b[1] - a[1])[0][0])]

// ─── Component ─────────────────────────────────────────────────────────────────

export function BatchUploadPanel() {
  const [fileState, setFileState] = useState<'idle' | 'ready' | 'processed'>('idle')
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [selectedRow, setSelectedRow] = useState<BatchRow | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFilePick = (file: File | undefined) => {
    if (!file) return
    setFileName(file.name)
    setFileState('ready')
    setSelectedRow(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFilePick(e.dataTransfer.files[0])
  }

  const handleRunBatch = () => {
    setFileState('processed')
    setSelectedRow(DUMMY_BATCH[0])
  }

  const handleClear = () => {
    setFileState('idle')
    setFileName('')
    setSelectedRow(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── IDLE / READY: upload zone ────────────────────────────────────────────────
  if (fileState !== 'processed') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col items-center justify-center gap-8 py-12"
      >
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative w-full max-w-xl border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-5 cursor-pointer transition-all duration-200 select-none
            ${isDragging
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : fileState === 'ready'
                ? 'border-emerald-500/60 bg-emerald-500/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFilePick(e.target.files?.[0])}
          />

          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all
            ${fileState === 'ready' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
            {fileState === 'ready'
              ? <CheckCircle2 className="w-8 h-8" />
              : <Upload className="w-8 h-8" />
            }
          </div>

          {fileState === 'ready' ? (
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2 justify-center">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                {fileName}
              </p>
              <p className="text-xs text-muted-foreground mt-1">File ready — click "Run Batch" to process predictions</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Drop your CSV file here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse · Accepts <span className="font-mono">.csv</span> files up to 50 MB</p>
            </div>
          )}

          {fileState === 'ready' && (
            <button
              onClick={(e) => { e.stopPropagation(); handleClear() }}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Expected columns hint */}
        <div className="w-full max-w-xl bg-muted/40 border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Expected CSV columns</p>
          <div className="flex flex-wrap gap-2">
            {['User_ID','Age','Gender','Marital_Status','Annual_Income','Employment_Status','Num_Dependents','Education_Level','Property_Ownership','Vehicle_Type','Prior_Claims','Region'].map(col => (
              <span key={col} className="font-mono text-xs bg-card border border-border rounded px-2 py-1 text-foreground/70">{col}</span>
            ))}
          </div>
        </div>

        {/* Action button */}
        {fileState === 'ready' && (
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleRunBatch}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
          >
            <Brain className="w-4 h-4" />
            Run Batch Classification
          </motion.button>
        )}
      </motion.div>
    )
  }

  // ── PROCESSED: master-detail ─────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-6 h-full"
    >
      {/* Top bar: file info + summary stats + reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border rounded-xl px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{fileName}</p>
            <p className="text-xs text-muted-foreground">{DUMMY_BATCH.length} rows processed · batch complete</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Summary pills */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium text-foreground">{DUMMY_BATCH.length}</span> customers
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className={`font-medium ${CONF_TEXT(avgConf)}`}>{avgConf}%</span> avg conf.
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Target className="w-3.5 h-3.5" />
              <span className="font-medium text-foreground">{topBundle.name}</span> top bundle
            </div>
          </div>

          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-3 py-1.5 hover:bg-muted/50"
          >
            <Upload className="w-3 h-3" /> New upload
          </button>
        </div>
      </div>

      {/* Master / Detail split */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 min-h-0">

        {/* ── MASTER list (2/5) ── */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Batch Results</h3>
              <span className="text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">{DUMMY_BATCH.length} rows</span>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {DUMMY_BATCH.map((row) => {
              const isSelected = selectedRow?.rowIndex === row.rowIndex
              return (
                <button
                  key={row.rowIndex}
                  onClick={() => setSelectedRow(row)}
                  className={`w-full text-left px-4 py-3.5 border-b border-border/60 transition-all flex items-start gap-3 last:border-0
                    ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/30'}`}
                >
                  {/* Row number */}
                  <span className="text-xs text-muted-foreground font-mono w-6 mt-0.5 flex-shrink-0">#{row.rowIndex}</span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{row.name}</p>
                      <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${TIER_STYLE[row.result.bundleInfo.tier]}`}>
                        {row.result.bundleInfo.tier}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mb-2">
                      Bundle {row.result.predictedBundle} · {row.result.bundleInfo.name}
                    </p>

                    {/* Confidence bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${CONF_BAR(row.result.confidence)}`}
                          style={{ width: `${row.result.confidence}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${CONF_TEXT(row.result.confidence)}`}>
                        {row.result.confidence}%
                      </span>
                    </div>
                  </div>

                  {isSelected && <ChevronRight className="w-4 h-4 text-primary flex-shrink-0 mt-1" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── DETAIL panel (3/5) ── */}
        <div className="lg:col-span-3 bg-card border border-border rounded-xl flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-border flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Prediction Detail</h3>
              {selectedRow && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>{selectedRow.name} · Row #{selectedRow.rowIndex}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <AnimatePresence mode="wait">
              {selectedRow ? (
                <motion.div
                  key={selectedRow.rowIndex}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                  className="h-full flex flex-col gap-5"
                >
                  {/* Customer metadata strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'User ID',    value: selectedRow.userId },
                      { label: 'Age',        value: String(selectedRow.age) },
                      { label: 'Region',     value: selectedRow.region },
                      { label: 'Income',     value: `$${selectedRow.income.toLocaleString()}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted/30 border border-border/60 rounded-lg px-3 py-2.5">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Reuse single-prediction result panel */}
                  <div className="flex-1 min-h-0">
                    <PredictionResultPanel result={selectedRow.result} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full gap-3 text-center"
                >
                  <AlertCircle className="w-10 h-10 text-muted-foreground/25" />
                  <p className="text-sm text-muted-foreground">Select a row on the left to view its prediction detail</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
