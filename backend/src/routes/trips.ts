import { Router, Response } from 'express';
import Trip, { IDayPlan, IActivity } from '../models/Trip';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { generateTripData, regenerateDay } from '../services/gemini';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Apply auth middleware to all trip routes
router.use(authenticateToken);

// GET /api/trips - List all trips for the authenticated user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const trips = await Trip.find({ userId: req.userId }).sort({ createdAt: -1 });
    return res.status(200).json({ trips });
  } catch (error: any) {
    console.error('List trips error:', error);
    return res.status(500).json({ error: 'Server error retrieving trips.' });
  }
});

// GET /api/trips/:id - Get specific trip details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    // Strict user check for data isolation
    if (trip.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized access to this trip.' });
    }

    return res.status(200).json({ trip });
  } catch (error: any) {
    console.error('Get trip error:', error);
    return res.status(500).json({ error: 'Server error retrieving trip details.' });
  }
});

// POST /api/trips - Create new trip & generate itinerary with AI
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { destination, startDate, durationDays, budgetPreference, interests } = req.body;

    if (!destination || !startDate || !durationDays || !budgetPreference) {
      return res.status(400).json({ error: 'Destination, start date, duration, and budget preference are required.' });
    }

    const parsedDays = parseInt(durationDays, 10);
    if (isNaN(parsedDays) || parsedDays <= 0 || parsedDays > 30) {
      return res.status(400).json({ error: 'Duration must be a number between 1 and 30 days.' });
    }

    // Call Gemini Service to get AI Itinerary, Budget Estimation, and Hotels
    const aiData = await generateTripData(
      destination,
      parsedDays,
      budgetPreference,
      interests || []
    );

    // Create and save new trip
    const newTrip = new Trip({
      userId: req.userId,
      destination,
      startDate: new Date(startDate),
      durationDays: parsedDays,
      budgetPreference,
      interests: interests || [],
      aiItinerary: aiData.aiItinerary,
      estimatedBudget: aiData.estimatedBudget,
      hotels: aiData.hotels,
      expenses: [], // start with zero expenses
    });

    await newTrip.save();
    return res.status(201).json({ trip: newTrip });
  } catch (error: any) {
    console.error('Create trip error:', error);
    return res.status(500).json({ error: 'Server error creating trip and generating itinerary.' });
  }
});

// PUT /api/trips/:id - General update (e.g., manually edit activities, delete activity, add activity)
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    // Strict user check for data isolation
    if (trip.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized modification to this trip.' });
    }

    const { aiItinerary } = req.body;
    if (aiItinerary) {
      trip.aiItinerary = aiItinerary;
    }

    await trip.save();
    return res.status(200).json({ trip });
  } catch (error: any) {
    console.error('Update trip error:', error);
    return res.status(500).json({ error: 'Server error updating trip.' });
  }
});

// DELETE /api/trips/:id - Delete a trip
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    // Strict user check for data isolation
    if (trip.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized deletion of this trip.' });
    }

    await Trip.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: 'Trip deleted successfully.' });
  } catch (error: any) {
    console.error('Delete trip error:', error);
    return res.status(500).json({ error: 'Server error deleting trip.' });
  }
});

// POST /api/trips/:id/regenerate-day - Regenerate a specific day's activities with prompt
router.post('/:id/regenerate-day', async (req: AuthRequest, res: Response) => {
  try {
    const { dayNumber, prompt } = req.body;

    if (dayNumber === undefined || !prompt) {
      return res.status(400).json({ error: 'Day number and prompt are required.' });
    }

    const parsedDayNumber = parseInt(dayNumber, 10);
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    // Strict user check for data isolation
    if (trip.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized access to this trip.' });
    }

    // Find the dayplan to regenerate
    const dayPlan = trip.aiItinerary.find((d) => d.dayNumber === parsedDayNumber);
    if (!dayPlan) {
      return res.status(400).json({ error: `Day ${parsedDayNumber} is not part of this trip.` });
    }

    // Call Gemini Service to regenerate activities for this day
    const updatedActivities = await regenerateDay(
      trip.destination,
      parsedDayNumber,
      dayPlan.activities,
      trip.budgetPreference,
      trip.interests,
      prompt
    );

    // Update the activities inside the dayPlan
    dayPlan.activities = updatedActivities;

    // Trigger Mongoose to notice the array modification
    trip.markModified('aiItinerary');
    await trip.save();

    return res.status(200).json({ trip });
  } catch (error: any) {
    console.error('Regenerate day error:', error);
    return res.status(500).json({ error: 'Server error regenerating day plan.' });
  }
});

export default router;
