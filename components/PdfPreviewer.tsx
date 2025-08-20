
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
    setPdfDoc(null);
    setIsLoading(true);
    console.log('🔄 Starting PDF load for file:', fileInfo.name);
    const loadPdf = async () => {
      try {
        // Check if pdfjsLib is available
        if (typeof (window as any).pdfjsLib === 'undefined') {
          console.error('PDF.js library not loaded');
          setIsLoading(false);
          return;
        }
        console.log('✅ PDF.js library is available');

        const fileBuffer = await fileInfo.file.arrayBuffer();
        console.log('✅ File buffer loaded, size:', fileBuffer.byteLength, 'bytes');
        
        // Simple PDF loading configuration
        const loadingTask = (window as any).pdfjsLib.getDocument({
          data: fileBuffer
        });
        console.log('🔄 PDF loading task created');
        
        const doc = await loadingTask.promise;
        console.log('✅ PDF loaded successfully, pages:', doc.numPages);
        setPdfDoc(doc);
      } catch (error) {
        console.error("❌ Failed to load PDF for preview:", error);
        setIsLoading(false);
      }
    };
    loadPdf();
  }, [fileInfo.id, fileInfo.file]);

  useEffect(() => {
    if (!pdfDoc || isLoading) return;
    console.log('🔄 Starting page render for page:', activePageIndex + 1);
    setIsLoading(true);

    const renderPage = async () => {
      try {
        console.log('🔄 Getting page', activePageIndex + 1, 'from PDF document');
        const page = await pdfDoc.getPage(activePageIndex + 1);
        
        if (!page) {
          throw new Error(`Failed to get page ${activePageIndex + 1}`);
        }
        console.log('✅ Page object retrieved successfully');

        const desiredWidth = 600;
        const viewport = page.getViewport({ scale: 1.0 });
        console.log('✅ Initial viewport:', viewport.width, 'x', viewport.height);
        
        if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
          throw new Error(`Invalid viewport for page ${activePageIndex + 1}`);
        }
        
        const scale = desiredWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });
        console.log('✅ Scaled viewport:', scaledViewport.width, 'x', scaledViewport.height, 'scale:', scale);
  
        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error('Canvas not available');
        }
        console.log('✅ Canvas element found');
  
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Canvas context not available');
        }
        console.log('✅ Canvas context obtained');
        
        // Clear canvas before rendering
        context.clearRect(0, 0, canvas.width, canvas.height);
        console.log('✅ Canvas cleared');
        
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;
        
        // Set canvas style dimensions for proper display
        canvas.style.width = `${scaledViewport.width}px`;
        canvas.style.height = `${scaledViewport.height}px`;
        console.log('✅ Canvas dimensions set:', canvas.width, 'x', canvas.height);
        
        setPreviewDimensions({
          width: scaledViewport.width, 
          height: scaledViewport.height
        });
        console.log('✅ Preview dimensions updated');
  
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
          background: 'white'
        };
        console.log('🔄 Starting PDF page render...');
        
        const renderTask = page.render(renderContext);
        await renderTask.promise;
        console.log('✅ Page rendered successfully!');
        
      } catch(error) {
        console.error("❌ Failed to render page", activePageIndex + 1, error);
      } finally {
        console.log('🔄 Setting loading to false');
        setIsLoading(false);
      }
    };

    renderPage();
  }, [pdfDoc, activePageIndex]);

  console.log('🔍 Current state - isLoading:', isLoading, 'pdfDoc:', !!pdfDoc, 'previewDimensions:', previewDimensions);

  const watermarkPos = fileInfo.pages[activePageIndex].watermarkPosition;

  return (
    <div className="absolute inset-0 flex flex-col items-center">
        <div className="flex-grow w-full bg-gray-200/50 rounded-lg flex items-center justify-center overflow-auto p-4 relative">
            {isLoading && (
              <div className="flex flex-col items-center justify-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                <div>Loading preview...</div>
              </div>
            )}
            <div 
              className={`relative transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`} 
              style={{
                width: previewDimensions.width || 'auto', 
                height: previewDimensions.height || 'auto',
                minWidth: isLoading ? 0 : previewDimensions.width,
                minHeight: isLoading ? 0 : previewDimensions.height
              }}
            >
                <canvas 
                  ref={canvasRef} 
                  className="rounded-md shadow-lg max-w-full max-h-full"
                  style={{
                    display: isLoading ? 'none' : 'block'
                  }}
                />
                {previewDimensions.width > 0 && !isLoading && (
                    <Rnd
                        size={{ width: watermarkPos.width, height: watermarkPos.height }}
                        position={{ x: watermarkPos.x, y: watermarkPos.y }}
                        onDragStop={(e, d) => {
                            onPositionChange(fileInfo.id, activePageIndex, { ...watermarkPos, x: d.x, y: d.y });
                        }}
                        onResizeStop={(e, direction, ref, delta, position) => {
                            const newWidth = parseInt(ref.style.width);
                            const newHeight = parseInt(ref.style.height);
                            
                            // Validate dimensions
                            if (newWidth > 0 && newHeight > 0) {
                              onPositionChange(fileInfo.id, activePageIndex, {
                                width: parseInt(ref.style.width),
                                height: parseInt(ref.style.height),
                                ...position,
                              });
                            }
                        }}
                        bounds="parent"
                        className="border-2 border-dashed border-primary-dark bg-white/10"
                        minWidth={100}
                        minHeight={50}
                    >
                        <div 
                            className="w-full h-full p-1 text-blue-900 whitespace-pre-wrap break-words overflow-hidden"
                            style={{
                                fontSize: `${watermarkSettings.fontSize}pt`,
                                opacity: watermarkSettings.opacity / 100,
                                lineHeight: 1.5
                            }}
                        >
                            <div className="font-bold">COPY SHARED - STRICTLY CONFIDENTIAL FOR</div>
                            <div className="font-bold">LIMITED USE AS DETAILED HEREUNDER</div>
                            <div>DATE: {watermarkSettings.date}</div>
                            <div>RECIPIENT: {watermarkSettings.recipient}</div>
                            <div>PURPOSE: {watermarkSettings.purpose || 'N/A'}</div>
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
