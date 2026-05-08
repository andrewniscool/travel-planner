import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

type AspectRatio = 'video' | 'square' | 'wide';

interface ImagePlaceholderProps {
  src?: string;
  alt: string;
  className?: string;
  aspectRatio?: AspectRatio;
  fallbackText?: string;
}

const aspectRatioClasses: Record<AspectRatio, string> = {
  video: 'aspect-video',
  square: 'aspect-square',
  wide: 'aspect-[21/9]',
};

const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'video',
  fallbackText,
}) => {
  const [hasError, setHasError] = useState(false);

  const fallbackChar = fallbackText ? fallbackText.charAt(0).toUpperCase() : null;

  if (hasError || !src) {
    return (
      <div
        className={[
          'relative w-full overflow-hidden bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center',
          aspectRatioClasses[aspectRatio],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {fallbackChar ? (
          <span className="text-4xl font-bold text-neutral-400">{fallbackChar}</span>
        ) : (
          <MapPin className="w-8 h-8 text-neutral-400" />
        )}
      </div>
    );
  }

  return (
    <div
      className={[
        'relative w-full overflow-hidden',
        aspectRatioClasses[aspectRatio],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <img
        src={src}
        alt={alt}
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default ImagePlaceholder;
