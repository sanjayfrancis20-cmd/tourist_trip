import { GoogleGenerativeAI } from '@google/generative-ai';
import { IActivity, IDayPlan, IBudgetCategory, IHotel } from '../models/Trip';
import { v4 as uuidv4 } from 'uuid';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Mock database of travel plans to use as fallback if Gemini API is not configured
const MOCK_DESTINATIONS: Record<string, {
  hotels: IHotel[];
  activities: string[];
  budgetEstimates: Record<string, number[]>;
}> = {
  tokyo: {
    hotels: [
      { name: 'Hotel Sakura Tokyo', priceTier: 'Budget Friendly', rating: 4.2, description: 'Affordable, clean rooms near public transit in Asakusa.' },
      { name: 'Shinjuku Grand Hotel', priceTier: 'Mid Range', rating: 4.5, description: 'Conveniently located in the heart of Shinjuku with city views.' },
      { name: 'Tokyo Imperial Palace Hotel', priceTier: 'Luxury', rating: 4.9, description: 'Exquisite premium rooms overlooking the Imperial Palace gardens.' },
    ],
    activities: [
      'Visit Senso-ji Temple in Asakusa',
      'Explore Tsukiji Outer Market for fresh sushi breakfast',
      'Walk across Shinjuku Gyoen National Garden',
      'Experience the famous Shibuya Crossing',
      'Visit Meiji Jingu Shrine and shop in Harajuku',
      'Tour Tokyo Skytree for a panoramic city view',
      'Explore Akihabara Electric Town and anime shops',
      'Stroll through Ueno Park and visit the Tokyo National Museum',
      'Enjoy dinner at a traditional Izakaya in Golden Gai',
      'Visit teamLab Planets digital art exhibition',
    ],
    budgetEstimates: {
      Low: [250, 200, 100, 50, 40], // Flights, Lodging, Food, Activities, Other (per day/trip values)
      Medium: [500, 450, 200, 120, 80],
      High: [1200, 1500, 500, 300, 200],
    }
  },
  paris: {
    hotels: [
      { name: 'Montmartre Boutique Hostel', priceTier: 'Budget Friendly', rating: 4.1, description: 'Charming artistic hostel located on the slopes of Montmartre.' },
      { name: 'Le Marais Grand Plaza', priceTier: 'Mid Range', rating: 4.6, description: 'Modern rooms within walking distance to Louvre Museum and Notre Dame.' },
      { name: 'Hotel Ritz Paris', priceTier: 'Luxury', rating: 4.9, description: 'World-famous luxury hotel on Place Vendôme offering royal elegance.' },
    ],
    activities: [
      'Visit the Eiffel Tower and Champ de Mars',
      'Explore the Louvre Museum art galleries',
      'Walk down the historic Champs-Élysées',
      'Visit the Notre-Dame Cathedral and Seine River banks',
      'Explore the artistic neighborhood of Montmartre and Sacré-Cœur',
      'Take a day trip to the Palace of Versailles',
      'Stroll through the Jardin du Luxembourg',
      'Enjoy French pastries at a local boulangerie in Le Marais',
      'Visit Musée d\'Orsay for Impressionist masterpieces',
      'Take a sunset cruise along the Seine River',
    ],
    budgetEstimates: {
      Low: [300, 250, 120, 60, 50],
      Medium: [600, 500, 250, 150, 100],
      High: [1400, 1800, 600, 400, 250],
    }
  }
};

const DEFAULT_MOCK = {
  hotels: [
    { name: 'Comfort Lodge', priceTier: 'Budget Friendly', rating: 4.0, description: 'Cozy and cost-effective lodging options.' },
    { name: 'Metropolitan Suites', priceTier: 'Mid Range', rating: 4.4, description: 'Comfortable rooms with standard amenities.' },
    { name: 'The Grand Resort & Spa', priceTier: 'Luxury', rating: 4.8, description: 'Five-star luxury experience with exceptional hospitality.' },
  ],
  activities: [
    'Explore the downtown historical center',
    'Enjoy local cuisine at top-rated dining spots',
    'Visit the botanical garden and central park',
    'Shop at local artisan markets',
    'Take a guided walking tour of main sights',
    'Visit the prominent museum of art and history',
    'Relax at a scenic cafe or viewpoint',
    'Experience the local nightlife and music scene',
  ],
  budgetEstimates: {
    Low: [200, 150, 80, 40, 30],
    Medium: [450, 350, 180, 100, 70],
    High: [1000, 1000, 400, 250, 150],
  }
};

