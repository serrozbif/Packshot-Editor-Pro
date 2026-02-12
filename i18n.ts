
import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';

type Language = 'uk' | 'en' | 'pl';

const translations = {
    en: {
        app: {
            title: "Packshot Editor Pro",
            subtitle: "Image editing tool for the Customer Intelligence department"
        },
        counter: {
            label: "Actions",
            reset: "Reset Counter"
        },
        uploader: {
            title: "Click to upload, or drag and drop a file",
            formats: "PNG, JPG, WEBP"
        },
        steps: {
            step1: "1. Preparation",
            step2: "2. AI Processing",
            step3: "3. Finalization"
        },
        panel: {
            title: "Toolbar",
            info: {
                currentSize: "Current Size",
                margins: "Object Margins"
            },
            crop: {
                title: "Crop",
                description: "Select an area to crop.",
                tip: "",
                instruction: "",
                modeSquare: "",
                modeFree: ""
            },
            blur: {
                title: "Blur Area",
                instruction: "Draw a loop around the area you want to blur.",
                intensity: "Intensity",
                apply: "Apply Blur"
            },
            tooltip: {
                removeBg: "Remove Background & Watermarks / Auto White Balance",
                rotate: "Rotate 90°",
                crop: "Crop",
                autoCrop: "Auto Crop",
                undo: "Undo",
                redo: "Redo",
                history: "Show History"
            },
            hints: {
                rotate: "Rotate Image",
                crop: "Crop",
                ai: "AI Cleanup",
                prompt: "AI Instructions",
                resize: "Select preset (auto margins applied)",
                margins: "Set spacing",
                save: "Download Result",
                accept: "Confirm Step",
                blur: "Blur Lasso"
            },
            customPrompt: {
                label: "Additional Instructions",
                placeholder: "e.g., Keep the original shadow..."
            },
            aiCredits: {
                label: "AI Credits",
                tooltip: "Daily usage limit for AI functions. Resets every day."
            },
            color: {
                title: "Color",
                brightness: "Brightness",
                contrast: "Contrast"
            },
            size: {
                title: "Size & Margins"
            },
            buttons: {
                apply: "Apply",
                accept: "Confirm",
                resetBlock: "Reset",
                cancel: "Cancel",
                applyCorrection: "Correction",
                addMargins: "Add",
                makeSquare: "Square",
                save: "Save",
                newImage: "New",
                undo: "Undo",
                redo: "Redo",
                reset: "Reset All",
                blur: "Blur"
            }
        },
        history: {
            title: "History",
            original: "Original",
            resize: "Resize & Margins",
            addMargins: "Margins +{{margin}}",
            rotate: "Rotate 90°",
            removeBackground: "BG Removal",
            removeLogoBackground: "Logo BG Removed",
            colorCorrection: "Color Correction",
            crop: "Crop",
            autoCrop: "Auto Crop",
            makeSquare: "Square Fit",
            blur: "Blur Area"
        },
        status: {
            uploadError: "Failed to upload file.",
            resetSuccess: "Image reset to original.",
            stepResetSuccess: "Step changes reset.",
            undoSuccess: "Undone.",
            redoSuccess: "Redone.",
            newImageReady: "Ready for new image.",
            historyRestored: "Restored: \"{{action}}\"",
            resizeSuccess: "Resized to {{size}}px (Auto Margin).",
            resizeError: "Error resizing image.",
            addMarginsSuccess: "Margins added.",
            addMarginsError: "Error adding margins.",
            rotateSuccess: "Rotated 90°.",
            rotateError: "Error rotating image.",
            removeBackgroundSuccess: "Background removed.",
            colorCorrectionSuccess: "Color adjusted.",
            colorCorrectionError: "Error adjusting color.",
            cropSuccess: "Cropped.",
            cropError: "Error cropping.",
            autoCropSuccess: "Auto-cropped.",
            autoCropError: "Error auto-cropping.",
            objectNotFound: "Object not found.",
            saveSuccess: "Saved.",
            noCreditsError: "Daily limit reached.",
            makeSquareSuccess: "Squared.",
            blurSuccess: "Blurred.",
            blurError: "Error blurring.",
            counterReset: "Counter reset."
        },
        errors: {
            quotaExceeded: "AI limit exceeded.",
            aiProcessingError: "AI error.",
            noImageData: "No image data.",
            noImageDataBalance: "No balance data.",
            default: "Error."
        },
        welcome: {
            title: "Usage Limits",
            message: "This application has a usage limit of 10 requests per minute and 250 requests per day. Each use of the AI background removal feature counts towards the daily limit.",
            button: "I understand"
        },
        credits: {
            remaining: "Credits",
            resetsIn: "Resets",
            noTimer: "Unused",
            minuteLimit: "/ Min",
            limit_reached: "LIMIT"
        },
        settings: {
            title: "Settings",
            adminPrompt: "Admin Password:",
            resetSuccess: "Credits reset.",
            resetError: "Wrong password.",
            resetButton: "Reset Credits"
        },
        stats: {
            totalUsers: "Users",
            activeUsers: "Active",
            totalGenerations: "Generations"
        }
    },
    uk: {
        app: {
            title: "Packshot Editor Pro",
            subtitle: "Інструмент для редагування зображень"
        },
        counter: {
            label: "Дії",
            reset: "Скинути лічильник"
        },
        uploader: {
            title: "Натисніть або перетягніть файл",
            formats: "PNG, JPG, WEBP"
        },
        steps: {
            step1: "1. Підготовка",
            step2: "2. AI Обробка",
            step3: "3. Фіналізація"
        },
        panel: {
            title: "Інструменти",
            info: {
                currentSize: "Розмір",
                margins: "Поля"
            },
            crop: {
                title: "Кадрування",
                description: "Виберіть область для кадрування.",
                tip: "",
                instruction: "",
                modeSquare: "",
                modeFree: ""
            },
            blur: {
                title: "Розмиття",
                instruction: "Обведіть область для розмиття.",
                intensity: "Сила",
                apply: "Застосувати"
            },
            tooltip: {
                removeBg: "Видалити фон / Автобаланс",
                rotate: "Поворот 90°",
                crop: "Кадрувати",
                autoCrop: "Авто",
                undo: "Назад",
                redo: "Вперед",
                history: "Історія"
            },
            hints: {
                rotate: "Поворот",
                crop: "Кадрування",
                ai: "AI Очищення",
                prompt: "Інструкції AI",
                resize: "Виберіть пресет (авто відступи)",
                margins: "Відступи",
                save: "Завантажити",
                accept: "Далі",
                blur: "Ласо розмиття"
            },
            customPrompt: {
                label: "Інструкції (опц.)",
                placeholder: "напр., залиш тінь..."
            },
            aiCredits: {
                label: "Кредити",
                tooltip: "Денний ліміт."
            },
            color: {
                title: "Колір",
                brightness: "Яскравість",
                contrast: "Контраст"
            },
            size: {
                title: "Розмір"
            },
            buttons: {
                apply: "Застосувати",
                accept: "Далі",
                resetBlock: "Скинути",
                cancel: "Скасувати",
                applyCorrection: "Корекція",
                addMargins: "Додати",
                makeSquare: "Квадрат",
                save: "Зберегти",
                newImage: "Нове",
                undo: "Назад",
                redo: "Вперед",
                reset: "Скинути Все",
                blur: "Розмиття"
            }
        },
        history: {
            title: "Історія",
            original: "Оригінал",
            resize: "Розмір та Відступи",
            addMargins: "Поля +{{margin}}px",
            rotate: "Поворот",
            removeBackground: "Видалення фону",
            removeLogoBackground: "Лого фон",
            colorCorrection: "Колір",
            crop: "Кадрування",
            autoCrop: "Автокадрування",
            makeSquare: "Квадрат",
            blur: "Розмиття"
        },
        status: {
            uploadError: "Помилка завантаження.",
            resetSuccess: "Скинуто.",
            stepResetSuccess: "Етап скинуто.",
            undoSuccess: "Скасовано.",
            redoSuccess: "Повернуто.",
            newImageReady: "Готово.",
            historyRestored: "Відновлено: \"{{action}}\"",
            resizeSuccess: "Розмір {{size}}px (Авто відступ).",
            resizeError: "Помилка розміру.",
            addMarginsSuccess: "Поля додано.",
            addMarginsError: "Помилка полів.",
            rotateSuccess: "Повернуто.",
            rotateError: "Помилка.",
            removeBackgroundSuccess: "Фон видалено.",
            colorCorrectionSuccess: "Колір змінено.",
            colorCorrectionError: "Помилка кольору.",
            cropSuccess: "Кадровано.",
            cropError: "Помилка.",
            autoCropSuccess: "Авто-кадрування.",
            autoCropError: "Помилка.",
            objectNotFound: "Об'єкт не знайдено.",
            saveSuccess: "Збережено.",
            noCreditsError: "Ліміт вичерпано.",
            makeSquareSuccess: "Квадрат.",
            blurSuccess: "Розмито.",
            blurError: "Помилка.",
            counterReset: "Лічильник скинуто."
        },
        errors: {
            quotaExceeded: "Ліміт перевищено.",
            aiProcessingError: "Помилка AI.",
            noImageData: "Немає даних.",
            noImageDataBalance: "Немає балансу.",
            default: "Помилка."
        },
        welcome: {
            title: "Ліміти",
            message: "Ліміт: 10/хв, 250/день.",
            button: "ОК"
        },
        credits: {
            remaining: "Кредити",
            resetsIn: "Скидання",
            noTimer: "-",
            minuteLimit: "/ Хв",
            limit_reached: "MAX"
        },
        settings: {
            title: "Налаштування",
            adminPrompt: "Пароль:",
            resetSuccess: "Скинуто.",
            resetError: "Невірний пароль.",
            resetButton: "Скинути"
        },
        stats: {
            totalUsers: "Користувачі",
            activeUsers: "Активні",
            totalGenerations: "Генерації"
        }
    },
    pl: {
        app: {
            title: "Packshot Editor Pro",
            subtitle: "Edytor zdjęć"
        },
        counter: {
            label: "Akcje",
            reset: "Resetuj licznik"
        },
        uploader: {
            title: "Wgraj plik",
            formats: "PNG, JPG, WEBP"
        },
        steps: {
            step1: "1. Przygotowanie",
            step2: "2. Przetwarzanie AI",
            step3: "3. Finalizacja"
        },
        panel: {
            title: "Narzędzia",
            info: {
                currentSize: "Rozmiar",
                margins: "Marginesy"
            },
            crop: {
                title: "Kadrowanie",
                description: "Zaznacz obszar.",
                tip: "",
                instruction: "",
                modeSquare: "",
                modeFree: ""
            },
            blur: {
                title: "Rozmycie",
                instruction: "Obrysuj obszar.",
                intensity: "Siła",
                apply: "Zastosuj"
            },
            tooltip: {
                removeBg: "Usuń tło / Auto balans",
                rotate: "Obrót 90°",
                crop: "Przytnij",
                autoCrop: "Auto",
                undo: "Cofnij",
                redo: "Ponów",
                history: "Historia"
            },
            hints: {
                rotate: "Obrót",
                crop: "Kadrowanie",
                ai: "AI Czyszczenie",
                prompt: "Instrukcje AI",
                resize: "Wybierz preset (auto margines)",
                margins: "Odstępy",
                save: "Pobierz",
                accept: "Dalej",
                blur: "Lasso rozmycia"
            },
            customPrompt: {
                label: "Instrukcje (opc.)",
                placeholder: "np. zachowaj cień..."
            },
            aiCredits: {
                label: "Kredyty",
                tooltip: "Limit dzienny."
            },
            color: {
                title: "Kolor",
                brightness: "Jasność",
                contrast: "Kontrast"
            },
            size: {
                title: "Rozmiar"
            },
            buttons: {
                apply: "Zastosuj",
                accept: "Dalej",
                resetBlock: "Reset",
                cancel: "Anuluj",
                applyCorrection: "Korekcja",
                addMargins: "Dodaj",
                makeSquare: "Kwadrat",
                save: "Zapisz",
                newImage: "Nowe",
                undo: "Cofnij",
                redo: "Ponów",
                reset: "Resetuj",
                blur: "Rozmycie"
            }
        },
        history: {
            title: "Historia",
            original: "Oryginał",
            resize: "Rozmiar i Marginesy",
            addMargins: "Marginesy +{{margin}}px",
            rotate: "Obrót",
            removeBackground: "Usuwanie tła",
            removeLogoBackground: "Logo tło",
            colorCorrection: "Kolor",
            crop: "Kadrowanie",
            autoCrop: "Auto",
            makeSquare: "Kwadrat",
            blur: "Rozmycie"
        },
        status: {
            uploadError: "Błąd pliku.",
            resetSuccess: "Zresetowano.",
            stepResetSuccess: "Etap zresetowany.",
            undoSuccess: "Cofnięto.",
            redoSuccess: "Przywrócono.",
            newImageReady: "Gotowe.",
            historyRestored: "Przywrócono: \"{{action}}\"",
            resizeSuccess: "Zmieniono rozmiar {{size}}px (Auto margines).",
            resizeError: "Błąd rozmiaru.",
            addMarginsSuccess: "Dodano marginesy.",
            addMarginsError: "Błąd marginesów.",
            rotateSuccess: "Obrócono.",
            rotateError: "Błąd.",
            removeBackgroundSuccess: "Usunięto tło.",
            colorCorrectionSuccess: "Zmieniono kolor.",
            colorCorrectionError: "Błąd koloru.",
            cropSuccess: "Przycięto.",
            cropError: "Błąd.",
            autoCropSuccess: "Auto-kadrowanie.",
            autoCropError: "Błąd.",
            objectNotFound: "Nie znaleziono obiektu.",
            saveSuccess: "Zapisano.",
            noCreditsError: "Limit wyczerpany.",
            makeSquareSuccess: "Kwadrat.",
            blurSuccess: "Rozmyto.",
            blurError: "Błąd.",
            counterReset: "Licznik zresetowany."
        },
        errors: {
            quotaExceeded: "Limit przekroczony.",
            aiProcessingError: "Błąd AI.",
            noImageData: "Brak danych.",
            noImageDataBalance: "Brak balansu.",
            default: "Błąd."
        },
        welcome: {
            title: "Limity",
            message: "Limit: 10/min, 250/dzień.",
            button: "OK"
        },
        credits: {
            remaining: "Kredyty",
            resetsIn: "Reset",
            noTimer: "-",
            minuteLimit: "/ Min",
            limit_reached: "MAX"
        },
        settings: {
            title: "Ustawienia",
            adminPrompt: "Hasło:",
            resetSuccess: "Zresetowano.",
            resetError: "Złe hasło.",
            resetButton: "Reset"
        },
        stats: {
            totalUsers: "Użytkownicy",
            activeUsers: "Aktywni",
            totalGenerations: "Generacje"
        }
    }
};

