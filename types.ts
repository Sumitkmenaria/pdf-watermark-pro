
export interface WatermarkPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PageInfo {
  pageNumber: number;
  watermarkPosition: WatermarkPosition;
  previewUrl?: string; // Optional: To store canvas data URL for faster switching
}

export interface FileInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  totalPages: number;
  pages: PageInfo[];
  password?: string;
}

export interface WatermarkSettings {
  date: string;
  recipient: string;
  purpose: string;
  fontSize: number;
  boxWidth: number;
  opacity: number;
}