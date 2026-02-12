import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n';

interface CreditsDisplayProps {
    credits: number;
    resetTimestamp: number | null;
    onSettings: () => void;
    remainingMinuteCredits: number;
    minuteResetTimestamp: number | null;
}

const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return "00:00:00";

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
};


export const CreditsDisplay: React.FC<CreditsDisplayProps> = ({ credits, resetTimestamp, onSettings, remainingMinuteCredits, minuteResetTimestamp }) => {
    const { t } = useLanguage();
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [minuteTimeRemaining, setMinuteTimeRemaining] = useState<string>('');

    useEffect(() => {
        if (!resetTimestamp || Date.now() > resetTimestamp) {
            setTimeRemaining(t('credits.noTimer'));
            return;
        }

        const updateTimer = () => {
            const remaining = resetTimestamp - Date.now();
            if (remaining > 0) {
                setTimeRemaining(formatTimeRemaining(remaining));
            } else {
                setTimeRemaining("00:00:00");
                clearInterval(interval);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [resetTimestamp, t]);

    useEffect(() => {
        if (!minuteResetTimestamp || Date.now() > minuteResetTimestamp) {
            setMinuteTimeRemaining('');
            return;
        }

        const updateTimer = () => {
            const remaining = minuteResetTimestamp - Date.now();
            if (remaining > 0) {
                const totalSeconds = Math.floor(remaining / 1000);
                const seconds = (totalSeconds % 60).toString().padStart(2, '0');
                setMinuteTimeRemaining(`00:${seconds}`);
            } else {
                setMinuteTimeRemaining("00:00");
                clearInterval(interval);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, [minuteResetTimestamp]);

    return (
        <div className="flex items-center gap-4 bg-gray-100 p-2 rounded-lg border border-gray-200">
            <div className="text-center">
                <div className="text-xs text-gray-500 font-semibold uppercase">{t('credits.remaining')}</div>
                <div className="text-xl font-bold text-gray-800">{credits}</div>
            </div>
            <div className="w-px h-10 bg-gray-300"></div>
            <div className="text-center min-w-[110px]">
                <div className="text-xs text-gray-500 font-semibold uppercase">{t('credits.resetsIn')}</div>
                <div className="text-xl font-mono font-bold text-brand-primary">{timeRemaining}</div>
            </div>
            
            <div className="w-px h-10 bg-gray-300"></div>

            <div className="text-center">
                <div className="text-xs text-gray-500 font-semibold uppercase">{t('credits.minuteLimit')}</div>
                {remainingMinuteCredits <= 2 ? (
                     <div className="text-sm font-bold text-white bg-red-500 rounded px-2 h-7 flex items-center justify-center blinking-warning">{t('credits.limit_reached')}</div>
                ) : (
                    <div className={`text-xl font-bold rounded px-2 h-7 flex items-center justify-center ${remainingMinuteCredits <= 3 ? 'text-white bg-red-500 blinking-warning' : 'text-gray-800'}`}>{remainingMinuteCredits}</div>
                )}
            </div>
            <div className="w-px h-10 bg-gray-300"></div>
            <div className="text-center min-w-[60px]">
                <div className="text-xs text-gray-500 font-semibold uppercase">{t('credits.resetsIn')}</div>
                <div className="text-xl font-mono font-bold text-brand-primary">{minuteTimeRemaining || '--:--'}</div>
            </div>


             <button
                onClick={onSettings}
                title={t('settings.title')}
                className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
                aria-label="Open settings and statistics"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
            </button>
        </div>
    );
};