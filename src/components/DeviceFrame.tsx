import type { ReactNode } from 'react';

// Centers the app at iPhone proportions (~430px) with a subtle device frame on wide
// screens; edge-to-edge full-screen on mobile. Holds an in-frame overlay root so bottom
// sheets render above content but stay clipped to the "device".
export function DeviceFrame({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] w-full place-items-center bg-[#E7E9EC] sm:p-6">
      <div
        className="relative flex h-[100dvh] w-full max-w-app flex-col overflow-hidden bg-bg sm:h-[880px] sm:max-h-[calc(100dvh-3rem)] sm:rounded-[46px] sm:shadow-pop sm:ring-1 sm:ring-black/[0.06]"
      >
        {children}
        {/* Overlay root: sheets/modals portal here to sit above content, within the frame. */}
        <div id="stack-overlay" className="pointer-events-none absolute inset-0 z-40" />
      </div>
    </div>
  );
}
