// lib/supabase.ts - FIXED VERSION COMBINING MALL_FLOORS + TENANT_LOCATIONS
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions (unchanged)
export interface SignupCode {
  id: number
  code: string
  created_at: string
  status: 'ACTIVE' | 'USED'
  used_by: number | null
  used_at: string | null
}

export interface Player {
  id: number
  name: string
  phone: string
  signup_code: string
  registered_at: string
  current_progress: number
  completed_all: boolean
}

export interface Location {
  id: string
  name: string
  floor: string
  quiz_question: string
  quiz_options: string[]
  correct_answer: string
  unlock_order: number
  clue: string
  coordinates?: {
    x: number
    y: number
  }
  map_description?: string
  status?: 'locked' | 'available' | 'completed'
}

export interface FloorLayout {
  id: string
  floor_id: string
  floor_code: string
  floor_name: string
  floor_number: number
  total_tenants: number
  viewbox: string
  svg_background_color: string
  svg_path_data: string
}

export interface PlayerProgress {
  id: number
  player_id: number
  location_id: string
  completed_at: string
  photo_url: string | null
  quiz_attempts: number
  quiz_passed: boolean
  next_attempt_allowed: string | null
}

// API Functions
export const supabaseApi = {
  supabase,

  // Validate signup code
  async validateSignupCode(code: string): Promise<{ valid: boolean; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('signup_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('status', 'ACTIVE')
        .single()

      if (error || !data) {
        return { valid: false, message: 'Kode tidak valid atau sudah digunakan' }
      }

      return { valid: true }
    } catch (error) {
      return { valid: false, message: 'Terjadi kesalahan sistem' }
    }
  },

  // Register new player
  async registerPlayer(code: string, name: string, phone: string): Promise<{ success: boolean; player?: Player; message?: string }> {
    try {
      const { data: player, error } = await supabase.rpc('register_player_with_code', {
        p_code: code.toUpperCase(),
        p_name: name,
        p_phone: phone
      })

      if (error) {
        return { success: false, message: error.message }
      }

      return { success: true, player }
    } catch (error) {
      return { success: false, message: 'Terjadi kesalahan sistem' }
    }
  },

  // Get player by ID
  async getPlayer(playerId: number): Promise<Player | null> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single()

      if (error || !data) return null
      return data
    } catch (error) {
      console.error('Get player error:', error)
      return null
    }
  },

  // Get all treasure hunt locations
  async getLocations(): Promise<Location[]> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('unlock_order', { ascending: true })

      if (error || !data) {
        console.error('Get locations error:', error)
        return []
      }

      return data
    } catch (error) {
      console.error('Get locations error:', error)
      return []
    }
  },

  // FIXED: Hybrid data loading from both tables
  async getFloorLayouts(): Promise<FloorLayout[]> {
    try {
      console.log('🏢 HYBRID: Starting getFloorLayouts with hybrid approach...')

      // STEP 1: Get floor structure from mall_floors table
      const { data: floorStructures, error: floorStructuresError } = await supabase
        .from('mall_floors')
        .select('id, floor_code, floor_name, floor_number, total_tenants, viewbox, svg_background_color')
        .eq('is_active', true)
        .order('floor_number', { ascending: true })

      if (floorStructuresError || !floorStructures) {
        console.error('❌ HYBRID: Error getting floor structures:', floorStructuresError)
        return []
      }

      console.log(`📊 HYBRID: Found ${floorStructures.length} floor structures:`, 
        floorStructures.map(f => ({ code: f.floor_code, name: f.floor_name }))
      )

      // STEP 2: Get SVG path data from tenant_locations table
      const { data: tenantLocations, error: tenantLocationsError } = await supabase
        .from('tenant_locations')
        .select('floor_id, svg_path_data')
        .not('svg_path_data', 'is', null)

      if (tenantLocationsError || !tenantLocations) {
        console.error('❌ HYBRID: Error getting tenant locations:', tenantLocationsError)
        return []
      }

      console.log(`📊 HYBRID: Found ${tenantLocations.length} tenant locations with SVG data`)

      // STEP 3: Group SVG data by floor_id
      const svgDataByFloor = new Map<string, string>()
      
      tenantLocations.forEach(tenant => {
        const existing = svgDataByFloor.get(tenant.floor_id) || ''
        svgDataByFloor.set(tenant.floor_id, existing + ' ' + tenant.svg_path_data)
      })

      console.log(`📊 HYBRID: Grouped SVG data for floors:`, Array.from(svgDataByFloor.keys()))

      // STEP 4: Combine floor structures with SVG data
      const floorLayouts: FloorLayout[] = []

      for (const floorStructure of floorStructures) {
        // Get the corresponding SVG data
        const svgData = svgDataByFloor.get(floorStructure.id) || ''
        
        if (!svgData) {
          console.warn(`⚠️ HYBRID: No SVG data found for floor ${floorStructure.floor_code} (${floorStructure.id})`)
          // Still create the layout but with empty SVG data
        }

        const layout: FloorLayout = {
          id: floorStructure.id,
          floor_id: floorStructure.id,
          floor_code: floorStructure.floor_code,
          floor_name: floorStructure.floor_name,
          floor_number: floorStructure.floor_number,
          total_tenants: floorStructure.total_tenants || 0,
          viewbox: floorStructure.viewbox || '0 0 500 325',
          svg_background_color: floorStructure.svg_background_color || '#1a1a1a',
          svg_path_data: svgData.trim()
        }

        console.log(`✅ HYBRID: Created layout for ${floorStructure.floor_code}:`, {
          id: layout.id,
          floor_code: layout.floor_code,
          floor_name: layout.floor_name,
          viewbox: layout.viewbox,
          hasData: !!layout.svg_path_data,
          dataLength: layout.svg_path_data.length
        })

        floorLayouts.push(layout)
      }

      console.log(`🎉 HYBRID: Successfully created ${floorLayouts.length} floor layouts`)
      return floorLayouts

    } catch (error) {
      console.error('❌ HYBRID: Get floor layouts error:', error)
      return []
    }
  },

  // FIXED: Get specific floor layout using hybrid approach
  async getFloorLayout(floorCode: string): Promise<FloorLayout | null> {
    try {
      console.log(`🔍 HYBRID: Getting floor layout for: "${floorCode}"`)
      
      const layouts = await this.getFloorLayouts()
      const result = layouts.find(layout => layout.floor_code === floorCode) || null
      
      if (result) {
        console.log(`✅ HYBRID: Found floor layout for ${floorCode}:`, {
          id: result.id,
          floor_name: result.floor_name,
          viewbox: result.viewbox,
          hasData: !!result.svg_path_data,
          dataLength: result.svg_path_data?.length || 0
        })
      } else {
        console.error(`❌ HYBRID: No floor layout found for: ${floorCode}`)
        console.log('Available floors:', layouts.map(l => l.floor_code))
      }
      
      return result
    } catch (error) {
      console.error('❌ HYBRID: Get floor layout error:', error)
      return null
    }
  },

  // Get locations with real coordinates and status for map
  async getLocationsForMap(playerId: number): Promise<Location[]> {
    try {
      console.log('🗺️ Fetching locations for map...')
      
      // Get treasure hunt locations
      const locationsData = await this.getLocations()
      console.log(`📍 Found ${locationsData.length} treasure hunt locations`)
      
      // Get player progress to determine status
      const progressData = await this.getPlayerProgress(playerId)
      console.log(`📈 Found ${progressData.length} completed locations for player`)
      
      // Calculate coordinates and status for each location
      const locationsWithMapData = locationsData.map((location, index) => {
        // Check if location is completed
        const isCompleted = progressData.some(p => p.location_id === location.id && p.quiz_passed)
        
        // Check if previous location is completed (for availability)
        const previousCompleted = index === 0 || progressData.some(p => 
          p.location_id === locationsData[index - 1]?.id && p.quiz_passed
        )
        
        // Determine status
        let status: 'locked' | 'available' | 'completed' = 'locked'
        if (isCompleted) {
          status = 'completed'
        } else if (previousCompleted) {
          status = 'available'
        }

        // Get REAL coordinates based on viewbox 500x325
        const coordinates = this.getRealLocationCoordinates(location.id, location.name, location.floor)

        const result = {
          ...location,
          coordinates,
          status
        }

        console.log(`📍 ${location.name}: ${status} at (${coordinates.x}, ${coordinates.y})`)
        return result
      })

      return locationsWithMapData
    } catch (error) {
      console.error('❌ Get locations for map error:', error)
      return []
    }
  },

  // UPDATED: Get coordinates for viewbox 500x325
  getRealLocationCoordinates(locationId: string, locationName: string, floor: string): { x: number; y: number } {
    // Based on viewbox 500x325 from your mall_floors data
    const coordinateMap: { [key: string]: { x: number; y: number } } = {
      // Ground Floor locations - Adjusted for 500x325 viewbox
      'main-lobby': { x: 250, y: 70 },    
      'south-lobby': { x: 190, y: 270 },   
      'u-walk': { x: 375, y: 270 },        
      
      // Underground locations
      'food-court': { x: 350, y: 120 },
      
      // First Floor locations  
      'cinema-area': { x: 300, y: 80 },
      'east-dome': { x: 345, y: 95 },
      
      // Add your actual location names here...
    }

    // Try exact match first
    if (coordinateMap[locationId]) {
      console.log(`📍 Found exact coordinates for ID: ${locationId}`)
      return coordinateMap[locationId]
    }

    // Try name-based fuzzy matching
    const nameLower = locationName.toLowerCase()
    for (const [key, coords] of Object.entries(coordinateMap)) {
      const keyName = key.replace('-', ' ')
      if (nameLower.includes(keyName) || keyName.includes(nameLower)) {
        console.log(`📍 Found fuzzy match for "${locationName}" -> ${key}`)
        return coords
      }
    }

    // Fallback coordinates for 500x325 viewbox
    console.warn(`⚠️ Using fallback coordinates for: ${locationName}`)
    return this.generateFallbackCoordinates(locationName, floor)
  },

  // UPDATED: Generate fallback coordinates for 500x325 viewbox
  generateFallbackCoordinates(locationName: string, floor: string): { x: number; y: number } {
    const hash = locationName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)

    // Coordinate ranges for 500x325 viewbox with margin
    const floorBase = {
      'GF': { centerX: 250, centerY: 160, radiusX: 180, radiusY: 120 },
      'UG': { centerX: 250, centerY: 160, radiusX: 150, radiusY: 100 },
      'FF': { centerX: 250, centerY: 160, radiusX: 170, radiusY: 110 }
    }

    const base = floorBase[floor as keyof typeof floorBase] || floorBase['GF']
    
    const x = base.centerX + ((hash % (base.radiusX * 2)) - base.radiusX)
    const y = base.centerY + (((hash >> 8) % (base.radiusY * 2)) - base.radiusY)
    
    // Keep within viewbox bounds: 50-450 for x, 25-300 for y
    return { 
      x: Math.max(50, Math.min(450, x)), 
      y: Math.max(25, Math.min(300, y)) 
    }
  },

  // Get player progress
  async getPlayerProgress(playerId: number): Promise<PlayerProgress[]> {
    try {
      const { data, error } = await supabase
        .from('player_progress')
        .select('*')
        .eq('player_id', playerId)
        .order('completed_at', { ascending: true })

      if (error) {
        console.error('Get player progress error:', error)
        return []
      }

      return data || []
    } catch (error) {
      console.error('Get player progress error:', error)
      return []
    }
  },

  // Submit quiz answer
  // Temporarily replace your submitQuizAnswer function in lib/supabase.ts with this debug version:

  async submitQuizAnswer(playerId: number, locationId: string, answer: string): Promise<{ success: boolean; message: string; correct?: boolean }> {
  try {
    console.log('🐛 DEBUG: Calling RPC with:', { playerId, locationId, answer })
    
    const { data, error } = await supabase.rpc('submit_quiz_answer', {
      p_player_id: playerId,
      p_location_id: locationId,
      p_answer: answer
    })

    console.log('🐛 DEBUG: RPC Response:', { data, error })

    if (error) {
      console.log('🐛 DEBUG: Error detected:', error)
      return { success: false, message: `RPC Error: ${error.message}` }
    }

    console.log('🐛 DEBUG: Returning data:', data)
    return data
    
  } catch (error) {
    console.log('🐛 DEBUG: Catch block triggered:', error)
    return { success: false, message: `Catch Error: ${String(error)}` }
  }
},

  // Upload photo
  async uploadPhoto(playerId: number, locationId: string, photoBlob: Blob): Promise<{ success: boolean; message: string; photoUrl?: string }> {
    try {
      const fileName = `${playerId}_${locationId}_${Date.now()}.jpg`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('photos')
        .upload(fileName, photoBlob, {
          contentType: 'image/jpeg',
          upsert: false
        })

      if (uploadError) {
        return { success: false, message: uploadError.message }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(uploadData.path)

      return { success: true, message: 'Foto berhasil diupload', photoUrl: publicUrl }
    } catch (error) {
      return { success: false, message: 'Gagal mengupload foto' }
    }
  },

  // Get location counts per floor for UI
  async getLocationCountsPerFloor(playerId: number): Promise<{ [key: string]: number }> {
    try {
      const locations = await this.getLocationsForMap(playerId)
      const counts: { [key: string]: number } = {}
      
      locations.forEach(location => {
        counts[location.floor] = (counts[location.floor] || 0) + 1
      })
      
      return counts
    } catch (error) {
      console.error('Get location counts error:', error)
      return {}
    }
  },

  // Debug function
  async fixAllPlayerStats(): Promise<{ fixed: number; errors: string[] }> {
    try {
      const { data, error } = await supabase.rpc('fix_all_player_stats')
      
      if (error) {
        return { fixed: 0, errors: [error.message] }
      }
      
      return data || { fixed: 0, errors: [] }
    } catch (error) {
      return { fixed: 0, errors: [String(error)] }
    }
  }
}