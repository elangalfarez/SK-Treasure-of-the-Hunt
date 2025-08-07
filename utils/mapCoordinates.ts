// utils/coordinateMapper.ts - TOOL TO HELP MAP TREASURE HUNT COORDINATES
// Use this to find and set the correct coordinates for your treasure hunt locations

export interface TreasureHuntLocation {
  id: string
  name: string
  floor: string
  realWorldPosition: string // Description of where it actually is in the mall
  coordinates: { x: number; y: number }
  status?: 'mapped' | 'needs_adjustment' | 'placeholder'
}

// STEP 1: Update these coordinates based on your actual mall layout
// These coordinates should correspond to your SVG viewBox (typically 0 0 1000 600)
export const REAL_TREASURE_HUNT_COORDINATES: TreasureHuntLocation[] = [
  // === GROUND FLOOR (GF) ===
  {
    id: 'main-lobby', 
    name: 'Main Lobby',
    floor: 'GF',
    realWorldPosition: 'Main entrance lobby area',
    coordinates: { x: 500, y: 200 }, // CUSTOMIZE: Adjust to actual Main Lobby position on your SVG
    status: 'needs_adjustment'
  },
  {
    id: 'south-lobby',
    name: 'South Lobby', 
    floor: 'GF',
    realWorldPosition: 'South entrance lobby area',
    coordinates: { x: 400, y: 450 }, // CUSTOMIZE: Adjust to actual South Lobby position
    status: 'needs_adjustment'
  },
  {
    id: 'u-walk',
    name: 'U Walk',
    floor: 'GF', 
    realWorldPosition: 'U-shaped walkway area',
    coordinates: { x: 250, y: 300 }, // CUSTOMIZE: Adjust to actual U Walk position
    status: 'needs_adjustment'
  },

  // === UNDERGROUND (UG) ===
  {
    id: 'food-court',
    name: 'Food Court',
    floor: 'UG',
    realWorldPosition: 'Underground food court area',
    coordinates: { x: 500, y: 300 }, // CUSTOMIZE: Adjust based on your UG layout
    status: 'needs_adjustment'
  },

  // === FIRST FLOOR (FF) ===
  {
    id: 'cinema-area',
    name: 'Cinema Area',
    floor: 'FF',
    realWorldPosition: 'XXI Cinema lobby',
    coordinates: { x: 600, y: 200 }, // CUSTOMIZE: Adjust based on your FF layout
    status: 'needs_adjustment'
  },

  // ADD MORE LOCATIONS HERE as needed...
]

// STEP 2: Coordinate conversion utilities
export class CoordinateMapper {
  
  // Convert percentage coordinates to SVG coordinates
  static percentToSVG(percentX: number, percentY: number, viewBoxWidth: number = 1000, viewBoxHeight: number = 600): { x: number; y: number } {
    return {
      x: (percentX / 100) * viewBoxWidth,
      y: (percentY / 100) * viewBoxHeight
    }
  }

  // Convert SVG coordinates to percentage (for CSS positioning)
  static svgToPercent(svgX: number, svgY: number, viewBoxWidth: number = 1000, viewBoxHeight: number = 600): { x: number; y: number } {
    return {
      x: (svgX / viewBoxWidth) * 100,
      y: (svgY / viewBoxHeight) * 100
    }
  }

  // Find coordinates by location name (fuzzy match)
  static findLocationByName(name: string): TreasureHuntLocation | null {
    const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    return REAL_TREASURE_HUNT_COORDINATES.find(loc => 
      loc.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalized) ||
      normalized.includes(loc.name.toLowerCase().replace(/[^a-z0-9]/g, ''))
    ) || null
  }

  // Get coordinates with fallback
  static getCoordinates(locationId: string, locationName: string, floor: string): { x: number; y: number } {
    // Try by ID first
    const byId = REAL_TREASURE_HUNT_COORDINATES.find(loc => loc.id === locationId)
    if (byId) return byId.coordinates

    // Try by name
    const byName = this.findLocationByName(locationName)
    if (byName && byName.floor === floor) return byName.coordinates

    // Fallback: generate coordinates
    console.warn(`🗺️ No mapped coordinates for: ${locationName} (${locationId}) on floor ${floor}`)
    return this.generateFallbackCoordinates(locationName, floor)
  }

  // Generate fallback coordinates if not mapped
  private static generateFallbackCoordinates(locationName: string, floor: string): { x: number; y: number } {
    // Create consistent but distributed coordinates based on name hash
    const hash = locationName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)

    const floorOffsets = {
      'GF': { baseX: 500, baseY: 300, spread: 200 },
      'UG': { baseX: 500, baseY: 300, spread: 150 },
      'FF': { baseX: 500, baseY: 300, spread: 180 }
    }

    const offset = floorOffsets[floor as keyof typeof floorOffsets] || floorOffsets['GF']
    
    const x = offset.baseX + ((hash % offset.spread) - offset.spread / 2)
    const y = offset.baseY + (((hash >> 8) % offset.spread) - offset.spread / 2)
    
    // Ensure coordinates stay within viewBox bounds
    return { 
      x: Math.max(50, Math.min(950, x)), 
      y: Math.max(50, Math.min(550, y)) 
    }
  }

  // Validate coordinates are within viewBox
  static validateCoordinates(x: number, y: number, viewBoxWidth: number = 1000, viewBoxHeight: number = 600): boolean {
    return x >= 0 && x <= viewBoxWidth && y >= 0 && y <= viewBoxHeight
  }

  // Debug helper: Log all mapped coordinates
  static debugLogCoordinates() {
    console.group('🗺️ Treasure Hunt Coordinates Debug')
    
    REAL_TREASURE_HUNT_COORDINATES.forEach(loc => {
      const percentX = this.svgToPercent(loc.coordinates.x, loc.coordinates.y).x
      const percentY = this.svgToPercent(loc.coordinates.x, loc.coordinates.y).y
      
      console.log(`📍 ${loc.name} (${loc.floor}):`, {
        svg: loc.coordinates,
        percent: { x: percentX.toFixed(1), y: percentY.toFixed(1) },
        status: loc.status,
        position: loc.realWorldPosition
      })
    })
    
    console.groupEnd()
  }
}

// STEP 3: Export for use in supabase.ts
export const getTreasureHuntCoordinates = (locationId: string, locationName: string, floor: string) => {
  return CoordinateMapper.getCoordinates(locationId, locationName, floor)
}

// STEP 4: Testing helper - Use this in browser console to test coordinates
export const testCoordinate = (x: number, y: number) => {
  const percent = CoordinateMapper.svgToPercent(x, y)
  console.log(`SVG (${x}, ${y}) = CSS (${percent.x.toFixed(1)}%, ${percent.y.toFixed(1)}%)`)
  return percent
}