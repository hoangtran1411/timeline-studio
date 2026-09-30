'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ExternalLink, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

const ImageLightboxModalDialog: React.FC<ImageLightboxModalProps> = ({
  images,
  initialIndex = 0,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(0, Math.min(initialIndex, images.length - 1))
  );
  const [isZoomed, setIsZoomed] = useState(false);

  // Lock body scroll while modal is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handlePrev = useCallback(() => {
    setIsZoomed(false);
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setIsZoomed(false);
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handlePrev, handleNext]);

  const currentImage = images[currentIndex] || images[0];

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timeline-attachment-${currentIndex + 1}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (_) {
      // Fallback: open in new tab
      window.open(currentImage, '_blank');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-between bg-black/92 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top Controls Bar */}
      <div
        className="w-full flex items-center justify-between px-6 py-4 z-10 bg-gradient-to-b from-black/80 to-transparent"
        onClick={e => e.stopPropagation()}
      >
        {/* Left: Counter & Title */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-[#202127] border border-[#33343d] text-[#ececf0]">
            {currentIndex + 1} / {images.length}
          </span>
          <span className="text-xs text-[#9e9ea7] hidden sm:inline-block font-mono truncate max-w-sm">
            {currentImage.split('/').pop()?.split('?')[0] || 'Image attachment'}
          </span>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Zoom toggle button */}
          <button
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 rounded-lg bg-[#202127]/80 hover:bg-[#2e2f38] text-[#9e9ea7] hover:text-[#ececf0] transition-colors border border-[#33343d]"
            title={isZoomed ? 'Fit to screen' : 'Zoom in (100%)'}
          >
            {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-lg bg-[#202127]/80 hover:bg-[#2e2f38] text-[#9e9ea7] hover:text-[#ececf0] transition-colors border border-[#33343d]"
            title="Download image"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Open in new tab */}
          <a
            href={currentImage}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-[#202127]/80 hover:bg-[#2e2f38] text-[#9e9ea7] hover:text-[#ececf0] transition-colors border border-[#33343d]"
            title="Open original in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#2b2c36] hover:bg-[#383a47] text-[#ececf0] transition-colors border border-[#444655] font-mono text-xs ml-2"
            title="Close viewer (Esc)"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">ESC</span>
          </button>
        </div>
      </div>

      {/* Main Image Display Area */}
      <div
        className="flex-1 w-full flex items-center justify-center relative px-4 overflow-auto"
        onClick={e => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Navigation Button: Previous */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white transition-all border border-white/10 hover:border-white/30 backdrop-blur-sm z-20 group shadow-2xl"
            title="Previous image (←)"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Current Image */}
        <div
          className={`relative max-h-full max-w-full flex items-center justify-center transition-all duration-200 ${
            isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={e => {
            e.stopPropagation();
            setIsZoomed(!isZoomed);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage}
            alt={`Timeline attachment ${currentIndex + 1}`}
            className={`transition-all duration-200 rounded-lg shadow-2xl border border-white/10 ${
              isZoomed
                ? 'max-h-none max-w-none scale-125 object-contain'
                : 'max-h-[78vh] max-w-[88vw] object-contain'
            }`}
            draggable={false}
          />
        </div>

        {/* Navigation Button: Next */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white transition-all border border-white/10 hover:border-white/30 backdrop-blur-sm z-20 group shadow-2xl"
            title="Next image (→)"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip (if multiple images) */}
      {images.length > 1 ? (
        <div
          className="w-full flex items-center justify-center gap-2.5 py-4 px-6 z-10 bg-gradient-to-t from-black/80 to-transparent"
          onClick={e => e.stopPropagation()}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setIsZoomed(false);
                setCurrentIndex(idx);
              }}
              className={`relative w-14 h-14 rounded-md overflow-hidden border-2 transition-all ${
                currentIndex === idx
                  ? 'border-white scale-110 shadow-lg ring-2 ring-white/30'
                  : 'border-[#33343d] opacity-50 hover:opacity-100 hover:border-[#6b6c75]'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0.5 right-1 font-mono text-[9px] font-bold text-white bg-black/60 px-1 rounded">
                {idx + 1}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="py-2" />
      )}
    </div>
  );
};

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = (props) => {
  if (!props.isOpen || !props.images || props.images.length === 0) return null;
  return (
    <ImageLightboxModalDialog
      key={`${props.initialIndex ?? 0}-${props.images.length}`}
      {...props}
    />
  );
};
