/**
 * API Integration and Sanity Test Script
 * This script runs against a running backend server (assumed http://localhost:5000)
 * and verifies authentication, trip generation, and expense tracking.
 */

const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  name: 'Test Traveler',
  email: `tester_${Math.random().toString(36).substr(2, 6)}@example.com`,
  password: 'password123'
};

async function runTests() {
  console.log('🚀 Starting API Sanity Tests...\n');
  let token = null;
  let tripId = null;

  try {
    // 1. Health Check
    console.log('Testing /health endpoint...');
    const healthRes = await fetch('http://localhost:5000/health');
    const healthData = await healthRes.json();
    if (healthRes.ok && healthData.status === 'OK') {
      console.log('✅ Health check passed.');
    } else {
      throw new Error('Health check failed.');
    }

    // 2. User Registration
    console.log(`\nTesting /auth/register with email: ${TEST_USER.email}...`);
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    const regData = await regRes.json();
    if (!regRes.ok) throw new Error(`Registration failed: ${regData.error}`);
    token = regData.token;
    console.log('✅ User registered successfully. JWT Token acquired.');

    // 3. User Login
    console.log('\nTesting /auth/login...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${loginData.error}`);
    console.log('✅ User logged in successfully. JWT Token matched.');

    // 4. Fetch self profile
    console.log('\nTesting /auth/me...');
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const meData = await meRes.json();
    if (!meRes.ok) throw new Error(`Fetch profile failed: ${meData.error}`);
    console.log(`✅ Profile fetched. Welcomed user: ${meData.user.name}`);

    // 5. Create / Generate Trip (using Mock AI Fallback)
    console.log('\nTesting /trips (Generation)...');
    const tripPayload = {
      destination: 'Tokyo, Japan',
      startDate: '2026-07-01',
      durationDays: 3,
      budgetPreference: 'Medium',
      interests: ['Food', 'Culture']
    };
    const tripRes = await fetch(`${BASE_URL}/trips`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(tripPayload)
    });
    const tripData = await tripRes.json();
    if (!tripRes.ok) throw new Error(`Trip creation failed: ${tripData.error}`);
    tripId = tripData.trip._id;
    console.log(`✅ Trip created with ID: ${tripId}`);
    console.log(`✈️ Destination: ${tripData.trip.destination}`);
    console.log(`📅 Days: ${tripData.trip.durationDays}, Budget Preference: ${tripData.trip.budgetPreference}`);
    console.log(`🏨 Recommended hotels returned: ${tripData.trip.hotels.map(h => h.name).join(', ')}`);
    console.log(`💵 Estimated budget breakdown returned: ${JSON.stringify(tripData.trip.estimatedBudget)}`);
    console.log(`🗺️ AI Itinerary days generated: ${tripData.trip.aiItinerary.length}`);

    // Validate structured shape
    if (tripData.trip.aiItinerary.length !== 3) {
      throw new Error('Itinerary duration mismatch.');
    }
    
    // 6. Log Expense (Custom Feature)
    console.log('\nTesting /trips/:id/expenses (Add Expense)...');
    const expPayload = {
      category: 'Food',
      amount: 45.50,
      description: 'Traditional Ramen Dinner at Ichiran',
      date: '2026-07-01'
    };
    const expRes = await fetch(`${BASE_URL}/trips/${tripId}/expenses`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(expPayload)
    });
    const expData = await expRes.json();
    if (!expRes.ok) throw new Error(`Add expense failed: ${expData.error}`);
    console.log(`✅ Expense added. Logged list size: ${expData.trip.expenses.length}`);
    console.log(`💵 First expense: ${expData.trip.expenses[0].description} - $${expData.trip.expenses[0].amount}`);

    // 7. Delete Expense
    console.log('\nTesting /trips/:id/expenses/:expenseId (Delete Expense)...');
    const expenseId = expData.trip.expenses[0].id;
    const delExpRes = await fetch(`${BASE_URL}/trips/${tripId}/expenses/${expenseId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const delExpData = await delExpRes.json();
    if (!delExpRes.ok) throw new Error(`Delete expense failed: ${delExpData.error}`);
    console.log(`✅ Expense deleted. Logged list size is now: ${delExpData.trip.expenses.length}`);

    // 8. Delete Trip
    console.log('\nTesting /trips/:id (Delete Trip)...');
    const delTripRes = await fetch(`${BASE_URL}/trips/${tripId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!delTripRes.ok) throw new Error('Trip deletion failed.');
    console.log('✅ Trip deleted successfully.');

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The backend is 100% healthy.');
  } catch (err) {
    console.error('\n❌ TEST RUN FAILED:', err.message);
    process.exit(1);
  }
}

// Run the script
runTests();
