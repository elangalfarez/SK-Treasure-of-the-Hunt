"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Camera, Lock, CheckCircle, Map, TrendingUp, ChevronDown, ChevronUp } from "lucide-react"
import { supabaseApi, Location, Player, PlayerProgress } from "@/lib/supabase"

interface PlayerData {
  name: string
  phone: string
  code: string
}

export default function DashboardPage() {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [player, setPlayer] = useState<Player | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [progress, setProgress] = useState<PlayerProgress[]>([])
  const [showInstructions, setShowInstructions] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  // Load all data on component mount
  useEffect(() => {
    initializeDashboard()
  }, [router])

  // Auto-refresh progress every 30 seconds
  useEffect(() => {
    if (player) {
      const interval = setInterval(async () => {
        try {
          const progressData = await supabaseApi.getPlayerProgress(player.id)
          setProgress(progressData)
        } catch (error) {
          console.error('Auto-refresh error:', error)
        }
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [player])

  const initializeDashboard = async () => {
    try {
      const playerId = localStorage.getItem("playerId")
      const playerName = localStorage.getItem("playerName") 
      const playerPhone = localStorage.getItem("playerPhone")
      
      console.log('🔍 Dashboard localStorage check:', { playerId, playerName, playerPhone })
      
      if (!playerId || !playerName || !playerPhone) {
        console.log('❌ Missing localStorage data, redirecting to registration')
        router.push("/")
        return
      }
      
      console.log('✅ Found player data, loading from database...')
      setPlayerData({
        name: playerName,
        phone: playerPhone,
        code: "REGISTERED"
      })

      setLoading(true)

      // Load all data in parallel
      const [playerDataFromDB, locationsData, progressData] = await Promise.all([
        supabaseApi.getPlayer(parseInt(playerId)),
        supabaseApi.getLocations(),
        supabaseApi.getPlayerProgress(parseInt(playerId))
      ])

      if (!playerDataFromDB) {
        localStorage.clear()
        router.push('/')
        return
      }

      setPlayer(playerDataFromDB)
      setLocations(locationsData)
      setProgress(progressData)

      console.log('📊 Loaded data:', { 
        player: playerDataFromDB, 
        locations: locationsData.length, 
        progress: progressData.length 
      })

    } catch (error) {
      console.error('Dashboard initialization error:', error)
      setError('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  // Calculate progress with real data
  const completedCount = progress.length
  const totalCount = locations.length
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Determine location status with real progress data
  const getLocationStatus = (location: Location, index: number) => {
    const isCompleted = progress.some(p => p.location_id === location.id)
    const previousCompleted = index === 0 || progress.some(p => p.location_id === locations[index - 1]?.id)
    
    if (isCompleted) return 'completed'
    if (previousCompleted) return 'available'
    return 'locked'
  }

  const handleLocationClick = (location: Location) => {
    const status = getLocationStatus(location, locations.findIndex(l => l.id === location.id))
    
    if (status === 'locked') {
      alert('Lokasi ini masih terkunci! Selesaikan lokasi sebelumnya terlebih dahulu.')
      return
    }
    
    if (status === 'completed') {
      alert('Lokasi ini sudah diselesaikan! ✅')
      return
    }
    
    // Navigate to scanner
    localStorage.setItem('currentLocationId', location.id)
    router.push(`/scanner/${location.id}`)
  }

  const getLocationIcon = (location: Location, index: number) => {
    const status = getLocationStatus(location, index)
    
    switch (status) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-green-400" />
      case "available":
        return <Camera className="w-6 h-6 text-gold animate-pulse" />
      default:
        return <Lock className="w-6 h-6 text-text-muted" />
    }
  }

  const getLocationCardClass = (location: Location, index: number) => {
    const status = getLocationStatus(location, index)
    
    switch (status) {
      case "completed":
        return "bg-green-500/10 border-green-500/30 hover:border-green-500/50"
      case "available":
        return "bg-gold/10 border-gold/30 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/10 cursor-pointer"
      default:
        return "bg-onyx-gray/30 border-text-muted/20 opacity-60"
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-light">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600 flex items-center justify-center p-4">
        <Card className="bg-red-500/10 border-red-500/30 max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold mb-2 text-red-400">Terjadi Kesalahan</h3>
            <p className="text-sm mb-4 text-text-muted">{error}</p>
            <Button 
              onClick={initializeDashboard}
              className="bg-gold text-primary hover:bg-gold/90"
            >
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!playerData) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-onyx-gray border-b border-gold/20 p-4 text-center">
        <h1 className="text-xl font-bold text-gold">🏆 Dashboard</h1>
        <p className="text-text-muted text-sm">Welcome, {playerData.name}</p>
        <div className="mt-2">
          <div className="text-gold font-bold text-lg">{progressPercentage}%</div>
          <div className="text-text-muted text-xs">Progress</div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Statistics */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-text-light">Progress Anda</h3>
              <span className="text-gold font-bold">
                {completedCount}/{totalCount}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2 mb-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">{completedCount}</div>
                <div className="text-xs text-text-muted">Selesai</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gold">
                  {locations.filter((l, i) => getLocationStatus(l, i) === "available").length}
                </div>
                <div className="text-xs text-text-muted">Tersedia</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-light">{progressPercentage}%</div>
                <div className="text-xs text-text-muted">Progres</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Locations Grid */}
        <div className="grid grid-cols-2 gap-4">
          {locations.map((location, index) => {
            const status = getLocationStatus(location, index)
            
            return (
              <Card
                key={location.id}
                className={`transition-all duration-300 ${getLocationCardClass(location, index)}`}
                onClick={() => handleLocationClick(location)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    {getLocationIcon(location, index)}
                    <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded-full">
                      {location.floor}
                    </span>
                  </div>
                  <h4 className="font-semibold text-text-light text-sm mb-1">
                    {location.name}
                  </h4>
                  <p className="text-xs text-text-muted line-clamp-2">
                    Clue: {location.clue.substring(0, 40)}...
                  </p>
                  {status === "available" && (
                    <div className="mt-2 text-xs text-gold font-medium">
                      Tap untuk mulai →
                    </div>
                  )}
                  {status === "completed" && (
                    <div className="mt-2 text-xs text-green-400 font-medium">
                      ✅ Selesai
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => router.push("/map")}
            className="bg-onyx-gray/50 border border-gold/30 text-text-light hover:bg-gold/10 hover:border-gold/50"
            variant="outline"
          >
            <Map className="w-4 h-4 mr-2" />
            Lihat Peta
          </Button>
          <Button
            onClick={() => router.push("/progress")}
            className="bg-onyx-gray/50 border border-gold/30 text-text-light hover:bg-gold/10 hover:border-gold/50"
            variant="outline"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Progress
          </Button>
        </div>

        {/* Instructions */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <Button
              variant="ghost"
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between text-text-light hover:text-gold p-0"
            >
              <span className="font-semibold">Cara Bermain</span>
              {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>

            {showInstructions && (
              <div className="mt-4 space-y-3 text-sm text-text-muted">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gold/20 text-gold rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    1
                  </div>
                  <p>Kunjungi lokasi yang tersedia (ditandai dengan ikon kamera berkedip)</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gold/20 text-gold rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    2
                  </div>
                  <p>Scan QR code yang tersedia di lokasi tersebut</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gold/20 text-gold rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    3
                  </div>
                  <p>Ambil foto selfie dengan dekorasi kemerdekaan</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gold/20 text-gold rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    4
                  </div>
                  <p>Jawab kuis tentang kemerdekaan Indonesia</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-gold/20 text-gold rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    5
                  </div>
                  <p>Selesaikan semua lokasi untuk mendapatkan hadiah 0.1g emas!</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Real-time Progress Display */}
        {progress.length > 0 && (
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="p-4">
              <h4 className="text-green-300 font-semibold text-sm mb-2">🎉 Lokasi yang Sudah Diselesaikan:</h4>
              <div className="space-y-2">
                {progress.map((p) => {
                  const location = locations.find(l => l.id === p.location_id)
                  return (
                    <div key={p.id} className="flex justify-between items-center text-sm">
                      <span className="text-text-light">✅ {location?.name}</span>
                      <span className="text-text-muted text-xs">
                        {new Date(p.completed_at).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}