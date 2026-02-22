// lib/classification-data.ts
// Updated to call the real FastAPI backend instead of the mock engine.
// Falls back to the heuristic engine if the API is unreachable.

// ─── Customer profile ─────────────────────────────────────────────────────────

export interface CustomerProfile {
  id: string
  name: string
  age: number
  gender: 'Male' | 'Female' | 'Other'
  maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed'
  annualIncome: number
  employmentStatus: 'Employed' | 'Self-Employed' | 'Unemployed' | 'Retired'
  numDependents: number
  educationLevel: 'High School' | "Bachelor's" | "Master's" | 'PhD'
  propertyOwnership: 'Renter' | 'Homeowner'
  vehicleType: 'None' | 'Sedan' | 'SUV' | 'Truck' | 'Luxury'
  priorClaimsCount: number
  region: 'North' | 'South' | 'East' | 'West'
  // Extended fields that map to the real model schema
  previousPolicyDurationMonths?: number
  daysSinceQuote?: number
  gracePeriodExtensions?: number
  vehiclesOnPolicy?: number
  policyAmendmentsCount?: number
  yearswithoutClaims?: number
  underwritingProcessingDays?: number
  deductibleTier?: string
  paymentSchedule?: string
  policyStartMonth?: string
}

// ─── SHAP explanation ────────────────────────────────────────────────────────

export interface ShapValue {
  feature: string
  value: number
  shap_value: number
  abs_shap: number
}

// ─── Prediction result ────────────────────────────────────────────────────────

export interface PredictionResult {
  predictedBundle: number
  confidence: number
  classProbabilities: number[]
  bundleInfo: BundleInfo
  // MLOps additions
  requestId?: string
  latencyMs?: number
  ruleOverride?: boolean
  shapValues?: ShapValue[]
  source?: 'api' | 'fallback'
}

// ─── Global feature importance ────────────────────────────────────────────────

export interface FeatureImportance {
  feature: string
  gain: number
  weight: number
  cover: number
  composite_score: number
}

export interface GlobalExplanation {
  source: string
  features: FeatureImportance[]
}

// ─── MLOps types ─────────────────────────────────────────────────────────────

export interface ModelInfo {
  model_type: string
  n_features: number | string
  n_classes: number
  class_labels: number[]
  params: Record<string, string>
  model_path: string
  shap_available: boolean
  version: string
}

export interface MLOpsHealth {
  status: string
  model_loaded: boolean
  shap_available: boolean
  uptime_seconds: number
  request_count: number
  avg_latency_ms: number
  timestamp: string
}

export interface MLOpsMetrics {
  total_requests: number
  total_predictions: number
  latency_ms: { avg: number; min: number; max: number; p95: number }
  prediction_distribution: Record<string, { count: number; pct: number }>
  feedback_count: number
  timestamp: string
}

// ─── Bundle catalogue (unchanged) ────────────────────────────────────────────

export interface BundleInfo {
  id: number
  name: string
  tier: 'Basic' | 'Standard' | 'Premium' | 'Enterprise'
  description: string
  typicalProfile: string
  coverages: string[]
  monthlyPremiumRange: [number, number]
  color: string
}

