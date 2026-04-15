# Sahayta (RescueLink) - Emergency Medical Service Platform

Sahayta (also known as RescueLink) is a next-generation Emergency Medical Service (EMS) coordination platform designed to drastically reduce response times and save lives. Built as a comprehensive hackathon project, it integrates mobile crash detection, AI-powered "Green Corridor" traffic management, live hospital tracking, and community-driven first responder dispatch into a seamless digital ecosystem.

![Sahayta System Dashboard](https://img.shields.io/badge/Status-Live_On_Vercel-success?style=flat-square)
![Stack](https://img.shields.io/badge/Stack-React_|_Vite_|_Express_|_Socket.io-blue?style=flat-square)

---

## 🎯 Key Features

### 🛡️ 1. Silent Guardian (Mobile SOS App)
- **Automated Crash Detection:** Senses high G-force impacts automatically (mobile gyro/accelerometer tracking).
- **Grace Period:** Gives users a 10s cancel window to prevent false positives before deploying ambulances automatically.
- **AI Triage & rPPG:** Utilizes the smartphone's camera directly at the scene to measure Heart Rate & SpO₂ non-intrusively using rPPG (Remote Photoplethysmography), streaming vitals to the responding hospital instantly.

### 🚑 2. Smart Green Corridor
- **Intelligent Routing:** Integrates deeply with Google Maps API and simulated grid nodes.
- **Traffic AI Override:** Predicts the ambulance route and creates a cascading real-time "Green Corridor", turning simulated traffic signals green right before the ambulance arrives, cutting EMS delay by up to 11 minutes.

### 🏥 3. VitalStream & Hospital Command
- **Pre-Arrival Readiness:** Live telemetry (heart rate, blood oxygen) streams straight from the paramedics/user to the assigned trauma center, so doctors are fully prepped prior to the ambulance pulling in.
- **HospTrack Resource Engine:** Instantly evaluates bed/ICU and blood type availability across nearby hospitals relative to the victim's location.

### 🙋‍♂️ 4. Community First Responder
- Pings the nearest registered lay-responders/bystanders with first aid/CPR training instantly.
- Dispatched in seconds with live navigational assistance, helping extend the "Golden Hour" of patient survival.

---

## 🛠️ Technology Stack
- **Frontend Core:** React 19, JavaScript, DOM, CSS (Glassmorphism + Dark/Light adaptive themes).
- **Bundler / Framework:** Vite (optimized for HMR and rapid prototyping).
- **Backend Core:** Node.js, Express.js.
- **Realtime Comms:** Socket.io (for dynamic ambulance position and real-time alerts).
- **Database:** MongoDB (using `mongodb-memory-server` and `ongoose` for mock data validation and hackathon portability).
- **Maps API:** `@react-google-maps/api`

---

## 🚀 Live Demo
The project is fully containerized and hosted natively using Vercel. 
**Live Project Link:** [Sahayta on Vercel](https://sahayta-nirmaan-hackathon-gules.vercel.app/)

*Wait! Why Vercel?*
This repo utilizes an advanced Vercel reverse proxy setup (`vercel.json`). The frontend routes natively via Vite, whilst calls to `/api/*` are intercepted by Vercel Serverless Functions and piped straight to the `api/index.js` wrapper executing our Express.js application dynamically without a dedicated secondary deployment.

---

## 💻 Local Development Setup

To run everything on your local machine with full WebSocket/Socket.io capability:

### 1. Requirements
- Node.js `v18+`
- Environment variable for Google Maps (Create a `.env` in root)

### 2. Environment Setup
Create a `.env` inside the root directory and add your Google Maps SDK key:
```env
VITE_GOOGLE_MAPS_KEY=Your_Google_Maps_Api_Key_Here
```

### 3. Running the Backend Architecture
Navigate to the backend and launch the Express Server.
```bash
cd backend
npm install
node server.js
```
*(Runs on `localhost:3000`)*

### 4. Running the Frontend Interfaces
Open a new terminal at the root directory to run the React application:
```bash
npm install
npm run dev
```
*(Runs on `localhost:5173/5174` and proxies all `/api` requests seamlessly to the backend)*

---

## 📑 Core Component Architecture
- **`App.jsx`**: Main Controller & Routing wrapper (incorporates `MapsLoadedContext`).
- **`BystanderSOS.jsx`**: The mobile interface triggered directly by accidents. Houses camera access handles, AI triage UI, and countdown logic.
- **`LandingPage.jsx`**: Animated entry-point utilizing custom JS keyframes and interactive SVG routing simulators.
- **`AmbulanceNavigator.jsx`**: The interface rendered for EMS drivers, showing dynamic route shifts.
- **`LiveTrackingMap.jsx`**: Dispatch-level Map that provides total situational overview across city blocks.
- **`server.js`**: REST controllers mapping out simulated routes, resolving SOS hooks, and firing live socket hooks. 

---

*Project configured specifically as part of the Sahayta Hackathon Sprint.*
