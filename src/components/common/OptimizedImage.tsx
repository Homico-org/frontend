"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// Generate a tiny SVG placeholder with blur
const generateBlurPlaceholder = (color: string = "#e5e5e5") => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 5"><rect fill="${color}" width="8" height="5"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Check if URL is from Cloudinary
const isCloudinaryUrl = (url: string): boolean => {
  return url.includes("cloudinary.com");
};

// Check if URL is from local backend
const isLocalUrl = (url: string): boolean => {
  return url.includes("/uploads/") || url.includes("localhost");
};

export default function OptimizedImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = "",
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "200px", // Start loading 200px before visible
        threshold: 0,
      }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return null;
  }

  // For Cloudinary URLs, use Next.js Image with full optimization
  if (isCloudinaryUrl(src)) {
    return (
      <div ref={imgRef} className={`relative ${fill ? "w-full h-full" : ""}`}>
        {/* Blur placeholder */}
        <div
          className={`absolute inset-0 bg-neutral-200 dark:bg-neutral-700 transition-opacity duration-500 ${
            isLoaded ? "opacity-0" : "opacity-100"
          }`}
          style={{
            backgroundImage: `url(${generateBlurPlaceholder()})`,
            backgroundSize: "cover",
          }}
        />

        {isInView && (
          <Image
            src={src}
            alt={alt}
            fill={fill}
            width={!fill ? width : undefined}
            height={!fill ? height : undefined}
            className={`${className} transition-opacity duration-500 ${
              isLoaded ? "opacity-100" : "opacity-0"
            }`}
            sizes={sizes}
            priority={priority}
            quality={80}
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
    );
  }

  // For local/backend URLs, use optimized native img
  return (
    <div ref={imgRef} className={`relative ${fill ? "w-full h-full" : ""}`}>
      {/* Animated shimmer placeholder */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 dark:from-neutral-700 dark:via-neutral-600 dark:to-neutral-700 animate-shimmer bg-[length:200%_100%] transition-opacity duration-500 ${
          isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      />

      {isInView && (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          className={`${fill ? "w-full h-full object-cover" : ""} ${className} transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
}
