# Airport Taxi - Ride Offers Platform

Platform for connecting airport travelers with taxi suppliers for negotiated ride offers. Built for the Intern Hackathon (Problem 2).

## Features
- **Traveler Flow (Part 1 - Complete)**: Select arrival flight & hotel from catalog, see suggested route price ranges, post ride requests with custom offer prices within inclusive boundaries, and view request statuses on the dashboard.
- **Supplier Flow (Part 2 - Upcoming)**: View eligible ride requests based on airport/operating area/hours, assign cars within the route price limits, and handle booking updates.
- **Rules Engine (R1, R2, R3)**: Validates passenger capacity, bag constraints, airport-city connectivity, pickup lead times, and car availability windows.
- **Booking & Changes**: Generates a 10-digit booking reference and handles flight/pickup change requests.

## Tech Stack
- **Backend:** Node.js, Express.js (REST APIs)
- **Database:** SQLite with `better-sqlite3` (WAL mode enabled, robust file-based persistence)
- **Frontend:** React.js 19 with Vite, React Router v7, Lucide Icons
- **Styling:** Custom responsive CSS design system

---

## Quick Start (Start in 1–2 Commands)

### 1. Start the Backend Server
```bash
cd backend
npm start
```
The backend server runs on `http://localhost:5000`.
- Automatically loads all JSON catalog datasets (`flights.json`, `hotels.json`, `airports.json`, `routes.json`, `taxi_companies.json`, `booked_rides.json`, `open_requests.json`).
- Initializes SQLite database (`airport_taxi.db`) and seeds initial open requests.
- Serves the compiled production React frontend directly from `http://localhost:5000`.

### 2. (Optional) Run Frontend in Vite Dev Mode
```bash
cd client
npm run dev
```
The Vite development server runs on `http://localhost:5173` and proxies all `/api` requests to `http://localhost:5000`.

---

## Run Automated Rule & Integration Tests

A comprehensive integration test suite verifies R1, R2, R3, catalog APIs, pricing calculations, and SQLite persistence:

```bash
cd backend
npm test
```

---

## Project Structure

```text
Airport_Taxi/
├── client/                              # Frontend React + Vite application
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js                   # Centralized Axios API client
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Navigation bar with branding & active role
│   │   │   └── RoleCard.jsx             # Role selection cards (Traveler & Supplier)
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx          # Role selection landing page
│   │   │   └── traveler/
│   │   │       ├── TravelerDashboard.jsx# Request listing, status, route & pricing stats
│   │   │       └── CreateRidePage.jsx   # Form with real-time R1/R2/R3 validation
│   │   ├── App.jsx                      # App router configuration
│   │   ├── main.jsx                     # Vite React entry point with BrowserRouter
│   │   └── index.css                    # Modern UI styles & responsive layout
│   └── package.json
│
├── frontend/                            # Standalone landing page assets & components
│   └── landingpage/
│
├── backend/                             # Backend Node.js + Express + SQLite server
│   ├── src/
│   │   ├── app.js                       # Express app, CORS, routes & static client serving
│   │   ├── server.js                    # Server bootstrap, dataset loading, DB init
│   │   ├── config/
│   │   │   └── database.js              # better-sqlite3 connection & table creation
│   │   ├── data/
│   │   │   ├── paths.js                 # Centralized absolute paths to data files
│   │   │   └── loader.js                # JSON loader functions with caching
│   │   ├── routes/
│   │   │   ├── catalog.routes.js        # /api/catalog endpoints
│   │   │   ├── route.routes.js          # /api/routes endpoints
│   │   │   └── rideRequest.routes.js    # /api/ride-requests endpoints
│   │   ├── controllers/
│   │   │   ├── catalog.controller.js
│   │   │   ├── route.controller.js
│   │   │   └── rideRequest.controller.js
│   │   ├── services/
│   │   │   ├── catalog.service.js       # Flights, hotels, airports, suppliers lookup
│   │   │   ├── routePricing.service.js  # Route matching & price range limits
│   │   │   └── rideRequest.service.js   # Request creation & SQLite persistence
│   │   ├── validators/
│   │   │   └── request.validator.js     # Rule engine for R1, R2, R3
│   │   ├── repositories/
│   │   │   └── rideRequest.repository.js# SQL queries for ride requests
│   │   └── middleware/
│   │       └── errorHandler.js          # Centralized error handler
│   ├── test/
│   │   └── api.test.js                  # Integration test suite
│   └── package.json
│
├── data/
│   ├── catalog/
│   │   ├── flights.json
│   │   ├── hotels.json
│   │   └── airports.json
│   └── problem-2/
│       ├── taxi_companies.json
│       ├── routes.json
│       ├── booked_rides.json
│       └── open_requests.json
├── problem-statement/                   # Original hackathon problem statement documents
├── DATA_DICTIONARY.md
├── FRONTEND_SPECIFICATION.md
├── FRONTEND_SPECIFICATION.txt
├── problem-2-airport-taxi-offers.md
├── README.md
└── .gitignore
```

---

## API Endpoints

### Catalog APIs
- `GET /api/catalog/flights`: Returns arrival flights (filtered to NRT, HND, KIX, DXB, AUH). Supports `?to=NRT`, `?date=...`, `?all=true`.
- `GET /api/catalog/hotels`: Returns available hotels. Supports `?city=...`, `?area=...`.
- `GET /api/catalog/airports`: Returns all airports with served cities.
- `GET /api/catalog/suppliers`: Returns registered taxi suppliers.

### Route & Pricing APIs
- `GET /api/routes/price-range?flightId=FL-401&hotelId=HTL-TYO-004`: Computes distance, drive minutes, and allowed price range (`price_min_inr` to `price_max_inr`). Enforces that the arrival airport serves the hotel's city.
- `GET /api/routes/details?flightId=...&hotelId=...`: Detailed route specifications.

### Ride Request APIs
- `POST /api/ride-requests`: Validates R1, R2, R3 rules, generates a unique request ID (`REQ-XXXX`), and persists to SQLite.
- `GET /api/ride-requests/:id`: Retrieves a single ride request by ID with enriched flight, hotel, and route metadata.
- `GET /api/ride-requests`: Retrieves all ride requests (supports `?status=open`).

---

## Rule Enforcement (R1, R2, R3)

### R1: Flight, Hotel & Passenger Validation
- Flight must exist in `flights.json`.
- Hotel must exist in `hotels.json`.
- Flight arrival airport (`flight.to`) must serve the hotel's city (`airports.json` -> `serves_cities.includes(hotel.city)`).
- At least 1 adult passenger is required (`adults >= 1`).
- Children must be aged 0 to 17 (`childAges` elements between 0 and 17).

### R2: Pickup Time Validation
- Pickup time must be at least 60 minutes after the flight landing time (`flight.arrival_local`).
- If no pickup time is provided, landing time + 60 minutes is automatically applied as default.
- Compares dates in airport local time without timezone drift.

### R3: Traveler Price Validation
- Traveler proposed price must fall within the inclusive range specified in `routes.json`:
  `route.price_min_inr <= price <= route.price_max_inr`.
- Prices outside the range are rejected with a descriptive error message displaying the boundary values.
