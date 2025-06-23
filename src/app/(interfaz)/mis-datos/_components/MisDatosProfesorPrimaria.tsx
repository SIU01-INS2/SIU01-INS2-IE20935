"use client";
import GenerosTextos from "@/Assets/GenerosTextos";
import BotonConIcono from "@/components/buttons/BotonConIcono";
import DatoFormularioConEtiqueta from "@/components/forms/DatoFomularioConEtiqueta";
import FormSection from "@/components/forms/FormSection";
import CandadoUpdate from "@/components/icons/CandadoUpdate";
import EquisIcon from "@/components/icons/EquisIcon";
import LapizIcon from "@/components/icons/LapizIcon";
import MemoriaIcon from "@/components/icons/MemoriaIcon";
import MyUserCard from "@/components/shared/cards/UserCard";
import ErrorMessage from "@/components/shared/errors/ErrorMessage";
import SuccessMessage from "@/components/shared/successes/SuccessMessage";
import { Genero } from "@/interfaces/shared/Genero";
import deepEqualsObjects from "@/lib/helpers/compares/deepEqualsObjects";
import { Loader } from "lucide-react";
import React, { useEffect, useState } from "react";
import CambiarMiContraseñaModal from "@/components/modals/CambiarMiContraseñaModal";
import CambiarFotoModal from "@/components/modals/CambiarFotoModal";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import userStorage from "@/lib/utils/local/db/models/UserStorage";
import {
  ApiResponseBase,
  SuccessResponseAPIBase,
} from "@/interfaces/shared/apis/types";
import {
  ActualizarMisDatosProfesorPrimariaRequestBody,
  MisDatosErrorResponseAPI01,
  MisDatosProfesorPrimaria,
  MisDatosSuccessResponseAPI01,
} from "@/interfaces/shared/apis/api01/mis-datos/types";
import useRequestAPIFeatures from "@/hooks/useRequestSiasisAPIFeatures";
import { T_Aulas, T_Profesores_Primaria } from "@prisma/client";
import { NivelEducativoTextos } from "@/Assets/NivelEducativoTextos";
import { NivelEducativo } from "@/interfaces/shared/NivelEducativo";

