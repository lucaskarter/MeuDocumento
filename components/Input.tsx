import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && <label className="text-sm font-semibold text-brand-dark">{label}</label>}
      <input 
        className={`px-4 py-3 rounded-xl border-2 border-brand-light focus:border-brand-primary focus:ring-2 focus:ring-brand-light outline-none transition-all bg-white/80 text-brand-dark placeholder:text-gray-400 ${className}`}
        {...props}
      />
    </div>
  );
};