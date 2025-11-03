"use client";

import { CheckCircle, Circle } from "lucide-react";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { Task } from "@/types";

interface TaskCardProps {
    task: Task;
    onEdit: (task: Task) => void;
    onToggleStatus: (task: Task) => void;
}

export const TaskCard = React.memo(function TaskCard({
    task,
    onEdit,
    onToggleStatus,
}: TaskCardProps) {
    return (
        <Card
            className="animate-in fade-in-0 slide-in-from-bottom-4 duration-300 hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
            onClick={() => onEdit(task)}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <CardTitle className="text-lg leading-tight">
                        {task.title}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-8 w-8 p-0 hover:bg-gray-100 transition-colors duration-200"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleStatus(task);
                        }}
                    >
                        {task.status === "completed" ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                            <Circle className="w-5 h-5 text-gray-400" />
                        )}
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant={
                            task.status === "completed"
                                ? "default"
                                : "secondary"
                        }
                        className="transition-all duration-200"
                    >
                        {task.status}
                    </Badge>
                    {task.dueDate && (
                        <span className="text-sm text-gray-500">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                    )}
                </div>
            </CardHeader>
            {task.description && (
                <CardContent className="pt-0">
                    <CardDescription className="line-clamp-3">
                        {task.description}
                    </CardDescription>
                </CardContent>
            )}
        </Card>
    );
});
