"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Camera, Lock, CheckCircle, Map, TrendingUp, ChevronDown, ChevronUp } from "lucide-react"
import Header from "@/components/Header"

interface Location {
  id: string
  name: string
  floor: string
  status: "locked" | "available" | "completed"
  description: string
}

interface PlayerData {
  name: string
  phone: string
  code: string
}

export default function DashboardPage() {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const router = useRouter()

  const locations: Location[] = [
    {
      id: "atrium",
      name: "Atrium Central",
      floor: "GF",
      status: "available",
      description: "Temukan petunjuk di area atrium utama",
    },
    {
      id: "foodcourt",
      name: "Food Court",
      floor: "UG",
      status: "locked",
      description: "Jelajahi area kuliner yang lezat",
    },
    {
      id: "cinema",
      name: "Cinema XXI",
      floor: "FF",
      status: "locked",
      description: "Petualangan di area hiburan",
    },
    {
      id: "playground",
      name: "Kids Playground",
      floor: "GF",
      status: "locked",
      description: "Area bermain yang menyenangkan",
    },
  ]

  const completedCount = locations.filter((l) => l.status === "completed").length
  const progressPercentage = (completedCount / locations.length) * 100

  useEffect(() => {
    const data = localStorage.getItem("playerData")
    if (!data) {
      router.push("/")
      return
    }
    setPlayerData(JSON.parse(data))
  }, [router])

  const handleLocationClick = (location: Location) => {
    if (location.status === "locked") return
    if (location.status === "completed") {
      router.push(`/progress`)
      return
    }
    router.push(`/scanner/${location.id}`)
  }

  const getLocationIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-green-success" />
      case "available":
        return <Camera className="w-6 h-6 text-gold animate-pulse" />
      default:
        return <Lock className="w-6 h-6 text-text-muted" />
    }
  }

  const getLocationCardClass = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-success/10 border-green-success/30 hover:border-green-success/50"
      case "available":
        return "bg-gold/10 border-gold/30 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/10 cursor-pointer"
      default:
        return "bg-onyx-gray/30 border-text-muted/20 opacity-60"
    }
  }

  if (!playerData) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600">
      <Header title="Dashboard" playerName={playerData.name} progress={progressPercentage} />

      <div className="p-4 space-y-6">
        {/* Statistics */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-text-light">Progress Anda</h3>
              <span className="text-gold font-bold">
                {completedCount}/{locations.length}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2 mb-3" />
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-success">{completedCount}</div>
                <div className="text-xs text-text-muted">Selesai</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gold">
                  {locations.filter((l) => l.status === "available").length}
                </div>
                <div className="text-xs text-text-muted">Tersedia</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-text-light">{Math.round(progressPercentage)}%</div>
                <div className="text-xs text-text-muted">Progres</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Locations Grid */}
        <div className="grid grid-cols-2 gap-4">
          {locations.map((location) => (
            <Card
              key={location.id}
              className={`transition-all duration-300 ${getLocationCardClass(location.status)}`}
              onClick={() => handleLocationClick(location)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  {getLocationIcon(location.status)}
                  <span className="text-xs bg-gold/20 text-gold px-2 py-1 rounded-full">{location.floor}</span>
                </div>
                <h4 className="font-semibold text-text-light text-sm mb-1">{location.name}</h4>
                <p className="text-xs text-text-muted line-clamp-2">{location.description}</p>
                {location.status === "available" && (
                  <div className="mt-2 text-xs text-gold font-medium">Tap untuk mulai →</div>
                )}
              </CardContent>
            </Card>
          ))}
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
                  <p>Selesaikan semua lokasi untuk mendapatkan hadiah menarik!</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
