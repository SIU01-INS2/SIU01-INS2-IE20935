import {
  AuxiliaresParaTomaDeAsistencia,
  DirectivoAsistenciaResponse,
  HorarioTomaAsistencia,
  ProfesoresPrimariaParaTomaDeAsistencia,
  ProfesorTutorSecundariaParaTomaDeAsistencia,
} from "@/interfaces/shared/Asistencia/DatosAsistenciaHoyIE20935";
import { HandlerAsistenciaBase } from "./HandlerDatosAsistenciaBase";
import { NivelEducativo } from "@/interfaces/shared/NivelEducativo";
import { Genero } from "@/interfaces/shared/Genero";
import { PersonalParaTomarAsistencia } from "@/components/asistencia-personal/ItemTomaAsistencia";
import { ModoRegistro } from "@/interfaces/shared/ModoRegistroPersonal";
import { ActoresSistema } from "@/interfaces/shared/ActoresSistema";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import { PersonalAdministrativoParaTomaDeAsistencia } from "../../../../../../../interfaces/shared/Asistencia/DatosAsistenciaHoyIE20935";

export class HandlerDirectivoAsistenciaResponse extends HandlerAsistenciaBase {
  private directivoData: DirectivoAsistenciaResponse;

  constructor(asistenciaData: DirectivoAsistenciaResponse) {
    super(asistenciaData);
    this.directivoData = asistenciaData;
  }

  public getPersonalAdministrativo(): PersonalAdministrativoParaTomaDeAsistencia[] {
    return this.directivoData.ListaDePersonalesAdministrativos || [];
  }

  public buscarPersonalAdministrativoPorDNI(
    dni: string
  ): PersonalAdministrativoParaTomaDeAsistencia | null {
    return (
      this.getPersonalAdministrativo().find(
        (personal) => personal.DNI_Personal_Administrativo === dni
      ) || null
    );
  }

  public filtrarPersonalPorCargo(
    cargo: string
  ): PersonalAdministrativoParaTomaDeAsistencia[] {
    return this.getPersonalAdministrativo().filter(
      (personal) => personal.Cargo === cargo
    );
  }

  public getProfesoresPrimaria(): ProfesoresPrimariaParaTomaDeAsistencia[] {
    return this.directivoData.ListaDeProfesoresPrimaria || [];
  }

  public getAuxliares(): AuxiliaresParaTomaDeAsistencia[] {
    return this.directivoData.ListaDeAuxiliares || [];
  }

  public buscarProfesorPrimariaPorDNI(
    dni: string
  ): ProfesoresPrimariaParaTomaDeAsistencia | null {
    return (
      this.getProfesoresPrimaria().find(
        (profesor) => profesor.DNI_Profesor_Primaria === dni
      ) || null
    );
  }

  public getProfesoresSecundaria(): ProfesorTutorSecundariaParaTomaDeAsistencia[] {
    return this.directivoData.ListaDeProfesoresSecundaria || [];
  }

  public buscarProfesorSecundariaPorDNI(
    dni: string
  ): ProfesorTutorSecundariaParaTomaDeAsistencia | null {
    return (
      this.getProfesoresSecundaria().find(
        (profesor) => profesor.DNI_Profesor_Secundaria === dni
      ) || null
    );
  }

  public getHorarioTomaAsistenciaGeneral(): HorarioTomaAsistencia {
    return this.directivoData.HorariosLaboraresGenerales
      .TomaAsistenciaRangoTotalPersonales;
  }

  public getHorarioTomaAsistenciaPrimaria(): HorarioTomaAsistencia {
    return this.directivoData.HorariosLaboraresGenerales
      .TomaAsistenciaProfesorPrimaria;
  }

  public getHorarioTomaAsistenciaAuxiliares(): HorarioTomaAsistencia {
    return this.directivoData.HorariosLaboraresGenerales
      .TomaAsistenciaAuxiliares;
  }

  public getHorarioEscolar(
    nivel: NivelEducativo
  ): HorarioTomaAsistencia | null {
    return this.directivoData.HorariosEscolares[nivel] || null;
  }

  public estaHorarioActivo(horario: HorarioTomaAsistencia): boolean {
    const ahora = this.getFechaHoraRedux();
    if (!ahora) return false;

    const inicio = new Date(horario.Inicio);
    const fin = new Date(horario.Fin);

    return ahora >= inicio && ahora <= fin;
  }

  public estaActivaTomaAsistenciaGeneral(): boolean {
    return this.estaHorarioActivo(this.getHorarioTomaAsistenciaGeneral());
  }

