"use client";

import React, { useState, useEffect } from "react";
import { X, FileSpreadsheet, CheckSquare, Square, Download, Filter } from "lucide-react";
import { exportToExcel, ReportFilters } from "@/lib/reportService";

export interface ColumnDefinition {
  key: string;
  label: string;
  defaultSelected?: boolean;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: "Orders" | "Inventory" | "Customers" | "Product Sales";
  availableColumns: ColumnDefinition[];
  data: Record<string, unknown>[];
  activeFilters: ReportFilters;
}

export function ExportModal({
  isOpen,
  onClose,
  reportType,
  availableColumns,
  data,
  activeFilters,
}: ExportModalProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedKeys(
        availableColumns
          .filter((c) => c.defaultSelected !== false)
          .map((c) => c.key)
      );
    }
  }, [isOpen, availableColumns]);

  if (!isOpen) return null;

  const toggleColumn = (key: string) => {
    if (selectedKeys.includes(key)) {
      setSelectedKeys(selectedKeys.filter((k) => k !== key));
    } else {
      setSelectedKeys([...selectedKeys, key]);
    }
  };

  const selectAll = () => {
    setSelectedKeys(availableColumns.map((c) => c.key));
  };

  const clearAll = () => {
    setSelectedKeys([]);
  };

  const handleGenerateExcel = () => {
    if (selectedKeys.length === 0) {
      alert("Please select at least one column to export.");
      return;
    }

    setIsExporting(true);

    setTimeout(() => {
      const selectedCols = availableColumns.filter((c) => selectedKeys.includes(c.key));
      const formattedDate = new Date().toISOString().split("T")[0];
      const filenameSlug = reportType.toLowerCase().replace(/\s+/g, "-");
      const filename = `${filenameSlug}-report-${formattedDate}.xlsx`;

      exportToExcel(filename, reportType, data, selectedCols);
      setIsExporting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 z-10">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold" style={{ color: "#102452" }}>
                Generate Excel Report
              </h3>
              <p className="text-xs text-gray-500">
                Report Type: <strong className="text-navy">{reportType}</strong> ({data.length} records)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Summary Pill Bar */}
        <div className="px-6 py-2.5 bg-blue-50/40 border-b border-blue-100/50 flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <span className="font-bold flex items-center gap-1 text-navy">
            <Filter size={12} /> Applied:
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-gray-200 font-medium">
            {activeFilters.datePreset}
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-gray-200 font-medium">
            {activeFilters.store || "All Stores"}
          </span>
          <span className="px-2 py-0.5 rounded bg-white border border-gray-200 font-medium">
            {activeFilters.slot || "All Slots"}
          </span>
        </div>

        {/* Body / Column Selection */}
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Select Columns to Include ({selectedKeys.length}/{availableColumns.length})
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-xs font-bold text-navy hover:underline"
              >
                Select All
              </button>
              <span className="text-gray-300">•</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-bold text-gray-500 hover:text-red hover:underline"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {availableColumns.map((col) => {
              const isSelected = selectedKeys.includes(col.key);
              return (
                <button
                  key={col.key}
                  type="button"
                  onClick={() => toggleColumn(col.key)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                    isSelected
                      ? "bg-navy/5 border-navy/30 text-navy font-bold shadow-2xs"
                      : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {isSelected ? (
                    <CheckSquare size={16} className="text-navy shrink-0" />
                  ) : (
                    <Square size={16} className="text-gray-300 shrink-0" />
                  )}
                  <span className="truncate">{col.label}</span>
                </button>
              );
            })}
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-[11px] text-gray-500 leading-relaxed">
            Exports a true binary <strong>.xlsx</strong> file compatible with Microsoft Excel, Google Sheets, and LibreOffice with auto-sized column widths and preserved formats.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerateExcel}
            disabled={isExporting || selectedKeys.length === 0}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#0B2A63" }}
            onMouseEnter={(e) => {
              if (!isExporting) (e.currentTarget.style.backgroundColor = "#071D4A");
            }}
            onMouseLeave={(e) => {
              if (!isExporting) (e.currentTarget.style.backgroundColor = "#0B2A63");
            }}
          >
            {isExporting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Export Excel (.xlsx)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
