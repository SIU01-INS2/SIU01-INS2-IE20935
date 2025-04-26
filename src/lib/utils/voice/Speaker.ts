export class Speaker {
  private static instance: Speaker | null = null;
  private synth: SpeechSynthesis;

  private interrumpible: boolean = true;
  public currentCallback?: () => void;
  private callbackStop?: () => void;
  private callbackStart?: () => void;

  // Constructor privado para evitar instanciación directa
  private constructor() {
    if (!window?.speechSynthesis) {
      throw new Error("SpeechSynthesis no está disponible en este navegador.");
    }
    this.synth = window.speechSynthesis;
  }

  // Método para obtener la instancia única
  public static getInstance(): Speaker {
    if (!Speaker.instance) {
      Speaker.instance = new Speaker();
    }
    return Speaker.instance;
  }

  /**
   * Este método reproduce el mensaje de voz.
   * @param message Texto a sintetizar.
   * @param callback Función opcional a ejecutar al finalizar la síntesis.
   * @param interrumpible Indica si la síntesis se puede interrumpir.
   * @returns El objeto SpeechSynthesis si es interrumpible, o undefined si no lo es.
   */
  public start(
    message: string,
    callback?: () => void,
    interrumpible: boolean = true
  ) {
    if (!this.interrumpible) return;

    this.stop();

    this.interrumpible = interrumpible;


    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = "es-ES";
    this.currentCallback = callback;
    // Al finalizar la síntesis, se cambia speaking a false y se ejecuta el callback
    utterance.onend = () => {

      this.callbackStop?.();
      callback?.();
    };
    this.synth.speak(utterance);
    
    this.callbackStart?.();
  }

  /**
   * Método para interrumpir la síntesis de voz en curso
   * @param omitToCallback Este parametro sirve para especificar si despues de la parilacion del speaker se debe ejecutar un callback
   */
  public stop(omitToCallback: boolean = false) {
    if (this.interrumpible) {
      this.synth.cancel();
      this.callbackStop?.();

      if (omitToCallback) {
        this.currentCallback?.();
      }
    }
  }

  set onStop(callback: () => void) {
    this.callbackStop = callback;
  }

  set onStart(callback: () => void) {
    this.callbackStart = callback;
  }

  public silenceOmit() {}
}
