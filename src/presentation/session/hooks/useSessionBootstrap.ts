import { useEffect, useState } from "react";
import { container } from "../../../di/container";
import { useAppDispatch } from "../../../store/hooks";
import { setSession, clearSession } from "../../../store/slices/sessionSlice";

export function useSessionBootstrap() {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = container.observeSessionUseCase.execute((result) => {
      if (result?.type === "existingUser") {
        dispatch(
          setSession({
            uid: result.uid,
            role: result.role as any,
            courseId: result.courseId,
            name: result.name,
            photoUrl: result.photoUrl,
          })
        );
      } else {
        dispatch(clearSession());
      }
      setIsBootstrapping(false);
    });

    return unsubscribe;
  }, [dispatch]);

  return { isBootstrapping };
}