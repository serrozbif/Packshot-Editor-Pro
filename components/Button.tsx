
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'panel' | 'icon';
    fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
    children, 
    variant = 'panel', 
    fullWidth = false, 
    className = '', 
    ...props 
}) => {
    const baseClasses = 'font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-panel-bg disabled:opacity-50 disabled:cursor-not-allowed text-sm active:scale-95';

    const variantClasses = {
        primary: 'bg-brand-primary text-app-bg hover:bg-brand-hover focus:ring-brand-primary shadow-lg shadow-brand-primary/20',
        secondary: 'bg-surface-bg text-text-primary hover:bg-surface-bg/80 hover:text-white border border-transparent focus:ring-gray-400',
        panel: 'bg-surface-bg text-text-primary hover:bg-surface-bg/80 border border-transparent',
        icon: 'p-2 flex items-center justify-center text-text-secondary hover:text-white hover:bg-surface-bg rounded-lg',
    };

    const widthClass = fullWidth ? 'w-full' : '';

    return (
        <button 
            className={`${baseClasses} ${variantClasses[variant]} ${widthClass} ${className}`} 
            {...props}
        >
            {children}
        </button>
    );
};
