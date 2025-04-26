import "dotenv/config";

export default function getRandomAPI03IntanceURL() {
  const NumeroInstancia = 1;

  switch (NumeroInstancia) {
    case 1:
      return process.env.NEXT_PUBLIC_API03_URL_BASE!;

    default:
      return process.env.NEXT_PUBLIC_API03_URL_BASE!;
  }
}
