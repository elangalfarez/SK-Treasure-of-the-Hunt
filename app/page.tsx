"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Copy, ArrowRight } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface RegistrationData {
  code: string
  name: string
  phone: string
}

export default function RegistrationPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<RegistrationData>({
    code: "",
    name: "",
    phone: "",
  })
  const router = useRouter()

  const handleCodeChange = (value: string) => {
    const formatted = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6)
    setData((prev) => ({ ...prev, code: formatted }))
  }

  const handlePhoneChange = (value: string) => {
    let formatted = value.replace(/[^0-9]/g, "")
    if (formatted.startsWith("0")) {
      formatted = formatted.slice(0, 13)
    }
    setData((prev) => ({ ...prev, phone: formatted }))
  }

  const validateStep = () => {
    switch (step) {
      case 1:
        return data.code.length === 6
      case 2:
        return data.name.trim().length >= 2
      case 3:
        return data.phone.length >= 10 && data.phone.startsWith("08")
      default:
        return false
    }
  }

  const handleNext = async () => {
    if (!validateStep()) return

    if (step < 3) {
      setStep(step + 1)
    } else {
      setLoading(true)
      // Simulate registration
      await new Promise((resolve) => setTimeout(resolve, 2000))
      localStorage.setItem("playerData", JSON.stringify(data))
      toast({
        title: "Registrasi Berhasil!",
        description: "Selamat datang di Treasure Hunt Supermal Karawaci",
      })
      router.push("/dashboard")
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(data.code)
    toast({
      title: "Kode Disalin",
      description: "Kode registrasi telah disalin ke clipboard",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-onyx-gray border-b border-gold/20 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gold mb-1">Treasure Hunt</h1>
          <p className="text-text-muted text-sm">Supermal Karawaci</p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="p-6">
        <div className="flex justify-center items-center space-x-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  i <= step ? "bg-gold border-gold text-primary" : "border-text-muted text-text-muted"
                }`}
              >
                {i < step ? <CheckCircle className="w-4 h-4" /> : i}
              </div>
              {i < 3 && (
                <div
                  className={`w-8 h-0.5 mx-2 transition-all duration-300 ${i < step ? "bg-gold" : "bg-text-muted/30"}`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-6">
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-text-light mb-2">Masukkan Kode Registrasi</h2>
                  <p className="text-text-muted text-sm">Masukkan kode 6 karakter yang Anda terima</p>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      value={data.code}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      placeholder="ABCD12"
                      className="text-center text-2xl font-mono tracking-widest bg-primary/50 border-gold/30 text-text-light placeholder:text-text-muted focus:border-gold"
                      maxLength={6}
                      onKeyDown={(e) => e.key === "Enter" && validateStep() && handleNext()}
                    />
                    {data.code && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gold hover:text-gold/80"
                        onClick={copyCode}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="text-center text-xs text-text-muted">{data.code.length}/6 karakter</div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-text-light mb-2">Nama Lengkap</h2>
                  <p className="text-text-muted text-sm">Masukkan nama lengkap Anda</p>
                </div>
                <Input
                  value={data.name}
                  onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Nama Lengkap"
                  className="bg-primary/50 border-gold/30 text-text-light placeholder:text-text-muted focus:border-gold"
                  onKeyDown={(e) => e.key === "Enter" && validateStep() && handleNext()}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-text-light mb-2">Nomor Telepon</h2>
                  <p className="text-text-muted text-sm">Masukkan nomor telepon aktif Anda</p>
                </div>
                <Input
                  value={data.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  type="tel"
                  className="bg-primary/50 border-gold/30 text-text-light placeholder:text-text-muted focus:border-gold"
                  onKeyDown={(e) => e.key === "Enter" && validateStep() && handleNext()}
                />
                {data.phone && !data.phone.startsWith("08") && (
                  <p className="text-red-error text-xs">Nomor telepon harus dimulai dengan 08</p>
                )}
              </div>
            )}

            <Button
              onClick={handleNext}
              disabled={!validateStep() || loading}
              className="w-full mt-6 bg-gold hover:bg-gold/90 text-primary font-semibold py-3 transition-all duration-300 hover:shadow-lg hover:shadow-gold/25"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Memproses...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>{step === 3 ? "Mulai Permainan" : "Lanjutkan"}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
