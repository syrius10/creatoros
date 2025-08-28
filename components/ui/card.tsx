import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }: CardProps) => {
  return <div className={`p-6 pb-0 ${className}`}>{children}</div>;
};

export const CardTitle = ({ children, className = '' }: CardProps) => {
  return <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>;
};

export const CardContent = ({ children, className = '' }: CardProps) => {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
};