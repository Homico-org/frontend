'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Search, Maximize2, Minimize2, X, Navigation } from 'lucide-react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface AddressPickerProps {
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lng: number }) => void;
  locale?: 'ka' | 'en';
  className?: string;
  label?: string;
  required?: boolean;
}

interface Coordinates {
  lat: number;
  lng: number;
}

// Default center (Tbilisi)
const DEFAULT_CENTER: Coordinates = { lat: 41.7151, lng: 44.8271 };

// Elegant map styles - light
const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#f8f9fa' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#f3f4f6' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e8f5e9' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#f3f4f6' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#d1d5db' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

// Elegant map styles - softer dark mode
const MAP_STYLES_DARK = [
  { elementType: 'geometry', stylers: [{ color: '#28282c' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8e8e98' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#28282c' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#3c3c40' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#323236' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#2a3d2a' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#3c3c40' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#323236' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#46464a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#1a2938' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
];

export default function AddressPicker({
  value,
  onChange,
  locale = 'ka',
  className = '',
  label,
  required = false
}: AddressPickerProps) {
  const { isLoaded: mapLoaded } = useGoogleMaps();
  const [selectedAddress, setSelectedAddress] = useState(value);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenMapRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect dark mode
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkDarkMode = () => {
        setIsDarkMode(document.documentElement.classList.contains('dark'));
      };
      checkDarkMode();
      const observer = new MutationObserver(checkDarkMode);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }
  }, []);

  // Handle body scroll lock for fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  // Initialize map
  const initMap = useCallback((container: HTMLDivElement) => {
    if (!mapLoaded || !container) return;

    const google = (window as any).google;
    const center = coordinates || DEFAULT_CENTER;

    // Clean up existing map
    if (mapRef.current) {
      google.maps.event.clearInstanceListeners(mapRef.current);
    }

    mapRef.current = new google.maps.Map(container, {
      center,
      zoom: coordinates ? 16 : 12,
      styles: isDarkMode ? MAP_STYLES_DARK : MAP_STYLES,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER,
      },
      gestureHandling: 'greedy',
      clickableIcons: false,
    });

    // Custom marker with animation
    markerRef.current = new google.maps.Marker({
      position: center,
      map: mapRef.current,
      draggable: true,
      animation: google.maps.Animation.DROP,
      icon: {
        path: 'M12 0C7.58 0 4 3.58 4 8c0 5.25 8 13 8 13s8-7.75 8-13c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z',
        fillColor: '#E07B4F',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2.5,
        scale: 2.2,
        anchor: new google.maps.Point(12, 21),
      },
    });

    geocoderRef.current = new google.maps.Geocoder();
    autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    placesServiceRef.current = new google.maps.places.PlacesService(mapRef.current);

    // Click on map
    mapRef.current.addListener('click', (e: any) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      markerRef.current.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => markerRef.current.setAnimation(null), 700);
      updateLocation({ lat, lng });
    });

    // Drag marker
    markerRef.current.addListener('dragend', () => {
      const position = markerRef.current.getPosition();
      updateLocation({ lat: position.lat(), lng: position.lng() });
    });

    // If we have coordinates, update marker position
    if (coordinates) {
      markerRef.current.setPosition(coordinates);
    }
  }, [mapLoaded, isDarkMode, coordinates]);

  // Initialize map when loaded
  useEffect(() => {
    if (mapLoaded && mapContainerRef.current && !isFullscreen) {
      initMap(mapContainerRef.current);
    }
  }, [mapLoaded, initMap, isFullscreen]);

  // Initialize fullscreen map
  useEffect(() => {
    if (mapLoaded && fullscreenMapRef.current && isFullscreen) {
      initMap(fullscreenMapRef.current);
      // Focus search input in fullscreen
      setTimeout(() => searchInputRef.current?.focus(), 300);
    }
  }, [mapLoaded, isFullscreen, initMap]);

  // Update map styles on dark mode change
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      mapRef.current.setOptions({
        styles: isDarkMode ? MAP_STYLES_DARK : MAP_STYLES,
      });
    }
  }, [isDarkMode, mapLoaded]);

  // Sync with value prop
  useEffect(() => {
    setSelectedAddress(value);
  }, [value]);

  const updateLocation = useCallback((coords: Coordinates) => {
    setCoordinates(coords);

    if (markerRef.current) {
      markerRef.current.setPosition(coords);
    }
    if (mapRef.current) {
      mapRef.current.panTo(coords);
      mapRef.current.setZoom(16);
    }

    if (geocoderRef.current) {
      geocoderRef.current.geocode({ location: coords }, (results: any, status: any) => {
        if (status === 'OK' && results?.[0]) {
          const address = results[0].formatted_address;
          setSelectedAddress(address);
          onChange(address, coords);
        }
      });
    }
  }, [onChange]);

  // Search for address
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      const google = (window as any).google;

      // Initialize autocomplete service if not exists
      if (!autocompleteServiceRef.current && google?.maps?.places) {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      }

      if (autocompleteServiceRef.current) {
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: query,
            componentRestrictions: { country: 'ge' },
          },
          (predictions: any, status: any) => {
            setIsSearching(false);
            if (status === 'OK' && predictions) {
              setSearchResults(predictions.slice(0, 5));
              setShowSearchResults(true);
            } else {
              setSearchResults([]);
              setShowSearchResults(false);
            }
          }
        );
      } else {
        setIsSearching(false);
        console.warn('AutocompleteService not available');
      }
    }, 300);
  }, []);

  // Select search result
  const selectSearchResult = useCallback((placeId: string) => {
    const google = (window as any).google;

    // Initialize places service if not exists (needs a map or div element)
    if (!placesServiceRef.current && google?.maps?.places && mapRef.current) {
      placesServiceRef.current = new google.maps.places.PlacesService(mapRef.current);
    }

    if (!placesServiceRef.current) {
      console.warn('PlacesService not available');
      return;
    }

    placesServiceRef.current.getDetails(
      { placeId, fields: ['geometry', 'formatted_address'] },
      (place: any, status: any) => {
        if (status === 'OK' && place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          setSearchQuery('');
          setSearchResults([]);
          setShowSearchResults(false);

          updateLocation({ lat, lng });

          // Bounce animation
          if (markerRef.current) {
            markerRef.current.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => markerRef.current.setAnimation(null), 700);
          }
        }
      }
    );
  }, [updateLocation]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        updateLocation(coords);

        const google = (window as any).google;
        if (markerRef.current) {
          markerRef.current.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(() => markerRef.current.setAnimation(null), 700);
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
      },
      { enableHighAccuracy: true }
    );
  }, [updateLocation]);

  // Close fullscreen with escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {label} {required && <span className="text-[#C4735B]">*</span>}
          </label>
        )}

        {/* Map Container */}
        <div
          className={`rounded-2xl overflow-hidden relative group transition-all ${
            required && !selectedAddress
              ? 'ring-2 ring-[#C4735B]/30 ring-offset-2'
              : selectedAddress
                ? 'ring-2 ring-emerald-500/30 ring-offset-2'
                : ''
          }`}
          style={{
            height: '320px',
            border: required && !selectedAddress ? '2px solid #C4735B' : selectedAddress ? '2px solid rgb(16 185 129 / 0.3)' : '1px solid var(--color-border)',
            backgroundColor: isDarkMode ? '#28282c' : '#f8f9fa',
          }}
        >
          {mapLoaded ? (
            <>
              <div ref={mapContainerRef} className="w-full h-full" />

              {/* Search Bar Overlay */}
              <div className="absolute top-3 left-3 right-3 z-10">
                <div
                  className="relative"
                  style={{
                    filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))',
                  }}
                >
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    {isSearching ? (
                      <LoadingSpinner size="sm" color="#9ca3af" />
                    ) : (
                      <Search className="w-4 h-4 text-neutral-400" />
                    )}
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                    placeholder={locale === 'ka' ? 'მოძებნე მისამართი...' : 'Search address...'}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-white dark:bg-neutral-900 border-0 outline-none placeholder:text-neutral-400 text-neutral-900 dark:text-white"
                    style={{
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setShowSearchResults(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <X className="w-3.5 h-3.5 text-neutral-400" />
                    </button>
                  )}

                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div
                      className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden bg-white dark:bg-neutral-900"
                      style={{
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      }}
                    >
                      {searchResults.map((result, index) => (
                        <button
                          type="button"
                          key={result.place_id}
                          onClick={() => selectSearchResult(result.place_id)}
                          className="w-full px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-start gap-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                          style={{
                            animationDelay: `${index * 30}ms`,
                          }}
                        >
                          <MapPin className="w-4 h-4 text-[#E07B4F] mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                              {result.structured_formatting?.main_text || result.description}
                            </p>
                            {result.structured_formatting?.secondary_text && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                                {result.structured_formatting.secondary_text}
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
                {/* Fullscreen Button */}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  onClick={() => setIsFullscreen(true)}
                  className="shadow-md"
                  title={locale === 'ka' ? 'სრული ეკრანი' : 'Fullscreen'}
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>

                {/* Current Location Button */}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  onClick={getCurrentLocation}
                  className="shadow-md"
                  title={locale === 'ka' ? 'ჩემი მდებარეობა' : 'My location'}
                >
                  <Navigation className="w-4 h-4" />
                </Button>
              </div>

              {/* Selected Address on Map */}
              {selectedAddress && (
                <div
                  className="absolute bottom-3 left-3 right-3 z-10"
                  style={{
                    animation: 'slideUp 0.3s ease-out',
                  }}
                >
                  <div
                    className="px-4 py-3 rounded-xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md flex items-center gap-3"
                    style={{
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#E07B4F] flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm font-medium text-neutral-900 dark:text-white truncate flex-1">
                      {selectedAddress}
                    </p>
                  </div>
                </div>
              )}

              {/* Map hint - only show when no address selected */}
              {!selectedAddress && (
                <div
                  className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm text-xs font-medium pointer-events-none z-10"
                  style={{
                    color: 'var(--color-text-secondary)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#E07B4F]" />
                    {locale === 'ka' ? 'დააკლიკეთ ან გადაათრიეთ მარკერი' : 'Click or drag marker'}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <LoadingSpinner size="lg" color="#E07B4F" />
              <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                {locale === 'ka' ? 'რუკა იტვირთება...' : 'Loading map...'}
              </p>
            </div>
          )}
        </div>

        {/* Selected Address Display Below Map */}
        {selectedAddress ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-0.5">
                {locale === 'ka' ? 'არჩეული მისამართი' : 'Selected Address'}
              </p>
              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                {selectedAddress}
              </p>
            </div>
          </div>
        ) : required ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#C4735B]/5 border border-[#C4735B]/20">
            <div className="w-8 h-8 rounded-full bg-[#C4735B]/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-[#C4735B]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-[#C4735B]">
                {locale === 'ka' ? 'გთხოვთ აირჩიოთ მისამართი რუკაზე' : 'Please select an address on the map'}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {locale === 'ka' ? 'დააკლიკეთ რუკაზე ან მოძებნეთ მისამართი' : 'Click on the map or search for an address'}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Fullscreen Modal - Portal to body */}
      {isFullscreen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 bg-white dark:bg-neutral-950"
          style={{
            animation: 'fadeIn 0.2s ease-out',
            zIndex: 99999,
          }}
        >
          {/* Fullscreen Map */}
          <div ref={fullscreenMapRef} className="w-full h-full" />

          {/* Fullscreen Search Bar */}
          <div className="absolute top-4 left-4 right-4 z-10 max-w-xl mx-auto">
            <div
              className="relative"
              style={{
                filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.12))',
              }}
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                {isSearching ? (
                  <LoadingSpinner size="md" color="#9ca3af" />
                ) : (
                  <Search className="w-5 h-5 text-neutral-400" />
                )}
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                placeholder={locale === 'ka' ? 'მოძებნე მისამართი...' : 'Search address...'}
                className="w-full pl-12 pr-12 py-4 rounded-2xl text-base bg-white dark:bg-neutral-900 border-0 outline-none placeholder:text-neutral-400 text-neutral-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchResults(false);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-4 h-4 text-neutral-400" />
                </button>
              )}

              {/* Fullscreen Search Results */}
              {showSearchResults && searchResults.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-3 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900"
                  style={{
                    boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                  }}
                >
                  {searchResults.map((result, index) => (
                    <button
                      type="button"
                      key={result.place_id}
                      onClick={() => selectSearchResult(result.place_id)}
                      className="w-full px-5 py-4 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-start gap-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0"
                      style={{
                        animationDelay: `${index * 30}ms`,
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#E07B4F]/10 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-[#E07B4F]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-medium text-neutral-900 dark:text-white">
                          {result.structured_formatting?.main_text || result.description}
                        </p>
                        {result.structured_formatting?.secondary_text && (
                          <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate mt-1">
                            {result.structured_formatting.secondary_text}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="absolute top-4 right-4 z-10 flex gap-3">
            {/* Current Location */}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={getCurrentLocation}
              className="shadow-lg"
            >
              <Navigation className="w-5 h-5" />
            </Button>

            {/* Close Button */}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => setIsFullscreen(false)}
              className="shadow-lg"
            >
              <Minimize2 className="w-5 h-5" />
            </Button>
          </div>

          {/* Selected Address Display */}
          {selectedAddress && (
            <div
              className="absolute left-4 right-4 z-10 max-w-xl mx-auto"
              style={{
                animation: 'slideUp 0.3s ease-out',
                bottom: '24px',
              }}
            >
              <div
                className="px-5 py-4 rounded-2xl bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md flex items-center gap-4"
                style={{
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                }}
              >
                <div className="w-12 h-12 rounded-full bg-[#E07B4F] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#E07B4F] dark:text-[#CD853F] uppercase tracking-wide mb-1">
                    {locale === 'ka' ? 'არჩეული მისამართი' : 'Selected Address'}
                  </p>
                  <p className="text-base font-medium text-neutral-900 dark:text-white truncate">
                    {selectedAddress}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Hint when no address */}
          {!selectedAddress && (
            <div
              className="absolute left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md text-sm font-medium text-neutral-600 dark:text-neutral-300 z-10"
              style={{
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                bottom: '24px',
              }}
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#E07B4F]" />
                {locale === 'ka' ? 'დააკლიკეთ რუკაზე ან მოძებნეთ მისამართი' : 'Click on map or search for address'}
              </span>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
