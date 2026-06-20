const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Activity {
  id: string;
  time: string;
  title: string;
  description: string;
}

export interface DayPlan {
  dayNumber: number;
  activities: Activity[];
}

export interface BudgetCategory {
  category: 'Flights' | 'Accommodation' | 'Food' | 'Activities' | 'Other';
  amount: number;
}

export interface Hotel {
  name: string;
  priceTier: 'Budget Friendly' | 'Mid Range' | 'Luxury';
  rating: number;
  description: string;
}

export interface Expense {
  id: string;
  category: 'Flights' | 'Accommodation' | 'Food' | 'Activities' | 'Other';
  amount: number;
  description: string;
  date: string;
}

export interface Trip {
  _id: string;
  destination: string;
  startDate: string;
  durationDays: number;
  budgetPreference: 'Low' | 'Medium' | 'High';
  interests: string[];
  aiItinerary: DayPlan[];
  estimatedBudget: BudgetCategory[];
  hotels: Hotel[];
  expenses: Expense[];
  createdAt: string;
}

// Get JWT from localStorage
const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Auth
  async register(name: string, email: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch user profile');
    return data.user;
  },

  // Trips
  async getTrips(): Promise<Trip[]> {
    const res = await fetch(`${API_BASE_URL}/trips`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch trips');
    return data.trips;
  },

  async getTrip(id: string): Promise<Trip> {
    const res = await fetch(`${API_BASE_URL}/trips/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch trip details');
    return data.trip;
  },

  async createTrip(tripData: {
    destination: string;
    startDate: string;
    durationDays: number;
    budgetPreference: 'Low' | 'Medium' | 'High';
    interests: string[];
  }): Promise<Trip> {
    const res = await fetch(`${API_BASE_URL}/trips`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(tripData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create trip');
    return data.trip;
  },

  async updateTripItinerary(id: string, aiItinerary: DayPlan[]): Promise<Trip> {
    const res = await fetch(`${API_BASE_URL}/trips/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ aiItinerary }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update trip');
    return data.trip;
  },

  async deleteTrip(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/trips/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete trip');
  },

  async regenerateDay(id: string, dayNumber: number, prompt: string): Promise<Trip> {
    const res = await fetch(`${API_BASE_URL}/trips/${id}/regenerate-day`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ dayNumber, prompt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to regenerate day');
    return data.trip;
  },

  // Expenses
  async addExpense(
    tripId: string,
    expenseData: {
      category: 'Flights' | 'Accommodation' | 'Food' | 'Activities' | 'Other';
      amount: number;
      description: string;
      date?: string;
    }
  ): Promise<Trip> {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}/expenses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(expenseData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add expense');
    return data.trip;
  },

  async deleteExpense(tripId: string, expenseId: string): Promise<Trip> {
    const res = await fetch(`${API_BASE_URL}/trips/${tripId}/expenses/${expenseId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete expense');
    return data.trip;
  },
};
