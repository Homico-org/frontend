import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Google Maps hooks for script loading, geocoding, and places autocomplete.
 *
 * Note: These hooks work with the Google Maps JavaScript API.
 * The types use 'any' to avoid conflicts with existing type declarations.
 */

// Script loading state (shared across all instances)
let isScriptLoading = false;
let isScriptLoaded = false;
const loadCallbacks: (() => void)[] = [];

/**
 * Load the Google Maps script once and share across all hook instances
 */
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    // Already loaded
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).google?.maps) {
      isScriptLoaded = true;
      resolve();
      return;
    }

    // Currently loading - add to callback queue
    if (isScriptLoading) {
      loadCallbacks.push(resolve);
      return;
    }

    // Start loading
    isScriptLoading = true;
    loadCallbacks.push(resolve);

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      // Resolve all waiting callbacks
      loadCallbacks.forEach((cb) => cb());
      loadCallbacks.length = 0;
    };

    script.onerror = () => {
      isScriptLoading = false;
      console.error('Failed to load Google Maps script');
    };

    document.head.appendChild(script);
  });
}

export interface UseGoogleMapsOptions {
  /** Whether to load the script immediately */
  autoLoad?: boolean;
}

export interface UseGoogleMapsReturn {
  /** Whether the Google Maps script is loaded */
  isLoaded: boolean;
  /** Whether the script is currently loading */
  isLoading: boolean;
  /** Load the script manually (if autoLoad is false) */
  load: () => Promise<void>;
  /** Error if script failed to load */
  error: Error | null;
}

/**
 * Hook to manage Google Maps script loading.
 * Ensures the script is only loaded once across all components.
 *
 * @example
 * ```tsx
 * function LocationPicker() {
 *   const { isLoaded } = useGoogleMaps();
 *
 *   if (!isLoaded) return <LoadingSpinner />;
 *
 *   return <MapComponent />;
 * }
 * ```
 */
export function useGoogleMaps(options: UseGoogleMapsOptions = {}): UseGoogleMapsReturn {
  const { autoLoad = true } = options;
  const [isLoaded, setIsLoaded] = useState(isScriptLoaded);
  const [isLoading, setIsLoading] = useState(isScriptLoading);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (isScriptLoaded) {
      setIsLoaded(true);
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      const err = new Error('Google Maps API key not found');
      setError(err);
      console.warn(err.message);
      return;
    }

    setIsLoading(true);
    try {
      await loadGoogleMapsScript(apiKey);
      setIsLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load Google Maps'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return { isLoaded, isLoading, load, error };
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UseGeocoderReturn {
  /** Geocode an address to coordinates */
  geocode: (address: string) => Promise<Coordinates | null>;
  /** Reverse geocode coordinates to address */
  reverseGeocode: (coords: Coordinates) => Promise<string | null>;
  /** Whether a geocoding operation is in progress */
  isGeocoding: boolean;
}

/**
 * Hook for geocoding operations (address <-> coordinates)
 *
 * @example
 * ```tsx
 * function AddressInput() {
 *   const { isLoaded } = useGoogleMaps();
 *   const { geocode, reverseGeocode } = useGeocoder();
 *
 *   const handleAddressSubmit = async (address: string) => {
 *     const coords = await geocode(address);
 *     if (coords) {
 *       console.log('Coordinates:', coords);
 *     }
 *   };
 * }
 * ```
 */
export function useGeocoder(): UseGeocoderReturn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geocoderRef = useRef<any>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const getGeocoder = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (!google?.maps) return null;
    if (!geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }
    return geocoderRef.current;
  }, []);

  const geocode = useCallback(
    async (address: string): Promise<Coordinates | null> => {
      const geocoder = getGeocoder();
      if (!geocoder) return null;

      setIsGeocoding(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await geocoder.geocode({ address });
        if (response.results?.[0]?.geometry?.location) {
          const location = response.results[0].geometry.location;
          return { lat: location.lat(), lng: location.lng() };
        }
        return null;
      } catch {
        return null;
      } finally {
        setIsGeocoding(false);
      }
    },
    [getGeocoder]
  );

  const reverseGeocode = useCallback(
    async (coords: Coordinates): Promise<string | null> => {
      const geocoder = getGeocoder();
      if (!geocoder) return null;

      setIsGeocoding(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response: any = await geocoder.geocode({ location: coords });
        return response.results?.[0]?.formatted_address || null;
      } catch {
        return null;
      } finally {
        setIsGeocoding(false);
      }
    },
    [getGeocoder]
  );

  return { geocode, reverseGeocode, isGeocoding };
}

