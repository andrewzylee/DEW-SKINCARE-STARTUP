import type { ReactNode } from 'react';

// Standard screen header: big confident title, optional subtitle, optional right slot.
export function ScreenHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-6">
      <div>
        <h1 className="text-[28px] font-bold leading-none tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-[15px] leading-snug text-muted">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}
