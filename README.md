# Airport Taxi - Ride Offers Platform

Platform for connecting airport travelers with taxi suppliers for negotiated ride offers. Built for the Intern Hackathon (Problem 2).

## Features
- **Traveler Flow (Part 1 - Complete)**: Select arrival flight & hotel from catalog, see suggested route price ranges, post ride requests with custom offer prices within inclusive boundaries, and view request statuses on the dashboard.
- **Supplier Flow & Offers (Part 2 - Complete)**: View eligible ride requests filtered by airport, operating area, operating hours, and vehicle fleet suitability. Propose offers with assigned cars and competitive prices.
- **Booking & Rejections (Part 2 - Complete)**: Travelers view competing supplier offers, reject unsuitable offers, or book an offer to receive a unique 10-digit booking number. Other offers automatically transition to `not_chosen`.
- **Booking Changes (Part 2 - Complete)**: Travelers can request changes to flight or pickup time. Suppliers review changes with automated vehicle availability checks and accept or reject them atomically.
- **Rules Engine (R1 – R9 Complete)**:
  - **R1**: Flight, hotel & passenger integrity (valid flight/hotel, airport-city connectivity, adult >= 1, child ages 0–17).
  - **R2**: Pickup time at least 60 min after landing (default = landing + 60m).
  - **R3**: Traveler proposed price within route `[price_min_inr, price_max_inr]`.
  - **R4**: Supplier eligibility (serviced airport, city, area, operating hours across midnight, suitable car).
  - **R5**: Vehicle capacity (passenger seats $\ge$ adults + children; large bags and small bags $\le$ vehicle capacities).
  - **R6**: Car availability ($[pickup, pickup + 2 \times drive\_minutes)$ busy window; prevents overlap with booked rides and confirmed bookings).
  - **R7**: Offer submission validation (only eligible supplier, eligible car, available car, offer price in route range).
  - **R8**: Booking confirmation (10-digit booking number, double-booking prevention, atomic status transition).
  - **R9**: Booking changes (R2 lead-time recheck, car availability recheck excluding current booking, supplier accept/reject).

## Tech Stack
- **Backend:** Node.js, Express.js (REST APIs)
- **Database:** SQLite with `better-sqlite3` (WAL mode enabled, robust file-based persistence, foreign keys enforced)
- **Frontend:** React.js 19 with Vite, React Router v7, Lucide Icons
- **Styling:** Custom responsive CSS design system with airport luxury theme

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

The test suite validates all 9 hackathon rules (R1 through R9), catalog APIs, pricing calculations, and SQLite transactions:

```bash
cd backend
npm test
```

This runs both:
1. `test/api.test.js`: Part 1 integration, catalog routes, request creation, R1, R2, R3 validations.
2. `test/part2.test.js`: Part 2 integration, R4 supplier eligibility, R5 vehicle capacity, R6 car availability windows, R7 offer pricing, R8 booking confirmation & rejections, and R9 booking changes.

---

## Frontend Routes & Navigation

| Route | Role | Description |
|---|---|---|
| `/` | Landing | Select between Traveler and Taxi Supplier roles |
| `/traveler` | Traveler | Traveler dashboard showing all ride requests and statuses |
| `/traveler/create` | Traveler | Create new ride request with catalog dropdowns & price helper |
| `/traveler/offers/:requestId` | Traveler | View supplier offers, reject offer, or book offer |
| `/traveler/booking/:bookingNumber` | Traveler | Booking confirmation & summary card with change button |
| `/traveler/change-booking/:bookingNumber`| Traveler | Request flight or pickup time modifications |
| `/supplier` | Supplier | Supplier company selector & dashboard |
| `/supplier/:supplierId/requests` | Supplier | View eligible requests filtered by R4 |
| `/supplier/:supplierId/requests/:requestId/offer` | Supplier | Submit car assignment & offer price (R5, R6, R7) |
| `/supplier/:supplierId/change-requests` | Supplier | Review and accept or reject traveler booking changes (R9) |

---

## API Endpoints

