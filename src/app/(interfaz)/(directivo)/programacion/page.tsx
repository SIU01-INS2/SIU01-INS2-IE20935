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
        <h1 className="text-4xl sxs-only:text-2xl xs-only:text-3xl sm-only:text-3xl md-only:text-4xl text-negro font-bold text-left">
          Programación
        </h1>
      </div>

      {/* Contenedor principal centrado */}
      <div className="flex-1 flex items-center justify-center px-6 py-4 overflow-hidden">
        <div className="w-full max-w-7xl">
          {/* Grid de cards responsive */}
          <div className="grid grid-cols-1 sm-only:grid-cols-1 md-only:grid-cols-2 lg-only:grid-cols-3 xl-only:grid-cols-3 gap-8 sxs-only:gap-6 xs-only:gap-6 justify-items-center">
            {cards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                as={card.href}
                className="group bg-white shadow-lg hover:shadow-xl rounded-2xl transition-all duration-300 transform hover:-translate-y-1 w-full max-w-[380px] sxs-only:max-w-full xs-only:max-w-full"
              >
                {/* Card content */}
                <div className="p-8 sxs-only:p-6 xs-only:p-7 h-full flex flex-col items-center justify-center text-center min-h-[400px] sxs-only:min-h-[350px] xs-only:min-h-[370px] sm-only:min-h-[380px] md-only:min-h-[390px]">
                  {/* Título */}
                  <h3 className="text-2xl sxs-only:text-xl xs-only:text-xl sm-only:text-2xl font-bold text-negro mb-8 sxs-only:mb-6 xs-only:mb-7 leading-tight">
                    {card.title}
                  </h3>

                  {/* Contenedor del icono */}
                  <div className="flex-shrink-0 mb-8 sxs-only:mb-6 xs-only:mb-7">
                    <img
                      src={card.icon}
                      alt={card.title}
                      className="w-20 h-20 sxs-only:w-16 sxs-only:h-16 xs-only:w-18 xs-only:h-18 sm-only:w-20 sm-only:h-20 md-only:w-24 md-only:h-24 lg-only:w-24 lg-only:h-24 xl-only:w-28 xl-only:h-28 mx-auto object-contain group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>

                  {/* Descripción */}
                  <p className="text-lg sxs-only:text-base xs-only:text-base sm-only:text-lg text-gray-700 leading-relaxed">
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
