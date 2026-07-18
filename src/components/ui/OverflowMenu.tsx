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
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      triggerRef.current?.focus();
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const menuItems = Array.from(
        wrapperRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
      );
      const index = menuItems.indexOf(document.activeElement as HTMLButtonElement);
      menuItems[
        (index + (event.key === 'ArrowDown' ? 1 : -1) + menuItems.length) % menuItems.length
      ]?.focus();
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
