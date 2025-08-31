"use client"
import React, { useState, useEffect } from 'react'
import Ongoing_task_card from '../Components/Ongoing_task_card'
import Completed_task_card from '../Components/Completed_task_card'
import { CurrentUser } from '../Components/CurrentUser'
import { fetchAllTargets, modifyIsCompletedStatus } from '../Components/APIs'

const Page = () => {

  type Task = {
    userId: string;
    target: { name: string; progress: number; _id: string };
    task_list: { name: string; progress: number; _id: string }[];
    target_achieved: boolean;
    _id: string;
  };

  // State List
  const [ongoing_task_list, setOngoing_task_list] = useState<Task[]>([])
  const [completed_Task_List, setCompleted_Task_List] = useState<Task[]>([])

  // Fetch Current User
  const currentUser = CurrentUser();

  useEffect(() => {
    const func = async () => {
      const fetch_all_targets = await fetchAllTargets(currentUser as string);
      const ongoingTasks: Task[] = [];
      const completedTasks: Task[] = [];

      if (Array.isArray(fetch_all_targets.data)) {
        fetch_all_targets.data.forEach(async (target: Task) => {
          
          if (target.target.progress === 100 && target.target_achieved === false) {
            await modifyIsCompletedStatus({diaryId: target._id, target_achieved: true})
          }

          if (!target.target_achieved) {
            ongoingTasks.push(target);
          } else {
            completedTasks.push(target);
          }
        });

        setOngoing_task_list(ongoingTasks);
        setCompleted_Task_List(completedTasks);
      }
    }
    func();
  }, [currentUser])

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
                  <Ongoing_task_card task={task.target.name} taskList={task.task_list} />
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
                  <Completed_task_card task_name={task.target.name} />
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

export default Page
