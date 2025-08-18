"use client"
import React, { useState } from 'react'
import Ongoing_task_card from '../Components/Ongoing_task_card'
import Completed_task_card from '../Components/Completed_task_card'

const page = () => {

  type SubTask = {
    name: string;
    progress: number; // percentage (0–100)
  };

  type OngoingTask = {
    task: string;
    taskList: SubTask[];
  };

  type CompletedTask = {
    task: string;
  };


  const [ongoing_task_list, setOngoing_task_list] = useState<OngoingTask[]>([
    {
      task: "learn AI",
      taskList: [
        { name: "learn python", progress: 20 },
        { name: "learn java", progress: 50 },
      ],
    },
    {
      task: "learn AI",
      taskList: [
        { name: "learn python", progress: 20 },
        { name: "learn java", progress: 50 },
      ],
    },
    {
      task: "learn AI",
      taskList: [
        { name: "learn python", progress: 20 },
        { name: "learn java", progress: 50 },
      ],
    },
  ])
  const [completed_Task_List, setCompleted_Task_List] = useState<CompletedTask[]>([
    { task: "learn AI" },
    { task: "learn AI" },
    { task: "learn AI" },
  ])

  return (
    <div className='flex flex-col justify-around items-center w-[90%] mx-auto min-h-screen'>
      {/* Ongoing Tasks  */}
      <div className='flex flex-col justify-start items-center gap-4 w-full min-h-[50vh]'>
        <h2 className='text-3xl font-bold my-4'>Ongoing Tasks</h2>
        <ul className='flex flex-col w-[90%] mx-auto gap-3 py-2'>
          {Array.isArray(ongoing_task_list) && ongoing_task_list.length !== 0 ? (
            ongoing_task_list.map((task, index) => {
              return (
                <li key={index}>
                  <Ongoing_task_card task={task.task} taskList={task.taskList} />
                </li>
              )
            })
          ) : (
            <p>No ongoing tasks</p>
          )}
        </ul>
      </div>

      {/* Completed Tasks  */}
      <div className='flex flex-col justify-start items-center gap-4 w-full min-h-[50vh] mt-5'>
        <h2 className='text-3xl font-bold my-4'>Completed Tasks</h2>
        <ul className='flex flex-col w-[90%] mx-auto gap-3 py-2'>
          {Array.isArray(completed_Task_List) && completed_Task_List.length !== 0 ? (
            completed_Task_List.map((task, index) => {
              return (
                <li key={index}>
                  <Completed_task_card task_name={task.task} />
                </li>
              )
            })
          ) : (
            <p>No Tasks Completed Yet</p>
          )}
        </ul>
      </div>
    </div>
  )
}

export default page
