'use client';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { mapCenterForCountry } from '@/data/countries';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMarketplaceCountry } from '@/hooks/useCountry';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { Map as MapIcon, MapPin } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Google Maps types are loosely typed (loaded dynamically), so a local alias
// keeps the file readable.
type AnyMaps = any;

interface AutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting: { main_text: string; secondary_text: string };
}

interface LocationPickerProps {
  value: string;
  onChange: (
    address: string,
    coordinates?: { lat: number; lng: number },
  ) => void;
  placeholder?: string;
}

declare global {
  interface Window {
    google?: { maps: AnyMaps };
  }
}

// Inline address field: type to get a dropdown of address suggestions
// (default), or expand a map below to drop/drag a pin when the address isn't
// in Google's data. Free text is always accepted. No modal.
export default function LocationPicker({
  value,
  onChange,
  placeholder,
}: LocationPickerProps) {
  const { t } = useLanguage();
  const country = useMarketplaceCountry();
  const marketCenter = mapCenterForCountry(country);
  // Share the single app-wide Google Maps loader (loading it twice breaks the
  // SDK, which silently killed predictions before).
  const { isLoaded } = useGoogleMaps();

  const [input, setInput] = useState(value);
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const boxRef = useRef<HTMLDivElement>(null);
  const acRef = useRef<AnyMaps>(null);
  const psRef = useRef<AnyMaps>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<AnyMaps>(null);
  const markerRef = useRef<AnyMaps>(null);
  const inputRef = useRef(input);
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  // Spin up the autocomplete + places services once the SDK is ready.
  useEffect(() => {
    if (isLoaded && window.google?.maps && !acRef.current) {
      acRef.current = new window.google.maps.places.AutocompleteService();
      psRef.current = new window.google.maps.places.PlacesService(
        document.createElement('div'),
      );
    }
  }, [isLoaded]);

  // Keep the field in sync if the parent value changes externally.
  useEffect(() => setInput(value), [value]);

  // Close the dropdown on an outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const search = useCallback(
    (q: string) => {
      if (!acRef.current || q.trim().length < 2) {
        setPredictions([]);
        return;
      }
      setLoading(true);
      // `types: ['address']` keeps the (max 5) Google predictions focused on
      // street addresses rather than businesses/landmarks.
      acRef.current.getPlacePredictions(
        {
          input: q,
          types: ['address'],
          componentRestrictions: { country: country.toLowerCase() },
        },
        (res: AutocompletePrediction[] | null, status: string) => {
          setLoading(false);
          setPredictions(status === 'OK' && res ? res : []);
        },
      );
    },
    [country],
  );

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInput(v);
    setOpen(true);
    onChange(v); // free text stays in sync; coords arrive on pick / map pin
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(v), 300);
  };

  const pick = (p: AutocompletePrediction) => {
    setInput(p.description);
    setPredictions([]);
    setOpen(false);
    psRef.current?.getDetails(
      { placeId: p.place_id, fields: ['geometry', 'formatted_address'] },
      (place: AnyMaps, status: string) => {
        const addr =
          status === 'OK' && place?.formatted_address
            ? place.formatted_address
            : p.description;
        const loc = place?.geometry?.location;
        const c = loc ? { lat: loc.lat(), lng: loc.lng() } : undefined;
        setInput(addr);
        if (c) setCoords(c);
        onChange(addr, c);
      },
    );
  };

  // Build the inline map once it's expanded. Click / drag drops the pin and
  // reverse-geocodes to fill the address.
  useEffect(() => {
    if (
      !showMap ||
      !isLoaded ||
      !window.google?.maps ||
      !mapRef.current ||
      mapInstanceRef.current
    ) {
      return;
    }
    const gmaps = window.google.maps;
    const center = coords || { lat: marketCenter.lat, lng: marketCenter.lng };
    const map = new gmaps.Map(mapRef.current, {
      center,
      zoom: coords ? 16 : marketCenter.zoom,
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    });
    const marker = new gmaps.Marker({ map, draggable: true, position: center });
    const geocoder = new gmaps.Geocoder();
    mapInstanceRef.current = map;
    markerRef.current = marker;

    const apply = (c: { lat: number; lng: number }) => {
      setCoords(c);
      geocoder.geocode({ location: c }, (results: AnyMaps, status: string) => {
        if (status === 'OK' && results?.[0]) {
          const addr = results[0].formatted_address as string;
          setInput(addr);
          onChange(addr, c);
        } else {
          onChange(inputRef.current, c);
        }
      });
    };

    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      if (pos) apply({ lat: pos.lat(), lng: pos.lng() });
    });
    map.addListener('click', (e: AnyMaps) => {
      if (e.latLng) {
        const c = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        marker.setPosition(c);
        apply(c);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMap, isLoaded]);

  // Recenter map + marker when a place is picked from the autocomplete.
  useEffect(() => {
    if (mapInstanceRef.current && coords) {
      mapInstanceRef.current.setCenter(coords);
      mapInstanceRef.current.setZoom(16);
      markerRef.current?.setPosition(coords);
    }
  }, [coords]);

  const toggleMap = () => {
    setShowMap((v) => {
      if (v) {
        // Tearing down the map div; drop refs so it re-inits next time.
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
      return !v;
    });
  };

  return (
    <div ref={boxRef}>
      <div className="relative">
        <Input
          value={input}
          onChange={onInput}
          onFocus={() => predictions.length > 0 && setOpen(true)}
          placeholder={placeholder ?? t('projects.locationPlaceholder')}
          leftIcon={<MapPin className="h-4 w-4" />}
          autoComplete="off"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <LoadingSpinner size="sm" color="var(--hm-brand-500)" />
          </div>
        )}
        {open && predictions.length > 0 && (
          <div className="absolute left-0 top-full z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-[var(--hm-border)] bg-[var(--hm-bg-elevated)] shadow-lg">
            {predictions.map((p) => (
              <button
                key={p.place_id}
                type="button"
                onClick={() => pick(p)}
                className="flex w-full items-start gap-2.5 border-b border-[var(--hm-border-subtle)] px-3.5 py-2.5 text-left transition-colors last:border-b-0 hover:bg-[var(--hm-bg-tertiary)]"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--hm-fg-muted)]" />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] text-[var(--hm-fg-primary)]">
                    {p.structured_formatting.main_text}
                  </span>
                  <span className="block truncate text-[12px] text-[var(--hm-fg-muted)]">
                    {p.structured_formatting.secondary_text}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pin-on-map fallback - inline, opt-in. */}
      <button
        type="button"
        onClick={toggleMap}
        className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--hm-brand-500)] transition-opacity hover:opacity-80"
      >
        <MapIcon className="h-3.5 w-3.5" />
        {showMap ? t('common.hideMap') : t('common.pinOnMap')}
      </button>
      {showMap && (
        <div className="mt-2 overflow-hidden rounded-xl border border-[var(--hm-border)]">
          {isLoaded ? (
            <div ref={mapRef} className="h-56 w-full bg-[var(--hm-bg-tertiary)]" />
          ) : (
            <div className="flex h-56 w-full items-center justify-center bg-[var(--hm-bg-tertiary)]">
              <LoadingSpinner size="md" color="var(--hm-brand-500)" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
