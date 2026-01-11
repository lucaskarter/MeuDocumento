import React, { useEffect, useRef, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Handle module export structure (esm.sh often puts exports in .default for this library)
// @ts-ignore
const pdfjs = pdfjsLib.default ?? pdfjsLib;

// Set up the worker for PDF.js
if (pdfjs && pdfjs.GlobalWorkerOptions) {
  // Use CDNJS for the worker script to ensure it loads correctly as a classic script without CORS/MIME issues
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

interface PdfThumbnailProps {
  fileData: string;
  className?: string;
}

export const PdfThumbnail: React.FC<PdfThumbnailProps> = ({ fileData, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let loadingTask: any = null;

    const renderThumbnail = async () => {
      try {
        setLoading(true);
        setError(false);

        // Convert Base64 to Uint8Array
        const base64Data = fileData.split(',')[1] || fileData;
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Load PDF document using the resolved library object
        loadingTask = pdfjs.getDocument({ data: bytes });
        const pdf = await loadingTask.promise;

        if (!isMounted) return;

        // Get the first page
        const page = await pdf.getPage(1);

        if (!isMounted) return;

        // Calculate scale to fit the canvas parent (approx thumbnail size)
        // We render at a lower scale for performance/thumbnails
        const viewport = page.getViewport({ scale: 0.5 });
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        setLoading(false);

      } catch (err) {
        console.error("Error rendering PDF thumbnail:", err);
        if (isMounted) {
            setError(true);
            setLoading(false);
        }
      }
    };

    renderThumbnail();

    return () => {
      isMounted = false;
      if (loadingTask) {
          loadingTask.destroy().catch(() => {});
      }
    };
  }, [fileData]);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 text-gray-400 h-full w-full ${className}`}>
        <FileText size={32} className="mb-1" />
        <span className="text-[10px] font-semibold">PDF</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full flex items-center justify-center bg-gray-100 overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <Loader2 className="animate-spin text-brand-primary" size={20} />
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        className="max-w-full max-h-full object-contain shadow-sm"
      />
    </div>
  );
};