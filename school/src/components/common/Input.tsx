// src/components/common/Input.tsx
import React from "react";

type InputProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
};

const Input: React.FC<InputProps> = ({ label, value, onChange, placeholder, type = "text", className }) => {
  return (
    <div className={`flex flex-col mb-3 ${className}`}>
      {label && <label className="mb-1 font-semibold">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  );
};

export default Input;
