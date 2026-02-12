
export interface Status {
  message: string;
  type: 'success' | 'error';
}

export interface HistoryEntry {
  action: string;
  imageSrc: string;
}

export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MarginInfo {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface Point {
    x: number;
    y: number;
}
