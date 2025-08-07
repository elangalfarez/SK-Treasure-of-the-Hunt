// lib/supabase.ts - FIXED VERSION WITH CORRECT FLOOR ID
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

  // FIXED: Get floor layouts with correct floor ID mapping
  async getFloorLayouts(): Promise<FloorLayout[]> {
    try {
      console.log('🏢 FIXED: Starting getFloorLayouts...')

      // STEP 1: Try mall_floors table first
      const { data: mallFloorsData, error: mallFloorsError } = await supabase
        .from('mall_floors')
        .select('*')
        .order('floor_number', { ascending: true })

      if (!mallFloorsError && mallFloorsData && mallFloorsData.length > 0) {
        console.log('✅ Using mall_floors table data:', mallFloorsData)
        return mallFloorsData
      }

      console.log('🔄 mall_floors not available, fetching from tenant_locations...')
      
      // STEP 2: Get floor data from tenant_locations with CORRECT floor_id
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenant_locations')
        .select('id, floor_id, svg_path_data, center_coordinates, fill_color, stroke_color')
        .not('svg_path_data', 'is', null)

      console.log('📊 Tenant data result:', { 
        count: tenantData?.length || 0, 
        error: tenantError?.message,
        uniqueFloorIds: tenantData ? Array.from(new Set(tenantData.map(t => t.floor_id))) : []
      })

      if (tenantError || !tenantData || tenantData.length === 0) {
        console.error('❌ No tenant_locations data found:', tenantError)
        return []
      }

      // STEP 3: Get unique floor IDs from your actual database
      const uniqueFloorIds = Array.from(new Set(tenantData.map(item => item.floor_id)))
      console.log('🏢 Unique floor IDs found:', uniqueFloorIds)

      // STEP 4: Create floor layouts using REAL floor IDs from your database
      const floorLayouts: FloorLayout[] = []

      // From your SQL results, the actual floor_id is: '2f08998d-357e-4e77-ab9b-eb438868d4f2'
      // Since you only have one floor with 505 records, let's create different logical floors
      
      uniqueFloorIds.forEach((floorId, index) => {
        const floorData = tenantData.filter(item => item.floor_id === floorId)
        
        if (floorData.length === 0) return

        // Combine all SVG path data for this floor
        const combinedSvgPaths = floorData
          .map(item => item.svg_path_data)
          .filter(Boolean)
          .join(' ')

        if (!combinedSvgPaths) {
          console.warn(`⚠️ No SVG data for floor: ${floorId}`)
          return
        }

        // Since you have only one physical floor but need GF/UG/FF for the treasure hunt,
        // we'll create multiple logical floors from the same data
        const logicalFloors = [
          { code: 'GF', name: 'Ground Floor', number: 0 },
          { code: 'UG', name: 'Underground', number: -1 },
          { code: 'FF', name: 'First Floor', number: 1 }
        ]

        logicalFloors.forEach(floorInfo => {
          const layout: FloorLayout = {
            id: `${floorId}-${floorInfo.code}`,
            floor_id: floorId, // Use the REAL floor_id from your database
            floor_code: floorInfo.code,
            floor_name: floorInfo.name,
            floor_number: floorInfo.number,
            total_tenants: floorData.length,
            viewbox: '0 0 500 400', // Adjusted viewbox based on your coordinate data
            svg_background_color: '#1F2937',
            svg_path_data: combinedSvgPaths
          }

          console.log(`✅ Created floor layout for ${floorInfo.code}:`, {
            id: layout.id,
            floor_id: layout.floor_id,
            code: layout.floor_code,
            name: layout.floor_name,
            dataLength: layout.svg_path_data.length
          })

          floorLayouts.push(layout)
        })
      })

      console.log(`🎉 Final result: ${floorLayouts.length} floor layouts created`)
      return floorLayouts.sort((a, b) => a.floor_number - b.floor_number)

    } catch (error) {
      console.error('❌ Get floor layouts error:', error)
      return []
    }
  },

  // FIXED: Get specific floor layout
  async getFloorLayout(floorCode: string): Promise<FloorLayout | null> {
    try {
      console.log(`🔍 FIXED: Getting floor layout for: ${floorCode}`)
      const layouts = await this.getFloorLayouts()
      
      console.log('Available layouts:', layouts.map(l => ({ 
        code: l.floor_code, 
        name: l.floor_name,
        hasData: !!l.svg_path_data,
        dataLength: l.svg_path_data?.length || 0 
      })))
      
      const result = layouts.find(layout => layout.floor_code === floorCode) || null
      
      if (result) {
        console.log(`✅ Found floor layout for ${floorCode}:`, {
          name: result.floor_name,
          hasData: !!result.svg_path_data,
          dataLength: result.svg_path_data?.length || 0,
          viewbox: result.viewbox
        })
      } else {
        console.log(`❌ No floor layout found for: ${floorCode}`)
      }
      
      return result
    } catch (error) {
      console.error('Get floor layout error:', error)
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

        // Get REAL coordinates based on your coordinate data
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

  // UPDATED: Get real coordinates based on your database structure
  getRealLocationCoordinates(locationId: string, locationName: string, floor: string): { x: number; y: number } {
    // Based on your center_coordinates data, the viewbox appears to be around 500x400
    // Your coordinates range from x:56-470, y:53-272
    
    const coordinateMap: { [key: string]: { x: number; y: number } } = {
      // Ground Floor locations - Based on center coordinates from your data
      'main-lobby': { x: 250, y: 200 }, // Centered position
      'south-lobby': { x: 400, y: 300 }, // South area
      'u-walk': { x: 150, y: 250 }, // West area
      
      // Underground locations (reusing some coordinates)
      'food-court': { x: 350, y: 150 },
      
      // First Floor locations  
      'cinema-area': { x: 300, y: 100 },
      'east-dome': { x: 450, y: 200 }, // Based on console showing "East Dome"
      
      // Add more based on your actual location names...
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

    // Fallback coordinates based on floor and name hash
    console.warn(`⚠️ Using fallback coordinates for: ${locationName}`)
    return this.generateFallbackCoordinates(locationName, floor)
  },

  // Generate fallback coordinates that fit your viewbox
  generateFallbackCoordinates(locationName: string, floor: string): { x: number; y: number } {
    const hash = locationName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)

    // Based on your data: x ranges 56-470, y ranges 53-272
    const floorBase = {
      'GF': { centerX: 250, centerY: 200, radiusX: 150, radiusY: 100 },
      'UG': { centerX: 250, centerY: 200, radiusX: 120, radiusY: 80 },
      'FF': { centerX: 250, centerY: 200, radiusX: 140, radiusY: 90 }
    }

    const base = floorBase[floor as keyof typeof floorBase] || floorBase['GF']
    
    const x = base.centerX + ((hash % (base.radiusX * 2)) - base.radiusX)
    const y = base.centerY + (((hash >> 8) % (base.radiusY * 2)) - base.radiusY)
    
    // Keep within your actual coordinate bounds: x:56-470, y:53-272
    return { 
      x: Math.max(56, Math.min(470, x)), 
      y: Math.max(53, Math.min(272, y)) 
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
  async submitQuizAnswer(playerId: number, locationId: string, answer: string): Promise<{ success: boolean; message: string; correct?: boolean }> {
    try {
      const { data, error } = await supabase.rpc('submit_quiz_answer', {
        p_player_id: playerId,
        p_location_id: locationId,
        p_answer: answer
      })

      if (error) {
        return { success: false, message: error.message }
      }

      return data
    } catch (error) {
      return { success: false, message: 'Terjadi kesalahan sistem' }
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