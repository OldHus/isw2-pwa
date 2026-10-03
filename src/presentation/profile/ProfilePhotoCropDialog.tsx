import { useRef, useState } from "react";
import styles from "./ProfilePhotoCropDialog.module.scss";

const FRAME_SIZE = 240;
const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

interface ProfilePhotoCropDialogProps {
  file: File;
  onCancel: () => void;
  onConfirm: (croppedFile: File) => void;
}

interface Offset {
  x: number;
  y: number;
}

export function ProfilePhotoCropDialog({ file, onCancel, onConfirm }: ProfilePhotoCropDialogProps) {
  const [imageUrl] = useState(() => URL.createObjectURL(file));
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const dragStartPointerRef = useRef<Offset>({ x: 0, y: 0 });
  const dragStartOffsetRef = useRef<Offset>({ x: 0, y: 0 });
  const revokedRef = useRef(false);

  function revokeImageUrl() {
    if (revokedRef.current) return;
    revokedRef.current = true;
    URL.revokeObjectURL(imageUrl);
  }

  function handleCancel() {
    revokeImageUrl();
    onCancel();
  }

  if (!naturalSize) {
    return (
      <div className={styles.overlay} role="presentation">
        <img
          src={imageUrl}
          alt=""
          className={styles.hiddenProbe}
          onLoad={(event) => {
            const img = event.currentTarget;
            setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
          }}
        />
      </div>
    );
  }
  
  const baseScale = Math.max(FRAME_SIZE / naturalSize.width, FRAME_SIZE / naturalSize.height);
  const totalScale = baseScale * zoom;
  const displayedWidth = naturalSize.width * totalScale;
  const displayedHeight = naturalSize.height * totalScale;

  function clampOffset(candidate: Offset, width: number, height: number): Offset {
    const minX = FRAME_SIZE - width;
    const minY = FRAME_SIZE - height;
    return {
      x: Math.min(0, Math.max(minX, candidate.x)),
      y: Math.min(0, Math.max(minY, candidate.y)),
    };
  }

  function handlePointerDown(event: React.PointerEvent<HTMLImageElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    dragStartPointerRef.current = { x: event.clientX, y: event.clientY };
    dragStartOffsetRef.current = offset;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLImageElement>) {
    if (!dragging) return;
    const deltaX = event.clientX - dragStartPointerRef.current.x;
    const deltaY = event.clientY - dragStartPointerRef.current.y;
    const candidate = {
      x: dragStartOffsetRef.current.x + deltaX,
      y: dragStartOffsetRef.current.y + deltaY,
    };
    setOffset(clampOffset(candidate, displayedWidth, displayedHeight));
  }

  function handlePointerUp() {
    setDragging(false);
  }

  function handleZoomChange(nextZoom: number) {
    const nextTotalScale = baseScale * nextZoom;
    const nextWidth = naturalSize!.width * nextTotalScale;
    const nextHeight = naturalSize!.height * nextTotalScale;
    setZoom(nextZoom);
    setOffset((previous) => clampOffset(previous, nextWidth, nextHeight));
  }

  function handleConfirm() {
    const sourceImage = imgRef.current;
    if (!sourceImage) return;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const context = canvas.getContext("2d");
    if (!context) return;


    const sourceX = -offset.x / totalScale;
    const sourceY = -offset.y / totalScale;
    const sourceSize = FRAME_SIZE / totalScale;

    context.drawImage(
      sourceImage,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      OUTPUT_SIZE,
      OUTPUT_SIZE
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const baseName = file.name.replace(/\.[^./\\]+$/, "");
        const croppedFile = new File([blob], `${baseName || "foto"}.jpg`, { type: "image/jpeg" });
        revokeImageUrl();
        onConfirm(croppedFile);
      },
      "image/jpeg",
      0.92
    );
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Recortar foto de perfil">
      <div className={styles.dialog}>
        <h2 className={styles.title}>Ajusta tu foto</h2>
        <p className={styles.hint}>Arrastra para centrar. Usa el control para acercar o alejar.</p>

        <div className={styles.frame} style={{ width: FRAME_SIZE, height: FRAME_SIZE }}>
          <img
            ref={imgRef}
            src={imageUrl}
            alt=""
            className={dragging ? `${styles.image} ${styles.imageDragging}` : styles.image}
            style={{
              width: displayedWidth,
              height: displayedHeight,
              transform: `translate(${offset.x}px, ${offset.y}px)`,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            draggable={false}
          />
          <div className={styles.circleMask} aria-hidden="true" />
        </div>

        <input
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(event) => handleZoomChange(Number(event.target.value))}
          className={styles.zoomSlider}
          aria-label="Acercar o alejar"
        />

        <div className={styles.actions}>
          <button type="button" className={styles.cancelButton} onClick={handleCancel}>
            Cancelar
          </button>
          <button type="button" className={styles.confirmButton} onClick={handleConfirm}>
            Usar foto
          </button>
        </div>
      </div>
    </div>
  );
}