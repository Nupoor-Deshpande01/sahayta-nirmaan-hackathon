/**
 * Real Google Maps API Service
 * Calculates distance, routes, and applies Green Corridor ETA logic
 */

exports.calculateETA = async (source, destination, isGreenCorridor = false) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'mock_google_maps_key') {
    throw new Error("Valid Google Maps API Key is required to fetch real routes.");
  }

  const origin = `${source.lat},${source.lng}`;
  const dest = `${destination.lat},${destination.lng}`;
  
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${dest}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google Maps API Error:", data);
      throw new Error(`Google Maps API failed with status: ${data.status}`);
    }

    const route = data.routes[0].legs[0];
    const distanceText = route.distance.text; // e.g., "5.4 km"
    const durationSeconds = route.duration.value;
    
    // Normal routing time
    let timeInMinutes = Math.ceil(durationSeconds / 60);

    // Green Corridor logic simulates a clear path, 
    // overriding standard traffic & lights, often cutting time in half.
    if (isGreenCorridor) {
      timeInMinutes = Math.ceil(timeInMinutes * 0.5);
    }

    const polyline = data.routes[0].overview_polyline.points;

    return {
      distance: distanceText,
      etaMinutes: timeInMinutes,
      routePolyline: polyline,
      startAddress: route.start_address,
      endAddress: route.end_address
    };
  } catch (error) {
    console.error("Maps Service Exception:", error);
    throw error;
  }
};
