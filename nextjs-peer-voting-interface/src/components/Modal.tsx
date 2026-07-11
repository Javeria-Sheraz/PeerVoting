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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className={`fade-in card-surface w-full ${widthClass} max-h-[90dvh] overflow-y-auto rounded-2xl p-6 shadow-2xl`}>
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
