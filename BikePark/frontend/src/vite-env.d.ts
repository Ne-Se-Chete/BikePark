/// <reference types="vite/client" />

declare global {
    interface Window {
      google: typeof google;
    }
  
    // Optionally, declare google as a global variable directly
    const google: typeof import('google.maps');
  }
  
  export {};
  