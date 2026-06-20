import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity {
  id: string;
  time: string;
  title: string;
  description: string;
}

export interface IDayPlan {
  dayNumber: number;
  activities: IActivity[];
}

export interface IBudgetCategory {
  category: 'Flights' | 'Accommodation' | 'Food' | 'Activities' | 'Other';
  amount: number;
}

export interface IHotel {
  name: string;
  priceTier: 'Budget Friendly' | 'Mid Range' | 'Luxury';
  rating: number;
  description: string;
}

export interface IExpense {
  id: string;
  category: 'Flights' | 'Accommodation' | 'Food' | 'Activities' | 'Other';
  amount: number;
  description: string;
  date: Date;
}

export interface ITrip extends Document {
  userId: mongoose.Types.ObjectId;
  destination: string;
  startDate: Date;
  durationDays: number;
  budgetPreference: 'Low' | 'Medium' | 'High';
  interests: string[];
  aiItinerary: IDayPlan[];
  estimatedBudget: IBudgetCategory[];
  hotels: IHotel[];
  expenses: IExpense[];
  createdAt: Date;
}

const ActivitySchema = new Schema({
  id: { type: String, required: true },
  time: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
});

const DayPlanSchema = new Schema({
  dayNumber: { type: Number, required: true },
  activities: [ActivitySchema],
});

const BudgetCategorySchema = new Schema({
  category: { type: String, enum: ['Flights', 'Accommodation', 'Food', 'Activities', 'Other'], required: true },
  amount: { type: Number, required: true },
});

const HotelSchema = new Schema({
  name: { type: String, required: true },
  priceTier: { type: String, enum: ['Budget Friendly', 'Mid Range', 'Luxury'], required: true },
  rating: { type: Number, required: true },
  description: { type: String, required: true },
});

const ExpenseSchema = new Schema({
  id: { type: String, required: true },
  category: { type: String, enum: ['Flights', 'Accommodation', 'Food', 'Activities', 'Other'], required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

const TripSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  durationDays: { type: Number, required: true },
  budgetPreference: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  interests: [{ type: String }],
  aiItinerary: [DayPlanSchema],
  estimatedBudget: [BudgetCategorySchema],
  hotels: [HotelSchema],
  expenses: { type: [ExpenseSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<ITrip>('Trip', TripSchema);
