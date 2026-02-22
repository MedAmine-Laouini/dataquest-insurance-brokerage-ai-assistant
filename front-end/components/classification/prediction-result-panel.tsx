"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  ShieldCheck,
  Zap,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  AlertTriangle,
} from "lucide-react";
import { PredictionResult, submitFeedback } from "@/lib/classification-data";
import { ProbabilityDistribution } from "./probability-distribution";
import { ShapWaterfallChart } from "./shap-waterfall";

interface PredictionResultPanelProps {
  result: PredictionResult | null;
  isLoading?: boolean;
}

const TIER_COLOR: Record<string, string> = {
  Basic: "text-slate-400 bg-slate-400/10 border-slate-400/30",
  Standard: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  Premium: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  Enterprise: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
};

const CONFIDENCE_COLOR = (c: number) =>
  c >= 80 ? "text-emerald-500" : c >= 60 ? "text-amber-500" : "text-rose-500";

export function PredictionResultPanel({
  result,
  isLoading,
}: PredictionResultPanelProps) {
  const [showShap, setShowShap] = useState(true);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [rating, setRating] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full"
        />
        <p className="text-sm text-muted-foreground">
          Running classification model…
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-3">
        <ShieldCheck className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">
          Submit a customer profile to predict their coverage bundle
        </p>
      </div>
    );
  }

  const {
    bundleInfo,
    predictedBundle,
    confidence,
    classProbabilities,
    shapValues,
    source,
    latencyMs,
    ruleOverride,
    requestId,
  } = result;

  const handleFeedback = async (r: number) => {
    setRating(r);
    if (requestId) {
      await submitFeedback({
        request_id: requestId,
        predicted_bundle: predictedBundle,
        broker_rating: r,
      });
    }
    setFeedbackSent(true);
  };

  return (
    <motion.div
      key={predictedBundle}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full flex flex-col gap-6 overflow-y-auto"
    >
      {/* Predicted bundle hero */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex items-center gap-5"
      >
        <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          <span className="text-4xl font-extrabold text-primary">
            {predictedBundle}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              Predicted Bundle
            </span>
            {source === "fallback" && (
              <span className="text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full">
                Demo mode
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-foreground leading-tight">
            {bundleInfo.name}
          </h3>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${TIER_COLOR[bundleInfo.tier]}`}
            >
              {bundleInfo.tier}
            </span>
            <span
              className={`text-sm font-bold ${CONFIDENCE_COLOR(confidence)}`}
            >
              {confidence}% confidence
            </span>
            {ruleOverride && (
              <span className="text-xs text-amber-500 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Rule override applied
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Meta badges */}
      {(latencyMs !== undefined || source) && (
        <div className="flex items-center gap-3 flex-wrap">
          {latencyMs !== undefined && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/40 border border-border px-2.5 py-1 rounded-full">
              <Zap className="w-3 h-3" /> {latencyMs} ms inference
            </span>
          )}
          {source === "api" && (
            <span className="text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              ✓ Live model
            </span>
          )}
        </div>
      )}

      {/* Confidence meter */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Model Confidence
          </span>
          <span className={`text-sm font-bold ${CONFIDENCE_COLOR(confidence)}`}>
            {confidence}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${confidence >= 80 ? "bg-emerald-500" : confidence >= 60 ? "bg-amber-500" : "bg-rose-500"}`}
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Bundle detail */}
      <div className="bg-muted/20 border border-border rounded-xl p-5 space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Description
          </p>
          <p className="text-sm text-foreground leading-relaxed">
            {bundleInfo.description}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Typical Customer
          </p>
          <p className="text-sm text-muted-foreground">
            {bundleInfo.typicalProfile}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Included Coverages
          </p>
          <div className="flex flex-wrap gap-2">
            {bundleInfo.coverages.map((cov) => (
              <span
                key={cov}
                className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20"
              >
                {cov}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Est. Monthly Premium
          </p>
          <p className="text-sm font-bold text-emerald-500">
            ${bundleInfo.monthlyPremiumRange[0]} – $
            {bundleInfo.monthlyPremiumRange[1]}
          </p>
        </div>
      </div>

      {/* SHAP waterfall (collapsible) */}
      {shapValues && shapValues.length > 0 && (
        <div className="border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setShowShap((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3 bg-muted/20 hover:bg-muted/30 transition-colors"
          >
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Why this bundle? (SHAP Explanation)
            </span>
            {showShap ? (
              <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
          <AnimatePresence initial={false}>
            {showShap && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-5 py-4">
                  <ShapWaterfallChart
                    shapValues={shapValues}
                    predictedBundle={predictedBundle}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Class probability distribution */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          All Class Probabilities
        </p>
        <ProbabilityDistribution
          probabilities={classProbabilities}
          predictedBundle={predictedBundle}
        />
      </div>

      {/* Broker feedback */}
      {requestId && (
        <div className="border border-border rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" /> Broker Feedback
          </p>
          {feedbackSent ? (
            <p className="text-xs text-emerald-500">
              ✓ Thank you — feedback logged for model monitoring.
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                Rate this prediction:
              </span>
              {[1, 2, 3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => handleFeedback(r)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all ${
                    rating === r
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-muted/30 border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
