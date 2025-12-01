'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef<boolean>(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  useEffect(() => {
    const startScanner = async () => {
      try {
        const html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            // Prevent multiple scans while processing
            if (processingRef.current) {
              return;
            }

            // Set processing flag immediately (synchronously)
            processingRef.current = true;
            setIsProcessing(true);

            // Stop scanner immediately to prevent more scans
            try {
              await stopScanner();
            } catch (err) {
              console.error('Error stopping scanner:', err);
            }

            // Call the onScan handler
            onScan(decodedText);
          },
          (errorMessage) => {
            // Ignore scan errors (happens continuously when no QR code is detected)
          }
        );

        setIsScanning(true);
        setCameraPermission('granted');
      } catch (err) {
        console.error('Error starting scanner:', err);
        setError('Unable to access camera. Please check permissions.');
        setCameraPermission('denied');
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Camera className="w-5 h-5" />
            <h2 className="font-bold text-lg">Scan QR Code</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Area */}
        <div className="p-6">
          {error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800 font-medium mb-2">{error}</p>
                <p className="text-xs text-red-700">
                  {cameraPermission === 'denied'
                    ? 'Please enable camera access in your browser settings and reload the page.'
                    : 'Make sure your camera is connected and not in use by another application.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <div
                  id="qr-reader"
                  className="rounded-lg overflow-hidden border-2 border-gray-200"
                ></div>

                {/* Processing Overlay */}
                {isProcessing && (
                  <div className="absolute inset-0 bg-white/95 rounded-lg flex flex-col items-center justify-center gap-3">
                    <div className="bg-green-100 rounded-full p-3">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                      <p className="text-sm font-medium text-gray-800">Processing scan...</p>
                    </div>
                  </div>
                )}
              </div>

              {!isProcessing && (
                <p className="text-sm text-gray-600 text-center mt-4">
                  Position the QR code within the frame to scan
                </p>
              )}
            </>
          )}

          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="w-full mt-6 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
