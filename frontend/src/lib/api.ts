import axios from "axios";

export interface Task {
    _id: string;
    title: string;
    description: string;
    status: "pending" | "completed";
    dueDate?: string;
    createdAt: string;
}

export const api = {
    tasks: {
        getAll: async (): Promise<Task[]> => {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/tasks`,
            );
            return response.data;
        },

        create: async (
            task: Omit<Task, "_id" | "createdAt">,
        ): Promise<Task> => {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/tasks`,
                task,
            );
            return response.data;
        },

        update: async (id: string, task: Partial<Task>): Promise<Task> => {
            const response = await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${id}`,
                task,
            );
            return response.data;
        },

        delete: async (id: string): Promise<void> => {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${id}`,
            );
        },
    },
};