### 1. Catalog APIs
- `GET /api/catalog/flights`: Returns arrival flights (NRT, HND, KIX, DXB, AUH). Supports `?to=...`, `?date=...`.
- `GET /api/catalog/hotels`: Returns available hotels. Supports `?city=...`, `?area=...`.
- `GET /api/catalog/airports`: Returns all airports with served cities.
- `GET /api/catalog/suppliers`: Returns registered taxi suppliers.

### 2. Route & Pricing APIs
- `GET /api/routes/price-range?flightId=...&hotelId=...`: Computes distance, drive minutes, and allowed price range (`price_min_inr` to `price_max_inr`). Enforces that arrival airport serves the hotel's city.
- `GET /api/routes/details?flightId=...&hotelId=...`: Detailed route specifications.

### 3. Ride Request APIs
- `POST /api/ride-requests`: Validates R1, R2, R3, generates request ID (`REQ-XXXX`), and persists to SQLite.
- `GET /api/ride-requests/:id`: Retrieves a single ride request by ID with enriched metadata.
- `GET /api/ride-requests`: Retrieves all ride requests (supports `?status=open`).

### 4. Supplier & Offer APIs (Part 2)
- `GET /api/suppliers/:supplierId/requests`: Retrieves requests eligible for this supplier under R4 (serviced airport, city, area, operating hours, suitable vehicle).
- `POST /api/offers/requests/:requestId`: Supplier submits an offer with `supplierId`, `carId`, `price`. Validates R7 (eligibility, R5 capacity, R6 availability, route price boundary).
- `GET /api/offers/requests/:requestId`: Traveler retrieves all offers submitted for a request.
- `POST /api/offers/:offerId/reject`: Traveler rejects a specific offer (status becomes `rejected`).

### 5. Booking APIs (Part 2)
- `POST /api/bookings/offers/:offerId`: Traveler confirms an offer. Validates car availability, atomically marks offer as `booked`, request as `booked`, other assigned offers as `not_chosen`, and returns 10-digit booking reference.
- `GET /api/bookings/:bookingNumber`: Retrieves booking details by 10-digit booking number.

### 6. Booking Change APIs (Part 2)
- `POST /api/change-requests/:bookingNumber`: Traveler submits request for new pickup time and/or new flight. Validates R2 lead time.
- `GET /api/change-requests/supplier/:supplierId`: Supplier reviews pending change requests for their bookings.
- `PATCH /api/change-requests/:changeRequestId`: Supplier accepts or rejects the change request. If accepted, re-verifies car availability (excluding current booking) and updates booking pickup and flight atomically.

---

## Rule Enforcement Summary (R1 – R9)

- **R1: Catalog & Passenger Integrity**: Arrival airport must serve hotel's city; adults $\ge$ 1; children ages 0–17.
- **R2: Pickup Time Lead Time**: Pickup must be $\ge$ 60 minutes after flight landing. Defaults to landing + 60m.
- **R3: Price Range**: Traveler price must fall within `[price_min_inr, price_max_inr]`.
- **R4: Supplier Eligibility**: Supplier must serve flight's arrival airport, hotel's city, hotel's area, have operating hours covering pickup time (handling midnight crossovers), and have at least one car capable of serving passenger/luggage requirements.
- **R5: Vehicle Capacity**: Assigned car must have `seats >= adults + children`, `large_bags >= request.large_bags`, and `small_bags >= request.small_bags`. If traveler specified `car_type`, assigned car's category must match.
- **R6: Car Availability Window**: Car busy window is $[pickup\_at, pickup\_at + 2 \times drive\_minutes)$. The car cannot overlap with any ride in `booked_rides.json` or confirmed SQLite bookings.
- **R7: Offer Submission**: Only eligible supplier with an eligible, available car can submit an offer. Offer price must fall within `[price_min_inr, price_max_inr]`.
- **R8: Booking Creation**: Generates random 10-digit booking number (`^\d{10}$`). Atomically sets chosen offer to `booked`, request to `booked`, and competing assigned offers to `not_chosen`. Rejected offers cannot be booked.
- **R9: Booking Changes**: Supplier reviews change requests. When accepted, availability is checked against other rides (excluding the booking itself), updating booking pickup and flight atomically.

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
