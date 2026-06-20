# Vagabond - AI Travel Planner

**Vagabond** is a full-stack web application that allows users to plan customized travel itineraries using an LLM AI agent. Users specify travel parameters (destination, duration, budget preference tier, interests), and the system generates structured daily activity schedules, hotel recommendations, and cost predictions. Additionally, Vagabond features an interactive **Trip Expense Tracker** (our creative feature) to monitor actual expenditures against AI estimates in real-time.

---

## 🚀 Tech Stack Justification
- **Frontend**: **Next.js 14+ (App Router)** and **Tailwind CSS**. Next.js enables smooth page routing, Server/Client component separation for optimized performance, and easy deployment to platforms like Vercel. Tailwind CSS enables custom-designed interfaces using tokens.
- **Backend**: **Node.js + Express (TypeScript)**. Providing a modular, typed REST API using clean routing architecture and Mongoose ODM.
- **Database**: **MongoDB**. Allows flexible document storage for nested trip models (itinerary days, activities list, hotels array, logged expense logs) without complex relational joins.
- **AI Agent**: **Google Gemini 1.5 Flash (via `@google/generative-ai` SDK)**. Used to parse travel requests and return structured, parsed JSON itineraries, budgets, and stays.

---

## 📂 High-Level Architecture & Schemas

### Folder Layout
```text
/backend
  ├── src/
  │    ├── models/        # Mongoose User and Trip models
  │    ├── routes/        # Auth, Trips, and Expense API endpoints
  │    ├── middleware/    # Auth JWT validation guard
  │    ├── services/      # Gemini integration with fallback mock generator
  │    └── index.ts       # Server initialization
  ├── tests/              # Native API integration sanity tests
  ├── tsconfig.json
  └── package.json
/frontend
  ├── src/
  │    ├── app/           # App router layouts, page components
  │    ├── context/       # AuthProvider session state
  │    └── utils/         # Backend API client client fetches
  ├── tsconfig.json
  └── package.json
```

### Key Database Models (Mongoose)
1. **User Model**: Stores name, unique email, and hashed password.
2. **Trip Model**: Stores trip settings and nested schemas:
   - `aiItinerary`: Array of Days, each containing an array of Activities (time, title, description).
   - `estimatedBudget`: Estimated cost by category (Flights, Accommodation, Food, Activities, Other).
   - `hotels`: 3 recommended lodging options (Budget, Mid-Range, Luxury).
   - `expenses` (Custom Feature): Actual traveler expenditures logged on the go.

---

## 🔒 Authentication & Authorization (Strict Data Isolation)
- **Hashing**: Passwords are encrypted on signup using `bcryptjs` (10 salt rounds).
- **JWT sessions**: On login, a JSON Web Token is signed with the user ID (`userId`) and returned. The frontend stores it in `localStorage` and appends it to subsequent request headers as `Authorization: Bearer <token>`.
- **Protected Access**: An Express authentication middleware validates the token signature and extracts the `userId`.
- **Strict Isolation**: In every CRUD trip route and expense router endpoint, the system checks:
  ```typescript
  if (trip.userId.toString() !== req.userId) {
    return res.status(403).json({ error: "Unauthorized access to this trip." });
  }
  ```
  This ensures users can only read, edit, or delete their own trips.

---

## 🧠 AI Agent Design & Prompt Engineering
The system communicates with the **Gemini 1.5 Flash** model via the official `@google/generative-ai` SDK.
1. **Itinerary & Cost Prompting**: The system issues a system prompt describing the schema interface constraints (exactly 3 activities per day, 3 hotels with specified price tiers, and realistic estimated budget numbers). It specifies returning raw JSON data to avoid parsing markdown artifacts.
2. **Day Regeneration**: The agent takes the user’s customization prompt (e.g., *"Make it all parks and museum walks"*), reads the current activities for that day, and asks Gemini to generate a revised 3-activity array while keeping other days intact.
3. **High-Fidelity Fallback**: If no `GEMINI_API_KEY` is present or if the API limit is hit, the backend falls back to a mock generator. This matches destinations (e.g., Tokyo, Paris) to realistic hotels, activities, and budget estimations, ensuring the app remains fully functional during offline or sandbox testing.

---

## 💡 Creative Feature: Smart Expense Tracker & Budget Comparison
AI-generated budgets are useful, but managing actual trip spend is where travel planning becomes highly operational. 
- **What it does**: In the trip detailed view, users can log real expenses (e.g., flight booking, dinner, museum entry) select a category, and describe the spend.
- **Problem solved**: Travelers can compare their **actual spend** against the **AI's estimated budget** category-by-category.
- **UI Visuals**: Includes sleek progress bars showing percentage limits by category. If the user exceeds the estimate, a rose-colored alarm indicates they are over budget, suggesting they trim down future dinners or shopping.

---

## ⚙️ Setup & Installation Instructions

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### 1. Backend Setup
1. Open a terminal, go to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set environment variables. Create or edit `.env` in the `/backend` folder:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/ai-travel-planner
   JWT_SECRET=supersecretjwtkeychangeinprod
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY
   ```
   *(Note: Leave GEMINI_API_KEY blank or set to placeholder to run the Mock AI engine fallback).*
4. Run in development mode:
   ```bash
   npm run dev
   ```
5. Run automated tests (in a separate terminal inside `/backend` while server is running):
   ```bash
   node tests/api.test.js
   ```

### 2. Frontend Setup
1. Go to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run in development mode:
   ```bash
   npm run dev
   ```
4. Access the web app at `http://localhost:3000`.

---

## ⚠️ Known Limitations
- **Offline Mocking**: The mock data engine has custom templates for `Tokyo` and `Paris` and fallback generic templates for other destinations.
- **Static Map Integration**: In this assessment version, locations are named textually. Real-world applications would map these to Google Maps API coordinates.
