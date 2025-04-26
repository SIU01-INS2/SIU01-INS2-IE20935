export class CommandVoice {
  // public static callback1?: (searcherResults: SubseccionSearchResult[]) => void;
  public static getCurrentPath?: () => string;

  // public static iterateNext: boolean = false;
  constructor(
    private variantCommands: string[],
    public action: () => Promise<null | boolean>,
    public finalPhrase?: string
  ) {}

  testTranscrip(transcript: string) {
    return this.variantCommands.includes(transcript);
  }
}
