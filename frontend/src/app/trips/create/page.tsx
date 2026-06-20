'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../utils/api';
import { Compass, Calendar, MapPin, Sparkles, AlertCircle, Clock, ChevronLeft, DollarSign } from 'lucide-react';

const INTERESTS_OPTIONS = [
  { id: 'Food', label: 'Food & Culinary' },
  { id: 'Culture', label: 'History & Culture' },
  { id: 'Adventure', label: 'Outdoor Adventure' },
  { id: 'Shopping', label: 'Shopping' },
  { id: 'Nature', label: 'Nature & Parks' },
  { id: 'Museums', label: 'Museums & Art' },
  { id: 'Relaxation', label: 'Relaxation & Wellness' },
  { id: 'Nightlife', label: 'Nightlife' },
];

const LOADING_MESSAGES = [
  'Consulting AI travel guides...',
  'Scouting popular destinations...',
  'Estimating flight and hotel price models...',
  'Assembling your daily activities...',
  'Curating top-rated local dining options...',
  'Polishing up hotel recommendations...',
  'Finalizing your customized adventure...'
];

export default function CreateTrip() {
  const { user, loading } = useAuth();
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [durationDays, setDurationDays] = useState(3);
  const [budgetPreference, setBudgetPreference] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  const [generating, setGenerating] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Cycle loading messages when generating
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generating) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [generating]);

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination || !startDate || !durationDays) {
      setError('Please fill in all required fields.');
      return;
    }

    if (durationDays < 1 || durationDays > 30) {
      setError('Duration must be between 1 and 30 days.');
      return;
    }

    setError(null);
    setGenerating(true);

    try {
      const trip = await api.createTrip({
        destination,
        startDate,
        durationDays,
        budgetPreference,
        interests: selectedInterests,
      });
      // Redirect to the newly created trip detail page
      router.push(`/trips/${trip._id}`);
    } catch (err: any) {
      console.error('Error generating trip:', err);
      setError(err.message || 'Failed to generate itinerary. Please try again.');
      setGenerating(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center min-h-screen bg-[#0B0F19]">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen relative bg-[#0B0F19]">
      {/* Glow Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#06B6D4] opacity-[0.03] rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#8B5CF6] opacity-[0.03] rounded-full blur-[120px]" />

      {generating && (
        /* Loading Overlay screen */
        <div className="fixed inset-0 bg-[#0B0F19]/90 backdrop-blur-md z-50 flex flex-col justify-center items-center px-6">
          <div className="relative w-24 h-24 mb-8">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/10 border-t-cyan-400 animate-spin" />
            {/* Inner counter-spinning ring */}
            <div className="absolute inset-2 rounded-full border-4 border-blue-500/10 border-b-blue-400 animate-spin [animation-duration:1.5s]" />
            {/* Center icon */}
            <div className="absolute inset-4 rounded-full bg-gray-900 flex items-center justify-center">
              <Compass className="w-7 h-7 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 text-center animate-pulse">Generating Your Custom Itinerary</h2>
          <p className="text-cyan-400 text-sm font-semibold tracking-wide uppercase">{LOADING_MESSAGES[loadingMsgIdx]}</p>
          <p className="text-gray-500 text-xs mt-8 max-w-xs text-center leading-relaxed">
            Please stand by. Gemini LLM agent is parsing prices, itineraries, and tourist spots for you.
          </p>
        </div>
      )}

      {/* Header */}
      <header className="relative z-10 bg-gray-900/40 backdrop-blur-md border-b border-white/[0.05]">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Compass className="w-7 h-7 text-cyan-400" />
            <span className="text-lg font-bold tracking-tight text-white">Tourist Trip</span>
          </Link>
          <Link href="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Form container */}
      <main className="relative z-10 flex-grow max-w-3xl mx-auto w-full px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Plan Your Journey <Sparkles className="w-6 h-6 text-cyan-400" />
          </h1>
          <p className="text-gray-400 text-sm mt-1">Specify destination details to invoke our AI agent.</p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 mb-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-panel p-8 rounded-2xl border border-white/[0.06] shadow-xl space-y-6">
          
          {/* Destination */}
          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="destination">
              Where are you going? <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                id="destination"
                type="text"
                className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm bg-gray-900/60"
                placeholder="e.g. Tokyo, Japan or Paris, France"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Dates & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="startDate">
                Start Date <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="startDate"
                  type="date"
                  className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm bg-gray-900/60 [color-scheme:dark]"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2" htmlFor="durationDays">
                Trip Duration (1 - 30 days) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="durationDays"
                  type="number"
                  min={1}
                  max={30}
                  className="glass-input w-full pl-11 pr-4 py-3.5 rounded-xl text-sm bg-gray-900/60"
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value, 10))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Budget Preference */}
          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Budget Tier Preference <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Low', 'Medium', 'High'] as const).map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setBudgetPreference(tier)}
                  className={`py-3.5 px-4 rounded-xl text-sm font-semibold border transition-all flex flex-col items-center justify-center gap-1.5 ${
                    budgetPreference === tier
                      ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-md shadow-cyan-500/5'
                      : 'bg-gray-900/40 border-white/5 text-gray-400 hover:text-white hover:bg-gray-900/70 hover:border-white/10'
                  }`}
                >
                  <DollarSign className={`w-4 h-4 ${budgetPreference === tier ? 'text-cyan-400' : 'text-gray-500'}`} />
                  <span>{tier}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2.5">
              Trip Interests (Select all that apply)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {INTERESTS_OPTIONS.map((opt) => {
                const isSelected = selectedInterests.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleInterestToggle(opt.id)}
                    className={`p-3.5 rounded-xl text-xs font-medium border text-center transition-all ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-semibold'
                        : 'bg-gray-900/40 border-white/5 text-gray-400 hover:text-white hover:bg-gray-900/70 hover:border-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-4 px-4 mt-8 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-base transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/15 pulse-glow-button"
          >
            <Sparkles className="w-5 h-5" />
            Generate Travel Plan
          </button>

        </form>
      </main>
    </div>
  );
}
