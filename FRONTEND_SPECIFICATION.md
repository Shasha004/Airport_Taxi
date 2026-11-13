# Airport Taxi → Ride Offers: Frontend UI & Endpoint Specification (Part 1)

This document provides the complete specification of all **API endpoints**, **UI screens**, **components**, and **elements** needed for Part 1 (Traveler Module) of the application.

> **Saved Text File:** A plain text version has also been created at [FRONTEND_SPECIFICATION.txt](file:///e:/Airport_Taxi/airport-taxi-ride-offers/FRONTEND_SPECIFICATION.txt).

---

## 1. Backend Endpoints Consumed by Frontend

Base URL: `http://localhost:5000/api` (In Vite dev mode, `/api` is proxied to port 5000).

| Method | Endpoint | Query / Body Params | Purpose |
|---|---|---|---|
| `GET` | `/api/catalog/flights` | Optional: `?to=NRT`, `?date=...`, `?all=true` | Populate the arrival flights dropdown |
| `GET` | `/api/catalog/hotels` | Optional: `?city=Tokyo`, `?area=Ueno` | Populate the destination hotels dropdown |
| `GET` | `/api/catalog/airports` | None | Fetch airports and `serves_cities` for compatibility |
| `GET` | `/api/catalog/suppliers` | None | Fetch registered taxi companies and fleets |
| `GET` | `/api/routes/price-range` | Required: `?flightId=FL-401&hotelId=HTL-TYO-004` | Returns `price_min_inr`, `price_max_inr`, distance, drive duration, or R1 error |
| `POST` | `/api/ride-requests` | JSON Body (see below) | Validate R1/R2/R3, generate `REQ-XXXX`, save to SQLite |
| `GET` | `/api/ride-requests` | Optional: `?status=open` | List requests for dashboard |
| `GET` | `/api/ride-requests/:id` | Path param: `:id` | Retrieve single request with enriched details |

### Example POST `/api/ride-requests` Payload
```json
{
  "travelerName": "Menon family",
  "flightId": "FL-401",
  "hotelId": "HTL-TYO-004",
  "adults": 2,
  "childAges": [6],
  "largeBags": 3,
  "smallBags": 2,
  "pickupTime": "2027-04-10T11:30:00",
  "travelerPrice": 12000,
  "carType": "SEDAN"
}
```

---

## 2. Frontend UI Screens & Elements Breakdown

### A. Navigation Bar (`Navbar.jsx`)
- **Branding:** Logo icon (Car + Airplane) + Title ("Airport Taxi") + Subtitle ("RIDE OFFERS").
- **Navigation links:**
  - `Select Role` (`/`)
  - `Traveler Dashboard` (`/traveler`)
  - `Post Ride Request` (Primary button CTA, `/traveler/create`)

---

### B. Screen 1: Role Selection Landing Page (`LandingPage.jsx`)
**Route:** `/`

1. **Hero Section:**
   - Badge: `Airport Ride Offers Platform • Part 1`
   - Main Headline: `Seamless Airport Transfers with Transparent Pricing`
   - Description paragraph introducing the dual-sided workflow.
2. **Role Cards Grid:**
   - **Card 1: Traveler Portal (Active)**
     - Badge: `Active • Part 1` (Green)
     - Icon: `UserCheck`
     - Title: `Traveler Portal`
     - Subtitle: `Family & Business Airport Transfers`
     - Features list: Catalog selection, 60-min landing validation (R2), price range limits (R3), passenger & bag validation (R1).
     - Action button: `Enter as Traveler` → navigates to `/traveler`.
   - **Card 2: Taxi Supplier Portal (Preview)**
     - Badge: `Coming in Part 2` (Gray)
     - Icon: `Building2`
     - Title: `Taxi Supplier Portal`
     - Subtitle: `Fleet Management & Ride Matching`
     - Features list: Airport & area filtering (R4), car seating & luggage fit (R5), busy window scheduling (R6), price bidding (R7).
     - Action button: `Supplier Portal (Part 2)` → disabled.
3. **Rule Guarantee Highlights:**
   - R1 enforcement summary card.
   - R2 60-minute pickup buffer card.
   - R3 authoritative route price limits card.

---

### C. Screen 2: Traveler Dashboard (`TravelerDashboard.jsx`)
**Route:** `/traveler`

1. **Dashboard Header:**
   - Title: `Traveler Dashboard`
   - Subtitle: `Manage your airport ride requests and track status in real-time`
   - `Refresh` button: Reloads from `GET /api/ride-requests`.
   - `Create New Ride` button: Primary CTA navigating to `/traveler/create`.
2. **Filter Tabs:**
   - `All Requests (N)`
   - `Open Requests`
3. **State Displays:**
   - **Loading State:** Spinner with "Loading your ride requests..."
   - **Error Banner:** Red alert if request fetching fails.
   - **Empty State:** Airplane icon, "No Ride Requests Found", and "Post Your First Ride" button.
4. **Ride Request Card Elements:**
   - **Top bar:** Request ID badge (`REQ-0001`, `REQ-10457637`), Traveler Name tag (`Menon family`), Status pill (`OPEN` with pulsing status indicator).
   - **Route banner:**
     - Left: Flight number, airline, origin ➔ destination airport.
     - Middle: Arrow (`→`).
     - Right: Hotel name, city, and area.
   - **Details 2-column grid:**
     - **Pickup Time:** Local date & time formatted (`Apr 10, 2027, 11:30 AM`).
     - **Passengers:** Adults count, children count with age breakdown (`2 Adults + 1 Child (6y) (3 seats)`).
     - **Luggage:** Large bags & small bags (`3 Large, 2 Small`).
     - **Car Preference:** Vehicle type badge if specified (e.g. `SEDAN`).
     - **Drive Duration:** Estimated minutes & distance (`~90 mins (73.3 km)`).
   - **Price Footer:**
     - Proposed Price in large bold text (`₹12,000`).
     - Route Price Range reference (`₹10,200 – ₹16,800`).

---

### D. Screen 3: Create Ride Request Page (`CreateRidePage.jsx`)
**Route:** `/traveler/create`

1. **Header & Fast Demo Preset:**
   - `Back to Dashboard` link.
   - Title: `Request an Airport Taxi`.
   - Demo Shortcut button: **`Load Menon Family Demo (FL-401)`** — pre-populates all inputs matching the official problem scenario.
2. **Notification Cards:**
   - **Success Card:** Appears after successful creation, displaying the generated Request ID, summary details, and buttons to view Dashboard or post another ride.
   - **Error Banner:** Red alert box showing detailed client or server validation errors.
3. **Form Section 1: Flight & Hotel (R1)**
   - `Traveler / Group Name`: Text input (e.g. `Menon family`).
   - `Arrival Flight`: Select dropdown showing `{flight_number} ({airline}) — {from} ➔ {to} | Lands: {arrival_local}`.
   - `Flight Preview Pill`: Shows Airline, Origin, Destination, Landing time.
   - `Destination Hotel`: Select dropdown showing `{name} — {city} ({area})`.
   - `Hotel Preview Pill`: Shows City, Area, Rating.
   - **Dynamic Route Status Card:**
     - While calculating: Spinner and "Verifying route compatibility & calculating price range...".
     - Incompatible (R1 Error): Red alert explaining why arrival airport doesn't serve the hotel's city.
     - Compatible (Verified): Green card with Airport, City/Area, Distance (km), Duration (mins), and Allowed Price Range (`₹min – ₹max`).
4. **Form Section 2: Passengers & Baggage (R1)**
   - `Adults (Aged 18+)`: Number input (`min="1"`, step 1).
   - `Children (Aged 0–17)` Dynamic List:
     - Header with `+ Add Child` button.
     - For each child: `Child #N Age` number input (`min="0"`, `max="17"`) and remove button (`×`).
     - If no children: "No children in travel group".
   - `Large Bags`: Number input (`min="0"`).
   - `Small Bags`: Number input (`min="0"`).
5. **Form Section 3: Pickup Time (R2)**
   - `Pickup Time`: `datetime-local` input.
   - `min` attribute: Automatically bound to `flight.arrival_local + 60 minutes`.
   - Default value: Auto-set to `flight.arrival_local + 60 minutes`.
   - Info Box: `Flight lands at {arrival_local}. Earliest valid pickup is {earliestPickup}.`
6. **Form Section 4: Proposed Price & Preferences (R3)**
   - `Proposed Price (INR ₹)`: Number input with `₹` currency prefix.
   - Live Status Badge: `✓ Within range` (green) or `✕ Out of range` (red).
   - Helper label: Displays `Allowed Range: ₹min to ₹max`.
   - `Car Type Preference`: Select dropdown with options `Any`, `Hatchback`, `Sedan`, `SUV`, `Bus`.
7. **Form Submission Actions:**
   - `Cancel` button (navigates back to dashboard).
   - `Submit Ride Request` button (shows loading spinner while submitting, disabled if route is incompatible).

---

## 3. Rules Enforced on UI

- **R1:** Airport must serve hotel's city; minimum 1 adult; children aged 0–17 only.
- **R2:** Pickup time must be $\ge$ 60 minutes after landing time; auto-defaulted to landing + 60m.
- **R3:** Proposed price must be $\ge \text{price\_min\_inr}$ and $\le \text{price\_max\_inr}$.

