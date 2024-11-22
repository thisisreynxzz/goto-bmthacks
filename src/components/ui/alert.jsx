import React from 'react';

export const Alert = ({ children, className = '', ...props }) => {
  return (
    <div
      role="alert"
      className={`relative w-full rounded-lg border p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const AlertTitle = ({ children, className = '', ...props }) => {
  return (
    <h5
      className={`mb-1 font-medium leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h5>
  );
};

export const AlertDescription = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`text-sm [&_p]:leading-relaxed ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};