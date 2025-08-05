// utils/database-repair.ts
// Run this once to fix existing player stats

import { supabaseApi } from '@/lib/supabase'

export async function repairDatabase() {
  console.log('🔧 Starting database repair...')
  
  try {
    // Fix all player stats
    const result = await supabaseApi.fixAllPlayerStats()
    
    console.log(`✅ Fixed ${result.fixed} players`)
    
    if (result.errors.length > 0) {
      console.log('❌ Errors:')
      result.errors.forEach(error => console.log('  ', error))
    }
    
    // Verify the fix by checking a few players
    console.log('\n🔍 Verification:')
    
    const { data: players } = await supabaseApi.supabase
      .from('players')
      .select('id, name, current_progress, completed_all')
      .limit(5)
    
    players?.forEach(player => {
      console.log(`Player ${player.id} (${player.name}): progress=${player.current_progress}, completed=${player.completed_all}`)
    })
    
    return { success: true, fixed: result.fixed, errors: result.errors }
    
  } catch (error) {
    console.error('❌ Repair failed:', error)
    return { success: false, error: String(error) }
  }
}

// For use in browser console or Next.js page
export async function runRepairFromBrowser() {
  if (typeof window !== 'undefined') {
    console.log('🌐 Running repair from browser...')
    return await repairDatabase()
  } else {
    console.log('❌ This function must be run in browser environment')
    return { success: false, error: 'Browser environment required' }
  }
}