import { useEffect, useMemo, useRef, useState } from "react";
import { Document, Page } from "react-pdf";
import { ZoomIn, ZoomOut, Download } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./pdfWorkerConfig";
import styles from "./PdfViewer.module.scss";

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;
const CONTAINER_PADDING = 40;
const MAX_PAGE_WIDTH = 760;

interface PdfViewerProps {
  url: string;
  onDownload: () => void;
}

export function PdfViewer({ url, onDownload }: PdfViewerProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [numPages, setNumPages] = useState(0);
  const [visiblePage, setVisiblePage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [renderError, setRenderError] = useState(false);

  useEffect(() => {
    const node = scrollAreaRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const scrollNode = scrollAreaRef.current;
    if (!scrollNode || numPages === 0) return;

    let frameId: number | null = null;

    function updateVisiblePage() {
      if (!scrollNode) return;
      const containerTop = scrollNode.getBoundingClientRect().top;
      let current = 1;

      pageRefs.current.forEach((el, index) => {
        if (!el) return;
        const pageTop = el.getBoundingClientRect().top - containerTop;
        if (pageTop < scrollNode.clientHeight * 0.5) {
          current = index + 1;
        }
      });

      setVisiblePage(current);
    }

    function onScroll() {
      if (frameId !== null) return;
      frameId = requestAnimationFrame(() => {
        updateVisiblePage();
        frameId = null;
      });
    }

    scrollNode.addEventListener("scroll", onScroll, { passive: true });
    updateVisiblePage();

    return () => {
      scrollNode.removeEventListener("scroll", onScroll);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [numPages]);

  const pageWidth = useMemo(() => {
    if (containerWidth === 0) return undefined;
    return Math.floor(Math.min(containerWidth - CONTAINER_PADDING, MAX_PAGE_WIDTH) * zoom);
  }, [containerWidth, zoom]);

  const pageNumbers = useMemo(() => Array.from({ length: numPages }, (_, i) => i + 1), [numPages]);

  return (
    <div className={styles.viewer}>
      <div className={styles.toolbar}>
        <span className={styles.pageIndicator} aria-live="polite">
          Página {visiblePage} de {numPages || "…"}
        </span>

        <div className={styles.zoomControls}>
          <button
            className={styles.iconButton}
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)))}
            disabled={zoom <= MIN_ZOOM}
            aria-label="Alejar"
          >
            <ZoomOut size={18} />
          </button>
          <span className={styles.zoomIndicator}>{Math.round(zoom * 100)}%</span>
          <button
            className={styles.iconButton}
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)))}
            disabled={zoom >= MAX_ZOOM}
            aria-label="Acercar"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        <button className={styles.downloadButton} onClick={onDownload} aria-label="Descargar syllabus">
          <Download size={16} />
          <span>Descargar</span>
        </button>
      </div>

      <div className={styles.pageArea} ref={scrollAreaRef}>
        {renderError ? (
          <p className={styles.renderError} role="alert">
            No se pudo mostrar el PDF en el visor. Puedes descargarlo con el botón de arriba.
          </p>
        ) : (
          <Document
            file={url}
            onLoadSuccess={({ numPages: total }) => {
              pageRefs.current = new Array(total).fill(null);
              setNumPages(total);
            }}
            onLoadError={() => setRenderError(true)}
            loading={<p className={styles.loadingText}>Cargando el documento…</p>}
          >
            {pageWidth &&
              pageNumbers.map((pageNumber) => (
                <div
                  key={pageNumber}
                  ref={(el) => {
                    pageRefs.current[pageNumber - 1] = el;
                  }}
                  className={styles.pageWrapper}
                >
                  <Page pageNumber={pageNumber} width={pageWidth} />
                </div>
              ))}
          </Document>
        )}
      </div>
    </div>
  );
}