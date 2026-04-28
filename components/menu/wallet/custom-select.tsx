import { Select } from "@worldcoin/mini-apps-ui-kit-react";
import { cn } from "@/lib/utils";

interface CustomSelectProps {
  defaultValue?: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ label: string; value: string }>;
  className?: string;
  placeholder?: string;
}

export function CustomSelect({
  defaultValue,
  name,
  value,
  onChange,
  options,
  className,
  placeholder,
}: CustomSelectProps) {
  const handleChange = (newValue: string) => {
    if (onChange) {
      // Create a synthetic event that matches the expected interface
      const syntheticEvent = {
        target: { value: newValue },
      } as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <div className={cn("custom-select-wrapper", className)}>
      <Select
        defaultValue={defaultValue}
        name={name}
        value={value}
        onChange={handleChange}
        options={options}
        placeholder={placeholder}
      />
    </div>
  );
}
