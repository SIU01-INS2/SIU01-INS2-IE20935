"use client";
import MyUserCard from "@/components/shared/cards/UserCard";

import { useEffect, useState } from "react";
import DatoFomularioConEtiqueta from "../../../../components/forms/DatoFomularioConEtiqueta";

import useRequestAPIFeatures from "@/hooks/useRequestSiasisAPIFeatures";
import { RolesSistema } from "@/interfaces/shared/RolesSistema";
import type {
  ActualizarMisDatosDirectivoRequestBody,
  MisDatosDirectivo,
  MisDatosErrorResponseAPI01,
  MisDatosSuccessResponseAPI01,
} from "@/interfaces/shared/apis/api01/mis-datos/types";
import {
  ApiResponseBase,
  SuccessResponseAPIBase,
} from "@/interfaces/shared/apis/types";
import ErrorMessage from "@/components/shared/errors/ErrorMessage";
import BotonConIcono from "@/components/buttons/BotonConIcono";
import LapizIcon from "@/components/icons/LapizIcon";
import FormSection from "@/components/forms/FormSection";
import { T_Directivos } from "@prisma/client";
import CandadoUpdate from "@/components/icons/CandadoUpdate";
import CorreoUpdate from "@/components/icons/CorreoUpdate";
import EquisIcon from "@/components/icons/EquisIcon";
import MemoriaIcon from "@/components/icons/MemoriaIcon";
import CambiarMiContraseñaModal from "@/components/modals/CambiarMiContraseñaModal";
import GenerosTextos from "@/Assets/GenerosTextos";
import { Genero } from "@/interfaces/shared/Genero";
import userStorage from "@/lib/utils/local/db/models/UserStorage";
import CambiarCorreoElectronicoModal from "@/components/modals/CambiarCorreoElectronicoModal";
import CambiarFotoModal from "@/components/modals/CambiarFotoModal";
import deepEqualsObjects from "@/lib/helpers/compares/deepEqualsObjects";
import Loader from "@/components/shared/loaders/Loader";
import SuccessMessage from "@/components/shared/successes/SuccessMessage";

