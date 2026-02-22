'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Upload } from 'lucide-react'
import { CustomerProfile, PredictionResult, predictBundle } from '@/lib/classification-data'
import { CustomerInputForm } from '@/components/classification/customer-input-form'
import { PredictionResultPanel } from '@/components/classification/prediction-result-panel'
import { BatchUploadPanel } from '@/components/classification/batch-upload-panel'

type Mode = 'single' | 'batch'

export default function AIClassificationPage() {
  const [mode, setMode] = useState<Mode>('single')
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (customer: CustomerProfile) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 900))
    setResult(predictBundle(customer))
    setIsLoading(false)
  }

  const handleModeChange = (m: Mode) => {
    setMode(m)
    if (m === 'single') {
      setResult(null)
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col gap-6"
    >
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
              Multi-Class · 10 Bundles
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mt-2">AI Bundle Classification</h1>
          <p className="text-muted-foreground mt-1">
            Predict which of the 10 coverage bundles (0–9) a prospective customer will purchase, based on their demographic and behavioural profile.
          </p>
        </div>

        {/* Mode switcher */}
        <div className="flex items-center gap-1 bg-muted/50 border border-border rounded-xl p-1 self-start sm:self-end flex-shrink-0">
          <button
            onClick={() => handleModeChange('single')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'single'
                ? 'bg-card border border-border text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Single Customer
          </button>
          <button
            onClick={() => handleModeChange('batch')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'batch'
                ? 'bg-card border border-border text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload CSV
          </button>
        </div>
      </div>

      {/* Content area */}
      <AnimatePresence mode="wait">
        {mode === 'single' ? (
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-8 flex-1 min-h-0"
          >
            {/* Left – Customer input (40%) */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 overflow-hidden flex flex-col">
              <CustomerInputForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>

            {/* Right – Prediction output (60%) */}
            <div className="lg:col-span-3 bg-card border border-border rounded-xl p-6 overflow-hidden flex flex-col">
              <div className="mb-5 flex-shrink-0">
                <h2 className="text-base font-semibold text-foreground">Prediction Output</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Predicted bundle with class probabilities and model confidence</p>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <PredictionResultPanel result={result} isLoading={isLoading} />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="batch"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex-1 min-h-0"
          >
            <BatchUploadPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
