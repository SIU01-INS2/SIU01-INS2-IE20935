import "dotenv/config";

export default function getRandomAPI01IntanceURL() {
  const VariableEntornoName = Math.round(Math.random() * 2) + 1;

  switch (VariableEntornoName) {
    case 1:
      return process.env.NEXT_PUBLIC_API01_INS1_URL_BASE;
    case 2:
      return process.env.NEXT_PUBLIC_API01_INS2_URL_BASE;
    default:
      return process.env.NEXT_PUBLIC_API01_INS3_URL_BASE;
  }
}
