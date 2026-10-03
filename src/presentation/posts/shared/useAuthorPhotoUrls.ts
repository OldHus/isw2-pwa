import { useEffect, useRef, useState } from "react";
import { container } from "../../../di/container";

export function useAuthorPhotoUrls(authorUids: string[]): Record<string, string | null> {
  const [photoUrlByUid, setPhotoUrlByUid] = useState<Record<string, string | null>>({});
  const unsubscribersRef = useRef<Record<string, () => void>>({});
  const uidsKey = Array.from(new Set(authorUids.filter((uid) => uid.length > 0))).sort().join(",");

  useEffect(() => {
    const uniqueUids = uidsKey.length > 0 ? uidsKey.split(",") : [];
    const current = unsubscribersRef.current;

    for (const uid of Object.keys(current)) {
      if (!uniqueUids.includes(uid)) {
        current[uid]();
        delete current[uid];
        setPhotoUrlByUid((previous) => {
          if (!(uid in previous)) return previous;
          const next = { ...previous };
          delete next[uid];
          return next;
        });
      }
    }

    for (const uid of uniqueUids) {
      if (current[uid]) continue;
      current[uid] = container.observeProfilePhotoUseCase.execute(uid, (photoUrl) => {
        setPhotoUrlByUid((previous) => ({ ...previous, [uid]: photoUrl }));
      });
    }
  }, [uidsKey]);

  useEffect(() => {
    return () => {
      for (const unsubscribe of Object.values(unsubscribersRef.current)) unsubscribe();
      unsubscribersRef.current = {};
    };
  }, []);

  return photoUrlByUid;
}