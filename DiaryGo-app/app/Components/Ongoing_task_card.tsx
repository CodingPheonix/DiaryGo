"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SubTask {
    name: string;
    progress: number;
}

interface OngoingTaskCard {
    task: string;
    taskList: SubTask[]; // ✅ dynamic-length array of subtasks
}

const Ongoing_task_card: React.FC<OngoingTaskCard> = (taskObj) => {
    const {task, taskList} = taskObj;
    const [isOpen, setIsOpen] = useState(false);

    // main progress = average of subtasks
    const averageProgress =
        (taskList?.reduce((sum, t) => sum + t.progress, 0) ?? 0) /
        (taskList?.length ?? 1);


    return (
        <Card onClick={() => setIsOpen(!isOpen)} className="w-full mx-auto p-4 shadow-lg rounded-2xl bg-white">
            {/* Top row - main task */}
            <div className="flex items-center justify-between ">
                {/* Left - Circle + Task name */}
                <div className="flex items-center gap-7">
                    {/* Circular Progress */}
                    <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="#e5e7eb"
                                strokeWidth="6"
                                fill="transparent"
                            />
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="#3b82f6"
                                strokeWidth="6"
                                fill="transparent"
                                strokeDasharray={2 * Math.PI * 28}
                                strokeDashoffset={
                                    2 * Math.PI * 28 * (1 - averageProgress / 100)
                                }
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center font-bold text-sm">
                            {Math.round(averageProgress)}%
                        </span>
                    </div>

                    {/* Task Name */}
                    <h2 className="text-lg font-semibold text-gray-800">{task}</h2>
                </div>

                {/* Right - Toggle Button */}
                <button
                    className="p-2 rounded-full hover:bg-gray-100 transition"
                >
                    {isOpen ? <ChevronUp /> : <ChevronDown />}
                </button>
            </div>

            {/* Collapsible Section */}
            <div
                className={`transition-all duration-300 overflow-hidden ${isOpen ? "max-h-96 mt-4" : "max-h-0"
                    }`}
            >
                <ul className="flex flex-col gap-2">
                    {Array.isArray(taskList) && taskList.map((t, index) => (
                        <li
                            key={index}
                            className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                        >
                            <span>{t.name}</span>
                            <span className="text-sm text-gray-600">{t.progress}/100</span>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );
};

export default Ongoing_task_card;
