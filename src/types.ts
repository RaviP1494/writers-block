// types.ts

export interface Spurt {
  id: string;
  text: string;
  createdAt: number;
  duration: number; // Pure typing time (end of typing - start of typing)
  isParagraphStart: boolean; // Does this trigger a new visual block?
}

export type ViewMode = 'wall' | 'ordered' | 'reversed';

export interface StreamData {
  id: string;
  title: string;
  spurts: Spurt[];
  viewMode: ViewMode;
  minimized?: boolean; // <--- NEW: Tracks if the stream is in the taskbar
}

export interface BlockProps {
  delayThreshold: number;     // Time to wait before cutting (end of Spurt)
  paragraphThreshold: number; // Time to wait before cutting a Set (end of Paragraph)
  onSpurt: (spurt: Partial<Spurt>) => void; // Partial because App handles ID/Paragraph logic
}
