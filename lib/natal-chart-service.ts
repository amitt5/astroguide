// simple-natal-chart-service.ts
import type { NatalChart } from "./types"

export interface BirthData {
  birthDate: string // YYYY-MM-DD
  birthTime: string // HH:MM (24-hour format)
  birthLocation: string // City, Country format
}

export interface CalculatedChart {
  sunSign: string
  moonSign: string
  ascendant: string
  sunPosition: number
  moonPosition: number
  ascendantDegree: number
  planets: Record<string, number>
}

/**
 * Calculates natal chart using traditional astrological methods
 * No dependency on external ephemeris libraries
 */
export async function calculateNatalChart(birthData: BirthData): Promise<CalculatedChart> {
  try {
    // Parse birth date and time
    const [year, month, day] = birthData.birthDate.split("-").map(Number);
    const [hours, minutes] = birthData.birthTime.split(":").map(Number);
    
    // Create a Date object for calculations
    const birthDateTime = new Date(year, month - 1, day, hours, minutes);
    
    // Calculate sun sign (most reliable calculation)
    const sunSign = calculateSunSign(month, day);
    console.log(`[Natal Chart] Calculated sun sign: ${sunSign}`);
    
    // Calculate moon sign (approximation)
    const moonSign = calculateMoonSign(birthDateTime);
    console.log(`[Natal Chart] Calculated moon sign: ${moonSign}`);
    
    // Default values for ascendant
    let ascendant = "Unknown";
    let ascendantDegree = 0;
    
    // Try to get coordinates for ascendant calculation
    try {
      const coords = await getCoordinates(birthData.birthLocation);
      console.log(`[Natal Chart] Geocoded location: ${JSON.stringify(coords)}`);
      
      if (coords) {
        // Calculate ascendant if we have coordinates
        const ascendantData = calculateAscendant(birthDateTime, coords);
        ascendant = ascendantData.sign;
        ascendantDegree = ascendantData.degree;
        console.log(`[Natal Chart] Calculated ascendant: ${ascendant}`);
      }
    } catch (error) {
      console.warn(`[Natal Chart] Geocoding failed, skipping ascendant calculation: ${error}`);
    }
    
    // Calculate sun position in degrees
    const sunPosition = calculateSunPosition(birthDateTime);
    
    // Calculate moon position in degrees
    const moonPosition = calculateMoonPosition(birthDateTime);
    
    // Calculate other planet positions
    const planets = calculatePlanetPositions(birthDateTime);
    
    // Return the complete chart
    return {
      sunSign,
      moonSign,
      ascendant,
      sunPosition,
      moonPosition,
      ascendantDegree,
      planets,
    };
  } catch (error) {
    console.error("[Natal Chart] Error calculating chart:", error);
    
    // Fall back to at least providing the sun sign if possible
    try {
      const [, month, day] = birthData.birthDate.split("-").map(Number);
      const sunSign = calculateSunSign(month, day);
      
      return {
        sunSign,
        moonSign: "Unknown",
        ascendant: "Unknown",
        sunPosition: 0,
        moonPosition: 0,
        ascendantDegree: 0,
        planets: {},
      };
    } catch {
      // Ultimate fallback with unknown values
      return {
        sunSign: "Unknown",
        moonSign: "Unknown",
        ascendant: "Unknown",
        sunPosition: 0,
        moonPosition: 0,
        ascendantDegree: 0,
        planets: {},
      };
    }
  }
}

/**
 * Calculate sun sign based on month and day
 * This is the most reliable calculation and does not require ephemeris
 */
