"use client";

import PlantillaLogin from "@/components/shared/PlantillaLogin";

export default function ProfesorPrimariaLogin() {
  return (
    <PlantillaLogin
      rol="PROFESOR DE PRIMARIA"
      siasisAPI="API01"
      endpoint="/api/login/profesor-primaria"
    />
  );
}
