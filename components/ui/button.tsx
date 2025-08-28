import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', children, ...props }, ref) => {
    // Determine variant classes
    const getVariantClasses = () => {
      switch (variant) {
        case 'secondary':
          return 'bg-gray-200 text-gray-900 hover:bg-gray-300';
        case 'outline':
          return 'border border-gray-300 bg-transparent hover:bg-gray-100';
        default:
          return 'bg-blue-600 text-white hover:bg-blue-700';
      }
    };

    // Determine size classes
    const getSizeClasses = () => {
      switch (size) {
        case 'sm':
          return 'text-sm px-3 py-1.5';
        case 'lg':
          return 'text-lg px-6 py-3';
        default:
          return '';
      }
    };

    const variantClasses = getVariantClasses();
    const sizeClasses = getSizeClasses();

    return (
      <button
        ref={ref}
        className={`px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantClasses} ${sizeClasses} ${className || ''}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';