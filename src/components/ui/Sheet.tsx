import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
}

const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
let openSheetCount = 0;
let previousOverflow = '';

const Sheet: React.FC<SheetProps> = ({
  isOpen, onClose, title, description, children, footer, className = '', bodyClassName = '',
  closeOnBackdrop = true, closeOnEscape = true,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const closeOnEscapeRef = useRef(closeOnEscape);
  onCloseRef.current = onClose;
  closeOnEscapeRef.current = closeOnEscape;

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    if (openSheetCount === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    openSheetCount += 1;
    const frame = requestAnimationFrame(() => {
      (sheetRef.current?.querySelector<HTMLElement>(focusableSelector) ?? sheetRef.current)?.focus();
    });
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscapeRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !sheetRef.current) return;
      const items = [...sheetRef.current.querySelectorAll<HTMLElement>(focusableSelector)];
      if (!items.length) return;
      const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === items[0]) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      openSheetCount = Math.max(0, openSheetCount - 1);
      if (openSheetCount === 0) document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-[1px] animate-fade-in"
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={[
          'absolute inset-0 flex flex-col overflow-hidden bg-app-surface shadow-elevated animate-slide-in-right sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[min(36rem,calc(100vw-2rem))]',
          className,
        ].filter(Boolean).join(' ')}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-app-border-muted px-5 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate text-lg font-semibold text-app-text-strong">{title}</h2>
            {description && <p id={descriptionId} className="mt-1 text-sm text-app-text-muted">{description}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close details" className="-mr-1 rounded-xl p-2 text-app-text-subtle hover:bg-app-surface-muted hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className={['min-h-0 flex-1 overflow-y-auto overscroll-contain', bodyClassName].filter(Boolean).join(' ')}>{children}</div>
        {footer && <footer className="shrink-0 border-t border-app-border-muted bg-app-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
};

export default Sheet;
