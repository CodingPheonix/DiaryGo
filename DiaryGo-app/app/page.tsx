"use client"
import { useState } from "react"
import Sign_up from "./Components/Sign_up"
import Log_in from "./Components/Log_in"

export default function Home() {

  const [isSigningUp, setIsSigningUp] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  return (
    <main className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* Hero Section */}
      <section className="flex flex-1 flex-col md:flex-row items-center justify-center px-8 md:px-16">
        {/* Left Side: Text */}
        <div className="flex flex-col gap-6 text-center w-full">
          <h2 className="text-4xl md:text-5xl font-extrabold text-black leading-tight">
            Manage Your <span className="text-blue-600">Tasks</span> &
            Productivity with <span className="text-blue-600">DiaryGo</span>
          </h2>
          <p className="text-lg text-gray-700">
            DiaryGo helps you track tasks, manage subtasks, and boost your daily
            productivity. Simple, fast, and powerful.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => { setIsLoggingIn(!isLoggingIn) }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Log In
            </button>
            <button
              onClick={() => { setIsSigningUp(!isSigningUp) }}
              className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Right Side: Image */}
        {/* <div className="mt-10 md:mt-0 md:w-1/2 flex justify-center">
          <Image
            src="/hero-image.png" // 👉 replace with your own illustration
            alt="DairyGo productivity illustration"
            width={500}
            height={400}
            className="rounded-xl shadow-lg"
          />
        </div> */}
      </section>

      {/* Footer */}
      {/* <footer className="w-full py-6 bg-black text-white text-center text-sm">
        © {new Date().getFullYear()} DairyGo. All rights reserved.
      </footer> */}

      {isSigningUp && <Sign_up />}
      {isLoggingIn && <Log_in />}
    </main>
  )
}
