'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center justify-between sm:justify-start gap-2.5 rounded-2xl liquid-glass-elevated border border-white/20 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl">
      <div className="flex items-center gap-2.5">
        <WifiOff className="w-4 h-4 text-white shrink-0" />
        <span>Modo Sin Conexión — Rutinas y registros guardados localmente en tu dispositivo.</span>
      </div>
    </div>
  );
};
