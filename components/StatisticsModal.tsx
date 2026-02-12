import React from 'react';
import { useLanguage } from '../i18n';
import { Button } from './Button';

interface Stats {
    totalUsers: number;
    activeUsers: number;
    totalGenerations: number;
}

interface StatisticsModalProps {
    onClose: () => void;
    stats: Stats;
    onResetCredits: () => void;
}

const StatCard: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
    <div className="bg-gray-100 p-4 rounded-lg text-center">
        <div className="text-3xl font-bold text-brand-primary">{value}</div>
        <div className="text-sm text-gray-600 font-medium mt-1">{label}</div>
    </div>
);

export const StatisticsModal: React.FC<StatisticsModalProps> = ({ onClose, stats, onResetCredits }) => {
    const { t } = useLanguage();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-bold text-gray-800">{t('settings.title')}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                    <StatCard label={t('stats.totalUsers')} value={stats.totalUsers} />
                    <StatCard label={t('stats.activeUsers')} value={stats.activeUsers} />
                    <StatCard label={t('stats.totalGenerations')} value={stats.totalGenerations} />
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                     <h3 className="text-md font-semibold text-gray-700 mb-2">Admin Actions</h3>
                     <Button onClick={onResetCredits} variant="secondary">
                        {t('settings.resetButton')}
                     </Button>
                </div>
            </div>
        </div>
    );
};
