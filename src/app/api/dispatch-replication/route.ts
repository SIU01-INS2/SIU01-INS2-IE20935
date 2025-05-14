import { EMCS01Payload } from "@/interfaces/shared/EMCS01/EMCS01Payload";
import { RDP02 } from "@/interfaces/shared/RDP02Instancias";
import { NextResponse } from "next/server";

// Constantes para el webhook de GitHub
const GITHUB_WEBHOOK_REPO_OWNER =
  process.env.EMCS01_GITHUB_WEBHOOK_REPOSITORY_OWNER_USERNAME || "";
const GITHUB_WEBHOOK_REPO_NAME =
  process.env.EMCS01_GITHUB_WEBHOOK_REPOSITORY_NAME || "";
const GITHUB_WEBHOOK_EVENT_TYPE = "database-replication";
const GITHUB_WEBHOOK_URL = `https://api.github.com/repos/${GITHUB_WEBHOOK_REPO_OWNER}/${GITHUB_WEBHOOK_REPO_NAME}/dispatches`;


export async function POST() {
  // Crear la carga útil del webhook
  const payload: EMCS01Payload = {
    event_type: GITHUB_WEBHOOK_EVENT_TYPE,
    client_payload: {
      sql: "INSERT INTO \"T_Vacaciones_Interescolares\" (\"Fecha_Inicio\",\"Fecha_Conclusion\") VALUES ('2025-05-19', '2025-05-23'),('2025-07-28', '2025-08-08'),('2025-10-13', '2025-10-17');",
      params: [],
      instanciasAActualizar: [RDP02.INS1, RDP02.INS2, RDP02.INS3],
      timestamp: Date.now(),
    },
  };

  console.log("token", process.env.STATIC_TOKEN);
  // Enviar la solicitud al webhook
  const response = await fetch(GITHUB_WEBHOOK_URL, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github.v3+json",
      Authorization: `Bearer ${process.env.STATIC_TOKEN!}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  console.log(response.status, response.statusText);

  return NextResponse.json(
    {
      success: false,
      message: "Error al enviar el webhook",
    },
    { status: 500 }
  );
}
