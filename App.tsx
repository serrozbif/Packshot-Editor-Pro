
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { ImagePreview } from './components/ImagePreview';
import { EditingPanel } from './components/EditingPanel';
import { removeBackground, autoWhiteBalance, classifyImageType } from './services/geminiService';
import { resizeImage, addMargins, rotateImage, fileToDataUrl, base64ToDataUrl, fitInSquare, cropToObjectBounds, loadImage, cropImage, getObjectBounds, applyBlur } from './utils/imageUtils';
import { StatusMessage } from './components/StatusMessage';
import type { Status, HistoryEntry, Crop, MarginInfo, Point } from './types';
import { useLanguage } from './i18n';
import { LanguageSwitcher } from './components/LanguageSwitcher';

const App: React.FC = () => {
    const { t, lang } = useLanguage();
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [status, setStatus] = useState<Status | null>(null);
    const [imageDimensions, setImageDimensions] = useState<{ width: number, height: number } | null>(null);
    const [isCropping, setIsCropping] = useState<boolean>(false);
    const [crop, setCrop] = useState<Crop | null>(null);
    const [cropMode, setCropMode] = useState<'square' | 'free'>('free');
    const [marginInfo, setMarginInfo] = useState<MarginInfo | null>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const saveCounter = useRef(1);

    // --- Action Counter State ---
    const [actionCount, setActionCount] = useState<number>(0);
    const COUNTER_KEY = 'packshot-action-counter';

    // --- Blur Tool State ---
    const [isBlurring, setIsBlurring] = useState<boolean>(false);
    const [blurPoints, setBlurPoints] = useState<Point[]>([]);

    // --- Workflow Steps State ---
    // currentStep now represents the highest unlocked step. 
    // 1 = Preparation, 2 = AI Processing, 3 = Finalization
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [stepSnapshots, setStepSnapshots] = useState<number[]>([0]);

    // Internal credit logic maintained to prevent abuse, but UI removed
    const [credits, setCredits] = useState<number>(250);
    const [resetTimestamp, setResetTimestamp] = useState<number | null>(null);
    const [minuteCreditsUsed, setMinuteCreditsUsed] = useState(0);
    const [minuteResetTimestamp, setMinuteResetTimestamp] = useState<number | null>(null);

    const LOCAL_STORAGE_CREDITS_KEY = 'ai-packshot-credits';
    const INITIAL_CREDITS = 250;
    const MINUTE_CREDIT_LIMIT = 10;

    // --- Counter Initialization Logic ---
    useEffect(() => {
        const today = new Date().toLocaleDateString();
        const stored = localStorage.getItem(COUNTER_KEY);
        if (stored) {
            try {
                const { count, date } = JSON.parse(stored);
                if (date !== today) {
                    // New day, reset counter
                    setActionCount(0);
                    localStorage.setItem(COUNTER_KEY, JSON.stringify({ count: 0, date: today }));
                } else {
                    setActionCount(count);
                }
            } catch (e) {
                // Parse error, reset
                setActionCount(0);
                localStorage.setItem(COUNTER_KEY, JSON.stringify({ count: 0, date: today }));
            }
        } else {
            // First time init
            localStorage.setItem(COUNTER_KEY, JSON.stringify({ count: 0, date: today }));
        }
    }, []);

    useEffect(() => {
        const storedData = localStorage.getItem(LOCAL_STORAGE_CREDITS_KEY);
        if (storedData) {
            try {
                const { count, timestamp } = JSON.parse(storedData);
                if (timestamp && Date.now() > timestamp) {
                    localStorage.removeItem(LOCAL_STORAGE_CREDITS_KEY);
                    setCredits(INITIAL_CREDITS);
                    setResetTimestamp(null);
                } else {
                    setCredits(count);
                    setResetTimestamp(timestamp);
                }
            } catch (error) {
                localStorage.removeItem(LOCAL_STORAGE_CREDITS_KEY);
                setCredits(INITIAL_CREDITS);
                setResetTimestamp(null);
            }
        }
    }, []);

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (minuteResetTimestamp && Date.now() > minuteResetTimestamp) {
                setMinuteCreditsUsed(0);
                setMinuteResetTimestamp(null);
            }
        }, 1000);
    
        return () => clearInterval(intervalId);
    }, [minuteResetTimestamp]);

    const decrementCredits = () => {
        setCredits(prevCredits => {
            const newCount = Math.max(0, prevCredits - 1);
            let newTimestamp = resetTimestamp;
            if (!newTimestamp || Date.now() > newTimestamp) {
                newTimestamp = Date.now() + 24 * 60 * 60 * 1000;
                setResetTimestamp(newTimestamp);
            }
            localStorage.setItem(LOCAL_STORAGE_CREDITS_KEY, JSON.stringify({ count: newCount, timestamp: newTimestamp }));
            return newCount;
        });

        setMinuteCreditsUsed(prev => prev + 1);
        setMinuteResetTimestamp(prevTimestamp => {
            if (!prevTimestamp || Date.now() > prevTimestamp) {
                return Date.now() + 60 * 1000;
            }
            return prevTimestamp;
        });
    };

    const currentImageSrc = history[historyIndex]?.imageSrc;
    const remainingMinuteCredits = MINUTE_CREDIT_LIMIT - minuteCreditsUsed;

    useEffect(() => {
        document.documentElement.lang = lang;
        document.title = t('app.title');
    }, [lang, t]);

    useEffect(() => {
        if (status) {
            const timer = setTimeout(() => setStatus(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [status]);
    
    useEffect(() => {
        if (currentImageSrc) {
            loadImage(currentImageSrc).then(img => {
                setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            });
            getObjectBounds(currentImageSrc).then(bounds => {
                if (bounds.empty) {
                    setMarginInfo({ top: 0, right: 0, bottom: 0, left: 0 });
                } else {
                     setMarginInfo({
                        top: bounds.top,
                        left: bounds.left,
                        bottom: bounds.imageHeight - bounds.bottom - 1,
                        right: bounds.imageWidth - bounds.right - 1,
                    });
                }
            }).catch(err => {
                console.error("Could not calculate object bounds:", err);
                setMarginInfo(null);
            });
        } else {
            setImageDimensions(null);
            setMarginInfo(null);
        }
    }, [currentImageSrc]);

    const handleFitInSquare = useCallback(async () => {
        if (!currentImageSrc) return;
        setIsLoading(true);
        try {
            const squaredUrl = await fitInSquare(currentImageSrc);
            addStateToHistory('history.makeSquare', squaredUrl);
            showStatus(t('status.makeSquareSuccess'));
        } catch (error) {
            console.error("Fit in square error:", error);
            showStatus(t('status.resizeError'), 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentImageSrc, t]);

    // --- Automatic Squaring in Step 3 ---
    useEffect(() => {
        if (currentStep >= 3 && imageDimensions && imageDimensions.width !== imageDimensions.height && !isLoading && !isBlurring) {
            // Logic handled by manual actions or resize
        }
    }, [currentStep, imageDimensions, isLoading, handleFitInSquare, isBlurring]);

    const showStatus = (message: string, type: 'success' | 'error' = 'success') => {
        setStatus({ message, type });
    };

    // --- Counter Logic Helpers ---
    const incrementActionCount = () => {
        const today = new Date().toLocaleDateString();
        setActionCount(prev => {
             // Check if date changed during session
            const stored = localStorage.getItem(COUNTER_KEY);
            let currentBase = prev;
            if (stored) {
                 const { date } = JSON.parse(stored);
                 if (date !== today) currentBase = 0;
            }
            
            const newCount = currentBase + 1;
            localStorage.setItem(COUNTER_KEY, JSON.stringify({ count: newCount, date: today }));
            return newCount;
        });
    };

    const resetActionCount = () => {
        const today = new Date().toLocaleDateString();
        setActionCount(0);
        localStorage.setItem(COUNTER_KEY, JSON.stringify({ count: 0, date: today }));
        showStatus(t('status.counterReset'));
    };

    const addStateToHistory = (actionKey: string, imageSrc: string, options?: Record<string, string | number>) => {
        const newHistory = history.slice(0, historyIndex + 1);
        const updatedHistory = [...newHistory, { action: t(actionKey, options), imageSrc }];
        setHistory(updatedHistory);
        setHistoryIndex(updatedHistory.length - 1);
        
        // Increment action counter for every modification (saving doesn't use this function)
        incrementActionCount();
    };

    const handleImageUpload = useCallback(async (file: File) => {
        saveCounter.current = 1;
        setOriginalImage(file);
        setIsLoading(true);
        try {
            const dataUrl = await fileToDataUrl(file);
            setHistory([{ action: t('history.original'), imageSrc: dataUrl }]);
            setHistoryIndex(0);
            setCurrentStep(1); // Reset to Step 1
            setStepSnapshots([0]);
        } catch (error) {
            console.error("Error converting file to data URL:", error);
            showStatus(t('status.uploadError'), 'error');
        } finally {
            setIsLoading(false);
        }
    }, [t]);

    const handleReset = useCallback(() => {
        if (history.length === 0 || isCropping) return;
        setHistory(prev => [prev[0]]);
        setHistoryIndex(0);
        setCurrentStep(1);
        setStepSnapshots([0]);
        showStatus(t('status.resetSuccess'));
        // Reset/Revert actions usually aren't counted as "productive" actions in this context,
        // or strictly speaking they are modifications. 
        // Based on "runs after every action except saving", user likely means creative edits.
        // We'll skip incrementing for full reset to avoid punishing corrections.
    }, [history, isCropping, t]);

    const handleStepReset = useCallback((stepNumber: number) => {
        if (history.length === 0 || isCropping) return;
        if (stepNumber === 1) {
             handleReset();
        }
    }, [history, isCropping, t, handleReset]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            setHistoryIndex(prev => prev - 1);
            showStatus(t('status.undoSuccess'));
        }
    }, [historyIndex, t]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(prev => prev + 1);
            showStatus(t('status.redoSuccess'));
        }
    }, [historyIndex, history.length, t]);
    
    const handleNewImage = () => {
        setOriginalImage(null);
        setHistory([]);
        setHistoryIndex(-1);
        setIsCropping(false);
        setCrop(null);
        setCurrentStep(1);
        setStepSnapshots([0]);
        saveCounter.current = 1;
        showStatus(t('status.newImageReady'));
    };

    const handleGoToHistory = useCallback((index: number) => {
        setHistoryIndex(index);
        const action = history[index].action;
        showStatus(t('status.historyRestored', { action }));
    }, [history, t]);

    // Combined handler for Resize + Automatic Margins
    const handleResizePreset = useCallback(async (size: number, margin: number) => {
        if (!currentImageSrc) return;
        setIsLoading(true);
        try {
            // 1. Resize
            const resizedUrl = await resizeImage(currentImageSrc, size, size);
            
            // 2. Add Margin to the resized image
            const marginUrl = await addMargins(resizedUrl, margin);
            
            // Add combined state to history
            addStateToHistory('history.resize', marginUrl, { size: size }); 
            
            showStatus(t('status.resizeSuccess', { size }));
        } catch (error) {
            console.error("Resize/Margin error:", error);
            showStatus(t('status.resizeError'), 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentImageSrc, t]);

    const handleRotate = useCallback(async () => {
        if (!currentImageSrc) return;
        setIsLoading(true);
        try {
            const rotatedUrl = await rotateImage(currentImageSrc);
            addStateToHistory('history.rotate', rotatedUrl);
            showStatus(t('status.rotateSuccess'));
            setCurrentStep(prev => Math.max(prev, 2)); // Auto-unlock Step 2
        } catch (error) {
            console.error("Rotate error:", error);
            showStatus(t('status.rotateError'), 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentImageSrc, t]);

    const handleRemoveBackground = useCallback(async (customPrompt?: string) => {
        if (!currentImageSrc) return;
        if (credits <= 0 || remainingMinuteCredits <= 0) {
             showStatus(t('status.quotaExceeded'), 'error');
             return;
        }

        setIsLoading(true);
        decrementCredits();
        try {
            const parts = currentImageSrc.split(',');
            const mimeType = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
            const base64ImageData = parts[1];
            
            const imageType = await classifyImageType(base64ImageData, mimeType);
    
            const bgRemovedBase64 = await removeBackground(base64ImageData, mimeType, customPrompt);
            const bgRemovedSrc = base64ToDataUrl(bgRemovedBase64, 'image/png');
            
            let finalSrc = bgRemovedSrc;
            if (imageType === 'logo') {
                addStateToHistory('history.removeLogoBackground', bgRemovedSrc);
            } else {
                const croppedSrc = await cropToObjectBounds(bgRemovedSrc);
                const squaredSrc = await fitInSquare(croppedSrc);
                
                const wbParts = squaredSrc.split(',');
                const wbMimeType = wbParts[0].match(/:(.*?);/)?.[1] || 'image/png';
                const wbBase64ImageData = wbParts[1];
                
                const resultBase64 = await autoWhiteBalance(wbBase64ImageData, wbMimeType);
                finalSrc = base64ToDataUrl(resultBase64, 'image/png');
                
                addStateToHistory('history.removeBackground', finalSrc);
            }
            showStatus(t('status.removeBackgroundSuccess'));
            setCurrentStep(prev => Math.max(prev, 3)); // Auto-unlock Step 3
        } catch (error) {
            console.error("AI processing error:", error);
            const errorMessageKey = error instanceof Error ? `errors.${error.message}` : 'errors.default';
            showStatus(t(errorMessageKey, { fallback: t('errors.default') }), 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentImageSrc, t, credits, remainingMinuteCredits]);

    const handleStartCrop = () => {
        setIsCropping(true);
        setCrop(null);
        setCropMode('free');
    };

    const handleCancelCrop = () => {
        setIsCropping(false);
        setCrop(null);
    };

    const handleCropChange = (newCrop: Crop) => {
        setCrop(newCrop);
    };

    const handleApplyCrop = async () => {
        if (!crop || !currentImageSrc || !imageRef.current || crop.width === 0 || crop.height === 0) {
            handleCancelCrop();
            return;
        }
        setIsLoading(true);
        setIsCropping(false);
        try {
            const img = imageRef.current;
            const scaleX = img.naturalWidth / img.clientWidth;
            const scaleY = img.naturalHeight / img.clientHeight;
            const pixelCrop = {
                x: Math.round(crop.x * scaleX),
                y: Math.round(crop.y * scaleY),
                width: Math.round(crop.width * scaleX),
                height: Math.round(crop.height * scaleY),
            };
            const croppedImageUrl = await cropImage(currentImageSrc, pixelCrop);
            addStateToHistory('history.crop', croppedImageUrl);
            showStatus(t('status.cropSuccess'));
            setCurrentStep(prev => Math.max(prev, 2)); // Auto-unlock Step 2
        } catch (error) {
            console.error("Cropping error:", error);
            showStatus(t('status.cropError'), 'error');
        } finally {
            setIsLoading(false);
            setCrop(null);
        }
    };

    // --- Blur Handlers ---
    const handleStartBlur = () => {
        setIsBlurring(true);
        setBlurPoints([]);
    };

    const handleCancelBlur = () => {
        setIsBlurring(false);
        setBlurPoints([]);
    };

    const handleBlurPointsChange = (points: Point[]) => {
        setBlurPoints(points);
    };

    const handleApplyBlur = async (intensity: number) => {
        if (!currentImageSrc || !imageRef.current || blurPoints.length < 3) {
            handleCancelBlur();
            return;
        }
        setIsLoading(true);
        setIsBlurring(false);
        try {
            const img = imageRef.current;
            const scaleX = img.naturalWidth / img.clientWidth;
            const scaleY = img.naturalHeight / img.clientHeight;

            const naturalPoints = blurPoints.map(p => ({
                x: p.x * scaleX,
                y: p.y * scaleY
            }));

            const blurredImageUrl = await applyBlur(currentImageSrc, naturalPoints, intensity);
            addStateToHistory('history.blur', blurredImageUrl);
            showStatus(t('status.blurSuccess'));
            setCurrentStep(prev => Math.max(prev, 3)); // Auto-unlock Step 3 (if blur is done in Step 2)
        } catch (error) {
            console.error("Blur error:", error);
            showStatus(t('status.blurError'), 'error');
        } finally {
            setIsLoading(false);
            setBlurPoints([]);
        }
    };


    const handleSave = useCallback(() => {
        if (!currentImageSrc || !imageDimensions) return;
        const link = document.createElement('a');
        link.href = currentImageSrc;
        const fileExtension = currentImageSrc.startsWith('data:image/jpeg') ? 'jpg' : 'png';
        const resolution = `${imageDimensions.width}x${imageDimensions.height}`;
        const fileName = `Packshot_${resolution}_${saveCounter.current}.${fileExtension}`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        saveCounter.current += 1;
        showStatus(t('status.saveSuccess'));
    }, [currentImageSrc, t, imageDimensions]);

    return (
        <div className="bg-app-bg min-h-screen font-sans text-text-primary">
            <header className="bg-panel-bg shadow-panel p-4 sticky top-0 z-50 border-b border-border-subtle">
                <div className="container mx-auto flex justify-between items-center">
                    <div className="flex flex-col">
                        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                            <span className="w-2 h-6 bg-brand-primary rounded-sm"></span>
                            {t('app.title')}
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {/* Action Counter Display */}
                        <div className="flex items-center gap-2 bg-surface-bg/50 px-3 py-1.5 rounded-lg border border-border-subtle">
                            <span className="text-xs text-text-secondary font-medium uppercase tracking-wider">{t('counter.label')}</span>
                            <span className="text-brand-primary font-mono font-bold">{actionCount}</span>
                            <button 
                                onClick={resetActionCount} 
                                title={t('counter.reset')}
                                className="ml-1 text-text-secondary hover:text-white p-0.5 rounded transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                            </button>
                        </div>
                        
                        <LanguageSwitcher />
                    </div>
                </div>
            </header>

            <main className="container mx-auto p-4 md:p-6 lg:p-8 h-[calc(100vh-80px)]">
                <div className="flex flex-col lg:flex-row gap-6 h-full">
                    <div className="flex-grow lg:w-3/4 flex items-center justify-center bg-panel-bg/30 rounded-2xl border border-border-subtle/50 p-4 relative overflow-hidden">
                        {currentImageSrc ? (
                            <ImagePreview 
                                ref={imageRef}
                                src={currentImageSrc} 
                                isLoading={isLoading}
                                isCropping={isCropping}
                                crop={crop}
                                onCropChange={handleCropChange}
                                imageDimensions={imageDimensions}
                                marginInfo={marginInfo}
                                currentStep={currentStep}
                                cropMode={cropMode}
                                isBlurring={isBlurring}
                                blurPoints={blurPoints}
                                onBlurPointsChange={handleBlurPointsChange}
                            />
                        ) : (
                            <ImageUploader onImageUpload={handleImageUpload} />
                        )}
                    </div>
                    <div className="lg:w-1/4 min-w-[320px] flex flex-col h-full">
                        <EditingPanel
                            onResizePreset={handleResizePreset}
                            onRotate={handleRotate}
                            onRemoveBackground={handleRemoveBackground}
                            onSave={handleSave}
                            onReset={handleReset}
                            onStepReset={handleStepReset}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            onNewImage={handleNewImage}
                            onGoToHistory={handleGoToHistory}
                            history={history}
                            historyIndex={historyIndex}
                            canUndo={historyIndex > 0}
                            canRedo={historyIndex < history.length - 1}
                            isLoading={isLoading}
                            isImageLoaded={!!currentImageSrc}
                            isCropping={isCropping}
                            onStartCrop={handleStartCrop}
                            onApplyCrop={handleApplyCrop}
                            onCancelCrop={handleCancelCrop}
                            hasCrop={!!crop && crop.width > 0 && crop.height > 0}
                            credits={credits}
                            remainingMinuteCredits={remainingMinuteCredits}
                            currentStep={currentStep}
                            cropMode={cropMode}
                            onCropModeChange={setCropMode}
                            isBlurring={isBlurring}
                            onStartBlur={handleStartBlur}
                            onApplyBlur={handleApplyBlur}
                            onCancelBlur={handleCancelBlur}
                        />
                    </div>
                </div>
            </main>
            {status && <StatusMessage message={status.message} type={status.type} />}
        </div>
    );
};

export default App;