export interface UsePlacesAutocompleteOptions {
  /** Debounce delay in ms */
  debounceMs?: number;
  /** Country restriction (e.g., 'ge' for Georgia) */
  country?: string;
  /** Types of places to return */
  types?: string[];
}

export interface PlacePrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface UsePlacesAutocompleteReturn {
  /** Search for place predictions */
  search: (input: string) => void;
  /** Current predictions */
  predictions: PlacePrediction[];
  /** Whether a search is in progress */
  isSearching: boolean;
  /** Clear predictions */
  clear: () => void;
  /** Get place details by ID */
  getPlaceDetails: (placeId: string) => Promise<{
    address: string;
    coords: Coordinates;
  } | null>;
}

/**
 * Hook for Places Autocomplete functionality
 *
 * @example
 * ```tsx
 * function AddressSearch() {
 *   const { isLoaded } = useGoogleMaps();
 *   const { search, predictions, isSearching, getPlaceDetails } = usePlacesAutocomplete();
 *
 *   return (
 *     <div>
 *       <input onChange={(e) => search(e.target.value)} />
 *       {predictions.map((p) => (
 *         <div key={p.placeId} onClick={() => getPlaceDetails(p.placeId)}>
 *           {p.description}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePlacesAutocomplete(
  options: UsePlacesAutocompleteOptions = {}
): UsePlacesAutocompleteReturn {
  const { debounceMs = 300, country = 'ge', types = ['geocode'] } = options;

  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const autocompleteServiceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const placesServiceRef = useRef<any>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const getAutocompleteService = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (!google?.maps?.places) return null;
    if (!autocompleteServiceRef.current) {
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    }
    return autocompleteServiceRef.current;
  }, []);

  const getPlacesService = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (!google?.maps?.places) return null;
    if (!placesServiceRef.current) {
      // PlacesService requires a map or div element
      const div = document.createElement("div");
      placesServiceRef.current = new google.maps.places.PlacesService(div);
    }
    return placesServiceRef.current;
  }, []);

  const search = useCallback(
    (input: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (!input.trim()) {
        setPredictions([]);
        return;
      }

      debounceRef.current = setTimeout(() => {
        const service = getAutocompleteService();
        if (!service) return;

        setIsSearching(true);
        service.getPlacePredictions(
          {
            input,
            componentRestrictions: { country },
            types,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (results: any[] | null, status: string) => {
            setIsSearching(false);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const google = (window as any).google;
            if (status === google?.maps?.places?.PlacesServiceStatus?.OK && results) {
              setPredictions(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                results.map((r: any) => ({
                  placeId: r.place_id,
                  description: r.description,
                  mainText: r.structured_formatting.main_text,
                  secondaryText: r.structured_formatting.secondary_text || '',
                }))
              );
            } else {
              setPredictions([]);
            }
          }
        );
      }, debounceMs);
    },
    [getAutocompleteService, country, types, debounceMs]
  );

  const clear = useCallback(() => {
    setPredictions([]);
  }, []);

  const getPlaceDetails = useCallback(
    async (placeId: string): Promise<{ address: string; coords: Coordinates } | null> => {
      const service = getPlacesService();
      if (!service) return null;

      return new Promise((resolve) => {
        service.getDetails(
          { placeId, fields: ['formatted_address', 'geometry'] },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (place: any, status: string) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const google = (window as any).google;
            if (status === google?.maps?.places?.PlacesServiceStatus?.OK && place) {
              const location = place.geometry?.location;
              if (location) {
                resolve({
                  address: place.formatted_address || '',
                  coords: { lat: location.lat(), lng: location.lng() },
                });
                return;
              }
            }
            resolve(null);
          }
        );
      });
    },
    [getPlacesService]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return { search, predictions, isSearching, clear, getPlaceDetails };
}

export default useGoogleMaps;
