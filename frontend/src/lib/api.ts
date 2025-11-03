import axios from "axios";
import type { Task } from "@/types";

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_URL;

export const api = {
    tasks: {
        getAll: async (): Promise<Task[]> => {
            const response = await axios.get(`${API_ENDPOINT}/api/tasks`);
            return response.data;
        },

        create: async (
            task: Omit<Task, "_id" | "createdAt">,
        ): Promise<Task> => {
            const response = await axios.post(
                `${API_ENDPOINT}/api/tasks`,
                task,
            );
            return response.data;
        },

        update: async (id: string, task: Partial<Task>): Promise<Task> => {
            const response = await axios.put(
                `${API_ENDPOINT}/api/tasks/${id}`,
                task,
            );
            return response.data;
        },

        delete: async (id: string): Promise<void> => {
            await axios.delete(`${API_ENDPOINT}/api/tasks/${id}`);
        },
    },
};
