'use client'
import React, { useState, useEffect } from 'react'
import Diary_task_card from '../Components/Dairy_task_card';
import { format, addDays, subDays, isAfter } from "date-fns";
import { MdOutlineAdd } from "react-icons/md";
import { useForm, SubmitHandler } from "react-hook-form"
import { ToastContainer, toast } from 'react-toastify';
import { getAchievements, sendMessage, UploadAchievement, uploadNewTask, UploadToCalendar } from '../Components/APIs';
import { CurrentUser } from '../Components/CurrentUser';

const Page = () => {
  const today = new Date();

  // Fetch Current User
  const currentUser = CurrentUser();

  // Type Declarations
  type OnAchievementSubmit = {
    target: string
  }
  type OnCreatingTarget = {
    target: string,
    tasks: string
  }
  type TaskCard = {
    task: string,
    time: string
  }

  // Submit useform for creating target
  const {
    register: registerCreating,
    handleSubmit: handleCreatingSubmit,
    reset: resetCreating,
    formState: { errors: creatingErrors },
  } = useForm<OnCreatingTarget>();

  // Submit useform for Achievement Submit
  const {
    register: registerAchievement,
    handleSubmit: handleAchievementSubmit,
    reset: resetAchievement,
    formState: { errors: achievementErrors },
  } = useForm<OnAchievementSubmit>();

  // State List
  const [isCreating, setIsCreating] = useState<boolean>(false)
  const [isCreatingTarget, setIsCreatingTarget] = useState<boolean>(false)
  const [isAddingAchievement, setIsAddingAchievement] = useState<boolean>(false)
  const [isSubmittingAchievement, setIsSubmittingAchievement] = useState<boolean>(false)
  const [currentDate, setCurrentDate] = useState<Date>(today);
  const [daily_task_card_list, setDaily_task_card_list] = useState<TaskCard[]>([])

  // Functions to Handle date (Prev)
  const handlePrev = () => {
    setCurrentDate((prev) => subDays(prev, 1));
  };

  // Functions to Handle date (Next)
  const handleNext = () => {
    if (!isAfter(addDays(currentDate, 1), today)) {
      setCurrentDate((prev) => addDays(prev, 1));
    }
  };

  // Handle Achievement Submission Form
  const onAchievementSubmit: SubmitHandler<OnAchievementSubmit> = async (data) => {
    console.log(data.target)
    setIsSubmittingAchievement(true)
    const curr_time = new Date().toString().trim().slice(15, 21)

    const prompt = `
      I want to update the progress of my tasks. Here are some documents:
      Achievement: ${data.target},
      userId: ${currentUser}
    `
    const response = await sendMessage(prompt)   // Calculate the progress and other tasks through Agent
    console.log(response)

    if (response) {
      // Upload achievement to current date and time
      await UploadAchievement({
        userId: currentUser as string,
        task: data.target,
        date: format(new Date(), "yyyy-MM-dd").slice(0, 10),
        time: curr_time
      })

      await UploadToCalendar({    // add event to calendar
        userId: currentUser as string,
        date: format(new Date(), "yyyy-MM-dd").slice(0, 10),
        event: data.target
      });

      setDaily_task_card_list((prev) => [...prev, { task: data.target, time: curr_time }])
      setIsSubmittingAchievement(false)
      setIsAddingAchievement(false)
      toast("Yay! New achievement added")
      resetAchievement()
    } else {
      toast.error("Failed to add achievement")
    }
  }

  // Handle Creating Target Form
  const onCreatingTarget: SubmitHandler<OnCreatingTarget> = async (data) => {
    setIsCreatingTarget(true)
    console.log(data)

    const prompt = `
      you are given a text containing a list of tasks- make me a list of tasks using them - the text is: ${data.tasks}
      I need an array of tasks. like ["task1", "task2", "task3"] made of my given input.
    `

    const task_list = await sendMessage(prompt)   // get the list of tasks
    console.log(task_list)

    const response = await uploadNewTask({    // upload the target
      userId: currentUser as string,
      target: data.target,
      task_list: task_list
    })

    const date = new Date();
    const formattedDate = format(date, "yyyy-MM-dd").slice(0, 10);    // get the current date

    await UploadToCalendar({    // add event to calendar
      userId: currentUser as string,
      date: formattedDate,
      event: data.target
    });

    if (response?.status === 200) {   // perform actions on success
      toast('Yay! New Target Added!')
      setIsCreatingTarget(false)
      resetCreating()
    }
  }

  // Useeffects
  useEffect(() => {
    if (!currentUser) return;
    const func = async () => {
      const task_list = await getAchievements({ userId: currentUser as string, date: format(currentDate, "yyyy-MM-dd") })
      setDaily_task_card_list(task_list.data)
    }
    func()
  }, [currentUser, currentDate])

  // console.log(daily_task_card_list)
  // console.log(currentUser)
  // console.log(format(currentDate, "yyyy-MM-dd"))


  return (
    <div className='w-full'>
      <ToastContainer />
      {/* Choice Tabs */}
      <ul className="flex justify-around items-center w-full">
        <li
          onClick={() => setIsCreating(false)}
          className={`w-1/2 p-5 text-center font-medium transition-colors duration-200 cursor-pointer relative ${!isCreating ? 'text-blue-500' : 'text-black'}`}
        >
          Add Achievement
        </li>

        <li
          onClick={() => setIsCreating(true)}
          className={`w-1/2 p-5 text-center font-medium transition-colors duration-200 cursor-pointer relative ${isCreating ? 'text-blue-500' : 'text-black'}`}
        >
          Create Target
        </li>
      </ul>

      {/* Create Target  */}
      {isCreating && (
        <div className="flex flex-col items-center w-full">
          <p className="text-center font-semibold text-2xl my-4 md:mx-0 mx-5">
            🌟 Yay! A new goal 🎯 What amazing thing do you want to achieve? 💪
          </p>

          <div className="flex justify-center items-center w-[70%]">
            <form onSubmit={handleCreatingSubmit(onCreatingTarget)} className="flex flex-col gap-4 p-6 bg-white rounded-lg w-full shadow-md">
              <label htmlFor="target" className="text-left font-medium text-gray-700">
                What is your target?
              </label>
              <input
                type="text"
                required
                {...registerCreating("target")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label htmlFor="tasks" className="text-left font-medium text-gray-700">
                What do you need to do to achieve it?
              </label>
              <textarea
                {...registerCreating("tasks")}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              ></textarea>

              <input
                type="submit"
                value={`${isCreatingTarget ? "Creating...." : "Create Target"}`}
                className="bg-blue-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-600 transition"
              />
            </form>
          </div>

        </div>

      )}


      {/* Add Achievement  */}
      {!isCreating && (
        <div>

          {/* Date Manager  */}
          <div className="flex items-center justify-center gap-6 p-4">
            {/* Left Arrow */}
            <button
              onClick={handlePrev}
              className="text-2xl px-3 py-1 rounded hover:bg-gray-200 transition"
            >
              ◀
            </button>

            {/* Date Display */}
            <span className="text-2xl font-semibold">
              {format(currentDate, "dd MMMM, yyyy")}
            </span>

            {/* Right Arrow */}
            <button
              onClick={handleNext}
              disabled={isAfter(addDays(currentDate, 1), today)}
              className={`text-2xl px-3 py-1 rounded transition ${isAfter(addDays(currentDate, 1), today)
                ? "text-gray-400 cursor-not-allowed"
                : "hover:bg-gray-200"
                }`}
            >
              ▶
            </button>
          </div>

          {/* Add Achievement  */}
          <div onClick={() => { setIsAddingAchievement(!isAddingAchievement) }} className='p-4 rounded bg-blue-500 w-[4vw] h-[4vw] absolute right-10 bottom-10 flex justify-center items-center'>
            <MdOutlineAdd fill='white' />
          </div>

          {/* List of tasks performed  */}
          <div className='w-[70%] flex flex-col justify-around items-center gap-5 mx-auto'>
            {Array.isArray(daily_task_card_list) && daily_task_card_list.length != 0 ?
              daily_task_card_list.map((card, index) => {
                return (
                  <Diary_task_card key={index} task={card.task} time={card.time} />
                )
              })
              :
              <p className='text-lg text-gray-400'>No tasks added for this day</p>
            }
          </div>
        </div>
      )}

      {/* Form to Add Achievement */}
      <div
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11/12 sm:w-5/6 md:w-3/4 lg:w-2/3 xl:w-2/3 max-h-[90vh] overflow-y-auto shadow-2xl ${isAddingAchievement && !isCreating ? 'block' : 'hidden'}`}
      >
        <form
          onSubmit={handleAchievementSubmit(onAchievementSubmit)}
          className="flex flex-col gap-4 p-6 bg-white rounded-lg w-full shadow-md"
        >
          <label
            htmlFor="target"
            className="text-left font-medium text-gray-700"
          >
            Yeah, let’s gooo! 🎉😎 Sooo... what epic stuff did you crush today? 🏆✨
          </label>

          <textarea
            id="target"
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            {...registerAchievement("target")}
          ></textarea>

          <input
            type="submit"
            value={isSubmittingAchievement ? 'Submitting......' : 'Submit'}
            className="bg-blue-500 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-600 transition"
          />
        </form>
      </div>

    </div>
  )
}

export default Page
