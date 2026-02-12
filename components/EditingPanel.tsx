
import React, { useState } from 'react';
import { Button } from './Button';
import { HistoryPanel } from './HistoryPanel';
import type { HistoryEntry } from '../types';
import { useLanguage } from '../i18n';

interface EditingPanelProps {
    onResizePreset: (size: number, margin: number) => void;
    onRotate: () => void;
    onRemoveBackground: (customPrompt?: string) => void;
    onSave: () => void;
    onReset: () => void;
    onStepReset: (step: number) => void;
    onUndo: () => void;
    onRedo: () => void;
    onNewImage: () => void;
    onGoToHistory: (index: number) => void;
    history: HistoryEntry[];
    historyIndex: number;
    canUndo: boolean;
    canRedo: boolean;
    isLoading: boolean;
    isImageLoaded: boolean;
    isCropping: boolean;
    onStartCrop: () => void;
    onApplyCrop: () => void;
    onCancelCrop: () => void;
    hasCrop: boolean;
    credits: number;
    remainingMinuteCredits: number;
    currentStep: number;
    cropMode: 'square' | 'free';
    onCropModeChange: (mode: 'square' | 'free') => void;
    isBlurring: boolean;
    onStartBlur: () => void;
    onApplyBlur: (intensity: number) => void;
    onCancelBlur: () => void;
}

