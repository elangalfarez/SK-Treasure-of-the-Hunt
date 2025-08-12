// Test page for fraud detection features
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { 
  validateSelfie, 
  validatePhotoMetadata, 
  getCurrentLocation, 
  getDeviceInfo 
} from '@/lib/fraud-detection'

export default function FraudDetectionTest() {
  const router = useRouter()
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDeviceInfo = () => {
    const info = getDeviceInfo()
    setResults({ type: 'Device Info', data: info })
  }

  const testGeolocation = async () => {
    setLoading(true)
    const location = await getCurrentLocation()
    setResults({ type: 'Geolocation', data: location })
    setLoading(false)
  }

  const testFaceDetection = async () => {
    setLoading(true)
    try {
      // Create a simple test image
      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(0, 0, 200, 200)
        ctx.fillStyle = '#f0f0f0'
        ctx.fillText('Test Image', 50, 100)
      }

      const result = await validateSelfie(canvas)
      setResults({ type: 'Face Detection', data: result })
    } catch (error) {
      setResults({ type: 'Face Detection', data: { error: (error as Error).message } })
    }
    setLoading(false)
  }

  const testPhotoMetadata = async () => {
    setLoading(true)
    try {
      // Create a test blob
      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 200
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        ctx.fillStyle = '#333'
        ctx.fillRect(0, 0, 200, 200)
      }
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const result = await validatePhotoMetadata(blob)
          setResults({ type: 'Photo Metadata', data: result })
        }
        setLoading(false)
      }, 'image/jpeg')
    } catch (error) {
      setResults({ type: 'Photo Metadata', data: { error: (error as Error).message } })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-onyx-gray border-b border-gold/20 p-4">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => router.push('/')}
            className="text-text-light hover:text-gold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-lg font-bold text-gold">🔒 Fraud Detection Test</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        <Card className="bg-onyx-gray/50 border-gold/20">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gold mb-4">Test Fraud Detection Features</h2>
            <p className="text-text-muted mb-6 text-sm">
              Click the buttons below to test different components of the fraud detection system.
            </p>
            
            <div className="grid grid-cols-1 gap-3">
              <Button
                onClick={testDeviceInfo}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                📱 Test Device Info Collection
              </Button>
              
              <Button
                onClick={testGeolocation}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? '📍 Getting Location...' : '📍 Test Geolocation'}
              </Button>
              
              <Button
                onClick={testFaceDetection}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? '👤 Testing Face Detection...' : '👤 Test Face Detection'}
              </Button>
              
              <Button
                onClick={testPhotoMetadata}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {loading ? '🔍 Testing Metadata...' : '🔍 Test Photo Metadata'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {results && (
          <Card className="bg-onyx-gray/50 border-gold/20">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gold mb-3">
                📊 {results.type} Results
              </h3>
              <div className="bg-black/30 p-4 rounded-lg overflow-auto">
                <pre className="text-sm text-text-light whitespace-pre-wrap">
                  {JSON.stringify(results.data, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <h4 className="text-blue-300 font-semibold text-sm mb-2">ℹ️ Test Information:</h4>
            <ul className="text-text-muted text-xs space-y-1 ml-4 list-disc">
              <li>Device Info: Collects browser and hardware information</li>
              <li>Geolocation: Tests GPS coordinate access (requires permission)</li>
              <li>Face Detection: Tests face-api.js integration (models may not be loaded)</li>
              <li>Photo Metadata: Tests EXIF data extraction from images</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}