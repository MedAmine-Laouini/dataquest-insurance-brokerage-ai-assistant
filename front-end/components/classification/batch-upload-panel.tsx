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
import { getApiUrl, getAuthHeaders } from '@/lib/api'
import { PredictionResultPanel } from './prediction-result-panel'

// ─── Batch row (prediction result per CSV row) ────────────────────────────────

interface BatchRow {
  rowIndex: number
  userId: string
  result: PredictionResult
}

// ─── Upload helper (multipart, with auth token) ───────────────────────────────

async function uploadCSV(file: File): Promise<BatchRow[]> {
  const fd = new FormData()
  fd.append('file', file)
  const headers = { ...getAuthHeaders() }
  // Remove Content-Type so the browser sets the correct multipart boundary
  delete (headers as Record<string, string>)['Content-Type']

  const res = await fetch(getApiUrl('/api/classify/batch'), {
    method: 'POST',
    headers,
    body: fd,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as any).detail || `Server error ${res.status}`)
  }
  const data: { count: number; results: Array<{
    user_id: string; predicted_bundle: number; bundle_name: string
    confidence: number; class_probabilities: number[]
  }> } = await res.json()
  return data.results.map((r, i) => ({
    rowIndex: i + 1,
    userId:   r.user_id,
    result: {
      predictedBundle:    r.predicted_bundle,
      confidence:         r.confidence,
      classProbabilities: r.class_probabilities,
      bundleInfo:         BUNDLE_INFO[r.predicted_bundle] ?? BUNDLE_INFO[0],
      source:             'api' as const,
    },
  }))
}

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

// ─── Summary stats helper ────────────────────────────────────────────────────

function computeStats(rows: BatchRow[]) {
  if (!rows.length) return { avgConf: 0, topBundle: BUNDLE_INFO[0] }
  const avgConf = Math.round(rows.reduce((a, b) => a + b.result.confidence, 0) / rows.length)
  const dist = rows.reduce<Record<number, number>>((acc, r) => {
    acc[r.result.predictedBundle] = (acc[r.result.predictedBundle] ?? 0) + 1
    return acc
  }, {})
  const topBundle = BUNDLE_INFO[Number(Object.entries(dist).sort((a, b) => b[1] - a[1])[0][0])]
  return { avgConf, topBundle }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BatchUploadPanel() {
  const [fileState, setFileState] = useState<'idle' | 'ready' | 'running' | 'processed'>('idle')
  const [fileName, setFileName] = useState('')
  const [fileObj, setFileObj] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [batchRows, setBatchRows] = useState<BatchRow[]>([])
  const [selectedRow, setSelectedRow] = useState<BatchRow | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFilePick = (file: File | undefined) => {
    if (!file) return
    setFileName(file.name)
    setFileObj(file)
    setFileState('ready')
    setSelectedRow(null)
    setRunError(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFilePick(e.dataTransfer.files[0])
  }

  const handleRunBatch = async () => {
    if (!fileObj) return
    setFileState('running')
    setRunError(null)
    try {
      const rows = await uploadCSV(fileObj)
      setBatchRows(rows)
      setFileState('processed')
      setSelectedRow(rows[0] ?? null)
    } catch (err: any) {
      setRunError(err?.message ?? 'Batch prediction failed')
      setFileState('ready')
    }
  }

  const handleClear = () => {
    setFileState('idle')
    setFileName('')
    setFileObj(null)
    setBatchRows([])
    setSelectedRow(null)
    setRunError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── IDLE / READY / RUNNING: upload zone ────────────────────────────────────
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
              <p className="text-xs text-muted-foreground mt-1">File ready — click “Run Batch” to send through the ML pipeline</p>
            </div>
          ) : fileState === 'running' ? (
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Running ML pipeline…</p>
              <p className="text-xs text-muted-foreground mt-1">Sending data to the classifier, please wait</p>
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
            {['User_ID','Estimated_Annual_Income','Adult_Dependents','Child_Dependents','Infant_Dependents',
            'Previous_Policy_Duration_Months','Days_Since_Quote','Grace_Period_Extensions','Custom_Riders_Requested',
            'Vehicles_on_Policy','Policy_Amendments_Count','Previous_Claims_Filed','Years_Without_Claims',
            'Underwriting_Processing_Days','Region_Code','Broker_Agency_Type','Deductible_Tier',
            'Acquisition_Channel','Payment_Schedule','Employment_Status','Policy_Start_Month',
            'Broker_ID','Employer_ID'].map(col => (
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
            disabled={fileState === 'running' as any}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
          >
            <Brain className="w-4 h-4" />
            Run Batch Classification
          </motion.button>
        )}

        {runError && (
          <div className="w-full max-w-xl flex items-start gap-2.5 bg-destructive/10 border border-destructive/30 rounded-lg px-3.5 py-2.5 text-sm">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <span className="text-destructive">{runError}</span>
          </div>
        )}
      </motion.div>
    )
  }

  const { avgConf, topBundle } = computeStats(batchRows)

  // ── PROCESSED: master-detail ───────────────────────────────────────
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
            <p className="text-xs text-muted-foreground">{batchRows.length} rows processed · batch complete</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Summary pills */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium text-foreground">{batchRows.length}</span> customers
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
              <span className="text-xs text-muted-foreground bg-muted/50 rounded-full px-2 py-0.5">{batchRows.length} rows</span>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {batchRows.map((row) => {
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
                      <p className="text-sm font-medium text-foreground truncate font-mono">{row.userId}</p>
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
                  <span>{selectedRow.userId} · Row #{selectedRow.rowIndex}</span>
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
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'User ID',    value: selectedRow.userId },
                      { label: 'Bundle',     value: selectedRow.result.bundleInfo.name },
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
