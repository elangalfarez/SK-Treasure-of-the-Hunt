// components/DatabaseDebugger.tsx
"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabaseApi } from '@/lib/supabase'

export default function DatabaseDebugger() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const runDiagnostics = async () => {
    setLoading(true)
    setResults(null)

    try {
      // Get current state
      const [players, progress, locations] = await Promise.all([
        supabaseApi.supabase.from('players').select('id, name, current_progress, completed_all').limit(10),
        supabaseApi.supabase.from('player_progress').select('*').limit(20),
        supabaseApi.supabase.from('locations').select('*')
      ])

      // Count progress per player
      const progressCounts = progress.data?.reduce((acc: any, item: any) => {
        if (item.quiz_passed) {
          acc[item.player_id] = (acc[item.player_id] || 0) + 1
        }
        return acc
      }, {}) || {}

      setResults({
        players: players.data,
        progress: progress.data,
        locations: locations.data,
        progressCounts,
        totalLocations: locations.data?.length || 0
      })

    } catch (error) {
      console.error('Diagnostics error:', error)
      setResults({ error: String(error) })
    } finally {
      setLoading(false)
    }
  }

  const fixDatabase = async () => {
    setLoading(true)
    
    try {
      const result = await supabaseApi.fixAllPlayerStats()
      alert(`Fixed ${result.fixed} players. Errors: ${result.errors.length}`)
      
      // Refresh diagnostics
      await runDiagnostics()
      
    } catch (error) {
      alert(`Fix failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-red-500/10 border-red-500/30 m-4">
      <CardContent className="p-4">
        <h3 className="text-red-300 font-semibold mb-4">🔧 Database Debugger (REMOVE IN PRODUCTION)</h3>
        
        <div className="flex gap-2 mb-4">
          <Button 
            onClick={runDiagnostics} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Loading...' : 'Run Diagnostics'}
          </Button>
          
          <Button 
            onClick={fixDatabase} 
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Fixing...' : 'Fix Database'}
          </Button>
        </div>

        {results && (
          <div className="bg-black/50 p-4 rounded text-xs font-mono max-h-96 overflow-y-auto">
            {results.error ? (
              <div className="text-red-400">Error: {results.error}</div>
            ) : (
              <>
                <div className="text-green-400 mb-2">
                  📊 Total Locations: {results.totalLocations}
                </div>
                
                <div className="text-yellow-400 mb-2">👥 Players Status:</div>
                {results.players?.map((player: any) => (
                  <div key={player.id} className="ml-2">
                    Player {player.id} ({player.name}): 
                    DB says {player.current_progress}/{results.totalLocations} 
                    ({player.completed_all ? 'COMPLETE' : 'INCOMPLETE'}) |
                    Actual: {results.progressCounts[player.id] || 0}/{results.totalLocations}
                    {player.current_progress !== (results.progressCounts[player.id] || 0) && (
                      <span className="text-red-400"> ❌ MISMATCH</span>
                    )}
                  </div>
                ))}
                
                <div className="text-cyan-400 mt-4 mb-2">📍 Recent Progress:</div>
                {results.progress?.slice(0, 10).map((prog: any) => (
                  <div key={prog.id} className="ml-2">
                    Player {prog.player_id} → {prog.location_id} 
                    ({prog.quiz_passed ? 'PASSED' : 'FAILED'})
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}