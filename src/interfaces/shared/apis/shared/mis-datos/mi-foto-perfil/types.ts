

export interface CambiarFotoPerfilSuccessResponse {
  success: true;
  message: string;
  data: {
    fileId: string;
    fileUrl: string;
  };
}
