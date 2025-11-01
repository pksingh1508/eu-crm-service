"use client"

import { PropsWithChildren } from "react"

import Sidebar from "./sidebar"
import Topbar from "./topbar"

const AppShell = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar className="fixed inset-y-0" />
      <div className="flex flex-1 flex-col md:pl-72">
        <Topbar className="sticky top-0 z-30 border-b border-slate-200 bg-white/60 backdrop-blur" />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default AppShell
