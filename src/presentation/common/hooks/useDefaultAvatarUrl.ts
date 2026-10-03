import { useEffect, useState } from "react";
import { getDefaultProfilePhotoUrl } from "../../../data/storage/getDefaultProfilePhotoUrl";

export function useDefaultAvatarUrl(role: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (role !== "docente" && role !== "estudiante") {
      setUrl(null);
      return;
    }
    let cancelled = false;
    getDefaultProfilePhotoUrl(role).then((resolved) => {
      if (!cancelled) setUrl(resolved);
    });
    return () => {
      cancelled = true;
    };
  }, [role]);

  return url;
}