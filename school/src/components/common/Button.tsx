
import React from "react";

type ButtonProps = {
  type?: "primary" | "secondary" | "danger";
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
};

const Button: React.FC<ButtonProps> = ({ type = "primary", onClick, children, disabled, className }) => {
  const baseStyle = "px-4 py-2 rounded font-semibold transition";
  const typeStyle =
    type === "primary"
      ? "bg-blue-500 text-white hover:bg-blue-600"
      : type === "secondary"
      ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
      : "bg-red-500 text-white hover:bg-red-600";

  return (
    <button
      className={`${baseStyle} ${typeStyle} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
