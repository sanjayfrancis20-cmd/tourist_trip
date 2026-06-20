'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../context/AuthContext';
import { api, Trip, DayPlan, Activity, Expense } from '../../../utils/api';
import { 
  Compass, Calendar, Clock, DollarSign, ChevronLeft, Sparkles, Plus, 
  Trash2, Hotel as HotelIcon, TrendingUp, AlertTriangle, CheckCircle, 
  Tag, FileText, CalendarDays, RefreshCw, X
} from 'lucide-react';

const CATEGORIES = ['Flights', 'Accommodation', 'Food', 'Activities', 'Other'] as const;

export default function TripDetails() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loadingTrip, setLoadingTrip] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'itinerary' | 'hotels' | 'expenses'>('itinerary');
  const [activeDay, setActiveDay] = useState(1);
  
  // Day Regeneration State
  const [regenPrompt, setRegenPrompt] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  // Manual Activity Addition State
  const [showAddActivityForm, setShowAddActivityForm] = useState(false);
  const [newActTitle, setNewActTitle] = useState('');
  const [newActTime, setNewActTime] = useState('09:00 AM');
  const [newActDesc, setNewActDesc] = useState('');
  const [addingActivity, setAddingActivity] = useState(false);

  // Expense Logging State
  const [expCategory, setExpCategory] = useState<typeof CATEGORIES[number]>('Food');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');
  const [expDate, setExpDate] = useState('');
  const [loggingExpense, setLoggingExpense] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchTripDetails = async () => {
    if (!id || typeof id !== 'string') return;
    try {
      setLoadingTrip(true);
      const data = await api.getTrip(id);
      setTrip(data);
      if (data.startDate) {
        // Set default date for expense form to start date
        setExpDate(new Date(data.startDate).toISOString().split('T')[0]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load trip details.');
    } finally {
      setLoadingTrip(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  // Remove Activity
  const handleDeleteActivity = async (dayNum: number, activityId: string) => {
    if (!trip) return;
    
    // Copy itinerary
    const updatedItinerary = trip.aiItinerary.map((day) => {
      if (day.dayNumber === dayNum) {
        return {
          ...day,
          activities: day.activities.filter((act) => act.id !== activityId),
        };
      }
      return day;
    });

    try {
      const updatedTrip = await api.updateTripItinerary(trip._id, updatedItinerary);
      setTrip(updatedTrip);
    } catch (err: any) {
      alert('Failed to delete activity: ' + (err.message || 'Server error'));
    }
  };

  // Add Custom Activity
  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !newActTitle || !newActTime) return;

    setAddingActivity(true);
    const newActivity: Activity = {
      id: Math.random().toString(36).substr(2, 9), // simple client side ID
      time: newActTime,
      title: newActTitle,
      description: newActDesc || 'Custom activity planned by traveler.',
    };

    const updatedItinerary = trip.aiItinerary.map((day) => {
      if (day.dayNumber === activeDay) {
        return {
          ...day,
          activities: [...day.activities, newActivity].sort((a, b) => a.time.localeCompare(b.time)),
        };
      }
      return day;
    });

    try {
      const updatedTrip = await api.updateTripItinerary(trip._id, updatedItinerary);
      setTrip(updatedTrip);
      setShowAddActivityForm(false);
      setNewActTitle('');
      setNewActDesc('');
      setNewActTime('09:00 AM');
    } catch (err: any) {
      alert('Failed to add activity: ' + (err.message || 'Server error'));
    } finally {
      setAddingActivity(false);
    }
  };

  // Regenerate Specific Day
  const handleRegenerateDay = async () => {
    if (!trip || !regenPrompt.trim()) return;

    setRegenerating(true);
    try {
      const updatedTrip = await api.regenerateDay(trip._id, activeDay, regenPrompt);
      setTrip(updatedTrip);
      setRegenPrompt('');
    } catch (err: any) {
      alert('Failed to regenerate day: ' + (err.message || 'Server error'));
    } finally {
      setRegenerating(false);
    }
  };

  // Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip || !expAmount || !expDesc) return;

    const amt = parseFloat(expAmount);
    if (isNaN(amt) || amt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    setLoggingExpense(true);
    try {
      const updatedTrip = await api.addExpense(trip._id, {
        category: expCategory,
        amount: amt,
        description: expDesc,
        date: expDate || undefined,
      });
      setTrip(updatedTrip);
      setExpAmount('');
      setExpDesc('');
    } catch (err: any) {
      alert('Failed to add expense: ' + (err.message || 'Server error'));
    } finally {
      setLoggingExpense(false);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (expenseId: string) => {
    if (!trip) return;
    if (!confirm('Are you sure you want to delete this expense entry?')) return;

    try {
      const updatedTrip = await api.deleteExpense(trip._id, expenseId);
      setTrip(updatedTrip);
    } catch (err: any) {
      alert('Failed to delete expense: ' + (err.message || 'Server error'));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Safe navigation checks
  if (authLoading || !user) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen bg-[#0B0F19]">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (loadingTrip) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen bg-[#0B0F19]">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-400 text-sm">Fetching your travel plan details...</p>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen px-6 bg-[#0B0F19]">
        <div className="glass-panel p-8 rounded-2xl max-w-md text-center border border-rose-500/20">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error loading trip</h2>
          <p className="text-gray-400 text-sm mb-6">{error || 'The requested trip itinerary does not exist.'}</p>
          <Link href="/dashboard" className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-semibold border border-white/5 transition-all">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Calculate actual costs
  const actualCategorySpent: Record<string, number> = {
    Flights: 0,
    Accommodation: 0,
    Food: 0,
    Activities: 0,
    Other: 0,
  };
  trip.expenses.forEach((e) => {
    if (actualCategorySpent[e.category] !== undefined) {
      actualCategorySpent[e.category] += e.amount;
    }
  });

  const totalEstimated = trip.estimatedBudget.reduce((sum, item) => sum + item.amount, 0);
  const totalActual = trip.expenses.reduce((sum, item) => sum + item.amount, 0);

  const activeDayPlan = trip.aiItinerary.find((d) => d.dayNumber === activeDay);

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-[#0B0F19] relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#06B6D4] opacity-[0.02] rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#8B5CF6] opacity-[0.02] rounded-full blur-[120px]" />

      {/* Header */}
      <header className="relative z-10 bg-gray-900/40 backdrop-blur-md border-b border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
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

      {/* Main Layout Grid */}
      <main className="relative z-10 flex-grow max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar Trip Card Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-600" />
            
            <h1 className="text-2xl font-black text-white mb-4 mt-2">{trip.destination}</h1>
            
            <div className="space-y-3.5 text-sm text-gray-300">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4.5 h-4.5 text-cyan-400 shrink-0" />
                <span>{formatDate(trip.startDate)}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4.5 h-4.5 text-cyan-400 shrink-0" />
                <span>{trip.durationDays} Days Duration</span>
              </div>
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4.5 h-4.5 text-cyan-400 shrink-0" />
                <span>Budget Tier: <span className="font-semibold text-white">{trip.budgetPreference}</span></span>
              </div>
            </div>

            {/* Interest Badges */}
            {trip.interests && trip.interests.length > 0 && (
              <div className="mt-6 pt-5 border-t border-white/[0.05]">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2.5">Focus Interests</p>
                <div className="flex flex-wrap gap-1.5">
                  {trip.interests.map((interest) => (
                    <span 
                      key={interest} 
                      className="px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-gray-300 text-xs font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Expense Compare Panel (Always visible in sidebar) */}
          <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider text-gray-400">Budget Progress</h3>
              {totalActual > totalEstimated ? (
                <span className="flex items-center gap-1 text-rose-400 text-xs font-bold bg-rose-500/10 px-2 py-0.5 rounded">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Over Budget
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  <CheckCircle className="w-3.5 h-3.5" />
                  On Track
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Total Budget Estimate:</span>
                <span className="text-white font-semibold">${totalEstimated}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Actual Logged Spend:</span>
                <span className={`font-bold ${totalActual > totalEstimated ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ${totalActual}
                </span>
              </div>

              {/* Progress Bar SVG/CSS */}
              <div className="w-full bg-white/5 rounded-full h-2.5 mt-4 overflow-hidden border border-white/5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    totalActual > totalEstimated ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
                  }`}
                  style={{ width: `${Math.min((totalActual / (totalEstimated || 1)) * 100, 100)}%` }}
                />
              </div>
              
              {totalActual > totalEstimated && (
                <p className="text-rose-400 text-xs font-medium leading-relaxed mt-2.5">
                  Warning: You have exceeded the overall estimated budget by ${(totalActual - totalEstimated).toFixed(0)}. Try trimming local activities or dinners.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Itinerary / Hotels / Expense View Control */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          
          {/* Tab Navigation buttons */}
          <div className="flex rounded-xl bg-gray-900/60 p-1 border border-white/[0.04] self-start">
            <button
              onClick={() => setActiveTab('itinerary')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'itinerary'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/10'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Day Itinerary
            </button>
            <button
              onClick={() => setActiveTab('hotels')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'hotels'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/10'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <HotelIcon className="w-4 h-4" />
              Hotels
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'expenses'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/10'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Expense Tracker
            </button>
          </div>

          {/* TAB CONTENT: ITINERARY PLAN */}
          {activeTab === 'itinerary' && (
            <div className="space-y-6">
              
              {/* Day selector tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {trip.aiItinerary.map((day) => (
                  <button
                    key={day.dayNumber}
                    onClick={() => {
                      setActiveDay(day.dayNumber);
                      setShowAddActivityForm(false);
                    }}
                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                      activeDay === day.dayNumber
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-semibold'
                        : 'bg-gray-900/40 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                    }`}
                  >
                    Day {day.dayNumber}
                  </button>
                ))}
              </div>

              {/* Day panel */}
              <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.06] shadow-xl space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-white/[0.05]">
                  <div>
                    <h2 className="text-xl font-bold text-white">Day {activeDay} Schedule</h2>
                    <p className="text-xs text-gray-400 mt-1">Explore carefully mapped spots</p>
                  </div>
                  <button
                    onClick={() => setShowAddActivityForm(!showAddActivityForm)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-white/10 font-bold transition-all"
                  >
                    {showAddActivityForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {showAddActivityForm ? 'Cancel Add' : 'Add Activity'}
                  </button>
                </div>

                {/* Inline Add Manual Activity Form */}
                {showAddActivityForm && (
                  <form onSubmit={handleAddActivity} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                    <p className="text-xs font-bold text-white uppercase tracking-wider text-gray-400">Add Activity Manually</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          className="glass-input w-full p-2.5 rounded-lg text-xs"
                          placeholder="Activity title (e.g., Dinner at Michelin Restaurant)"
                          value={newActTitle}
                          onChange={(e) => setNewActTitle(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          className="glass-input w-full p-2.5 rounded-lg text-xs"
                          placeholder="Time (e.g., 08:30 PM)"
                          value={newActTime}
                          onChange={(e) => setNewActTime(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <textarea
                        className="glass-input w-full p-2.5 rounded-lg text-xs h-16 resize-none"
                        placeholder="Description (optional details)..."
                        value={newActDesc}
                        onChange={(e) => setNewActDesc(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={addingActivity}
                      className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs transition-all disabled:opacity-50"
                    >
                      {addingActivity ? 'Saving...' : 'Save Activity'}
                    </button>
                  </form>
                )}

                {/* Timeline rendering */}
                {activeDayPlan && activeDayPlan.activities.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500 text-sm">No activities scheduled for this day.</p>
                    <button 
                      onClick={() => setShowAddActivityForm(true)}
                      className="mt-3 text-xs text-cyan-400 hover:underline"
                    >
                      Add one manually
                    </button>
                  </div>
                ) : (
                  <div className="relative pl-6 border-l border-white/10 space-y-8 py-2">
                    {activeDayPlan?.activities.map((activity) => (
                      <div key={activity.id} className="relative group/item">
                        {/* Timeline bubble */}
                        <div className="absolute left-[-30px] top-1.5 w-4.5 h-4.5 rounded-full bg-gray-900 border-2 border-cyan-400 flex items-center justify-center shrink-0" />
                        
                        <div className="glass-card p-5 rounded-xl flex flex-col sm:flex-row justify-between items-start gap-4">
                          <div className="space-y-1">
                            <span className="inline-block px-2.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold text-[10px]">
                              {activity.time}
                            </span>
                            <h4 className="text-base font-bold text-white pt-1">{activity.title}</h4>
                            <p className="text-sm text-gray-400 leading-relaxed pt-1.5">{activity.description}</p>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteActivity(activeDay, activity.id)}
                            className="p-1.5 rounded bg-white/5 hover:bg-rose-500/10 border border-white/5 text-gray-500 hover:text-rose-400 transition-all sm:opacity-0 group-hover/item:opacity-100 focus:opacity-100 shrink-0 self-end sm:self-start"
                            title="Remove Activity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Refine / Regenerate specific day section */}
                <div className="mt-8 pt-6 border-t border-white/[0.05] space-y-4">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Regenerate Day {activeDay} with AI</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Instruct our travel agent to completely rewrite this specific day schedule (e.g. *"focus entirely on art galleries and local bakeries"* or *"make it a highly adventurous hiking plan"*).
                  </p>
                  
                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      className="glass-input flex-1 px-4 py-2.5 rounded-xl text-xs"
                      placeholder='e.g. "more outdoor nature walks" or "add kids-friendly parks"'
                      value={regenPrompt}
                      onChange={(e) => setRegenPrompt(e.target.value)}
                      disabled={regenerating}
                    />
                    <button
                      onClick={handleRegenerateDay}
                      className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                      disabled={regenerating || !regenPrompt.trim()}
                    >
                      {regenerating ? (
                        <>
                          <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Regenerate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB CONTENT: HOTEL SUGGESTIONS */}
          {activeTab === 'hotels' && (
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] shadow-xl">
                <div className="pb-4 border-b border-white/[0.05] mb-6">
                  <h2 className="text-xl font-bold text-white">Recommended Places to Stay</h2>
                  <p className="text-xs text-gray-400 mt-1">Suggested hotels matched to budgets and ratings</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {trip.hotels.map((hotel) => {
                    const priceColors = {
                      'Budget Friendly': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                      'Mid Range': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
                      'Luxury': 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                    };
                    const colorClass = priceColors[hotel.priceTier] || 'text-gray-400 bg-white/5 border-white/5';

                    return (
                      <div key={hotel.name} className="glass-card p-5 rounded-xl flex flex-col justify-between h-full relative overflow-hidden">
                        <div className="space-y-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}>
                            {hotel.priceTier}
                          </span>
                          <h4 className="text-base font-bold text-white">{hotel.name}</h4>
                          
                          <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                            <span>★</span>
                            <span>{hotel.rating.toFixed(1)} / 5.0 Rating</span>
                          </div>

                          <p className="text-xs text-gray-400 leading-relaxed pt-2">
                            {hotel.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: CUSTOM FEATURE - SMART EXPENSE TRACKER */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              
              {/* Tracker Form & Statistics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Form to log expense */}
                <div className="md:col-span-5 glass-panel p-5 rounded-2xl border border-white/[0.06] shadow-xl">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4 text-cyan-400">Log Travel Expense</h3>
                  
                  <form onSubmit={handleAddExpense} className="space-y-3.5">
                    <div>
                      <label className="block text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Category</label>
                      <select
                        className="glass-input w-full p-2.5 rounded-lg text-xs bg-gray-900/80"
                        value={expCategory}
                        onChange={(e) => setExpCategory(e.target.value as any)}
                        disabled={loggingExpense}
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Amount (USD)</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="24.99"
                          className="glass-input w-full pl-6 pr-3 py-2 rounded-lg text-xs bg-gray-900/80"
                          value={expAmount}
                          onChange={(e) => setExpAmount(e.target.value)}
                          required
                          disabled={loggingExpense}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Description</label>
                      <input
                        type="text"
                        placeholder="e.g., Sushi lunch at Ginza"
                        className="glass-input w-full p-2.5 rounded-lg text-xs bg-gray-900/80"
                        value={expDesc}
                        onChange={(e) => setExpDesc(e.target.value)}
                        required
                        disabled={loggingExpense}
                      />
                    </div>

                    <div>
                      <label className="block text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Date</label>
                      <input
                        type="date"
                        className="glass-input w-full p-2.5 rounded-lg text-xs bg-gray-900/80 [color-scheme:dark]"
                        value={expDate}
                        onChange={(e) => setExpDate(e.target.value)}
                        required
                        disabled={loggingExpense}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loggingExpense}
                      className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 mt-4"
                    >
                      {loggingExpense ? (
                        <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Save Entry</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Category wise cost comparison chart & table */}
                <div className="md:col-span-7 glass-panel p-5 rounded-2xl border border-white/[0.06] shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-3.5 text-cyan-400">
                      Estimated vs Actual Cost breakdown
                    </h3>
                    
                    <div className="space-y-4">
                      {trip.estimatedBudget.map((est) => {
                        const actual = actualCategorySpent[est.category] || 0;
                        const estimate = est.amount;
                        const pct = Math.min((actual / (estimate || 1)) * 100, 100);
                        const isOver = actual > estimate;

                        return (
                          <div key={est.category} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-gray-300 font-semibold">{est.category}</span>
                              <span className="text-gray-400">
                                <span className={isOver ? 'text-rose-400 font-bold' : 'text-gray-300'}>
                                  ${actual}
                                </span>
                                <span className="text-gray-600"> / </span>
                                <span>${estimate}</span>
                              </span>
                            </div>
                            
                            {/* Bar comparison progress */}
                            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isOver ? 'bg-rose-500 animate-pulse' : 'bg-cyan-400'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/[0.05] text-[10px] text-gray-500 leading-relaxed">
                    💡 **Smart Travel tip**: Keep food and activities under control by comparing costs dynamically. If any category gets high, compensate with cheaper lodging options.
                  </div>
                </div>

              </div>

              {/* Transactions Ledger history */}
              <div className="glass-panel p-6 rounded-2xl border border-white/[0.06] shadow-xl">
                <h3 className="font-bold text-white text-sm uppercase tracking-wider mb-4">Expenses Log ledger</h3>
                
                {trip.expenses.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No expense transactions logged yet. Add one above!
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-500 font-bold uppercase tracking-wider">
                          <th className="py-3 px-2">Date</th>
                          <th className="py-3 px-2">Category</th>
                          <th className="py-3 px-2">Description</th>
                          <th className="py-3 px-2 text-right">Amount</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-gray-300">
                        {trip.expenses.map((exp) => (
                          <tr key={exp.id} className="hover:bg-white/[0.01]">
                            <td className="py-3.5 px-2">{formatDate(exp.date)}</td>
                            <td className="py-3.5 px-2">
                              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[10px] font-semibold">
                                {exp.category}
                              </span>
                            </td>
                            <td className="py-3.5 px-2 max-w-[180px] truncate">{exp.description}</td>
                            <td className="py-3.5 px-2 text-right font-bold text-white">${exp.amount.toFixed(2)}</td>
                            <td className="py-3.5 px-2 text-right">
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="p-1 rounded bg-white/5 hover:bg-rose-500/10 border border-white/5 text-gray-500 hover:text-rose-400 transition-all"
                                title="Remove expense"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </main>
    </div>
  );
}