  public estaActivaTomaAsistenciaPrimaria(): boolean {
    return this.estaHorarioActivo(this.getHorarioTomaAsistenciaPrimaria());
  }

  public estaActivaTomaAsistenciaAuxiliares(): boolean {
    return this.estaHorarioActivo(this.getHorarioTomaAsistenciaAuxiliares());
  }

  public getTotalPersonalAdministrativo(): number {
    return this.getPersonalAdministrativo().length;
  }

  public getTotalProfesoresPrimaria(): number {
    return this.getProfesoresPrimaria().length;
  }

  public getTotalProfesoresSecundaria(): number {
    return this.getProfesoresSecundaria().length;
  }

  public debeEstarPresentePersonalAhora(dni: string): boolean {
    const personal = this.buscarPersonalAdministrativoPorDNI(dni);
    if (!personal) return false;

    const ahora = this.getFechaHoraRedux();

    if (!ahora) return false;
    console.log("AHORA:", ahora);

    const horaEntrada = new Date(ahora);
    const horaSalida = new Date(ahora);
    console.log("AHORA entrada:", horaEntrada);
    console.log("AHORA salida:", horaSalida);

    const [entradaHours, entradaMinutes] = String(
      personal.Horario_Laboral_Entrada
    )
      .split(":")
      .map(Number);
    const [salidaHours, salidaMinutes] = String(personal.Horario_Laboral_Salida)
      .split(":")
      .map(Number);

    horaEntrada.setHours(entradaHours, entradaMinutes, 0, 0);
    horaSalida.setHours(salidaHours, salidaMinutes, 0, 0);

    return ahora >= horaEntrada && ahora <= horaSalida;
  }

  public getDatosCompletosDirectivo(): DirectivoAsistenciaResponse {
    return this.directivoData;
  }

  /**
   * Obtiene la lista de personal según el rol especificado
   * @param rol Rol del personal a obtener
   * @returns Array de personal con formato unificado
   */
  public obtenerPersonalPorRol(
    rol: ActoresSistema | RolesSistema
  ): PersonalParaTomarAsistencia[] {
    switch (rol) {
      case ActoresSistema.ProfesorPrimaria:
        return this.getProfesoresPrimaria().map((profesor) => ({
          DNI: profesor.DNI_Profesor_Primaria,
          GoogleDriveFotoId: profesor.Google_Drive_Foto_ID,
          Nombres: profesor.Nombres,
          Apellidos: profesor.Apellidos,
          Genero: profesor.Genero as Genero,
        }));

      case ActoresSistema.ProfesorSecundaria:
      case ActoresSistema.Tutor:
        return this.getProfesoresSecundaria().map((profesor) => ({
          DNI: profesor.DNI_Profesor_Secundaria,
          GoogleDriveFotoId: profesor.Google_Drive_Foto_ID,
          Nombres: profesor.Nombres,
          Apellidos: profesor.Apellidos,
          Genero: profesor.Genero as Genero,
        }));

      case ActoresSistema.Auxiliar:
        return this.getAuxliares().map((auxiliar) => ({
          DNI: auxiliar.DNI_Auxiliar,
          GoogleDriveFotoId: auxiliar.Google_Drive_Foto_ID,
          Nombres: auxiliar.Nombres,
          Apellidos: auxiliar.Apellidos,
          Genero: auxiliar.Genero as Genero,
        }));

      case ActoresSistema.PersonalAdministrativo:
        return this.getPersonalAdministrativo().map((personal) => ({
          DNI: personal.DNI_Personal_Administrativo,
          GoogleDriveFotoId: personal.Google_Drive_Foto_ID,
          Nombres: personal.Nombres,
          Apellidos: personal.Apellidos,
          Genero: personal.Genero as Genero,
          Cargo: personal.Cargo, // Solo para personal administrativo
        }));

      default:
        return [];
    }
  }

