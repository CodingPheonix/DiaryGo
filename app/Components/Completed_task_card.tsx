import React from 'react'

const Tick01Icon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width={24} height={24} color={"#000000"} fill={"none"} {...props}>
    <path d="M5 14.5C5 14.5 6.5 14.5 8.5 18C8.5 18 14.0588 8.83333 19 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
  </svg>
);

interface CompletedTaskCardProps {
  task_name: string;
}

const Completed_task_card: React.FC<CompletedTaskCardProps> = ({ task_name }) => {
  console.log('task_name : ', task_name)
  return (
    <div className="flex items-center gap-7 w-full p-3 bg-white shadow rounded-xl hover:shadow-md transition">
      {/* Icon */}
      <span className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-green-100 text-green-600">
        <Tick01Icon className="w-6 h-6" />
      </span>

      {/* Task Name */}
      <p className="flex-1 text-gray-800 font-medium text-base truncate">
        {task_name}
      </p>
    </div>

  )
}

export default Completed_task_card
