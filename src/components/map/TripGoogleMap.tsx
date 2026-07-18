import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Building2, CalendarDays, MapPin, Plane, UtensilsCrossed } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

type GoogleMapsStatus = 'idle' | 'loading' | 'ready' | 'error';

export type TripMapMarkerKind = 'hotel' | 'food' | 'activity' | 'itinerary' | 'transport' | 'stop';

export interface TripMapMarker {
  id: string;
  kind: TripMapMarkerKind;
  label: string;
  latitude: number;
  longitude: number;
}

interface TripGoogleMapProps {
  markers: TripMapMarker[];
  selectedLabel: string;
  className?: string;
  onUnavailable?: React.ReactNode;
}

interface GoogleLatLngLiteral {
  lat: number;
  lng: number;
}

interface GoogleLatLngBounds {
  extend(position: GoogleLatLngLiteral): void;
}

interface GoogleMapInstance {
  fitBounds(bounds: GoogleLatLngBounds, padding?: number): void;
  setCenter(position: GoogleLatLngLiteral): void;
  setOptions(options: Partial<GoogleMapOptions>): void;
  setZoom(zoom: number): void;
}

interface GoogleMapStyle {
  elementType?: string;
  featureType?: string;
  stylers: Array<Record<string, string>>;
}

interface GoogleMapOptions {
  center: GoogleLatLngLiteral;
  zoom: number;
  mapId: string;
  fullscreenControl: boolean;
  mapTypeControl: boolean;
  streetViewControl: boolean;
  styles?: GoogleMapStyle[];
}

interface GoogleMarkerInstance {
  map: GoogleMapInstance | null;
  addListener(eventName: string, handler: () => void): void;
}

interface GoogleInfoWindow {
  setContent(content: string): void;
  open(options: { anchor: GoogleMarkerInstance; map: GoogleMapInstance }): void;
}

interface GoogleMapsGlobal {
  maps: {
    Map: new (element: HTMLElement, options: GoogleMapOptions) => GoogleMapInstance;
    LatLngBounds: new () => GoogleLatLngBounds;
    InfoWindow: new () => GoogleInfoWindow;
    marker: {
      AdvancedMarkerElement: new (options: {
        map: GoogleMapInstance;
        position: GoogleLatLngLiteral;
        title: string;
        content: HTMLElement;
      }) => GoogleMarkerInstance;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleMapsGlobal;
    initTripGoogleMap?: () => void;
  }
}

const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-js-api';

const DARK_MAP_STYLES: GoogleMapStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

let googleMapsLoadPromise: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(
      GOOGLE_MAPS_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    window.initTripGoogleMap = () => {
      resolve();
    };

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Google Maps failed to load.')),
        {
          once: true,
        },
      );
      return;
    }

    const script = document.createElement('script');
    const params = new URLSearchParams({
      key: apiKey,
      callback: 'initTripGoogleMap',
      libraries: 'marker',
      v: 'weekly',
    });

    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Google Maps failed to load.'));

    document.head.appendChild(script);
  });

  return googleMapsLoadPromise;
}

