"use client";

import { CheckCircle, Plus } from "lucide-react";
import React from "react";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import type { Task } from "@/types";

interface TaskListProps {
    tasks: Task[];
    filteredTasks: Task[];
    onEditTask: (task: Task) => void;
    onToggleStatus: (task: Task) => void;
    onCreateTask: () => void;
    onClearFilters: () => void;
}

export const TaskList = React.memo(function TaskList({
    tasks,
    filteredTasks,
    onEditTask,
    onToggleStatus,
    onCreateTask,
    onClearFilters,
}: TaskListProps) {
    if (filteredTasks.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="animate-in fade-in-0 zoom-in-95 duration-500">
                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {tasks.length === 0
                            ? "No tasks yet"
                            : "No tasks match your filters"}
                    </h3>
                    <p className="text-gray-500 mb-4">
                        {tasks.length === 0
                            ? "Create your first task to get started"
                            : "Try adjusting your filters to see more tasks"}
                    </p>
                    {tasks.length === 0 ? (
                        <Button
                            onClick={onCreateTask}
                            className="transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Task
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={onClearFilters}
                            className="transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTasks.map((task) => (
                <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={onEditTask}
                    onToggleStatus={onToggleStatus}
                />
            ))}
        </div>
    );
});
