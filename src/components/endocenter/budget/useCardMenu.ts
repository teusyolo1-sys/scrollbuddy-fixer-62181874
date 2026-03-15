import { useState, useCallback } from "react";

export function useCardMenu() {
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxPos({ x: e.clientX, y: e.clientY });
  }, []);

  return {
    ctxPos, setCtxPos,
    isRenaming, setIsRenaming,
    isFullscreen, setIsFullscreen,
    handleContextMenu,
  };
}
