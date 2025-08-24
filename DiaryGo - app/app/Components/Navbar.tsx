"use client"
import React, { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

import Sign_up from './Sign_up'
import Log_in from './Log_in'
import { fetchSession } from '../Utilities/actions/auth'
import { logout } from '../Utilities/actions/auth'

const Navbar = () => {

    const [isSigningUp, setIsSigningUp] = useState(false)
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [currentUser, setCurrentUser] = useState("")
    const [isShowingLogout, setIsShowingLogout] = useState(false)

    const Fetch_current_user = useCallback(
        async () => {
            const session = await fetchSession()
            if (session) {
                const response = await fetch(`/api/auth?userId=${session.userId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                });
                const result = await response.json();
                return { response, result };
            }
        }, [],
    )

    useEffect(() => {
        const recieve_session = async () => {
            const answer = await Fetch_current_user()
            if (answer?.response?.status == 200) {
                setIsLoggedIn(true)
                setCurrentUser(answer.result.data.username)
            }
        }
        recieve_session()
    }, [Fetch_current_user])


    return (
        <nav className="flex items-center justify-between px-6 py-3 bg-white shadow-md">
            {/* Logo */}
            <div className="flex items-center gap-2">
                <Image
                    src="/file.svg"
                    width={40}
                    height={40}
                    alt="logo"
                />
                <p className="text-2xl font-bold text-gray-800">DiaryGo</p>
            </div>

            {/* Navigation Links */}
            <ul className="hidden md:flex gap-8 text-gray-600 font-medium">
                <Link href={'/My_diary'}><li className="hover:text-blue-600 cursor-pointer transition">My Diary</li></Link>
                <Link href={'/Calendar'}><li className="hover:text-blue-600 cursor-pointer transition">Calendar</li></Link>
                <Link href={'/Finished_task'}><li className="hover:text-blue-600 cursor-pointer transition">Finished Tasks</li></Link>
                <Link href={'/Contact'}><li className="hover:text-blue-600 cursor-pointer transition">Contact Us</li></Link>
            </ul>

            {/* Auth Buttons */}
            {isLoggedIn ? (
                <div className='flex flex-col relative'>
                    <div onClick={() => { setIsShowingLogout(!isShowingLogout) }} className="flex justify-around items-center gap-3 hover:cursor-pointer">
                        <div className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 text-white">
                            {currentUser ? currentUser.charAt(0).toUpperCase() : "?"}
                        </div>
                        <p className="text-xl h-7">{currentUser || "Guest"}</p>
                    </div>
                    <div className={`${isShowingLogout ? 'block' : 'hidden'} p-1 absolute -bottom-16 z-10 bg-white shadow-md rounded-md`}>
                        <button onClick={() => { logout(); setIsShowingLogout(false) }} className='p-2 hover:bg-red-600 hover:text-white rounded-md'>Log out</button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-3">
                    <button onClick={() => { setIsLoggingIn(!isLoggingIn) }} className="px-4 py-2 rounded-lg hover:text-blue-500 transition">
                        Log In
                    </button>
                    <button onClick={() => { setIsSigningUp(!isSigningUp) }} className="px-4 py-2 bg-black text-white rounded-lg hover:bg-blue-400 transition">
                        Sign Up
                    </button>
                </div>
            )}

            {isSigningUp && <Sign_up />}
            {isLoggingIn && <Log_in />}
        </nav>
    )
}

export default Navbar
