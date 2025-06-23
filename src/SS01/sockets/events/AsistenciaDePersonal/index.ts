// // src/socket/events/asistenciaEvents.ts
// import { Server, Socket } from "socket.io";

// import { SocketUserData } from "../../../interfaces/UserData";
// import { SocketHandler } from "../../../utils/SocketsUnitario";
// import { TomaAsistenciaPersonalSS01Events } from "./backend/TomaAsistenciaPersonalSS01Events";

// /**
//  * Registra los eventos relacionados con la asistencia
//  * @param io Servidor de Socket.IO
//  * @param socket Socket del cliente
//  */
// const importarEventosSocketTomaAsistenciaPersonal = (
//   io: Server,
//   socket: Socket,
//   nombreSala: string,
//   emitError: (socket: Socket, code: string, message: string) => void
// ) => {
//   // Obtener información del usuario
//   const { Nombre_Usuario, Rol } = socket.data.user as SocketUserData;

//   TomaAsistenciaPersonalSS01Events.socketConnection = socket;

//   new TomaAsistenciaPersonalSS01Events.SALUDAME_SOCKET_HANDLER(() => {
//     new TomaAsistenciaPersonalSS01Events.RESPUESTA_SALUDO_EMITTER({
//       saludo: `Hola ${Nombre_Usuario} con ROL ${Rol}`,
//     }).execute();
//   }).hand();
// };

// export default importarEventosSocketTomaAsistenciaPersonal;
