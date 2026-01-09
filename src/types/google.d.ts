/* eslint-disable @typescript-eslint/no-explicit-any */

// Google OAuth types
interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    auto_select?: boolean;
  }) => void;
  prompt: () => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      logo_alignment?: 'left' | 'center';
      width?: number;
      locale?: string;
    }
  ) => void;
}

interface GoogleAccounts {
  id?: GoogleAccountsId;
}

// Google Maps types are complex, so we use any for flexibility
interface GoogleMaps {
  Map: any;
  Marker: any;
  Geocoder: any;
  LatLng: any;
  places: {
    AutocompleteService: any;
    PlacesService: any;
    PlacesServiceStatus: {
      OK: string;
      ZERO_RESULTS: string;
    };
  };
  event: {
    addListener: (instance: any, eventName: string, handler: any) => any;
  };
}

interface Google {
  accounts?: GoogleAccounts;
  maps?: GoogleMaps;
}

declare global {
  interface Window {
    google?: Google;
    initGoogleMaps?: () => void;
    dataLayer?: Record<string, any>[];
  }
}

export {};
