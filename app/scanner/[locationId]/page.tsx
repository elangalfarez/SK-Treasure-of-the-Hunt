"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, Flashlight, FlashlightOff, Keyboard, X, RefreshCw } from "lucide-react"
import Header from "@/components/Header"
import { toast } from "@/hooks/use-toast"

// Dynamic import for QrScanner to avoid SSR issues
let QrScanner: any = null
if (typeof window !== "undefined") {
  import("qr-scanner").then((module) => {
    QrScanner = module.default
  })
}

export default function QRScannerPage() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [flashOn, setFlashOn] = useState(false)
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const qrScannerRef = useRef<any>(null)
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
    initializeCamera()
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy()
      }
    }
  }, [])

  const initializeCamera = async () => {
    setIsInitializing(true)
    setCameraError(null)

    try {
      // Check if camera is available
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((device) => device.kind === "videoinput")

      if (videoDevices.length === 0) {
        throw new Error("Tidak ada kamera yang tersedia")
      }

      // Wait for QrScanner to load
      if (!QrScanner) {
        const module = await import("qr-scanner")
        QrScanner = module.default
      }

      // Check if QR Scanner has camera support
      const hasCamera = await QrScanner.hasCamera()
      if (!hasCamera) {
        throw new Error("Kamera tidak didukung pada perangkat ini")
      }

      if (videoRef.current) {
        // Initialize QR Scanner
        qrScannerRef.current = new QrScanner(
          videoRef.current,
          (result: any) => {
            if (result && result.data) {
              processQRCode(result.data)
            }
          },
          {
            onDecodeError: (error: any) => {
              // Silently handle decode errors (normal when no QR code is visible)
              console.log("Decode error:", error)
            },
            preferredCamera: "environment", // Use back camera
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 5,
          },
        )

        // Start scanning
        await qrScannerRef.current.start()
        setHasPermission(true)
        setScanning(true)
      }
    } catch (error: any) {
      console.error("Camera initialization error:", error)
      setHasPermission(false)
      setCameraError(error.message || "Gagal mengakses kamera")

      toast({
        title: "Akses Kamera Gagal",
        description: error.message || "Mohon izinkan akses kamera untuk melanjutkan",
        variant: "destructive",
      })
    } finally {
      setIsInitializing(false)
    }
  }

  const toggleFlash = async () => {
    if (qrScannerRef.current) {
      try {
        if (flashOn) {
          await qrScannerRef.current.turnFlashOff()
          setFlashOn(false)
        } else {
          await qrScannerRef.current.turnFlashOn()
          setFlashOn(true)
        }
      } catch (error) {
        toast({
          title: "Flash Tidak Tersedia",
          description: "Perangkat tidak mendukung flash atau flash sedang digunakan aplikasi lain",
          variant: "destructive",
        })
      }
    }
  }

  const handleManualSubmit = () => {
    if (manualCode.length >= 6) {
      processQRCode(manualCode)
    }
  }

  const processQRCode = (code: string) => {
    if (scanning) return // Prevent multiple scans

    setScanning(false)

    // Stop scanner temporarily to prevent multiple detections
    if (qrScannerRef.current) {
      qrScannerRef.current.stop()
    }

    // Validate QR code
    const isValidCode =
      code.includes(locationId.toUpperCase()) ||
      code === "DEMO123" ||
      code.includes("SUPERMAL") ||
      code.includes("TREASURE")

    if (isValidCode) {
      toast({
        title: "QR Code Valid! ✅",
        description: "Lanjutkan ke tahap foto",
      })

      // Navigate to photo page
      setTimeout(() => {
        router.push(`/photo/${locationId}`)
      }, 1000)
    } else {
      toast({
        title: "QR Code Tidak Valid ❌",
        description: "Pastikan Anda berada di lokasi yang benar",
        variant: "destructive",
      })

      // Restart scanner after 2 seconds
      setTimeout(() => {
        if (qrScannerRef.current) {
          qrScannerRef.current.start()
          setScanning(true)
        }
      }, 2000)
    }
  }

  const retryCamera = () => {
    initializeCamera()
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-light text-lg font-medium">Menginisialisasi kamera...</p>
          <p className="text-text-muted text-sm mt-2">Mohon tunggu sebentar</p>
        </div>
      </div>
    )
  }

  if (hasPermission === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600">
        <Header title="QR Scanner" showBack onBack={() => router.push("/dashboard")} />
        <div className="p-4 flex items-center justify-center min-h-[70vh]">
          <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
            <CardContent className="p-8 text-center max-w-sm">
              <Camera className="w-20 h-20 text-gold mx-auto mb-6" />
              <h3 className="text-xl font-bold text-text-light mb-3">Akses Kamera Diperlukan</h3>
              <p className="text-text-muted mb-2 leading-relaxed">
                Aplikasi ini memerlukan akses kamera untuk melakukan scan QR code.
              </p>
              <p className="text-text-muted mb-6 text-sm">Tanpa kamera, aplikasi tidak dapat berfungsi dengan baik.</p>

              {cameraError && (
                <div className="bg-red-error/10 border border-red-error/20 rounded-lg p-3 mb-4">
                  <p className="text-red-error text-sm">{cameraError}</p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={retryCamera}
                  className="w-full bg-gold hover:bg-gold/90 text-primary font-semibold py-3"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>

                <Button
                  onClick={() => setShowManualInput(true)}
                  variant="outline"
                  className="w-full border-gold/30 text-gold hover:bg-gold/10 py-3"
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Input Manual
                </Button>
              </div>

              <div className="mt-6 p-4 bg-primary/30 rounded-lg">
                <p className="text-xs text-text-muted">
                  💡 <strong>Tips:</strong> Pastikan browser memiliki izin kamera dan tidak ada aplikasi lain yang
                  menggunakan kamera
                </p>
              </div>
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
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }} // Mirror effect for better UX
              />

              {/* QR Detection Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  <div className="w-64 h-64 border-2 border-gold rounded-lg relative">
                    {/* Corner indicators */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gold rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gold rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gold rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gold rounded-br-lg" />

                    {/* Scanning animation */}
                    {scanning && (
                      <div className="absolute inset-0 overflow-hidden rounded-lg">
                        <div
                          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse"
                          style={{
                            animation: "scan 2s linear infinite",
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <p className="text-center text-text-light mt-4 text-sm font-medium">
                    {scanning ? "Mencari QR code..." : "Scanner dihentikan"}
                  </p>
                </div>
              </div>

              {/* Status indicator */}
              <div className="absolute top-4 left-4">
                <div
                  className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                    scanning
                      ? "bg-green-success/20 border border-green-success/30"
                      : "bg-red-error/20 border border-red-error/30"
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${scanning ? "bg-green-success animate-pulse" : "bg-red-error"}`}
                  />
                  <span className={`text-xs font-medium ${scanning ? "text-green-success" : "text-red-error"}`}>
                    {scanning ? "AKTIF" : "BERHENTI"}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center pointer-events-auto">
                <Button
                  onClick={toggleFlash}
                  size="sm"
                  className="bg-onyx-gray/80 border border-gold/30 text-gold hover:bg-gold/10 backdrop-blur-sm"
                  variant="outline"
                >
                  {flashOn ? <FlashlightOff className="w-4 h-4" /> : <Flashlight className="w-4 h-4" />}
                </Button>

                <div className="text-center">
                  <p className="text-xs text-text-muted mb-1">Arahkan ke QR code</p>
                  <div className="w-2 h-2 bg-gold rounded-full mx-auto animate-pulse" />
                </div>

                <Button
                  onClick={() => setShowManualInput(true)}
                  size="sm"
                  className="bg-onyx-gray/80 border border-gold/30 text-gold hover:bg-gold/10 backdrop-blur-sm"
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
            <h3 className="text-sm font-semibold text-text-light mb-3 flex items-center">
              <Camera className="w-4 h-4 mr-2 text-gold" />
              Petunjuk Scan QR Code:
            </h3>
            <ul className="text-xs text-text-muted space-y-2">
              <li className="flex items-start">
                <span className="text-gold mr-2">•</span>
                Pastikan QR code berada dalam frame emas
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2">•</span>
                Jaga jarak sekitar 20-30 cm dari QR code
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2">•</span>
                Pastikan pencahayaan cukup terang
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2">•</span>
                Gunakan tombol flash jika diperlukan
              </li>
              <li className="flex items-start">
                <span className="text-gold mr-2">•</span>
                QR code akan terdeteksi secara otomatis
              </li>
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
                <div>
                  <label className="text-sm text-text-muted mb-2 block">Kode QR:</label>
                  <Input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Masukkan kode QR (min. 6 karakter)"
                    className="bg-primary/50 border-gold/30 text-text-light placeholder:text-text-muted focus:border-gold"
                    maxLength={20}
                  />
                  <p className="text-xs text-text-muted mt-1">Contoh: DEMO123, SUPERMAL001, TREASURE001</p>
                </div>

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
                    className="flex-1 bg-gold hover:bg-gold/90 text-primary font-semibold disabled:opacity-50"
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
          0% { 
            top: 0; 
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% { 
            top: 100%; 
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
