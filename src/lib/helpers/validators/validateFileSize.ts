// Función para validar el tamaño del archivo (máximo 5MB)
export function validateFileSize(
  file: Express.Multer.File,
  MBmax: number = 5
): boolean {
  const maxSizeInBytes = MBmax * 1024 * 1024; // 5MB en bytes
  return file.size <= maxSizeInBytes;
}


