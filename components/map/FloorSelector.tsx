// components/map/FloorSelector.tsx - ENHANCED VERSION WITH REAL DATA
import React from 'react';
import { motion } from 'framer-motion';
import { Location } from '@/lib/supabase';

interface FloorSelectorProps {
  selectedFloor: 'GF' | 'UG' | 'FF';
  onFloorChange: (floor: 'GF' | 'UG' | 'FF') => void;
  locations: Location[];
  loading?: boolean;
}

const FloorSelector: React.FC<FloorSelectorProps> = ({ 
  selectedFloor, 
  onFloorChange, 
  locations,
  loading = false
}) => {
  // Calculate location counts per floor with status breakdown
  const floorStats = React.useMemo(() => {
    const stats = {
      'GF': { total: 0, completed: 0, available: 0, locked: 0 },
      'UG': { total: 0, completed: 0, available: 0, locked: 0 },
      'FF': { total: 0, completed: 0, available: 0, locked: 0 }
    };

    locations.forEach(location => {
      const floor = location.floor as keyof typeof stats;
      if (stats[floor]) {
        stats[floor].total++;
        if (location.status === 'completed') stats[floor].completed++;
        else if (location.status === 'available') stats[floor].available++;
        else if (location.status === 'locked') stats[floor].locked++;
      }
    });

    return stats;
  }, [locations]);

  const floors = [
    { 
      id: 'GF' as const, 
      name: 'Ground Floor', 
      label: 'GF',
      description: 'Lantai Dasar'
    },
    { 
      id: 'UG' as const, 
      name: 'Upper Ground', 
      label: 'UG',
      description: 'Upper Ground'
    },
    { 
      id: 'FF' as const, 
      name: 'First Floor', 
      label: 'FF',
      description: 'Lantai Atas'
    }
  ];

  const getFloorProgress = (floorId: string) => {
    const stats = floorStats[floorId as keyof typeof floorStats];
    if (stats.total === 0) return 0;
    return Math.round((stats.completed / stats.total) * 100);
  };

  const getFloorStatusColor = (floorId: string) => {
    const stats = floorStats[floorId as keyof typeof floorStats];
    if (stats.completed === stats.total && stats.total > 0) return 'text-green-success';
    if (stats.available > 0) return 'text-gold';
    return 'text-text-muted';
  };

  if (loading) {
    return (
      <div className="flex bg-accent/50 backdrop-blur-lg border border-gold/20 rounded-xl p-1">
        {floors.map((floor) => (
          <div
            key={floor.id}
            className="flex-1 px-4 py-3 rounded-lg animate-pulse"
          >
            <div className="bg-text-muted/20 h-6 rounded mb-1"></div>
            <div className="bg-text-muted/20 h-4 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex bg-accent/50 backdrop-blur-lg border border-gold/20 rounded-xl p-1">
      {floors.map((floor) => {
        const stats = floorStats[floor.id];
        const isSelected = selectedFloor === floor.id;
        const hasLocations = stats.total > 0;
        
        return (
          <button
            key={floor.id}
            onClick={() => onFloorChange(floor.id)}
            disabled={!hasLocations}
            className={`relative flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              isSelected
                ? 'text-primary'
                : hasLocations 
                ? 'text-text-light hover:text-gold'
                : 'text-text-muted'
            }`}
          >
            {isSelected && (
              <motion.div
                layoutId="activeFloor"
                className="absolute inset-0 bg-gradient-to-r from-gold to-yellow-400 rounded-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            
            <div className="relative z-10 text-center">
              {/* Floor Label */}
              <div className="font-bold text-lg">{floor.label}</div>
              
              {/* Floor Name */}
              <div className="text-xs opacity-80 mb-1">{floor.description}</div>
              
              {/* Location Count and Progress */}
              {hasLocations ? (
                <>
                  <div className={`text-xs ${
                    isSelected ? 'text-primary/70' : getFloorStatusColor(floor.id)
                  }`}>
                    {stats.total} lokasi
                  </div>
                  
                  {/* Progress Indicator */}
                  <div className="mt-1 flex justify-center">
                    <div className="w-8 h-1 bg-primary/30 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${
                          stats.completed === stats.total && stats.total > 0 
                            ? 'bg-green-success' 
                            : 'bg-gold'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${getFloorProgress(floor.id)}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                  </div>
                  
                  {/* Status Dots */}
                  <div className="flex justify-center space-x-1 mt-1">
                    {stats.completed > 0 && (
                      <div className="w-1 h-1 bg-green-success rounded-full"></div>
                    )}
                    {stats.available > 0 && (
                      <div className="w-1 h-1 bg-gold rounded-full animate-pulse"></div>
                    )}
                    {stats.locked > 0 && (
                      <div className="w-1 h-1 bg-text-muted rounded-full"></div>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-xs text-text-muted">Kosong</div>
              )}
            </div>

            {/* Hover Effect */}
            {!isSelected && hasLocations && (
              <motion.div
                className="absolute inset-0 bg-gold/5 rounded-lg opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default FloorSelector;