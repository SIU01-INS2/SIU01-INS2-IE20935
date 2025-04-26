import { NOMBRE_CLASE_IMAGENES_FOTO_PERFIL_USUARIO } from "@/Assets/others/ClasesCSS";

/**
 * Modifica el atributo src de las imágenes con clase "Foto-Perfil-Usuario"
 * @param newSrc - La nueva URL de imagen que se asignará
 */
export function modificarFotosPerfilUsuario(
  Google_Drive_Foto_ID: string
): void {
  // Seleccionar todos los elementos img con la clase "Foto-Perfil-Usuario"
  const imagenesPerfilUsuario = document.querySelectorAll(
    `img.${NOMBRE_CLASE_IMAGENES_FOTO_PERFIL_USUARIO}`
  );

  // Verificar si se encontraron elementos
  if (imagenesPerfilUsuario.length === 0) {
    // console.warn(
    //   'No se encontraron imágenes con la clase "Foto-Perfil-Usuario"'
    // );
    return;
  }

  // Modificar el atributo src de cada imagen encontrada
  imagenesPerfilUsuario.forEach((imagen: Element) => {
    if (imagen instanceof HTMLImageElement) {
      // Guardar el src anterior para referencia si es necesario
      // const srcAnterior = imagen.src;

      // Asignar el nuevo src
      imagen.src = `https://drive.google.com/thumbnail?id=${Google_Drive_Foto_ID}`;

      // console.log(`Imagen modificada: ${srcAnterior} → ${newSrc}`);
    }
  });

  fetch("/api/update-cookie/photo", {
    method: "PUT",
    body: JSON.stringify({ Google_Drive_Foto_ID }),
  });

  console.log(
    `Se modificaron ${imagenesPerfilUsuario.length} imágenes de perfil`
  );
}
