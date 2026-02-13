"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
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
    <div className="space-y-8">
      {/* --- CREATE TEAM CARD --- */}
      <Card className="border-white/30 bg-black/20 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg ring-1 ring-white/10">
              <Users className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl text-white font-bold tracking-tight">
              Create Team
            </CardTitle>
          </div>
          <CardDescription className="text-white/80 text-base font-medium">
            Create a new team and become the team leader.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(onCreateTeam)}
              className="space-y-6"
            >
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-semibold">
                      Team Name
                    </FormLabel>
                    <FormControl>
                      {/* Darker input background for better contrast against the glass card */}
                      <Input
                        placeholder="e.g. The Hackers"
                        {...field}
                        className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/50 h-12 text-lg"
                      />
                    </FormControl>
                    <FormMessage className="text-red-300 font-medium" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={loading || createForm.formState.isSubmitting}
                className="w-full bg-white text-[#10569c] hover:bg-white/90 font-bold h-12 text-lg shadow-lg transition-transform active:scale-[0.98]"
              >
                {createForm.formState.isSubmitting ? (
                  "Creating..."
                ) : (
                  <>
                    Create Team <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Separator / OR */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-white/30"></div>
        <span className="flex-shrink-0 mx-4 text-white/80 font-bold text-sm tracking-widest">
          OR
        </span>
        <div className="flex-grow border-t border-white/30"></div>
      </div>

      {/* --- JOIN TEAM CARD --- */}
      {/* Increased opacity (bg-black/30) here specifically because it sits on the bright sand */}
      <Card className="border-white/30 bg-black/30 backdrop-blur-xl shadow-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg ring-1 ring-white/10">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <CardTitle className="text-2xl text-white font-bold tracking-tight">
              Join Team
            </CardTitle>
          </div>
          <CardDescription className="text-white/80 text-base font-medium">
            Enter the Team ID shared by the team leader.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...joinForm}>
            <form
              onSubmit={joinForm.handleSubmit(onJoinTeam)}
              className="space-y-6"
            >
              <FormField
                control={joinForm.control}
                name="teamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-semibold">
                      Team ID
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 1234-5678"
                        {...field}
                        className="bg-black/20 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/50 h-12 font-mono text-lg"
                      />
                    </FormControl>
                    <FormMessage className="text-red-300 font-medium" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={loading || joinForm.formState.isSubmitting}
                className="w-full bg-white/10 text-white hover:bg-white/20 border border-white/30 font-bold h-12 text-lg backdrop-blur-md shadow-lg transition-transform active:scale-[0.98]"
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
