
import PlantillaLogin from "@/components/shared/PlantillaLogin";

export default function DirectivoLogin() {
  return (
    <PlantillaLogin
      siasisAPI="API01"
      rol="DIRECTIVO"
      endpoint="/api/login/directivo"
    />
  );
}