  /**
   * Obtiene la hora a la que debe llegar o salir el personal según su rol, DNI y modo de registro
   * @param rol Rol del personal
   * @param dni DNI del personal
   * @param modoRegistro Modo de registro (Entrada o Salida)
   * @returns Hora programada para entrada o salida en formato ISO string (tal como viene del JSON)
   */
  public obtenerHorarioPersonalISO(
    rol: ActoresSistema | RolesSistema,
    dni: string,
    modoRegistro: ModoRegistro
  ): string {
    try {
      // Caso especial para estudiantes
      if (rol === ActoresSistema.Estudiante) {
        if (this.directivoData.HorariosEscolares[NivelEducativo.PRIMARIA]) {
          return String(
            this.directivoData.HorariosEscolares[NivelEducativo.PRIMARIA].Inicio
          );
        } else {
          // Si no hay horario definido, crear uno predeterminado
          const fechaHoy = new Date();
          fechaHoy.setHours(7, 45, 0, 0);
          return fechaHoy.toISOString();
        }
      }

      switch (rol) {
        case ActoresSistema.ProfesorPrimaria:
          const horarioProfesoresPrimaria =
            this.getHorarioTomaAsistenciaPrimaria();

          if (modoRegistro === ModoRegistro.Entrada) {
            return String(horarioProfesoresPrimaria.Inicio);
          } else {
            return String(horarioProfesoresPrimaria.Fin);
          }

        case ActoresSistema.ProfesorSecundaria:
        case ActoresSistema.Tutor:
          const profesorSecundaria = this.buscarProfesorSecundariaPorDNI(dni);

          if (profesorSecundaria) {
            if (
              modoRegistro === ModoRegistro.Entrada &&
              profesorSecundaria.Hora_Entrada_Dia_Actual
            ) {
              return String(profesorSecundaria.Hora_Entrada_Dia_Actual);
            } else if (
              modoRegistro === ModoRegistro.Salida &&
              profesorSecundaria.Hora_Salida_Dia_Actual
            ) {
              return String(profesorSecundaria.Hora_Salida_Dia_Actual);
            } else {
              // Fallback al horario general de secundaria
              if (
                this.directivoData.HorariosEscolares[NivelEducativo.SECUNDARIA]
              ) {
                const horario =
                  this.directivoData.HorariosEscolares[
                    NivelEducativo.SECUNDARIA
                  ];

                if (modoRegistro === ModoRegistro.Entrada) {
                  return String(horario.Inicio);
                } else {
                  return String(horario.Fin);
                }
              }
            }
          }
          break;

        case ActoresSistema.Auxiliar:
          const horarioAuxiliares = this.getHorarioTomaAsistenciaAuxiliares();

          if (modoRegistro === ModoRegistro.Entrada) {
            return String(horarioAuxiliares.Inicio);
          } else {
            return String(horarioAuxiliares.Fin);
          }

        case ActoresSistema.PersonalAdministrativo:
          const personal = this.buscarPersonalAdministrativoPorDNI(dni);

          if (personal) {
            if (
              modoRegistro === ModoRegistro.Entrada &&
              personal.Hora_Entrada_Dia_Actual
            ) {
              return String(personal.Hora_Entrada_Dia_Actual);
            } else if (
              modoRegistro === ModoRegistro.Salida &&
              personal.Hora_Salida_Dia_Actual
            ) {
              return String(personal.Hora_Salida_Dia_Actual);
            } else {
              // Fallback al horario general
              const horarioGeneral = this.getHorarioTomaAsistenciaGeneral();

              if (modoRegistro === ModoRegistro.Entrada) {
                return String(horarioGeneral.Inicio);
              } else {
                return String(horarioGeneral.Fin);
              }
            }
          }
          break;

        default:
          // Fallback usando horario general
          const horarioGeneral = this.getHorarioTomaAsistenciaGeneral();

          if (modoRegistro === ModoRegistro.Entrada) {
            return String(horarioGeneral.Inicio);
          } else {
            return String(horarioGeneral.Fin);
          }
      }
    } catch (error) {
      console.error("Error al obtener horario personal:", error);
    }

    // En caso de cualquier error, devolver un horario predeterminado
    const fechaPredeterminada = new Date();
    if (modoRegistro === ModoRegistro.Entrada) {
      fechaPredeterminada.setHours(8, 0, 0, 0);
    } else {
      fechaPredeterminada.setHours(16, 0, 0, 0);
    }
    return fechaPredeterminada.toISOString();
  }

  // Método de debugging simplificado
  public debugHorariosISO(
    rol: ActoresSistema | RolesSistema,
    dni?: string
  ): void {
    console.log("🔍 DEBUG HORARIOS ISO (SIN CONVERSIONES)");
    console.log("==========================================");
    console.log("Rol:", rol);
    console.log("DNI:", dni || "N/A");

    try {
      const entradaISO = this.obtenerHorarioPersonalISO(
        rol,
        dni || "",
        ModoRegistro.Entrada
      );
      const salidaISO = this.obtenerHorarioPersonalISO(
        rol,
        dni || "",
        ModoRegistro.Salida
      );

      console.log("📅 ENTRADA ISO:", entradaISO);
      console.log("📅 SALIDA ISO:", salidaISO);
      console.log(
        "✅ Estos valores se envían directamente a la API sin conversiones"
      );
    } catch (error) {
      console.error("❌ ERROR en debug:", error);
    }

    console.log("==========================================");
  }
}
