import { Link } from "next-view-transitions";
import React from "react";

const ControlAsistenciaPersonalMenu = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full py-4 px-12 sxs-only:px-3 xs-only:px-5 sm-only:px-8">
      <h1 className="text-[2rem] sxs-only:text-[1.5rem] xs-only:text-[1.7rem] font-semibold text-center leading-9">
        CONTROL DE ASISTENCIA
      </h1>

      <div className="flex gap-16 sxs-only:gap-8 xs-only:gap-10 sm-only:gap-12 mt-10 sxs-only:mt-5 xs-only:mt-8 sm-only:mt-9 w-full flex-wrap justify-center items-stretch sxs-only:flex-col xs-only:flex-col sm-only:flex-col">
        <Link
          href={"/control-asistencia-personal/tomar-asistencia"}
          as={"/control-asistencia-personal/tomar-asistencia"}
          className="group flex flex-1 siasis-shadow-card rounded-[12px] flex-col justify-center items-center gap-4 p-6 py-7 sxs-only:p-4 sxs-only:py-5 xs-only:p-5 xs-only:py-6 max-w-[min(25rem,80vw)] xl-only:max-w-[30rem] transform hover:-translate-y-1"
        >
          <img
            src="/images/svg/PersonalReloj.svg"
            alt="Personal con reloj en mano"
            className="h-[5rem] sxs-only:h-[3.5rem] xs-only:h-[4rem] xl-only:h-[6rem] aspect-auto bg-cover transition-transform duration-300 group-hover:scale-110"
          />
          <h2 className="text-center font-semibold text-[1.2rem] sxs-only:text-[1rem] xs-only:text-[1.1rem] xl-only:text-[1.4rem]">
            Toma de Asistencia de Personal
          </h2>
          <p className="text-[0.9rem] sxs-only:text-[0.8rem] xs-only:text-[0.85rem] xl-only:text-[1rem] flex-1 flex items-center justify-center leading-normal sxs-only:leading-tight xs-only:leading-snug">
            Registra aquí la entrada y salida diaria del personal. Al iniciar el
            proceso, cada profesor, auxiliar o administrativo podrá seleccionar
            su rol y marcar su llegada o partida con solo unos clics. El sistema
            captura automáticamente la hora exacta de cada registro,
            identificando puntualidad o tardanza según corresponda.
          </p>
        </Link>

        <Link
          href={"/control-asistencia-personal/monitoreo"}
          as={"/control-asistencia-personal/monitoreo"}
          className="group flex flex-1 siasis-shadow-card rounded-[12px] flex-col justify-center items-center gap-4 p-6 py-7 sxs-only:p-4 sxs-only:py-5 xs-only:p-5 xs-only:py-6 max-w-[min(25rem,80vw)] xl-only:max-w-[30rem] transform hover:-translate-y-1"
        >
          <img
            src="/images/svg/PersonaMonitoreando.svg"
            alt="Personal Monitoreando"
            className="h-[5rem] sxs-only:h-[3.5rem] xs-only:h-[4rem] xl-only:h-[6rem] aspect-auto bg-cover transition-transform duration-300 group-hover:scale-110"
          />
          <h2 className="text-center font-semibold text-[1.2rem] sxs-only:text-[1rem] xs-only:text-[1.1rem] xl-only:text-[1.4rem]">
            Monitoreo de Asistencia del Personal
          </h2>
          <p className="text-[0.9rem] sxs-only:text-[0.8rem] xs-only:text-[0.85rem] xl-only:text-[1rem] flex-1 flex items-center justify-center leading-normal sxs-only:leading-tight xs-only:leading-snug">
            Visualiza en tiempo real quién está presente hoy. Este panel muestra
            instantáneamente qué miembros del personal han registrado su entrada
            o salida, actualizándose automáticamente con cada nueva marcación.
            Observa la lista completa de registros con sus respectivas horas,
            facilitando el seguimiento de la presencia del personal en la
            institución durante toda la jornada.
          </p>
        </Link>
      </div>
    </div>
  );
};

export default ControlAsistenciaPersonalMenu;
