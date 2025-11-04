"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  createTeamMemberAction,
  type CreateTeamMemberState
} from "@/server/team/actions";
import { useRouter } from "next/navigation";

const initialState: CreateTeamMemberState = {
  success: false,
  error: undefined
};

const AddNewTeamMember = () => {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [state, formAction, isPending] = useActionState(
    createTeamMemberAction,
    initialState
  );
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      toast.success("Team member created. Share the credentials securely.");
      router.refresh();
    }
  }, [state.success]);

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl text-slate-900">
          Add a team member
        </CardTitle>
        <CardDescription>
          Create an account directly and share the credentials securely with
          your teammate.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={formAction}
          className="grid gap-4 md:grid-cols-2"
          autoComplete="off"
        >
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="new-member-full-name">Full name</Label>
            <Input
              id="new-member-full-name"
              name="fullName"
              type="text"
              required
              placeholder="Jane Smith"
            />
          </div>
          <div className="grid gap-2 md:col-span-1">
            <Label htmlFor="new-member-email">Email address</Label>
            <Input
              id="new-member-email"
              name="email"
              type="email"
              required
              placeholder="teammate@example.com"
            />
          </div>
          <div className="grid gap-2 md:col-span-1">
            <Label htmlFor="new-member-password">Temporary password</Label>
            <Input
              id="new-member-password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
          </div>

          {state.error ? (
            <p className="md:col-span-2 text-sm text-rose-600">{state.error}</p>
          ) : state.success ? (
            <p className="md:col-span-2 text-sm text-emerald-600">
              Team member created. Remember to share the credentials securely.
            </p>
          ) : null}

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" className="md:w-auto" disabled={isPending}>
              {isPending ? (
                <>
                  <Spinner className="mr-2 text-white" />
                  creating
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddNewTeamMember;