type Translations = typeof translations.en;

interface LanguageContextType {
    lang: Language;
    setLang: (lang: Language) => void;
    t: (key: string, options?: Record<string, string | number | undefined>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getNestedValue = (obj: any, path: string): string | undefined => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [lang, setLangState] = useState<Language>(() => {
        const savedLang = localStorage.getItem('app-lang');
        return (savedLang && ['uk', 'en', 'pl'].includes(savedLang)) ? savedLang as Language : 'pl';
    });

    const setLang = (lang: Language) => {
        setLangState(lang);
        localStorage.setItem('app-lang', lang);
    };

    const t = useMemo(() => (key: string, options?: Record<string, string | number | undefined>): string => {
        const translationSet: Translations = translations[lang] || translations.en;
        let text = getNestedValue(translationSet, key);

        if (!text) {
             // console.warn(`Translation key not found: ${key}`); // Cleaned up for console silence
             if (options?.fallback) return String(options.fallback);
             return key;
        }

        if (options) {
            Object.entries(options).forEach(([k, v]) => {
                if (v !== undefined) {
                    text = text!.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
                }
            });
        }
        return text!;
    }, [lang]);
    
    return React.createElement(LanguageContext.Provider, { value: { lang, setLang, t } }, children);
};

export const useLanguage = (): LanguageContextType => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
