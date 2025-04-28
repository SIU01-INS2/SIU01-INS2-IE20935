import {
  AuxiliaresParaTomaDeAsistencia,
  DirectivoAsistenciaResponse,
  HorarioTomaAsistencia,
  PersonalAdministrativoParaTomaDeAsistencia,
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
   * @returns Hora programada para entrada o salida en formato Date
   */
  public obtenerHorarioPersonal(
    rol: ActoresSistema | RolesSistema,
    dni: string,
    modoRegistro: ModoRegistro
  ): Date {
    const fechaActual = new Date();
    let horaProgramada = new Date(fechaActual);

    try {
      // Caso especial para estudiantes
      if (rol === ActoresSistema.Estudiante) {
        // Para estudiantes, solo se considera la entrada y siempre es la misma hora
        if (this.directivoData.HorariosEscolares[NivelEducativo.PRIMARIA]) {
          return new Date(
            this.directivoData.HorariosEscolares[NivelEducativo.PRIMARIA].Inicio
          );
        } else {
          // Si no hay horario definido para primaria, usar un horario predeterminado
          horaProgramada.setHours(7, 45, 0, 0);
          return horaProgramada;
        }
      }

      switch (rol) {
        case ActoresSistema.ProfesorPrimaria:
          if (this.directivoData.HorariosEscolares[NivelEducativo.PRIMARIA]) {
            const horario =
              this.directivoData.HorariosEscolares[NivelEducativo.PRIMARIA];

            if (modoRegistro === ModoRegistro.Entrada) {
              // Para entrada, usar hora de inicio
              horaProgramada = new Date(horario.Inicio);
            } else {
              // Para salida, usar hora de fin
              horaProgramada = new Date(horario.Fin);
            }
          }
          break;

        case ActoresSistema.ProfesorSecundaria:
        case ActoresSistema.Tutor:
          // Buscar el profesor específico
          const profesorSecundaria = this.buscarProfesorSecundariaPorDNI(dni);

          if (profesorSecundaria) {
            if (
              modoRegistro === ModoRegistro.Entrada &&
              profesorSecundaria.Hora_Entrada_Dia_Actual
            ) {
              // Entrada específica del profesor
              horaProgramada = new Date(
                profesorSecundaria.Hora_Entrada_Dia_Actual
              );
            } else if (
              modoRegistro === ModoRegistro.Salida &&
              profesorSecundaria.Hora_Salida_Dia_Actual
            ) {
              // Salida específica del profesor
              horaProgramada = new Date(
                profesorSecundaria.Hora_Salida_Dia_Actual
              );
            }
          } else if (
            this.directivoData.HorariosEscolares[NivelEducativo.SECUNDARIA]
          ) {
            // Si no tiene horario específico, usar el general de secundaria
            const horario =
              this.directivoData.HorariosEscolares[NivelEducativo.SECUNDARIA];

            if (modoRegistro === ModoRegistro.Entrada) {
              horaProgramada = new Date(horario.Inicio);
            } else {
              horaProgramada = new Date(horario.Fin);
            }
          }
          break;

        case ActoresSistema.Auxiliar:
          const horarioAuxiliares = this.getHorarioTomaAsistenciaAuxiliares();

          if (modoRegistro === ModoRegistro.Entrada) {
            horaProgramada = new Date(horarioAuxiliares.Inicio);
          } else {
            horaProgramada = new Date(horarioAuxiliares.Fin);
          }
          break;

        case ActoresSistema.PersonalAdministrativo:
          // Para personal administrativo, buscar su horario específico
          const personal = this.buscarPersonalAdministrativoPorDNI(dni);

          if (personal) {
            if (
              modoRegistro === ModoRegistro.Entrada &&
              personal.Horario_Laboral_Entrada
            ) {
              horaProgramada = new Date(personal.Hora_Entrada_Dia_Actual);
            } else if (
              modoRegistro === ModoRegistro.Salida &&
              personal.Horario_Laboral_Salida
            ) {
              horaProgramada = new Date(personal.Hora_Salida_Dia_Actual);
            }
          }
          break;

        default:
          // Valor predeterminado
          if (modoRegistro === ModoRegistro.Entrada) {
            horaProgramada.setHours(8, 0, 0, 0);
          } else {
            horaProgramada.setHours(16, 0, 0, 0);
          }
      }
    } catch (error) {
      console.error("Error al obtener horario personal:", error);
      // En caso de cualquier error, devolver un horario predeterminado
      if (modoRegistro === ModoRegistro.Entrada) {
        horaProgramada.setHours(8, 0, 0, 0);
      } else {
        horaProgramada.setHours(16, 0, 0, 0);
      }
    }

    return horaProgramada;
  }
}
