import { MIN_GRADE, type GradeItem } from "../../../domain/model/GradeModels";

const gradeFormatter = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const textCollator = new Intl.Collator("es", { sensitivity: "base", numeric: true });
const gradePattern = /^\d*\.?\d*$/;

export type ParsedGrade =
  | { status: "empty" }
  | { status: "invalid" }
  | { status: "valid"; value: number };

export function formatGrade(value: number): string {
  return gradeFormatter.format(value);
}

/**
 * Texto para editar una nota ya guardada: usa coma sin forzar decimales,
 * para conservar la precisión y que un 5 se pueda editar directamente a 5,2.
 */
export function formatGradeForInput(value: number): string {
  return String(value).replace(".", ",");
}

export function parseGradeInput(raw: string): ParsedGrade {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { status: "empty" };

  const normalized = trimmed.replace(",", ".");
  if (!gradePattern.test(normalized) || !/\d/.test(normalized)) {
    return { status: "invalid" };
  }

  const value = Number(normalized);
  if (!Number.isFinite(value) || value < MIN_GRADE) {
    return { status: "invalid" };
  }

  return { status: "valid", value };
}

export function gradeInputError(parsed: ParsedGrade): string | null {
  return parsed.status === "invalid" ? "Ingresa una nota válida" : null;
}

export function isGradeDirty(raw: string, baseline: number | null | undefined): boolean {
  const parsed = parseGradeInput(raw);
  if (parsed.status === "invalid") return true;
  if (parsed.status === "empty") return typeof baseline === "number";
  if (typeof baseline !== "number") return true;
  return parsed.value !== baseline;
}

/**
 * Devuelve el texto con una decimal y coma para los casos simples (5, 5,2).
 * Si el docente escribió más de una decimal, se conserva el texto original
 * para no perder precisión.
 */
export function normalizeGradeText(raw: string): string | null {
  const parsed = parseGradeInput(raw);
  if (parsed.status !== "valid") return null;

  const normalized = raw.trim().replace(",", ".");
  const decimalPart = normalized.split(".")[1] ?? "";
  if (decimalPart.length > 1) return null;

  return formatGrade(parsed.value);
}

export interface StudentNameParts {
  surnames: string;
  givenNames: string;
}

/**
 * Separa el nombre completo en apellidos y nombres.
 * Regla acordada:
 * - 2 o 3 palabras: la última es el apellido.
 * - 4 o más palabras: las dos últimas son los apellidos.
 * - Si ya viene como "Apellidos, Nombres", se respeta esa separación.
 * - Sin nombre: se usa el correo.
 */
export function splitStudentName(name: string | null | undefined, email: string): StudentNameParts {
  const trimmed = (name ?? "").trim();
  if (trimmed.length === 0) return { surnames: email, givenNames: "" };

  const commaIndex = trimmed.indexOf(",");
  if (commaIndex > 0) {
    const surnames = trimmed.slice(0, commaIndex).trim().replace(/\s+/g, " ");
    const givenNames = trimmed.slice(commaIndex + 1).trim().replace(/\s+/g, " ");
    return { surnames: surnames || email, givenNames };
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 1) return { surnames: tokens[0], givenNames: "" };

  const surnameCount = tokens.length >= 4 ? 2 : 1;
  return {
    surnames: tokens.slice(-surnameCount).join(" "),
    givenNames: tokens.slice(0, -surnameCount).join(" "),
  };
}

export function formatStudentDisplayName(student: {
  name: string | null;
  email: string;
}): string {
  const { surnames, givenNames } = splitStudentName(student.name, student.email);
  return givenNames.length > 0 ? `${surnames} ${givenNames}` : surnames;
}

export function sortStudentsBySurname<T extends { name: string | null; email: string }>(
  students: T[]
): T[] {
  return [...students].sort((a, b) => {
    const partsA = splitStudentName(a.name, a.email);
    const partsB = splitStudentName(b.name, b.email);
    return (
      textCollator.compare(partsA.surnames, partsB.surnames) ||
      textCollator.compare(partsA.givenNames, partsB.givenNames) ||
      textCollator.compare((a.name ?? "").trim(), (b.name ?? "").trim()) ||
      textCollator.compare(a.email, b.email)
    );
  });
}

export function sortGradeItemsByCreationAsc(items: GradeItem[]): GradeItem[] {
  return [...items].sort((a, b) => {
    if (a.createdAt !== null) {
      if (b.createdAt !== null) {
        if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
      } else {
        // Los ítems sin creadoEn son anteriores a esta versión y van primero.
        return 1;
      }
    } else if (b.createdAt !== null) {
      return -1;
    }

    if (a.order !== b.order) return a.order - b.order;
    return textCollator.compare(a.name, b.name);
  });
}
