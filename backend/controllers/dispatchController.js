const Ambulance = require('../models/Ambulance');
const Hospital = require('../models/Hospital');

exports.intelligentDispatch = async (req, res) => {
  const { victim_location } = req.body;
  if (!victim_location || !victim_location.lat || !victim_location.lng) {
    return res.status(400).json({ success: false, message: 'victim_location (lat/lng) is required' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const victimLatLgn = `${victim_location.lat},${victim_location.lng}`;

  try {
    // 1. Fetch 3 Nearest Trauma Centers using Google Places API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${victimLatLgn}&radius=15000&type=hospital&keyword=trauma|emergency&key=${apiKey}`;
    const placesRes = await fetch(placesUrl);
    const placesData = await placesRes.json();
    
    // Fallback if no hospitals found nearby
    if (placesData.status !== 'OK' && placesData.status !== 'ZERO_RESULTS') {
      console.warn('Places API returned:', placesData.status);
    }
    
    const candidates = (placesData.results || []).slice(0, 3).map(p => ({
      name: p.name,
      vicinity: p.vicinity,
      location: p.geometry.location, // {lat, lng}
      placeId: p.place_id
    }));

    // If Places API fails or no hospitals nearby, fallback to DB hospitals
    if (candidates.length === 0) {
      const dbHospitals = await Hospital.find().limit(3);
      dbHospitals.forEach(h => candidates.push({
        name: h.name,
        location: { lat: h.location.coordinates[1], lng: h.location.coordinates[0] }
      }));
    }

    // 2. Fetch Available Ambulances
    const availableAmbulances = await Ambulance.find({ status: 'available' });
    if (availableAmbulances.length === 0) {
      return res.status(404).json({ success: false, message: 'No available ambulances' });
    }

    let bestPair = null;
    let lowestTotalTimeSeconds = Infinity;

    // 3. Distance Matrix calculations
    // We need Ambulance -> Victim time
    const ambOrigins = availableAmbulances.map(a => `${a.currentLocation.coordinates[1]},${a.currentLocation.coordinates[0]}`).join('|');
    const ambToVictimUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${ambOrigins}&destinations=${victimLatLgn}&departure_time=now&key=${apiKey}`;
    
    const ambDistRes = await fetch(ambToVictimUrl);
    const ambDistData = await ambDistRes.json();

    // Victim -> Hospitals time
    const hospDestinations = candidates.map(h => `${h.location.lat},${h.location.lng}`).join('|');
    const victimToHospUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${victimLatLgn}&destinations=${hospDestinations}&departure_time=now&key=${apiKey}`;
    
    const hospDistRes = await fetch(victimToHospUrl);
    const hospDistData = await hospDistRes.json();

    // 4. Calculate optimal pairing
    // Parse Ambulance -> Victim times
    const timeToVictim = availableAmbulances.map((amb, index) => {
      const element = ambDistData.rows[index]?.elements[0];
      return { ambulance: amb, timeSeconds: element?.duration_in_traffic?.value || element?.duration?.value || 300 }; // fallback 5m
    });

    // Parse Victim -> Hospital times
    const timeToHosp = candidates.map((hosp, index) => {
      const element = hospDistData.rows[0]?.elements[index];
      return { hospital: hosp, timeSeconds: element?.duration_in_traffic?.value || element?.duration?.value || 600 }; // fallback 10m
    });

    // Find Lowest Total Time
    timeToVictim.forEach(ambPair => {
      timeToHosp.forEach(hospPair => {
        const totalTime = ambPair.timeSeconds + hospPair.timeSeconds;
        if (totalTime < lowestTotalTimeSeconds) {
          lowestTotalTimeSeconds = totalTime;
          bestPair = {
            ambulance: ambPair.ambulance,
            hospital: hospPair.hospital,
            ambToVictimSeconds: ambPair.timeSeconds,
            victimToHospSeconds: hospPair.timeSeconds
          };
        }
      });
    });

    // Mark ambulance as busy
    const dispatchedAmb = await Ambulance.findById(bestPair.ambulance._id);
    dispatchedAmb.status = 'busy';
    await dispatchedAmb.save();

    res.status(200).json({
      success: true,
      data: {
        assigned_ambulance_id: bestPair.ambulance._id,
        ambulance_details: bestPair.ambulance,
        hospital_details: bestPair.hospital,
        calculated_total_eta: {
          total_seconds: lowestTotalTimeSeconds,
          total_minutes: Math.ceil(lowestTotalTimeSeconds / 60),
          breakdown: {
            ambulance_to_victim_minutes: Math.ceil(bestPair.ambToVictimSeconds / 60),
            victim_to_hospital_minutes: Math.ceil(bestPair.victimToHospSeconds / 60)
          }
        }
      }
    });

  } catch (error) {
    console.error("Dispatch Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