function getMockData(destination: string, days: number, budgetPreference: 'Low' | 'Medium' | 'High', interests: string[]) {
  const destKey = destination.toLowerCase().trim();
  const template = MOCK_DESTINATIONS[destKey] || DEFAULT_MOCK;
  
  // 1. Generate budget
  const baseBudget = template.budgetEstimates[budgetPreference];
  const mult = days;
  const estimatedBudget: IBudgetCategory[] = [
    { category: 'Flights', amount: Math.round(baseBudget[0]) },
    { category: 'Accommodation', amount: Math.round(baseBudget[1] * mult) },
    { category: 'Food', amount: Math.round(baseBudget[2] * mult) },
    { category: 'Activities', amount: Math.round(baseBudget[3] * mult) },
    { category: 'Other', amount: Math.round(baseBudget[4] * mult) },
  ];

  // 2. Generate Hotels
  const hotels = template.hotels;

  // 3. Generate Day Plans
  const aiItinerary: IDayPlan[] = [];
  const acts = [...template.activities];
  
  // Shuffle mock activities to give variability
  acts.sort(() => Math.random() - 0.5);

  const times = ['09:00 AM', '01:30 PM', '04:00 PM', '07:30 PM'];

  for (let d = 1; d <= days; d++) {
    const dayActivities: IActivity[] = [];
    
    // Add 3 activities per day
    for (let actIdx = 0; actIdx < 3; actIdx++) {
      const activityIndex = ((d - 1) * 3 + actIdx) % acts.length;
      let activityText = acts[activityIndex];
      
      // Inject interests into the texts slightly to make it look responsive
      if (interests.length > 0 && actIdx === 2) {
        const selectedInterest = interests[d % interests.length];
        activityText += ` (Focused on ${selectedInterest})`;
      }

      dayActivities.push({
        id: uuidv4(),
        time: times[actIdx % times.length],
        title: activityText,
        description: `Enjoy a fantastic experience exploring ${destination}. Make sure to take photos and sample local delicacies.`
      });
    }

    aiItinerary.push({
      dayNumber: d,
      activities: dayActivities
    });
  }

  return { aiItinerary, estimatedBudget, hotels };
}

