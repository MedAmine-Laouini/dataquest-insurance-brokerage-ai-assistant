'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { motion } from 'framer-motion'
import {
  Users,
  FileCheck,
  TrendingUp,
  Building2,
  Cpu,
  Activity
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { containerVariants, itemVariants } from '@/lib/animations'

const aiUsageData = [
  { name: 'Mon', queries: 120, recommendations: 85 },
  { name: 'Tue', queries: 150, recommendations: 110 },
  { name: 'Wed', queries: 180, recommendations: 135 },
  { name: 'Thu', queries: 140, recommendations: 95 },
  { name: 'Fri', queries: 200, recommendations: 160 },
]

const recentLogs = [
  { id: 1, action: 'User login', user: 'jdoe@broker.com', time: '10 mins ago', status: 'Success' },
  { id: 2, action: 'Policy Matched', user: 'System AI', time: '25 mins ago', status: 'Success' },
  { id: 3, action: 'API Error: Insurer Sync', user: 'System', time: '1 hour ago', status: 'Failed' },
  { id: 4, action: 'New Client Added', user: 'asmith@broker.com', time: '2 hours ago', status: 'Success' },
]

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  if (isLoading || !user || user.role !== 'admin') {
    return null // Render nothing while redirecting
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Overview</h1>
          <p className="text-muted-foreground mt-2">Executive summary of platform usage and system health.</p>
        </div>
      </motion.div>

      {/* Top Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Clients</h3>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground">1,248</p>
          <p className="text-xs text-emerald-500 mt-2 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> +15% this month
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Total Policies Bound</h3>
            <FileCheck className="w-5 h-5 text-accent" />
          </div>
          <p className="text-3xl font-bold text-foreground">3,852</p>
          <p className="text-xs text-emerald-500 mt-2 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> +8% this month
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">Active Insurers</h3>
            <Building2 className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">14</p>
          <p className="text-xs text-muted-foreground mt-2">Connecting to 45 products</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">AI Queries (24h)</h3>
            <Cpu className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">8,402</p>
          <p className="text-xs text-emerald-500 mt-2 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1" /> System Nominal
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Usage Stats */}
        <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground mb-6">AI System Usage</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aiUsageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--border)" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <YAxis stroke="var(--border)" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--foreground)' }}
                  labelStyle={{ color: 'var(--foreground)' }}
                  itemStyle={{ color: 'var(--foreground)' }}
                />
                <Bar dataKey="queries" name="Client Queries" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="recommendations" name="Recommendations Generated" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* System Logs */}
        <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">System Logs</h3>
            <Activity className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex flex-col gap-1 pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{log.action}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${log.status === 'Success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                    {log.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{log.user}</span>
                  <span>{log.time}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm text-primary hover:bg-primary/5 rounded-lg transition-colors font-medium">
            View All Logs
          </button>
        </motion.div>

        {/* Broker Comparison Table */}
        <motion.div variants={itemVariants} className="bg-card border border-border rounded-xl p-6 lg:col-span-3">
          <h3 className="text-lg font-semibold text-foreground mb-6">Broker Performance Leaderboard</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                <tr>
                  <th className="px-6 py-3 rounded-tl-lg">Broker Name</th>
                  <th className="px-6 py-3">Active Clients</th>
                  <th className="px-6 py-3">Policies Bound</th>
                  <th className="px-6 py-3">Conversion Rate</th>
                  <th className="px-6 py-3 rounded-tr-lg">Avg Match Time</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-6 py-4 font-medium text-foreground">Sarah Jenkins</td>
                  <td className="px-6 py-4">84</td>
                  <td className="px-6 py-4 text-emerald-500">+210</td>
                  <td className="px-6 py-4">72%</td>
                  <td className="px-6 py-4">1.2h</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="px-6 py-4 font-medium text-foreground">Michael Chen</td>
                  <td className="px-6 py-4">65</td>
                  <td className="px-6 py-4 text-emerald-500">+145</td>
                  <td className="px-6 py-4">68%</td>
                  <td className="px-6 py-4">1.8h</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium text-foreground">Elena Rodriguez</td>
                  <td className="px-6 py-4">42</td>
                  <td className="px-6 py-4 text-emerald-500">+98</td>
                  <td className="px-6 py-4">61%</td>
                  <td className="px-6 py-4">2.4h</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
