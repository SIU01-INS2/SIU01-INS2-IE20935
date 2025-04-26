import PlantillaLogin from "@/components/shared/PlantillaLogin";

export default function PersonalAdministrativoLogin() {
  return (
    <PlantillaLogin
      endpoint="/api/login/personal-administrativo"
      rol="PERSONAL ADMINISTRATIVO"
      siasisAPI="API01"
    />
  );
}
