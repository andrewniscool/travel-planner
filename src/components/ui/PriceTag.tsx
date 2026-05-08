import React from 'react';

type PriceTagSize = 'sm' | 'md' | 'lg';

interface PriceTagProps {
  amount: number;
  currency?: string;
  size?: PriceTagSize;
  className?: string;
}

const sizeClasses: Record<PriceTagSize, string> = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-2xl',
};

const PriceTag: React.FC<PriceTagProps> = ({
  amount,
  currency = 'USD',
  size = 'md',
  className = '',
}) => {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return (
    <span
      className={[
        'font-semibold text-neutral-900',
        sizeClasses[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {formatted}
    </span>
  );
};

export default PriceTag;
