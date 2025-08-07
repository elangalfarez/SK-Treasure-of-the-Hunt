// app/map/page.tsx - ENHANCED VERSION WITH REAL SUPABASE INTEGRATION
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import Header from "@/components/Header"
import { supabaseApi, Location, FloorLayout } from "@/lib/supabase"

// Import the new enhanced components
import FloorMap from "@/components/map/FloorMap"
import FloorSelector from "@/components/map/FloorSelector"
import MiniMap from "@/components/map/MiniMap"

import { AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function EnhancedMapPage() {
  // State management
  const [activeFloor, setActiveFloor] = useState<'GF' | 'UG' | 'FF'>('GF')
  const [locations, setLocations] = useState<Location[]>([])
  const [floorLayouts, setFloorLayouts] = useState<FloorLayout[]>([])
  const [currentFloorLayout, setCurrentFloorLayout] = useState<FloorLayout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [playerId, setPlayerId] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  const router = useRouter()

  // Initialize map data
  useEffect(() => {
    initializeMapData()
  }, [router])

  // Update floor layout when active floor changes
  useEffect(() => {
    const layout = floorLayouts.find(fl => fl.floor_code === activeFloor)
    setCurrentFloorLayout(layout || null)
  }, [activeFloor, floorLayouts])

  const initializeMapData = async () => {
    try {
      // Check authentication
      const storedPlayerId = localStorage.getItem("playerId")
      
      if (!storedPlayerId) {
        console.log('❌ No player session found, redirecting to registration')
        router.push("/")
        return
      }

      const playerIdNum = parseInt(storedPlayerId)
      setPlayerId(playerIdNum)
      
      setLoading(true)
      setError('')

      console.log('🗺️ Loading map data for player:', playerIdNum)

      // Load data in parallel for better performance
      const [locationsData, floorLayoutsData] = await Promise.all([
        supabaseApi.getLocationsForMap(playerIdNum),
        supabaseApi.getFloorLayouts()
      ])

      console.log('📍 Loaded locations:', locationsData.length)
      console.log('🏢 Loaded floor layouts:', floorLayoutsData.length)

      setLocations(locationsData)
      setFloorLayouts(floorLayoutsData)

      // Auto-select floor with available locations
      const availableFloors = ['GF', 'UG', 'FF'].filter(floor => 
        locationsData.some(loc => loc.floor === floor)
      )
      
      if (availableFloors.length > 0 && !availableFloors.includes(activeFloor)) {
        setActiveFloor(availableFloors[0] as 'GF' | 'UG' | 'FF')
      }

    } catch (error) {
      console.error('Map initialization error:', error)
      setError('Gagal memuat peta. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!playerId) return
    
    setRefreshing(true)
    try {
      const locationsData = await supabaseApi.getLocationsForMap(playerId)
      setLocations(locationsData)
      console.log('🔄 Map data refreshed')
    } catch (error) {
      console.error('Refresh error:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleLocationClick = (location: Location) => {
    console.log('📍 Location clicked:', location.name, 'Status:', location.status)
    
    if (location.status === 'locked') {
      alert('Lokasi ini masih terkunci! Selesaikan lokasi sebelumnya terlebih dahulu.')
      return
    }
    
    if (location.status === 'completed') {
      alert('Lokasi ini sudah diselesaikan! Lihat lokasi lain yang tersedia.')
      return
    }
    
    if (location.status === 'available') {
      // Navigate to scanner for this location
      router.push(`/scanner/${location.id}`)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600">
        <Header title="Peta Mall" showBack onBack={() => router.push("/dashboard")} />
        
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-gold mx-auto mb-4 animate-spin" />
            <p className="text-text-light font-medium">Memuat peta treasure hunt...</p>
            <p className="text-text-muted text-sm mt-2">Harap tunggu sebentar</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600">
        <Header title="Peta Mall" showBack onBack={() => router.push("/dashboard")} />
        
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <Card className="bg-red-500/10 border-red-500/30 max-w-md">
            <CardContent className="p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-red-300 font-semibold mb-2">Gagal Memuat Peta</h3>
              <p className="text-text-muted mb-4">{error}</p>
              <Button 
                onClick={initializeMapData}
                className="bg-gold hover:bg-gold/90 text-primary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Coba Lagi
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600">
      <Header 
        title="Peta Treasure Hunt" 
        showBack 
        onBack={() => router.push("/dashboard")}
        action={
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="ghost"
            size="sm"
            className="text-gold hover:bg-gold/10"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        }
      />

      <div className="p-4 space-y-4">
        {/* Floor Statistics Card */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-text-light mb-2">
                Supermal Karawaci
              </h2>
              <div className="flex items-center justify-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold">
                    {locations.filter(l => l.status === 'completed').length}
                  </div>
                  <div className="text-text-muted text-xs">Selesai</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-success">
                    {locations.filter(l => l.status === 'available').length}
                  </div>
                  <div className="text-text-muted text-xs">Tersedia</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-muted">
                    {locations.filter(l => l.status === 'locked').length}
                  </div>
                  <div className="text-text-muted text-xs">Terkunci</div>
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-primary/30 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold to-green-success transition-all duration-1000"
                style={{
                  width: `${locations.length > 0 ? 
                    Math.round((locations.filter(l => l.status === 'completed').length / locations.length) * 100) : 0
                  }%`
                }}
              />
            </div>
            <div className="text-center mt-2 text-sm text-text-muted">
              {locations.length > 0 ? 
                Math.round((locations.filter(l => l.status === 'completed').length / locations.length) * 100) : 0
              }% Progress Game
            </div>
          </CardContent>
        </Card>

        {/* Floor Selector */}
        <FloorSelector
          selectedFloor={activeFloor}
          onFloorChange={setActiveFloor}
          locations={locations}
          loading={false}
        />

        {/* Main Map Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Interactive Map */}
          <div className="lg:col-span-2">
            <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="h-96 lg:h-[500px]">
                  <FloorMap
                    locations={locations}
                    selectedFloor={activeFloor}
                    floorLayout={currentFloorLayout}
                    onLocationClick={handleLocationClick}
                    loading={false}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mini Map / Location List */}
          <div className="lg:col-span-1">
            <MiniMap
              locations={locations}
              selectedFloor={activeFloor}
              onLocationClick={handleLocationClick}
              loading={false}
            />
          </div>
        </div>

        {/* Help Instructions */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-text-light mb-3">Panduan Peta</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-success rounded-full flex-shrink-0"></div>
                <span className="text-text-muted">Lokasi selesai - Tantangan sudah diselesaikan</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gold rounded-full animate-pulse flex-shrink-0"></div>
                <span className="text-text-muted">Lokasi tersedia - Tap untuk mulai tantangan</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-text-muted rounded-full flex-shrink-0"></div>
                <span className="text-text-muted">Lokasi terkunci - Selesaikan lokasi sebelumnya</span>
              </div>
            </div>
            
            <div className="mt-3 p-3 bg-gold/10 border border-gold/20 rounded-lg">
              <p className="text-xs text-gold">
                💡 <strong>Tips:</strong> Gunakan gesture pinch untuk zoom, drag untuk menggeser peta. 
                Tap lokasi berwarna emas untuk memulai treasure hunt!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Export is handled by the default function export above