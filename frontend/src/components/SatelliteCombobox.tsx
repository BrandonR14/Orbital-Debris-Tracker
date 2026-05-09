'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SATELLITES, SatOption } from '@/lib/satellites';
import { Search, ChevronDown } from 'lucide-react';

interface Props {
  label: string;
  placeholder?: string;
  value: string;           // NORAD ID string
  onChange: (noradId: string) => void;
}

function filterSats(query: string): SatOption[] {
  if (!query) return SATELLITES.slice(0, 20);
  const q = query.toLowerCase();
  return SATELLITES.filter(
    s => s.name.toLowerCase().includes(q) || s.norad_id.includes(q)
  ).slice(0, 30);
}

export default function SatelliteCombobox({ label, placeholder, value, onChange }: Props) {
  const selectedSat = SATELLITES.find(s => s.norad_id === value) ?? null;

  const [query, setQuery] = useState(selectedSat?.name ?? value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = filterSats(query);

  // Sync display when value changes externally
  useEffect(() => {
    const sat = SATELLITES.find(s => s.norad_id === value);
    setQuery(sat ? sat.name : value);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const select = useCallback((sat: SatOption) => {
    setQuery(sat.name);
    onChange(sat.norad_id);
    setOpen(false);
    setHighlighted(0);
  }, [onChange]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setHighlighted(0);
    setOpen(true);

    // If user types a pure number treat it as a direct NORAD ID
    if (/^\d+$/.test(val.trim())) {
      onChange(val.trim());
    } else {
      onChange('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) { if (e.key === 'ArrowDown' || e.key === 'Enter') setOpen(true); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[highlighted]) select(results[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  // Group results by category for display
  const grouped: Record<string, SatOption[]> = {};
  results.forEach(s => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });

  return (
    <div ref={containerRef} className="relative space-y-2">
      <label className="block text-sm font-medium text-yellow-400">{label}</label>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          className="w-full pl-9 pr-8 py-3 bg-black/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
          placeholder={placeholder ?? 'Search satellite name or NORAD ID…'}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => { setOpen(o => !o); inputRef.current?.focus(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400 transition-colors p-1"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Selected NORAD ID display */}
      {value && (
        <p className="text-xs text-yellow-400/70 font-mono pl-1">
          NORAD ID: {value}
          {selectedSat && <span className="text-gray-500 ml-2">· {selectedSat.category}</span>}
        </p>
      )}

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-yellow-500/30 rounded-lg shadow-2xl max-h-64 overflow-y-auto">
          {Object.entries(grouped).map(([category, sats]) => (
            <div key={category}>
              <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-900">
                {category}
              </p>
              {sats.map(sat => {
                const isHighlighted = results.indexOf(sat) === highlighted;
                return (
                  <button
                    key={sat.norad_id}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); select(sat); }}
                    onMouseEnter={() => setHighlighted(results.indexOf(sat))}
                    className={`w-full text-left px-4 py-2 flex items-center justify-between transition-colors ${
                      isHighlighted ? 'bg-yellow-500/10 text-white' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="text-sm truncate pr-4">{sat.name}</span>
                    <span className="text-xs font-mono text-yellow-400 shrink-0">{sat.norad_id}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {open && query && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-yellow-500/30 rounded-lg shadow-2xl p-4 text-center">
          <p className="text-gray-400 text-sm">No satellites found.</p>
          {/^\d+$/.test(query.trim()) && (
            <p className="text-gray-500 text-xs mt-1">Using NORAD ID {query.trim()} directly.</p>
          )}
        </div>
      )}
    </div>
  );
}
