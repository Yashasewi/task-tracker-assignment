"use client";

import { LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
    userName: string;
    onCreateTask: () => void;
    onLogout: () => void;
}

export function Header({ userName, onCreateTask, onLogout }: HeaderProps) {
    return (
        <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Task Tracker
                        </h1>
                        <p className="text-sm text-gray-600">
                            Welcome back, {userName}!
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={onCreateTask}
                            className="transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Task
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onLogout}
                            className="transition-all duration-200 hover:scale-105 active:scale-95"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
}
