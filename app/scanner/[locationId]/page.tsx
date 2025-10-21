"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Camera, 
  FlashlightIcon as Flashlight,
  ArrowLeft, 
  AlertCircle,
  CheckCircle,
  X,
  RotateCcw,
  Type,
  Check,
  QrCode
} from "lucide-react"
import QrScanner from "qr-scanner"
import { supabaseApi, Location } from "@/lib/supabase"
import { toast } from "@/hooks/use-toast"

const LOCATION_NAMES: Record<string, string> = {
  main_lobby: "Main Lobby",
  south_lobby: "South Lobby", 
  u_walk: "U Walk",
  east_dome: "East Dome"
}

export default function QRScannerPage() {
  const params = useParams()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)
  
  const [location, setLocation] = useState<Location | null>(null)
  const [isScanning, setIsScanning] = useState(true)
  const [flashOn, setFlashOn] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isInitializing, setIsInitializing] = useState(false)
  
  const locationId = params.locationId as string

  useEffect(() => {
    // Check if player is logged in
    const playerId = localStorage.getItem('playerId')
    if (!playerId) {
      router.push('/')
      return
    }

    // Load location data
    loadLocationData()
    
    // Automatically request camera access when component mounts
    requestCameraAccess()
  }, [locationId, router])

  useEffect(() => {
    // Cleanup scanner on unmount
    return () => {
      cleanupScanner()
    }
  }, [])

  // Watch for when scanning becomes true and video element is available
  useEffect(() => {
    console.log('useEffect triggered:', { 
      isScanning, 
      cameraPermission, 
      videoElementExists: !!videoRef.current 
    })
    
    if (isScanning && cameraPermission === "granted" && videoRef.current) {
      console.log('Video element is now available, initializing scanner...')
      setIsInitializing(true)
      initializeQrScanner()
    }
  }, [isScanning, cameraPermission])

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

  // Clean up scanner completely
  const cleanupScanner = () => {
    if (qrScannerRef.current) {
      try {
        qrScannerRef.current.destroy()
      } catch (error) {
        console.error('Error destroying scanner:', error)
      }
      qrScannerRef.current = null
    }
    setFlashOn(false)
    setIsInitializing(false)
  }

  const initializeQrScanner = async (retryCount = 0) => {
    if (!videoRef.current) {
      console.error('Video element not available')
      
      // Retry up to 3 times with increasing delays
      if (retryCount < 3) {
        console.log(`Retrying in ${(retryCount + 1) * 200}ms... (attempt ${retryCount + 1}/3)`)
        setTimeout(() => {
          initializeQrScanner(retryCount + 1)
        }, (retryCount + 1) * 200)
      } else {
        setError('Tidak dapat mengakses kamera. Silakan refresh halaman atau gunakan input manual.')
        setIsInitializing(false)
      }
      return
    }
    
    try {
      // Clean up any existing scanner first
      cleanupScanner()
      
      console.log('Initializing QR Scanner...')
      
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        (result) => handleQRDetected(result.data),
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5, // Limit scan frequency
        }
      )
      
      await qrScannerRef.current.start()
      setCameraPermission("granted")
      setIsInitializing(false)
      console.log('QR Scanner started successfully')
      
    } catch (error) {
      console.error('QR Scanner initialization error:', error)
      cleanupScanner()
      setCameraPermission("denied")
      setIsInitializing(false)
      setError("Kamera tidak tersedia. Gunakan input manual untuk memasukkan kode QR")
    }
  }

  const requestCameraAccess = async () => {
    try {
      console.log('Requesting camera access...')
      
      // First try to get user media to trigger permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      console.log('Camera access granted')
      
      // Stop the stream immediately as QrScanner will handle it
      stream.getTracks().forEach(track => track.stop())
      
      setCameraPermission("granted")
      
      // Don't initialize scanner here - let useEffect handle it
      // when video element becomes available
      
    } catch (error) {
      console.error('Camera access error:', error)
      setCameraPermission("denied")
      setError("Kamera tidak tersedia. Gunakan input manual untuk memasukkan kode QR")
    }
  }

 const toggleFlash = async () => {
  const scanner = qrScannerRef.current;
  // basic null/type guards
  if (!scanner || typeof scanner.hasFlash !== "function") return;

  try {
    // WAIT for the boolean result instead of checking the Promise object
    const has = await scanner.hasFlash();
    if (!has) return; // device doesn't have flash

    // toggle and flip UI state
    await scanner.toggleFlash();
    setFlashOn(prev => !prev);
  } catch (err) {
    console.error("toggleFlash error:", err);
  }
};


  const stopScanning = () => {
    console.log('Stopping scanner...')
    cleanupScanner()
    setIsScanning(false)
    setIsInitializing(false)
  }

  const startScanning = async () => {
    console.log('Starting scanner...')
    setIsScanning(true)
    setError('') // Clear any existing errors
    
    // Don't call initializeQrScanner here - let useEffect handle it
    // when the video element becomes available
  }

  const handleQRDetected = (code: string) => {
    console.log('QR Code detected:', code)
    console.log('Current location:', locationId)
    
    // Stop scanning immediately to prevent multiple detections
    setIsScanning(false)
    if (qrScannerRef.current) {
      qrScannerRef.current.stop()
    }
    
    // Map QR codes to location IDs (implementing location-specific validation)
    const locationQRCodes = {
      'main_lobby': ['TREASURE_HUNT_MAIN_LOBBY_2025', 'MERDEKA_MAIN_LOBBY'],
      'south_lobby': ['TREASUREHUNT_SOUTH_LOBBY_2025', 'MERDEKA_SOUTH_LOBBY'],
      'east_dome': ['TREASUREHUNT_EAST_DOME_2025', 'MERDEKA_EAST_DOME'],
      'u_walk': ['TREASUREHUNT_U_WALK_2025', 'MERDEKA_U_WALK']
    }
    
    // Get valid codes for current location
    const validCodesForLocation = locationQRCodes[locationId as keyof typeof locationQRCodes] || []
    
    // Check if scanned code matches current location
    const isValidForLocation = validCodesForLocation.some(validCode => 
      code.toUpperCase().includes(validCode.toUpperCase())
    )
    
    if (isValidForLocation) {
      setSuccess('QR Code berhasil discan! 🎉')
      
      toast({
        title: "QR Code berhasil discan!",
        description: "Melanjutkan ke tahap foto selfie",
      })
      
      // Proceed to photo capture
      setTimeout(() => {
        router.push(`/photo/${locationId}`)
      }, 1500)
    } else {
      // Check if it's a valid QR code but wrong location
      const allValidCodes = Object.values(locationQRCodes).flat()
      const isValidQRButWrongLocation = allValidCodes.some(validCode => 
        code.toUpperCase().includes(validCode.toUpperCase())
      )
      
      if (isValidQRButWrongLocation) {
        setError('QR Code ini untuk lokasi lain! Pastikan Anda berada di lokasi yang benar.')
      } else {
        setError('QR Code tidak valid untuk treasure hunt ini.')
      }
      
      toast({
        title: "QR Code tidak valid",
        description: isValidQRButWrongLocation 
          ? "QR Code ini untuk lokasi lain" 
          : "Pastikan Anda berada di lokasi yang benar",
        variant: "destructive"
      })
      
      // Reset after 3 seconds
      setTimeout(() => {
        setError('')
        startScanning()
      }, 3000)
    }
  }

  const handleManualSubmit = () => {
    if (manualCode.length < 6) {
      setError('Kode tidak lengkap. Masukkan kode QR yang lengkap')
      return
    }
    
    handleQRDetected(manualCode.toUpperCase())
  }

  const goBack = () => {
    cleanupScanner()
    router.push('/dashboard')
  }

  const locationName = location?.name || LOCATION_NAMES[locationId] || "Unknown Location"

  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-light">Memuat lokasi...</p>
        </div>
      </div>
    )
  }

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
            <h1 className="text-lg font-bold text-gold">📱 Scan QR Code</h1>
            <p className="text-text-muted text-sm">{locationName}</p>
          </div>
          <div className="w-20"></div> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Location Info */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <QrCode className="h-6 w-6 text-gold" />
              <div>
                <h3 className="font-semibold text-text-light">{locationName}</h3>
                <p className="text-sm text-text-muted">
                  Scan QR code di lokasi ini
                </p>
              </div>
            </div>
            <Badge className="bg-gold/20 text-gold border-gold/30">
              Langkah 1 dari 3
            </Badge>
          </CardContent>
        </Card>

        {/* Success Message */}
        {success && (
          <Alert className="bg-green-500/10 border-green-500/30">
            <CheckCircle className="h-4 w-4 text-green-400" />
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

        {/* Camera Scanner */}
        {cameraPermission === "granted" && isScanning && (
          <Card className="bg-onyx-gray/50 border-gold/20 overflow-hidden">
            <CardContent className="p-0">
              {/* Camera Viewfinder */}
              <div className="relative h-80 bg-black overflow-hidden">
                {/* Video element for camera feed */}
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  muted
                  playsInline
                  autoPlay
                />
                
                {/* Loading overlay when initializing */}
                {isInitializing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-white text-sm">Memulai kamera...</p>
                    </div>
                  </div>
                )}
                
                {/* QR Code Detection Frame Overlay */}
                {!isInitializing && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-48 h-48">
                      {/* Corner borders */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gold rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gold rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gold rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gold rounded-br-lg"></div>
                      
                      {/* Scanning line animation */}
                      <div className="absolute inset-x-4 top-1/2 h-0.5 bg-gold animate-pulse"></div>
                    </div>
                  </div>
                )}

                {/* Instructions overlay */}
                {!isInitializing && (
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <p className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                      Arahkan kamera ke QR code {locationName}
                    </p>
                  </div>
                )}
              </div>

              {/* Camera Controls */}
              <div className="p-4 border-t border-gold/20">
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFlash}
                    className="bg-black/50 border-gold/30 text-text-light hover:bg-gold/10"
                    disabled={isInitializing}
                  >
                    <Flashlight className={`h-5 w-5 ${flashOn ? 'text-gold' : ''}`} />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={stopScanning}
                    className="bg-black/50 border-gold/30 text-text-light hover:bg-gold/10"
                    disabled={isInitializing}
                  >
                    <Type className="h-5 w-5 mr-2" />
                    Input Manual
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Manual Input */}
        {(!isScanning || cameraPermission === "denied") && (
          <Card className="bg-onyx-gray/50 border-gold/20">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <Type className="h-12 w-12 text-gold mx-auto mb-3" />
                <h3 className="font-semibold text-text-light mb-2">
                  Input Manual
                </h3>
                <p className="text-sm text-text-muted">
                  Masukkan kode QR secara manual jika kamera tidak tersedia
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Masukkan kode QR"
                    className="text-center text-lg font-mono tracking-wider bg-primary/50 border-gold/30 text-text-light placeholder:text-text-muted focus:border-gold"
                    autoFocus
                  />
                </div>

                <div className="flex gap-3">
                  {cameraPermission === "granted" && (
                    <Button
                      variant="outline"
                      onClick={startScanning}
                      className="flex-1 border-gold/30 text-text-light hover:bg-gold/10"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Kembali ke Kamera
                    </Button>
                  )}
                  <Button
                    onClick={handleManualSubmit}
                    className="flex-1 bg-gold hover:bg-gold/90 text-primary"
                    disabled={manualCode.length < 6}
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Verifikasi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Camera Permission Denied */}
        {cameraPermission === "denied" && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-6 text-center">
              <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                Akses Kamera Ditolak
              </h3>
              <p className="text-text-muted mb-4">
                Untuk menggunakan scanner QR, izinkan akses kamera pada pengaturan browser
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={requestCameraAccess}
                  className="bg-gold hover:bg-gold/90 text-primary w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <h4 className="text-blue-300 font-semibold text-sm mb-2">📋 Petunjuk Scan QR:</h4>
            <ol className="text-text-muted text-xs space-y-1 ml-4 list-decimal">
              <li>Cari QR code khusus untuk {locationName}</li>
              <li>Arahkan kamera ke QR code hingga terdeteksi</li>
              <li>Pastikan pencahayaan cukup untuk scan yang optimal</li>
              <li>QR code harus sesuai dengan lokasi yang sedang Anda kunjungi</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}