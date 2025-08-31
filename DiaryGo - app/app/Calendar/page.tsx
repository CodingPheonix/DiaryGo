"use client"
import React, { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import { useCurrentUser } from '../Components/CurrentUser'
import { GetCalendarEvents } from '../Components/APIs'

/*
  Things to be marked on calendar :
  - Targets set
  - Achievements done
  - Targets achieved
*/

const page = () => {

  type event = {
    title: string,
    date: string
  }

  const currentUser = useCurrentUser();

  const [event_list, setEvent_list] = useState<event[]>([])
  console.log(event_list);

  useEffect(() => {
    if(!currentUser) return;
    const fetchEvents = async () => {
      const events = await GetCalendarEvents({ userId: currentUser as string });
      console.log(events);
      Array.isArray(events.data) && events.data.map((event: { event: string; date: string | any[] }, i: any) => {
        setEvent_list((prev) => [
          ...prev,
          {
            title: event.event,
            date: typeof event.date === "string"
              ? event.date.slice(0, 10)
              : ""
          }
        ])
      })
    };

    fetchEvents();
  }, [currentUser]);

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
