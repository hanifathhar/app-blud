"use client";

interface ModernSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
}

export default function ModernSwitch({
  checked,
  onChange,
}: ModernSwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 ${
        checked ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-300 ${
          checked ? "translate-x-8" : "translate-x-1"
        }`}
      />
    </button>
  );
}