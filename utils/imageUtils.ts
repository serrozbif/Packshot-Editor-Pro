
import type { Crop, Point } from '../types';

export const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

export const base64ToDataUrl = (base64: string, mimeType: string): string => {
    return `data:${mimeType};base64,${base64}`;
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = src;
    });
};

const findObjectBoundsOnCanvas = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, tolerance: number) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let top = canvas.height, bottom = 0, left = canvas.width, right = 0;

    const isWhite = (r: number, g: number, b: number, a: number) => {
        // Consider transparent or semi-transparent pixels as part of the background
        if (a < 255 * 0.5) return true;
        // Check for white pixels
        return r > 255 - tolerance && g > 255 - tolerance && b > 255 - tolerance;
    };

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            if (!isWhite(data[i], data[i + 1], data[i + 2], data[i + 3])) {
                if (y < top) top = y;
                if (y > bottom) bottom = y;
                if (x < left) left = x;
                if (x > right) right = x;
            }
        }
    }
    
    // If the image is entirely white, bounds will be inverted.
    if (left > right || top > bottom) {
        return { top: 0, bottom: 0, left: 0, right: 0, empty: true };
    }

    return { top, bottom, left, right, empty: false };
}

export const getObjectBounds = async (imageSrc: string, tolerance: number = 5): Promise<{ top: number; bottom: number; left: number; right: number; imageWidth: number; imageHeight: number; empty: boolean }> => {
    const img = await loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    ctx.drawImage(img, 0, 0);
    
    const { top, bottom, left, right, empty } = findObjectBoundsOnCanvas(canvas, ctx, tolerance);
    
    return { top, bottom, left, right, imageWidth: canvas.width, imageHeight: canvas.height, empty };
};

export const resizeImage = async (imageSrc: string, maxWidth: number, maxHeight: number): Promise<string> => {
    const img = await loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Could not get canvas context');

    const imgRatio = img.width / img.height;
    const targetRatio = maxWidth / maxHeight;

    let newWidth: number;
    let newHeight: number;

    if (imgRatio > targetRatio) {
        // Image is wider than the target box, so width is the limiting factor.
        newWidth = maxWidth;
        newHeight = newWidth / imgRatio;
    } else {
        // Image is taller than or same aspect as the target box, so height is the limiting factor.
        newHeight = maxHeight;
        newWidth = newHeight * imgRatio;
    }

    canvas.width = newWidth;
    canvas.height = newHeight;

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    return canvas.toDataURL('image/png');
};


export const addMargins = async (imageSrc: string, margin: number): Promise<string> => {
    const img = await loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    // Context needs to be readable to find object bounds
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) throw new Error('Could not get canvas context');
    
    // Draw the image to the canvas once to analyze its pixels
    ctx.drawImage(img, 0, 0);
    // Find the bounds of the actual content, ignoring surrounding whitespace
    const bounds = findObjectBoundsOnCanvas(canvas, ctx, 5); // Using a tolerance of 5

    // Now, clear the canvas and prepare for the final render
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // If the image was empty (all white), just return the blank canvas
    if (bounds.empty) {
        return canvas.toDataURL('image/png');
    }
    
    const objectWidth = bounds.right - bounds.left + 1;
    const objectHeight = bounds.bottom - bounds.top + 1;

    // Ensure the requested margin is not too large for the canvas
    if (margin * 2 >= canvas.width || margin * 2 >= canvas.height) {
        return canvas.toDataURL('image/png');
    }

    // Define the inner area where the object should be placed
    const innerWidth = canvas.width - margin * 2;
    const innerHeight = canvas.height - margin * 2;

    // Calculate the scale factor to fit the object within the inner area, preserving aspect ratio
    const scale = Math.min(innerWidth / objectWidth, innerHeight / objectHeight);
    const scaledWidth = objectWidth * scale;
    const scaledHeight = objectHeight * scale;

    // Calculate the top-left coordinates to center the scaled object
    const x = margin + Math.floor((innerWidth - scaledWidth) / 2);
    const y = margin + Math.floor((innerHeight - scaledHeight) / 2);
    
    // Draw only the object part of the original image onto the new canvas, scaled and positioned correctly
    ctx.drawImage(
        img, 
        bounds.left,      // source x
        bounds.top,       // source y
        objectWidth,      // source width
        objectHeight,     // source height
        x,                // destination x
        y,                // destination y
        scaledWidth,      // destination width
        scaledHeight      // destination height
    );

    return canvas.toDataURL('image/png');
};


export const rotateImage = async (imageSrc: string): Promise<string> => {
    const img = await loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Could not get canvas context');

    // Swap width and height for 90 degree rotation
    canvas.width = img.height;
    canvas.height = img.width;
    
    // Translate to the center of the new canvas, then rotate, then translate back
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(90 * Math.PI / 180); // Rotate 90 degrees clockwise
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    return canvas.toDataURL('image/png');
};

export const cropToObjectBounds = async (imageSrc: string, tolerance: number = 5): Promise<string> => {
    const img = await loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) throw new Error('Could not get canvas context');

    ctx.drawImage(img, 0, 0);

    const { top, bottom, left, right, empty } = findObjectBoundsOnCanvas(canvas, ctx, tolerance);

    if (empty) {
        return imageSrc; 
    }

    const cropWidth = right - left + 1;
    const cropHeight = bottom - top + 1;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropWidth;
    cropCanvas.height = cropHeight;
    const cropCtx = cropCanvas.getContext('2d');

    if (!cropCtx) throw new Error('Could not get crop canvas context');
    
    cropCtx.drawImage(
        canvas,
        left, top, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
    );

    return cropCanvas.toDataURL('image/png');
};

export const fitInSquare = async (imageSrc: string): Promise<string> => {
    const img = await loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Could not get canvas context');
    
    const size = Math.max(img.width, img.height);
    canvas.width = size;
    canvas.height = size;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const x = (size - img.width) / 2;
    const y = (size - img.height) / 2;
    
    ctx.drawImage(img, x, y);
    
    return canvas.toDataURL('image/png');
};

export const applyColorCorrection = async (imageSrc: string, brightness: number, contrast: number): Promise<string> => {
    const img = await loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Could not get canvas context');
    
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    ctx.drawImage(img, 0, 0);

    return canvas.toDataURL('image/png');
};

export const cropImage = async (imageSrc: string, pixelCrop: Crop): Promise<string> => {
    const img = await loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not get canvas context for cropping');
    }

    ctx.drawImage(
        img,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    return canvas.toDataURL('image/png');
};

export const applyBlur = async (imageSrc: string, points: Point[], intensity: number): Promise<string> => {
    const img = await loadImage(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Could not get canvas context');

    // 1. Draw the original image first
    ctx.drawImage(img, 0, 0);

    if (points.length < 3) return imageSrc;

    // 2. Create the clipping path based on the points
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.clip();

    // 3. Apply the blur filter
    // Note: ctx.filter is supported in most modern browsers.
    // For wider support, one might need a manual blur algorithm or stack blur, 
    // but ctx.filter is efficient and standard in modern web apps.
    ctx.filter = `blur(${intensity}px)`;
    
    // 4. Draw the image again *inside* the clipped area with the filter active
    // We draw slightly larger to avoid edge artifacts from clipping if possible,
    // but drawing exact dimensions is standard.
    ctx.drawImage(img, 0, 0);

    ctx.restore();

    return canvas.toDataURL('image/png');
};
