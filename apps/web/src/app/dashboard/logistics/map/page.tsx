'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import api from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DriverLocation {
  id: string;
  firstName: string;
  lastName: string;
  lat: number;
  lng: number;
  locationUpdatedAt: string;
  branch: { name: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function secondsAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
}

function freshnessColor(iso: string): string {
  const s = secondsAgo(iso);
  if (s < 30) return '#01ae42';   // green  — just updated
  if (s < 90) return '#f59e0b';   // amber  — slightly stale
  return '#ef4444';                // red    — old / offline
}

function freshnessLabel(iso: string): string {
  const s = secondsAgo(iso);
  if (s < 10) return 'Just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// Melbourne CBD centre
const MELBOURNE_CENTER: [number, number] = [144.9631, -37.8136];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DriverMapPage() {
  const { getToken, isLoaded } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());

  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [selected, setSelected] = useState<DriverLocation | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch driver locations ──────────────────────────────────────────────────
  const fetchLocations = useCallback(async () => {
    if (!isLoaded) return;
    try {
      const token = await getToken();
      const res = await api.get('/users/drivers/locations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDrivers(res.data);
      setLastRefresh(new Date());
    } catch {
      // Silent — map just keeps showing last known positions
    }
  }, [isLoaded, getToken]);

  // ── Load Mapbox GL JS dynamically ──────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!MAPBOX_TOKEN) {
      setError('Mapbox token not configured. Add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local');
      return;
    }

    // Inject Mapbox CSS
    if (!document.getElementById('mapbox-css')) {
      const link = document.createElement('link');
      link.id = 'mapbox-css';
      link.rel = 'stylesheet';
      link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css';
      document.head.appendChild(link);
    }

    // Load Mapbox GL JS script
    const loadMapbox = async () => {
      if (!(window as any).mapboxgl) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Mapbox GL JS'));
          document.head.appendChild(script);
        });
      }

      const mapboxgl = (window as any).mapboxgl;
      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: MELBOURNE_CENTER,
        zoom: 11,
      });

      map.on('load', () => {
        setMapLoaded(true);
      });

      mapRef.current = map;
    };

    loadMapbox().catch(err => setError(err.message));

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  // ── Update markers when drivers or map change ──────────────────────────────
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const mapboxgl = (window as any).mapboxgl;
    const map = mapRef.current;

    const currentIds = new Set(drivers.map(d => d.id));

    // Remove markers for drivers no longer online
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Add or update markers for each driver
    drivers.forEach(driver => {
      const color = freshnessColor(driver.locationUpdatedAt);

      if (markersRef.current.has(driver.id)) {
        // Update position and colour
        const existing = markersRef.current.get(driver.id);
        existing.setLngLat([driver.lng, driver.lat]);
        existing.getElement().querySelector('.driver-dot').style.background = color;
      } else {
        // Create new marker
        const el = document.createElement('div');
        el.style.cssText = 'cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px;';
        el.innerHTML = `
          <div class="driver-dot" style="
            width: 36px; height: 36px; border-radius: 50%;
            background: ${color}; border: 3px solid #fff;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            font-size: 16px;
          ">🚐</div>
          <div style="
            background: rgba(10,46,20,0.85); color: #fff;
            padding: 2px 6px; border-radius: 4px; font-size: 11px;
            font-weight: 600; white-space: nowrap; font-family: sans-serif;
          ">${driver.firstName} ${driver.lastName[0]}.</div>
        `;

        el.addEventListener('click', () => setSelected(driver));

        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([driver.lng, driver.lat])
          .addTo(map);

        markersRef.current.set(driver.id, marker);
      }
    });
  }, [drivers, mapLoaded]);

  // ── Poll every 15 seconds ──────────────────────────────────────────────────
  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 15_000);
    return () => clearInterval(interval);
  }, [fetchLocations]);

  // ── Fly to selected driver ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selected || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [selected.lng, selected.lat],
      zoom: 14,
      duration: 800,
    });
  }, [selected]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 16px 0', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#0a2e14', margin: 0 }}>Driver Map</h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
            Live positions — refreshes every 15s · Last updated {lastRefresh.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: drivers.length > 0 ? '#dcfce7' : '#f1f5f9',
            color: drivers.length > 0 ? '#16a34a' : '#94a3b8',
            padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 600,
          }}>
            {drivers.length} driver{drivers.length !== 1 ? 's' : ''} online
          </span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>

        {/* Driver sidebar */}
        <div style={{
          width: '260px', flexShrink: 0, background: '#fff',
          borderRadius: '12px', border: '1px solid #e2e8f0',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Drivers
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {drivers.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚐</div>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>No drivers online</p>
              </div>
            ) : (
              drivers.map(driver => {
                const isSelected = selected?.id === driver.id;
                const color = freshnessColor(driver.locationUpdatedAt);
                return (
                  <div
                    key={driver.id}
                    onClick={() => setSelected(isSelected ? null : driver)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f8fafc',
                      cursor: 'pointer',
                      background: isSelected ? '#f0fdf4' : '#fff',
                      borderLeft: isSelected ? '3px solid #01ae42' : '3px solid transparent',
                      transition: 'all 0.1s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = '#fff'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: color + '20', border: `2px solid ${color}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', flexShrink: 0,
                      }}>🚐</div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0a2e14' }}>
                          {driver.firstName} {driver.lastName}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                          {driver.branch?.name || 'No branch'} · {freshnessLabel(driver.locationUpdatedAt)}
                        </p>
                      </div>
                      <div style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: color, flexShrink: 0, marginLeft: 'auto',
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Map */}
        <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>
          {error ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#f8fafc', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '32px' }}>⚠️</div>
              <p style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', maxWidth: '400px', margin: 0 }}>{error}</p>
            </div>
          ) : (
            <>
              <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
              {!mapLoaded && (
                <div style={{ position: 'absolute', inset: 0, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>Loading map...</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

