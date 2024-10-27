import React from 'react';
import MapComponent from './MapComponent';

const App: React.FC = () => {
  // Example POI locations
  const locations = [
    { id: '1', name: 'Location 1', location: { lat: 42.699855, lng: 23.311125 } },
    { id: '2', name: 'Location 2', location: { lat: 42.7000, lng: 23.3100 } },
    { id: '3', name: 'Location 3', location: { lat: 42.6980, lng: 23.3120 } },
  ];

  return (
    <div className='flex flex-col w-dvw h-dvh items-center'>
      <h1 className="text-center text-3xl font-bold mb-4">Google Maps with POI Markers</h1>
      <MapComponent locations={locations} />
    </div>
  );
}

export default App;
