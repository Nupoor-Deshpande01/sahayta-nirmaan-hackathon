/**
 * Mock Google Maps API Service
 * Calculates distance, routes, and Green Corridor ETA
 */

exports.calculateETA = (source, destination, isGreenCorridor = false) => {
  // Mock distance logic based on coords
  const distanceKm = Math.random() * 5 + 2; // Random 2 to 7 km
  
  // Normal traffic speed: 30 km/h -> 2 min per km
  // Green corridor speed: 60 km/h -> 1 min per km
  const speed = isGreenCorridor ? 60 : 30; 
  const timeInHours = distanceKm / speed;
  const timeInMinutes = Math.ceil(timeInHours * 60);

  return {
    distance: `${distanceKm.toFixed(1)} km`,
    etaMinutes: timeInMinutes,
    routePolyline: "mock_polyline_string_xyz"
  };
};
