
import React, { useCallback, useState } from 'react';
import { useLanguage } from '../i18n';

interface ImageUploaderProps {
    onImageUpload: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
    const [isDragging, setIsDragging] = useState(false);
    const { t } = useLanguage();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageUpload(e.target.files[0]);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onImageUpload(e.dataTransfer.files[0]);
        }
    }, [onImageUpload]);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    return (
        <div 
            className={`flex flex-col items-center justify-center w-full min-h-[24rem] h-full rounded-2xl transition-all duration-300 p-8 border border-dashed
            ${isDragging 
                ? 'border-brand-primary bg-brand-primary/10 shadow-glow' 
                : 'border-border-subtle bg-surface-bg/20 hover:border-brand-primary/50'}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
        >
            <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center text-center group">
                <div className={`w-20 h-20 mb-6 rounded-full flex items-center justify-center transition-all duration-300 ${isDragging ? 'bg-brand-primary text-app-bg' : 'bg-surface-bg text-text-secondary group-hover:bg-brand-primary group-hover:text-app-bg group-hover:scale-110'}`}>
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                </div>
                <p className="font-bold text-text-primary text-xl mb-2 group-hover:text-brand-primary transition-colors">{t('uploader.title')}</p>
                <p className="text-sm text-text-secondary">{t('uploader.formats')}</p>
                
                <div className="flex items-center gap-6 mt-10 opacity-50">
                     <div className="flex flex-col items-center gap-2">
                        <svg className="text-text-secondary" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                        <span className="text-[10px] uppercase font-bold tracking-wider">Crop</span>
                     </div>
                     <div className="flex flex-col items-center gap-2">
                        <svg className="text-text-secondary" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>
                        <span className="text-[10px] uppercase font-bold tracking-wider">AI Edit</span>
                     </div>
                     <div className="flex flex-col items-center gap-2">
                        <svg className="text-text-secondary" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <span className="text-[10px] uppercase font-bold tracking-wider">Resize</span>
                     </div>
                </div>
            </label>
        </div>
    );
};
