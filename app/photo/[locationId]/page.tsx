"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, RotateCcw, Check, X } from "lucide-react"
import Header from "@/components/Header"
import { toast } from "@/hooks/use-toast"

export default function PhotoCapturePage() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")
  const [loading, setLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const params = useParams()
  const locationId = params.locationId as string

  const locationNames: Record<string, string> = {
    atrium: "Atrium Central",
    foodcourt: "Food Court",
    cinema: "Cinema XXI",
    playground: "Kids Playground",
  }

  const decorationRequirements: Record<string, string> = {
    atrium: "Foto dengan bendera merah putih di latar belakang",
    foodcourt: "Foto dengan dekorasi kemerdekaan di area makan",
    cinema: "Foto dengan poster kemerdekaan di area cinema",
    playground: "Foto dengan hiasan 17 Agustus di playground",
  }

  useEffect(() => {
    startCamera()
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [facingMode])

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      })

      setStream(newStream)
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
      }
    } catch (error) {
      toast({
        title: "Akses Kamera Gagal",
        description: "Mohon izinkan akses kamera untuk melanjutkan",
        variant: "destructive",
      })
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      if (context) {
        // Flip image if using front camera
        if (facingMode === "user") {
          context.scale(-1, 1)
          context.translate(-canvas.width, 0)
        }

        context.drawImage(video, 0, 0)
        const photoData = canvas.toDataURL("image/jpeg", 0.8)
        setCapturedPhoto(photoData)
      }
    }
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
  }

  const switchCamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"))
  }

  const submitPhoto = async () => {
    if (!capturedPhoto) return

    setLoading(true)

    // Simulate photo upload and validation
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Save photo to localStorage (in real app, upload to server)
    const photos = JSON.parse(localStorage.getItem("capturedPhotos") || "{}")
    photos[locationId] = {
      photo: capturedPhoto,
      timestamp: new Date().toISOString(),
      location: locationNames[locationId],
    }
    localStorage.setItem("capturedPhotos", JSON.stringify(photos))

    toast({
      title: "Foto Berhasil Disimpan!",
      description: "Lanjutkan ke kuis untuk menyelesaikan tantangan",
    })

    router.push(`/quiz/${locationId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600">
      <Header
        title={`Foto Selfie - ${locationNames[locationId]}`}
        showBack
        onBack={() => router.push(`/scanner/${locationId}`)}
      />

      <div className="p-4 space-y-4">
        {/* Requirements */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-gold mb-2">Persyaratan Foto:</h3>
            <p className="text-xs text-text-muted">{decorationRequirements[locationId]}</p>
          </CardContent>
        </Card>

        {/* Camera/Photo View */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-square bg-black">
              {!capturedPhoto ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                  />

                  {/* Photo Frame Overlay */}
                  <div className="absolute inset-4 border-2 border-gold/50 rounded-lg">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gold rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gold rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gold rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gold rounded-br-lg" />
                  </div>

                  {/* Camera Controls */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                    <Button
                      onClick={switchCamera}
                      size="sm"
                      className="bg-onyx-gray/80 border border-gold/30 text-gold hover:bg-gold/10"
                      variant="outline"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={capturePhoto}
                      size="lg"
                      className="bg-gold hover:bg-gold/90 text-primary font-semibold px-8 py-3 rounded-full"
                    >
                      <Camera className="w-6 h-6 mr-2" />
                      Ambil Foto
                    </Button>
                    <div className="w-10" /> {/* Spacer */}
                  </div>
                </>
              ) : (
                <>
                  <img
                    src={capturedPhoto || "/placeholder.svg"}
                    alt="Captured selfie"
                    className="w-full h-full object-cover"
                  />

                  {/* Photo Review Controls */}
                  <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-4">
                    <Button
                      onClick={retakePhoto}
                      className="bg-red-error hover:bg-red-error/90 text-white font-semibold px-6"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Ulangi
                    </Button>

                    <Button
                      onClick={submitPhoto}
                      disabled={loading}
                      className="bg-green-success hover:bg-green-success/90 text-white font-semibold px-6"
                    >
                      {loading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Menyimpan...</span>
                        </div>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Gunakan Foto
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-text-light mb-2">Tips Foto yang Baik:</h3>
            <ul className="text-xs text-text-muted space-y-1">
              <li>• Pastikan wajah Anda terlihat jelas</li>
              <li>• Sertakan dekorasi kemerdekaan dalam frame</li>
              <li>• Gunakan pencahayaan yang cukup</li>
              <li>• Posisikan diri dalam frame emas</li>
              <li>• Tersenyum dan tunjukkan semangat kemerdekaan!</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
