'use client';

import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { useIsClient } from '@/hooks/useGymStore';
import { Download, Share2, X, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';

export const PWAInstallButton: React.FC = () => {
  const isClient = useIsClient();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Avoid SSR / client initial hydration mismatch
  if (!isClient || isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={install}
        className="flex items-center gap-1.5 rounded-xl liquid-glass-button px-3 py-1.5 text-xs font-semibold text-white transition shadow-sm active:scale-95"
        title="Instalar IronPulse como App en tu dispositivo"
      >
        <Download className="w-3.5 h-3.5 text-white animate-bounce" />
        <span>Instalar App</span>
      </motion.button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-xl liquid-glass-button px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition"
          title="Instalar en iPhone o iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-white" />
          <span>Instalar PWA</span>
        </motion.button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4">
            <div className="w-full max-w-sm rounded-3xl liquid-glass-elevated p-6 relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Instalar IronPulse en iOS</h3>
                  <p className="text-xs text-zinc-400">Añade la app a tu pantalla de inicio</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-zinc-300">
                <div className="flex items-start gap-3 liquid-glass-subtle p-3 rounded-2xl border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    Toca el botón <strong className="text-white">Compartir</strong> en la barra inferior de Safari{' '}
                    <Share2 className="w-3.5 h-3.5 inline text-white ml-0.5" />.
                  </div>
                </div>

                <div className="flex items-start gap-3 liquid-glass-subtle p-3 rounded-2xl border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    Desliza hacia abajo y selecciona <strong className="text-white">Añadir a pantalla de inicio</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 liquid-glass-subtle p-3 rounded-2xl border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    Pulsa <strong className="text-white">Añadir</strong> en la esquina superior. ¡Listo para entrenar!
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl liquid-glass-button-primary py-2.5 text-xs font-bold"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <button
      onClick={() => {
        if (typeof window !== 'undefined') {
          alert('Para instalar la App: pulsa el icono de instalación o los tres puntos de tu navegador y elige "Instalar IronPulse".');
        }
      }}
      className="hidden sm:flex items-center gap-1.5 rounded-xl liquid-glass-button px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-white transition"
    >
      <Download className="w-3.5 h-3.5 text-zinc-400" />
      <span>Instalar</span>
    </button>
  );
};
