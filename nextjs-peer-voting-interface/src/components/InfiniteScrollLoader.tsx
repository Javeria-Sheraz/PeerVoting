"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollLoaderProps {
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
}

export default function InfiniteScrollLoader({
  onLoadMore,
  isLoading,
  hasMore,
}: InfiniteScrollLoaderProps) {
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!observerTarget.current || !hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          onLoadMore();
        }
      },
      {
        rootMargin: "200px", // Start loading 200px before reaching bottom
        threshold: 0,
      }
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [onLoadMore, isLoading, hasMore]);

  if (!hasMore && !isLoading) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-[#a1a1aa]">No more results to load</p>
      </div>
    );
  }

  return (
    <div ref={observerTarget} className="py-8 text-center">
      {isLoading && (
        <>
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-[#4f46e5] border-t-transparent" />
          <p className="mt-2 text-sm text-[#a1a1aa]">Loading more results...</p>
        </>
      )}
    </div>
  );
}
