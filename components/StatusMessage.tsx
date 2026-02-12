
import React from 'react';
import type { Status } from '../types';

export const StatusMessage: React.FC<Status> = ({ message, type }) => {
    const baseClasses = 'fixed bottom-5 right-5 text-white py-3 px-6 rounded-lg shadow-xl transition-opacity duration-500';
    const typeClasses = {
        success: 'bg-green-500',
        error: 'bg-red-500',
    };

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`}>
            {message}
        </div>
    );
};
   