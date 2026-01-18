
import React from "react";

type CardProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
};

const Card: React.FC<CardProps> = ({ title, children, className }) => {
  return (
    <div className={`bg-white shadow rounded p-4 ${className}`}>
      {title && <h3 className="font-bold text-lg mb-2">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
