"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useRouter } from "next/navigation";
import { apiFetch } from "~/lib/fetcher";

const createTeamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
});

const joinTeamSchema = z.object({
  teamId: z.string().min(1, "Team ID is required"),
});

type CreateTeamInput = z.infer<typeof createTeamSchema>;
type JoinTeamInput = z.infer<typeof joinTeamSchema>;

export function TeamForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const createForm = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
    },
  });

  const joinForm = useForm<JoinTeamInput>({
    resolver: zodResolver(joinTeamSchema),
    defaultValues: {
      teamId: "",
    },
  });

  async function onCreateTeam(data: CreateTeamInput) {
    setLoading(true);
    try {
      const result = await apiFetch<{ team: { id: string } }>(
        "/api/teams/create",
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );

      createForm.reset();
      if (result?.team?.id) {
        router.push(`/teams/${result.team.id}`);
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function onJoinTeam(data: JoinTeamInput) {
    setLoading(true);
    try {
      const result = await apiFetch<{ team: { id: string } }>(
        "/api/teams/join",
        {
          method: "POST",
          body: JSON.stringify({ teamId: data.teamId.trim() }),
        },
      );

      if (result?.team?.id) {
        router.push(`/teams/${result.team.id}`);
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Team</CardTitle>
          <CardDescription>
            Create a new team and become the team leader.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onCreateTeam)}
              className="space-y-4"
            >
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter team name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={loading || createForm.formState.isSubmitting}
              >
                {createForm.formState.isSubmitting
                  ? "Creating..."
                  : "Create Team"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Join Team</CardTitle>
          <CardDescription>
            Enter the Team ID shared by the team leader. All team members must
            be from the same college. Teams can have up to 4 members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...joinForm}>
            <form
              onSubmit={joinForm.handleSubmit(onJoinTeam)}
              className="space-y-4"
            >
              <FormField
                control={joinForm.control}
                name="teamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter team ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={loading || joinForm.formState.isSubmitting}
              >
                {joinForm.formState.isSubmitting ? "Joining..." : "Join Team"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
