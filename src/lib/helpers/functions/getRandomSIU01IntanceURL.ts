import "dotenv/config";

export default function getRandomSIU01IntanceURL() {
  const VariableEntornoName = Math.round(Math.random() * 4) + 1;

  switch (VariableEntornoName) {
    case 1:
      return process.env.NEXT_PUBLIC_SIU01_INS1_URL_BASE;
    case 2:
      return process.env.NEXT_PUBLIC_SIU01_INS2_URL_BASE;
    case 3:
      return process.env.NEXT_PUBLIC_SIU01_INS3_URL_BASE;
    case 4:
      return process.env.NEXT_PUBLIC_SIU01_INS4_URL_BASE;
    default:
      return process.env.NEXT_PUBLIC_SIU01_INS5_URL_BASE;
  }
}
