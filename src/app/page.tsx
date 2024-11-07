"use client"

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  const create = () => {
    console.log("create room");
  };
  const join = () => {
    console.log("join room");
  };
  return (
    <>
    <div className="h-screen flex flex-col justify-center" >
    <nav className="bg-neutral-900 p-1">
    <header className="top-0 h-[50px] flex m-auto justify-around items-center">
        <div>
            <button className="mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" height="48px" viewBox="0 -960 960 960" width="48px" fill="#65a30d"><path d="M904.31-55 741.35-217.96H311.87q-33.26 0-56.24-23.14-22.98-23.15-22.98-56.64v-80H665.3q32.67 0 55.94-22.98 23.28-22.98 23.28-56.24v-272.08h80q33.49 0 56.64 23.14 23.15 23.15 23.15 56.64V-55ZM135.48-461.74l55.21-55.22H605.3v-309.26H135.48v364.48ZM55.69-270.96v-555.26q0-33.49 23.15-56.63Q101.99-906 135.48-906H605.3q32.67 0 55.94 23.15 23.28 23.14 23.28 56.63v309.26q0 33.26-23.28 56.24-23.27 22.98-55.94 22.98H222.48L55.69-270.96Zm79.79-246v-309.26 309.26Z"/></svg>
            </button>
        </div>
        <div className="flex gap-8">
        <button className="bg-lime-600 p-2 flex items-center rounded-xl ">
            Sign-in
        </button>
        <button className="bg-lime-600 p-2 flex items-center rounded-xl ">
            Sign-up
        </button>
        </div>
    </header>
    </nav>
    <div className="w-full flex justify-center items-center gap-4 h-screen">
      <button
        className="p-2 bg-lime-600 rounded-xl text-xl font-bold h-[150px] w-[150px]"
        onClick={create}
      >
        Create a Room
      </button>
      <button
        className="p-2 bg-lime-600 rounded-xl text-xl font-bold h-[150px] w-[150px]"
        onClick={join}
      >
        Join a Room
      </button>
    </div>
    </div>
    </>
  );
}
