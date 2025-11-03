/**
 * Common types used across the application
 */

// Task related types
export interface Task {
    _id: string;
    title: string;
    description: string;
    status: TaskStatus;
    dueDate?: string;
    createdAt: string;
}

export type TaskStatus = "pending" | "completed";

export type StatusFilter = "all" | "pending" | "completed";

export type DateFilter = "all" | "today" | "week" | "overdue" | "no-date";

// User related types
export interface User {
    id: string;
    name: string;
    email: string;
}

// Auth related types
export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}
