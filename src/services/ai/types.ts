export interface Character {
  id: string;
  name?: string;
  age?: string;
  role?: string;
  description: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax]
}

export interface AIService {
  segmentDrawing(base64Image: string): Promise<Character[]>;
  generateStoryImage(prompt: string, referenceImage?: string): Promise<string | null>;
}

export interface ChatCallbacks {
  onAudioChunk?: (base64Audio: string) => void;
  onInterrupted?: () => void;
  onHighlightCharacter?: (id: string) => void;
  onUpdateCharacterInfo?: (id: string, info: { name?: string; age?: string; role?: string }) => void;
  onGenerateImage?: (prompt: string) => void;
  onTranscription?: (text: string, isUser: boolean) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: any) => void;
}

export interface ChatService {
  connect(systemInstruction: string): Promise<void>;
  sendAudio(base64Audio: string): void;
  sendImage(base64Image: string): void;
  close(): void;
}
