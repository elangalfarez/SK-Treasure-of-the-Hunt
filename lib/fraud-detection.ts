// lib/fraud-detection.ts - Fraud detection utilities for photo validation
import * as faceapi from 'face-api.js'

// Global flag to track if face-api models are loaded
let modelsLoaded = false

/**
 * Initialize face-api.js models
 * Only loads models once to avoid multiple downloads
 */
export const initializeFaceDetection = async (): Promise<boolean> => {
  if (modelsLoaded) {
    return true
  }

  try {
    console.log('🔍 Loading face detection models...')
    
    // Load required models for face detection
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    ])
    
    modelsLoaded = true
    console.log('✅ Face detection models loaded successfully')
    return true
    
  } catch (error) {
    console.error('❌ Failed to load face detection models:', error)
    return false
  }
}

/**
 * Validate if the photo contains at least one human face (selfie validation)
 * @param imageElement - HTML Image element or Canvas element
 * @returns Promise<boolean> - true if face detected, false otherwise
 */
export const validateSelfie = async (imageElement: HTMLImageElement | HTMLCanvasElement): Promise<{ valid: boolean; faceCount: number; confidence?: number }> => {
  try {
    // Ensure models are loaded
    const modelsReady = await initializeFaceDetection()
    if (!modelsReady) {
      console.warn('⚠️ Face detection models not available, skipping validation')
      return { valid: true, faceCount: 0 } // Allow photo if models can't load
    }

    console.log('🔍 Starting face detection...')
    
    // Detect faces using tiny face detector (faster for mobile)
    const detections = await faceapi
      .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
    
    const faceCount = detections.length
    const primaryFaceConfidence = detections[0]?.detection.score
    
    console.log(`👥 Detected ${faceCount} face(s), primary confidence: ${primaryFaceConfidence}`)
    
    // Require at least one face with reasonable confidence
    const hasValidFace = faceCount > 0 && (primaryFaceConfidence || 0) > 0.5
    
    return {
      valid: hasValidFace,
      faceCount,
      confidence: primaryFaceConfidence
    }
    
  } catch (error) {
    console.error('❌ Face detection error:', error)
    // Allow photo to proceed if face detection fails (don't block user)
    return { valid: true, faceCount: 0 }
  }
}

/**
 * Get current geolocation coordinates
 * @returns Promise with lat/lng or null if not available
 */
export const getCurrentLocation = async (): Promise<{ latitude: number; longitude: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocation not supported')
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('📍 Location obtained:', position.coords.latitude, position.coords.longitude)
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error) => {
        console.warn('⚠️ Location access denied or failed:', error.message)
        resolve(null)
      },
      {
        timeout: 10000, // 10 second timeout
        enableHighAccuracy: false, // Faster but less accurate
        maximumAge: 300000 // 5 minutes cache
      }
    )
  })
}

/**
 * Validate photo metadata for fraud detection
 * @param photoBlob - The photo blob to analyze
 * @returns Promise with validation results
 */
export const validatePhotoMetadata = async (photoBlob: Blob): Promise<{
  isRecent: boolean;
  hasGPS: boolean;
  fileSize: number;
  timestamp?: Date;
  gpsCoords?: { lat: number; lng: number };
}> => {
  return new Promise((resolve) => {
    try {
      // Use dynamic import to avoid SSR issues
      import('exif-js').then((EXIF) => {
        EXIF.getData(photoBlob as any, function(this: any) {
          const timestamp = EXIF.getTag(this, 'DateTime')
          const gpsLat = EXIF.getTag(this, 'GPSLatitude')
          const gpsLng = EXIF.getTag(this, 'GPSLongitude')
          const gpsLatRef = EXIF.getTag(this, 'GPSLatitudeRef')
          const gpsLngRef = EXIF.getTag(this, 'GPSLongitudeRef')
          
          let parsedTimestamp: Date | undefined
          let isRecent = true // Default to true if no timestamp
          
          if (timestamp) {
            try {
              // Parse EXIF timestamp format: "YYYY:MM:DD HH:mm:ss"
              const timestampStr = timestamp.replace(/:/g, '-', 2).replace(/:/, ' ')
              parsedTimestamp = new Date(timestampStr)
              
              // Check if photo was taken within last 10 minutes
              const timeDiff = Date.now() - parsedTimestamp.getTime()
              isRecent = timeDiff < 600000 // 10 minutes
              
              console.log(`📅 Photo timestamp: ${parsedTimestamp}, Recent: ${isRecent}`)
            } catch (e) {
              console.warn('⚠️ Failed to parse timestamp:', timestamp)
            }
          }
          
          let gpsCoords: { lat: number; lng: number } | undefined
          let hasGPS = false
          
          if (gpsLat && gpsLng) {
            try {
              // Convert GPS coordinates from DMS to decimal
              const lat = convertDMSToDD(gpsLat, gpsLatRef)
              const lng = convertDMSToDD(gpsLng, gpsLngRef)
              
              if (lat !== null && lng !== null) {
                gpsCoords = { lat, lng }
                hasGPS = true
                console.log(`📍 EXIF GPS: ${lat}, ${lng}`)
              }
            } catch (e) {
              console.warn('⚠️ Failed to parse GPS coordinates')
            }
          }
          
          resolve({
            isRecent,
            hasGPS,
            fileSize: photoBlob.size,
            timestamp: parsedTimestamp,
            gpsCoords
          })
        })
      }).catch(() => {
        // EXIF parsing failed, return safe defaults
        console.warn('⚠️ EXIF parsing not available')
        resolve({
          isRecent: true,
          hasGPS: false,
          fileSize: photoBlob.size
        })
      })
    } catch (error) {
      console.error('❌ Metadata validation error:', error)
      resolve({
        isRecent: true,
        hasGPS: false,
        fileSize: photoBlob.size
      })
    }
  })
}

