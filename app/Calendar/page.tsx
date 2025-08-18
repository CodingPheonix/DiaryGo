"use client"
import React, { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' 

/*
  Things to be marked on calendar :
  - Targets set
  - Achievements done
  - Targets achieved
*/

const page = () => {

  const [event_list, setEvent_list] = useState([])

  return (
    <div className='w-[90%] mx-auto'>
      <FullCalendar
        plugins={[dayGridPlugin]}
        initialView="dayGridMonth"
        events={event_list}
      />
    </div>
  )
}

export default page