const StepBlock: React.FC<{
    stepNumber: number;
    title: string;
    isActive: boolean;
    children: React.ReactNode;
    onReset?: () => void;
    t: (key: string) => string;
}> = ({ stepNumber, title, isActive, children, onReset, t }) => {
    // Logic change: Steps that are reached (active) are opaque. Future steps are transparent/disabled.
    // "isActive" here implies "isUnlocked".
    const containerClasses = `relative rounded-xl transition-all duration-300 overflow-hidden ${
        isActive 
            ? 'bg-panel-bg border border-border-subtle' 
            : 'bg-panel-bg border border-border-subtle opacity-40 pointer-events-none'
    }`;
    
    return (
        <div className={`${containerClasses} mb-2`}>
            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary"></div>}
            
            <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-semibold text-xs uppercase tracking-wider flex items-center gap-2 ${isActive ? 'text-white' : 'text-text-secondary'}`}>
                        <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${isActive ? 'bg-brand-primary text-app-bg' : 'bg-border-subtle text-text-secondary'}`}>
                            {stepNumber}
                        </span>
                        {title}
                    </h3>
                    {onReset && isActive && (
                         <Button onClick={onReset} variant="icon" title={t('panel.buttons.resetBlock')} className="bg-transparent border border-white/10 hover:bg-white/5 !p-0 w-6 h-6 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                        </Button>
                    )}
                </div>
                
                <div className="space-y-3">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const EditingPanel: React.FC<EditingPanelProps> = ({ 
    onResizePreset,
    onRotate, 
    onRemoveBackground,
    onSave,
    onReset,
    onStepReset,
    onUndo,
    onRedo,
    onNewImage,
    onGoToHistory,
    history,
    historyIndex,
    canUndo,
    canRedo,
    isLoading,
    isImageLoaded,
    isCropping,
    onStartCrop,
    onApplyCrop,
    onCancelCrop,
    hasCrop,
    credits,
    remainingMinuteCredits,
    currentStep,
    cropMode,
    onCropModeChange,
    isBlurring,
    onStartBlur,
    onApplyBlur,
    onCancelBlur
}) => {
    const { t } = useLanguage();
    const allDisabled = isLoading || !isImageLoaded;
    const [customPrompt, setCustomPrompt] = useState<string>("");
    const [blurIntensity, setBlurIntensity] = useState<number>(5);
    const [showHistory, setShowHistory] = useState(false);

    // currentStep logic: 1 is always active. 
    // If currentStep >= 2, Step 2 is active. 
    // If currentStep >= 3, Step 3 is active.

    return (
        <div className="bg-panel-bg text-text-primary rounded-xl shadow-panel flex flex-col h-full overflow-hidden border border-border-subtle">
            {isCropping ? (
                 <div className="flex flex-col space-y-4 h-full justify-center p-4 bg-app-bg">
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-white mb-1">{t('panel.crop.title')}</h3>
                        <p className="text-xs text-text-secondary">{t('panel.crop.description')}</p>
                    </div>
                    
                    <div className="flex flex-col gap-2 mt-auto">
                        <Button onClick={onApplyCrop} disabled={isLoading || !hasCrop} variant="primary" fullWidth className="py-2 h-10">
                            {t('panel.buttons.apply')}
                        </Button>
                        <Button onClick={onCancelCrop} disabled={isLoading} variant="secondary" fullWidth className="py-2 h-10">
                            {t('panel.buttons.cancel')}
                        </Button>
                    </div>
                </div>
            ) : isBlurring ? (
                <div className="flex flex-col space-y-4 h-full justify-center p-4 bg-app-bg">
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-white mb-1">{t('panel.blur.title')}</h3>
                        <p className="text-xs text-text-secondary">{t('panel.blur.instruction')}</p>
                    </div>
                    
                    <div className="p-4 bg-panel-bg rounded-lg border border-border-subtle">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-[10px] font-bold uppercase text-text-secondary">{t('panel.blur.intensity')}</label>
                            <span className="text-brand-primary font-mono text-xs">{blurIntensity}px</span>
                        </div>
                        <input 
                            type="range" 
                            min="1" 
                            max="50" 
                            value={blurIntensity} 
                            onChange={(e) => setBlurIntensity(parseInt(e.target.value))}
                            className="w-full h-2 bg-surface-bg rounded-lg appearance-none cursor-pointer slider-thumb"
                        />
                    </div>

                    <div className="flex flex-col gap-2 mt-auto">
                        <Button onClick={() => onApplyBlur(blurIntensity)} disabled={isLoading} variant="primary" fullWidth className="py-2 h-10">
                            {t('panel.blur.apply')}
                        </Button>
                        <Button onClick={onCancelBlur} disabled={isLoading} variant="secondary" fullWidth className="py-2 h-10">
                            {t('panel.buttons.cancel')}
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex-grow overflow-y-auto p-3 custom-scrollbar">
                        <StepBlock 
                            stepNumber={1} 
                            title={t('steps.step1')} 
                            isActive={isImageLoaded} 
                            onReset={() => onStepReset(1)}
                            t={t}
                        >
                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col gap-1">
                                    <Button variant="secondary" onClick={onRotate} disabled={allDisabled} className="h-10 flex items-center justify-center bg-surface-bg hover:bg-surface-bg/80 border-transparent">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                                    </Button>
                                    <p className="text-[9px] text-text-secondary text-center">{t('panel.hints.rotate')}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <Button variant="secondary" onClick={onStartCrop} disabled={allDisabled} className="h-10 flex items-center justify-center bg-surface-bg hover:bg-surface-bg/80 border-transparent">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path></svg>
                                    </Button>
                                    <p className="text-[9px] text-text-secondary text-center">{t('panel.hints.crop')}</p>
                                </div>
                            </div>
                        </StepBlock>

                        <StepBlock 
                            stepNumber={2} 
                            title={t('steps.step2')} 
                            isActive={currentStep >= 2 && isImageLoaded} 
                            onReset={() => onStepReset(2)}
                            t={t}
                        >
                             <div className="flex gap-2 mb-3">
                                <div className="flex-1 flex flex-col items-center gap-1">
                                    <Button 
                                        variant="secondary"
                                        onClick={() => onRemoveBackground(customPrompt)} 
                                        disabled={allDisabled}
                                        className="w-full h-12 flex items-center justify-center !rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 border-none text-white hover:opacity-90 transition-opacity"
                                        title={t('panel.tooltip.removeBg')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>
                                    </Button>
                                    <p className="text-[9px] text-brand-primary font-bold uppercase tracking-tight">{t('panel.hints.ai')}</p>
                                </div>

                                <div className="flex-1 flex flex-col items-center gap-1">
                                    <Button 
                                        onClick={onStartBlur} 
                                        disabled={allDisabled} 
                                        variant="secondary" 
                                        className="w-full h-12 flex items-center justify-center !rounded-xl bg-surface-bg border-transparent hover:bg-surface-bg/80"
                                        title={t('panel.buttons.blur')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                    </Button>
                                    <p className="text-[9px] text-text-secondary text-center uppercase tracking-tight">{t('panel.buttons.blur')}</p>
                                </div>
                             </div>
                             
                             <div>
                                <textarea
                                    className="w-full bg-app-bg border border-border-subtle rounded-lg p-2 text-xs text-text-primary focus:outline-none focus:border-brand-primary resize-none h-16 placeholder-gray-600 transition-colors"
                                    placeholder={t('panel.customPrompt.placeholder')}
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    disabled={allDisabled}
                                />
                                <p className="text-[9px] text-text-secondary mt-1 text-right">{t('panel.customPrompt.label')}</p>
                             </div>
                        </StepBlock>

                         <StepBlock 
                            stepNumber={3} 
                            title={t('steps.step3')} 
                            isActive={currentStep >= 3 && isImageLoaded} 
                            t={t}
                        >
                            <div className="space-y-3">
                                <div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col gap-1">
                                            <Button variant="secondary" className="bg-surface-bg border-transparent hover:bg-surface-bg/80 h-10 text-xs font-mono" onClick={() => onResizePreset(500, 25)} disabled={allDisabled}>500 x 500</Button>
                                            <p className="text-[9px] text-text-secondary text-center">Margin 25px</p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <Button variant="secondary" className="bg-surface-bg border-transparent hover:bg-surface-bg/80 h-10 text-xs font-mono" onClick={() => onResizePreset(200, 10)} disabled={allDisabled}>200 x 200</Button>
                                            <p className="text-[9px] text-text-secondary text-center">Margin 10px</p>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-text-secondary mt-2 text-center italic">{t('panel.hints.resize')}</p>
                                </div>
                            </div>
                        </StepBlock>
                    </div>

                    <div className="flex-shrink-0 border-t border-border-subtle p-3 bg-panel-bg">
                        {/* History Collapsible Section */}
                        {showHistory && (
                            <div className="mb-3 animate-fade-in-up">
                                <HistoryPanel
                                    history={history}
                                    currentIndex={historyIndex}
                                    onGoToHistory={onGoToHistory}
                                    disabled={isLoading}
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-2">
                             <div className="flex gap-2">
                                <Button onClick={onUndo} disabled={isLoading || !canUndo} variant="icon" className="bg-surface-bg text-text-secondary hover:text-white !p-1.5 w-8 h-8" title={t('panel.tooltip.undo')}>
                                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 18l-6-6 6-6M4 12h16"/></svg>
                                </Button>
                                <Button onClick={onRedo} disabled={isLoading || !canRedo} variant="icon" className="bg-surface-bg text-text-secondary hover:text-white !p-1.5 w-8 h-8" title={t('panel.tooltip.redo')}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 6l6 6-6 6M4 12h16"/></svg>
                                </Button>
                            </div>
                            
                            <Button 
                                onClick={() => setShowHistory(!showHistory)} 
                                variant="icon" 
                                className={`!p-1.5 w-8 h-8 ${showHistory ? 'text-brand-primary bg-surface-bg' : 'text-text-secondary bg-transparent hover:text-white'}`}
                                title={t('panel.tooltip.history')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/></svg>
                            </Button>
                        </div>

                        <div className="flex flex-col gap-2">
                             {currentStep >= 3 && (
                                <Button onClick={onSave} disabled={allDisabled} variant="primary" fullWidth className="py-2 h-10 flex items-center justify-center gap-2 shadow-glow animate-pulse">
                                    {t('panel.buttons.save')}
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                                </Button>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={onNewImage} disabled={isLoading} variant="secondary" fullWidth className="bg-surface-bg border-transparent hover:bg-surface-bg/80 h-9 text-xs">
                                    {t('panel.buttons.newImage')}
                                </Button>
                                <Button onClick={onReset} disabled={allDisabled} variant="secondary" fullWidth className="bg-surface-bg border-transparent hover:bg-surface-bg/80 h-9 text-xs">
                                    {t('panel.buttons.reset')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
