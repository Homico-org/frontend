'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace google.maps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  class Map { constructor(el: HTMLElement, opts: any); setCenter(c: any): void; setZoom(z: number): void; addListener(e: string, cb: any): void; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  class Marker { constructor(opts: any); setPosition(p: any): void; getPosition(): any; addListener(e: string, cb: any): void; }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  class Geocoder { geocode(req: any, cb: (results: any, status: string) => void): void; }
  interface MapMouseEvent { latLng?: { lat(): number; lng(): number; } }
  namespace places {
    interface AutocompletePrediction { place_id: string; description: string; structured_formatting: { main_text: string; secondary_text: string; } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    class AutocompleteService { getPlacePredictions(req: any, cb: (results: AutocompletePrediction[] | null, status: string) => void): void; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    class PlacesService { constructor(m: any); getDetails(req: any, cb: (place: any, status: string) => void): void; }
    const PlacesServiceStatus: { OK: string };
  }
}

interface LocationPickerProps {
  value: string;
  onChange: (address: string, coordinates?: { lat: number; lng: number }) => void;
  placeholder?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

export default function LocationPicker({ value, onChange, placeholder = 'Enter address' }: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not found');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Initialize map when opened
  useEffect(() => {
    if (!isOpen || !mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    const defaultCenter = { lat: 41.7151, lng: 44.8271 }; // Tbilisi default

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center: selectedCoords || defaultCenter,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
    });

    markerRef.current = new google.maps.Marker({
      map: mapInstanceRef.current,
      draggable: true,
      position: selectedCoords || defaultCenter,
    });

    autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    placesServiceRef.current = new google.maps.places.PlacesService(mapInstanceRef.current);

    // Handle marker drag
    markerRef.current.addListener('dragend', () => {
      const pos = markerRef.current?.getPosition();
      if (pos) {
        const coords = { lat: pos.lat(), lng: pos.lng() };
        setSelectedCoords(coords);
        // Reverse geocode
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: coords }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            setInputValue(results[0].formatted_address);
          }
        });
      }
    });

    // Handle map click
    mapInstanceRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        markerRef.current?.setPosition(coords);
        setSelectedCoords(coords);
        // Reverse geocode
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: coords }, (results, status) => {
          if (status === 'OK' && results?.[0]) {
            setInputValue(results[0].formatted_address);
          }
        });
      }
    });
  }, [isOpen, mapLoaded, selectedCoords]);

  // Search for predictions
  const searchPlaces = useCallback((query: string) => {
    if (!autocompleteServiceRef.current || query.length < 2) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    autocompleteServiceRef.current.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'ge' }, // Georgia
      },
      (results, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
        } else {
          setPredictions([]);
        }
      }
    );
  }, []);

  // Handle input change with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchPlaces(val);
    }, 300);
  };

  // Handle prediction selection
  const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    setInputValue(prediction.description);
    setPredictions([]);

    if (placesServiceRef.current) {
      placesServiceRef.current.getDetails(
        { placeId: prediction.place_id, fields: ['geometry', 'formatted_address'] },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            const coords = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            };
            setSelectedCoords(coords);
            mapInstanceRef.current?.setCenter(coords);
            mapInstanceRef.current?.setZoom(16);
            markerRef.current?.setPosition(coords);
            if (place.formatted_address) {
              setInputValue(place.formatted_address);
            }
          }
        }
      );
    }
  };

  // Confirm selection
  const handleConfirm = () => {
    onChange(inputValue, selectedCoords || undefined);
    setIsOpen(false);
  };

  // Update input when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <div className="relative">
      {/* Input trigger */}
      <div
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-3 border border-neutral-200 dark:border-dark-border rounded-xl focus:outline-none focus:border-neutral-400 dark:focus:border-primary-400 text-sm cursor-pointer flex items-center gap-3 hover:border-neutral-300 dark:hover:border-dark-border-subtle transition-all duration-200 ease-out bg-white dark:bg-dark-card"
      >
        <svg className="w-5 h-5 text-neutral-400 dark:text-neutral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className={value ? 'text-neutral-900 dark:text-neutral-50' : 'text-neutral-400 dark:text-neutral-500'}>
          {value || placeholder}
        </span>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={() => setIsOpen(false)}>
          <div
            className="bg-white dark:bg-dark-card w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-dark-border">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-50">Select Location</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-dark-bg rounded-lg transition-all duration-200 ease-out"
              >
                <svg className="w-5 h-5 text-neutral-500 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-neutral-100 dark:border-dark-border">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Search address..."
                  className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-dark-bg border border-neutral-200 dark:border-dark-border rounded-xl focus:outline-none focus:border-neutral-400 dark:focus:border-primary-400 text-sm text-neutral-900 dark:text-neutral-50 placeholder:text-neutral-400 dark:placeholder:text-neutral-500"
                  autoFocus
                />
                {isLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Predictions */}
              {predictions.length > 0 && (
                <div className="mt-2 border border-neutral-200 dark:border-dark-border rounded-xl overflow-hidden">
                  {predictions.map((prediction) => (
                    <button
                      key={prediction.place_id}
                      onClick={() => handleSelectPrediction(prediction)}
                      className="w-full px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-dark-bg border-b border-neutral-100 dark:border-dark-border last:border-b-0 transition-all duration-200 ease-out"
                    >
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-neutral-400 dark:text-neutral-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <div className="min-w-0">
                          <div className="text-sm text-neutral-900 dark:text-neutral-50 truncate">{prediction.structured_formatting.main_text}</div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{prediction.structured_formatting.secondary_text}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Map */}
            {mapLoaded ? (
              <div ref={mapRef} className="h-64 sm:h-80 bg-neutral-100 dark:bg-dark-bg" />
            ) : (
              <div className="h-64 sm:h-80 bg-neutral-100 dark:bg-dark-bg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-neutral-500">Loading map...</p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="p-4 border-t border-neutral-100 dark:border-dark-border">
              <button
                onClick={handleConfirm}
                disabled={!inputValue}
                className="w-full py-3 bg-neutral-900 dark:bg-primary-400 hover:bg-neutral-800 dark:hover:bg-primary-500 disabled:bg-neutral-200 dark:disabled:bg-dark-bg disabled:text-neutral-400 dark:disabled:text-neutral-600 text-white dark:text-neutral-50 font-medium rounded-xl transition-all duration-200 ease-out"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
