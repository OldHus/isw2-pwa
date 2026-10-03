import { useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { PostText } from "./PostText";
import styles from "./FullScreenImageViewer.module.scss";

const ZOOM_SCALE = 2.5;
const DRAG_CLICK_THRESHOLD_PX = 6;
const ENTER_DURATION_MS = 300;

interface FullScreenImageViewerProps {
  imageUrl: string;
  onDismiss: () => void;
  originRect?: DOMRect | null;
  postText?: string;
}

interface Offset {
  x: number;
  y: number;
}

export function FullScreenImageViewer({ imageUrl, onDismiss, originRect, postText }: FullScreenImageViewerProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const hasOrigin = originRect != null;
  const hasCaption = (postText ?? "").trim().length > 0;

  const [entering, setEntering] = useState(hasOrigin);
  const [flipTransform, setFlipTransform] = useState<string | null>(null);

  const [zoomed, setZoomed] = useState(false);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const dragStartPointerRef = useRef<Offset>({ x: 0, y: 0 });
  const dragStartOffsetRef = useRef<Offset>({ x: 0, y: 0 });
  const draggedDistanceRef = useRef(0);

  useLayoutEffect(() => {
    if (!originRect || !imgRef.current) {
      setEntering(false);
      return;
    }

    const finalRect = imgRef.current.getBoundingClientRect();
    if (finalRect.width === 0 || finalRect.height === 0) {
      setEntering(false);
      return;
    }

    const deltaX = originRect.left + originRect.width / 2 - (finalRect.left + finalRect.width / 2);
    const deltaY = originRect.top + originRect.height / 2 - (finalRect.top + finalRect.height / 2);
    const scaleX = originRect.width / finalRect.width;
    const scaleY = originRect.height / finalRect.height;

    setFlipTransform(`translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`);

    const frame = requestAnimationFrame(() => {
      setFlipTransform(null);
    });

    const timeout = window.setTimeout(() => setEntering(false), ENTER_DURATION_MS);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, []);

  function handlePointerDown(event: React.PointerEvent<HTMLImageElement>) {
    if (!zoomed || entering) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    dragStartPointerRef.current = { x: event.clientX, y: event.clientY };
    dragStartOffsetRef.current = offset;
    draggedDistanceRef.current = 0;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLImageElement>) {
    if (!dragging) return;
    const deltaX = event.clientX - dragStartPointerRef.current.x;
    const deltaY = event.clientY - dragStartPointerRef.current.y;
    draggedDistanceRef.current = Math.hypot(deltaX, deltaY);
    setOffset({ x: dragStartOffsetRef.current.x + deltaX, y: dragStartOffsetRef.current.y + deltaY });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLImageElement>) {
    event.stopPropagation();
    setDragging(false);
    if (entering) return;
    if (draggedDistanceRef.current < DRAG_CLICK_THRESHOLD_PX) {
      if (zoomed) {
        setZoomed(false);
        setOffset({ x: 0, y: 0 });
      } else {
        setZoomed(true);
      }
    }
  }

  function handleClick(event: React.MouseEvent<HTMLImageElement>) {
    event.stopPropagation();
  }

  const zoomTransform = zoomed
    ? `scale(${ZOOM_SCALE}) translate(${offset.x / ZOOM_SCALE}px, ${offset.y / ZOOM_SCALE}px)`
    : undefined;

  const transform = flipTransform ?? zoomTransform;

  return (
    <div className={styles.overlay} role="presentation" onClick={onDismiss}>
      <button type="button" className={styles.closeButton} onClick={onDismiss} aria-label="Cerrar">
        <X size={22} aria-hidden="true" />
      </button>

      {/* Mask */}
      <div className={styles.imageMask}>
        <img
          ref={imgRef}
          src={imageUrl}
          alt=""
          className={
            zoomed
              ? `${styles.image} ${dragging ? styles.imageDragging : styles.imageZoomed}`
              : hasOrigin
              ? styles.image
              : `${styles.image} ${styles.imageEnterPop}`
          }
          style={transform ? { transform } : undefined}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={handleClick}
        />
      </div>

      {hasCaption && (
        <div className={styles.captionSheet} onClick={(event) => event.stopPropagation()}>
          <PostText text={postText as string} className={styles.captionText} />
        </div>
      )}
    </div>
  );
}