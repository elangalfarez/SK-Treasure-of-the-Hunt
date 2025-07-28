"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Camera, MapPin, Calendar, Award, Download, Share2 } from "lucide-react"
import Header from "@/components/Header"

interface CompletedLocation {
  id: string
  name: string
  completedAt: string
  photo?: string
  score: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
}

export default function ProgressPage() {
  const [completedLocations, setCompletedLocations] = useState<CompletedLocation[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const router = useRouter()

  const locationNames: Record<string, string> = {
    atrium: "Atrium Central",
    foodcourt: "Food Court",
    cinema: "Cinema XXI",
    playground: "Kids Playground",
  }

  useEffect(() => {
    loadProgressData()
  }, [])

  const loadProgressData = () => {
    // Load completed locations
    const completed = JSON.parse(localStorage.getItem("completedLocations") || "[]")
    const photos = JSON.parse(localStorage.getItem("capturedPhotos") || "{}")

    const completedData: CompletedLocation[] = completed.map((locationId: string) => ({
      id: locationId,
      name: locationNames[locationId],
      completedAt: photos[locationId]?.timestamp || new Date().toISOString(),
      photo: photos[locationId]?.photo,
      score: 100, // Perfect score for completed locations
    }))

    setCompletedLocations(completedData)

    // Generate achievements
    const achievementsList: Achievement[] = [
      {
        id: "first_location",
        title: "Penjelajah Pertama",
        description: "Selesaikan lokasi pertama",
        icon: "🎯",
        unlocked: completed.length >= 1,
        unlockedAt: completed.length >= 1 ? completedData[0]?.completedAt : undefined,
      },
      {
        id: "photo_master",
        title: "Master Fotografi",
        description: "Ambil foto di semua lokasi",
        icon: "📸",
        unlocked: completed.length >= 4,
        unlockedAt: completed.length >= 4 ? completedData[3]?.completedAt : undefined,
      },
      {
        id: "quiz_champion",
        title: "Juara Kuis",
        description: "Jawab semua kuis dengan benar",
        icon: "🧠",
        unlocked: completed.length >= 4,
        unlockedAt: completed.length >= 4 ? completedData[3]?.completedAt : undefined,
      },
      {
        id: "independence_hero",
        title: "Pahlawan Kemerdekaan",
        description: "Selesaikan semua tantangan",
        icon: "🏆",
        unlocked: completed.length >= 4,
        unlockedAt: completed.length >= 4 ? completedData[3]?.completedAt : undefined,
      },
    ]

    setAchievements(achievementsList)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const calculateOverallProgress = () => {
    return Math.round((completedLocations.length / 4) * 100)
  }

  const shareProgress = async () => {
    const progress = calculateOverallProgress()
    const text = `Saya telah menyelesaikan ${progress}% dari Treasure Hunt Supermal Karawaci! 🏆 #TreasureHuntSupermal #Kemerdekaan2024`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Progress Treasure Hunt",
          text: text,
          url: window.location.origin,
        })
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(text)
      }
    } else {
      navigator.clipboard.writeText(text)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600">
      <Header title="Progress Anda" showBack onBack={() => router.push("/dashboard")} />

      <div className="p-4 space-y-6">
        {/* Overall Progress */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-gold mb-2">{calculateOverallProgress()}%</div>
              <p className="text-text-muted mb-4">Progress Keseluruhan</p>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-success">{completedLocations.length}</div>
                  <div className="text-xs text-text-muted">Lokasi Selesai</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gold">{achievements.filter((a) => a.unlocked).length}</div>
                  <div className="text-xs text-text-muted">Achievement</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-text-light">
                    {completedLocations.reduce((sum, loc) => sum + loc.score, 0)}
                  </div>
                  <div className="text-xs text-text-muted">Total Poin</div>
                </div>
              </div>

              <Button onClick={shareProgress} className="mt-4 bg-gold hover:bg-gold/90 text-primary font-semibold">
                <Share2 className="w-4 h-4 mr-2" />
                Bagikan Progress
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Completed Locations Timeline */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-text-light mb-4 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-gold" />
              Lokasi yang Diselesaikan
            </h3>

            {completedLocations.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <p className="text-text-muted">Belum ada lokasi yang diselesaikan</p>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="mt-3 bg-gold hover:bg-gold/90 text-primary font-semibold"
                >
                  Mulai Petualangan
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {completedLocations.map((location, index) => (
                  <div key={location.id} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="bg-primary/30 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-text-light">{location.name}</h4>
                          <Badge className="bg-green-success/20 text-green-success border-green-success/30">
                            {location.score} poin
                          </Badge>
                        </div>

                        <div className="flex items-center text-xs text-text-muted mb-3">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(location.completedAt)}
                        </div>

                        {location.photo && (
                          <div
                            className="relative w-full h-32 bg-black rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => setSelectedPhoto(location.photo!)}
                          >
                            <img
                              src={location.photo || "/placeholder.svg"}
                              alt={`Foto di ${location.name}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Camera className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-text-light mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-gold" />
              Achievement
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    achievement.unlocked ? "bg-gold/10 border-gold/30" : "bg-primary/20 border-text-muted/20 opacity-60"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${achievement.unlocked ? "text-gold" : "text-text-muted"}`}>
                        {achievement.title}
                      </h4>
                      <p className="text-xs text-text-muted">{achievement.description}</p>
                      {achievement.unlocked && achievement.unlockedAt && (
                        <p className="text-xs text-gold mt-1">Dibuka: {formatDate(achievement.unlockedAt)}</p>
                      )}
                    </div>
                    {achievement.unlocked && <Trophy className="w-5 h-5 text-gold" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Certificate */}
        {completedLocations.length >= 4 && (
          <Card className="bg-gradient-to-r from-gold/20 to-gold/10 border-gold/30 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 text-gold mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gold mb-2">
                Selamat! Anda Telah Menyelesaikan Semua Tantangan!
              </h3>
              <p className="text-text-muted mb-4">Klaim sertifikat dan hadiah Anda di customer service</p>
              <Button className="bg-gold hover:bg-gold/90 text-primary font-semibold">
                <Download className="w-4 h-4 mr-2" />
                Download Sertifikat
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-sm w-full">
            <img src={selectedPhoto || "/placeholder.svg"} alt="Foto selfie" className="w-full rounded-lg" />
            <Button
              onClick={() => setSelectedPhoto(null)}
              size="sm"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
            >
              ✕
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
