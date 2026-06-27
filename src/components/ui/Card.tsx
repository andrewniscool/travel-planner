import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = true,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={[
        'bg-white rounded-2xl shadow-card border border-neutral-100 overflow-hidden dark:bg-[var(--app-surface)] dark:border-[var(--app-border)]',
        hover ? 'card-hover' : '',
        onClick ? 'cursor-pointer' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
};

export default Card;