function calculateSunSign(month: number, day: number): string {
  // These date ranges are the traditional tropical zodiac date ranges
  const dateRanges = [
    { sign: "Capricorn", start: { month: 12, day: 22 }, end: { month: 1, day: 19 } },
    { sign: "Aquarius", start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
    { sign: "Pisces", start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
    { sign: "Aries", start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
    { sign: "Taurus", start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
    { sign: "Gemini", start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
    { sign: "Cancer", start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
    { sign: "Leo", start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
    { sign: "Virgo", start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
    { sign: "Libra", start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
    { sign: "Scorpio", start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
    { sign: "Sagittarius", start: { month: 11, day: 22 }, end: { month: 12, day: 21 } }
  ];
  
  // Handle Capricorn's special case (spans December-January)
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return "Capricorn";
  }
  
  // Check other signs
  for (const range of dateRanges) {
    if (
      (month === range.start.month && day >= range.start.day) ||
      (month === range.end.month && day <= range.end.day)
    ) {
      return range.sign;
    }
  }
  
  // Should never reach here if date is valid
  return "Unknown";
}

/**
 * Calculate approximate moon sign based on date
 */
function calculateMoonSign(date: Date): string {
  // The moon completes a cycle through the zodiac in approximately 27.3 days
  // This calculation is simplified but gives a reasonable approximation
  
  // Get day of year (0-365)
  const dayOfYear = getDayOfYear(date);
  
  // Arbitrary reference point (January 1, 2000 - moon in Aries)
  // This is a simplified starting point and would need periodic adjustment
  const referenceDay = 0; // Day of year for Jan 1
  const referenceYear = 2000;
  const referenceSignIndex = 0; // Aries
  
  // Days since reference point
  const yearDiff = date.getFullYear() - referenceYear;
  const dayDiff = dayOfYear - referenceDay + (yearDiff * 365);
  
  // Calculate lunar cycles completed
  const cycleLength = 27.3; // days
  const cyclesCompleted = dayDiff / cycleLength;
  
  // Get current position in zodiac (0-11)
  const signIndex = Math.floor((cyclesCompleted % 12) * 12) % 12;
  
  const signs = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  
  return signs[signIndex];
}

/**
 * Calculate approximate ascendant based on birth time and location
 */
function calculateAscendant(date: Date, coords: { lat: number; lon: number }): { sign: string; degree: number } {
  // This is a simplified method based on the fact that the ascendant
  // changes approximately every 2 hours, completing the full zodiac in 24 hours
  
  // Get local time
  const hour = date.getHours();
  const minute = date.getMinutes();
  
  // Adjust for longitude (approximate)
  // Each 15 degrees of longitude = 1 hour time difference
  const longitudeHourOffset = coords.lon / 15;
  const adjustedHour = (hour + longitudeHourOffset) % 24;
  
  // Each sign rises for about 2 hours
  // Starting with Aries at approximately midnight (oversimplified)
  let signIndex = Math.floor(adjustedHour / 2) % 12;
  
  // Adjust for latitude (simplified)
  // Northern hemisphere: shift forward for higher latitudes
  // Southern hemisphere: shift backward for higher latitudes
  const latitudeAdjustment = Math.abs(coords.lat) > 45 ? (coords.lat > 0 ? 1 : -1) : 0;
  signIndex = (signIndex + latitudeAdjustment + 12) % 12;
  
  const signs = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
  ];
  
  // Calculate degree within sign (0-29)
  // Based on the minute and remaining fractional hour
  const fractionalHour = (adjustedHour % 2) + (minute / 60);
  const degree = Math.floor(fractionalHour * 15); // Each hour = 15 degrees
  
  // Calculate overall zodiac degree (0-359)
  const zodiacDegree = (signIndex * 30) + degree;
  
  return {
    sign: signs[signIndex],
    degree: zodiacDegree
  };
}

/**
 * Calculate approximate sun position in degrees (0-359)
 */
function calculateSunPosition(date: Date): number {
  // The sun moves approximately 1 degree per day
  // Starting from 0° Aries on the spring equinox (around March 21)
  
  // Get day of year
  const dayOfYear = getDayOfYear(date);
  
  // Approximate day of spring equinox
  const equinoxDay = 80; // Around March 21
  
  // Calculate days since equinox, wrapping around for dates before equinox
  let daysSinceEquinox = dayOfYear - equinoxDay;
  if (daysSinceEquinox < 0) {
    daysSinceEquinox += 365;
  }
  
  // Convert to degrees (0-359)
  const position = (daysSinceEquinox % 365) * (360 / 365);
  
  return position;
}

/**
 * Calculate approximate moon position in degrees (0-359)
 */
function calculateMoonPosition(date: Date): number {
  // The moon moves approximately 13.2 degrees per day
  
  // Get sun position as a starting point
  const sunPosition = calculateSunPosition(date);
  
  // Get day of year
  const dayOfYear = getDayOfYear(date);
  
  // Moon moves ~13.2 degrees per day relative to sun position
  // This creates a complete cycle in about 27.3 days
  const moonDailyMotion = 13.2;
  const moonOffset = (dayOfYear * moonDailyMotion) % 360;
  
  // Moon position relative to sun
  const position = (sunPosition + moonOffset) % 360;
  
  return position;
}

/**
 * Calculate approximate positions for other planets
 */
function calculatePlanetPositions(date: Date): Record<string, number> {
  // Average daily motion for each planet (degrees per day)
  const planetMotion: Record<string, number> = {
    mercury: 4.09, // Fast
    venus: 1.60,
    mars: 0.52,
    jupiter: 0.08, // Slower
    saturn: 0.03,
    uranus: 0.01,
    neptune: 0.006,
    pluto: 0.004, // Very slow
  };
  
  // Arbitrary starting positions (would need proper calibration)
  const startingPositions: Record<string, number> = {
    mercury: 25,
    venus: 55,
    mars: 85,
    jupiter: 115,
    saturn: 145,
    uranus: 175,
    neptune: 205,
    pluto: 235,
  };
  
  // Calculate day of year
  const dayOfYear = getDayOfYear(date);
  
  // Calculate positions
  const positions: Record<string, number> = {};
  
  for (const planet of Object.keys(planetMotion)) {
    const motion = planetMotion[planet as keyof typeof planetMotion];
    const startPos = startingPositions[planet as keyof typeof startingPositions];
    
    // Position = start + (day * motion), normalized to 0-359
    positions[planet] = (startPos + (dayOfYear * motion)) % 360;
  }
  
  return positions;
}

/**
 * Helper to get day of year (0-365)
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Geocoding helper to get coordinates from location name
 */
async function getCoordinates(location: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const encodedLocation = encodeURIComponent(location);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "AstroGuide App", // Required by Nominatim
      },
    });

    if (!response.ok) {
      console.warn(`[Natal Chart] Geocoding API error: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.warn(`[Natal Chart] No coordinates found for location: ${location}`);
      return null;
    }

    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);

    if (isNaN(lat) || isNaN(lon)) {
      console.warn(`[Natal Chart] Invalid coordinates for location: ${location}`);
      return null;
    }

    console.log(`[Natal Chart] Geocoded "${location}" to lat: ${lat}, lon: ${lon}`);
    return { lat, lon };
  } catch (error) {
    console.error(`[Natal Chart] Geocoding error for "${location}":`, error);
    return null;
  }
}

/**
 * Helper to convert CalculatedChart to NatalChart format for database storage
 */
export function chartToNatalChart(
  userId: string,
  calculatedChart: CalculatedChart,
): Omit<NatalChart, "id" | "createdAt"> {
  return {
    userId,
    sunSign: calculatedChart.sunSign,
    moonSign: calculatedChart.moonSign,
    ascendant: calculatedChart.ascendant,
    chartData: {
      sunPosition: calculatedChart.sunPosition,
      moonPosition: calculatedChart.moonPosition,
      ascendantDegree: calculatedChart.ascendantDegree,
      planets: calculatedChart.planets,
    },
  };
}