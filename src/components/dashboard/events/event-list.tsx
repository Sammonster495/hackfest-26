"use client";
import { Check, Edit2, MoreVertical, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  deleteEvent,
  type EventData,
  fetchAllEvents,
  updateEventStatus,
} from "./request";

async function getData(
  setLoading: (loading: boolean) => void,
  setEvents: (events: EventData[]) => void,
) {
  setLoading(true);
  const data = await fetchAllEvents();
  setEvents(data);
  setLoading(false);
}

export default function EventListTab({
  setTab,
}: {
  setTab: (tab: string) => void;
}) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventData | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    getData(setLoading, setEvents);
  }, []);

  useEffect(() => {
    if (!deleteDialogOpen) {
      setEventToDelete(null);
      setDeleteConfirmation("");
    }
  }, [deleteDialogOpen]);

  const handleEdit = (event: EventData) => {
    router.push(`/dashboard?id=${event.id}`);
    setTab("updateEvent");
  };

  const handleDeleteEvent = async () => {
    try {
      const result = await deleteEvent(eventToDelete?.id ?? "");
      if (result) {
        setEvents(events.filter((e) => e.id !== eventToDelete?.id));
      }
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleStatusChange = async () => {
    if (selectedEvent && newStatus) {
      try {
        const updatedEvent = await updateEventStatus(
          selectedEvent.id,
          newStatus,
        );

        if (!updatedEvent) {
          throw new Error("Failed to update event status");
        }

        setEvents(
          events.map((e) =>
            e.id === selectedEvent.id
              ? { ...e, status: newStatus as EventData["status"] }
              : e,
          ),
        );
        setStatusDialogOpen(false);
        setSelectedEvent(null);
        setNewStatus("");
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading events...</p>
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">No events found</p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Published":
        return "success";
      case "Ongoing":
        return "warning";
      case "Completed":
        return "secondary";
      case "Draft":
        return "outline";
      default:
        return "default";
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Card>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Title</TableHead>
                  <TableHead className="font-semibold">Type</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Deadline</TableHead>
                  <TableHead className="font-semibold">Venue</TableHead>
                  <TableHead className="font-semibold">Team Size</TableHead>
                  <TableHead className="font-semibold">Max Teams</TableHead>
                  <TableHead className="text-right font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow
                    key={event.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium max-w-xs truncate">
                      {event.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => {
                          setSelectedEvent(event);
                          setNewStatus(event.status);
                          setStatusDialogOpen(true);
                        }}
                        variant={"ghost"}
                      >
                        <Badge
                          variant={getStatusBadgeVariant(event.status)}
                          className="text-xs"
                        >
                          {event.status}
                        </Badge>
                      </Button>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(event.date)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(event.deadline)}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {event.venue}
                    </TableCell>
                    <TableCell className="text-sm">
                      {event.minTeamSize}-{event.maxTeamSize}
                    </TableCell>
                    <TableCell className="text-sm">{event.maxTeams}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(event)}
                          title="Edit event"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setSelectedEvent(event);
                            setNewStatus(event.status);
                            setStatusDialogOpen(true);
                          }}
                          title="Change status"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setEventToDelete(event);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete event"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Status update dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Event Status</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="title">
                  Event Title
                </label>
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.title}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="status">
                  New Status
                </label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Ongoing">Ongoing</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleStatusChange}>Change Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          {eventToDelete && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-foreground">
                    {eventToDelete.title}
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="delete-confirmation"
                >
                  Type{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs text-destructive">
                    delete {eventToDelete.title}
                  </code>{" "}
                  to confirm
                </label>
                <Input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="font-mono text-sm mt-4"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmation("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEvent}
              disabled={
                !eventToDelete ||
                deleteConfirmation !== `delete ${eventToDelete.title}`
              }
            >
              Delete Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
