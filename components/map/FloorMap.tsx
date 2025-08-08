// components/map/FloorMap.tsx - FIXED VERSION WITH CORRECT COORDINATES
import React, { useState, useRef, useCallback } from 'react';
import { Location, FloorLayout } from '@/lib/supabase';
import { ZoomIn, ZoomOut, RotateCcw, MapPin, CheckCircle, Lock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import SVGTenantRenderer from './SVGTenantRenderer'

interface FloorMapProps {
  locations: Location[];
  selectedFloor: 'GF' | 'UG' | 'FF';
  floorLayout: FloorLayout | null;
  onLocationClick: (location: Location) => void;
  loading?: boolean;
}

const FloorMap: React.FC<FloorMapProps> = ({ 
  locations, 
  selectedFloor, 
  floorLayout,
  onLocationClick,
  loading = false
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  // Filter locations for current floor
  const floorLocations = locations.filter(loc => loc.floor === selectedFloor);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev / 1.2, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  }, [position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const getLocationIcon = (location: Location) => {
    switch (location.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-success" />;
      case 'available':
        return <MapPin className="w-6 h-6 text-gold" />;
      case 'locked':
        return <Lock className="w-6 h-6 text-text-muted" />;
    }
  };

  const getLocationColor = (location: Location) => {
    switch (location.status) {
      case 'completed':
        return 'bg-green-success/20 border-green-success';
      case 'available':
        return 'bg-gold/20 border-gold animate-pulse';
      case 'locked':
        return 'bg-gray-600/20 border-gray-600';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="relative w-full h-full bg-accent rounded-2xl overflow-hidden flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        <p className="ml-4 text-text-light">Memuat peta mall...</p>
      </div>
    );
  }

  // Check if we have floor layout data
  const hasFloorLayout = floorLayout && floorLayout.svg_path_data;
  
  // Debug logging
  console.log('🗺️ FloorMap Debug:', {
    selectedFloor,
    hasFloorLayout,
    floorLayout: floorLayout ? {
      id: floorLayout.id,
      floor_code: floorLayout.floor_code,
      floor_name: floorLayout.floor_name,
      dataLength: floorLayout.svg_path_data?.length || 0,
      viewbox: floorLayout.viewbox
    } : 'null',
    locationsCount: floorLocations.length,
    locations: floorLocations.map(l => ({ name: l.name, coords: l.coordinates }))
  });
    // Add this inside FloorMap component, before the return statement
    const getFloorId = (floorCode: string): string => {
      const mappings = {
        'GF': '2f08998d-357e-4e77-ab9b-eb438868d4f2',
        'UG': '4235263c-81f9-410f-b2bf-04279927fe81', 
        'FF': '1d31727d-564b-4930-b7fb-76ea60dda101' // TODO: Get your actual FF floor ID
      }
      return mappings[floorCode as keyof typeof mappings] || ''
    }

    const currentFloorId = getFloorId(selectedFloor)

  return (
    <div className="relative w-full h-full bg-accent rounded-2xl overflow-hidden">

      {/* Show error message if no floor layout */}
      {!hasFloorLayout && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <div className="bg-primary/90 backdrop-blur-lg border border-gold/20 rounded-xl p-6 text-center max-w-sm">
            <AlertCircle className="w-16 h-16 text-text-muted mx-auto mb-4 opacity-50" />
            <h3 className="text-text-light font-semibold mb-2">Peta Tidak Tersedia</h3>
            <p className="text-text-muted text-sm mb-4">
              Data SVG untuk lantai {selectedFloor} belum tersedia
            </p>
            <p className="text-text-muted text-xs">
              Debug: {floorLayout ? `Layout found but no SVG data (${floorLayout.svg_path_data?.length || 0} chars)` : 'No layout found'}
            </p>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative w-full h-full transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center'
          }}
        >
          {/* Mall Floor Plan SVG */}
          <svg
            viewBox={floorLayout?.viewbox || "0 0 500 400"}
            className="w-full h-full"
            style={{ 
              minWidth: '500px', 
              minHeight: '400px',
              background: floorLayout?.svg_background_color || '#1F2937'
            }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="floorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1F2937" />
                <stop offset="100%" stopColor="#121421" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="treasureGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Floor Background */}
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill={floorLayout?.svg_background_color || "url(#floorGradient)"}
              stroke="#D4AF37"
              strokeWidth="1"
              opacity="0.1"
              rx="8"
            />

            {/* RENDER ACTUAL TENANT BOUNDARIES */}
            {currentFloorId && (
              <SVGTenantRenderer 
                floorId={currentFloorId}
                className="tenant-layer"
              />
            )}

            {/* FALLBACK: Basic floor layout if no SVG data */}
            {!hasFloorLayout && (
              <>
                <text x="250" y="100" textAnchor="middle" fill="#D4AF37" fontSize="24" fontWeight="bold">
                  {selectedFloor} - {floorLayout?.floor_name || 'Floor Layout'}
                </text>
                
                <text x="250" y="140" textAnchor="middle" fill="#F8FAFC" fontSize="14">
                  Memuat data SVG...
                </text>

                {/* Basic floor outline */}
                <rect
                  x="50"
                  y="50"
                  width="400"
                  height="300"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="2"
                  opacity="0.5"
                  rx="10"
                />

                {/* Grid pattern */}
                <defs>
                  <pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse">
                    <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.2"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" opacity="0.1"/>
              </>
            )}
          </svg>

          {/* Treasure Hunt Location Markers - FIXED coordinates */}
          {floorLocations.map((location, index) => {
            // Parse viewBox to get dimensions
            const viewBoxParts = (floorLayout?.viewbox || "0 0 500 400").split(' ').map(Number);
            const viewBoxWidth = viewBoxParts[2] || 500;
            const viewBoxHeight = viewBoxParts[3] || 400;

            // Calculate position as percentage
            const xPercent = ((location.coordinates?.x || (100 + index * 80)) / viewBoxWidth) * 100;
            const yPercent = ((location.coordinates?.y || (150 + (index % 2) * 50)) / viewBoxHeight) * 100;

            return (
              <motion.div
                key={location.id}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 260, 
                  damping: 20,
                  delay: index * 0.1 
                }}
                className="absolute z-10"
                style={{
                  left: `${xPercent}%`,
                  top: `${yPercent}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <button
                  onClick={() => onLocationClick(location)}
                  className={`relative p-4 rounded-full border-2 backdrop-blur-lg transition-all duration-500 hover:scale-110 ${getLocationColor(location)} shadow-lg`}
                  disabled={location.status === 'locked'}
                  style={{
                    filter: location.status === 'available' ? 'url(#treasureGlow)' : undefined
                  }}
                >
                  {getLocationIcon(location)}
                  
                  {/* Location Number Badge */}
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gold text-primary text-xs font-bold rounded-full flex items-center justify-center border-2 border-primary">
                    {location.unlock_order}
                  </div>
                  
                  {/* Location Label */}
                  <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-20">
                    <div className="bg-primary/95 backdrop-blur-lg border border-gold/30 rounded-lg px-3 py-2 shadow-lg">
                      <p className="text-sm font-semibold text-text-light">{location.name}</p>
                      <div className="text-xs text-gold mt-1 font-medium">
                        {location.status === 'completed' ? '✓ Selesai' : 
                         location.status === 'available' ? '→ Tap untuk mulai' : 
                         '🔒 Terkunci'}
                      </div>
                    </div>
                    
                    {/* Speech bubble pointer */}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-primary/95"></div>
                  </div>
                  
                  {/* Status animations */}
                  {location.status === 'available' && (
                    <>
                      <div className="absolute inset-0 rounded-full border-2 border-gold animate-ping opacity-75" />
                      <div className="absolute inset-2 rounded-full border-2 border-gold animate-ping opacity-50" style={{ animationDelay: '0.2s' }} />
                    </>
                  )}

                  {location.status === 'completed' && (
                    <div className="absolute inset-0 rounded-full bg-green-success/30 animate-pulse shadow-lg shadow-green-success/20" />
                  )}

                  {/* Lock shake animation for locked locations */}
                  {location.status === 'locked' && (
                    <motion.div 
                      className="absolute inset-0"
                      animate={{ rotate: [-1, 1, -1, 1, 0] }}
                      transition={{ 
                        duration: 0.5, 
                        repeat: Infinity, 
                        repeatDelay: 3,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </button>
              </motion.div>
            )
          })}

          {/* No Locations Message */}
          {floorLocations.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-primary/80 backdrop-blur-lg border border-gold/20 rounded-xl p-6 text-center max-w-sm">
                <MapPin className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-light font-medium">Belum ada treasure hunt di lantai {selectedFloor}</p>
                <p className="text-text-muted text-sm mt-2">Pilih lantai lain untuk melihat lokasi yang tersedia</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Controls - Enhanced */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleZoomIn}
          className="p-3 bg-accent/90 backdrop-blur-lg border border-gold/30 rounded-xl text-gold hover:bg-gold/10 transition-all duration-300 shadow-lg"
          disabled={scale >= 3}
        >
          <ZoomIn className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleZoomOut}
          className="p-3 bg-accent/90 backdrop-blur-lg border border-gold/30 rounded-xl text-gold hover:bg-gold/10 transition-all duration-300 shadow-lg"
          disabled={scale <= 0.5}
        >
          <ZoomOut className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleReset}
          className="p-3 bg-accent/90 backdrop-blur-lg border border-gold/30 rounded-xl text-gold hover:bg-gold/10 transition-all duration-300 shadow-lg"
        >
          <RotateCcw className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Enhanced Scale Indicator */}
      <div className="absolute bottom-4 left-4 bg-accent/90 backdrop-blur-lg border border-gold/20 rounded-xl px-4 py-2 shadow-lg">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-gold rounded-full animate-pulse"></div>
          <p className="text-sm text-text-light font-medium">
            {Math.round(scale * 100)}%
          </p>
        </div>
      </div>

      {/* Enhanced Floor Info */}
      <div className="absolute bottom-4 right-4 bg-accent/90 backdrop-blur-lg border border-gold/20 rounded-xl px-4 py-2 shadow-lg">
        <p className="text-sm text-text-light font-semibold">
          {floorLayout?.floor_name || `Floor ${selectedFloor}`}
        </p>
        <div className="flex items-center space-x-2 mt-1">
          <p className="text-xs text-text-muted">
            {floorLocations.length} lokasi treasure hunt
          </p>
          {floorLocations.some(l => l.status === 'available') && (
            <div className="w-2 h-2 bg-gold rounded-full animate-ping"></div>
          )}
        </div>
      </div>

      {/* Pan/Zoom Instructions */}
      <div className="absolute top-4 left-4 bg-primary/80 backdrop-blur-lg border border-gold/20 rounded-xl px-3 py-2 shadow-lg max-w-xs">
        <p className="text-xs text-gold font-medium">
          💡 Drag untuk menggeser, pinch/scroll untuk zoom
        </p>
      </div>
    </div>
  );
};

export default FloorMap;