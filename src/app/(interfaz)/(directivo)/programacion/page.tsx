import Link from "next/link";

const Programacion = () => {
  return (
    <>
      <Link
        href={"programacion/gestion-fechas-escolares"}
        as={"programacion/gestion-fechas-escolares"}
      >
        GestionFechasEscolares
      </Link>
    </>
  );
};

export default Programacion;
