
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { FileInfo, WatermarkSettings, PageInfo, WatermarkPosition } from './types';
import FileUploader from './components/FileUploader';
import PdfPreviewer from './components/PdfPreviewer';
import SettingsPanel from './components/SettingsPanel';
import { RotateCcw, FileText, X, Copy, Check, Upload } from 'lucide-react';

const Header: React.FC<{ onRestart: () => void }> = ({ onRestart }) => (
    <header className="bg-white shadow-sm flex-shrink-0">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                    <h1 className="text-primary-dark text-xl font-bold">PDF Watermark Pro</h1>
                </div>
                <div>
                   <button onClick={onRestart} className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors font-medium">
                        <RotateCcw className="h-4 w-4" />
                        <span>Restart</span>
                    </button>
                </div>
            </div>
        </div>
    </header>
);

const getWatermarkHeight = (fontSize: number) => Math.round(fontSize * 12);

const App: React.FC = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  const getInitialSettings = (): WatermarkSettings => ({
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/ /g, '-'),
    recipient: localStorage.getItem('watermarkRecipient') || '',
    purpose: localStorage.getItem('watermarkPurpose') || '',
    fontSize: 8,
    boxWidth: 258,
    opacity: 88,
  });

  const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>(getInitialSettings());

  useEffect(() => {
    localStorage.setItem('watermarkRecipient', watermarkSettings.recipient);
  }, [watermarkSettings.recipient]);

  useEffect(() => {
    localStorage.setItem('watermarkPurpose', watermarkSettings.purpose);
  }, [watermarkSettings.purpose]);
  
  const activeFile = useMemo(() => files.find(f => f.id === activeFileId), [files, activeFileId]);

  const handleFilesAdded = useCallback(async (acceptedFiles: File[]) => {
    const newFiles: FileInfo[] = [];
    for (const file of acceptedFiles) {
      if (file.type !== 'application/pdf') continue;

      try {
        const fileBuffer = await file.arrayBuffer();
        const pdfjsDoc = await (window as any).pdfjsLib.getDocument({ data: fileBuffer }).promise;
        const totalPages = pdfjsDoc.numPages;

        const pages: PageInfo[] = Array.from({ length: totalPages }, (_, i) => ({
          pageNumber: i + 1,
          watermarkPosition: { x: 50, y: 550, width: watermarkSettings.boxWidth, height: getWatermarkHeight(watermarkSettings.fontSize) },
        }));

        const newFileInfo: FileInfo = {
          id: `${file.name}-${Date.now()}`,
          file,
          name: file.name,
          size: file.size,
          totalPages,
          pages,
        };
        newFiles.push(newFileInfo);

      } catch (error) {
        console.error("Failed to process file:", file.name, error);
        alert(`Could not process ${file.name}. It might be corrupted or not a valid PDF.`);
      }
    }

    setFiles(f => [...f, ...newFiles]);
    if (!activeFileId && newFiles.length > 0) {
      setActiveFileId(newFiles[0].id);
      setActivePageIndex(0);
    }
  }, [activeFileId, watermarkSettings.boxWidth, watermarkSettings.fontSize]);
  
  const handlePositionChange = useCallback((fileId: string, pageIndex: number, pos: WatermarkPosition) => {
    setFiles(currentFiles =>
      currentFiles.map(f => {
        if (f.id === fileId) {
          const newPages = [...f.pages];
          newPages[pageIndex].watermarkPosition = { ...pos };
          return { ...f, pages: newPages };
        }
        return f;
      })
    );
    
    if (fileId === activeFileId && pageIndex === activePageIndex) {
        setWatermarkSettings(s => ({...s, boxWidth: pos.width}));
    }
  }, [activeFileId, activePageIndex]);
  
  const updateActiveWatermarkPosition = useCallback((newPos: Partial<WatermarkPosition>) => {
      if (!activeFileId) return;
      setFiles(currentFiles =>
          currentFiles.map(f => {
              if (f.id === activeFileId) {
                  const newPages = [...f.pages];
                  const currentPageIndex = activePageIndex;
                  newPages[currentPageIndex].watermarkPosition = {
                      ...newPages[currentPageIndex].watermarkPosition,
                      ...newPos
                  };
                  return { ...f, pages: newPages };
              }
              return f;
          })
      );
  }, [activeFileId, activePageIndex]);

  useEffect(() => {
      if (!activeFile) return;
      const newHeight = getWatermarkHeight(watermarkSettings.fontSize);
      const currentPosition = activeFile.pages[activePageIndex].watermarkPosition;
      if (currentPosition.height !== newHeight) {
          updateActiveWatermarkPosition({ height: newHeight });
      }
  }, [watermarkSettings.fontSize, activeFile, updateActiveWatermarkPosition, activePageIndex]);

  useEffect(() => {
      if (!activeFile) return;
      const currentPosition = activeFile.pages[activePageIndex].watermarkPosition;
      if (currentPosition.width !== watermarkSettings.boxWidth) {
          updateActiveWatermarkPosition({ width: watermarkSettings.boxWidth });
      }
  }, [watermarkSettings.boxWidth, activeFile, updateActiveWatermarkPosition, activePageIndex]);
  
  const applyPositionToAllPages = () => {
      if (!activeFile) return;
      const currentPosition = activeFile.pages[activePageIndex].watermarkPosition;
      setFiles(currentFiles =>
          currentFiles.map(f => {
              if (f.id === activeFileId) {
                  const newPages = f.pages.map(p => ({
                      ...p,
                      watermarkPosition: { ...currentPosition }
                  }));
                  return { ...f, pages: newPages };
              }
              return f;
          })
      );
      alert("Watermark position applied to all pages of the current document.");
  };

  const handleApplyWatermark = async () => {
    if (!activeFile) return;
    setIsProcessing(true);

    try {
      const fileBuffer = await activeFile.file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const watermarkText = `COPY SHARED - STRICTLY CONFIDENTIAL FOR
LIMITED USE AS DETAILED HEREUNDER
DATE: ${watermarkSettings.date}
RECIPIENT: ${watermarkSettings.recipient}
PURPOSE: ${watermarkSettings.purpose || 'N/A'}`;
      const textLines = watermarkText.split('\n');

      for (let i = 0; i < activeFile.totalPages; i++) {
        const page = pdfDoc.getPages()[i];
        const { width: pageWidth, height: pageHeight } = page.getSize();
        
        const previewWidth = 600; 
        const scaleFactor = pageWidth / previewWidth;
        
        const pos = activeFile.pages[i].watermarkPosition;

        // In the preview, the Rnd component has a 2px border. The inner div has p-1 (4px) padding.
        // Total offset from the Rnd position handles this visual difference.
        const previewOffset = 6; // px
        const pdfOffset = previewOffset * scaleFactor; // in points
        
        const x = (pos.x * scaleFactor) + pdfOffset;
        const y_top_of_box = pageHeight - (pos.y * scaleFactor);
        
        const fontSize = watermarkSettings.fontSize;
        const line_height = fontSize * 1.5;

        // Ascent is the distance a font extends above the baseline.
        // The previous dynamic calculation `((font.ascent / font.unitsPerEm) * size)` was failing
        // because font properties were not reliably available, leading to a `NaN` value for `ascent`
        // and causing the entire watermark application to fail.
        // Using a fixed, standard ascent ratio for Helvetica (0.718) is a robust workaround
        // that prevents this error and ensures consistent positioning.
        const ascent = 0.718 * fontSize;
        
        // Start from top of box, adjust for padding/border, then for font ascent to find the first baseline.
        let currentY = y_top_of_box - pdfOffset - ascent;

        textLines.forEach((line) => {
             const font = (line.startsWith("COPY SHARED") || line.startsWith("LIMITED USE")) ? helveticaBoldFont : helveticaFont;
             page.drawText(line, {
                x: x,
                y: currentY,
                font: font,
                size: fontSize,
                color: rgb(0, 0.18, 0.39),
                opacity: watermarkSettings.opacity / 100,
            });
            currentY -= line_height;
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${activeFile.name.replace('.pdf', '')}-watermarked.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);

    } catch (error) {
      console.error("Failed to apply watermark:", error);
      alert("An error occurred while applying the watermark. The PDF might be encrypted or corrupted.");
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(currentFiles => {
        const remainingFiles = currentFiles.filter(f => f.id !== fileId);
        if (activeFileId === fileId) {
            setActiveFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null);
            setActivePageIndex(0);
        }
        return remainingFiles;
    });
  };

  const handleRestart = () => {
    if (window.confirm('Are you sure you want to restart? All uploaded files and progress will be lost.')) {
        setFiles([]);
        setActiveFileId(null);
        setActivePageIndex(0);

        localStorage.removeItem('watermarkRecipient');
        localStorage.removeItem('watermarkPurpose');

        setWatermarkSettings({
            ...getInitialSettings(),
            recipient: '',
            purpose: '',
        });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header onRestart={handleRestart} />
      <main className="flex-grow flex flex-row p-4 gap-4 overflow-hidden">
        {files.length === 0 ? (
          <FileUploader onFilesAdded={handleFilesAdded} />
        ) : (
          <>
            <div className="flex-grow bg-white rounded-lg shadow p-6 flex flex-col">
              <div className="mb-4 flex-shrink-0">
                <div className="flex items-center gap-2 flex-wrap border-b pb-4">
                  {files.map(file => (
                    <button
                      key={file.id}
                      className={`py-2 px-3 rounded-md text-sm flex items-center gap-2 transition-colors ${activeFileId === file.id ? 'bg-primary text-white shadow' : 'bg-gray-100 hover:bg-gray-200'}`}
                      onClick={() => { setActiveFileId(file.id); setActivePageIndex(0); }}
                    >
                      <FileText size={14}/>
                      <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); removeFile(file.id); }} className={`ml-1 p-0.5 rounded-full ${activeFileId === file.id ? 'hover:bg-primary-light' : 'hover:bg-red-100 text-red-500'}`}>
                          <X className="h-3.5 w-3.5" />
                      </button>
                    </button>
                  ))}
                  <label htmlFor="file-upload-input" className="py-2 px-3 rounded-md text-sm flex items-center gap-2 bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors cursor-pointer">
                      <Upload size={14} /> Add More
                  </label>
                  <input type="file" id="file-upload-input" multiple accept=".pdf" className="hidden" onChange={(e) => handleFilesAdded(Array.from(e.target.files || []))} />
                </div>
              </div>
              
              {activeFile && (
                <div className="flex-grow relative min-h-0">
                    <PdfPreviewer
                      key={`${activeFile.id}-${activePageIndex}`}
                      fileInfo={activeFile}
                      activePageIndex={activePageIndex}
                      setActivePageIndex={setActivePageIndex}
                      watermarkSettings={watermarkSettings}
                      onPositionChange={handlePositionChange}
                    />
                </div>
              )}
            </div>
            
            <div className="w-96 bg-white rounded-lg shadow p-6 flex flex-col flex-shrink-0">
                <SettingsPanel 
                  settings={watermarkSettings} 
                  setSettings={setWatermarkSettings} 
                  onApplyWatermark={handleApplyWatermark}
                  onApplyToAll={applyPositionToAllPages}
                  isProcessing={isProcessing}
                />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
