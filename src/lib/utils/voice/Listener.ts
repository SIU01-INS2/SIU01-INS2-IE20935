import {
  IWindow,
  SpeechRecognition,
  SpeechRecognitionEvent,
} from "./commands/CommandVoices.interface";
import { Speaker } from "./Speaker";

export class Listener {
  private static instance: Listener | null = null;
  private interrumpible: boolean = true;
  public currentCallbackOnResult?: (transcript: string) => void;
  private callbackStop?: () => void;
  private callbackStart?: () => void;
  private speaker: Speaker = Speaker.getInstance();
  private currentRecognizer?: SpeechRecognition;
  private constructor() {}

  // Método para obtener la instancia única de Listener
  public static getInstance(): Listener {
    if (!Listener.instance) {
      Listener.instance = new Listener();
    }
    return Listener.instance;
  }

  /**
   * Inicia el reconocimiento de voz.
   * @param callback Función opcional a ejecutar con el resultado de la síntesis.
   */
  public start(
    callback?: (transcript: string) => void,
    interrumpible: boolean = true
  ) {
    if (!this.interrumpible) return;

    this.interrumpible = interrumpible;
    this.currentCallbackOnResult = callback;

    const windowWithSpeech = window as unknown as IWindow;
    const SpeechRecognition =
      windowWithSpeech.SpeechRecognition ||
      windowWithSpeech.webkitSpeechRecognition;

    // Crear una nueva instancia de SpeechRecognition cada vez que se llama a start
    const recognition = new SpeechRecognition();
    this.currentRecognizer = recognition;
    recognition.lang = "es-ES";
    recognition.interimResults = false; // Solo resultados finales
    recognition.continuous = false; // Detenerse tras un solo resultado

    // Manejo del evento cuando se produce un resultado
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = event.results[0][0].transcript;
      transcript = transcript.replace(/\.$/, ""); // Eliminar el punto final si existe
      transcript = transcript.toLowerCase();
      this.currentCallbackOnResult?.(transcript);
    };

    recognition.onend = () => {
      // this.callbackStop?.();
    };

    // Evento que se activa cuando no se detecta sonido o el usuario guarda silencio
    recognition.onsoundend = () => {
      this.callbackStop?.();
      // this.speaker.start("No se detectó ningún sonido. Intenta hablar de nuevo.");
    };

    recognition.onerror = (event) => {
      try {
        if (event.error === "aborted") {
          console.log(
            "El reconocimiento de voz fue abortado intencionalmente."
          );
        } else {
          this.speaker.start(
            "Ocurrió un error al reconocer tu voz. Intenta nuevamente.",
            () => {
              this.callbackStop?.();
            }
          );
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        alert("Ocurrió un error al reconocer tu voz. Intenta nuevamente.");
        this.callbackStop?.();
      }
    };

    recognition.start();
    this.callbackStart?.();
  }

  set onStop(callback: () => void) {
    this.callbackStop = callback;
  }
  set onStart(callback: () => void) {
    this.callbackStart = callback;
  }

  /**
   * Método para interrumpir el reconocimiento de voz en curso
   */
  public stop() {
    this.callbackStop?.();
    this.currentRecognizer?.abort();
    // No es necesario llamar a `recognition.stop()` porque se crea una nueva instancia en cada `start`
  }
}
