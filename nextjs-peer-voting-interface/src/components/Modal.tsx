"use client";

import type { ReactNode } from "react";

export default function Modal({
  title,
  onClose,
  children,
  widthClass = "max-w-md",
}: {
  title: string;
  onClose?: () => void;
  children: ReactNode;
  widthClass?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-sm sm:items-center sm:pt-4">
      <div className={`fade-in card-surface w-full max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl p-6 shadow-2xl ${widthClass}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#f5f5f5]">{title}</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-full p-1 text-[#a1a1aa] hover:bg-[#2a2a2a] hover:text-white"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
