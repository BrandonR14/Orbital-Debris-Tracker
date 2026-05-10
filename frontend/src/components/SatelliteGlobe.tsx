'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Globe from 'react-globe.gl';
import type { SatRec } from 'satellite.js';
import { authenticatedFetch } from '@/utils/auth';

interface TLERecord {
  norad_id: string;
  name: string;
  tle_line1: string;
  tle_line2: string;
}

interface SatPoint {
  lat: number;
  lng: number;
  alt: number;
  name: string;
  color: string;
  norad_id: string;
}

interface ArcPoint {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
}

const PALETTE = [
  '#FFD700', '#00D4FF', '#FF6B9D',
  '#6EFF9A', '#FF8C42', '#C084FC',
];

const TLE_REFRESH_MS = 30 * 60 * 1000;
const POSITION_REFRESH_MS = 5000;
const TRAIL_STEPS = 20;
const TRAIL_MINUTES = 10;

export default function SatelliteGlobe() {
  // react-globe.gl doesn't export its imperative instance type; any is correct here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globeRef = useRef<any>(null);
  const satrecsRef = useRef<Map<string, SatRec>>(new Map());
  const tleDataRef = useRef<TLERecord[]>([]);
  // satellite.js has no exported namespace type; typed as unknown and cast at call sites
  const satLibRef = useRef<unknown>(null);

  const [points, setPoints] = useState<SatPoint[]>([]);
  const [arcs, setArcs] = useState<ArcPoint[]>([]);
  const [legend, setLegend] = useState<{ name: string; color: string }[]>([]);
  const [status, setStatus] = useState<'loading' | 'empty' | 'ready' | 'error'>('loading');
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
  const containerRef = useRef<HTMLDivElement>(null);

  function propagate(satrec: SatRec, sat: typeof import('satellite.js'), date: Date) {
    try {
      const pv = sat.propagate(satrec, date);
      if (!pv?.position) return null;
      const gmst = sat.gstime(date);
      const geo = sat.eciToGeodetic(pv.position, gmst);
      return {
        lat: sat.degreesLat(geo.latitude),
        lng: sat.degreesLong(geo.longitude),
        alt: geo.height,
      };
    } catch {
      return null;
    }
  }

  const computePositions = useCallback(() => {
    const sat = satLibRef.current as typeof import('satellite.js') | null;
    if (!sat || satrecsRef.current.size === 0) return;

    const now = new Date();
    const newPoints: SatPoint[] = [];
    const newArcs: ArcPoint[] = [];

    satrecsRef.current.forEach((satrec, norad_id) => {
      const idx = tleDataRef.current.findIndex(t => t.norad_id === norad_id);
      const record = tleDataRef.current[idx];
      if (!record) return;
      const color = PALETTE[idx % PALETTE.length];

      const current = propagate(satrec, sat, now);
      if (!current) return;

      newPoints.push({ ...current, name: record.name, color, norad_id });

      const stepMs = (TRAIL_MINUTES * 60 * 1000) / TRAIL_STEPS;
      let prev = current;
      for (let i = 1; i <= TRAIL_STEPS; i++) {
        const t = new Date(now.getTime() + i * stepMs);
        const next = propagate(satrec, sat, t);
        if (!next) break;
        newArcs.push({
          startLat: prev.lat,
          startLng: prev.lng,
          endLat: next.lat,
          endLng: next.lng,
          color,
        });
        prev = next;
      }
    });

    setPoints(newPoints);
    setArcs(newArcs);
  }, []);

  const loadTLEs = useCallback(async () => {
    const sat = satLibRef.current as typeof import('satellite.js') | null;
    if (!sat) { setStatus('error'); return; }

    try {
      const resp = await authenticatedFetch('http://127.0.0.1:8000/api/satellite-tle-data/');
      if (!resp.ok) { setStatus('error'); return; }
      const data: TLERecord[] = await resp.json();

      if (!Array.isArray(data) || data.length === 0) {
        setStatus('empty');
        return;
      }

      tleDataRef.current = data;
      const newSatrecs = new Map<string, any>();
      const newLegend: { name: string; color: string }[] = [];

      data.forEach((record, idx) => {
        try {
          const satrec = sat.twoline2satrec(record.tle_line1, record.tle_line2);
          newSatrecs.set(record.norad_id, satrec);
          newLegend.push({ name: record.name, color: PALETTE[idx % PALETTE.length] });
        } catch { /* skip bad TLE */ }
      });

      satrecsRef.current = newSatrecs;
      setLegend(newLegend);
      setStatus('ready');
      computePositions();
    } catch {
      setStatus('error');
    }
  }, [computePositions]);

  // Load satellite.js then immediately kick off TLE fetch + polling.
  // Must be one effect — if split, the second effect runs before the import
  // resolves and sees satLibRef.current === null, so loadTLEs is never called.
  useEffect(() => {
    let tlePoll: ReturnType<typeof setInterval>;
    let posPoll: ReturnType<typeof setInterval>;
    let cancelled = false;

    import('satellite.js')
      .then((mod) => {
        if (cancelled) return;
        satLibRef.current = mod;
        loadTLEs();
        tlePoll = setInterval(loadTLEs, TLE_REFRESH_MS);
        posPoll = setInterval(computePositions, POSITION_REFRESH_MS);
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      clearInterval(tlePoll);
      clearInterval(posPoll);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set auto-rotate once globe mounts
  useEffect(() => {
    if (!globeRef.current) return;
    const ctrl = globeRef.current.controls();
    if (ctrl) {
      ctrl.autoRotate = true;
      ctrl.autoRotateSpeed = 0.4;
    }
  });

  // Watch container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      setDimensions({ width: el.clientWidth || 500, height: el.clientHeight || 500 });
    });
    obs.observe(el);
    setDimensions({ width: el.clientWidth || 500, height: el.clientHeight || 500 });
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        atmosphereColor="#1e40af"
        atmosphereAltitude={0.15}
        // Points
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pointAltitude={(d: any) => Math.max(0.005, (d.alt || 0) / 6371)}
        pointColor="color"
        pointRadius={0.35}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pointLabel={(d: any) =>
          `<div style="background:rgba(0,0,0,0.85);padding:6px 10px;border-radius:6px;font-family:monospace;font-size:12px;color:#FFD700;border:1px solid rgba(255,215,0,0.3)">${d.name}<br/><span style="color:#aaa">NORAD ${d.norad_id}</span></div>`
        }
        // Arcs (trajectory trails)
        arcsData={arcs}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        arcColor={(d: any) => [`${d.color}00`, `${d.color}88`, `${d.color}cc`]}
        arcStroke={0.4}
        arcDashLength={0.4}
        arcDashGap={0.15}
        arcDashAnimateTime={3000}
        arcAltitudeAutoScale={0.02}
      />

      {/* State overlays */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-yellow-400 text-sm">Loading satellite data…</p>
        </div>
      )}
      {status === 'empty' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl text-center px-6">
          <p className="text-white font-medium mb-1">No satellites yet</p>
          <p className="text-gray-400 text-sm">Run a prediction to see live positions here.</p>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-xl text-center px-6">
          <p className="text-red-400 font-medium mb-1">Could not load TLE data</p>
          <p className="text-gray-400 text-sm">Check your Space-Track credentials or run the server.</p>
        </div>
      )}

      {/* Legend */}
      {legend.length > 0 && (
        <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-sm rounded-lg p-3 space-y-1 max-w-[200px]">
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Tracked Satellites</p>
          {legend.map(({ name, color }) => (
            <div key={name} className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-white text-xs truncate">{name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
