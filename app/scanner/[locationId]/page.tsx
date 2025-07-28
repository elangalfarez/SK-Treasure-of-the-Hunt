"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Flashlight, FlashlightOff, Keyboard, X } from "lucide-react"
import Header from "@/components/Header"
import { toast } from "@/hooks/use-toast"

export default function QRScannerPage() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [flashOn, setFlashOn] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [scanning, setScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const router = useRouter()
  const params = useParams()
  const locationId = params.locationId as string

  const locationNames: Record<string, string> = {
    atrium: "Atrium Central",
    foodcourt: "Food Court",
    cinema: "Cinema XXI",
    playground: "Kids Playground",
  }

  useEffect(() => {
    requestCameraPermission()
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      setHasPermission(true)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      setHasPermission(false)
      toast({
        title: "Akses Kamera Ditolak",
        description: "Mohon izinkan akses kamera untuk melanjutkan",
        variant: "destructive",
      })
    }
  }

  const toggleFlash = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0]
      const capabilities = track.getCapabilities()

      if (capabilities.torch) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !flashOn } as any],
          })
          setFlashOn(!flashOn)
        } catch (error) {
          toast({
            title: "Flash Tidak Tersedia",
            description: "Perangkat tidak mendukung flash",
            variant: "destructive",
          })
        }
      }
    }
  }

  const handleManualSubmit = () => {
    if (manualCode.length >= 6) {
      processQRCode(manualCode)
    }
  }

  const processQRCode = (code: string) => {
    setScanning(true)

    // Simulate QR code validation
    setTimeout(() => {
      if (code.includes(locationId.toUpperCase()) || code === "DEMO123") {
        toast({
          title: "QR Code Valid!",
          description: "Lanjutkan ke tahap foto",
        })
        router.push(`/photo/${locationId}`)
      } else {
        toast({
          title: "QR Code Tidak Valid",
          description: "Pastikan Anda berada di lokasi yang benar",
          variant: "destructive",
        })
        setScanning(false)
      }
    }, 1500)
  }

  // Simulate QR detection (in real app, use a QR library like qr-scanner)
  const simulateQRDetection = () => {
    processQRCode(`${locationId.toUpperCase()}123`)
  }

  if (hasPermission === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-light">Meminta izin kamera...</p>
        </div>
      </div>
    )
  }

  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600">
        <Header title="QR Scanner" showBack onBack={() => router.push("/dashboard")} />
        <div className="p-4 flex items-center justify-center min-h-[60vh]">
          <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Camera className="w-16 h-16 text-gold mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-light mb-2">Akses Kamera Diperlukan</h3>
              <p className="text-text-muted mb-4">Mohon izinkan akses kamera untuk melakukan scan QR code</p>
              <Button onClick={requestCameraPermission} className="bg-gold hover:bg-gold/90 text-primary font-semibold">
                Izinkan Kamera
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600">
      <Header title={`Scan QR - ${locationNames[locationId]}`} showBack onBack={() => router.push("/dashboard")} />

      <div className="p-4 space-y-4">
        {/* Camera View */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="relative aspect-square bg-black">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

              {/* QR Detection Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="w-64 h-64 border-2 border-gold rounded-lg relative">
                    {/* Corner indicators */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gold rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gold rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gold rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gold rounded-br-lg" />

                    {/* Scanning line */}
                    <div
                      className="absolute top-0 left-0 w-full h-1 bg-gold animate-pulse"
                      style={{
                        animation: "scan 2s linear infinite",
                        background: "linear-gradient(90deg, transparent, #D4AF37, transparent)",
                      }}
                    />
                  </div>

                  <p className="text-center text-text-light mt-4 text-sm">Arahkan kamera ke QR code</p>
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                <Button
                  onClick={toggleFlash}
                  size="sm"
                  className="bg-onyx-gray/80 border border-gold/30 text-gold hover:bg-gold/10"
                  variant="outline"
                >
                  {flashOn ? <FlashlightOff className="w-4 h-4" /> : <Flashlight className="w-4 h-4" />}
                </Button>

                <Button
                  onClick={simulateQRDetection}
                  disabled={scanning}
                  className="bg-gold hover:bg-gold/90 text-primary font-semibold px-6"
                >
                  {scanning ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </div>
                  ) : (
                    "Demo Scan"
                  )}
                </Button>

                <Button
                  onClick={() => setShowManualInput(true)}
                  size="sm"
                  className="bg-onyx-gray/80 border border-gold/30 text-gold hover:bg-gold/10"
                  variant="outline"
                >
                  <Keyboard className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-text-light mb-2">Petunjuk:</h3>
            <ul className="text-xs text-text-muted space-y-1">
              <li>• Pastikan QR code berada dalam frame emas</li>
              <li>• Jaga jarak sekitar 20-30 cm dari QR code</li>
              <li>• Pastikan pencahayaan cukup terang</li>
              <li>• Gunakan tombol flash jika diperlukan</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Manual Input Modal */}
      {showManualInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="bg-onyx-gray border-gold/20 w-full max-w-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-text-light">Input Manual</h3>
                <Button
                  onClick={() => setShowManualInput(false)}
                  size="sm"
                  variant="ghost"
                  className="text-text-muted hover:text-text-light"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="Masukkan kode QR"
                  className="bg-primary/50 border-gold/30 text-text-light placeholder:text-text-muted focus:border-gold"
                />
                <div className="flex space-x-2">
                  <Button
                    onClick={() => setShowManualInput(false)}
                    variant="outline"
                    className="flex-1 border-text-muted/30 text-text-muted hover:bg-text-muted/10"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleManualSubmit}
                    disabled={manualCode.length < 6}
                    className="flex-1 bg-gold hover:bg-gold/90 text-primary font-semibold"
                  >
                    Submit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  )
}
