import Link from "next/link";

const cards = [
  {
    title: "Gestión de Fechas Escolares",
    description:
      "Administra las fechas clave del calendario escolar, incluyendo el inicio de clases y periodos de vacaciones.",
    icon: "/images/svg/GestiónDeFechasEscolares.svg",
    href: "programacion/gestion-fechas-escolares",
  },
  {
    title: "Gestión de Horarios de Asistencia Escolares",
    description:
      "Configura y edita los horarios de registro de asistencia para los niveles de primaria y secundaria.",
    icon: "/images/svg/AsistenciaEscolares.svg",
    href: "programacion/gestion-horarios-asistencia",
  },
  {
    title: "Gestión de Horarios Laborales",
    description:
      "Administra y ajusta los horarios laborales de los profesores de primaria, secundaria y auxiliares.",
    icon: "/images/svg/HorarioLaboral.svg",
    href: "programacion/gestion-horarios-laborales",
  },
];

const Programacion = () => {
  return (
    <div className="w-full h-full flex flex-col">
      {/* Título */}
      <div className="flex-shrink-0 px-6 pt-8 pb-6">
        <h1 className="text-4xl sxs-only:text-2xl xs-only:text-3xl sm-only:text-3xl md-only:text-4xl lg-only:text-4xl xl-only:text-4xl text-negro font-bold text-left">
          Programación
        </h1>
      </div>

      {/* Contenedor principal centrado */}
      <div className="flex-1 flex items-center justify-center px-6 py-4 overflow-hidden">
        <div className="w-full max-w-7xl">
          {/* Grid de cards responsive */}
          <div className="grid grid-cols-1 sxs-only:grid-cols-1 xs-only:grid-cols-1 sm-only:grid-cols-1 md-only:grid-cols-2 lg-only:grid-cols-3 xl-only:grid-cols-3 gap-8 sxs-only:gap-5 xs-only:gap-5 sm-only:gap-6 md-only:gap-7 lg-only:gap-8 xl-only:gap-8 justify-items-center">
            {cards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                as={card.href}
                className="group bg-white siasis-shadow-card rounded-2xl transform hover:-translate-y-1 w-full max-w-[260px] sxs-only:max-w-full xs-only:max-w-full sm-only:max-w-full md-only:max-w-[260px] lg-only:max-w-[260px] xl-only:max-w-[380px]"
              >
                {/* Card content */}
                <div className="p-5 sxs-only:p-4 xs-only:p-4 sm-only:p-4 md-only:p-5 lg-only:p-5 xl-only:p-8 h-full flex flex-col items-center justify-center text-center min-h-[280px] sxs-only:min-h-[240px] xs-only:min-h-[260px] sm-only:min-h-[270px] md-only:min-h-[280px] lg-only:min-h-[290px] xl-only:min-h-[400px]">
                  {/* Título */}
                  <h3 className="text-lg sxs-only:text-base xs-only:text-lg sm-only:text-lg md-only:text-lg lg-only:text-xl xl-only:text-2xl font-bold text-negro mb-5 sxs-only:mb-4 xs-only:mb-4 sm-only:mb-4 md-only:mb-5 lg-only:mb-6 xl-only:mb-8 leading-tight">
                    {card.title}
                  </h3>

                  {/* Contenedor del icono */}
                  <div className="flex-shrink-0 mb-5 sxs-only:mb-4 xs-only:mb-4 sm-only:mb-4 md-only:mb-5 lg-only:mb-6 xl-only:mb-8">
                    <img
                      src={card.icon}
                      alt={card.title}
                      className="w-12 h-12 sxs-only:w-10 sxs-only:h-10 xs-only:w-11 xs-only:h-11 sm-only:w-12 sm-only:h-12 md-only:w-13 md-only:h-13 lg-only:w-14 lg-only:h-14 xl-only:w-20 xl-only:h-20 mx-auto object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Descripción */}
                  <p className="text-sm sxs-only:text-xs xs-only:text-sm sm-only:text-sm md-only:text-sm lg-only:text-sm xl-only:text-lg text-gray-700 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Programacion;
