import React from 'react'

interface Diary_task_card {
    task: string,
    time: string
}

const Diary_task_card: React.FC<Diary_task_card> = ({task, time}) => {
    return (
        <div className="w-full bg-white rounded-xl shadow-md p-5 flex justify-between items-center gap-2 hover:shadow-lg transition">
            <p className="text-lg font-semibold text-gray-800">{task}</p>
            <p className="text-sm text-gray-500">🕒 {time}</p>
        </div>
    );
}

export default Diary_task_card
