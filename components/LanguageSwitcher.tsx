import React from 'react';
import { useLanguage } from '../i18n';

type Language = 'uk' | 'en' | 'pl';

const languageNames: Record<Language, string> = {
    uk: 'Українська',
    en: 'English',
    pl: 'Polski',
};

export const LanguageSwitcher: React.FC = () => {
    const { lang, setLang } = useLanguage();

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setLang(event.target.value as Language);
    };

    return (
        <div className="relative">
            <select
                value={lang}
                onChange={handleChange}
                className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-3 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary cursor-pointer"
                aria-label="Select language"
            >
                {Object.entries(languageNames).map(([code, name]) => (
                    <option key={code} value={code}>
                        {name}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
            </div>
        </div>
    );
};