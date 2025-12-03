'use client';

import { useEffect, useState } from 'react';

// Типы
export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  title: string;
  type?: 'lost' | 'found';
  popupContent?: React.ReactNode;
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  onMarkerClick?: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  selectedPosition?: [number, number] | null;
  className?: string;
  height?: string;
}

// Внутренний компонент карты (загружается только на клиенте)
function MapInner({
  center = [55.7558, 37.6173],
  zoom = 10,
  markers = [],
  onMarkerClick,
  onMapClick,
  selectedPosition,
  height = '400px',
}: MapProps) {
  const [leafletModules, setLeafletModules] = useState<{
    MapContainer: typeof import('react-leaflet').MapContainer;
    TileLayer: typeof import('react-leaflet').TileLayer;
    Marker: typeof import('react-leaflet').Marker;
    Popup: typeof import('react-leaflet').Popup;
    useMapEvents: typeof import('react-leaflet').useMapEvents;
    L: typeof import('leaflet');
  } | null>(null);

  useEffect(() => {
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
    ]).then(([rl, l]) => {
      // Фикс для иконок маркеров
      delete (l.default.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      l.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      setLeafletModules({
        MapContainer: rl.MapContainer,
        TileLayer: rl.TileLayer,
        Marker: rl.Marker,
        Popup: rl.Popup,
        useMapEvents: rl.useMapEvents,
        L: l.default,
      });
    });
  }, []);

  if (!leafletModules) {
    return (
      <div className="bg-gray-100 flex items-center justify-center" style={{ height }}>
        <div className="text-gray-500">Загрузка карты...</div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, useMapEvents, L } = leafletModules;

  // Создаём кастомные иконки
  const lostIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: #EF4444; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  const foundIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: #22C55E; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  const selectedIcon = L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: #3B82F6; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  // Компонент для обработки кликов
  function ClickHandler() {
    useMapEvents({
      click: (e) => {
        onMapClick?.(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {onMapClick && <ClickHandler />}

      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.lat, marker.lng]}
          icon={marker.type === 'lost' ? lostIcon : marker.type === 'found' ? foundIcon : undefined}
          eventHandlers={{
            click: () => onMarkerClick?.(marker.id),
          }}
        >
          {marker.popupContent && <Popup>{marker.popupContent}</Popup>}
        </Marker>
      ))}

      {selectedPosition && (
        <Marker position={selectedPosition} icon={selectedIcon} />
      )}
    </MapContainer>
  );
}

export default function Map(props: MapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        className={`bg-gray-100 flex items-center justify-center ${props.className || ''}`}
        style={{ height: props.height || '400px' }}
      >
        <div className="text-gray-500">Загрузка карты...</div>
      </div>
    );
  }

  return <MapInner {...props} />;
}

// Простой компонент для выбора места
interface LocationPickerProps {
  value?: { lat: number; lng: number } | null;
  onChange: (location: { lat: number; lng: number } | null) => void;
  className?: string;
}

export function LocationPicker({ value, onChange, className = '' }: LocationPickerProps) {
  const [center, setCenter] = useState<[number, number]>([55.7558, 37.6173]);

  useEffect(() => {
    // Пробуем получить геолокацию пользователя
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Ошибка - используем Москву
        }
      );
    }
  }, []);

  return (
    <div className={className}>
      <p className="text-sm text-gray-500 mb-2">
        Кликните на карте, чтобы указать место
      </p>
      <Map
        center={value ? [value.lat, value.lng] : center}
        zoom={value ? 15 : 10}
        height="300px"
        selectedPosition={value ? [value.lat, value.lng] : null}
        onMapClick={(lat, lng) => onChange({ lat, lng })}
        className="rounded-lg overflow-hidden"
      />
      {value && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Убрать метку
          </button>
        </div>
      )}
    </div>
  );
}
