"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";

const taskSchema = z.object({
	title: z.string().min(1, "Title is required"),
	description: z.string().optional(),
	status: z.enum(["pending", "completed"]),
	dueDate: z.date().optional(),
});

type TaskForm = z.infer<typeof taskSchema>;

interface TaskDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	task?: Task | null;
	onSaved: (savedTask: Task) => void;
	onDelete?: () => void;
}
export function TaskDialog({
	open,
	onOpenChange,
	task,
	onSaved,
	onDelete,
}: TaskDialogProps) {
	const isEditing = !!task;

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<TaskForm>({
		resolver: zodResolver(taskSchema),
		defaultValues: {
			title: "",
			description: "",
			status: "pending",
			dueDate: undefined,
		},
	});

	useEffect(() => {
		if (open && !task) {
			// Reset form when opening dialog for creating a new task
			reset({
				title: "",
				description: "",
				status: "pending",
				dueDate: undefined,
			});
		} else if (task) {
			// Populate form when editing an existing task
			reset({
				title: task.title,
				description: task.description || "",
				status: task.status,
				dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
			});
		}
	}, [task, reset, open]);

	const onSubmit = async (data: TaskForm) => {
		try {
			if (isEditing && task) {
				const updatedTask = await api.tasks.update(task._id, {
					...data,
					dueDate: data.dueDate
						? data.dueDate.toISOString().split("T")[0]
						: undefined,
				});
				toast.success("Task updated successfully!");
				onSaved(updatedTask);
			} else {
				const newTask = await api.tasks.create({
					title: data.title,
					description: data.description || "",
					status: data.status,
					dueDate: data.dueDate
						? data.dueDate.toISOString().split("T")[0]
						: undefined,
				});
				toast.success("Task created successfully!");
				onSaved(newTask);
			}
		} catch (_error) {
			toast.error(
				isEditing ? "Failed to update task" : "Failed to create task",
			);
		}
	};
	const handleDelete = () => {
		if (onDelete) {
			onDelete();
			onOpenChange(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px] animate-in fade-in-0 zoom-in-95 duration-200">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Task" : "Create New Task"}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? "Update your task details below."
							: "Fill in the details for your new task."}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="title">Title</Label>
						<Input
							id="title"
							placeholder="Enter task title"
							{...register("title")}
							className="transition-all duration-200 focus:scale-[1.02]"
						/>
						{errors.title && (
							<p className="text-sm text-red-500 animate-in slide-in-from-top-1 duration-200">
								{errors.title.message}
							</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea
							id="description"
							placeholder="Enter task description (optional)"
							{...register("description")}
							className="transition-all duration-200 focus:scale-[1.02] min-h-20"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="status">Status</Label>
						<Select
							value={watch("status")}
							onValueChange={(value) =>
								setValue("status", value as "pending" | "completed")
							}
						>
							<SelectTrigger className="transition-all duration-200 focus:scale-[1.02]">
								<SelectValue placeholder="Select status" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="pending">Pending</SelectItem>
								<SelectItem value="completed">Completed</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label htmlFor="dueDate">Due Date</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant={"outline"}
									className={cn(
										"w-full justify-start text-left font-normal",
										!watch("dueDate") && "text-muted-foreground",
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{watch("dueDate") ? (
										format(watch("dueDate") as Date, "PPP")
									) : (
										<span>Pick a date</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0">
								<Calendar
									mode="single"
									selected={watch("dueDate")}
									onSelect={(date) => setValue("dueDate", date)}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					</div>

					<DialogFooter className="gap-2">
						{isEditing && onDelete && (
							<Button
								type="button"
								variant="destructive"
								onClick={handleDelete}
								className="transition-all duration-200 hover:scale-105 active:scale-95"
							>
								Delete
							</Button>
						)}
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							className="transition-all duration-200 hover:scale-105 active:scale-95"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isSubmitting}
							className="transition-all duration-200 hover:scale-105 active:scale-95"
						>
							{isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
