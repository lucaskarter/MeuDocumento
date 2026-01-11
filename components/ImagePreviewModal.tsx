import React, { useEffect, useState, useRef } from 'react';
import { X, Download, FileText, ExternalLink, StickyNote, Copy, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';
import { Document } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Handle module export structure
// @ts-ignore
const pdfjs = pdfjsLib.default ?? pdfjsLib;

// Set up the worker for PDF.js (Same as Thumbnail)
if (pdfjs && pdfjs.GlobalWorkerOptions) {
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

interface ImagePreviewModalProps {
  document: Document;
  onClose: () => void;
}

// Internal component to render a single PDF page
const PdfPage = ({ pdf, pageNumber, scale = 1.5 }: { pdf: any, pageNumber: number, scale?: number }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const renderPage = async () => {
            if (!pdf || !canvasRef.current) return;
            
            try {
                const page = await pdf.getPage(pageNumber);
                if (!isMounted) return;

                const viewport = page.getViewport({ scale });
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                if (context) {
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;

                    const renderContext = {
                        canvasContext: context,
                        viewport: viewport,
                    };

                    await page.render(renderContext).promise;
                    if (isMounted) setLoading(false);
                }
            } catch (error) {
                console.error(`Error rendering page ${pageNumber}`, error);
            }
        };

        renderPage();
        return () => { isMounted = false; };
    }, [pdf, pageNumber, scale]);

    return (
        <div className="relative mb-4 shadow-lg">
             {loading && (
                 <div className="absolute inset-0 flex items-center justify-center bg-white z-10 min-h-[400px]">
                     <Loader2 className="animate-spin text-brand-primary" />
                 </div>
             )}
             <canvas ref={canvasRef} className="max-w-full h-auto bg-white rounded-sm" />
             <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                 Pág {pageNumber}
             </div>
        </div>
    );
};

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ document, onClose }) => {
  const { title, fileData, fileType, description } = document;
  
  const isPdf = fileType === 'application/pdf';
  const isText = fileType === 'text/plain';

  // PDF State
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
      if (isPdf && fileData) {
          const loadPdf = async () => {
              setPdfLoading(true);
              setPdfError(false);
              try {
                const base64Data = fileData.split(',')[1] || fileData;
                const binaryString = atob(base64Data);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }

                const loadingTask = pdfjs.getDocument({ data: bytes });
                const loadedPdf = await loadingTask.promise;
                
                setPdfDoc(loadedPdf);
                setNumPages(loadedPdf.numPages);
              } catch (e) {
                  console.error("Failed to load PDF", e);
                  setPdfError(true);
              } finally {
                  setPdfLoading(false);
              }
          };
          loadPdf();
      }
  }, [isPdf, fileData]);

  const handleCopy = () => {
      if (description) {
        navigator.clipboard.writeText(description);
        alert('Conteúdo copiado!');
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="relative max-w-5xl w-full h-[90vh] flex flex-col bg-gray-900 rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 bg-gray-800 text-white border-b border-gray-700 shrink-0">
          <h3 className="font-medium text-lg truncate pr-4 flex items-center gap-2">
             {isPdf ? <FileText size={20} /> : isText ? <StickyNote size={20} /> : null} {title}
          </h3>
          <div className="flex gap-2">
            {!isText && (
                <a 
                href={fileData} 
                download={isPdf ? `${title}.pdf` : `${title}.jpg`}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                title="Baixar arquivo"
                >
                <Download size={20} />
                </a>
            )}
            {isText && (
                <button
                    onClick={handleCopy}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                    title="Copiar Texto"
                >
                    <Copy size={20} />
                </button>
            )}
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex justify-center bg-gray-200/90">
          {isText ? (
              <div className="w-full h-full p-8 bg-brand-cream flex items-center justify-center min-h-full">
                  <div className="bg-white p-8 sm:p-12 rounded-lg shadow-xl max-w-2xl w-full border-l-8 border-brand-primary relative">
                      <h2 className="text-2xl font-bold text-brand-dark mb-6">{title}</h2>
                      <div className="text-gray-800 text-lg whitespace-pre-wrap leading-relaxed">
                        {description || <span className="text-gray-400 italic">Sem conteúdo.</span>}
                      </div>
                  </div>
              </div>
          ) : isPdf ? (
            <div className="w-full h-full p-4 md:p-8 flex flex-col items-center">
                {pdfLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-600">
                        <Loader2 className="w-10 h-10 animate-spin mb-2 text-brand-primary" />
                        <p>Carregando documento...</p>
                    </div>
                ) : pdfError ? (
                     <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
                        <FileText size={64} className="mb-4 text-gray-400" />
                        <p className="mb-4 text-lg">Não foi possível visualizar este PDF diretamente.</p>
                        <a 
                            href={fileData} 
                            download={`${title}.pdf`}
                            className="bg-brand-primary text-white px-6 py-2 rounded-lg hover:bg-brand-dark transition-colors flex items-center gap-2"
                        >
                            <Download size={20} /> Baixar para Visualizar
                        </a>
                     </div>
                ) : (
                    <div className="flex flex-col items-center w-full max-w-3xl">
                        {Array.from({ length: numPages }, (_, index) => (
                            <PdfPage 
                                key={`page_${index + 1}`} 
                                pdf={pdfDoc} 
                                pageNumber={index + 1} 
                            />
                        ))}
                    </div>
                )}
            </div>
          ) : (
             <div className="flex items-center justify-center min-h-full p-4">
                <img 
                    src={fileData} 
                    alt={title} 
                    className="max-w-full max-h-full object-contain shadow-lg rounded-lg" 
                />
             </div>
          )}
        </div>
      </div>
    </div>
  );
};