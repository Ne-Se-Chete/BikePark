// src/CustomMarker.tsx

import React from 'react';
import { PiBicycleLight } from "react-icons/pi";


interface CustomMarkerProps {
  title: string;
}

const CustomMarker: React.FC<CustomMarkerProps> = ({ title }) => {
  return (
    <div className="flex items-center justify-center bg-emerald-500 w-12 h-12 rounded-full text-white text-xs font-bold">
      <PiBicycleLight size={24} />
    </div>
  );
};

export default CustomMarker;
