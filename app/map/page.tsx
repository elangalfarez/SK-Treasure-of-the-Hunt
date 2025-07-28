"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import Header from "@/components/Header"

type Floor = "GF" | "UG" | "FF"

interface MapLocation {
  id: string
  name: string
  x: number
  y: number
  status: "locked" | "available" | "completed"
}

export default function MapPage() {
  const [activeFloor, setActiveFloor] = useState<Floor>("GF")
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const router = useRouter()

  const floors = [
    { id: "GF" as Floor, name: "Ground Floor", color: "text-gold" },
    { id: "UG" as Floor, name: "Upper Ground", color: "text-text-light" },
    { id: "FF" as Floor, name: "First Floor", color: "text-text-light" },
  ]

  const mapLocations: Record<Floor, MapLocation[]> = {
    GF: [
      { id: "atrium", name: "Atrium Central", x: 50, y: 40, status: "available" },
      { id: "playground", name: "Kids Playground", x: 75, y: 60, status: "locked" },
    ],
    UG: [{ id: "foodcourt", name: "Food Court", x: 40, y: 50, status: "locked" }],
    FF: [{ id: "cinema", name: "Cinema XXI", x: 60, y: 45, status: "locked" }],
  }

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 2))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const getLocationColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#10B981"
      case "available":
        return "#D4AF37"
      default:
        return "#9CA3AF"
    }
  }

  const handleLocationClick = (location: MapLocation) => {
    if (location.status === "available") {
      router.push(`/scanner/${location.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-onyx-gray to-black-600">
      <Header title="Peta Mall" showBack onBack={() => router.push("/dashboard")} />

      <div className="p-4 space-y-4">
        {/* Floor Selector */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex space-x-2">
              {floors.map((floor) => (
                <Button
                  key={floor.id}
                  onClick={() => setActiveFloor(floor.id)}
                  variant={activeFloor === floor.id ? "default" : "outline"}
                  className={`flex-1 ${
                    activeFloor === floor.id
                      ? "bg-gold text-primary hover:bg-gold/90"
                      : "bg-transparent border-gold/30 text-text-light hover:bg-gold/10"
                  }`}
                >
                  <div className="text-center">
                    <div className="font-semibold">{floor.id}</div>
                    <div className="text-xs opacity-80">{floor.name}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Map Container */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="relative h-80 bg-primary/30 rounded-lg overflow-hidden border border-gold/20">
              {/* Map SVG */}
              <svg
                className="w-full h-full"
                style={{
                  transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                  transition: "transform 0.2s ease",
                }}
              >
                {/* Mall Layout - Simplified */}
                <rect
                  x="10%"
                  y="10%"
                  width="80%"
                  height="80%"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="2"
                  opacity="0.3"
                />

                {/* Corridors */}
                <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="#D4AF37" strokeWidth="1" opacity="0.2" />
                <line x1="10%" y1="50%" x2="90%" y2="50%" stroke="#D4AF37" strokeWidth="1" opacity="0.2" />

                {/* Location Markers */}
                {mapLocations[activeFloor].map((location) => (
                  <g key={location.id}>
                    <circle
                      cx={`${location.x}%`}
                      cy={`${location.y}%`}
                      r="8"
                      fill={getLocationColor(location.status)}
                      stroke="#1F2937"
                      strokeWidth="2"
                      className={`cursor-pointer transition-all duration-300 ${
                        location.status === "available" ? "animate-pulse" : ""
                      }`}
                      onClick={() => handleLocationClick(location)}
                    />
                    <text
                      x={`${location.x}%`}
                      y={`${location.y + 8}%`}
                      textAnchor="middle"
                      className="fill-text-light text-xs font-medium"
                      style={{ fontSize: "10px" }}
                    >
                      {location.name}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Map Controls */}
              <div className="absolute top-4 right-4 flex flex-col space-y-2">
                <Button
                  size="sm"
                  onClick={handleZoomIn}
                  className="bg-onyx-gray/80 border border-gold/30 text-gold hover:bg-gold/10"
                  variant="outline"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleZoomOut}
                  className="bg-onyx-gray/80 border border-gold/30 text-gold hover:bg-gold/10"
                  variant="outline"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleReset}
                  className="bg-onyx-gray/80 border border-gold/30 text-gold hover:bg-gold/10"
                  variant="outline"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex justify-center space-x-6 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gold rounded-full animate-pulse"></div>
                <span className="text-text-muted">Tersedia</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-success rounded-full"></div>
                <span className="text-text-muted">Selesai</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-text-muted rounded-full"></div>
                <span className="text-text-muted">Terkunci</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mini Map */}
        <Card className="bg-onyx-gray/50 border-gold/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-text-light mb-2">Lokasi di {activeFloor}</h3>
            <div className="space-y-2">
              {mapLocations[activeFloor].map((location) => (
                <div key={location.id} className="flex items-center justify-between p-2 bg-primary/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getLocationColor(location.status) }}
                    />
                    <span className="text-text-light text-sm">{location.name}</span>
                  </div>
                  <span className="text-xs text-text-muted capitalize">
                    {location.status === "available"
                      ? "Tersedia"
                      : location.status === "completed"
                        ? "Selesai"
                        : "Terkunci"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
