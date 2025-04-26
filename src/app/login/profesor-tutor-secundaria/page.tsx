"use client";

import PlantillaLogin from "@/components/shared/PlantillaLogin";

export default function ProfesorTutorSecundariaLogin() {
  return (
    <PlantillaLogin
      rol="PROFESOR/TUTOR(Secundaria)"
      endpoint="/api/login/profesor-tutor-secundaria"
      siasisAPI="API01"
    />
  );
}
