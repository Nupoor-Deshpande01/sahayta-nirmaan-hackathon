# Sahayta (RescueLink) Backend MVP

This is the full-stack backend built using Node.js, Express, MongoDB, and Socket.io. It supports the core Sahayta platform features (SOS triggering, hospital matching, smart routing simulation, and live real-time sockets).

## Setup Instructions

1. Ensure you have **Node.js** and **MongoDB** installed.
2. In this `/backend` directory, run:
   ```bash
   npm install
   ```
3. Your database variables are configured in `.env` (defaults to local mongodb). Ensure your local mongo daemon is running, or replace `MONGO_URI` with a Mongo Atlas string.
4. Run the server:
   ```bash
   node server.js
   ```
5. The server will launch on `http://localhost:3000`.

## Features Implemented

* **Smart SOS System**: `/api/sos` triggers the pipeline, finds ambulances/hospitals, broadcasts via Socket.io.
* **Hospital Matching**: `/api/hospitals/nearest` queries geospatial data.
* **Ambulance Tracking**: `/api/ambulances/update-location` patches live coords and broadcasts to frontend via sockets.
* **Green Corridor Simulation**: `/api/corridor` mocks Google Maps Distance Matrix to simulate clearance logic.
* **Dashboard Data APIs**: Live tracking and summary stats (`/api/dashboard/*`).
* **Medical Profiles**: Basic user endpoints (`/api/users`).

## Sample API Requests

### 1. Trigger SOS
**POST** `http://localhost:3000/api/sos`
```json
{
  "userId": "603d2bafb9c32b50901abccd",
  "latitude": 18.6298,
  "longitude": 73.7997,
  "accidentSeverity": "High"
}
```
**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "location": { "latitude": 18.6298, "longitude": 73.7997 },
    "accidentSeverity": "High",
    "status": "dispatched",
    "_id": "642a1b9f...",
    "assignedAmbulanceId": "...",
    "targetHospitalId": "..."
  }
}
```

### 2. Request Green Corridor Simulation
**POST** `http://localhost:3000/api/corridor`
```json
{
  "source": { "lat": 18.6298, "lng": 73.7997 },
  "destination": { "lat": 18.6210, "lng": 73.8120 }
}
```
**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "distance": "4.2 km",
    "etaMinutes": 5,
    "routePolyline": "mock_polyline_string_xyz"
  }
}
```

### 3. Track Ambulance Location (Live Update)
**PATCH** `http://localhost:3000/api/ambulances/update-location`
```json
{
  "ambulanceId": "642a1b9f...",
  "lat": 18.6250,
  "lng": 73.8050
}
```

### 4. Connect via Socket.io (Frontend implementation)
```javascript
import { io } from "socket.io-client";
const socket = io("http://localhost:3000");

socket.on("new_sos", (data) => console.log(data));
socket.on("ambulance_location_update", (data) => console.log(data));
socket.on("green_corridor_active", (data) => console.log(data));
```