const MisDatosDirectivo = ({
  googleDriveFotoIdCookieValue,
}: {
  googleDriveFotoIdCookieValue: string | null;
}) => {
  const [modoEdicion, setModoEdicion] = useState(false);

  const [cambiarFotoModal, setCambiarFotoModal] = useState(false);
  const [cambiarCorreoElectronicoModal, setCambiarCorreoElectronicoModal] =
    useState(false);
  const [cambiarContraseñaModal, setCambiarContraseñaModal] = useState(false);

  const [misDatosDirectivoSaved, setMisDatosDirectivoSaved] = useState<
    Partial<MisDatosDirectivo>
  >({
    Google_Drive_Foto_ID: googleDriveFotoIdCookieValue || undefined,
  });

  const [misDatosDirectivoModificados, setMisDatosDirectivoModificados] =
    useState<Partial<MisDatosDirectivo>>({});

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
    setMisDatosDirectivoSaved((prev) => ({
      ...prev,
      Google_Drive_Foto_ID,
    }));

    fetch("/api/auth/update-cookie/photo", {
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
            Rol: RolesSistema.Directivo,
          },
        });

        if (!fetchCancelable) throw new Error();

        const res = await fetchCancelable.fetch();

        const responseJson = (await res.json()) as ApiResponseBase;

        if (!responseJson.success) {
          return setError(responseJson as MisDatosErrorResponseAPI01);
        }

        const misDatosDirectivoData = (
          responseJson as MisDatosSuccessResponseAPI01
        ).data as MisDatosDirectivo;

        setMisDatosDirectivoModificados(misDatosDirectivoData);

        setMisDatosDirectivoSaved(misDatosDirectivoData);

        //Actualizando Cache
        if (
          googleDriveFotoIdCookieValue !==
          misDatosDirectivoData.Google_Drive_Foto_ID
        ) {
          updateFoto(misDatosDirectivoData.Google_Drive_Foto_ID);
        }

        await userStorage.saveUserData({
          Apellidos: misDatosDirectivoData.Apellidos,
          Genero: misDatosDirectivoData.Genero,
          Google_Drive_Foto_ID: misDatosDirectivoData.Google_Drive_Foto_ID,
          Nombres: misDatosDirectivoData.Nombres,
        });

        setIsSomethingLoading(false);
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
          DNI: misDatosDirectivoModificados.DNI,
          Nombres: misDatosDirectivoModificados.Nombres,
          Apellidos: misDatosDirectivoModificados.Apellidos,
          Genero: misDatosDirectivoModificados.Genero,
          Celular: misDatosDirectivoModificados.Celular,
        } as ActualizarMisDatosDirectivoRequestBody),
        queryParams: {
          Rol: RolesSistema.Directivo,
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

      setMisDatosDirectivoSaved(misDatosDirectivoModificados);

      //Actualizando Cache
      await userStorage.saveUserData({
        Apellidos: misDatosDirectivoModificados.Apellidos,
        Genero: misDatosDirectivoModificados.Genero,
        Google_Drive_Foto_ID: misDatosDirectivoModificados.Google_Drive_Foto_ID,
        Nombres: misDatosDirectivoModificados.Nombres,
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
    setMisDatosDirectivoModificados((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateEmail = (nuevoCorreo: string) => {
    setMisDatosDirectivoSaved((prev) => {
      return { ...prev, Correo_Electronico: nuevoCorreo };
    });
  };

  return (
    <>
      {cambiarFotoModal && (
        <CambiarFotoModal
          siasisAPI="API01"
          Rol={RolesSistema.Directivo}
          updateFoto={(googleDriveFotoId: string) => {
            updateFoto(googleDriveFotoId);
          }}
          onSuccess={() => {
            setSuccessMessage({
              message: "Se actualizo correctamente la Foto",
            });
          }}
          initialSource={
            misDatosDirectivoSaved.Google_Drive_Foto_ID &&
            `https://drive.google.com/thumbnail?id=${misDatosDirectivoSaved.Google_Drive_Foto_ID}`
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
          Rol={RolesSistema.Directivo}
          eliminateModal={() => {
            setCambiarContraseñaModal(false);
          }}
        />
      )}
      {cambiarCorreoElectronicoModal && (
        <CambiarCorreoElectronicoModal
          siasisAPI="API01"
          updateEmail={updateEmail}
          onSuccess={() => {
            setSuccessMessage({
              message: "Se actualizo correctamente la contraseña",
            });
          }}
          eliminateModal={() => {
            setCambiarCorreoElectronicoModal(false);
          }}
        />
      )}
      <div className="@container -border-2 border-blue-500 w-full max-w-[75rem] h-full grid grid-cols-7 grid-rows-[min-content_1fr] gap-y-4 md:gap-0">
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
                  setMisDatosDirectivoModificados(misDatosDirectivoSaved);
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
            <div className="flex flex-col gap-6 justify-center items-center">
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
                <DatoFomularioConEtiqueta<T_Directivos>
                  inputAttributes={{
                    minLength: 8,
                    maxLength: 8,
                    required: true,
                    disabled: isSomethingLoading,
                  }}
                  isSomethingLoading={isSomethingLoading}
                  modoEdicion={modoEdicion}
                  etiqueta="DNI"
                  nombreDato="DNI"
                  modificable
                  modificatedValue={misDatosDirectivoModificados.DNI}
                  savedValue={misDatosDirectivoSaved.DNI}
                  onChange={handleChange}
                  className="sxs-only:text-[1.105rem] xs-only:text-[1.17rem] sm-only:text-[1.235rem] md-only:text-[1.3rem] lg-only:text-[1.365rem] xl-only:text-[1.43rem]"
                  fullWidth
                />
                <DatoFomularioConEtiqueta<T_Directivos>
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
                  modificable
                  modificatedValue={misDatosDirectivoModificados.Nombres}
                  onChange={handleChange}
                  savedValue={misDatosDirectivoSaved.Nombres}
                />
                <DatoFomularioConEtiqueta<T_Directivos>
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
                  modificable
                  modificatedValue={misDatosDirectivoModificados.Apellidos}
                  onChange={handleChange}
                  savedValue={misDatosDirectivoSaved.Apellidos}
                />
                <DatoFomularioConEtiqueta<T_Directivos>
                  isSomethingLoading={isSomethingLoading}
                  modoEdicion={modoEdicion}
                  etiqueta="Género"
                  nombreDato="Genero"
                  modificable
                  modificatedValue={misDatosDirectivoModificados.Genero}
                  onChange={handleChange}
                  inputType="select"
                  selectValues={{
                    [Genero.Masculino]: GenerosTextos.M,
                    [Genero.Femenino]: GenerosTextos.F,
                  }}
                  selectAttributes={{ disabled: isSomethingLoading }}
                  skeletonClassName={{ className: "min-w-[1.1rem]" }}
                  savedValue={misDatosDirectivoSaved.Genero}
                />
                <DatoFomularioConEtiqueta<T_Directivos>
                  inputAttributes={{
                    minLength: 9,
                    maxLength: 9,
                    required: true,
                    disabled: isSomethingLoading,
                  }}
                  isSomethingLoading={isSomethingLoading}
                  modoEdicion={modoEdicion}
                  etiqueta="Celular"
                  nombreDato="Celular"
                  modificable
                  modificatedValue={misDatosDirectivoModificados.Celular}
                  onChange={handleChange}
                  savedValue={misDatosDirectivoSaved.Celular}
                />
              </FormSection>

              {modoEdicion && (
                <BotonConIcono
                  LoaderTSX={
                    <Loader className="w-[1.3rem] p-[0.25rem] bg-negro" />
                  }
                  isSomethingLoading={isSomethingLoading}
                  disabled={deepEqualsObjects(
                    misDatosDirectivoSaved,
                    misDatosDirectivoModificados
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

              <FormSection titulo="Informacion del Usuario">
                <DatoFomularioConEtiqueta<T_Directivos>
                  isSomethingLoading={isSomethingLoading}
                  modoEdicion={modoEdicion}
                  etiqueta="Nombre de Usuario"
                  nombreDato="Nombre_Usuario"
                  savedValue={misDatosDirectivoSaved.Nombre_Usuario}
                />
                <DatoFomularioConEtiqueta<T_Directivos>
                  isSomethingLoading={isSomethingLoading}
                  modoEdicion={modoEdicion}
                  etiqueta="Contraseña"
                  nombreDato="Contraseña"
                  savedValue={misDatosDirectivoSaved.Nombre_Usuario}
                  savedValueOculto
                  onChange={handleChange}
                  modificable
                  modificableConModal
                  IconTSX={<CandadoUpdate className="text-negro w-[1.3rem]" />}
                  setModalVisibility={setCambiarContraseñaModal}
                />
                <DatoFomularioConEtiqueta<T_Directivos>
                  isSomethingLoading={isSomethingLoading}
                  modoEdicion={modoEdicion}
                  etiqueta="Correo Electronico"
                  nombreDato="Correo_Electronico"
                  savedValue={misDatosDirectivoSaved.Correo_Electronico}
                  IconTSX={<CorreoUpdate className="w-[1.3rem]" />}
                  onChange={handleChange}
                  modificable
                  modificableConModal
                  setModalVisibility={setCambiarCorreoElectronicoModal}
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
            Nombres={misDatosDirectivoSaved.Nombres}
            Apellidos={misDatosDirectivoSaved.Apellidos}
            Nombre_Usuario={misDatosDirectivoSaved.Nombre_Usuario}
            Google_Drive_Foto_ID={
              misDatosDirectivoSaved.Google_Drive_Foto_ID || null
            }
          />
        </div>
      </div>
    </>
  );
};

export default MisDatosDirectivo;
