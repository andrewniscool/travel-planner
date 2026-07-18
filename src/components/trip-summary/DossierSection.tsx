import React from 'react';
import IconChip, { type IconChipProps } from '../ui/IconChip';

interface DossierSectionProps {
  icon: React.ReactNode;
  tone?: IconChipProps['tone'];
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}

const DossierSection: React.FC<DossierSectionProps> = ({
  icon,
  tone = 'primary',
  title,
  meta,
  children,
}) => {
  return (
    <section className="px-6 py-5 sm:px-7">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <IconChip size="sm" tone={tone} icon={icon} />
          <h2 className="text-xs font-semibold uppercase tracking-eyebrow text-app-text-muted">
            {title}
          </h2>
        </div>
        {meta && <span className="text-xs text-app-text-subtle">{meta}</span>}
      </div>
      {children}
    </section>
  );
};

export default DossierSection;
