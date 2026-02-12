import React from 'react';
import { useLanguage } from '../i18n';
import { Button } from './Button';

interface WelcomeModalProps {
    onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
    const { t } = useLanguage();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('welcome.title')}</h2>
                <p className="text-gray-600 mb-6">{t('welcome.message')}</p>
                <Button onClick={onClose} variant="primary" fullWidth>
                    {t('welcome.button')}
                </Button>
            </div>
        </div>
    );
};
