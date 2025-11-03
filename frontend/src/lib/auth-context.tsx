"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import type { AuthContextType, User } from "@/types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_URL;

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Logout function that clears everything
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        delete axios.defaults.headers.common.Authorization;
        setUser(null);
        router.push("/login");
    };

    useEffect(() => {
        // Setup axios interceptor for handling 401 errors
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                // If we get a 401 error, token is invalid/expired
                if (error.response?.status === 401) {
                    console.log("Token expired or invalid, logging out...");
                    logout();
                }
                return Promise.reject(error);
            },
        );

        // Check for stored token on mount
        const token = localStorage.getItem("token");
        if (token) {
            axios.defaults.headers.common.Authorization = `Bearer ${token}`;

            // Verify token with backend
            axios
                .post(`${API_ENDPOINT}/api/auth/verify`, {
                    token,
                })
                .then((response) => {
                    if (response.data.valid) {
                        const storedUser = localStorage.getItem("user");
                        if (storedUser) {
                            setUser(JSON.parse(storedUser));
                        }
                    } else {
                        // Token is invalid, clean up
                        logout();
                    }
                })
                .catch(() => {
                    // Error verifying token, clean up
                    logout();
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setIsLoading(false);
        }

        // Cleanup interceptor on unmount
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await axios.post(
                `${API_ENDPOINT}/api/auth/login`,
                {
                    email,
                    password,
                },
            );
            const { token, user } = response.data;
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            axios.defaults.headers.common.Authorization = `Bearer ${token}`;
            setUser(user);
        } catch (_error) {
            throw new Error("Login failed");
        }
    };

    const signup = async (name: string, email: string, password: string) => {
        try {
            const response = await axios.post(
                `${API_ENDPOINT}/api/auth/signup`,
                {
                    name,
                    email,
                    password,
                },
            );
            const { token, user } = response.data;
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            axios.defaults.headers.common.Authorization = `Bearer ${token}`;
            setUser(user);
        } catch (_error) {
            throw new Error("Signup failed");
        }
    };

    return (
        <AuthContext.Provider
            value={{ user, login, signup, logout, isLoading }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
