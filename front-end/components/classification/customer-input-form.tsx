'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, AlertCircle } from 'lucide-react'
import { BUNDLE_INFO, PredictionResult } from '@/lib/classification-data'
import { apiFetch } from '@/lib/api'

// --- Form State ---

interface MLForm {
  estimated_annual_income:          string
  adult_dependents:                 string
  child_dependents:                 string
  infant_dependents:                string
  previous_policy_duration_months:  string
  days_since_quote:                 string
  grace_period_extensions:          string
  custom_riders_requested:          string
  vehicles_on_policy:               string
  policy_amendments_count:          string
  previous_claims_filed:            string
  years_without_claims:             string
  underwriting_processing_days:     string
  region_code:                      string
  broker_agency_type:               string
  deductible_tier:                  string
  acquisition_channel:              string
  payment_schedule:                 string
  employment_status:                string
  policy_start_month:               string
  broker_id:                        string
  employer_id:                      string
}

const DEFAULT: MLForm = {
  estimated_annual_income:          '60000',
  adult_dependents:                 '1',
  child_dependents:                 '',
  infant_dependents:                '0',
  previous_policy_duration_months:  '12',
  days_since_quote:                 '30',
  grace_period_extensions:          '0',
  custom_riders_requested:          '0',
  vehicles_on_policy:               '1',
  policy_amendments_count:          '0',
  previous_claims_filed:            '0',
  years_without_claims:             '2',
  underwriting_processing_days:     '5',
  region_code:                      'R01',
  broker_agency_type:               'Independent',
  deductible_tier:                  'Tier_2',
  acquisition_channel:              'Online',
  payment_schedule:                 'Monthly',
  employment_status:                'Employed',
  policy_start_month:               'January',
  broker_id:                        '',
  employer_id:                      '100',
}

interface CustomerInputFormProps {
  onResult: (result: PredictionResult) => void
}

const SEL = 'w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground focus:border-primary outline-none transition-colors text-sm'
const INP = 'w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground placeholder-muted-foreground/40 focus:border-primary outline-none transition-colors text-sm'

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-primary/60 px-0.5">{label}</p>
      <div className="bg-muted/20 border border-border/60 rounded-xl p-3 space-y-2.5">{children}</div>
    </div>
  )
}

