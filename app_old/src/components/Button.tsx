import type { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  icon,
  className = '',
  fullWidth = false,
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-primary-500 to-primary-400 hover:from-primary-400 hover:to-primary-500 text-white shadow-lg hover:shadow-xl focus:ring-primary-500 active:scale-95',
    secondary:
      'bg-dark-700 hover:bg-dark-600 text-white border border-dark-600 hover:border-dark-500 focus:ring-primary-500',
    danger:
      'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white shadow-lg hover:shadow-xl focus:ring-red-500 active:scale-95',
    success:
      'bg-gradient-to-r from-accent-400 to-accent-500 hover:from-accent-500 hover:to-accent-400 text-white shadow-lg hover:shadow-xl focus:ring-accent-400 active:scale-95',
    ghost:
      'bg-transparent hover:bg-dark-700/50 text-gray-300 hover:text-white border border-transparent hover:border-dark-600',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3.5 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}
