import "dotenv/config";

export default function getRandomAPI02IntanceURL() {
  const VariableEntornoName = Math.round(Math.random() * 4) + 1;

  switch (VariableEntornoName) {
    case 1:
      return process.env.NEXT_PUBLIC_API02_INS1_URL_BASE;
    case 2:
      return process.env.NEXT_PUBLIC_API02_INS2_URL_BASE;
    case 3:
      return process.env.NEXT_PUBLIC_API02_INS3_URL_BASE;
    case 4:
      return process.env.NEXT_PUBLIC_API02_INS4_URL_BASE;
    default:
      return process.env.NEXT_PUBLIC_API02_INS5_URL_BASE;
  }
}
