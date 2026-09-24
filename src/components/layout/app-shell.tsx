"use client"

import { PropsWithChildren } from "react"

import Sidebar from "./sidebar"
import Topbar from "./topbar"

const AppShell = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex min-h-screen bg-muted/50">
      <Sidebar className="fixed inset-y-0 left-0 z-40" />
      <div className="flex flex-1 flex-col md:pl-64">
        <Topbar className="sticky top-0 z-30" />
        <main className="flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default AppShell
