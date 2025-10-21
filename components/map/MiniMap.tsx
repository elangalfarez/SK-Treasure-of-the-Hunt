// components/map/MiniMap.tsx - ENHANCED VERSION WITH REAL DATA
import React from 'react';
import { Location } from '@/lib/supabase';
import { MapPin, CheckCircle, Lock, Trophy, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface MiniMapProps {
  locations: Location[];
  selectedFloor: 'GF' | 'UG' | 'FF';
  onLocationClick: (location: Location) => void;
  loading?: boolean;
}

const MiniMap: React.FC<MiniMapProps> = ({ 
  locations, 
  selectedFloor, 
  onLocationClick,
  loading = false
}) => {
  const floorLocations = locations.filter(loc => loc.floor === selectedFloor);

  const getLocationIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-success" />;
      case 'available':
        return <MapPin className="w-4 h-4 text-gold" />;
      case 'locked':
        return <Lock className="w-4 h-4 text-text-muted" />;
      default:
        return <AlertCircle className="w-4 h-4 text-text-muted" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Selesai';
      case 'available':
        return 'Tersedia';
      case 'locked':
        return 'Terkunci';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-success/20 text-green-400 border-green-success/30';
      case 'available':
        return 'bg-gold/20 text-gold border-gold/30';
      case 'locked':
        return 'bg-gray-600/20 text-text-muted border-gray-600/30';
      default:
        return 'bg-gray-600/20 text-text-muted border-gray-600/30';
    }
  };

  const getButtonStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-success/10 hover:bg-green-success/20 border-green-success/30';
      case 'available':
        return 'bg-gold/10 hover:bg-gold/20 border-gold/30 animate-pulse';
      case 'locked':
        return 'bg-primary/50 hover:bg-primary/70 border-gray-600/30 opacity-60';
      default:
        return 'bg-primary/50 hover:bg-primary/70 border-gray-600/30';
    }
  };

  if (loading) {
    return (
      <div className="bg-accent/80 backdrop-blur-lg border border-gold/20 rounded-xl p-4">
        <div className="flex items-center mb-3">
          <div className="w-4 h-4 bg-text-muted/30 rounded mr-2 animate-pulse"></div>
          <div className="w-32 h-4 bg-text-muted/30 rounded animate-pulse"></div>
        </div>
        
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-2 bg-text-muted/10 rounded-lg animate-pulse">
              <div className="w-full h-4 bg-text-muted/30 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-accent/80 backdrop-blur-lg border border-gold/20 rounded-xl p-4">
      {/* Header */}
      <h3 className="text-sm font-semibold text-text-light mb-3 flex items-center">
        <MapPin className="w-4 h-4 text-gold mr-2" />
        Lokasi Lantai {selectedFloor}
        {floorLocations.length > 0 && (
          <span className="ml-2 text-xs bg-gold/20 text-gold px-2 py-1 rounded-full">
            {floorLocations.length}
          </span>
        )}
      </h3>
      
      {/* Locations List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {floorLocations.map((location, index) => (
          <motion.button
            key={location.id}
            onClick={() => onLocationClick(location)}
            disabled={location.status === 'locked'}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all duration-300 disabled:cursor-not-allowed ${getButtonStyle(location.status ?? 'unknown')}`}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="flex-shrink-0">
                {getLocationIcon(location.status ?? 'unknown')}
              </div>
              
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-text-light font-medium truncate">
                    {location.name}
                  </span>
                  {location.unlock_order && (
                    <span className="text-xs bg-primary/30 text-text-muted px-1.5 py-0.5 rounded-full flex-shrink-0">
                      #{location.unlock_order}
                    </span>
                  )}
                </div>
                
                {location.map_description && (
                  <p className="text-xs text-text-muted mt-1 truncate">
                    {location.map_description}
                  </p>
                )}
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="flex-shrink-0 ml-2">
              <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(location.status ?? 'unknown')}`}>
                {getStatusText(location.status ?? 'unknown')}
              </span>
            </div>

            {/* Available Location Indicator */}
            {location.status === 'available' && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gold rounded-full animate-ping"></div>
            )}
          </motion.button>
        ))}
        
        {/* Empty State */}
        {floorLocations.length === 0 && (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
            <p className="text-text-muted text-sm mb-2">
              Belum ada lokasi treasure hunt
            </p>
            <p className="text-text-muted text-xs">
              di lantai {selectedFloor}
            </p>
          </div>
        )}
      </div>

      {/* Floor Summary */}
      {floorLocations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gold/20">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-success rounded-full"></div>
                <span className="text-text-muted">
                  {floorLocations.filter(l => l.status === 'completed').length} selesai
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-gold rounded-full animate-pulse"></div>
                <span className="text-text-muted">
                  {floorLocations.filter(l => l.status === 'available').length} tersedia
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-text-muted rounded-full"></div>
                <span className="text-text-muted">
                  {floorLocations.filter(l => l.status === 'locked').length} terkunci
                </span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-2 w-full bg-primary/30 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-gold to-green-success"
              initial={{ width: 0 }}
              animate={{ 
                width: `${floorLocations.length > 0 ? 
                  Math.round((floorLocations.filter(l => l.status === 'completed').length / floorLocations.length) * 100) : 0
                }%` 
              }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="mt-3 p-2 bg-primary/20 rounded-lg">
        <div className="flex items-start space-x-2">
          <Trophy className="w-3 h-3 text-gold mt-0.5 flex-shrink-0" />
          <div className="text-xs text-text-muted">
            <span className="font-medium text-gold">Tips:</span> Tap lokasi berwarna emas untuk memulai treasure hunt!
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniMap;