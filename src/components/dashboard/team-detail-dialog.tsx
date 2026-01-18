"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "~/components/ui/alert-dialog";

type TeamMember = {
    id: string;
    name: string | null;
    email: string | null;
    github: string | null;
    isLeader: boolean;
};

type TeamWithMembers = {
    id: string;
    name: string;
    paymentStatus: string | null;
    attended: boolean;
    isCompleted: boolean;
    createdAt: string;
    members: TeamMember[];
};

type TeamDetailDialogProps = {
    teamId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
};

export function TeamDetailDialog({
    teamId,
    open,
    onOpenChange,
    onUpdate,
}: TeamDetailDialogProps) {
    const [team, setTeam] = useState<TeamWithMembers | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchTeam = useCallback(async () => {
        if (!teamId) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/dashboard/teams/${teamId}`);
            if (res.ok) {
                const data = await res.json();
                setTeam(data);
            }
        } finally {
            setIsLoading(false);
        }
    }, [teamId]);

    useEffect(() => {
        if (open && teamId) {
            void fetchTeam();
        }
    }, [open, teamId, fetchTeam]);

    const handleToggleAttended = useCallback(async () => {
        if (!team) return;

        setIsLoading(true);
        try {
            await fetch(`/api/dashboard/teams/${team.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ attended: !team.attended }),
            });
            await fetchTeam();
            onUpdate();
        } finally {
            setIsLoading(false);
        }
    }, [team, fetchTeam, onUpdate]);

    const handleToggleCompleted = useCallback(async () => {
        if (!team) return;

        setIsLoading(true);
        try {
            await fetch(`/api/dashboard/teams/${team.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isCompleted: !team.isCompleted }),
            });
            await fetchTeam();
            onUpdate();
        } finally {
            setIsLoading(false);
        }
    }, [team, fetchTeam, onUpdate]);

    const handleMakeLeader = useCallback(
        async (member: TeamMember) => {
            if (!team) return;

            setIsLoading(true);
            try {
                await fetch(`/api/dashboard/teams/${team.id}/members/${member.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isLeader: true }),
                });
                await fetchTeam();
                onUpdate();
            } finally {
                setIsLoading(false);
            }
        },
        [team, fetchTeam, onUpdate]
    );

    const handleRemoveMember = useCallback(
        async (member: TeamMember) => {
            if (!team) return;

            setIsLoading(true);
            try {
                await fetch(`/api/dashboard/teams/${team.id}/members/${member.id}`, {
                    method: "DELETE",
                });
                await fetchTeam();
                onUpdate();
            } finally {
                setIsLoading(false);
            }
        },
        [team, fetchTeam, onUpdate]
    );

    if (!team) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Team Details</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center h-32">
                        <span className="text-muted-foreground">Loading...</span>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{team.name}</DialogTitle>
                    <DialogDescription>
                        Created {new Date(team.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </DialogDescription>
                </DialogHeader>

                {/* Team Status */}
                <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge variant={team.isCompleted ? "success" : "warning"}>
                            {team.isCompleted ? "Completed" : "Incomplete"}
                        </Badge>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Payment</p>
                        <Badge
                            variant={
                                team.paymentStatus === "Paid"
                                    ? "success"
                                    : team.paymentStatus === "Pending"
                                        ? "warning"
                                        : "outline"
                            }
                        >
                            {team.paymentStatus || "N/A"}
                        </Badge>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Attended</p>
                        <Badge variant={team.attended ? "success" : "outline"}>
                            {team.attended ? "Yes" : "No"}
                        </Badge>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Members</p>
                        <Badge variant="secondary">{team.members.length}/4</Badge>
                    </div>
                </div>

                {/* Team Actions */}
                <div className="flex gap-2 py-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleAttended}
                        disabled={isLoading}
                    >
                        {team.attended ? "Mark Not Attended" : "Mark Attended"}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleCompleted}
                        disabled={isLoading}
                    >
                        {team.isCompleted ? "Mark Incomplete" : "Mark Complete"}
                    </Button>
                </div>

                {/* Members List */}
                <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold">Team Members</h3>
                    {team.members.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No members</p>
                    ) : (
                        <div className="space-y-2">
                            {team.members.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                                >
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <div className="font-medium">
                                                {member.name || "Unnamed"}
                                                {member.isLeader && (
                                                    <Badge variant="default" className="ml-2 text-xs">
                                                        Leader
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {member.email}
                                            </p>
                                            {member.github && (
                                                <p className="text-xs text-muted-foreground">
                                                    @{member.github}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {!member.isLeader && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleMakeLeader(member)}
                                                disabled={isLoading}
                                            >
                                                Make Leader
                                            </Button>
                                        )}
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    disabled={isLoading}
                                                >
                                                    Remove
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Remove Member?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will remove {member.name || "this member"} from
                                                        the team. They can rejoin if the team is not
                                                        completed.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleRemoveMember(member)}
                                                    >
                                                        Remove
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
