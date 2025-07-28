"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, XCircle, Clock, Trophy } from "lucide-react"
import Header from "@/components/Header"

interface Question {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface QuizResult {
  correct: boolean
  selectedAnswer: number
  timestamp: string
}

export default function QuizPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [quizComplete, setQuizComplete] = useState(false)
  const [results, setResults] = useState<QuizResult[]>([])
  const [timeLeft, setTimeLeft] = useState(30)
  const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null)
  const router = useRouter()
  const params = useParams()
  const locationId = params.locationId as string

  const locationNames: Record<string, string> = {
    atrium: "Atrium Central",
    foodcourt: "Food Court",
    cinema: "Cinema XXI",
    playground: "Kids Playground",
  }

  const questions: Question[] = [
    {
      id: "1",
      question: "Kapan Indonesia memproklamirkan kemerdekaan?",
      options: ["16 Agustus 1945", "17 Agustus 1945", "18 Agustus 1945", "19 Agustus 1945"],
      correctAnswer: 1,
      explanation: "Indonesia memproklamirkan kemerdekaan pada tanggal 17 Agustus 1945",
    },
    {
      id: "2",
      question: "Siapa yang membacakan teks proklamasi kemerdekaan Indonesia?",
      options: ["Mohammad Hatta", "Soekarno", "Soeharto", "Tan Malaka"],
      correctAnswer: 1,
      explanation: "Soekarno (Ir. Sukarno) yang membacakan teks proklamasi kemerdekaan Indonesia",
    },
    {
      id: "3",
      question: "Apa bunyi sila pertama Pancasila?",
      options: [
        "Kemanusiaan yang adil dan beradab",
        "Ketuhanan Yang Maha Esa",
        "Persatuan Indonesia",
        "Keadilan sosial bagi seluruh rakyat Indonesia",
      ],
      correctAnswer: 1,
      explanation: 'Sila pertama Pancasila adalah "Ketuhanan Yang Maha Esa"',
    },
  ]

  useEffect(() => {
    // Check for existing cooldown
    const cooldownData = localStorage.getItem(`quiz_cooldown_${locationId}`)
    if (cooldownData) {
      const cooldownTime = new Date(cooldownData)
      if (cooldownTime > new Date()) {
        setCooldownEnd(cooldownTime)
        return
      }
    }

    // Start timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentQuestion])

  const handleTimeUp = () => {
    if (selectedAnswer === null) {
      handleAnswerSubmit(-1) // -1 indicates no answer selected
    }
  }

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex)
  }

  const handleAnswerSubmit = (answerIndex: number) => {
    const question = questions[currentQuestion]
    const isCorrect = answerIndex === question.correctAnswer

    const result: QuizResult = {
      correct: isCorrect,
      selectedAnswer: answerIndex,
      timestamp: new Date().toISOString(),
    }

    setResults((prev) => [...prev, result])
    setShowResult(true)

    if (!isCorrect && answerIndex !== -1) {
      // Set 3-hour cooldown for wrong answer
      const cooldownTime = new Date()
      cooldownTime.setHours(cooldownTime.getHours() + 3)
      localStorage.setItem(`quiz_cooldown_${locationId}`, cooldownTime.toISOString())
      setCooldownEnd(cooldownTime)
    }

    // Auto advance after showing result
    setTimeout(() => {
      if (currentQuestion < questions.length - 1 && isCorrect) {
        setCurrentQuestion((prev) => prev + 1)
        setSelectedAnswer(null)
        setShowResult(false)
        setTimeLeft(30)
      } else {
        setQuizComplete(true)
        if (isCorrect && currentQuestion === questions.length - 1) {
          // Mark location as completed
          const completedLocations = JSON.parse(localStorage.getItem("completedLocations") || "[]")
          if (!completedLocations.includes(locationId)) {
            completedLocations.push(locationId)
            localStorage.setItem("completedLocations", JSON.stringify(completedLocations))
          }
        }
      }
    }, 3000)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatCooldownTime = (endTime: Date) => {
    const now = new Date()
    const diff = endTime.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}j ${minutes}m`
  }

  if (cooldownEnd && cooldownEnd > new Date()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600">
        <Header title={`Kuis - ${locationNames[locationId]}`} showBack onBack={() => router.push("/dashboard")} />

        <div className="p-4 flex items-center justify-center min-h-[60vh]">
          <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Clock className="w-16 h-16 text-gold mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-light mb-2">Waktu Tunggu</h3>
              <p className="text-text-muted mb-4">Anda harus menunggu sebelum dapat mencoba lagi</p>
              <div className="text-2xl font-bold text-gold mb-4">{formatCooldownTime(cooldownEnd)}</div>
              <Button
                onClick={() => router.push("/dashboard")}
                className="bg-gold hover:bg-gold/90 text-primary font-semibold"
              >
                Kembali ke Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (quizComplete) {
    const correctAnswers = results.filter((r) => r.correct).length
    const isSuccess = correctAnswers === questions.length

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600">
        <Header title={`Kuis - ${locationNames[locationId]}`} showBack onBack={() => router.push("/dashboard")} />

        <div className="p-4 space-y-4">
          <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              {isSuccess ? (
                <>
                  <Trophy className="w-16 h-16 text-gold mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gold mb-2">Selamat! Kuis Selesai!</h3>
                  <p className="text-text-muted mb-4">Anda telah menyelesaikan semua pertanyaan dengan benar</p>
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 text-red-error mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-red-error mb-2">Kuis Belum Selesai</h3>
                  <p className="text-text-muted mb-4">Anda perlu menjawab semua pertanyaan dengan benar</p>
                </>
              )}

              <div className="bg-primary/30 rounded-lg p-4 mb-4">
                <div className="text-2xl font-bold text-text-light mb-1">
                  {correctAnswers}/{questions.length}
                </div>
                <div className="text-sm text-text-muted">Jawaban Benar</div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                  className="flex-1 border-gold/30 text-text-light hover:bg-gold/10"
                >
                  Dashboard
                </Button>
                <Button
                  onClick={() => router.push("/progress")}
                  className="flex-1 bg-gold hover:bg-gold/90 text-primary font-semibold"
                >
                  Lihat Progress
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600">
      <Header title={`Kuis - ${locationNames[locationId]}`} showBack onBack={() => router.push("/dashboard")} />

      <div className="p-4 space-y-4">
        {/* Progress */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">
                Pertanyaan {currentQuestion + 1} dari {questions.length}
              </span>
              <div className="flex items-center space-x-2 text-gold">
                <Clock className="w-4 h-4" />
                <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Question */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-text-light mb-6">{question.question}</h2>

            <div className="space-y-3">
              {question.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showResult}
                  variant="outline"
                  className={`w-full p-4 h-auto text-left justify-start transition-all duration-300 ${
                    selectedAnswer === index
                      ? "bg-gold/20 border-gold text-text-light"
                      : "bg-primary/30 border-text-muted/30 text-text-light hover:bg-gold/10 hover:border-gold/50"
                  } ${
                    showResult && index === question.correctAnswer
                      ? "bg-green-success/20 border-green-success text-green-success"
                      : showResult && selectedAnswer === index && index !== question.correctAnswer
                        ? "bg-red-error/20 border-red-error text-red-error"
                        : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                        selectedAnswer === index ? "border-gold bg-gold text-primary" : "border-text-muted/50"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span>{option}</span>
                  </div>

                  {showResult && index === question.correctAnswer && (
                    <CheckCircle className="w-5 h-5 text-green-success ml-auto" />
                  )}
                  {showResult && selectedAnswer === index && index !== question.correctAnswer && (
                    <XCircle className="w-5 h-5 text-red-error ml-auto" />
                  )}
                </Button>
              ))}
            </div>

            {!showResult && (
              <Button
                onClick={() => selectedAnswer !== null && handleAnswerSubmit(selectedAnswer)}
                disabled={selectedAnswer === null}
                className="w-full mt-6 bg-gold hover:bg-gold/90 text-primary font-semibold py-3"
              >
                Submit Jawaban
              </Button>
            )}

            {showResult && (
              <Card className="mt-6 bg-primary/30 border-gold/20">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    {selectedAnswer === question.correctAnswer ? (
                      <CheckCircle className="w-5 h-5 text-green-success flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-error flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <h4 className="font-semibold text-text-light mb-1">
                        {selectedAnswer === question.correctAnswer ? "Benar!" : "Salah!"}
                      </h4>
                      <p className="text-sm text-text-muted">{question.explanation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
