import path from 'path';

/**
 * Valida que el archivo sea una imagen válida
 * @param file Archivo recibido de multer
 * @returns true si es una imagen válida, false si no lo es
 */
export function validateImageType(file: Express.Multer.File): boolean {
  // Lista de tipos MIME permitidos para imágenes
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff'
  ];
  
  // Verificar que el tipo MIME corresponde a una imagen
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return false;
  }
  
  // Verificar extensión del archivo (doble verificación)
  const extension = path.extname(file.originalname).toLowerCase();
  const validExtensions = [
    '.jpg', 
    '.jpeg', 
    '.png', 
    '.gif', 
    '.webp', 
    '.svg', 
    '.bmp', 
    '.tiff'
  ];
  
  if (!validExtensions.includes(extension)) {
    return false;
  }
  
  return true;
}

