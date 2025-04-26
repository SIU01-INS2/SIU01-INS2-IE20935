export interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// Interfaz para la API de reconocimiento de voz
export interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void; // Evento para el final del reconocimiento
  onspeechend: () => void; // Evento para detectar el final del habla
  onsoundend: () => void; // Evento para detectar el final del habla
}

// Interfaz para el evento de resultado
export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

// Interfaz extendida de Window
export interface IWindow extends Window {
  SpeechRecognition: SpeechRecognitionConstructor;
  webkitSpeechRecognition: SpeechRecognitionConstructor;
}

// Interfaz para el evento de error con tipos específicos para el campo error
export interface SpeechRecognitionErrorEvent extends Event {
  error:
    | "no-speech"
    | "audio-capture"
    | "aborted"
    | "network"
    | "not-allowed"
    | "service-not-allowed"
    | "bad-grammar"
    | "language-not-supported";
  message: string;
}
