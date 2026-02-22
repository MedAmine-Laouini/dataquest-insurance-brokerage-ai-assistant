'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  FileCheck,
  TrendingUp,
  Briefcase,
  Clock
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'
import { containerVariants, itemVariants } from '@/lib/animations'

const monthlyData = [
  { name: 'Jan', cases: 24, converted: 18 },
  { name: 'Feb', cases: 35, converted: 25 },
  { name: 'Mar', cases: 42, converted: 31 },
  { name: 'Apr', cases: 38, converted: 28 },
  { name: 'May', cases: 55, converted: 42 },
  { name: 'Jun', cases: 48, converted: 38 },
]

const statusData = [
  { name: 'Reviewing', value: 35 },
  { name: 'Quoted', value: 45 },
  { name: 'Negotiating', value: 25 },
  { name: 'Bound', value: 85 },
]

const policyTypesData = [
  { name: 'General Liability', value: 40 },
  { name: 'Workers Comp', value: 25 },
  { name: 'Cyber', value: 20 },
  { name: 'Property', value: 15 },
]

const COLORS = ['var(--chart-1)', 'var(--chart-2)', '#10b981', '#f59e0b']

export default function WorkTrackerPage() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Broker Performance</h1>
          <p className="text-muted-foreground mt-2">Track key metrics, conversion rates, and pipeline status.</p>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Clients Pending</h3>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">24</p>
          <p className="text-xs text-emerald-500 mt-2 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> +12% from last week
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Policies Matched</h3>
            <FileCheck className="w-5 h-5 text-accent" />
          </div>
          <p className="text-3xl font-bold text-foreground">156</p>
          <p className="text-xs text-emerald-500 mt-2 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> +28% this month
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Conversion Rate</h3>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">68%</p>
          <p className="text-xs text-emerald-500 mt-2 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> +4.2% overall
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Active Cases</h3>
            <Briefcase className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">42</p>
          <p className="text-xs text-muted-foreground mt-2">In current pipeline</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Avg Match Time</h3>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">1.8h</p>
          <p className="text-xs text-emerald-500 mt-2 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> -15m faster
          </p>
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Monthly Performance</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--border)" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <YAxis stroke="var(--border)" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                  labelStyle={{ color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Legend formatter={(value) => <span style={{ color: 'var(--foreground)', fontSize: '12px' }}>{value}</span>} />
                <Line type="monotone" dataKey="cases" name="Total Cases" stroke="var(--chart-1)" strokeWidth={2} />
                <Line type="monotone" dataKey="converted" name="Converted" stroke="var(--chart-2)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Status Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--border)" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" stroke="var(--border)" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                  labelStyle={{ color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Bar dataKey="value" name="Cases" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground mb-6">Policy Types Matched</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={policyTypesData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {policyTypesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                  labelStyle={{ color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span style={{ color: 'var(--foreground)', fontSize: '12px' }}>{value}</span>}
                  wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
