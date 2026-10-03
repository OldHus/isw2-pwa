import type { AttendanceError } from "../../../domain/model/AttendanceModels";

export function mapAttendanceErrorMessage(error: AttendanceError): string {
  switch (error.type) {
    case "emptyCode":
      return "El código no puede estar vacío";
    case "invalidDuration":
      return "La duración debe ser mayor a cero minutos";
    case "invalidCode":
      return "El código ingresado no es correcto";
    case "sessionExpired":
      return "El tiempo para registrar asistencia expiró";
    case "noActiveSession":
      return "No hay una sesión de asistencia activa";
    case "alreadyRegistered":
      return "Ya habías registrado tu asistencia";
    case "unknown":
      return error.message || "No se pudo completar la operación";
  }
}
