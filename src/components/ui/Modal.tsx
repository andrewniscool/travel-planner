import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  overlayClassName?: string;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let openModalCount = 0;
let previousBodyOverflow = '';

const lockBodyScroll = () => {
  if (openModalCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  openModalCount += 1;
};

const unlockBodyScroll = () => {
  openModalCount = Math.max(0, openModalCount - 1);
  if (openModalCount === 0) document.body.style.overflow = previousBodyOverflow;
};

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className = '',
  bodyClassName = '',
  overlayClassName = 'bg-black/65',
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  initialFocusRef,
}) => {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const closeOnEscapeRef = useRef(closeOnEscape);
  const initialFocusRefRef = useRef(initialFocusRef);
  onCloseRef.current = onClose;
  closeOnEscapeRef.current = closeOnEscape;
  initialFocusRefRef.current = initialFocusRef;

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    lockBodyScroll();

    const frame = window.requestAnimationFrame(() => {
      const target = initialFocusRefRef.current?.current
        ?? dialogRef.current?.querySelector<HTMLElement>(focusableSelector)
        ?? dialogRef.current;
      target?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscapeRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)]
        .filter((element) => !element.hasAttribute('hidden'));
      if (focusable.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      unlockBodyScroll();
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className={['fixed inset-0 z-[100] animate-fade-in', overlayClassName]
        .filter(Boolean)
        .join(' ')}
      onMouseDown={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          className={[
            'flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-app-surface shadow-elevated animate-slide-up sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl',
            sizeClasses[size],
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-app-border-muted px-5 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold text-app-text-strong">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-sm text-app-text-muted">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="-mr-1 rounded-xl p-2 text-app-text-subtle transition-colors hover:bg-app-surface-muted hover:text-app-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </header>
          <div className={['min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6', bodyClassName].filter(Boolean).join(' ')}>
            {children}
          </div>
          {footer && (
            <footer className="shrink-0 border-t border-app-border-muted bg-app-surface px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">
              {footer}
            </footer>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
