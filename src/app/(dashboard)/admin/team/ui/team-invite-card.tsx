'use client'

import { useActionState, useEffect, useRef } from "react"

import {
  inviteTeamMemberAction,
  type InviteTeamMemberState
} from "@/server/team/actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const initialState: InviteTeamMemberState = {
  success: false,
  error: undefined
}

const TeamInviteCard = () => {
  const formRef = useRef<HTMLFormElement | null>(null)
  const [state, formAction] = useActionState(
    inviteTeamMemberAction,
    initialState
  )

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl text-slate-900">
          Invite a team member
        </CardTitle>
        <CardDescription>
          Send an invite email so your teammate can create a login and start
          collaborating.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={formAction}
          className="flex flex-col gap-4 md:flex-row md:items-end"
        >
          <div className="grid flex-1 gap-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              required
              placeholder="teammate@example.com"
            />
          </div>
          <Button type="submit" className="md:w-auto">
            Send invite
          </Button>
        </form>
        {state.error ? (
          <p className="mt-3 text-sm text-rose-600">{state.error}</p>
        ) : state.success ? (
          <p className="mt-3 text-sm text-emerald-600">
            Invitation sent successfully.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default TeamInviteCard
