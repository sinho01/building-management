"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

function formatValue(value: string) {
  if (!value) return "";
  const [integer, ...decimalParts] = value.replace(/,/g, "").split(".");
  const groupedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimalParts.length ? `${groupedInteger}.${decimalParts.join("")}` : groupedInteger;
}

export default function FormattedNumberInput({ value, onChange, step, ...props }: Props) {
  const allowDecimal = step !== undefined && Number(step) < 1;

  return (
    <input
      {...props}
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      value={formatValue(value)}
      onChange={(event) => {
        const rawValue = event.target.value.replace(/,/g, "");
        const pattern = allowDecimal ? /^\d*\.?\d*$/ : /^\d*$/;
        event.currentTarget.setCustomValidity("");
        if (pattern.test(rawValue)) onChange(rawValue);
      }}
      onBlur={(event) => {
        const numericValue = Number(event.currentTarget.value.replace(/,/g, ""));
        if (!event.currentTarget.value) return event.currentTarget.setCustomValidity("");
        if (props.min !== undefined && numericValue < Number(props.min)) {
          event.currentTarget.setCustomValidity(`최소 ${props.min} 이상 입력해 주세요.`);
        } else if (props.max !== undefined && numericValue > Number(props.max)) {
          event.currentTarget.setCustomValidity(`최대 ${props.max}까지 입력할 수 있습니다.`);
        } else {
          event.currentTarget.setCustomValidity("");
        }
      }}
    />
  );
}
