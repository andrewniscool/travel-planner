import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PhotoGalleryProps {
  photos: string[];
  fallbackPhoto: string;
  alt: string;
  className?: string;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  fallbackPhoto,
  alt,
  className = '',
}) => {
  const galleryPhotos = photos.length > 0 ? photos : [fallbackPhoto];
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  const scrollToPhoto = (index: number) => {
    const nextIndex = (index + galleryPhotos.length) % galleryPhotos.length;
    setActiveIndex(nextIndex);
    itemRefs.current[nextIndex]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  };

  return (
    <div className={['relative overflow-hidden', className].filter(Boolean).join(' ')}>
      <div className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {galleryPhotos.map((photo, index) => (
          <div
            key={`${photo}-${index}`}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            className="w-full flex-none snap-center"
          >
            <img
              src={photo}
              alt={galleryPhotos.length > 1 ? `${alt} photo ${index + 1}` : alt}
              loading="lazy"
              decoding="async"
              width={800}
              height={450}
              className="h-full w-full aspect-video object-cover"
              onError={(event) => {
                if (event.currentTarget.src !== fallbackPhoto) {
                  event.currentTarget.src = fallbackPhoto;
                }
              }}
            />
          </div>
        ))}
      </div>

      {galleryPhotos.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => scrollToPhoto(activeIndex - 1)}
            className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm backdrop-blur-sm hover:bg-white"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollToPhoto(activeIndex + 1)}
            className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow-sm backdrop-blur-sm hover:bg-white"
            aria-label="Next photo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/40 px-2 py-1 backdrop-blur-sm">
            {galleryPhotos.map((photo, index) => (
              <button
                key={`${photo}-dot-${index}`}
                type="button"
                onClick={() => scrollToPhoto(index)}
                className={[
                  'h-1.5 rounded-full transition-all',
                  index === activeIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60',
                ].join(' ')}
                aria-label={`Show photo ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PhotoGallery;
