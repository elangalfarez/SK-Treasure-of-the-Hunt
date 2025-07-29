// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions for our database
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
  // Expose supabase client for direct queries
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
      // First check if code is still valid
      const codeValidation = await this.validateSignupCode(code)
      if (!codeValidation.valid) {
        return { success: false, message: codeValidation.message }
      }

      // Register player
      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert([{
          name: name.trim(),
          phone: phone.trim(),
          signup_code: code.toUpperCase()
        }])
        .select()
        .single()

      if (playerError) {
        if (playerError.code === '23505') {
          return { success: false, message: 'Nomor telepon sudah terdaftar' }
        }
        throw playerError
      }

      // Mark code as used
      await supabase
        .from('signup_codes')
        .update({ 
          status: 'USED', 
          used_by: player.id, 
          used_at: new Date().toISOString() 
        })
        .eq('code', code.toUpperCase())

      return { success: true, player }

    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, message: 'Gagal mendaftar. Coba lagi nanti.' }
    }
  },

  // Get player data
  async getPlayer(playerId: number): Promise<Player | null> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Get player error:', error)
      return null
    }
  },

  // Get all locations
  async getLocations(): Promise<Location[]> {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('unlock_order')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get locations error:', error)
      return []
    }
  },

  // Get player progress
  async getPlayerProgress(playerId: number): Promise<PlayerProgress[]> {
    try {
      const { data, error } = await supabase
        .from('player_progress')
        .select('*')
        .eq('player_id', playerId)
        .eq('quiz_passed', true)
        .order('completed_at')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Get progress error:', error)
      return []
    }
  },

  // Submit location completion
  async submitLocationProgress(playerId: number, locationId: string, photoUrl?: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Check if already completed
      const { data: existing } = await supabase
        .from('player_progress')
        .select('*')
        .eq('player_id', playerId)
        .eq('location_id', locationId)
        .eq('quiz_passed', true)
        .single()

      if (existing) {
        return { success: false, message: 'Lokasi ini sudah diselesaikan' }
      }

      // Insert progress
      const { error } = await supabase
        .from('player_progress')
        .insert([{
          player_id: playerId,
          location_id: locationId,
          photo_url: photoUrl,
          quiz_passed: true,
          quiz_attempts: 1
        }])

      if (error) throw error

      return { success: true, message: 'Lokasi berhasil diselesaikan!' }

    } catch (error) {
      console.error('Submit progress error:', error)
      return { success: false, message: 'Gagal menyimpan progress' }
    }
  }
}