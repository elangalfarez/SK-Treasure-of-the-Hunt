// app/quiz/[locationId]/page.tsx
// This file handles the quiz functionality for each location in the treasure hunt

"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  ArrowLeft, 
  CheckCircle,
  AlertCircle,
  X,
  Trophy,
  Clock,
  Flag
} from "lucide-react"
import { supabaseApi, Location } from "@/lib/supabase"

interface QuizAnswer {
  option: string
  label: string
}

export default function QuizPage() {
  const params = useParams()
  const router = useRouter()
  
  const [location, setLocation] = useState<Location | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [cooldownTime, setCooldownTime] = useState<number>(0)
  const [attempts, setAttempts] = useState<number>(0)
  
  const locationId = params.locationId as string

  useEffect(() => {
    // Check if player is logged in
    const playerId = localStorage.getItem('playerId')
    if (!playerId) {
      router.push('/')
      return
    }

    // Load location data and check cooldown
    loadLocationData()
    checkCooldown()
  }, [locationId, router])

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [cooldownTime])

  const loadLocationData = async () => {
    try {
      const locations = await supabaseApi.getLocations()
      const currentLocation = locations.find(loc => loc.id === locationId)
      
      if (!currentLocation) {
        setError('Lokasi tidak ditemukan')
        return
      }
      
      setLocation(currentLocation)
    } catch (error) {
      setError('Gagal memuat data lokasi')
    }
  }

  const checkCooldown = async () => {
    try {
      const playerId = localStorage.getItem('playerId')
      if (!playerId) return

      // Check if player has attempted this quiz recently
      const cooldownKey = `quiz_cooldown_${playerId}_${locationId}`
      const cooldownEnd = localStorage.getItem(cooldownKey)
      const attemptsKey = `quiz_attempts_${playerId}_${locationId}`
      const playerAttempts = parseInt(localStorage.getItem(attemptsKey) || '0')

      setAttempts(playerAttempts)

      if (cooldownEnd) {
        const endTime = parseInt(cooldownEnd)
        const now = Date.now()
        
        if (now < endTime) {
          const remainingSeconds = Math.ceil((endTime - now) / 1000)
          setCooldownTime(remainingSeconds)
        }
      }
    } catch (error) {
      console.error('Error checking cooldown:', error)
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}j ${minutes}m ${secs}d`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}d`
    } else {
      return `${secs}d`
    }
  }

  const submitAnswer = async () => {
    if (!selectedAnswer || !location || cooldownTime > 0) return

    setLoading(true)
    setError('')

    try {
      const playerId = localStorage.getItem('playerId')
      if (!playerId) {
        throw new Error('Player ID not found')
      }

      // Call backend to handle quiz submission
      const result = await supabaseApi.submitQuizAnswer(
        parseInt(playerId),
        locationId,
        selectedAnswer  // Send A, B, C, or D
      )

      // Show result
      setShowResult(true)
      
      if (result.success && result.correct) {
        // Correct answer
        setIsCorrect(true)
        setSuccess('🎉 Selamat! Anda telah menyelesaikan lokasi ini!')
        
        // Clear local cooldown and attempts
        const cooldownKey = `quiz_cooldown_${playerId}_${locationId}`
        const attemptsKey = `quiz_attempts_${playerId}_${locationId}`
        localStorage.removeItem(cooldownKey)
        localStorage.removeItem(attemptsKey)

        // Redirect after 3 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
        
      } else if (result.success && !result.correct) {
        // Wrong answer
        setIsCorrect(false)
        setError(result.message || '❌ Jawaban salah!')
        
        // Update local attempts counter
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        const attemptsKey = `quiz_attempts_${playerId}_${locationId}`
        localStorage.setItem(attemptsKey, newAttempts.toString())
        
      } else {
        // Backend error
        setError(result.message || 'Terjadi kesalahan sistem')
      }

    } catch (error) {
      console.error('Quiz submission error:', error)
      setError('Terjadi kesalahan. Coba lagi nanti.')
    } finally {
      setLoading(false)
    }
}

  const resetQuiz = () => {
    setSelectedAnswer('')
    setShowResult(false)
    setError('')
    setSuccess('')
  }

  const goBack = () => {
    router.push('/dashboard')
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-light">Memuat quiz...</p>
        </div>
      </div>
    )
  }

  const quizOptions: QuizAnswer[] = location.quiz_options.map((option, index) => ({
    option: ['A', 'B', 'C', 'D'][index],
    label: option
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-onyx-gray border-b border-gold/20 p-4">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={goBack}
            className="text-text-light hover:text-gold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gold">🧠 Quiz Kemerdekaan</h1>
            <p className="text-text-muted text-sm">{location.name}</p>
          </div>
          <div className="w-20"></div> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Success Message */}
        {success && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <Trophy className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert className="bg-red-500/10 border-red-500/30">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Cooldown Notice */}
        {cooldownTime > 0 && (
          <Card className="bg-orange-500/10 border-orange-500/30">
            <CardContent className="p-4 text-center">
              <Clock className="w-12 h-12 text-orange-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-orange-400 mb-2">
                Waktu Tunggu Aktif
              </h3>
              <p className="text-text-muted mb-3">
                Anda perlu menunggu sebelum dapat mencoba quiz lagi
              </p>
              <div className="text-2xl font-bold text-orange-400 mb-2">
                {formatTime(cooldownTime)}
              </div>
              <p className="text-text-muted text-sm">
                Silakan kunjungi lokasi lain terlebih dahulu
              </p>
            </CardContent>
          </Card>
        )}

        {/* Quiz Card */}
        {cooldownTime === 0 && (
          <Card className="bg-onyx-gray/50 border-gold/20">
            <CardContent className="p-6">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Flag className="w-5 h-5 text-gold" />
                  <span className="text-text-light font-semibold">Quiz Kemerdekaan Indonesia</span>
                </div>
                <div className="text-text-muted text-sm">
                  Percobaan: {attempts}
                </div>
              </div>

              {/* Question */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-text-light mb-4">
                  {location.quiz_question}
                </h2>
              </div>

              {/* Answer Options */}
              {!showResult && (
                <div className="space-y-3 mb-6">
                  {quizOptions.map((answer) => (
                    <button
                      key={answer.option}
                      onClick={() => setSelectedAnswer(answer.option)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-300 ${
                        selectedAnswer === answer.option
                          ? 'border-gold bg-gold/10 text-text-light'
                          : 'border-text-muted/30 bg-onyx-gray/30 text-text-muted hover:border-gold/50 hover:bg-gold/5'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold ${
                          selectedAnswer === answer.option
                            ? 'border-gold bg-gold text-primary'
                            : 'border-text-muted/50 text-text-muted'
                        }`}>
                          {answer.option}
                        </div>
                        <span className="font-medium">{answer.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Result Display */}
              {showResult && (
                <div className="mb-6">
                  <div className={`p-4 rounded-xl border-2 ${
                    isCorrect 
                      ? 'border-green-500/30 bg-green-500/10' 
                      : 'border-red-500/30 bg-red-500/10'
                  }`}>
                    <div className="flex items-center space-x-3 mb-3">
                      {isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <X className="w-6 h-6 text-red-400" />
                      )}
                      <span className={`font-semibold ${
                        isCorrect ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {isCorrect ? 'Jawaban Benar!' : 'Jawaban Salah!'}
                      </span>
                    </div>
                    
                    <div className="text-text-light">
                      <p><strong>Jawaban Anda:</strong> {selectedAnswer}. {quizOptions.find(q => q.option === selectedAnswer)?.label}</p>
                      {!isCorrect && (
                        <p className="mt-2"><strong>Jawaban yang benar:</strong> {location.correct_answer}. {quizOptions.find(q => q.option === location.correct_answer)?.label}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              {!showResult && (
                <Button
                  onClick={submitAnswer}
                  disabled={!selectedAnswer || loading || cooldownTime > 0}
                  className="w-full bg-gold hover:bg-gold/90 text-primary font-semibold py-3"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                      Memeriksa Jawaban...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Kirim Jawaban
                    </>
                  )}
                </Button>
              )}

              {/* Reset Button (for wrong answers) */}
              {showResult && !isCorrect && cooldownTime === 0 && (
                <Button
                  onClick={resetQuiz}
                  variant="outline"
                  className="w-full border-gold/30 text-text-light hover:bg-gold/10"
                >
                  Coba Lagi
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quiz Info */}
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <h4 className="text-blue-300 font-semibold text-sm mb-2">📋 Aturan Quiz:</h4>
            <ul className="text-text-muted text-xs space-y-1 ml-4 list-disc">
              <li>Jawab pertanyaan tentang kemerdekaan Indonesia dengan benar</li>
              <li>Jika jawaban salah, Anda harus menunggu 3 jam sebelum mencoba lagi</li>
              <li>Setelah menjawab benar, lokasi ini akan terselesaikan</li>
              <li>Lanjutkan ke lokasi berikutnya untuk melengkapi treasure hunt</li>
            </ul>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        <Card className="bg-onyx-gray/30 border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-light font-medium">Progress Lokasi</span>
              <span className="text-gold font-semibold">
                Step 3/3
              </span>
            </div>
            <Progress value={100} className="h-2" />
            <div className="flex justify-between text-xs text-text-muted mt-2">
              <span>✅ QR Scan</span>
              <span>✅ Foto Selfie</span>
              <span className={cooldownTime > 0 ? 'text-orange-400' : 'text-gold'}>
                🧠 Quiz
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}