import type { QuizError } from "../../../domain/model/QuizModels";

export function mapQuizErrorMessage(error: QuizError): string {
  switch (error.type) {
    case "emptyQuestionText":
      return "La pregunta no puede estar vacía";
    case "notEnoughOptions":
      return "Agrega al menos 2 opciones";
    case "invalidCorrectOption":
      return "Selecciona cuál opción es la correcta";
    case "invalidDuration":
      return "La duración debe estar entre 1 y 300 segundos";
    case "noActiveSession":
      return "No hay ninguna pregunta activa";
    case "sessionClosed":
      return "Esta pregunta ya cerró";
    case "invalidOption":
      return "Opción inválida";
    case "alreadyAnswered":
      return "Ya habías respondido esta pregunta";
    case "unknown":
      return error.message || "No se pudo completar la operación";
  }
}