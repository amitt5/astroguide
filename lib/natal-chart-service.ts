// Dynamic import for sweph to handle native module loading
// This helps with Next.js server-side rendering
let swephModule: typeof import("sweph") | null = null

async function getSwephModule() {
  if (!swephModule) {
    try {
      swephModule = await import("sweph")
      // Set ephemeris path if needed (optional, works without it with reduced precision)
      // You can download ephemeris files and set the path here
      // swephModule.set_ephe_path("./ephe")
    } catch (error) {
      console.error("[Natal Chart] Error loading sweph module:", error)
      throw error
    }
  }
  return swephModule
}

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

// Geocoding helper using OpenStreetMap Nominatim (free, no API key required)
async function getCoordinates(location: string): Promise<{ lat: number; lon: number } | null> {
  try {
    // Use OpenStreetMap Nominatim API (free, no API key needed)
    const encodedLocation = encodeURIComponent(location)
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedLocation}&limit=1`
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "AstroGuide App", // Required by Nominatim
      },
    })

    if (!response.ok) {
      console.warn(`[Natal Chart] Geocoding API error: ${response.statusText}`)
      return null
    }

    const data = await response.json()
    
    if (!data || data.length === 0) {
      console.warn(`[Natal Chart] No coordinates found for location: ${location}`)
      return null
    }

    const lat = parseFloat(data[0].lat)
    const lon = parseFloat(data[0].lon)

    if (isNaN(lat) || isNaN(lon)) {
      console.warn(`[Natal Chart] Invalid coordinates for location: ${location}`)
      return null
    }

    console.log(`[Natal Chart] Geocoded "${location}" to lat: ${lat}, lon: ${lon}`)
    return { lat, lon }
  } catch (error) {
    console.error(`[Natal Chart] Geocoding error for "${location}":`, error)
    return null
  }
}

/**
 * Calculates natal chart using Swiss Ephemeris
 */
export async function calculateNatalChart(birthData: BirthData): Promise<CalculatedChart | null> {
  try {
    const sweph = await getSwephModule()
    const { utc_to_jd, calc_ut, houses_ex2, constants } = sweph
    
    // Parse birth date and time
    const [year, month, day] = birthData.birthDate.split("-").map(Number)
    const [hours, minutes] = birthData.birthTime.split(":").map(Number)
    
    // Convert to Julian Day Number using UTC
    const dateResult = utc_to_jd(
      year,
      month,
      day,
      hours,
      minutes,
      0, // seconds
      constants.SE_GREG_CAL
    )
    
    if (dateResult.error) {
      console.error("[Natal Chart] Error converting date:", dateResult.error)
      return null
    }

    const julianDayUt = dateResult.data[1] // Use UT for houses
    const julianDayEt = dateResult.data[0] // Use ET for planets

    // Get coordinates from location (requires geocoding)
    const coords = await getCoordinates(birthData.birthLocation)
    
    if (!coords) {
      console.warn("[Natal Chart] Could not geocode location, using simplified calculation")
      // Calculate without location for basic signs
      return await calculateBasicChart(julianDayEt)
    }

    // Calculate houses (requires lat/lon) - using Placidus system
    const housesResult = houses_ex2(
      julianDayUt,
      0, // iflag
      coords.lat,
      coords.lon,
      "P" // Placidus house system
    )

    if (housesResult.flag !== constants.OK) {
      console.error("[Natal Chart] Error calculating houses:", housesResult.error)
      // Fall back to basic calculation
      return await calculateBasicChart(julianDayEt)
    }

    // Calculate planetary positions using Swiss Ephemeris
    // Use Moshier algorithm (works without ephemeris files)
    const flags = constants.SEFLG_MOSEPH
    const sunResult = calc_ut(julianDayEt, constants.SE_SUN, flags)
    const moonResult = calc_ut(julianDayEt, constants.SE_MOON, flags)
    
    // Check if data exists - flag 4 often means Moshier fallback (which is fine)
    // If data exists and is valid (not NaN), consider it successful even with flag 4
    const sunHasData = sunResult.data && sunResult.data.length > 0 && !isNaN(sunResult.data[0])
    const moonHasData = moonResult.data && moonResult.data.length > 0 && !isNaN(moonResult.data[0])
    
    // Success if: flag is 0 (normal), OR flag is 4 with valid data (Moshier fallback)
    const sunSuccess = (sunResult.flag === 0 || (sunResult.flag === 4 && sunHasData)) && sunHasData
    const moonSuccess = (moonResult.flag === 0 || (moonResult.flag === 4 && moonHasData)) && moonHasData
    
    if (!sunSuccess || !moonSuccess) {
      console.error("[Natal Chart] Error calculating planets - Sun flag:", sunResult.flag, "hasData:", sunHasData, "error:", sunResult.error, "Moon flag:", moonResult.flag, "hasData:", moonHasData, "error:", moonResult.error)
      return await calculateBasicChart(julianDayEt)
    }
    
    if (sunResult.flag === 4 || moonResult.flag === 4) {
      console.log("[Natal Chart] Using Moshier fallback (no ephemeris files) - calculations are accurate")
    }

    // Extract longitude from calculation results (data[0] is longitude)
    const sunLongitude = sunResult.data[0]
    const moonLongitude = moonResult.data[0]
    
    // Get ascendant (1st house cusp) - houses data is an array
    const housesData = housesResult.data.houses
    const ascendant = housesData[0] // First house cusp is the ascendant

    // Calculate zodiac signs from positions (longitude in degrees)
    const sunSign = getZodiacSignFromLongitude(sunLongitude)
    const moonSign = getZodiacSignFromLongitude(moonLongitude)
    const ascendantSign = getZodiacSignFromLongitude(ascendant)

    // Calculate additional planets
    const planets: Record<string, number> = {}
    const planetCodes: Record<string, number> = {
      mercury: constants.SE_MERCURY,
      venus: constants.SE_VENUS,
      mars: constants.SE_MARS,
      jupiter: constants.SE_JUPITER,
      saturn: constants.SE_SATURN,
      uranus: constants.SE_URANUS,
      neptune: constants.SE_NEPTUNE,
      pluto: constants.SE_PLUTO,
    }

    for (const [name, code] of Object.entries(planetCodes)) {
      try {
        const planetResult = calc_ut(julianDayEt, code, flags)
        // Accept flag 0 (OK) or flag 4 (Moshier fallback) with valid data
        const hasData = planetResult.data && planetResult.data.length > 0 && !isNaN(planetResult.data[0])
        const isSuccess = (planetResult.flag === 0 || (planetResult.flag === 4 && hasData)) && hasData
        
        if (isSuccess) {
          planets[name] = planetResult.data[0] // Longitude
        } else {
          console.warn(`[Natal Chart] Could not calculate ${name} - flag: ${planetResult.flag}, hasData: ${hasData}`)
        }
      } catch (error) {
        console.warn(`[Natal Chart] Error calculating ${name}:`, error)
      }
    }

    return {
      sunSign,
      moonSign,
      ascendant: ascendantSign,
      sunPosition: sunLongitude,
      moonPosition: moonLongitude,
      ascendantDegree: ascendant,
      planets,
    }
  } catch (error) {
    console.error("[Natal Chart] Error calculating natal chart:", error)
    return null
  }
}

/**
 * Simplified chart calculation when location/coordinates aren't available
 * Still calculates sun and moon signs accurately
 */
async function calculateBasicChart(julianDayEt: number): Promise<CalculatedChart | null> {
  try {
    const sweph = await getSwephModule()
    const { calc_ut, constants } = sweph
    
    // Use Moshier algorithm
    const flags = constants.SEFLG_MOSEPH
    const sunResult = calc_ut(julianDayEt, constants.SE_SUN, flags)
    const moonResult = calc_ut(julianDayEt, constants.SE_MOON, flags)
    
    // Check if data exists - flag 4 often means Moshier fallback (which is fine)
    const sunHasData = sunResult.data && sunResult.data.length > 0 && !isNaN(sunResult.data[0])
    const moonHasData = moonResult.data && moonResult.data.length > 0 && !isNaN(moonResult.data[0])
    
    // Success if: flag is 0 (normal), OR flag is 4 with valid data (Moshier fallback)
    const sunSuccess = (sunResult.flag === 0 || (sunResult.flag === 4 && sunHasData)) && sunHasData
    const moonSuccess = (moonResult.flag === 0 || (moonResult.flag === 4 && moonHasData)) && moonHasData

    if (!sunSuccess || !moonSuccess) {
      console.error("[Natal Chart] Error in basic chart calculation - Sun flag:", sunResult.flag, "hasData:", sunHasData, "error:", sunResult.error, "Moon flag:", moonResult.flag, "hasData:", moonHasData, "error:", moonResult.error)
      return null
    }

    const sunLongitude = sunResult.data[0]
    const moonLongitude = moonResult.data[0]

    const sunSign = getZodiacSignFromLongitude(sunLongitude)
    const moonSign = getZodiacSignFromLongitude(moonLongitude)

    return {
      sunSign,
      moonSign,
      ascendant: "Unknown", // Requires location
      sunPosition: sunLongitude,
      moonPosition: moonLongitude,
      ascendantDegree: 0,
      planets: {},
    }
  } catch (error) {
    console.error("[Natal Chart] Error in basic chart calculation:", error)
    return null
  }
}

/**
 * Converts ecliptic longitude (in degrees) to zodiac sign
 */
function getZodiacSignFromLongitude(longitude: number): string {
  // Normalize longitude to 0-360
  const normalized = ((longitude % 360) + 360) % 360
  
  // Each sign is 30 degrees (360 / 12)
  const signIndex = Math.floor(normalized / 30)
  
  const signs = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ]
  
  return signs[signIndex] || "Unknown"
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
  }
}

