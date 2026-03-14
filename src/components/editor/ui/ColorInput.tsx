import { useState, useRef, useEffect } from "react";

interface ColorInputProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export default function ColorInput({ value, onChange, label }: ColorInputProps) {
  const [hexInput, setHexInput] = useState(value.replace("#", "").toUpperCase());
  const pickerRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHexInput(value.replace("#", "").toUpperCase());
  }, [value]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace("#", "");
    setHexInput(val.toUpperCase());
    if (/^[0-9A-Fa-f]{3,6}$/.test(val)) {
      const hex = val.length === 3
        ? val.split("").map(c => c + c).join("")
        : val;
      if (hex.length === 6) onChange(`#${hex.toUpperCase()}`);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[11px] text-muted-foreground w-12 shrink-0">{label}</span>}
      <button
        className="w-6 h-6 rounded border border-border hover:border-primary transition-colors shrink-0"
        style={{ backgroundColor: value }}
        onClick={() => pickerRef.current?.click()}
      />
      <input
        ref={pickerRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        className="hidden"
      />
      <input
        type="text"
        value={hexInput}
        onChange={handleHexChange}
        maxLength={6}
        className="w-16 h-6 px-1.5 text-[10px] font-mono bg-secondary rounded text-foreground border border-transparent focus:border-primary focus:outline-none"
      />
    </div>
  );
}
