"use client";

interface OptionStepProps<T extends string> {
  title: string;
  options: readonly T[] | readonly { label: string; value: T }[];
  value?: T;
  onSelect: (value: T) => void;
  loading?: boolean;
}

export function OptionStep<T extends string>({
  title,
  options,
  value,
  onSelect,
  loading,
}: OptionStepProps<T>) {
  return (
    <div>
      <h2 className="text-4xl font-bold mb-8">
        {loading ? "Loading..." : title}
      </h2>

      <div className="grid gap-4 max-h-96 overflow-y-auto">
        {options.map((opt) => {
          const label = typeof opt === "string" ? opt : opt.label;

          const val = typeof opt === "string" ? opt : opt.value;

          return (
            <button
              key={val}
              type="button"
              onClick={() => onSelect(val)}
              className={`border rounded-xl p-4 text-lg transition hover:scale-105 ${
                value === val ? "border-primary bg-primary/10" : ""
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
