// src/MapComponent.tsx

import { APIProvider, Map } from "@vis.gl/react-google-maps";
import PoiMarkers from './PoiMarkers';

interface Poi {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
}

const MapComponent = ({ locations }: { locations: Poi[] }) => {
  return (
    <div className="border-2 border-black h-[90%] w-[90%] mt-12">
      <APIProvider
        apiKey={import.meta.env.VITE_MAPS_API_KEY}
        onLoad={() => console.log("Maps API has loaded.")}
      >
        <Map
          defaultZoom={15}
          mapId="HOE_DETECTION"
          defaultCenter={{ lat: 42.699855, lng: 23.311125 }}
        >
          <PoiMarkers pois={locations} /> {/* Render POI markers */}
        </Map>
      </APIProvider>
    </div>
  );
}

export default MapComponent;