const MisDatosDeProfesorPrimaria = ({
  googleDriveFotoIdCookieValue,
  nombresCookieValue,
  apellidosCookieValue,
  generoCookieValue,
}: {
  googleDriveFotoIdCookieValue: string | null;
  nombresCookieValue: string | null;
  apellidosCookieValue: string | null;
  generoCookieValue: Genero | null;
}) => {
  const [modoEdicion, setModoEdicion] = useState(false);

  const [cambiarFotoModal, setCambiarFotoModal] = useState(false);
  const [cambiarContraseñaModal, setCambiarContraseñaModal] = useState(false);

  const [misDatosProfesorPrimariaSaved, setMisDatosProfesorPrimariaSaved] =
    useState<Partial<MisDatosProfesorPrimaria>>({
      Google_Drive_Foto_ID: googleDriveFotoIdCookieValue || undefined,
    });

  const [
    misDatosProfesorPrimariaModificados,
    setMisDatosProfesorPrimariaModificados,
  ] = useState<Partial<MisDatosProfesorPrimaria>>({});

  const {
    error,
    setError,
    fetchSiasisAPI,
    isSomethingLoading,
    setIsSomethingLoading,
    setSuccessMessage,
    successMessage,
  } = useRequestAPIFeatures("API01", true);

  const updateFoto = async (Google_Drive_Foto_ID: string | null) => {
    setMisDatosProfesorPrimariaSaved((prev) => ({
      ...prev,
      Google_Drive_Foto_ID,
    }));

    fetch("/api/auth/update-cookies", {
      method: "PUT",
      body: JSON.stringify({
        Google_Drive_Foto_ID,
      }),
    });

    await userStorage.saveUserData({
      Google_Drive_Foto_ID,
    });
  };

  useEffect(() => {
    if (!fetchSiasisAPI) return;

    const fetchMisDatos = async () => {
      setIsSomethingLoading(true);
      try {
        const fetchCancelable = await fetchSiasisAPI({
          endpoint: "/api/mis-datos",
          method: "GET",
          queryParams: {
            Rol: RolesSistema.ProfesorPrimaria,
          },
        });

        if (!fetchCancelable) throw new Error();

        const res = await fetchCancelable.fetch();

        const responseJson = (await res.json()) as ApiResponseBase;

        if (!responseJson.success) {
          return setError(responseJson as MisDatosErrorResponseAPI01);
        }

        const misDatosProfesorPrimariaData = (
          responseJson as MisDatosSuccessResponseAPI01
        ).data as MisDatosProfesorPrimaria;

        setMisDatosProfesorPrimariaModificados(misDatosProfesorPrimariaData);

        setMisDatosProfesorPrimariaSaved(misDatosProfesorPrimariaData);

        //Actualizando Cache

        await userStorage.saveUserData({
          Apellidos: misDatosProfesorPrimariaData.Apellidos,
          Genero: misDatosProfesorPrimariaData.Genero,
          Google_Drive_Foto_ID:
            misDatosProfesorPrimariaData.Google_Drive_Foto_ID,
          Nombres: misDatosProfesorPrimariaData.Nombres,
        });

        setIsSomethingLoading(false);

        //Actualizando Cookies por lo bajo
        if (
          googleDriveFotoIdCookieValue !==
            misDatosProfesorPrimariaData.Google_Drive_Foto_ID ||
          nombresCookieValue !== misDatosProfesorPrimariaData.Nombres ||
          apellidosCookieValue !== misDatosProfesorPrimariaData.Apellidos ||
          generoCookieValue !== misDatosProfesorPrimariaData.Genero
        ) {
          fetch("/api/auth/update-cookies", {
            method: "PUT",
            body: JSON.stringify({
              Google_Drive_Foto_ID:
                misDatosProfesorPrimariaData.Google_Drive_Foto_ID,
              Nombres: misDatosProfesorPrimariaData.Nombres,
              Apellidos: misDatosProfesorPrimariaData.Apellidos,
              Genero: misDatosProfesorPrimariaData.Genero,
            }),
          });
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        if (error) {
          setError({
            message: "Error al obtener tus datos, vuelve a inténtalo más tarde",
            success: false,
          });
        }
        setIsSomethingLoading(false);
      }
    };

    fetchMisDatos();
  }, [fetchSiasisAPI, setError]);

  const handleSubmitUpdateData = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSomethingLoading(true);
    setError(null);
    try {
      const fetchCancelable = await fetchSiasisAPI({
        endpoint: "/api/mis-datos",
        method: "PUT",
        body: JSON.stringify({
          Correo_Electronico:
            misDatosProfesorPrimariaModificados.Correo_Electronico,
          Celular: misDatosProfesorPrimariaModificados.Celular,
        } as ActualizarMisDatosProfesorPrimariaRequestBody),
        queryParams: {
          Rol: RolesSistema.ProfesorPrimaria,
        },
      });

      if (!fetchCancelable) throw new Error();

      const res = await fetchCancelable.fetch();

      const responseJson = (await res.json()) as ApiResponseBase;

      if (!responseJson.success) {
        setIsSomethingLoading(false);
        return setError(responseJson as MisDatosErrorResponseAPI01);
      }

      const { message } = responseJson as SuccessResponseAPIBase;

      setSuccessMessage({ message });

      setMisDatosProfesorPrimariaSaved(misDatosProfesorPrimariaModificados);

      //Actualizando Cache
      await userStorage.saveUserData({
        Apellidos: misDatosProfesorPrimariaModificados.Apellidos,
        Genero: misDatosProfesorPrimariaModificados.Genero,
        Google_Drive_Foto_ID:
          misDatosProfesorPrimariaModificados.Google_Drive_Foto_ID,
        Nombres: misDatosProfesorPrimariaModificados.Nombres,
      });

      fetch("/api/auth/update-cookies", {
        method: "PUT",
        body: JSON.stringify({
          Nombres: misDatosProfesorPrimariaModificados.Nombres,
          Apellidos: misDatosProfesorPrimariaModificados.Apellidos,
        }),
      });

      setIsSomethingLoading(false);
      setModoEdicion(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      if (error) {
        setError({
          message:
            "Error al actualizar tus datos, vuelve a inténtalo más tarde",
          success: false,
        });
      }
      setIsSomethingLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setError(null);
    const { name, value } = e.target;
    setMisDatosProfesorPrimariaModificados((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <>
      {cambiarFotoModal && (
        <CambiarFotoModal
          siasisAPI="API01"
          Rol={RolesSistema.ProfesorPrimaria}
          updateFoto={(googleDriveFotoId: string) => {
            updateFoto(googleDriveFotoId);
          }}
          onSuccess={() => {
            setSuccessMessage({
              message: "Se actualizo correctamente la Foto",
            });
          }}
          initialSource={
            misDatosProfesorPrimariaSaved.Google_Drive_Foto_ID &&
            `https://drive.google.com/thumbnail?id=${misDatosProfesorPrimariaSaved.Google_Drive_Foto_ID}`
          }
          eliminateModal={() => {
            setCambiarFotoModal(false);
          }}
        />
      )}
      {cambiarContraseñaModal && (
        <CambiarMiContraseñaModal
          siasisAPI="API01"
          onSuccess={() => {
            setSuccessMessage({
              message: "Se actualizo la contraseña correctamente",
            });
          }}
          Rol={RolesSistema.ProfesorPrimaria}
          eliminateModal={() => {
            setCambiarContraseñaModal(false);
          }}
        />
      )}

      <div className="@container -border-2 border-blue-500 w-full lg:w-[85%] max-w-[75rem] h-full grid grid-cols-7 grid-rows-[min-content_1fr] gap-y-4 md:gap-0">
        {/* SECCION DE BOTONES */}
        <div className="flex col-span-full -border-2 flex-wrap py-2 justify-start items-center gap-x-6 gap-y-2">
          <h1
            className="font-medium 
            sxs-only:text-[1.55rem] xs-only:text-[1.65rem] sm-only:text-[1.75rem] md-only:text-[1.9rem] lg-only:text-[2.1rem] xl-only:text-[2.4rem]"
          >
            MIS DATOS
          </h1>
          {!isSomethingLoading && (
            <BotonConIcono
              texto={modoEdicion ? "Cancelar Edición" : "Editar Datos"}
              IconTSX={
                !modoEdicion ? (
                  <LapizIcon className="w-[0.95rem]" />
                ) : (
                  <EquisIcon className="text-blanco w-[0.85rem]" />
                )
              }
              onClick={() => {
                //SI se esta cancelando el modo edicion entonces se volvera al
                // estado en el que se encuentran los datos guardados en la base de datos
                if (modoEdicion)
                  setMisDatosProfesorPrimariaModificados(
                    misDatosProfesorPrimariaSaved
                  );
                setModoEdicion(!modoEdicion);
              }}
              className={`${
                modoEdicion
                  ? "bg-rojo-oscuro text-blanco"
                  : "bg-amarillo-ediciones text-negro"
              }  gap-[0.5rem] content-center font-semibold px-[0.6rem] py-[0.35rem] rounded-[6px] 
              sxs-only:text-[0.75rem] xs-only:text-[0.8rem] sm-only:text-[0.85rem] md-only:text-[0.9rem] lg-only:text-[0.95rem] xl-only:text-[1rem]`}
            />
          )}
        </div>

        {/* SECCION DEL FORMULARIO */}
        <div className="col-span-full @lg:col-span-4 -border-2 justify-center">
          <form onSubmit={handleSubmitUpdateData}>
            <div className="flex flex-col gap-3 justify-center items-center">
              {error && (
                <ErrorMessage error={error} closable duration={12000} />
              )}

              {successMessage && (
                <SuccessMessage
                  className="mb-[-1rem]"
                  closable
                  duration={7000}
                  {...successMessage}
                />
              )}
              <FormSection titulo="Información Personal">
                <DatoFormularioConEtiqueta<T_Profesores_Primaria>
                  inputAttributes={{
                    minLength: 8,
                    maxLength: 8,
                    required: true,
                    disabled: isSomethingLoading,
                  }}
                  isSomethingLoading={isSomethingLoading}
                  modoEdicion={modoEdicion}
                  etiqueta="DNI"
                  nombreDato="DNI_Profesor_Primaria"
                  savedValue={
                    misDatosProfesorPrimariaSaved.DNI_Profesor_Primaria
                  }
                  onChange={handleChange}
                  className="sxs-only:text-[1.105rem] xs-only:text-[1.17rem] sm-only:text-[1.235rem] md-only:text-[1.3rem] lg-only:text-[1.365rem] xl-only:text-[1.43rem]"
                  fullWidth
                />
                <DatoFormularioConEtiqueta<T_Profesores_Primaria>
                  inputAttributes={{
                    minLength: 2,
                    maxLength: 60,
                    required: true,
                    disabled: isSomethingLoading,
                  }}
                  isSomethingLoading={isSomethingLoading}
                  modoEdicion={modoEdicion}
                  etiqueta="Nombres"
                  nombreDato="Nombres"
                  onChange={handleChange}
                  savedValue={misDatosProfesorPrimariaSaved.Nombres}
                />
                <DatoFormularioConEtiqueta<T_Profesores_Primaria>
                  inputAttributes={{
                    minLength: 2,
                    maxLength: 60,
                    required: true,
                    disabled: isSomethingLoading,
                  }}
                  isSomethingLoading={isSomethingLoading}
                  modoEdicion={modoEdicion}
                  etiqueta="Apellidos"
                  nombreDato="Apellidos"
                  onChange={handleChange}
                  savedValue={misDatosProfesorPrimariaSaved.Apellidos}
                />
                <DatoFormularioConEtiqueta<T_Profesores_Primaria>
                  isSomethingLoading={isSomethingLoading}
                  modoEdicion={modoEdicion}
                  etiqueta="Género"
                  nombreDato="Genero"
                  onChange={handleChange}
                  inputType="select"
                  selectValues={{
                    [Genero.Masculino]: GenerosTextos.M,
                    [Genero.Femenino]: GenerosTextos.F,
                  }}
                  selectAttributes={{ disabled: isSomethingLoading }}
                  skeletonClassName={{ className: "min-w-[1.1rem]" }}
                  savedValue={misDatosProfesorPrimariaSaved.Genero}
                />
              </FormSection>

              <FormSection titulo="Contacto">
                <DatoFormularioConEtiqueta<T_Profesores_Primaria>
                  inputAttributes={{
                    minLength: 9,
                    maxLength: 9,
                    required: true,
                    disabled: isSomethingLoading,
                  }}
                  isSomethingLoading={isSomethingLoading}
                  modoEdicion={modoEdicion}
                  inputType="text"
                  etiqueta="Celular"
                  nombreDato="Celular"
                  modificable
                  modificatedValue={misDatosProfesorPrimariaModificados.Celular}
                  onChange={handleChange}
                  savedValue={misDatosProfesorPrimariaSaved.Celular}
                />

                <DatoFormularioConEtiqueta<T_Profesores_Primaria>
                  isSomethingLoading={isSomethingLoading}
                  modoEdicion={modoEdicion}
                  etiqueta="Correo Electronico"
                  nombreDato="Correo_Electronico"
                  className=" sxs-only:max-w-[7rem] xs-only:max-w-[8rem] sm-only:max-w-[9rem] md-only:max-w-[10rem] lg-only:min-w-[min(80vw,16rem)] xl-only:max-w-[12rem]"
                  savedValue={misDatosProfesorPrimariaSaved.Correo_Electronico}
                  modificatedValue={
                    misDatosProfesorPrimariaModificados.Correo_Electronico
                  }
                  onChange={handleChange}
                  modificable
                />
              </FormSection>
              {modoEdicion && (
                <BotonConIcono
                  LoaderTSX={
                    <Loader className="w-[1.3rem] p-[0.2rem] bg-negro" />
                  }
                  isSomethingLoading={isSomethingLoading}
                  disabled={deepEqualsObjects(
                    misDatosProfesorPrimariaSaved,
                    misDatosProfesorPrimariaModificados
                  )}
                  titleDisabled="Aun no has modificado nada"
                  typeButton="submit"
                  className="w-max content-center font-semibold p-3 py-2 rounded-[10px] bg-amarillo-ediciones gap-2 sxs-only:text-[0.75rem] xs-only:text-[0.8rem] sm-only:text-[0.85rem] md-only:text-[0.9rem] lg-only:text-[0.95rem] xl-only:text-[1rem]"
                  texto="Guardar Cambios"
                  IconTSX={
                    <MemoriaIcon className="w-[1.4rem] sxs-only:w-[0.85rem] xs-only:w-[0.9rem] sm-only:w-[0.95rem] md-only:w-[1rem] lg-only:w-[1.1rem] xl-only:w-[1.2rem]" />
                  }
                />
              )}

              <FormSection titulo="Aula">
                {misDatosProfesorPrimariaSaved.Aula && (
                  <>
                    <DatoFormularioConEtiqueta<T_Aulas>
                      isSomethingLoading={isSomethingLoading}
                      modoEdicion={modoEdicion}
                      etiqueta="Nivel"
                      nombreDato="Nivel"
                      onChange={handleChange}
                      savedValue={
                        NivelEducativoTextos[
                          misDatosProfesorPrimariaSaved.Aula
                            .Nivel as NivelEducativo
                        ]
                      }
                    />
                    <DatoFormularioConEtiqueta<T_Aulas>
                      isSomethingLoading={isSomethingLoading}
                      modoEdicion={modoEdicion}
                      etiqueta="Grado"
                      nombreDato="Grado"
                      onChange={handleChange}
                      savedValue={misDatosProfesorPrimariaSaved.Aula.Grado}
                    />
                    <DatoFormularioConEtiqueta<T_Aulas>
                      isSomethingLoading={isSomethingLoading}
                      modoEdicion={modoEdicion}
                      etiqueta="Sección"
                      nombreDato="Seccion"
                      onChange={handleChange}
                      savedValue={misDatosProfesorPrimariaSaved.Aula.Seccion}
                    />
                  </>
                )}
              </FormSection>

              <FormSection titulo="Informacion del Usuario">
                <DatoFormularioConEtiqueta<T_Profesores_Primaria>
                  isSomethingLoading={isSomethingLoading}
                  modoEdicion={modoEdicion}
                  etiqueta="Nombre de Usuario"
                  nombreDato="Nombre_Usuario"
                  savedValue={misDatosProfesorPrimariaSaved.Nombre_Usuario}
                />
                <DatoFormularioConEtiqueta<T_Profesores_Primaria>
                  isSomethingLoading={isSomethingLoading}
                  modoEdicion={modoEdicion}
                  etiqueta="Contraseña"
                  nombreDato="Contraseña"
                  savedValue={misDatosProfesorPrimariaSaved.Nombre_Usuario}
                  savedValueOculto
                  onChange={handleChange}
                  modificable
                  modificableConModal
                  IconTSX={<CandadoUpdate className="text-negro w-[1.3rem]" />}
                  setModalVisibility={setCambiarContraseñaModal}
                />
              </FormSection>
            </div>
          </form>
        </div>

        {/* SECCION DE USER CARD - Ahora usa container queries */}
        <div className="flex w-full h-full justify-center items-start @lg:row-auto row-start-2 col-span-full @lg:col-span-3 @lg:order-none order-2 p-4">
          <MyUserCard
            setCambiarFotoModal={setCambiarFotoModal}
            isSomethingLoading={isSomethingLoading}
            Nombres={misDatosProfesorPrimariaSaved.Nombres}
            Apellidos={misDatosProfesorPrimariaSaved.Apellidos}
            Nombre_Usuario={misDatosProfesorPrimariaSaved.Nombre_Usuario}
            Google_Drive_Foto_ID={
              misDatosProfesorPrimariaSaved.Google_Drive_Foto_ID || null
            }
          />
        </div>
      </div>
    </>
  );
};

export default MisDatosDeProfesorPrimaria;