/**
 * Convert GPS DMS (Degrees, Minutes, Seconds) to Decimal Degrees
 * @param dms - Array of [degrees, minutes, seconds]
 * @param ref - Reference ('N', 'S', 'E', 'W')
 * @returns Decimal degrees or null if invalid
 */
function convertDMSToDD(dms: number[], ref: string): number | null {
  try {
    if (!dms || dms.length < 3) return null
    
    let dd = dms[0] + dms[1] / 60 + dms[2] / 3600
    
    if (ref === 'S' || ref === 'W') {
      dd = dd * -1
    }
    
    return dd
  } catch {
    return null
  }
}

/**
 * Get device information for metadata
 * @returns Object with device info
 */
export const getDeviceInfo = (): {
  userAgent: string;
  platform: string;
  screenSize: string;
  deviceMemory?: number;
  hardwareConcurrency?: number;
} => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    screenSize: `${screen.width}x${screen.height}`,
    deviceMemory: (navigator as any).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency
  }
}

/**
 * Comprehensive photo validation combining all fraud detection methods
 * @param imageElement - HTML Image element for face detection
 * @param photoBlob - Photo blob for metadata analysis
 * @returns Promise with comprehensive validation results
 */
export const validatePhotoForFraud = async (
  imageElement: HTMLImageElement | HTMLCanvasElement,
  photoBlob: Blob
): Promise<{
  isValid: boolean;
  issues: string[];
  faceDetection: { valid: boolean; faceCount: number; confidence?: number };
  metadata: {
    isRecent: boolean;
    hasGPS: boolean;
    fileSize: number;
    timestamp?: Date;
    gpsCoords?: { lat: number; lng: number };
  };
  location?: { latitude: number; longitude: number } | null;
}> => {
  console.log('🔒 Starting comprehensive fraud detection...')
  
  const issues: string[] = []
  
  // 1. Face detection validation
  const faceDetection = await validateSelfie(imageElement)
  if (!faceDetection.valid) {
    issues.push('Tidak terdeteksi wajah manusia dalam foto')
  }
  
  // 2. Metadata validation
  const metadata = await validatePhotoMetadata(photoBlob)
  
  // Check file size (too small might be a screenshot)
  if (metadata.fileSize < 50000) { // Less than 50KB
    issues.push('Ukuran file foto terlalu kecil, kemungkinan bukan foto asli')
  }
  
  // Check if photo is too old (if timestamp available)
  if (metadata.timestamp && !metadata.isRecent) {
    issues.push('Foto tidak diambil dalam waktu dekat (maksimal 10 menit)')
  }
  
  // 3. Get current location for comparison
  const currentLocation = await getCurrentLocation()
  
  // Overall validation
  const isValid = issues.length === 0
  
  console.log(`🔒 Fraud detection complete. Valid: ${isValid}, Issues: ${issues.length}`)
  if (issues.length > 0) {
    console.log('⚠️ Issues found:', issues)
  }
  
  return {
    isValid,
    issues,
    faceDetection,
    metadata,
    location: currentLocation
  }
}