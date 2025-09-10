import React from 'react';

const Button = ({ 
  children, 
  type = 'button', 
  disabled = false, 
  fullWidth = false, 
  variant = 'primary',
  onClick,
  className = '',
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 border font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200';
  
  const variants = {
    primary: 'border-transparent text-white bg-orange-500 hover:bg-orange-600 focus:ring-orange-500',
    secondary: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-orange-500',
    danger: 'border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed';
  const fullWidthClass = fullWidth ? 'w-full' : '';

  const buttonClasses = [
    baseClasses,
    variants[variant],
    disabled ? disabledClasses : '',
    fullWidthClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={buttonClasses}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
