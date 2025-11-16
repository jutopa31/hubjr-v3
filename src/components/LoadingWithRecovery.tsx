import React, { useEffect, useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingWithRecoveryProps {
  isLoading: boolean;
  onRetry: () => void;
  loadingMessage?: string;
  recoveryTimeout?: number;
  children: React.ReactNode;
}

export function LoadingWithRecovery({ isLoading, onRetry, loadingMessage = 'Cargando...', recoveryTimeout = 15000, children }: LoadingWithRecoveryProps) {
  const [showRecovery, setShowRecovery] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const loadingStartTime = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      if (!loadingStartTime.current) { loadingStartTime.current = Date.now(); }
      timerRef.current = window.setTimeout(() => { setShowRecovery(true); }, recoveryTimeout);
      elapsedTimerRef.current = window.setInterval(() => { if (loadingStartTime.current) setElapsedTime(Math.floor((Date.now() - loadingStartTime.current) / 1000)); }, 1000);
    } else {
      loadingStartTime.current = null; setShowRecovery(false); setElapsedTime(0);
      if (timerRef.current) { window.clearTimeout(timerRef.current); timerRef.current = null; }
      if (elapsedTimerRef.current) { window.clearInterval(elapsedTimerRef.current); elapsedTimerRef.current = null; }
    }
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); if (elapsedTimerRef.current) window.clearInterval(elapsedTimerRef.current); };
  }, [isLoading, recoveryTimeout]);

  if (!isLoading) return <>{children}</>;
  return (
    <div className="flex items-center justify-center min-h-64 p-6">
      <div className="text-center max-w-md">
        {!showRecovery && (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">{loadingMessage}</p>
            <p className="text-gray-500 text-sm mt-2">{elapsedTime}s</p>
          </>
        )}
        {showRecovery && (
          <>
            <div className="mb-4">
              <RefreshCw className="h-12 w-12 text-blue-700 mx-auto mb-2" />
              <p className="text-gray-700 text-lg font-medium mb-2">La carga está tardando más de lo esperado</p>
              <p className="text-gray-500 text-sm">Han pasado {elapsedTime} segundos. Puedes intentar recargar los datos.</p>
            </div>
            <button onClick={() => { setShowRecovery(false); loadingStartTime.current = null; onRetry(); }} className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              <RefreshCw className="h-5 w-5" />
              <span>Recargar Datos</span>
            </button>
            <p className="text-gray-400 text-xs mt-4">O presiona F5 para recargar toda la página</p>
          </>
        )}
      </div>
    </div>
  );
}
