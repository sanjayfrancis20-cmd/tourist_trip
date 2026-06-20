'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { Compass, Sparkles, DollarSign, Hotel as HotelIcon, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="flex-1 flex flex-col min-h-screen relative overflow-hidden bg-[#0B0F19]">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#06B6D4] opacity-[0.05] rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#8B5CF6] opacity-[0.05] rounded-full blur-[120px]" />
      
      {/* Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Navigation */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Compass className="w-8 h-8 text-cyan-400" />
          <span className="text-xl font-bold tracking-tight text-white bg-clip-text">Tourist Trip</span>
        </div>
        <div className="flex items-center gap-4">
          {loading ? (
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          ) : user ? (
            <Link 
              href="/dashboard" 
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium text-sm transition-all shadow-lg shadow-cyan-500/10"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">
                Sign In
              </Link>
              <Link 
                href="/register" 
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/10 text-sm font-medium transition-all"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-6 text-center py-20">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          Next-Gen AI Itinerary Planner
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white">
          Travel Smarter With <br/>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-500">
            AI-Powered Plans
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed">
          Tourist Trip crafts detailed daily itineraries, computes precise cost breakdowns, recommends ideal stays, and manages your expenditures in real time.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          {user ? (
            <Link 
              href="/dashboard" 
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold flex items-center gap-2 group transition-all pulse-glow-button shadow-lg shadow-cyan-500/20"
            >
              View Your Trips
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <>
              <Link 
                href="/register" 
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold flex items-center justify-center gap-2 group transition-all pulse-glow-button shadow-lg shadow-cyan-500/20"
              >
                Start Planning Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/login" 
                className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/10 transition-all"
              >
                Log In
              </Link>
            </>
          )}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          {/* Card 1 */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-5">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Tailored Day-by-Day Plans</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Input interests, length, and budget to receive full day schedules generated dynamically by Gemini AI. Add/remove items manually or refine days via prompt commands.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 mb-5">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Pre-calculated Estimates</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Get detailed, category-wise predictions on flight, lodging, dining, and activity costs matched to your budget preference tier (Low, Medium, or High).
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-5">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Live Expense Tracker</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Our custom smart tracking system lets you record actual expenditures on the go, visualizing deviations from predictions with dynamic charts.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.05] py-8 text-center text-gray-500 text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 Tourist Trip Travel Planner. Built for Full Stack Assessment.</p>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Strict Data Isolation & Encrypted Passwords
          </div>
        </div>
      </footer>
    </div>
  );
}
