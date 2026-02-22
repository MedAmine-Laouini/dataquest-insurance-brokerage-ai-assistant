"use client";

import React from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { ShapValue } from "@/lib/classification-data";

interface ShapWaterfallProps {
  shapValues: ShapValue[];
  predictedBundle: number;
  baseValue?: number; // optional SHAP base value
}

/**
 * ShapWaterfallChart
 * ------------------
 * Renders a horizontal waterfall chart showing each feature's SHAP contribution
 * to the predicted class. Green bars push toward the prediction; red bars push away.
 */
export function ShapWaterfallChart({
  shapValues,
  predictedBundle,
}: ShapWaterfallProps) {
  if (!shapValues || shapValues.length === 0) return null;

  const sorted = [...shapValues]
    .sort((a, b) => b.abs_shap - a.abs_shap)
    .slice(0, 12);
  const maxAbs = Math.max(...sorted.map((s) => s.abs_shap), 0.001);

  const formatFeatureName = (f: string) =>
    f.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const formatValue = (v: number) => {
    if (Math.abs(v) > 10000)
      return v.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (Math.abs(v) < 1 && v !== 0) return v.toFixed(3);
    return v.toFixed(1);
  };

  return (
    <div className="space-y-1.5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Info className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Showing top {sorted.length} features driving{" "}
          <span className="font-semibold text-foreground">
            Bundle {predictedBundle}
          </span>
        </span>
        <div className="ml-auto flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 rounded-sm bg-emerald-500/70" />{" "}
            Pushes toward
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-2 rounded-sm bg-rose-500/70" />{" "}
            Pushes away
          </span>
        </div>
      </div>

      {sorted.map((sv, idx) => {
        const isPos = sv.shap_value >= 0;
        const barWidth = Math.min(100, (sv.abs_shap / maxAbs) * 100);
        return (
          <motion.div
            key={sv.feature}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="flex items-center gap-2 group"
          >
            {/* Feature name */}
            <div className="w-48 flex-shrink-0 text-right">
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors truncate block">
                {formatFeatureName(sv.feature)}
              </span>
              <span className="text-[10px] text-muted-foreground/50">
                = {formatValue(sv.value)}
              </span>
            </div>

            {/* Bar */}
            <div className="flex-1 flex items-center gap-1.5">
              <div className="flex-1 h-5 bg-muted/20 rounded-sm overflow-hidden relative">
                <motion.div
                  className={`absolute top-0 h-full rounded-sm ${
                    isPos
                      ? "bg-emerald-500/70 left-0"
                      : "bg-rose-500/70 right-0"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{
                    duration: 0.45,
                    ease: "easeOut",
                    delay: idx * 0.04,
                  }}
                />
                {/* Center line */}
                <div className="absolute inset-y-0 left-1/2 w-px bg-border/60" />
              </div>

              {/* SHAP value */}
              <span
                className={`text-xs font-mono font-semibold w-14 text-right flex-shrink-0 ${
                  isPos ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {isPos ? "+" : ""}
                {sv.shap_value.toFixed(3)}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
