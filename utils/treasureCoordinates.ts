// utils/treasureCoordinates.ts
// Manual coordinate mapping for treasure hunt QR code locations
// ViewBox: 0 0 500 325 (your design dimensions)

export interface TreasureHuntLocation {
  id: string
  name: string
  floor: 'GF' | 'UG' | 'FF'
  x: number  // SVG coordinate (0-500)
  y: number  // SVG coordinate (0-325)
  description: string
  quiz_question?: string
}

// STEP 1: Define your treasure hunt locations with exact coordinates
// TODO: You'll need to adjust these coordinates to match actual walkway positions
export const TREASURE_HUNT_COORDINATES: Record<string, TreasureHuntLocation[]> = {
  // Ground Floor (GF)
  'GF': [
    {
      id: 'main-lobby',
      name: 'Main Lobby',
      floor: 'GF',
      x: 50,  // TODO: Adjust to actual Main Lobby position
      y: 71,  // TODO: Adjust to actual Main Lobby position
      description: 'Main entrance lobby area',
      quiz_question: 'Kapan Indonesia merdeka?'
    },
    {
      id: 'south-lobby', 
      name: 'South Lobby',
      floor: 'GF',
      x: 200,  // TODO: Adjust to actual South Lobby position
      y: 250,  // TODO: Adjust to actual South Lobby position
      description: 'South entrance lobby area',
      quiz_question: 'Siapa proklamator kemerdekaan Indonesia?'
    },
    {
      id: 'u-walk',
      name: 'U Walk', 
      floor: 'GF',
      x: 350,  // TODO: Adjust to actual U Walk position
      y: 180,  // TODO: Adjust to actual U Walk position
      description: 'U-shaped walkway connecting mall sections',
      quiz_question: 'Apa bunyi Pancasila sila pertama?'
    }
  ],

  // Underground (UG)
  'UG': [
    {
      id: 'food-court',
      name: 'Food Court',
      floor: 'UG', 
      x: 250,  // TODO: Adjust to actual food court position
      y: 160,  // TODO: Adjust to actual food court position
      description: 'Underground food court area',
      quiz_question: 'Berapa jumlah provinsi di Indonesia saat ini?'
    }
  ],

  // First Floor (FF) 
  'FF': [
    {
      id: 'east-dome',
      name: 'East Dome',
      floor: 'FF',
      x: 400,  // TODO: Adjust to actual East Dome position
      y: 120,  // TODO: Adjust to actual East Dome position
      description: 'Eastern dome area near cinema',
      quiz_question: 'Berapa jumlah provinsi di Indonesia saat ini?'
    }
  ]
}

// Helper function to get treasure locations for a specific floor
export const getTreasureLocationsForFloor = (floorCode: string): TreasureHuntLocation[] => {
  return TREASURE_HUNT_COORDINATES[floorCode] || []
}

// Helper function to get treasure location by ID
export const getTreasureLocationById = (locationId: string): TreasureHuntLocation | null => {
  for (const floorLocations of Object.values(TREASURE_HUNT_COORDINATES)) {
    const location = floorLocations.find(loc => loc.id === locationId)
    if (location) return location
  }
  return null
}

// Helper function to convert your treasure hunt location names to coordinates
export const mapLocationNameToCoordinates = (
  locationName: string, 
  floorCode: string
): { x: number, y: number } | null => {
  
  const floorLocations = TREASURE_HUNT_COORDINATES[floorCode] || []
  
  // Try exact match first
  let location = floorLocations.find(loc => 
    loc.name.toLowerCase() === locationName.toLowerCase()
  )
  
  // Try partial match
  if (!location) {
    location = floorLocations.find(loc => 
      loc.name.toLowerCase().includes(locationName.toLowerCase()) ||
      locationName.toLowerCase().includes(loc.name.toLowerCase())
    )
  }
  
  return location ? { x: location.x, y: location.y } : null
}

// Validation helper
export const validateCoordinates = (x: number, y: number): boolean => {
  return x >= 0 && x <= 500 && y >= 0 && y <= 325
}

// Debug helper - use this to test coordinate placement
export const debugCoordinates = () => {
  console.group('🗺️ Treasure Hunt Coordinates Debug')
  
  Object.entries(TREASURE_HUNT_COORDINATES).forEach(([floor, locations]) => {
    console.log(`\n📍 Floor ${floor}:`)
    locations.forEach(loc => {
      console.log(`  ${loc.name}: (${loc.x}, ${loc.y}) - ${loc.description}`)
    })
  })
  
  console.groupEnd()
}

// Coordinate adjustment helper for fine-tuning
export const adjustCoordinate = (
  locationId: string, 
  newX: number, 
  newY: number
): boolean => {
  if (!validateCoordinates(newX, newY)) {
    console.error(`Invalid coordinates: (${newX}, ${newY})`)
    return false
  }
  
  for (const floorLocations of Object.values(TREASURE_HUNT_COORDINATES)) {
    const location = floorLocations.find(loc => loc.id === locationId)
    if (location) {
      console.log(`📍 Adjusting ${location.name}: (${location.x}, ${location.y}) → (${newX}, ${newY})`)
      location.x = newX
      location.y = newY
      return true
    }
  }
  
  console.error(`Location not found: ${locationId}`)
  return false
}