"use client";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit2, Flag, GripVertical, Trash2 } from "lucide-react";
import type { Session } from "next-auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { hasPermission } from "~/lib/auth/permissions";
import {
  deleteEvent,
  type EventData,
  fetchAllEvents,
  reorderEvents,
  updateEventStatus,
} from "./request";

async function getData(
  setLoading: (loading: boolean) => void,
  setEvents: (events: EventData[]) => void,
  assigned: boolean,
) {
  setLoading(true);
  const data = await fetchAllEvents(assigned);
  setEvents(data);
  setLoading(false);
}

function SortableRow({
  event,
  children,
  canDrag,
}: {
  event: EventData;
  children: React.ReactNode;
  canDrag: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: event.id, disabled: !canDrag });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="hover:bg-muted/30 transition-colors"
    >
      {canDrag && (
        <TableCell className="w-8 px-2">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </TableCell>
      )}
      {children}
    </TableRow>
  );
}

export default function EventListTab({
  assigned = true,
  session,
  onEdit,
  onAttendance,
}: {
  assigned: boolean;
  session: Session;
  onEdit: (eventId: string) => void;
  onAttendance: (eventId: string) => void;
}) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<EventData | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const canDrag =
    hasPermission(session.dashboardUser, "event:update") && !assigned;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    getData(setLoading, setEvents, assigned);
  }, [assigned]);

  useEffect(() => {
    if (!deleteDialogOpen) {
      setEventToDelete(null);
      setDeleteConfirmation("");
    }
  }, [deleteDialogOpen]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = events.findIndex((e) => e.id === active.id);
    const newIndex = events.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...events];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    setEvents(reordered);

    const orderedIds = reordered.map((e) => e.id);
    const success = await reorderEvents(orderedIds);
    if (!success) {
      setEvents(events);
    } else {
      toast.success("Event order updated");
    }
  };

  const handleEdit = (event: EventData) => {
    onEdit(event.id);
  };

  const handleStatusEdit = (event: EventData) => {
    if (!hasPermission(session.dashboardUser, "event:update")) {
      return;
    }
    setSelectedEvent(event);
    setNewStatus(event.status);
    setStatusDialogOpen(true);
  };
  const handleAttendance = (event: EventData) => {
    onAttendance(event.id);
  };

  const handleDeleteEvent = async () => {
    try {
      const result = await deleteEvent(eventToDelete?.id ?? "");
      if (result) {
        setEvents(events.filter((e) => e.id !== eventToDelete?.id));
        toast.success("Event deleted successfully");
      }
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
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
        toast.success("Event status updated");
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {canDrag && <TableHead className="w-8 px-2" />}
                    <TableHead className="font-semibold">#</TableHead>
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
                <SortableContext
                  items={events.map((e) => e.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <TableBody>
                    {events.map((event, index) => (
                      <SortableRow
                        key={event.id}
                        event={event}
                        canDrag={canDrag}
                      >
                        <TableCell className="text-sm text-muted-foreground font-mono w-8">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium max-w-xs truncate">
                          {event.title}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {event.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getStatusBadgeVariant(event.status)}
                            className="text-xs cursor-pointer"
                            onClick={() => handleStatusEdit(event)}
                          >
                            {event.status}
                          </Badge>
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
                        <TableCell className="text-sm">
                          {event.maxTeams}
                        </TableCell>
                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant={"ghost"}
                              size="icon-sm"
                              onClick={() => handleAttendance(event)}
                              title="Mark attendance"
                              hidden={
                                !hasPermission(
                                  session.dashboardUser,
                                  "event:attendance",
                                ) ||
                                !["Ongoing", "Published"].includes(event.status)
                              }
                            >
                              <Flag />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleEdit(event)}
                              title="Edit event"
                              disabled={
                                !hasPermission(
                                  session.dashboardUser,
                                  "event:update",
                                )
                              }
                            >
                              <Edit2 className="h-4 w-4" />
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
                              disabled={
                                !hasPermission(
                                  session.dashboardUser,
                                  "event:delete",
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </SortableRow>
                    ))}
                  </TableBody>
                </SortableContext>
              </Table>
            </DndContext>
          </div>
        </CardContent>
      </Card>

      {/* Status update dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent className="font-sans">
          <DialogHeader>
            <DialogTitle className="font-sans">Change Event Status</DialogTitle>
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
                  <SelectContent className="font-sans">
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
        <DialogContent className="font-sans">
          <DialogHeader>
            <DialogTitle className="font-sans">Delete Event</DialogTitle>
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
                  className="font-crimson text-sm mt-4"
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
