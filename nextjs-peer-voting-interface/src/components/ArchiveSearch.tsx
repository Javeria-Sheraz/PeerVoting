"use client";

import { useState } from "react";

interface ArchiveSearchProps {
  onSearchChange: (query: string) => void;
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void;
  onClearFilters: () => void;
}

export default function ArchiveSearch({
  onSearchChange,
  onDateRangeChange,
  onClearFilters,
}: ArchiveSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hasFilters, setHasFilters] = useState(false);

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    onSearchChange(value);
    setHasFilters(value.length > 0 || startDate.length > 0 || endDate.length > 0);
  }

  function handleStartDateChange(value: string) {
    setStartDate(value);
    onDateRangeChange(value || null, endDate || null);
    setHasFilters(searchQuery.length > 0 || value.length > 0 || endDate.length > 0);
  }

  function handleEndDateChange(value: string) {
    setEndDate(value);
    onDateRangeChange(startDate || null, value || null);
    setHasFilters(searchQuery.length > 0 || startDate.length > 0 || value.length > 0);
  }

  function handleClearAll() {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
    setShowDateFilter(false);
    setHasFilters(false);
    onSearchChange("");
    onDateRangeChange(null, null);
    onClearFilters();
  }

  return (
    <div className="mb-6 space-y-4 rounded-xl border border-[#2e2e2e] bg-[#1a1a1a] p-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search by poll question, candidate name..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1 rounded-lg border border-[#2e2e2e] bg-[#161616] px-3 py-2.5 text-sm text-[#f5f5f5] placeholder:text-[#52525b] outline-none focus:border-[#4f46e5]"
        />
        <button
          onClick={() => setShowDateFilter(!showDateFilter)}
          className="rounded-lg border border-[#2e2e2e] bg-[#161616] px-4 py-2.5 text-sm font-medium text-[#a1a1aa] transition hover:bg-[#1e1e1e] hover:border-[#4f46e5]"
        >
          📅 Dates
        </button>
      </div>

      {/* Date Range Filter */}
      {showDateFilter && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-full rounded-lg border border-[#2e2e2e] bg-[#161616] px-3 py-2.5 text-sm text-[#f5f5f5] outline-none focus:border-[#4f46e5]"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-[#a1a1aa]">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="w-full rounded-lg border border-[#2e2e2e] bg-[#161616] px-3 py-2.5 text-sm text-[#f5f5f5] outline-none focus:border-[#4f46e5]"
            />
          </div>
        </div>
      )}

      {/* Clear Filters Button */}
      {hasFilters && (
        <button
          onClick={handleClearAll}
          className="text-sm text-[#f87171] transition hover:text-[#fca5a5]"
        >
          ✕ Clear all filters
        </button>
      )}
    </div>
  );
}