function isFiniteCoordinate(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function getMarkerClasses(kind: TripMapMarkerKind) {
  switch (kind) {
    case 'hotel':
      return 'bg-primary-600';
    case 'food':
      return 'bg-accent-600';
    case 'activity':
      return 'bg-success-500';
    case 'itinerary':
      return 'bg-warning-500';
    case 'transport':
      return 'bg-error-500';
    default:
      return 'bg-neutral-900';
  }
}

function getMarkerIcon(kind: TripMapMarkerKind) {
  switch (kind) {
    case 'hotel':
      return <Building2 className="h-4 w-4" />;
    case 'food':
      return <UtensilsCrossed className="h-4 w-4" />;
    case 'itinerary':
      return <CalendarDays className="h-4 w-4" />;
    case 'transport':
      return <Plane className="h-4 w-4" />;
    default:
      return <MapPin className="h-4 w-4" />;
  }
}

function createMarkerContent(marker: TripMapMarker) {
  const container = document.createElement('div');
  container.className = [
    'group relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white shadow-lg ring-2 ring-white transition-transform hover:scale-110',
    getMarkerClasses(marker.kind),
  ].join(' ');
  container.title = marker.label;

  const root = document.createElement('div');
  container.appendChild(root);

  return { container, root };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getBounds(markers: TripMapMarker[]) {
  const bounds = new window.google!.maps.LatLngBounds();
  markers.forEach((marker) => {
    bounds.extend({ lat: marker.latitude, lng: marker.longitude });
  });
  return bounds;
}

const TripGoogleMap: React.FC<TripGoogleMapProps> = ({
  markers,
  selectedLabel,
  className = '',
  onUnavailable,
}) => {
  const { isDarkMode } = useTheme();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<GoogleMapInstance | null>(null);
  const markerInstancesRef = useRef<GoogleMarkerInstance[]>([]);
  const markerRootsRef = useRef<Array<{ root: Root; container: HTMLElement }>>([]);
  const [status, setStatus] = useState<GoogleMapsStatus>('idle');

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const lightMapId =
    import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? import.meta.env.VITE_GOOGLE_MAPS_MAPS_ID;
  const darkMapId =
    import.meta.env.VITE_GOOGLE_MAPS_DARK_MAP_ID ?? import.meta.env.VITE_GOOGLE_MAPS_DARK_MAPS_ID;
  const mapId = isDarkMode ? (darkMapId ?? lightMapId) : lightMapId;
  const mapStyles = useMemo(
    () => (isDarkMode && !darkMapId ? DARK_MAP_STYLES : []),
    [darkMapId, isDarkMode],
  );
  const validMarkers = useMemo(
    () => markers.filter((marker) => isFiniteCoordinate(marker.latitude, marker.longitude)),
    [markers],
  );

  useEffect(() => {
    if (!apiKey || !mapId || validMarkers.length === 0) return;

    let cancelled = false;
    setStatus('loading');

    loadGoogleMaps(apiKey)
      .then(() => {
        if (cancelled || !mapRef.current) return;
        setStatus('ready');

        const center = {
          lat: validMarkers[0].latitude,
          lng: validMarkers[0].longitude,
        };
        const existingMapElement = mapRef.current.firstElementChild;
        const existingThemeMapId = existingMapElement?.getAttribute('data-theme-map-id');

        if (!mapInstanceRef.current || existingThemeMapId !== mapId) {
          mapRef.current.replaceChildren();
          const mapElement = document.createElement('div');
          mapElement.className = 'h-full min-h-[420px] w-full';
          mapElement.setAttribute('data-theme-map-id', mapId);
          mapRef.current.appendChild(mapElement);
          markerRootsRef.current.forEach(({ root }) => root.unmount());
          markerRootsRef.current = [];
          markerInstancesRef.current.forEach((markerInstance) => {
            markerInstance.map = null;
          });
          markerInstancesRef.current = [];

          mapInstanceRef.current = new window.google!.maps.Map(mapElement, {
            center,
            zoom: validMarkers.length === 1 ? 13 : 6,
            mapId,
            fullscreenControl: false,
            mapTypeControl: false,
            streetViewControl: false,
            styles: mapStyles,
          });
        }
        const map = mapInstanceRef.current;
        map.setOptions({ styles: mapStyles });

        markerRootsRef.current.forEach(({ root }) => root.unmount());
        markerRootsRef.current = [];
        markerInstancesRef.current.forEach((markerInstance) => {
          markerInstance.map = null;
        });
        markerInstancesRef.current = [];

        const infoWindow = new window.google!.maps.InfoWindow();

        validMarkers.forEach((marker) => {
          const { container, root: markerRootElement } = createMarkerContent(marker);
          const root = createRoot(markerRootElement);
          root.render(getMarkerIcon(marker.kind));
          markerRootsRef.current.push({ root, container });

          const markerInstance = new window.google!.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat: marker.latitude, lng: marker.longitude },
            title: marker.label,
            content: container,
          });

          markerInstance.addListener('click', () => {
            infoWindow.setContent(
              `<div style="font-weight:600;color:#171717">${escapeHtml(marker.label)}</div>`,
            );
            infoWindow.open({
              anchor: markerInstance,
              map,
            });
          });

          markerInstancesRef.current.push(markerInstance);
        });

        if (validMarkers.length > 1) {
          map.fitBounds(getBounds(validMarkers), 72);
        } else {
          map.setCenter(center);
          map.setZoom(13);
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, mapId, mapStyles, validMarkers]);

  useEffect(() => {
    return () => {
      markerRootsRef.current.forEach(({ root }) => root.unmount());
      markerRootsRef.current = [];
      markerInstancesRef.current.forEach((markerInstance) => {
        markerInstance.map = null;
      });
      markerInstancesRef.current = [];
    };
  }, []);

  if (!apiKey || !mapId || validMarkers.length === 0 || status === 'error') {
    return <>{onUnavailable}</>;
  }

  return (
    <div
      className={`relative h-full min-h-[420px] w-full overflow-hidden rounded-2xl ${className}`}
    >
      <div ref={mapRef} className="h-full min-h-[420px] w-full" />
      <div className="absolute left-4 right-4 top-4 z-10 flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur-sm dark:bg-neutral-900/90">
        <MapPin className="h-4 w-4 text-primary-500" />
        <span className="text-sm text-neutral-600">{selectedLabel}</span>
      </div>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] dark:bg-neutral-900/60">
          <p className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-600 shadow-sm dark:bg-neutral-800">
            Loading map...
          </p>
        </div>
      )}
    </div>
  );
};

export default TripGoogleMap;
