import type { PollError } from "../../../domain/model/PollModels";


export function mapPollErrorMessage(error: PollError): string {
  switch (error.type) {
    case "emptyQuestion":
      return "La pregunta no puede estar vacía";
    case "notEnoughOptions":
      return "Agrega al menos 2 opciones";
    case "invalidExpiration":
      return "Elige una fecha y hora de cierre futura";
    case "noActivePoll":
      return "Esta encuesta ya no está activa";
    case "notAuthenticated":
      return "Usuario no autenticado";
    case "unknown":
      return error.message || "No se pudo completar la operación";
  }
}