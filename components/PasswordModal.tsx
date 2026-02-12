import React, { useState } from 'react';
import { useLanguage } from '../i18n';
import { Button } from './Button';

interface PasswordModalProps {
    onSubmit: (password: string | null) => void;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ onSubmit }) => {
    const { t } = useLanguage();
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(password);
    };
    
    const handleCancel = () => {
        onSubmit(null); // Pass null when cancelled
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" aria-modal="true" role="dialog">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4">
                <form onSubmit={handleSubmit}>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">{t('settings.adminPrompt')}</h2>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        autoFocus
                        aria-label={t('settings.adminPrompt')}
                    />
                    <div className="mt-6 flex justify-end gap-2">
                        <Button type="button" onClick={handleCancel} variant="secondary">
                            {t('panel.buttons.cancel')}
                        </Button>
                        <Button type="submit" variant="primary">
                            {t('panel.buttons.apply')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};