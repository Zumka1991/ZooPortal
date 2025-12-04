'use client';

import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="h-[300px] bg-gray-100 animate-pulse rounded-lg" />,
});

interface LostFoundMapProps {
  latitude: number;
  longitude: number;
  title: string;
  id: string;
  isLost: boolean;
}

export default function LostFoundMap({ latitude, longitude, title, id, isLost }: LostFoundMapProps) {
  return (
    <Map
      center={[latitude, longitude]}
      zoom={15}
      height="300px"
      markers={[{
        id,
        lat: latitude,
        lng: longitude,
        title,
        type: isLost ? 'lost' : 'found',
      }]}
      className="rounded-lg overflow-hidden"
    />
  );
}
