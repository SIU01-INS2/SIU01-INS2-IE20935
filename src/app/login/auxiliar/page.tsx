

import PlantillaLogin from "@/components/shared/PlantillaLogin";

export default function AuxiliarLogin() {
  return (
    <PlantillaLogin
      endpoint="/api/login/auxiliar"
      rol="AUXILIAR"
      siasisAPI="API01"
    />
  );
}
