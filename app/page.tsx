// app/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CheckCircle, Copy, ArrowRight, AlertCircle, Phone, RefreshCw, Trophy, User, Hash } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { supabaseApi, Player } from "@/lib/supabase"

interface RegistrationData {
  code: string
  name: string
  phone: string
}

export default function RegistrationPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [data, setData] = useState<RegistrationData>({
    code: "",
    name: "",
    phone: "",
  })
  
  // Recovery state
  const [showRecovery, setShowRecovery] = useState(false)
  const [recoveryPhone, setRecoveryPhone] = useState("")
  const [recoveryLoading, setRecoveryLoading] = useState(false)
  
  const router = useRouter()

  // Check if already registered
  useEffect(() => {
    const playerId = localStorage.getItem('playerId')
    if (playerId) {
      router.push('/dashboard')
    }
  }, [router])

  const handleCodeChange = (value: string) => {
    const formatted = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6)
    setData((prev) => ({ ...prev, code: formatted }))
    setError("")
  }

  const handlePhoneChange = (value: string) => {
    let formatted = value.replace(/[^0-9]/g, "")
    if (formatted.startsWith("0")) {
      formatted = formatted.slice(0, 13)
    }
    setData((prev) => ({ ...prev, phone: formatted }))
    setError("")
  }

  const validateStep = () => {
    switch (step) {
      case 1:
        return data.code.length === 6
      case 2:
        return data.name.trim().length >= 2 && data.phone.length >= 10 && data.phone.startsWith("08")
      case 3:
        return true // Confirmation step
      default:
        return false
    }
  }

  const handleNext = async () => {
    if (!validateStep()) return
    
    setLoading(true)
    setError("")

    try {
      if (step === 1) {
        // Step 1: Validate code
        const result = await supabaseApi.validateSignupCode(data.code)
        
        if (result.valid) {
          setStep(2)
          toast({
            title: "Kode Valid ✅",
            description: "Silakan lengkapi data diri Anda",
          })
        } else {
          setError(result.message || "Kode tidak valid")
        }
      } else if (step === 2) {
        // Step 2: Validate data and move to confirmation
        if (!data.name.trim() || data.name.trim().length < 2) {
          setError("Nama harus minimal 2 karakter")
          return
        }
        
        if (!data.phone || !/^08\d{8,11}$/.test(data.phone)) {
          setError("Format nomor WhatsApp tidak valid (08xxxxxxxxx)")
          return
        }
        
        setStep(3)
      } else if (step === 3) {
        // Step 3: Complete registration
        const result = await supabaseApi.registerPlayer(data.code, data.name, data.phone)
        
        if (result.success && result.player) {
          // Save player data to localStorage
          localStorage.setItem('playerId', result.player.id.toString())
          localStorage.setItem('playerName', result.player.name)
          localStorage.setItem('playerPhone', result.player.phone)
          
          toast({
            title: "Registrasi Berhasil! 🎉",
            description: "Selamat datang di Treasure Hunt Supermal Karawaci",
          })
          
          router.push("/dashboard")
        } else {
          setError(result.message || "Gagal mendaftar")
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError("Terjadi kesalahan. Coba lagi nanti.")
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      setError("")
    }
  }

  // Account Recovery Logic
  const handleRecovery = async () => {
    const phone = recoveryPhone.trim()
    
    if (!phone || !/^08\d{8,11}$/.test(phone)) {
      setError('Format nomor WhatsApp tidak valid (08xxxxxxxxx)')
      return
    }

    setRecoveryLoading(true)
    setError("")

    try {
      // Look up player by phone number
      const { data: players, error } = await supabaseApi.supabase
        .from('players')
        .select('*')
        .eq('phone', phone)
        .single()

      if (error || !players) {
        setError('Nomor WhatsApp tidak ditemukan. Pastikan Anda sudah pernah mendaftar.')
        return
      }

      // Found player - restore their session
      localStorage.setItem('playerId', players.id.toString())
      localStorage.setItem('playerName', players.name)
      localStorage.setItem('playerPhone', players.phone)

      toast({
        title: "Akun Ditemukan! ✅",
        description: `Selamat datang kembali, ${players.name}!`,
      })

      // Close recovery dialog and redirect
      setShowRecovery(false)
      
      setTimeout(() => {
        router.push("/dashboard")
      }, 1000)

    } catch (error) {
      console.error('Recovery error:', error)
      setError('Terjadi kesalahan saat mencari akun Anda.')
    } finally {
      setRecoveryLoading(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(data.code)
    toast({
      title: "Kode Disalin",
      description: "Kode registrasi telah disalin ke clipboard",
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && !loading) {
      action()
    }
  }

  const getStepIcon = (stepNumber: number) => {
    if (stepNumber < step) {
      return <CheckCircle className="w-4 h-4" />
    } else if (stepNumber === 1) {
      return <Hash className="w-4 h-4" />
    } else if (stepNumber === 2) {
      return <User className="w-4 h-4" />
    } else {
      return <Trophy className="w-4 h-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-gold" />
        </div>
        <h1 className="text-3xl font-bold text-text-light mb-2">Supermal Karawaci</h1>
        <h2 className="text-xl font-semibold text-gold mb-1">Treasure Hunt</h2>
        <p className="text-text-muted text-sm">Bergabunglah dalam petualangan seru!</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                i <= step 
                  ? "bg-gold border-gold text-primary" 
                  : "border-text-muted/50 text-text-muted bg-transparent"
              }`}
            >
              {getStepIcon(i)}
            </div>
            {i < 3 && (
              <div
                className={`w-12 h-0.5 mx-2 transition-all duration-300 ${
                  i < step ? "bg-gold" : "bg-text-muted/30"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Main Content Card */}
      <Card className="w-full max-w-md bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
        <CardContent className="p-8">
          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-6">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Step 1: Code Entry */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gold mb-2">Kode Treasure Hunt</h3>
                <p className="text-text-muted text-sm">
                  Kode Treasure Hunt
                </p>
                <p className="text-text-muted text-xs mt-2">
                  Dapatkan kode dari petugas di lokasi
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    value={data.code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, handleNext)}
                    placeholder="Masukkan 6 karakter kode"
                    className="text-center text-2xl font-mono tracking-widest bg-primary/30 border-gold/30 text-text-light placeholder:text-text-muted/60 focus:border-gold h-14"
                    maxLength={6}
                    disabled={loading}
                  />
                  {data.code && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gold hover:text-gold/80"
                      onClick={copyCode}
                      disabled={loading}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="text-center text-xs text-text-muted">
                  {data.code.length}/6 karakter
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Personal Data */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gold mb-2">Data Diri</h3>
                <p className="text-text-muted text-sm">
                  Lengkapi informasi diri Anda
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-text-light font-medium mb-2 text-sm">
                    Nama Lengkap
                  </label>
                  <Input
                    value={data.name}
                    onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Masukkan nama lengkap"
                    className="bg-primary/30 border-gold/30 text-text-light placeholder:text-text-muted/60 focus:border-gold h-12"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-text-light font-medium mb-2 text-sm">
                    Nomor HP
                  </label>
                  <Input
                    value={data.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onKeyDown={(e) => handleKeyPress(e, handleNext)}
                    placeholder="08xxxxxxxxx"
                    type="tel"
                    className="bg-primary/30 border-gold/30 text-text-light placeholder:text-text-muted/60 focus:border-gold h-12"
                    disabled={loading}
                  />
                  <p className="text-text-muted text-xs mt-1">
                    Format: 08xxxxxxxxx (minimal 10 digit)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-gold mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gold mb-2">Konfirmasi Data</h3>
                <p className="text-text-muted text-sm">
                  Pastikan data yang Anda masukkan sudah benar
                </p>
              </div>
              
              <div className="bg-primary/20 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gold/20">
                  <span className="text-text-muted text-sm">Kode:</span>
                  <span className="text-text-light font-mono font-semibold">{data.code}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gold/20">
                  <span className="text-text-muted text-sm">Nama:</span>
                  <span className="text-text-light font-semibold">{data.name}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-text-muted text-sm">HP:</span>
                  <span className="text-text-light font-semibold">{data.phone}</span>
                </div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <p className="text-orange-300 text-xs leading-relaxed">
                  Pastikan data yang Anda masukkan sudah benar, karena data ini tidak dapat diubah ketika terdaftar. 
                  Dengan mendaftar, Anda setuju untuk memberikan data KTP jika menang. 
                  Kelalaian dalam mengisi data berpotensi membuat Anda terdiskualifikasi.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <Button
              onClick={handleNext}
              disabled={!validateStep() || loading}
              className="w-full bg-gold hover:bg-gold/90 text-primary font-semibold py-3 h-12 transition-all duration-300 hover:shadow-lg hover:shadow-gold/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>
                    {step === 1 ? "Memvalidasi..." : step === 3 ? "Mendaftarkan..." : "Memproses..."}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>
                    {step === 1 ? "Lanjut" : step === 2 ? "Lanjut" : "Daftar Sekarang"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>

            {step > 1 && (
              <Button
                onClick={handleBack}
                variant="outline"
                disabled={loading}
                className="w-full border-gold/30 text-text-light hover:bg-gold/10 hover:border-gold/50 h-12"
              >
                Kembali
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Recovery Button */}
      <div className="mt-6 text-center">
        <Dialog open={showRecovery} onOpenChange={setShowRecovery}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              className="text-text-muted hover:text-gold text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sudah pernah daftar? Lanjutkan Progress
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-onyx-gray border-gold/20 text-text-light max-w-md">
            <DialogHeader>
              <DialogTitle className="text-gold flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Lanjutkan Progress
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-text-muted text-sm">
                Masukkan nomor WhatsApp yang Anda gunakan saat mendaftar untuk melanjutkan progress permainan.
              </p>
              
              <div className="space-y-2">
                <Input
                  value={recoveryPhone}
                  onChange={(e) => setRecoveryPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 13))}
                  onKeyDown={(e) => handleKeyPress(e, handleRecovery)}
                  placeholder="08123456789"
                  type="tel"
                  className="bg-primary/50 border-gold/30 text-text-light placeholder:text-text-muted focus:border-gold"
                  disabled={recoveryLoading}
                />
                
                {error && (
                  <p className="text-red-400 text-xs">{error}</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRecovery(false)
                    setRecoveryPhone("")
                    setError("")
                  }}
                  className="flex-1 border-gold/30 text-text-light hover:bg-gold/10"
                  disabled={recoveryLoading}
                >
                  Batal
                </Button>
                
                <Button
                  onClick={handleRecovery}
                  disabled={!recoveryPhone || recoveryPhone.length < 10 || !recoveryPhone.startsWith("08") || recoveryLoading}
                  className="flex-1 bg-gold hover:bg-gold/90 text-primary"
                >
                  {recoveryLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                      Mencari...
                    </>
                  ) : (
                    <>
                      <Phone className="w-4 h-4 mr-2" />
                      Lanjutkan
                    </>
                  )}
                </Button>
              </div>

              <p className="text-text-muted text-xs text-center">
                💡 Fitur ini membantu Anda melanjutkan progress apabila terjadi kehilangan hp/clear browser cookies/device baru
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-text-muted text-xs">
          🏪 Supermal Karawaci × 🇮🇩 HUT RI ke-80
        </p>
      </div>
    </div>
  )
}