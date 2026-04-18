import { useId } from "react";

type SliderStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
};

export default function SliderStepper({
  value,
  onChange,
  min = 1,
  max = 5,
}: SliderStepperProps) {
  const id = useId();
  const levels = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <div className="relative w-full">
      <div className="relative h-8">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-surface-container-highest" />

        <div
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary transition-all duration-200"
          style={{ width: `${progress}%` }}
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-between">
          {levels.map((level) => {
            const isActive = level <= value;
            return (
              <span
                key={level}
                className={`rounded-full transition-all duration-200 ${
                  level === value
                    ? "h-3 w-3 bg-primary"
                    : isActive
                      ? "h-2.5 w-2.5 bg-primary/80"
                      : "h-2.5 w-2.5 bg-outline-variant"
                }`}
              />
            );
          })}
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          list={id}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-stepper absolute inset-0 z-10 h-8 w-full appearance-none bg-transparent"
          aria-label="Select level"
        />

        <datalist id={id}>
          {levels.map((level) => (
            <option key={level} value={level} />
          ))}
        </datalist>
      </div>
    </div>
  );
}
