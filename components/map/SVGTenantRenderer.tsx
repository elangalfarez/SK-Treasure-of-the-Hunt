// components/map/SVGTenantRenderer.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface TenantLocation {
  id: string
  unit_number: string
  svg_path_data: string
  center_coordinates: string
  fill_color: string
  stroke_color: string
  is_anchor_tenant: boolean
  tenant_id: string
  tenants?: {
    brand_name: string
    name: string
    description: string
  }
}

interface SVGTenantRendererProps {
  floorId: string
  className?: string
}

export default function SVGTenantRenderer({ floorId, className = "" }: SVGTenantRendererProps) {
  const [tenants, setTenants] = useState<TenantLocation[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch tenant locations when floorId changes
  useEffect(() => {
    fetchTenantLocations()
  }, [floorId])

  const fetchTenantLocations = async () => {
    try {
      setLoading(true)
      console.log(`🏢 Fetching tenants for floor: ${floorId}`)

      // Join tenant_locations with tenants table to get brand names
      const { data, error } = await supabase
        .from('tenant_locations')
        .select(`
          id, 
          unit_number, 
          svg_path_data, 
          center_coordinates, 
          fill_color, 
          stroke_color, 
          is_anchor_tenant,
          tenant_id,
          tenants (
            brand_name,
            name,
            description
          )
        `)
        .eq('floor_id', floorId)
        .eq('is_active', true)
        .not('svg_path_data', 'is', null)

      if (error) {
        console.error('Error fetching tenants:', error)
        setTenants([])
        return
      }

      // Filter out empty SVG data and map tenants property to single object
      const validTenants = (data?.filter(t => 
        t.svg_path_data && t.svg_path_data.trim() !== ''
      ) || []).map(t => ({
        ...t,
        tenants: Array.isArray(t.tenants) ? t.tenants[0] : t.tenants
      }))

      //console.log(`✅ Found ${validTenants.length} tenants with SVG data`)
      //console.log(`🏆 Found ${validTenants.filter(t => t.is_anchor_tenant).length} anchor tenants`)

      // Log anchor tenant details for debugging
      const anchors = validTenants.filter(t => t.is_anchor_tenant)
      anchors.forEach(anchor => {
      //  console.log(`🏪 Anchor: ${anchor.unit_number} → "${anchor.tenants?.brand_name || 'No brand name'}"`)
      })

      setTenants(validTenants)

    } catch (error) {
      console.error('Exception fetching tenants:', error)
      setTenants([])
    } finally {
      setLoading(false)
    }
  }

  // Parse center coordinates from JSON string
  const parseCoordinates = (coordStr: string): {x: number, y: number} => {
    try {
      return JSON.parse(coordStr)
    } catch {
      return { x: 0, y: 0 }
    }
  }

  // Get display name for the tenant
  const getDisplayName = (tenant: TenantLocation): string => {
    // Use brand_name from the joined tenants table
    return tenant.tenants?.brand_name || tenant.unit_number
  }

  if (loading) {
    return (
      <g>
        <text x="250" y="150" textAnchor="middle" fill="#D4AF37" fontSize="14">
          Loading tenant data...
        </text>
      </g>
    )
  }

  return (
    <g className={className}>
      {/* Render all tenant SVG paths */}
      {tenants.map((tenant) => (
        <g key={tenant.id}>
          {/* Tenant boundary - enhanced for anchor tenants */}
          <path
            d={tenant.svg_path_data}
            fill={tenant.fill_color || '#374151'}
            stroke={tenant.is_anchor_tenant ? '#D4AF37' : (tenant.stroke_color || '#666')}
            strokeWidth={tenant.is_anchor_tenant ? '2' : '1'}
            opacity={tenant.is_anchor_tenant ? '0.9' : '0.8'}
            className="hover:opacity-100 transition-opacity"
          />
          
          {/* Anchor tenant labels only */}
          {tenant.is_anchor_tenant && tenant.center_coordinates && (
            <g>
              {(() => {
                const displayName = getDisplayName(tenant)
                const coords = parseCoordinates(tenant.center_coordinates)
                const labelWidth = displayName.length * 6
                
                return (
                  <>
                    {/* Label background for better readability */}
                    <rect
                      x={coords.x - (labelWidth / 2)}
                      y={coords.y - 8}
                      width={labelWidth}
                      height={12}
                      fill="#1E293B"
                      stroke="#D4AF37"
                      strokeWidth="0.5"
                      opacity="0.9"
                      rx="2"
                    />
                    
                    {/* Anchor tenant brand name */}
                    <text
                      x={coords.x}
                      y={coords.y}
                      textAnchor="middle"
                      fontSize="8"
                      fill="#D4AF37"
                      fontWeight="bold"
                      className="pointer-events-none select-none"
                    >
                      {displayName}
                    </text>
                    
                    {/* Small anchor icon indicator */}
                    <circle
                      cx={coords.x - (labelWidth / 2) - 5}
                      cy={coords.y - 2}
                      r="2"
                      fill="#D4AF37"
                      className="anchor-indicator"
                    />
                  </>
                )
              })()}
            </g>
          )}
        </g>
      ))}
      
    </g>
  )
}