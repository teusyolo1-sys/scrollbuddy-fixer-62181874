import { useState, useRef, useCallback, useEffect } from "react";

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  suffix?: string;
  className?: string;
  draggable?: boolean;
}

export default function NumberInput({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  label,
  suffix,
  className = "",
  draggable = true,
}: NumberInputProps) {
  const [localValue, setLocalValue] = useState(String(value));
  const [isFocused, setIsFocused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, value: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(String(Math.round(value * 100) / 100));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const handleBlur = () => {
    setIsFocused(false);
    const num = parseFloat(localValue);
    if (!isNaN(num)) {
      onChange(Math.max(min, Math.min(max, num)));
    } else {
      setLocalValue(String(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
    if (e.key === "ArrowUp") { e.preventDefault(); onChange(Math.min(max, value + step)); }
    if (e.key === "ArrowDown") { e.preventDefault(); onChange(Math.max(min, value - step)); }
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!draggable || isFocused) return;
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, value };

      const handleMouseMove = (e: MouseEvent) => {
        const delta = (e.clientX - dragStartRef.current.x) * step;
        const newVal = Math.max(min, Math.min(max, dragStartRef.current.value + delta));
        onChange(Math.round(newVal * 100) / 100);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
      };

      document.body.style.cursor = "ew-resize";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [draggable, isFocused, value, step, min, max, onChange]
  );

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {label && (
        <span
          className="text-[11px] text-muted-foreground w-4 text-center select-none cursor-ew-resize"
          onMouseDown={handleMouseDown}
        >
          {label}
        </span>
      )}
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleChange}
          onFocus={() => { setIsFocused(true); inputRef.current?.select(); }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full h-7 px-2 text-[11px] font-mono bg-secondary rounded-md text-foreground border border-transparent
            focus:border-primary focus:outline-none transition-colors
            ${isDragging ? "cursor-ew-resize" : "cursor-text"}
            ${suffix ? "pr-6" : ""}`}
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
