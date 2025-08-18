"use client"
import React from "react"
import { login } from "../Utilities/actions/auth"
import { useActionState } from "react"
import { redirect } from "next/navigation"

const Log_in = () => {

    interface UserData {
        _id: string;
        email: string;
        password: string;
        username: string;
    }

    interface State {
        errors: Record<string, string[]>;
        success: boolean;
        data: UserData | null;
    }

    const initialState: State = {
        errors: {},
        success: false,
        data: null
    };
    const [state, action, pending] = useActionState(login, initialState)

    if (state.data) {
        redirect(`/My_diary`)
    }

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-8">
                {/* Title */}
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Login to Your Account
                </h2>

                <form action={action} className="space-y-5">
                    {/* Email */}
                    <div className="flex flex-col">
                        <label
                            htmlFor="email"
                            className="text-sm font-medium text-gray-700"
                        >
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            className="mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        {state?.errors?.email && (
                            <p className="text-red-500 text-sm mt-1">{state.errors.email}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="flex flex-col">
                        <label
                            htmlFor="password"
                            className="text-sm font-medium text-gray-700"
                        >
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            className="mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        {state?.errors?.password && (
                            <p className="text-red-500 text-sm mt-1">
                                {state.errors.password}
                            </p>
                        )}
                    </div>

                    {/* General errors */}
                    {state?.errors?.general && (
                        <p className="text-red-500 text-sm">{state.errors.general}</p>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={pending}
                        className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
                    >
                        {pending ? "Logging in..." : "Login"}
                    </button>
                </form>

            </div>
        </div>
    )
}

export default Log_in
