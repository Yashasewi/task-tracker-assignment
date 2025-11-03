"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import type { DateFilter, StatusFilter } from "@/types";

interface FilterControlsProps {
    statusFilter: StatusFilter;
    dateFilter: DateFilter;
    onStatusFilterChange: (filter: StatusFilter) => void;
    onDateFilterChange: (filter: DateFilter) => void;
    onClearFilters: () => void;
}

export const FilterControls = React.memo(function FilterControls({
    statusFilter,
    dateFilter,
    onStatusFilterChange,
    onDateFilterChange,
    onClearFilters,
}: FilterControlsProps) {
    return (
        <div className="mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                    Status:
                </span>
                <div className="flex gap-1">
                    {[
                        { value: "all", label: "All" },
                        { value: "pending", label: "Pending" },
                        { value: "completed", label: "Completed" },
                    ].map((option) => (
                        <Button
                            key={option.value}
                            variant={
                                statusFilter === option.value
                                    ? "default"
                                    : "outline"
                            }
                            size="sm"
                            onClick={() =>
                                onStatusFilterChange(
                                    option.value as StatusFilter,
                                )
                            }
                            className="transition-all duration-200"
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                    Due Date:
                </span>
                <div className="flex gap-1">
                    {[
                        { value: "all", label: "All" },
                        { value: "today", label: "Today" },
                        { value: "week", label: "This Week" },
                        { value: "overdue", label: "Overdue" },
                        { value: "no-date", label: "No Date" },
                    ].map((option) => (
                        <Button
                            key={option.value}
                            variant={
                                dateFilter === option.value
                                    ? "default"
                                    : "outline"
                            }
                            size="sm"
                            onClick={() =>
                                onDateFilterChange(option.value as DateFilter)
                            }
                            className="transition-all duration-200"
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
            </div>

            {(statusFilter !== "all" || dateFilter !== "all") && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearFilters}
                    className="text-gray-500 hover:text-gray-700"
                >
                    Clear Filters
                </Button>
            )}
        </div>
    );
});
