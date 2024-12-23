"use client" 
import { SignedIn, UserButton } from "@clerk/nextjs";

export default function Navbar() {
    return ( 
    <nav className="bg-neutral-800 z-10 mr-1 px-2 py-[0.35rem] rounded-sm">
    <div className="flex justify-between items-center">
      <button className="mt-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="48px"
          viewBox="0 -960 960 960"
          width="48px"
          fill="#65a30d"
        >
          <path d="M904.31-55 741.35-217.96H311.87q-33.26 0-56.24-23.14-22.98-23.15-22.98-56.64v-80H665.3q32.67 0 55.94-22.98 23.28-22.98 23.28-56.24v-272.08h80q33.49 0 56.64 23.14 23.15 23.15 23.15 56.64V-55ZM135.48-461.74l55.21-55.22H605.3v-309.26H135.48v364.48ZM55.69-270.96v-555.26q0-33.49 23.15-56.63Q101.99-906 135.48-906H605.3q32.67 0 55.94 23.15 23.28 23.14 23.28 56.63v309.26q0 33.26-23.28 56.24-23.27 22.98-55.94 22.98H222.48L55.69-270.96Zm79.79-246v-309.26 309.26Z" />
        </svg>
      </button>
      <div className="flex gap-8">
        <SignedIn>
          <UserButton
            appearance={{
              elements: { userButtonAvatarBox: "w-[46px] h-[46px]" },
            }}
          />
        </SignedIn>
      </div>
    </div>
  </nav>
    );
}