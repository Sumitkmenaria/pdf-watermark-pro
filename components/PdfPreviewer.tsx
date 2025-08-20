
import React, { useState, useEffect, useRef } from 'react';
import { Rnd } from 'react-rnd';
import { FileInfo, WatermarkSettings } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PdfPreviewerProps {
  fileInfo: FileInfo;
  activePageIndex: number;
  setActivePageIndex: React.Dispatch<React.SetStateAction<number>>;
  watermarkSettings: WatermarkSettings;
  onPositionChange: (fileId: string, pageIndex: number, pos: { x: number, y: number, width: number, height: number }) => void;
}

const PdfPreviewer: React.FC<PdfPreviewerProps> = ({ fileInfo, activePageIndex, setActivePageIndex, watermarkSettings, onPositionChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [previewDimensions, setPreviewDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setPdfDoc(null); // Reset doc on file change to trigger reload
    const loadPdf = async () => {
      try {
        const fileBuffer = await fileInfo.file.arrayBuffer();
        const doc = await (window as any).pdfjsLib.getDocument({ data: fileBuffer, password: fileInfo.password }).promise;
        setPdfDoc(doc);
      } catch (error) {
        console.error("Failed to load PDF for preview:", error);
      }
    };
    loadPdf();
  }, [fileInfo.id, fileInfo.file, fileInfo.password]);

  useEffect(() => {
    if (!pdfDoc) return;
    setIsLoading(true);

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(activePageIndex + 1);
        const desiredWidth = 600;
        const viewport = page.getViewport({ scale: 1.0 });
        const scale = desiredWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
  
        const canvas = canvasRef.current;
        if (!canvas) return;
  
        const context = canvas.getContext('2d');
        if (!context) return;
        
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        setPreviewDimensions({width: scaledViewport.width, height: scaledViewport.height});
  
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport
        };
        await page.render(renderContext).promise;
      } catch(e) {
        console.error("Failed to render page", e);
      } finally {
        setIsLoading(false);
      }
    };

    renderPage();
  }, [pdfDoc, activePageIndex]);

  const watermarkPos = fileInfo.pages[activePageIndex].watermarkPosition;

  return (
    <div className="absolute inset-0 flex flex-col items-center">
        <div className="flex-grow w-full bg-gray-200/50 rounded-lg flex items-center justify-center overflow-auto p-4 relative">
            {isLoading && <div className="text-gray-500">Loading preview...</div>}
            <div className={`relative transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`} style={{width: previewDimensions.width, height: previewDimensions.height}}>
                <canvas ref={canvasRef} className="rounded-md shadow-lg" />
                {previewDimensions.width > 0 && !isLoading && (
                    <Rnd
                        size={{ width: watermarkPos.width, height: watermarkPos.height }}
                        position={{ x: watermarkPos.x, y: watermarkPos.y }}
                        onDragStop={(e, d) => {
                            onPositionChange(fileInfo.id, activePageIndex, { ...watermarkPos, x: d.x, y: d.y });
                        }}
                        onResizeStop={(e, direction, ref, delta, position) => {
                            onPositionChange(fileInfo.id, activePageIndex, {
                                width: parseInt(ref.style.width),
                                height: parseInt(ref.style.height),
                                ...position,
                            });
                        }}
                        bounds="parent"
                        className="border-2 border-dashed border-primary-dark"
                    >
                        <div 
                            className="w-full h-full p-1 text-blue-900 whitespace-pre-wrap break-words overflow-hidden"
                            style={{
                                fontSize: `${watermarkSettings.fontSize}pt`,
                                opacity: watermarkSettings.opacity / 100,
                                lineHeight: 1.5
                            }}
                        >
                            <p className="font-bold">COPY SHARED - STRICTLY CONFIDENTIAL FOR</p>
                            <p className="font-bold">LIMITED USE AS DETAILED HEREUNDER</p>
                            <p>DATE: {watermarkSettings.date}</p>
                            <p>RECIPIENT: {watermarkSettings.recipient}</p>
                            <p>PURPOSE: {watermarkSettings.purpose || 'N/A'}</p>
                        </div>
                    </Rnd>
                )}
            </div>
        </div>

        {fileInfo.totalPages > 1 && (
          <div className="flex items-center space-x-4 mt-4 flex-shrink-0">
              <button onClick={() => setActivePageIndex(p => Math.max(0, p - 1))} disabled={activePageIndex === 0} className="p-2 rounded-full bg-white shadow-sm text-primary hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft />
              </button>
              <span className="font-mono text-sm text-gray-700">{activePageIndex + 1} / {fileInfo.totalPages}</span>
              <button onClick={() => setActivePageIndex(p => Math.min(fileInfo.totalPages - 1, p + 1))} disabled={activePageIndex === fileInfo.totalPages - 1} className="p-2 rounded-full bg-white shadow-sm text-primary hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <ChevronRight />
              </button>
          </div>
        )}
    </div>
  );
};

export default PdfPreviewer;