function Row({ cols = 2, children }: { cols?: 2 | 3; children: React.ReactNode }) {
  return <div className={`grid gap-2 ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>{children}</div>
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground mb-1">
        {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

export function CustomerInputForm({ onResult }: CustomerInputFormProps) {
  const [form, setForm] = useState<MLForm>(DEFAULT)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof MLForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const n = (v: string, def = 0) => (v === '' ? def : Number(v))
  const nullable = (v: string) => (v === '' ? null : Number(v))

  const handleSubmit = async () => {
    if (!form.estimated_annual_income) return
    setIsLoading(true)
    setError(null)
    try {
      const body = {
        estimated_annual_income:          n(form.estimated_annual_income),
        adult_dependents:                 n(form.adult_dependents),
        child_dependents:                 nullable(form.child_dependents),
        infant_dependents:                n(form.infant_dependents),
        previous_policy_duration_months:  n(form.previous_policy_duration_months),
        days_since_quote:                 n(form.days_since_quote),
        grace_period_extensions:          n(form.grace_period_extensions),
        custom_riders_requested:          n(form.custom_riders_requested),
        vehicles_on_policy:               n(form.vehicles_on_policy),
        policy_amendments_count:          n(form.policy_amendments_count),
        previous_claims_filed:            n(form.previous_claims_filed),
        years_without_claims:             n(form.years_without_claims),
        underwriting_processing_days:     n(form.underwriting_processing_days),
        region_code:                      form.region_code || null,
        broker_agency_type:               form.broker_agency_type,
        deductible_tier:                  form.deductible_tier,
        acquisition_channel:              form.acquisition_channel,
        payment_schedule:                 form.payment_schedule,
        employment_status:                form.employment_status,
        policy_start_month:               form.policy_start_month,
        broker_id:                        nullable(form.broker_id),
        employer_id:                      nullable(form.employer_id),
      }

      const data = await apiFetch<{
        user_id: string
        predicted_bundle: number
        bundle_name: string
        confidence: number
        class_probabilities: number[]
      }>('/api/classify/single', { method: 'POST', body: JSON.stringify(body) })

      onResult({
        predictedBundle:    data.predicted_bundle,
        confidence:         data.confidence,
        classProbabilities: data.class_probabilities,
        bundleInfo:         BUNDLE_INFO[data.predicted_bundle] ?? BUNDLE_INFO[0],
        source:             'api',
      })
    } catch (err: any) {
      setError(err?.message ?? 'Prediction failed. Is the backend running?')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="h-full flex flex-col gap-4"
    >
      <div>
        <h2 className="text-base font-semibold text-foreground">New Customer</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Fill in the 22 ML features — the prediction will be saved to the database
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/30 rounded-lg px-3.5 py-2.5 text-sm">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <span className="text-destructive">{error}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3.5 pr-0.5">
        <Section label="Financial Profile">
          <Field label="Estimated Annual Income ($)" required>
            <input type="number" min={0} value={form.estimated_annual_income}
              onChange={set('estimated_annual_income')} placeholder="e.g. 60000" className={INP} />
          </Field>
          <Row>
            <Field label="Employment Status">
              <select value={form.employment_status} onChange={set('employment_status')} className={SEL}>
                {['Employed', 'Self-Employed', 'Unemployed', 'Retired'].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Employer ID">
              <input type="number" value={form.employer_id} onChange={set('employer_id')}
                placeholder="optional" className={INP} />
            </Field>
          </Row>
        </Section>

        <Section label="Dependents">
          <Row cols={3}>
            <Field label="Adult">
              <input type="number" min={0} value={form.adult_dependents}
                onChange={set('adult_dependents')} className={INP} />
            </Field>
            <Field label="Child">
              <input type="number" min={0} value={form.child_dependents}
                onChange={set('child_dependents')} placeholder="–" className={INP} />
            </Field>
            <Field label="Infant">
              <input type="number" min={0} value={form.infant_dependents}
                onChange={set('infant_dependents')} className={INP} />
            </Field>
          </Row>
        </Section>

        <Section label="Previous Policy">
          <Row>
            <Field label="Duration (months)">
              <input type="number" min={0} value={form.previous_policy_duration_months}
                onChange={set('previous_policy_duration_months')} className={INP} />
            </Field>
            <Field label="Amendments">
              <input type="number" min={0} value={form.policy_amendments_count}
                onChange={set('policy_amendments_count')} className={INP} />
            </Field>
          </Row>
          <Field label="Policy Start Month">
            <select value={form.policy_start_month} onChange={set('policy_start_month')} className={SEL}>
              {['January','February','March','April','May','June',
                'July','August','September','October','November','December'].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </Field>
        </Section>

        <Section label="Claims History">
          <Row cols={3}>
            <Field label="Claims Filed">
              <input type="number" min={0} value={form.previous_claims_filed}
                onChange={set('previous_claims_filed')} className={INP} />
            </Field>
            <Field label="Yrs w/o Claims">
              <input type="number" min={0} value={form.years_without_claims}
                onChange={set('years_without_claims')} className={INP} />
            </Field>
            <Field label="Grace Ext.">
              <input type="number" min={0} value={form.grace_period_extensions}
                onChange={set('grace_period_extensions')} className={INP} />
            </Field>
          </Row>
        </Section>

        <Section label="Coverage Preferences">
          <Row>
            <Field label="Vehicles on Policy">
              <input type="number" min={0} value={form.vehicles_on_policy}
                onChange={set('vehicles_on_policy')} className={INP} />
            </Field>
            <Field label="Custom Riders">
              <input type="number" min={0} value={form.custom_riders_requested}
                onChange={set('custom_riders_requested')} className={INP} />
            </Field>
          </Row>
          <Field label="Deductible Tier">
            <select value={form.deductible_tier} onChange={set('deductible_tier')} className={SEL}>
              {['Tier_1', 'Tier_2', 'Tier_3', 'Tier_4_Zero_Ded'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
        </Section>

        <Section label="Quote & Underwriting">
          <Row>
            <Field label="Days Since Quote">
              <input type="number" min={0} value={form.days_since_quote}
                onChange={set('days_since_quote')} className={INP} />
            </Field>
            <Field label="Underwriting Days">
              <input type="number" min={0} value={form.underwriting_processing_days}
                onChange={set('underwriting_processing_days')} className={INP} />
            </Field>
          </Row>
        </Section>

        <Section label="Agent & Region">
          <Row>
            <Field label="Region Code">
              <select value={form.region_code} onChange={set('region_code')} className={SEL}>
                {['R01', 'R02', 'R03', 'R04', 'R05', 'R06'].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Broker Agency">
              <select value={form.broker_agency_type} onChange={set('broker_agency_type')} className={SEL}>
                {['Independent', 'Captive', 'Direct'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
          </Row>
          <Row>
            <Field label="Acquisition Channel">
              <select value={form.acquisition_channel} onChange={set('acquisition_channel')} className={SEL}>
                {['Online', 'Agent', 'Direct', 'Referral'].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Payment Schedule">
              <select value={form.payment_schedule} onChange={set('payment_schedule')} className={SEL}>
                {['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
          </Row>
          <Field label="Broker ID">
            <input type="number" value={form.broker_id} onChange={set('broker_id')}
              placeholder="optional" className={INP} />
          </Field>
        </Section>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading || !form.estimated_annual_income}
        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all shadow-sm"
      >
        <Sparkles className="w-4 h-4" />
        {isLoading ? 'Classifying…' : 'Predict & Save Client'}
      </button>
    </motion.div>
  )
}
