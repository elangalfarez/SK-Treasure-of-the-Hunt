"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Trophy, 
  Camera, 
  MapPin, 
  Calendar, 
  Award, 
  Share2, 
  Clock,
  Star,
  CheckCircle,
  Lock,
  ArrowLeft,
  Target,
  Gift,
  Users
} from "lucide-react"
import { supabaseApi, Location, Player, PlayerProgress } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
}

export default function ProgressPage() {
  const [player, setPlayer] = useState<Player | null>(null)
  const [locations, setLocations] = useState<Location[]>([])
  const [progress, setProgress] = useState<PlayerProgress[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadProgressData()
  }, [])

  const loadProgressData = async () => {
    try {
      const playerId = localStorage.getItem('playerId')
      if (!playerId) {
        router.push('/')
        return
      }

      setLoading(true)

      // Load all data in parallel using Supabase
      const [playerData, locationsData, progressData] = await Promise.all([
        supabaseApi.getPlayer(parseInt(playerId)),
        supabaseApi.getLocations(),
        supabaseApi.getPlayerProgress(parseInt(playerId))
      ])

      if (!playerData) {
        localStorage.clear()
        router.push('/')
        return
      }

      setPlayer(playerData)
      setLocations(locationsData)
      setProgress(progressData)

      // Generate achievements based on actual progress
      generateAchievements(progressData, locationsData)

    } catch (error) {
      console.error('Progress loading error:', error)
      setError('Gagal memuat data progress')
    } finally {
      setLoading(false)
    }
  }

  const generateAchievements = (progressData: PlayerProgress[], locationsData: Location[]) => {
    const completedCount = progressData.length
    const totalLocations = locationsData.length

    const achievementsList: Achievement[] = [
      {
        id: "first_step",
        title: "Langkah Pertama",
        description: "Selesaikan lokasi pertama",
        icon: "🎯",
        unlocked: completedCount >= 1,
        unlockedAt: completedCount >= 1 ? progressData[0]?.completed_at : undefined,
      },
      {
        id: "halfway_hero",
        title: "Pahlawan Setengah Jalan",
        description: "Selesaikan setengah dari semua lokasi",
        icon: "⭐",
        unlocked: completedCount >= Math.ceil(totalLocations / 2),
        unlockedAt: completedCount >= Math.ceil(totalLocations / 2) ? progressData[Math.ceil(totalLocations / 2) - 1]?.completed_at : undefined,
      },
      {
        id: "photo_master",
        title: "Master Fotografi",
        description: "Ambil foto di semua lokasi",
        icon: "📸",
        unlocked: completedCount >= totalLocations,
        unlockedAt: completedCount >= totalLocations ? progressData[totalLocations - 1]?.completed_at : undefined,
      },
      {
        id: "independence_champion",
        title: "Juara Kemerdekaan",
        description: "Selesaikan semua tantangan",
        icon: "🏆",
        unlocked: completedCount >= totalLocations,
        unlockedAt: completedCount >= totalLocations ? progressData[totalLocations - 1]?.completed_at : undefined,
      },
    ]

    setAchievements(achievementsList)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const calculateOverallProgress = () => {
    if (locations.length === 0) return 0
    return Math.round((progress.length / locations.length) * 100)
  }

  const getLocationStatus = (locationId: string) => {
    return progress.some(p => p.location_id === locationId) ? 'completed' : 'pending'
  }

  const shareProgress = async () => {
    const progressPercent = calculateOverallProgress()
    const text = `🏆 Saya telah menyelesaikan ${progressPercent}% Treasure Hunt Supermal Karawaci! ${progress.length}/${locations.length} lokasi selesai. Ikut main juga yuk! #TreasureHuntSupermal #Kemerdekaan2025`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Progress Treasure Hunt Supermal Karawaci",
          text: text,
          url: window.location.origin,
        })
        
        toast({
          title: "Berhasil dibagikan! 🎉",
          description: "Progress Anda telah dibagikan",
        })
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(text)
        toast({
          title: "Disalin ke clipboard",
          description: "Silakan paste di media sosial Anda",
        })
      }
    } else {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Disalin ke clipboard",
        description: "Silakan paste di media sosial Anda",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-light">Memuat progress...</p>
        </div>
      </div>
    )
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600 flex items-center justify-center p-4">
        <Card className="bg-red-500/10 border-red-500/30 max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold mb-2 text-red-400">Terjadi Kesalahan</h3>
            <p className="text-sm mb-4 text-text-muted">{error || 'Data tidak ditemukan'}</p>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="bg-gold text-primary hover:bg-gold/90"
            >
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const progressPercent = calculateOverallProgress()
  const completedCount = progress.length
  const totalLocations = locations.length
  const unlockedAchievements = achievements.filter(a => a.unlocked)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-onyx-gray border-b border-gold/20 p-4">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.push("/dashboard")}
            className="text-text-light hover:text-gold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gold">Progress Anda</h1>
            <p className="text-text-muted text-sm">Supermal Karawaci</p>
          </div>
          <div className="text-right">
            <p className="text-text-light text-sm font-semibold">{player.name}</p>
            <p className="text-text-muted text-xs">{completedCount}/{totalLocations} selesai</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Main Progress Card */}
        <Card className="bg-gradient-to-br from-gold/20 to-gold/5 border-gold/30 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              {/* Progress Circle Visual */}
              <div className="relative w-32 h-32 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full bg-gold/20"></div>
                <div 
                  className="absolute inset-2 rounded-full bg-gradient-to-br from-gold to-gold/80 flex items-center justify-center"
                  style={{
                    background: `conic-gradient(from 0deg, #D4AF37 ${progressPercent * 3.6}deg, transparent ${progressPercent * 3.6}deg)`
                  }}
                >
                  <div className="bg-primary rounded-full w-20 h-20 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-gold" />
                  </div>
                </div>
                {/* Progress Badge */}
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold">
                  {completedCount}
                </div>
              </div>

              {/* Status Message */}
              <div className="mb-4">
                {progressPercent === 100 ? (
                  <>
                    <h2 className="text-2xl font-bold text-gold mb-2">🎉 Selamat!</h2>
                    <p className="text-text-light">Anda telah menyelesaikan semua tantangan!</p>
                    <p className="text-text-muted text-sm mt-1">Klaim hadiah Anda di customer service</p>
                  </>
                ) : progressPercent === 0 ? (
                  <>
                    <h2 className="text-2xl font-bold text-gold mb-2">Mulai Petualangan!</h2>
                    <p className="text-text-light">{totalLocations} lokasi menanti Anda</p>
                    <p className="text-text-muted text-sm mt-1">Scan QR code di setiap lokasi untuk memulai</p>
                  </>
                ) : (
                  <>
                    <h2 className="text-2xl font-bold text-gold mb-2">Terus Semangat!</h2>
                    <p className="text-text-light">{completedCount} dari {totalLocations} lokasi selesai</p>
                    <p className="text-text-muted text-sm mt-1">Anda sudah {progressPercent}% menuju hadiah!</p>
                  </>
                )}
              </div>

              {/* Progress Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold">{progressPercent}%</div>
                  <div className="text-xs text-text-muted">Selesai</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-text-light">{completedCount * 100}</div>
                  <div className="text-xs text-text-muted">Poin</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{unlockedAchievements.length}</div>
                  <div className="text-xs text-text-muted">Prestasi</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <Progress value={progressPercent} className="h-3 mb-2" />
                <p className="text-text-muted text-xs">Progress Keseluruhan: {completedCount}/{totalLocations}</p>
              </div>

              {/* Share Button */}
              <Button 
                onClick={shareProgress} 
                className="bg-gold hover:bg-gold/90 text-primary font-semibold"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Bagikan Progress
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Perjalanan Anda */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-text-light mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-gold" />
              Perjalanan Anda
            </h3>

            {locations.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">Sedang memuat lokasi...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {locations.map((location, index) => {
                  const isCompleted = getLocationStatus(location.id) === 'completed'
                  const completedProgress = progress.find(p => p.location_id === location.id)
                  
                  return (
                    <div key={location.id} className="relative">
                      {/* Connection Line */}
                      {index < locations.length - 1 && (
                        <div className="absolute left-6 top-12 w-0.5 h-16 bg-gold/30"></div>
                      )}
                      
                      <div className={`flex items-start space-x-4 p-4 rounded-xl border transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-onyx-gray/30 border-text-muted/20'
                      }`}>
                        {/* Status Icon */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                          isCompleted
                            ? 'bg-green-500/20 border-green-500 text-green-400'
                            : 'bg-text-muted/20 border-text-muted text-text-muted'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : (
                            <Lock className="w-6 h-6" />
                          )}
                        </div>

                        {/* Location Info */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-text-light">{location.name}</h4>
                            <Badge className={`${
                              isCompleted 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : 'bg-gold/20 text-gold border-gold/30'
                            }`}>
                              {location.floor}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-text-muted mb-2">
                            {location.quiz_question.substring(0, 60)}...
                          </p>

                          {isCompleted && completedProgress && (
                            <div className="flex items-center text-xs text-green-400">
                              <Calendar className="w-3 h-3 mr-1" />
                              Selesai: {formatDate(completedProgress.completed_at)}
                            </div>
                          )}

                          {!isCompleted && (
                            <div className="flex items-center text-xs text-text-muted">
                              <Target className="w-3 h-3 mr-1" />
                              Kunjungi lokasi untuk memulai
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {completedCount === 0 && (
              <div className="text-center mt-6">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="bg-gold hover:bg-gold/90 text-primary font-semibold"
                >
                  Mulai Petualangan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-text-light mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-gold" />
              Prestasi ({unlockedAchievements.length}/{achievements.length})
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    achievement.unlocked 
                      ? "bg-gold/10 border-gold/30" 
                      : "bg-primary/20 border-text-muted/20 opacity-60"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${
                        achievement.unlocked ? "text-gold" : "text-text-muted"
                      }`}>
                        {achievement.title}
                      </h4>
                      <p className="text-xs text-text-muted">{achievement.description}</p>
                      {achievement.unlocked && achievement.unlockedAt && (
                        <p className="text-xs text-gold mt-1">
                          Dibuka: {formatDate(achievement.unlockedAt)}
                        </p>
                      )}
                    </div>
                    {achievement.unlocked && <Star className="w-5 h-5 text-gold" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Prize Info */}
        {progressPercent === 100 ? (
          <Card className="bg-gradient-to-r from-gold/20 to-gold/10 border-gold/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Gift className="w-12 h-12 text-gold mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gold mb-2">
                🎉 Selamat! Anda Berhak Mendapat Hadiah!
              </h3>
              <p className="text-text-muted mb-4">
                Kunjungi customer service VIP counter di main lobby untuk mengklaim hadiah 0.1g emas Anda!
              </p>
              <Badge className="bg-gold/20 text-gold border-gold/30 text-sm">
                💰 Hadiah: 0.1g Logam Mulia
              </Badge>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <h4 className="text-blue-300 font-semibold text-sm mb-1">
                Informasi Hadiah
              </h4>
              <p className="text-text-muted text-xs">
                Selesaikan semua {totalLocations} lokasi untuk mendapat kesempatan memenangkan 0.1g emas! 
                Hadiah terbatas untuk 20-35 orang pertama.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}