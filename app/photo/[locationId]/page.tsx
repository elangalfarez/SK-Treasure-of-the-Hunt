"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Camera, 
  ArrowLeft, 
  RotateCcw,
  CheckCircle,
  AlertCircle,
  SwitchCamera,
  X
} from "lucide-react"
import { supabaseApi, Location } from "@/lib/supabase"

export default function PhotoCapturePage() {
  const params = useParams()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const [location, setLocation] = useState<Location | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user') // Front camera for selfie
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'pending'>('pending')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false) // New state to prevent flash
  
  // Debug stream state changes
  useEffect(() => {
    console.log('📹 Stream state changed:', !!stream, stream ? 'ACTIVE' : 'NULL')
  }, [stream])
  
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
    
    // Auto-request camera permission since user likely came from QR scanner
    checkAndRequestCameraPermission()
    
    // Also try to force initialization after a delay if permission check fails
    setTimeout(() => {
      if (cameraPermission === 'pending' && !stream) {
        console.log('Forcing camera initialization attempt...')
        setCameraPermission('granted')
      }
    }, 1000)
    
  }, [locationId, router])

  // Watch for when camera permission is granted and video element is available
  useEffect(() => {
    console.log('Photo capture useEffect triggered:', { 
      cameraPermission, 
      videoElementExists: !!videoRef.current,
      hasStream: !!stream,
      capturedPhoto: !!capturedPhoto,
      isInitializing,
      isSwitchingCamera
    })
    
    if (cameraPermission === 'granted' && videoRef.current && !stream && !capturedPhoto && !isSwitchingCamera) {
      console.log('🎥 Conditions met for camera initialization, starting in 300ms...')
      setIsInitializing(true)
      
      // Add a small delay to ensure video element is fully rendered in DOM
      setTimeout(() => {
        if (videoRef.current) {
          console.log('🎥 Video element still available, initializing camera now')
          initializeCamera()
        } else {
          console.error('❌ Video element disappeared during delay')
          setIsInitializing(false)
        }
      }, 300)
    }
  }, [cameraPermission, stream, capturedPhoto, isSwitchingCamera])

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopCamera()
    }
  }, [stream])

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

  const checkAndRequestCameraPermission = async () => {
    try {
      // Try to directly get camera stream to test if permission exists
      console.log('Checking camera permission...')
      
      const testStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      // If we get here, permission is granted
      console.log('Camera permission already granted, stopping test stream')
      testStream.getTracks().forEach(track => track.stop())
      
      setCameraPermission('granted')
      
    } catch (error) {
      console.log('Camera permission not granted or not available:', error)
      setCameraPermission('pending')
    }
  }

  const initializeCamera = async (retryCount = 0) => {
    console.log('initializeCamera called, retry count:', retryCount)
    
    if (!videoRef.current) {
      console.error('Video element not available for photo capture')
      
      // Retry up to 5 times with increasing delays
      if (retryCount < 5) {
        console.log(`Retrying camera init in ${(retryCount + 1) * 300}ms... (attempt ${retryCount + 1}/5)`)
        setTimeout(() => {
          initializeCamera(retryCount + 1)
        }, (retryCount + 1) * 300)
      } else {
        setError('Tidak dapat mengakses kamera. Silakan refresh halaman.')
        setIsInitializing(false)
        setIsSwitchingCamera(false) // Reset switching state on error
      }
      return
    }

    try {
      console.log('Initializing camera with facing:', cameraFacing)
      console.log('Video element ready state:', videoRef.current.readyState)
      
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      console.log('Camera stream obtained successfully')
      
      // Double-check video element still exists
      if (!videoRef.current) {
        console.error('Video element disappeared during stream creation')
        newStream.getTracks().forEach(track => track.stop())
        setIsInitializing(false)
        setIsSwitchingCamera(false)
        return
      }
      
      setStream(newStream)
      setCameraPermission('granted')
      
      // Attach stream to video element
      videoRef.current.srcObject = newStream
      
      // Force the video to load the new source
      videoRef.current.load()
      
      // Wait for video to be ready before playing
      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded, starting playback')
        if (videoRef.current) {
          videoRef.current.play().then(() => {
            console.log('Video playback started successfully')
            setIsInitializing(false)
            setIsSwitchingCamera(false) // Reset switching state on success
          }).catch((playError) => {
            console.error('Video play error:', playError)
            setIsInitializing(false)
            setIsSwitchingCamera(false)
          })
        }
      }
      
      const handleError = (error: Event) => {
        console.error('Video element error:', error)
        setError('Gagal memulai kamera. Coba lagi.')
        setIsInitializing(false)
        setIsSwitchingCamera(false)
      }
      
      // Remove any existing event listeners
      videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata)
      videoRef.current.removeEventListener('error', handleError)
      
      // Add event listeners
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
      videoRef.current.addEventListener('error', handleError, { once: true })
      
    } catch (error) {
      console.error('Camera initialization error:', error)
      setCameraPermission('denied')
      setIsInitializing(false)
      setIsSwitchingCamera(false)
      setError('Akses kamera diperlukan untuk mengambil foto selfie.')
    }
  }

  const requestCameraPermission = async () => {
    setIsInitializing(true)
    setError('')
    
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: cameraFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      setCameraPermission('granted')
      setStream(newStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          setIsInitializing(false)
        }
      }
    } catch (error) {
      console.error('Camera permission denied:', error)
      setCameraPermission('denied')
      setIsInitializing(false)
      setError('Akses kamera diperlukan untuk mengambil foto selfie.')
    }
  }

  // FIXED: Set switching state BEFORE clearing stream to prevent flash
  const switchCamera = async () => {
    console.log('🔄 Switching camera - setting states first...')
    
    // CRUCIAL: Set loading states BEFORE clearing stream
    setIsSwitchingCamera(true)
    setIsInitializing(true)
    setError('') // Clear any previous errors
    
    // Small delay to ensure state updates are applied
    await new Promise(resolve => setTimeout(resolve, 10))
    
    // Stop current stream AFTER setting loading states
    if (stream) {
      console.log('🛑 Stopping current stream...')
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }

    const newFacing = cameraFacing === 'user' ? 'environment' : 'user'
    console.log(`📱 Switching from ${cameraFacing} to ${newFacing}`)
    setCameraFacing(newFacing)

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: newFacing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      
      console.log('✅ New camera stream obtained')
      setStream(newStream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream
        videoRef.current.onloadedmetadata = () => {
          console.log('✅ Camera switch complete')
          videoRef.current?.play()
          setIsInitializing(false)
          setIsSwitchingCamera(false) // Reset switching state
        }
      }
    } catch (error) {
      console.error('❌ Camera switch error:', error)
      setError('Gagal mengganti kamera')
      setIsInitializing(false)
      setIsSwitchingCamera(false) // Reset switching state on error
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    
    if (!context) return

    // Set canvas size to video size
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to base64 image
    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedPhoto(photoDataUrl)
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
    setError('')
    setSuccess('')
    
    // Restart camera if needed
    if (cameraPermission === 'granted' && !stream) {
      initializeCamera()
    }
  }

  const submitPhoto = async () => {
    if (!capturedPhoto || !location) return

    setUploading(true)
    setError('')

    try {
      const playerId = localStorage.getItem('playerId')
      if (!playerId) {
        throw new Error('Player ID not found')
      }

      // In a real implementation, you'd upload to Supabase Storage
      // For now, we'll store the base64 data URL
      const photoUrl = capturedPhoto

      setSuccess('Foto berhasil disimpan! 📸')
      
      // Proceed to quiz
      setTimeout(() => {
        router.push(`/quiz/${locationId}`)
      }, 1500)

    } catch (error) {
      console.error('Photo submission error:', error)
      setError('Gagal menyimpan foto. Coba lagi.')
    } finally {
      setUploading(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const goBack = () => {
    stopCamera()
    router.push(`/scanner/${locationId}`)
  }

  // FIXED: Updated condition to include switching state
  const showCameraNotActive = !stream && !isInitializing && !isSwitchingCamera && cameraPermission === 'granted'
  const showLoadingState = isInitializing || isSwitchingCamera

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
            <h1 className="text-lg font-bold text-gold">📸 Foto Selfie</h1>
            <p className="text-text-muted text-sm">{location.name}</p>
          </div>
          <div className="w-20"></div> {/* Spacer */}
        </div>
      </div>

      <div className="p-4 space-y-4">
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

        {/* Camera Permission Request */}
        {cameraPermission === 'pending' && (
          <Card className="bg-onyx-gray/50 border-gold/20">
            <CardContent className="p-6 text-center">
              <Camera className="w-16 h-16 text-gold mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-light mb-2">
                Ambil Foto Selfie
              </h3>
              <p className="text-text-muted mb-4">
                Ambil foto selfie dengan dekorasi kemerdekaan/tempat menemukan treasure hunt di {location.name}
              </p>
              <Button 
                onClick={requestCameraPermission}
                className="bg-gold hover:bg-gold/90 text-primary font-semibold"
                disabled={showLoadingState}
              >
                {showLoadingState ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                    Memulai Kamera...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Buka Kamera
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Camera View or Captured Photo */}
        {cameraPermission === 'granted' && (
          <Card className="bg-onyx-gray/50 border-gold/20 overflow-hidden">
            <CardContent className="p-0">
              {!capturedPhoto ? (
                // Live Camera View
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-80 object-cover bg-black"
                    playsInline
                    muted
                    autoPlay
                  />
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                  />
                  
                  {/* FIXED: Loading overlay when initializing OR switching */}
                  {showLoadingState && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-white text-sm">
                          {isSwitchingCamera ? 'Mengganti kamera...' : 'Memulai kamera...'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* FIXED: Show manual start button only when truly needed (no flash) */}
                  {showCameraNotActive && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-gold mx-auto mb-4" />
                        <p className="text-white text-sm mb-4">Kamera belum aktif</p>
                        <div className="space-y-2">
                          <Button
                            onClick={() => {
                              console.log('🎥 Manual camera activation requested')
                              setIsInitializing(true)
                              initializeCamera()
                            }}
                            className="bg-gold hover:bg-gold/90 text-primary"
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Aktifkan Kamera
                          </Button>
                          <p className="text-white text-xs">
                            Atau gunakan tombol ganti kamera di bawah
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Camera Controls - Always show for fallback */}
                  {!showLoadingState && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={switchCamera}
                        className="bg-black/50 border-white/30 text-white hover:bg-black/70"
                        disabled={showLoadingState}
                      >
                        <SwitchCamera className="w-4 h-4" />
                      </Button>
                      
                      {stream && (
                        <Button
                          size="lg"
                          onClick={capturePhoto}
                          className="bg-gold hover:bg-gold/90 text-primary w-16 h-16 rounded-full"
                          disabled={showLoadingState}
                        >
                          <Camera className="w-6 h-6" />
                        </Button>
                      )}
                      
                      <div className="w-10"></div> {/* Spacer for symmetry */}
                    </div>
                  )}

                  {/* Overlay Guide */}
                  {!showLoadingState && stream && (
                    <div className="absolute top-4 left-4 right-4">
                      <div className="bg-black/50 rounded-lg p-3 text-center">
                        <p className="text-white text-sm">
                          🎯 Pastikan dekorasi kemerdekaan terlihat di belakang Anda
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Captured Photo Preview
                <div className="relative">
                  <img 
                    src={capturedPhoto} 
                    alt="Captured selfie"
                    className="w-full h-80 object-cover"
                  />
                  
                  {/* Photo Controls */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                    <Button
                      variant="outline"
                      onClick={retakePhoto}
                      className="bg-black/50 border-white/30 text-white hover:bg-black/70"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Ambil Ulang
                    </Button>
                    
                    <Button
                      onClick={submitPhoto}
                      disabled={uploading}
                      className="bg-gold hover:bg-gold/90 text-primary"
                    >
                      {uploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></div>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Lanjutkan ke Quiz
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Camera Permission Denied */}
        {cameraPermission === 'denied' && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="p-6 text-center">
              <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-400 mb-2">
                Akses Kamera Ditolak
              </h3>
              <p className="text-text-muted mb-4">
                Silakan izinkan akses kamera di pengaturan browser untuk mengambil foto selfie.
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={() => window.location.reload()}
                  className="bg-gold hover:bg-gold/90 text-primary w-full"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Coba Lagi
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/quiz/${locationId}`)}
                  className="border-gold/30 text-text-light hover:bg-gold/10 w-full"
                >
                  Lewati Foto (Lanjut ke Quiz)
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photo Requirements */}
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <h4 className="text-blue-300 font-semibold text-sm mb-2">📋 Syarat Foto Selfie:</h4>
            <ul className="text-text-muted text-xs space-y-1 ml-4 list-disc">
              <li>Wajah Anda harus terlihat jelas</li>
              <li>Dekorasi kemerdekaan harus tampak di latar belakang</li>
              <li>Foto harus diambil di lokasi {location.name}</li>
              <li>Pastikan pencahayaan cukup untuk foto yang jelas</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}