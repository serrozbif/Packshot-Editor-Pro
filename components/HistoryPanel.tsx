import React from 'react';
import type { HistoryEntry } from '../types';
import { useLanguage } from '../i18n';

interface HistoryPanelProps {
    history: HistoryEntry[];
    currentIndex: number;
    onGoToHistory: (index: number) => void;
    disabled: boolean;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, currentIndex, onGoToHistory, disabled }) => {
    const { t } = useLanguage();

    if (history.length <= 1) {
        return null;
    }

    return (
        <div className="mb-4">
            <h3 className="text-xs font-bold text-panel-text-secondary uppercase tracking-wider mb-3">{t('history.title')}</h3>
            <div className="max-h-32 overflow-y-auto bg-gray-900 bg-opacity-25 rounded-md p-2 border border-panel-border">
                <ul className="space-y-1">
                    {history.map((item, index) => (
                        <li key={`${index}-${item.action}`}>
                            <button
                                onClick={() => onGoToHistory(index)}
                                disabled={disabled}
                                className={`w-full text-left text-sm p-2 rounded-md transition-colors duration-200 ${
                                    index === currentIndex 
                                        ? 'bg-brand-primary text-white font-bold' 
                                        : 'text-panel-text-primary hover:bg-btn-panel'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {item.action}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};