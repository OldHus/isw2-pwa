import type { PostError } from "../../../domain/model/PostModels";

export function mapPostErrorMessage(error: PostError): string {
  switch (error.type) {
    case "emptyContent":
      return "La publicación necesita texto o una imagen";
    case "invalidReactionType":
      return "Reacción inválida";
    case "unknown":
      return error.message || "No se pudo completar la operación";
  }
}