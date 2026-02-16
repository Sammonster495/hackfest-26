"use client";
import { format } from "date-fns";
import { AlertCircle, CalendarIcon, Edit, Eye, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import z from "zod";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import { eventSchema } from "~/lib/validation/event";
import { EventDescription } from "./create-event";
import { getEventById, updateEvent } from "./request";

export default function UpdateEventTab({
  setTab,
}: {
  setTab: (tab: string) => void;
}) {
  const params = useSearchParams();
  const eventId = params.get("id");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState<z.infer<typeof eventSchema>>({
    title: "",
    description: "",
    date: undefined,
    venue: "",
    deadline: undefined,
    image: "",
    type: "Solo",
    status: "Draft",
    maxTeams: 0,
    minTeamSize: 1,
    maxTeamSize: 1,
  });

  useEffect(() => {
    if (!eventId) {
      setFetching(false);
      return;
    }

    const fetchEvent = async () => {
      setFetching(true);
      try {
        const event = await getEventById(eventId);
        if (event) {
          setFormData({
            title: event.title,
            description: event.description,
            date: new Date(event.date),
            venue: event.venue,
            deadline: new Date(event.deadline),
            image: event.image,
            type: event.type,
            status: event.status,
            maxTeams: event.maxTeams,
            minTeamSize: event.minTeamSize,
            maxTeamSize: event.maxTeamSize,
          });
        } else {
          toast.error("Event not found");
          setTab("eventList");
        }
      } catch (error) {
        console.error("Error fetching event:", error);
        toast.error("Failed to load event");
        setTab("eventList");
      } finally {
        setFetching(false);
      }
    };

    fetchEvent();
  }, [eventId, setTab]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: parseInt(value, 10) || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!eventId) {
      toast.error("Event ID is missing. Cannot update event.");
      setLoading(false);
      return;
    }

    try {
      const data = eventSchema.safeParse({
        ...formData,
        date: formData.date ? new Date(formData.date) : new Date(),
        deadline: formData.deadline ? new Date(formData.deadline) : new Date(),
      });

      if (!data.success) {
        console.error("Validation errors:", z.treeifyError(data.error));
        toast.error("Failed to parse form data. Please check your inputs.");
        setLoading(false);
        return;
      }

      const response = await updateEvent(eventId, data.data);

      if (response) {
        setTab("eventList");
      }
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.title.trim() !== "" &&
      formData.description.trim() !== "" &&
      formData.venue.trim() !== "" &&
      formData.image.trim() !== "" &&
      formData.date !== undefined &&
      formData.deadline !== undefined &&
      formData.maxTeams > 0 &&
      formData.minTeamSize > 0 &&
      formData.maxTeamSize >= formData.minTeamSize
    );
  };

  if (!eventId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Event ID is required to update an event.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (fetching) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-muted-foreground">Loading event...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Event</CardTitle>
        <CardDescription>
          Update the event details below{" "}
          <Badge variant={"warning"}>Changes wont be drafted</Badge>
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Event Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter event title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <EventDescription
              formData={formData}
              handleInputChange={handleInputChange}
            />

            <div className="space-y-2">
              <Label htmlFor="venue">
                Venue <span className="text-destructive">*</span>
              </Label>
              <Input
                id="venue"
                name="venue"
                placeholder="Enter event venue"
                value={formData.venue}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">
                Image URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="image"
                name="image"
                type="url"
                placeholder="Enter image URL"
                value={formData.image}
                onChange={handleInputChange}
                required
              />
              {formData.image && (
                <div className="relative mt-2 flex justify-center rounded-md border overflow-hidden">
                  <img
                    src={formData.image}
                    alt="Event preview"
                    className="w-auto h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Event Date <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? (
                      format(formData.date, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={(date) =>
                      setFormData((prev) => ({ ...prev, date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>
                Registration Deadline{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.deadline && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.deadline ? (
                      format(formData.deadline, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.deadline}
                    onSelect={(date) =>
                      setFormData((prev) => ({ ...prev, deadline: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Event Type and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">
                Event Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: "Solo" | "Team") =>
                  setFormData((prev) => ({
                    ...prev,
                    type: value,
                    minTeamSize: value === "Solo" ? 1 : prev.minTeamSize,
                    maxTeamSize: value === "Solo" ? 1 : prev.maxTeamSize,
                  }))
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Solo">Solo</SelectItem>
                  <SelectItem value="Team">Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(
                  value: "Draft" | "Published" | "Ongoing" | "Completed",
                ) => setFormData((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="status">
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

          {/* Team Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxTeams">
                Maximum Teams <span className="text-destructive">*</span>
              </Label>
              <Input
                id="maxTeams"
                name="maxTeams"
                type="number"
                min="0"
                placeholder="Enter maximum number of teams"
                value={formData.maxTeams || ""}
                onChange={handleNumberChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minTeamSize">
                  Minimum Team Size <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="minTeamSize"
                  name="minTeamSize"
                  type="number"
                  min="1"
                  placeholder="Min team size"
                  value={formData.minTeamSize || ""}
                  onChange={handleNumberChange}
                  disabled={formData.type === "Solo"}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTeamSize">
                  Maximum Team Size <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="maxTeamSize"
                  name="maxTeamSize"
                  type="number"
                  min={formData.minTeamSize}
                  placeholder="Max team size"
                  value={formData.maxTeamSize || ""}
                  onChange={handleNumberChange}
                  disabled={formData.type === "Solo"}
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between gap-2 mt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setTab("eventList")}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !isFormValid()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Event
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
