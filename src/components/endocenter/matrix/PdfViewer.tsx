import { useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Maximize2 } from "lucide-react";
import { motion } from "framer-motion";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Configure PDF.js worker via CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  onClose?: () => void;
}

export default function PdfViewer({ url, onClose }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  }, []);

  const goToPrev = () => setPageNumber((p) => Math.max(1, p - 1));
  const goToNext = () => setPageNumber((p) => Math.min(numPages, p + 1));
  const zoomIn = () => setScale((s) => Math.min(2.5, s + 0.25));
  const zoomOut = () => setScale((s) => Math.max(0.5, s - 0.25));

  return (
    <div className="flex flex-col h-full bg-secondary/20 rounded-2xl overflow-hidden border border-border/40">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border/40 bg-card/80 shrink-0">
        <div className="flex items-center gap-1.5">
          <button onClick={goToPrev} disabled={pageNumber <= 1}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium text-muted-foreground tabular-nums min-w-[60px] text-center">
            {pageNumber} / {numPages || "..."}
          </span>
          <button onClick={goToNext} disabled={pageNumber >= numPages}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={zoomOut} disabled={scale <= 0.5}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-colors">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] font-semibold text-muted-foreground min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button onClick={zoomIn} disabled={scale >= 2.5}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30 transition-colors">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          {onClose && (
            <button onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ml-1">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* PDF content */}
      <div className="flex-1 overflow-auto flex justify-center p-4">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full"
            />
          </div>
        )}
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => {
            console.error("PDF load error:", error);
            setLoading(false);
          }}
          loading={null}
          className="flex flex-col items-center gap-4"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            className="shadow-lg rounded-lg overflow-hidden"
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
}
