"use client";

import { CheckCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { TaskCard } from "@/components/task-card";
import { TaskDialog } from "@/components/task-dialog";
import { Button } from "@/components/ui/button";
import { api, type Task } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { fireConfetti } from "@/lib/confetti";

export default function DashboardPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [statusFilter, setStatusFilter] = useState<
        "all" | "pending" | "completed"
    >("all");
    const [dateFilter, setDateFilter] = useState<
        "all" | "today" | "week" | "overdue" | "no-date"
    >("all");
    const { user, logout, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const loadTasks = useCallback(async () => {
        try {
            const data = await api.tasks.getAll();
            setTasks(data);
        } catch (_error) {
            toast.error("Failed to load tasks");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const filteredTasks = useMemo(() => {
        let filtered = tasks;

        // Filter by status
        if (statusFilter !== "all") {
            filtered = filtered.filter((task) => task.status === statusFilter);
        }

        // Filter by date
        if (dateFilter !== "all") {
            const now = new Date();
            const today = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
            );
            const weekFromNow = new Date(today);
            weekFromNow.setDate(today.getDate() + 7);

            filtered = filtered.filter((task) => {
                if (!task.dueDate) {
                    return dateFilter === "no-date";
                }

                const dueDate = new Date(task.dueDate);
                const dueDateOnly = new Date(
                    dueDate.getFullYear(),
                    dueDate.getMonth(),
                    dueDate.getDate(),
                );

                switch (dateFilter) {
                    case "today":
                        return dueDateOnly.getTime() === today.getTime();
                    case "week":
                        return (
                            dueDateOnly >= today && dueDateOnly <= weekFromNow
                        );
                    case "overdue":
                        return dueDateOnly < today;
                    case "no-date":
                        return false; // Already handled above
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }, [tasks, statusFilter, dateFilter]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }

        if (user) {
            loadTasks();
        }
    }, [user, authLoading, router, loadTasks]);

    const handleCreateTask = () => {
        setEditingTask(null);
        setIsDialogOpen(true);
    };

    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsDialogOpen(true);
    };

    const handleTaskSaved = async (savedTask: Task) => {
        setIsDialogOpen(false);
        if (editingTask) {
            // Check if task was just completed
            const wasJustCompleted =
                editingTask.status === "pending" &&
                savedTask.status === "completed";

            // Update existing task in local state
            setTasks(
                tasks.map((t) => (t._id === savedTask._id ? savedTask : t)),
            );

            // Trigger confetti if task was just completed
            if (wasJustCompleted) {
                fireConfetti();
            }
        } else {
            // Add new task to the beginning (most recent first)
            setTasks([savedTask, ...tasks]);

            // Trigger confetti if new task is created as completed
            if (savedTask.status === "completed") {
                fireConfetti();
            }
        }
    };

    const handleToggleStatus = async (task: Task) => {
        try {
            const newStatus =
                task.status === "pending" ? "completed" : "pending";
            await api.tasks.update(task._id, { status: newStatus });
            setTasks(
                tasks.map((t) =>
                    t._id === task._id ? { ...t, status: newStatus } : t,
                ),
            );
            toast.success(`Task marked as ${newStatus}`);

            // Trigger confetti when task is completed
            if (newStatus === "completed") {
                fireConfetti();
            }
        } catch (_error) {
            toast.error("Failed to update task");
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            await api.tasks.delete(taskId);
            setTasks(tasks.filter((t) => t._id !== taskId));
            toast.success("Task deleted");
        } catch (_error) {
            toast.error("Failed to delete task");
        }
    };

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                userName={user.name}
                onCreateTask={handleCreateTask}
                onLogout={handleLogout}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filter Controls */}
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
                                        setStatusFilter(option.value as any)
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
                                        setDateFilter(option.value as any)
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
                            onClick={() => {
                                setStatusFilter("all");
                                setDateFilter("all");
                            }}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTasks.map((task) => (
                        <TaskCard
                            key={task._id}
                            task={task}
                            onEdit={handleEditTask}
                            onToggleStatus={handleToggleStatus}
                        />
                    ))}
                </div>

                {filteredTasks.length === 0 && (
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
                                    onClick={handleCreateTask}
                                    className="transition-all duration-200 hover:scale-105 active:scale-95"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Task
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setStatusFilter("all");
                                        setDateFilter("all");
                                    }}
                                    className="transition-all duration-200 hover:scale-105 active:scale-95"
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <TaskDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                task={editingTask}
                onSaved={handleTaskSaved}
                onDelete={
                    editingTask
                        ? () => handleDeleteTask(editingTask._id)
                        : undefined
                }
            />
        </div>
    );
}