// Cleans JSON response from LLM (removes markdown backticks if returned)
function parseJSONResponse(rawText: string) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```$/, '');
  }
  return JSON.parse(cleaned);
}

export async function generateTripData(
  destination: string,
  durationDays: number,
  budgetPreference: 'Low' | 'Medium' | 'High',
  interests: string[]
): Promise<{ aiItinerary: IDayPlan[]; estimatedBudget: IBudgetCategory[]; hotels: IHotel[] }> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    console.log(`[AI Travel Planner] Using Mock AI engine for ${destination} (${durationDays} days)`);
    return getMockData(destination, durationDays, budgetPreference, interests);
  }

  try {
    console.log(`[AI Travel Planner] Generating itinerary via Gemini API for ${destination}`);
    const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Use gemini-1.5-flash as default
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are an expert AI Travel Planner. Generate a detailed, personalized travel plan for a trip.

Input Details:
- Destination: ${destination}
- Duration: ${durationDays} days
- Budget Tier: ${budgetPreference} (Low = budget conscious, Medium = balanced, High = luxury/premium)
- Interests: ${interests.join(', ')}

Return a JSON object conforming exactly to the following TypeScript interfaces. Do not include markdown code block syntax (like \`\`\`json) in the response. Return raw JSON only.

Interface definition:
interface Response {
  estimatedBudget: Array<{
    category: 'Flights' | 'Accommodation' | 'Food' | 'Activities' | 'Other';
    amount: number; // Estimated cost in USD for the entire trip
  }>;
  hotels: Array<{
    name: string;
    priceTier: 'Budget Friendly' | 'Mid Range' | 'Luxury';
    rating: number; // Value between 1.0 and 5.0
    description: string;
  }>; // Suggest exactly three hotels: one Budget Friendly, one Mid Range, and one Luxury.
  aiItinerary: Array<{
    dayNumber: number;
    activities: Array<{
      id: string; // generate a random unique string ID
      time: string; // e.g., '09:00 AM', '02:00 PM'
      title: string;
      description: string;
    }>;
  }>;
}

Constraints:
- Provide exactly 3 activities per day.
- Estimated costs should reflect realistic prices for ${destination} based on ${durationDays} days and ${budgetPreference} budget.
- Hotel suggestions must be real or highly realistic for ${destination}.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = parseJSONResponse(responseText);

    // Sanitize generated IDs if they aren't unique or defined
    if (parsed.aiItinerary) {
      parsed.aiItinerary = parsed.aiItinerary.map((day: any) => ({
        ...day,
        activities: day.activities.map((act: any) => ({
          ...act,
          id: act.id || uuidv4()
        }))
      }));
    }

    return parsed;
  } catch (error) {
    console.error('Gemini API Error, falling back to Mock AI:', error);
    return getMockData(destination, durationDays, budgetPreference, interests);
  }
}

export async function regenerateDay(
  destination: string,
  dayNumber: number,
  currentActivities: IActivity[],
  budgetPreference: 'Low' | 'Medium' | 'High',
  interests: string[],
  userPrompt: string
): Promise<IActivity[]> {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    console.log(`[AI Travel Planner] Using Mock AI engine to regenerate Day ${dayNumber}`);
    
    // Simulate modification based on prompt
    const mockUpdates: IActivity[] = currentActivities.map((act, idx) => {
      if (idx === 0) {
        return {
          id: uuidv4(),
          time: '09:30 AM',
          title: `Custom activity: ${userPrompt.substring(0, 40)}`,
          description: `Enjoyed this activity specifically customized based on request: "${userPrompt}"`
        };
      }
      return act;
    });
    return mockUpdates;
  }

  try {
    console.log(`[AI Travel Planner] Regenerating Day ${dayNumber} via Gemini API`);
    const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const currentActivitiesStr = JSON.stringify(currentActivities, null, 2);

    const prompt = `
You are an expert AI Travel Planner. The user wants to modify Day ${dayNumber} of their trip to ${destination}.

Current Activities for Day ${dayNumber}:
${currentActivitiesStr}

Selected Interests: ${interests.join(', ')}
Budget Preference: ${budgetPreference}

User Request for changes on Day ${dayNumber}:
"${userPrompt}"

Generate a new, revised set of 3 activities for Day ${dayNumber} that incorporates the user's request. Return a raw JSON array of activities conforming to this structure:
[
  {
    "id": "string-uuid",
    "time": "09:00 AM",
    "title": "New activity title matching the request",
    "description": "Engaging description of this activity"
  }
]

Do not return any markdown code block formatting. Return raw JSON array only. Ensure new UUIDs are generated for the new activities.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = parseJSONResponse(responseText);

    if (Array.isArray(parsed)) {
      return parsed.map((act: any) => ({
        ...act,
        id: act.id || uuidv4()
      }));
    }
    throw new Error('Response is not a valid array of activities');
  } catch (error) {
    console.error('Gemini API Day Regeneration Error, falling back to mock:', error);
    
    return currentActivities.map((act, idx) => {
      if (idx === 0) {
        return {
          id: uuidv4(),
          time: '09:30 AM',
          title: `Modified activity incorporating: ${userPrompt}`,
          description: `Custom activity adapted for: ${userPrompt}`
        };
      }
      return act;
    });
  }
}
