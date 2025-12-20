export interface Spurt {
  id: string;
  text: string;
  createdAt: number;
  duration: number;
}

export type ViewMode = 'wall' | 'ordered' | 'reversed';

export interface StreamData {
  id: string;
  title: string;
  spurts: Spurt[];
  viewMode: ViewMode;
}

export interface BlockProps {
  delayThreshold: number;
  onSpurt: (spurt: Spurt) => void;
}