export const BUNDLE_INFO: BundleInfo[] = [
  { id:0, name:'Liability Only',           tier:'Basic',      description:'Minimum legally required coverage — ideal for low-risk, cost-aware customers.',                  typicalProfile:'Young renter, entry-level income, no dependents',                         coverages:['Third-Party Liability'],                                                                                         monthlyPremiumRange:[18,35],    color:'slate'   },
  { id:1, name:'Essential Auto',           tier:'Basic',      description:'Core personal auto protection covering own-damage and liability.',                               typicalProfile:'Single driver, moderate income, urban area',                              coverages:['Auto Liability','Collision','Uninsured Motorist'],                                                                monthlyPremiumRange:[45,80],    color:'blue'    },
  { id:2, name:'Home + Auto Starter',      tier:'Standard',   description:'Entry-level bundled home and auto — popular with first-time homeowners.',                        typicalProfile:'Married couple, new homeowner, one vehicle',                              coverages:['Dwelling Protection','Auto Liability','Collision','Personal Property'],                                           monthlyPremiumRange:[95,150],   color:'cyan'    },
  { id:3, name:'Comprehensive Home',       tier:'Standard',   description:'Broad home coverage with liability extension — no auto component.',                              typicalProfile:'Homeowner, low vehicle usage, suburban',                                  coverages:['Dwelling Protection','Personal Liability','Loss of Use','Personal Property'],                                    monthlyPremiumRange:[85,140],   color:'teal'    },
  { id:4, name:'Life + Health Basic',      tier:'Standard',   description:'Term life and basic health coverage packaged for individuals and small families.',               typicalProfile:'Married with dependents, age 30–45, employee benefits gap',              coverages:['Term Life ($250k)','Major Medical','Prescription Coverage'],                                                     monthlyPremiumRange:[110,190],  color:'violet'  },
  { id:5, name:'Full Auto + Home',         tier:'Premium',    description:'Comprehensive bundled coverage for property and vehicles with roadside assistance.',             typicalProfile:'Homeowner with 2 vehicles, families, mid-to-high income',                coverages:['Full Collision & Comp','Dwelling + Contents','Roadside Assist','Rental Reimbursement'],                         monthlyPremiumRange:[180,280],  color:'indigo'  },
  { id:6, name:'Business Protection Basic',tier:'Standard',   description:'Starter commercial coverage for small business owners and freelancers.',                         typicalProfile:'Self-employed, 1–10 employees, home-based or small office',              coverages:['General Liability','BOP Property','Professional Liability'],                                                    monthlyPremiumRange:[160,260],  color:'amber'   },
  { id:7, name:'Premium All-Coverage',     tier:'Premium',    description:'Holistic personal protection: home, auto, life, and health in one plan.',                       typicalProfile:'High-income family, homeowner, multiple vehicles',                        coverages:['Full Auto','Home Comprehensive','Term Life ($500k)','Major Medical','Umbrella Liability'],                     monthlyPremiumRange:[320,480],  color:'purple'  },
  { id:8, name:'Enterprise Protection Suite',tier:'Enterprise',description:'Mid-to-large business coverage with cyber, D&O, and commercial property.',                     typicalProfile:'Business owner 10–100 employees, high-value assets',                     coverages:['Commercial General Liability','Directors & Officers','Cyber Liability','Commercial Property','Workers Comp'],  monthlyPremiumRange:[500,900],  color:'rose'    },
  { id:9, name:'Ultra-Premium Complete',   tier:'Enterprise', description:'Market-leading blanket coverage for high-net-worth individuals and large enterprises.',          typicalProfile:'Ultra-high-net-worth individual or Fortune-500-adjacent business',       coverages:['Whole Life ($2M+)','Excess Liability','Fine Art & Collectibles','Private Aviation','Global Health','Commercial Fleet'], monthlyPremiumRange:[1200,3500], color:'emerald' },
]

// ─── Sample customers ─────────────────────────────────────────────────────────

export const SAMPLE_CUSTOMERS: CustomerProfile[] = [
  { id:'c1', name:'Alex Rivera',    age:28, gender:'Male',   maritalStatus:'Single',   annualIncome:48000,  employmentStatus:'Employed',     numDependents:0, educationLevel:"Bachelor's", propertyOwnership:'Renter',    vehicleType:'Sedan',  priorClaimsCount:0, region:'West' },
  { id:'c2', name:'Sarah Chen',     age:38, gender:'Female', maritalStatus:'Married',  annualIncome:112000, employmentStatus:'Employed',     numDependents:2, educationLevel:"Master's",   propertyOwnership:'Homeowner', vehicleType:'SUV',    priorClaimsCount:1, region:'East' },
  { id:'c3', name:'Marcus Johnson', age:52, gender:'Male',   maritalStatus:'Married',  annualIncome:240000, employmentStatus:'Self-Employed',numDependents:3, educationLevel:"Master's",   propertyOwnership:'Homeowner', vehicleType:'Luxury', priorClaimsCount:2, region:'South'},
  { id:'c4', name:'Priya Patel',    age:44, gender:'Female', maritalStatus:'Divorced', annualIncome:78000,  employmentStatus:'Employed',     numDependents:1, educationLevel:"Bachelor's", propertyOwnership:'Homeowner', vehicleType:'Sedan',  priorClaimsCount:0, region:'North'},
]

// ─── API base URL ─────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

// ─── Map CustomerProfile → backend PredictRequest schema ─────────────────────

function profileToRequest(c: CustomerProfile): Record<string, unknown> {
  const vehicleCount = c.vehicleType === 'None' ? 0 : 1
  const employmentMap: Record<string, string> = {
    'Employed': 'Employed', 'Self-Employed': 'Self-Employed',
    'Unemployed': 'Unemployed', 'Retired': 'Retired',
  }
  return {
    User_ID                          : c.id,
    Estimated_Annual_Income          : c.annualIncome,
    Adult_Dependents                 : Math.max(0, c.numDependents - (c.maritalStatus === 'Married' ? 1 : 0)),
    Child_Dependents                 : c.numDependents > 0 ? c.numDependents : null,
    Infant_Dependents                : 0,
    Previous_Policy_Duration_Months  : c.previousPolicyDurationMonths ?? 12,
    Days_Since_Quote                 : c.daysSinceQuote ?? 30,
    Grace_Period_Extensions          : c.gracePeriodExtensions ?? 0,
    Custom_Riders_Requested          : c.vehicleType === 'Luxury' ? 2 : 0,
    Vehicles_on_Policy               : c.vehiclesOnPolicy ?? vehicleCount,
    Policy_Amendments_Count          : c.policyAmendmentsCount ?? 0,
    Previous_Claims_Filed            : c.priorClaimsCount,
    Years_Without_Claims             : c.yearswithoutClaims ?? Math.max(0, 5 - c.priorClaimsCount),
    Underwriting_Processing_Days     : c.underwritingProcessingDays ?? 5,
    Region_Code                      : c.region === 'North' ? 'R01' : c.region === 'South' ? 'R02' : c.region === 'East' ? 'R03' : 'R04',
    Broker_Agency_Type               : 'Independent',
    Deductible_Tier                  : c.deductibleTier ?? 'Tier_2',
    Acquisition_Channel              : 'Online',
    Payment_Schedule                 : c.paymentSchedule ?? 'Monthly',
    Employment_Status                : employmentMap[c.employmentStatus] ?? 'Employed',
    Policy_Start_Month               : c.policyStartMonth ?? 'January',
    Broker_ID                        : null,
    Employer_ID                      : c.employmentStatus !== 'Unemployed' ? 100 : null,
  }
}

