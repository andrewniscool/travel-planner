import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

interface OverflowMenuItem {
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  variant?: 'default' | 'danger';
}
interface OverflowMenuProps {
  items: OverflowMenuItem[];
  label?: string;
  buttonClassName?: string;
  className?: string;
  menuClassName?: string;
}

const OverflowMenu: React.FC<OverflowMenuProps> = ({
  items,
  label = 'More actions',
  buttonClassName = '',
  className = '',
  menuClassName = '',
}) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const initialFocusRef = useRef<'first' | 'last' | null>(null);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);
  useEffect(() => {
    if (!open || !initialFocusRef.current) return;
    const frame = window.requestAnimationFrame(() => {
      const menuItems = Array.from(
        wrapperRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
      );
      const target =
        initialFocusRef.current === 'last' ? menuItems[menuItems.length - 1] : menuItems[0];
      initialFocusRef.current = null;
      target?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  const openFromKeyboard = (initialFocus: 'first' | 'last') => {
    initialFocusRef.current = initialFocus;
    setOpen(true);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const menuItems = Array.from(
        wrapperRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
      );
      (event.key === 'Home' ? menuItems[0] : menuItems[menuItems.length - 1])?.focus();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const menuItems = Array.from(
        wrapperRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
      );
      if (!menuItems.length) return;
      const index = menuItems.indexOf(document.activeElement as HTMLButtonElement);
      if (index === -1) {
        (event.key === 'ArrowDown' ? menuItems[0] : menuItems[menuItems.length - 1])?.focus();
        return;
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      menuItems[(index + direction + menuItems.length) % menuItems.length]?.focus();
    }
  };
  return (
    <div ref={wrapperRef} className={`relative inline-block ${className}`} onKeyDown={onKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onKeyDown={(event) => {
          if (open) return;
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            openFromKeyboard('first');
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            openFromKeyboard('last');
          } else if (event.key === 'Enter' || event.key === ' ') {
            initialFocusRef.current = 'first';
          }
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={`!rounded-full p-1.5 text-app-text-muted outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary-600 hover:bg-app-surface-muted ${buttonClassName}`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute right-0 top-full z-20 mt-1 min-w-36 overflow-hidden rounded-xl border border-app-border-muted bg-app-surface py-1 shadow-elevated animate-fade-in ${menuClassName}`}
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                item.onSelect();
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-app-surface-muted ${item.variant === 'danger' ? 'text-error-600 hover:bg-error-50' : 'text-app-text'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
export default OverflowMenu;
