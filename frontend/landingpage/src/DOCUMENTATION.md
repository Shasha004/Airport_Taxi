# AirportCarWala Landing Page Documentation
**Project:** Airport Taxi & AirportCarWala (Problem 2 - Intern Hackathon)
**Location:** `frontend/landingpage/src`

---

## 1. Design Matching & Architecture

The landing page has been modified to match the uploaded design (`AirportCarWala`) with a live 3D rotating blue sports car in the center:

### Key Sections:
1. **Stage 1: Airplane Window Intro (Image 1)**
   - Initial fullscreen view of [airplane_window.jpg](file:///c:/Users/santh/Downloads/OneDrive/Desktop/hackcelle/frontend/landingpage/src/image/airplane_window.jpg).
   - Interactive center prompt with animated radar pulse ring.
   - On click: A smooth 3D zoom through the glass aperture (`transform: scale(11)` with blur and opacity fade) transitioning seamlessly into the lounge.

2. **Stage 2: Exact AirportCarWala Hero Design (Image 2)**
   - **Background & 3D Rotating Car**: [Blue_sports_car_rotating_01db1ae0.mp4](file:///c:/Users/santh/Downloads/OneDrive/Desktop/hackcelle/frontend/landingpage/src/image/Blue_sports_car_rotating_01db1ae0.mp4) spans full-bleed across the viewport. The blue silk background and the centered 3D rotating supercar merge seamlessly without any visible borders or box clipping.
   - **Top Navigation Bar ([Navbar.jsx](file:///c:/Users/santh/Downloads/OneDrive/Desktop/hackcelle/frontend/landingpage/src/components/Navbar.jsx))**:
     - Custom SVG brand mark (airplane taking off over a sports car outline) + `AirportCarWala` brand title.
     - Center navigation items: `Home`, `Cars` (highlighted in cyan `#00e5ff`), `Bookings`, `About`, `Contact Us`.
     - Right: Hamburger menu icon + `✈ Window` replay toggle.
   - **Left Hero Content**:
     - `LUXURY CAR RENTALS` (Bold 900-weight uppercase heading).
     - `FIND THE PERFECT CAR FOR YOUR NEXT AIRPORT TRIP!`
     - `BOOK NOW ▶` (White outlined box button with solid triangle indicator).
   - **Right Hero Content**:
     - `*SPECS` table:
       - Production: `2024 - Present`
       - Max Speed: `340 km/h`
       - Engine: `5.2L V10`
   - **Bottom Navigation Bar ([Footer.jsx](file:///c:/Users/santh/Downloads/OneDrive/Desktop/hackcelle/frontend/landingpage/src/components/Footer.jsx))**:
     - Left: `Twitter  |  Facebook  |  Youtube`
     - Center: Carousel indicator dots (`• • ○ • •` where the active 3rd dot is an outlined circle).
     - Right: Circular navigation arrow buttons `( ‹ )` `( › )` and `More` link.

3. **Stage 3: Problem 2 Rules & Ride Offers Modal ([BookingModal.jsx](file:///c:/Users/santh/Downloads/OneDrive/Desktop/hackcelle/frontend/landingpage/src/components/BookingModal.jsx))**
   - Clicking `BOOK NOW ▶`, `Bookings`, or `More` opens the Hackathon interactive test suite:
     - Pre-filled with the **Menon Family** scenario (Flight `FL-401`, Narita to Ueno Hotel `HTL-TYO-004`).
     - Real-time **Rule R3** price range check (₹10,200 – ₹16,800).
     - Capacity checks for 2 adults + 1 child and 3 large + 2 small bags (**Rule R5**).
     - **Sakura Cabs** supplier assignment.
     - **10-Digit Booking Code Generation** (**Rule R8**).

---

## 2. React Hooks & Technologies

- **React 18.3.1**: Functional components with hooks only.
- **Pure CSS**: 100% custom styling in `css/` matching every page and component (no Bootstrap, no Tailwind).
- **`useState`**:
  - `isWindowZoomed`: Toggles between the airplane window intro and the main page.
  - `isBookingOpen`: Opens the hackathon rules and booking modal.
  - `activeSlide`: Tracks the current vehicle specs slide.
  - Form validation states in `BookingModal`.
- **`useEffect`**:
  - Coordinates `<video>` autoplay upon entering the main page.
- **`useRef`**:
  - `videoRef`: Direct attachment to the HTML5 video element for muted, inline looping.

---

## 3. Issues Faced & Resolutions

1. **Video Background Blending**:
   - *Challenge*: Previously the video sat inside a small card with box borders that clashed with the CSS background.
   - *Resolution*: Made the video layer full-bleed with `object-fit: cover` and `object-position: center 52%`. Because the video itself contains the royal blue silk background from the original 3D render, the entire screen and the rotating car blend seamlessly with zero box edges.
2. **`ECONNRESET` during package installation**:
   - *Resolution*: Configured `.npmrc` to use `https://registry.npmmirror.com/`.

---

## 4. How to Run

The dev server is currently running in the background. Open your browser at:
**[http://localhost:5173/](http://localhost:5173/)**
