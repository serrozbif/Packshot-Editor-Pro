
import React, { useState, forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import { Spinner } from './Spinner';
import type { Crop, MarginInfo, Point } from '../types';
import { useLanguage } from '../i18n';

interface ImagePreviewProps {
    src: string;
    isLoading: boolean;
    isCropping?: boolean;
    crop?: Crop | null;
    onCropChange?: (crop: Crop) => void;
    imageDimensions: { width: number, height: number } | null;
    marginInfo: MarginInfo | null;
    currentStep?: number;
    cropMode?: 'square' | 'free';
    isBlurring?: boolean;
    blurPoints?: Point[];
    onBlurPointsChange?: (points: Point[]) => void;
}

type CropAction = 'draw' | 'move' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | null;

export const ImagePreview = forwardRef<HTMLImageElement, ImagePreviewProps>(({ 
    src, 
    isLoading, 
    isCropping, 
    crop, 
    onCropChange,
    imageDimensions,
    marginInfo,
    currentStep,
    cropMode = 'square',
    isBlurring,
    blurPoints = [],
    onBlurPointsChange
}, ref) => {
    const { t } = useLanguage();
    const internalRef = useRef<HTMLImageElement>(null);
    useImperativeHandle(ref, () => internalRef.current!, []);

    const [action, setAction] = useState<CropAction>(null);
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
    const [moveOffset, setMoveOffset] = useState({ x: 0, y: 0 });
    const [cursor, setCursor] = useState('crosshair');
    const [renderedSize, setRenderedSize] = useState<{width: number, height: number} | null>(null);
    const [isDrawingLasso, setIsDrawingLasso] = useState(false);

    useEffect(() => {
        const img = internalRef.current;
        if (!img) return;

        const observer = new ResizeObserver(() => {
            setRenderedSize({ width: img.clientWidth, height: img.clientHeight });
        });
        observer.observe(img);

        const handleLoad = () => {
            setRenderedSize({ width: img.clientWidth, height: img.clientHeight });
        };
        
        img.addEventListener('load', handleLoad);
        if (img.complete && img.naturalHeight > 0) {
            handleLoad();
        }

        return () => {
            img.removeEventListener('load', handleLoad);
            observer.disconnect();
        }
    }, [src]);


    const imageStyle: React.CSSProperties = {
        touchAction: isCropping || isBlurring ? 'none' : 'auto',
    };

    const getCoords = (e: React.MouseEvent | React.TouchEvent): {x: number, y: number} => {
        const rect = internalRef.current!.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        }
    }
    
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0 || !internalRef.current) return;
        
        const { x, y } = getCoords(e);

        if (isBlurring) {
            e.preventDefault();
            setIsDrawingLasso(true);
            onBlurPointsChange?.([{ x, y }]);
            return;
        }

        if (!isCropping) return;
        e.preventDefault();
        
        const target = e.target as HTMLElement;
        const corner = target.dataset.corner;

        if (corner) {
            setAction(`resize-${corner}` as CropAction);
        } else if (crop && x >= crop.x && x <= crop.x + crop.width && y >= crop.y && y <= crop.y + crop.height) {
            setAction('move');
            setMoveOffset({ x: x - crop.x, y: y - crop.y });
        } else {
            setAction('draw');
            setStartPoint({ x, y });
            onCropChange?.({ x, y, width: 0, height: 0 });
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!internalRef.current) return;
        
        if (isBlurring) {
            if (isDrawingLasso) {
                e.preventDefault();
                const { x, y } = getCoords(e);
                onBlurPointsChange?.([...blurPoints, { x, y }]);
            }
            return;
        }

        if (!isCropping) return;
        e.preventDefault();
    
        const imageEl = internalRef.current;
        const { x: currentX, y: currentY } = getCoords(e);
        const boundedCurrentX = Math.max(0, Math.min(currentX, imageEl.clientWidth));
        const boundedCurrentY = Math.max(0, Math.min(currentY, imageEl.clientHeight));

        if (!action) {
            const handleSize = 12;
            let newCursor = 'crosshair';
            if (crop) {
                const { x, y, width, height } = crop;
                if (boundedCurrentX > x && boundedCurrentX < x + width && boundedCurrentY > y && boundedCurrentY < y + height) {
                    newCursor = 'move';
                }
                if (Math.abs(boundedCurrentX - (x + width)) < handleSize && Math.abs(boundedCurrentY - (y + height)) < handleSize) newCursor = 'nwse-resize';
                if (Math.abs(boundedCurrentX - x) < handleSize && Math.abs(boundedCurrentY - y) < handleSize) newCursor = 'nwse-resize';
                if (Math.abs(boundedCurrentX - (x + width)) < handleSize && Math.abs(boundedCurrentY - y) < handleSize) newCursor = 'nesw-resize';
                if (Math.abs(boundedCurrentX - x) < handleSize && Math.abs(boundedCurrentY - (y + height)) < handleSize) newCursor = 'nesw-resize';
            }
            setCursor(newCursor);
            return;
        }
        
        if (!crop && action !== 'draw') return;

        let newCrop: Crop = crop ? { ...crop } : { x: 0, y: 0, width: 0, height: 0 };
    
        switch (action) {
            case 'draw': {
                if (cropMode === 'square') {
                    const size = Math.max(Math.abs(boundedCurrentX - startPoint.x), Math.abs(boundedCurrentY - startPoint.y));
                    let x = startPoint.x;
                    let y = startPoint.y;
                    if (boundedCurrentX < startPoint.x) x = startPoint.x - size;
                    if (boundedCurrentY < startPoint.y) y = startPoint.y - size;
                    const boundedX = Math.max(0, x);
                    const boundedY = Math.max(0, y);
                    const boundedSize = Math.min(size, imageEl.clientWidth - boundedX, imageEl.clientHeight - boundedY);
                    newCrop = { x: boundedX, y: boundedY, width: boundedSize, height: boundedSize };
                } else {
                    const x = Math.min(startPoint.x, boundedCurrentX);
                    const y = Math.min(startPoint.y, boundedCurrentY);
                    const width = Math.abs(boundedCurrentX - startPoint.x);
                    const height = Math.abs(boundedCurrentY - startPoint.y);
                    newCrop = { x, y, width, height };
                }
                break;
            }
            case 'move': {
                let newX = boundedCurrentX - moveOffset.x;
                let newY = boundedCurrentY - moveOffset.y;
                newX = Math.max(0, Math.min(newX, imageEl.clientWidth - newCrop.width));
                newY = Math.max(0, Math.min(newY, imageEl.clientHeight - newCrop.height));
                newCrop = { ...newCrop, x: newX, y: newY };
                break;
            }
            case 'resize-br': { // Bottom-right
                if (cropMode === 'square') {
                    const newSize = Math.max(boundedCurrentX - newCrop.x, boundedCurrentY - newCrop.y, 10);
                    const boundedSize = Math.min(newSize, imageEl.clientWidth - newCrop.x, imageEl.clientHeight - newCrop.y);
                    newCrop = { ...newCrop, width: boundedSize, height: boundedSize };
                } else {
                    const newWidth = Math.max(10, boundedCurrentX - newCrop.x);
                    const newHeight = Math.max(10, boundedCurrentY - newCrop.y);
                    newCrop = { ...newCrop, width: newWidth, height: newHeight };
                }
                break;
            }
            case 'resize-bl': { // Bottom-left
                const oppositeCornerX = newCrop.x + newCrop.width;
                if (cropMode === 'square') {
                    const newSize = Math.max(oppositeCornerX - boundedCurrentX, boundedCurrentY - newCrop.y, 10);
                    const boundedSize = Math.min(newSize, oppositeCornerX, imageEl.clientHeight - newCrop.y);
                    newCrop = { x: oppositeCornerX - boundedSize, y: newCrop.y, width: boundedSize, height: boundedSize };
                } else {
                    const newWidth = Math.max(10, oppositeCornerX - boundedCurrentX);
                    const newHeight = Math.max(10, boundedCurrentY - newCrop.y);
                    newCrop = { x: oppositeCornerX - newWidth, y: newCrop.y, width: newWidth, height: newHeight };
                }
                break;
            }
            case 'resize-tr': { // Top-right
                const oppositeCornerY = newCrop.y + newCrop.height;
                if (cropMode === 'square') {
                    const newSize = Math.max(boundedCurrentX - newCrop.x, oppositeCornerY - boundedCurrentY, 10);
                    const boundedSize = Math.min(newSize, imageEl.clientWidth - newCrop.x, oppositeCornerY);
                    newCrop = { x: newCrop.x, y: oppositeCornerY - boundedSize, width: boundedSize, height: boundedSize };
                } else {
                    const newWidth = Math.max(10, boundedCurrentX - newCrop.x);
                    const newHeight = Math.max(10, oppositeCornerY - boundedCurrentY);
                    newCrop = { x: newCrop.x, y: oppositeCornerY - newHeight, width: newWidth, height: newHeight };
                }
                break;
            }
             case 'resize-tl': { // Top-left
                const oppositeCornerX = newCrop.x + newCrop.width;
                const oppositeCornerY = newCrop.y + newCrop.height;
                if (cropMode === 'square') {
                    const newSize = Math.max(oppositeCornerX - boundedCurrentX, oppositeCornerY - boundedCurrentY, 10);
                    const boundedSize = Math.min(newSize, oppositeCornerX, oppositeCornerY);
                    newCrop = { x: oppositeCornerX - boundedSize, y: oppositeCornerY - boundedSize, width: boundedSize, height: boundedSize };
                } else {
                    const newWidth = Math.max(10, oppositeCornerX - boundedCurrentX);
                    const newHeight = Math.max(10, oppositeCornerY - boundedCurrentY);
                    newCrop = { x: oppositeCornerX - newWidth, y: oppositeCornerY - newHeight, width: newWidth, height: newHeight };
                }
                break;
            }
        }

        onCropChange?.({
            x: Math.round(newCrop.x),
            y: Math.round(newCrop.y),
            width: Math.round(newCrop.width),
            height: Math.round(newCrop.height),
        });
    };

    const handleMouseUp = () => {
        setAction(null);
        if (isBlurring) {
            setIsDrawingLasso(false);
        }
    };

    const scaleX = renderedSize && imageDimensions ? renderedSize.width / imageDimensions.width : 1;
    const scaleY = renderedSize && imageDimensions ? renderedSize.height / imageDimensions.height : 1;
    
    const renderedMargin = marginInfo && renderedSize ? {
        top: Math.round(marginInfo.top * scaleY),
        bottom: Math.round(marginInfo.bottom * scaleY),
        left: Math.round(marginInfo.left * scaleX),
        right: Math.round(marginInfo.right * scaleX),
    } : null;

    // SVG path string generation for lasso
    const lassoPath = blurPoints.length > 0 
        ? `M ${blurPoints[0].x} ${blurPoints[0].y} ` + blurPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + (isDrawingLasso ? '' : ' Z')
        : '';

    return (
        <div 
            className="relative inline-block select-none"
            style={{ cursor: isCropping || isBlurring ? 'crosshair' : 'default' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
             {/* Top Margin Annotation */}
             {renderedMargin && marginInfo && renderedMargin.top > 1 && (
                <div
                    className="absolute pointer-events-none flex items-center justify-center"
                    style={{
                        top: `0px`,
                        height: `${renderedMargin.top}px`,
                        left: `${renderedMargin.left}px`,
                        width: `${renderedSize.width - renderedMargin.left - renderedMargin.right}px`,
                    }}
                >
                    <span className="bg-brand-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg z-10">{marginInfo.top} px</span>
                </div>
            )}

            {/* Bottom Margin Annotation */}
            {renderedMargin && marginInfo && renderedMargin.bottom > 1 && (
                <div
                    className="absolute pointer-events-none flex items-center justify-center"
                    style={{
                        bottom: `0px`,
                        height: `${renderedMargin.bottom}px`,
                        left: `${renderedMargin.left}px`,
                        width: `${renderedSize.width - renderedMargin.left - renderedMargin.right}px`,
                    }}
                >
                    <span className="bg-brand-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg z-10">{marginInfo.bottom} px</span>
                </div>
            )}

            {/* Left Margin Annotation */}
            {renderedMargin && marginInfo && renderedMargin.left > 1 && (
                <div
                    className="absolute pointer-events-none flex items-center justify-center"
                    style={{
                        left: `0px`,
                        width: `${renderedMargin.left}px`,
                        top: `${renderedMargin.top}px`,
                        height: `${renderedSize.height - renderedMargin.top - renderedMargin.bottom}px`,
                    }}
                >
                    <span className="bg-brand-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg z-10">{marginInfo.left} px</span>
                </div>
            )}
            
            {/* Right Margin Annotation */}
            {renderedMargin && marginInfo && renderedMargin.right > 1 && (
                <div
                    className="absolute pointer-events-none flex items-center justify-center"
                    style={{
                        right: `0px`,
                        width: `${renderedMargin.right}px`,
                        top: `${renderedMargin.top}px`,
                        height: `${renderedSize.height - renderedMargin.top - renderedMargin.bottom}px`,
                    }}
                >
                    <span className="bg-brand-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg z-10">{marginInfo.right} px</span>
                </div>
            )}

            <img 
                ref={internalRef}
                src={src} 
                alt="Preview" 
                className={`max-w-full max-h-[75vh] object-contain block rounded-lg shadow-lg`}
                style={imageStyle}
                draggable={false}
            />
            
            {/* Lasso SVG Overlay */}
            {isBlurring && renderedSize && (
                <svg 
                    className="absolute inset-0 pointer-events-none" 
                    width={renderedSize.width} 
                    height={renderedSize.height}
                    viewBox={`0 0 ${renderedSize.width} ${renderedSize.height}`}
                >
                    <path 
                        d={lassoPath} 
                        fill="rgba(255, 0, 0, 0.2)" 
                        stroke="red" 
                        strokeWidth="2" 
                        strokeDasharray="5,5" 
                    />
                </svg>
            )}

            {/* Instruction overlay specifically for Step 1 Cropping */}
            {isCropping && currentStep === 1 && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3/4 text-center pointer-events-none z-20">
                     <div className="bg-black bg-opacity-70 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg border border-white/20 backdrop-blur-sm">
                        {t('panel.crop.instruction')}
                     </div>
                </div>
            )}

            {imageDimensions && !isCropping && !isBlurring && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black bg-opacity-60 text-white text-xs font-mono px-2 py-1 rounded-md pointer-events-none">
                    {imageDimensions.width} x {imageDimensions.height} px
                </div>
            )}

             {isCropping && crop && crop.width > 0 && (
                <div
                    className="absolute border-2 border-dashed border-brand-accent bg-blue-500 bg-opacity-25 pointer-events-none"
                    style={{
                        left: `${crop.x}px`,
                        top: `${crop.y}px`,
                        width: crop.width,
                        height: crop.height,
                    }}
                >
                    {/* Vertical Center Line */}
                    <div className="absolute top-0 left-1/2 w-px h-full bg-white opacity-75" style={{ transform: 'translateX(-50%)' }}></div>
                    {/* Horizontal Center Line */}
                    <div className="absolute left-0 top-1/2 h-px w-full bg-white opacity-75" style={{ transform: 'translateY(-50%)' }}></div>
                    
                    {/* Resize Handles */}
                    <div data-corner="tl" className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-brand-primary border-2 border-white rounded-full pointer-events-auto" style={{ cursor: 'nwse-resize' }} />
                    <div data-corner="tr" className="absolute -right-1.5 -top-1.5 w-3 h-3 bg-brand-primary border-2 border-white rounded-full pointer-events-auto" style={{ cursor: 'nesw-resize' }} />
                    <div data-corner="bl" className="absolute -left-1.5 -bottom-1.5 w-3 h-3 bg-brand-primary border-2 border-white rounded-full pointer-events-auto" style={{ cursor: 'nesw-resize' }} />
                    <div data-corner="br" className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-brand-primary border-2 border-white rounded-full pointer-events-auto" style={{ cursor: 'nwse-resize' }} />
                </div>
            )}
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                    <Spinner />
                </div>
            )}
        </div>
    );
});
