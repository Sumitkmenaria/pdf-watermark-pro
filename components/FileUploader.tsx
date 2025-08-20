
import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploaderProps {
  onFilesAdded: (files: File[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesAdded }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(Array.from(e.dataTransfer.files));
    }
  }, [onFilesAdded]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onFilesAdded(Array.from(e.target.files));
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div 
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl transition-colors ${isDragging ? 'border-primary bg-primary-light/10' : 'border-gray-300 bg-white'}`}
      >
        <UploadCloud className={`w-16 h-16 mb-4 transition-colors ${isDragging ? 'text-primary' : 'text-gray-400'}`} />
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Drag & Drop Your PDFs Here</h2>
        <p className="text-gray-500 mb-6">or click to select files</p>
        <input type="file" id="file-uploader" className="hidden" multiple accept=".pdf" onChange={handleFileChange} />
        <label htmlFor="file-uploader" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg cursor-pointer transition-colors">
          Browse Files
        </label>
      </div>
    </div>
  );
};

export default FileUploader;