// ─── Main predict function (calls API, falls back to heuristic) ───────────────

export async function predictBundle(customer: CustomerProfile): Promise<PredictionResult> {
  try {
    const body = profileToRequest(customer)
    const res  = await fetch(`${API_BASE}/api/predict`, {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify(body),
      signal : AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
    const data = await res.json()
    return {
      predictedBundle     : data.predicted_bundle,
      confidence          : data.confidence,
      classProbabilities  : data.class_probabilities,
      bundleInfo          : BUNDLE_INFO[data.predicted_bundle],
      requestId           : data.request_id,
      latencyMs           : data.latency_ms,
      ruleOverride        : data.rule_override,
      shapValues          : data.shap_values ?? undefined,
      source              : 'api',
    }
  } catch {
    // Heuristic fallback
    return predictBundleFallback(customer)
  }
}

// ─── Heuristic fallback (original mock engine) ────────────────────────────────

export function predictBundleFallback(customer: CustomerProfile): PredictionResult {
  const raw = Array(10).fill(0) as number[]
  const incomeScore     = Math.log10(Math.max(customer.annualIncome, 1000)) / Math.log10(300000)
  const ageScore        = customer.age / 65
  const dependentsBoost = customer.numDependents > 0 ? 1.2 : 1.0
  const isHomeowner     = customer.propertyOwnership === 'Homeowner'
  const hasCar          = customer.vehicleType !== 'None'
  const isBusiness      = customer.employmentStatus === 'Self-Employed'
  const isHighIncome    = customer.annualIncome > 150000
  const isVeryHighIncome= customer.annualIncome > 300000

  raw[0] += (1 - incomeScore) * 2 + (customer.priorClaimsCount === 0 ? 0.5 : 0)
  raw[1] += hasCar ? 1.5 * (1 - incomeScore * 0.5) : 0
  raw[2] += isHomeowner && hasCar && !isHighIncome ? 2.0 * dependentsBoost : 0
  raw[3] += isHomeowner && !hasCar ? 1.8 : 0
  raw[4] += customer.numDependents >= 1 && ageScore > 0.4 && ageScore < 0.75 ? 2.0 : 0
  raw[5] += isHomeowner && hasCar && incomeScore > 0.5 ? 2.5 * dependentsBoost : 0
  raw[6] += isBusiness && !isHighIncome ? 2.2 : 0
  raw[7] += isHighIncome && isHomeowner && hasCar ? 2.8 * (customer.numDependents > 0 ? 1.3 : 1.0) : 0
  raw[8] += isBusiness && isHighIncome ? 2.5 : 0
  raw[9] += isVeryHighIncome ? 3.0 : 0

  const noisy = raw.map((v, i) => Math.max(0.05, v + (i % 3 === 0 ? 0.1 : 0.05)))
  const total = noisy.reduce((a, b) => a + b, 0)
  const probs = noisy.map((v) => Math.round((v / total) * 100))
  const sum   = probs.reduce((a, b) => a + b, 0)
  probs[probs.indexOf(Math.max(...probs))] += 100 - sum

  const pb = probs.indexOf(Math.max(...probs))
  return {
    predictedBundle   : pb,
    confidence        : probs[pb],
    classProbabilities: probs,
    bundleInfo        : BUNDLE_INFO[pb],
    source            : 'fallback',
  }
}

// ─── API helpers ──────────────────────────────────────────────────────────────

export async function fetchGlobalExplanation(): Promise<GlobalExplanation | null> {
  try {
    const res = await fetch(`${API_BASE}/api/explain/global`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export async function fetchModelInfo(): Promise<ModelInfo | null> {
  try {
    const res = await fetch(`${API_BASE}/api/model/info`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export async function fetchMLOpsHealth(): Promise<MLOpsHealth | null> {
  try {
    const res = await fetch(`${API_BASE}/api/mlops/health`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export async function fetchMLOpsMetrics(): Promise<MLOpsMetrics | null> {
  try {
    const res = await fetch(`${API_BASE}/api/mlops/metrics`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    return res.json()
  } catch { return null }
}

export async function submitFeedback(payload: {
  request_id: string
  predicted_bundle: number
  actual_bundle?: number
  broker_rating?: number
  notes?: string
}): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:8000/api/mlops/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return res.ok
  } catch { return false }
}