import { IWindow, SpeechRecognitionEvent } from "./commands/CommandVoices.interface";
import { Speaker } from "./Speaker";

export class VoiceConverterActuator {
  private speaker: Speaker = Speaker.getInstance();

  constructor() {}

  start(callback: (transcript: string) => void) {
    if (typeof window === "undefined") return;
    const windowWithSpeech = window as unknown as IWindow;
    const SpeechRecognition =
      windowWithSpeech.SpeechRecognition ||
      windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.speaker.start(
        "Lo siento, tu navegador no es compatible con los comandos de voz."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.start();

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      callback(transcript);
    };
  }
}
