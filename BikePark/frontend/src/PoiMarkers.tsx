// src/PoiMarkers.tsx

import React from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import CustomMarker from './CustomMarker';

interface Poi {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
}

interface PoiMarkersProps {
  pois: Poi[];
}

const PoiMarkers: React.FC<PoiMarkersProps> = ({ pois }) => {
  return (
    <>
      {pois.map(poi => (
        <AdvancedMarker
          key={poi.id}
          position={poi.location}
          children={<CustomMarker title={poi.name} />} // Use CustomMarker as content
        />
      ))}
    </>
  );
};

export default PoiMarkers;
