"use client";

import PlantillaLogin from "@/components/shared/PlantillaLogin";

export default function ResponsableLogin() {
  return (
    <PlantillaLogin
      endpoint="/api/login/responsable"
      rol="RESPONSABLE(Padre/Apoderado)"
      siasisAPI="API02"
    />
  );
}
