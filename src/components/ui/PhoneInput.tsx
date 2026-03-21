'use client';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

// ── Country list ───────────────────────────────────────────────────────────────
export interface Country {
  flag: string;
  code: string;   // e.g. "+91"
  name: string;
  iso2: string;   // ISO 3166-1 alpha-2
  maxLen: number; // typical subscriber number length
}

export const COUNTRIES: Country[] = [
  { flag: '🇮🇳', code: '+91',  name: 'India',          iso2: 'IN', maxLen: 10 },
  { flag: '🇺🇸', code: '+1',   name: 'United States',  iso2: 'US', maxLen: 10 },
  { flag: '🇬🇧', code: '+44',  name: 'United Kingdom', iso2: 'GB', maxLen: 10 },
  { flag: '🇦🇪', code: '+971', name: 'UAE',             iso2: 'AE', maxLen: 9  },
  { flag: '🇸🇦', code: '+966', name: 'Saudi Arabia',   iso2: 'SA', maxLen: 9  },
  { flag: '🇸🇬', code: '+65',  name: 'Singapore',      iso2: 'SG', maxLen: 8  },
  { flag: '🇦🇺', code: '+61',  name: 'Australia',      iso2: 'AU', maxLen: 9  },
  { flag: '🇨🇦', code: '+1',   name: 'Canada',         iso2: 'CA', maxLen: 10 },
  { flag: '🇩🇪', code: '+49',  name: 'Germany',        iso2: 'DE', maxLen: 11 },
  { flag: '🇫🇷', code: '+33',  name: 'France',         iso2: 'FR', maxLen: 9  },
  { flag: '🇯🇵', code: '+81',  name: 'Japan',          iso2: 'JP', maxLen: 10 },
  { flag: '🇨🇳', code: '+86',  name: 'China',          iso2: 'CN', maxLen: 11 },
  { flag: '🇧🇩', code: '+880', name: 'Bangladesh',     iso2: 'BD', maxLen: 10 },
  { flag: '🇵🇰', code: '+92',  name: 'Pakistan',       iso2: 'PK', maxLen: 10 },
  { flag: '🇳🇵', code: '+977', name: 'Nepal',          iso2: 'NP', maxLen: 10 },
  { flag: '🇱🇰', code: '+94',  name: 'Sri Lanka',      iso2: 'LK', maxLen: 9  },
  { flag: '🇲🇾', code: '+60',  name: 'Malaysia',       iso2: 'MY', maxLen: 9  },
  { flag: '🇵🇭', code: '+63',  name: 'Philippines',    iso2: 'PH', maxLen: 10 },
  { flag: '🇿🇦', code: '+27',  name: 'South Africa',   iso2: 'ZA', maxLen: 9  },
  { flag: '🇳🇬', code: '+234', name: 'Nigeria',        iso2: 'NG', maxLen: 10 },
  { flag: '🇧🇷', code: '+55',  name: 'Brazil',         iso2: 'BR', maxLen: 11 },
  { flag: '🇲🇽', code: '+52',  name: 'Mexico',         iso2: 'MX', maxLen: 10 },
  { flag: '🇷🇺', code: '+7',   name: 'Russia',         iso2: 'RU', maxLen: 10 },
  { flag: '🇮🇩', code: '+62',  name: 'Indonesia',      iso2: 'ID', maxLen: 11 },
  { flag: '🇰🇷', code: '+82',  name: 'South Korea',    iso2: 'KR', maxLen: 10 },
];

interface Props {
  value: string;           // raw digits only (no country code)
  onChange: (digits: string) => void;
  selectedCountry?: Country;
  onCountryChange?: (country: Country) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  selectedCountry,
  onCountryChange,
  placeholder,
  className = '',
  error = false,
}: Props) {
  const [country, setCountry]     = useState<Country>(selectedCountry ?? COUNTRIES[0]);
  const [open, setOpen]           = useState(false);
  const [search, setSearch]       = useState('');
  const wrapRef                   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search) ||
        c.iso2.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  const selectCountry = (c: Country) => {
    setCountry(c);
    onCountryChange?.(c);
    setOpen(false);
    setSearch('');
  };

  const ph = placeholder ?? `${'0'.repeat(country.maxLen)}`;

  return (
    <div ref={wrapRef} className="relative">
      <div
        className={`flex items-stretch rounded-lg border ${
          error ? 'border-red-400' : 'border-gray-200'
        } bg-white overflow-visible focus-within:ring-2 focus-within:ring-crimson-300 focus-within:border-crimson-400 transition-all ${className}`}
      >
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => { setOpen(o => !o); setSearch(''); }}
          className="flex items-center gap-1.5 px-2.5 bg-gray-50 border-r border-gray-200 hover:bg-gray-100 transition-colors flex-shrink-0 rounded-l-lg focus:outline-none"
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="text-xs font-semibold text-gray-600 tabular-nums">{country.code}</span>
          <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {/* Digit input */}
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={country.maxLen}
          className="flex-1 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 bg-white outline-none min-w-0 rounded-r-lg"
          placeholder={ph}
          value={value}
          onChange={e => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, country.maxLen);
            onChange(digits);
          }}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-[999] top-full mt-1 left-0 w-72 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-fade-in">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              className="flex-1 text-sm outline-none placeholder-gray-400 bg-transparent"
              placeholder="Search country…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map(c => (
              <button
                key={`${c.iso2}-${c.code}`}
                type="button"
                onClick={() => selectCountry(c)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors text-left ${
                  c.iso2 === country.iso2 && c.code === country.code ? 'bg-crimson-50 text-crimson-700 font-semibold' : 'text-gray-700'
                }`}
              >
                <span className="text-base w-6 text-center leading-none flex-shrink-0">{c.flag}</span>
                <span className="flex-1 truncate">{c.name}</span>
                <span className="text-xs text-gray-400 tabular-nums flex-shrink-0">{c.code}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-xs text-gray-400 text-center">No countries found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Returns the full E.164-style phone string for backend.
 * e.g. country "+91", digits "9876543210" → "+919876543210"
 */
export function toFullPhone(countryCode: string, digits: string): string {
  if (!digits) return '';
  return `${countryCode}${digits}`;
}