"use client";
import { format } from "date-fns";
import { AlertCircle, CalendarIcon, Edit, Eye, Loader2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import z from "zod";
import { Alert, AlertDescription } from "~/components/ui/alert";
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
import { createEvent } from "./request";

const STORAGE_KEY = "create-event-draft";

function getDraft(): z.infer<typeof eventSchema> | null {
  try {
    const draft = localStorage.getItem(STORAGE_KEY);
    if (draft) {
      const parsedDraft = JSON.parse(draft);
      if (parsedDraft.date) parsedDraft.date = new Date(parsedDraft.date);
      if (parsedDraft.deadline)
        parsedDraft.deadline = new Date(parsedDraft.deadline);
      return parsedDraft;
    }
  } catch (error) {
    console.error("Error loading draft:", error);
  }
  return null;
}

function resetForm(
  setForm: React.Dispatch<React.SetStateAction<z.infer<typeof eventSchema>>>,
) {
  setForm({
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
}

export default function CreateEventTab({
  setTab,
}: {
  setTab: (tab: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [formData, setFormData] = useState<z.infer<typeof eventSchema>>(
    getDraft() ?? {
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
    },
  );

  // Load draft on mount unless formData already has values (e.g. from previous session)
  useEffect(() => {
    const draft = getDraft();
    if (
      draft &&
      JSON.stringify(draft) !==
        JSON.stringify({
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
        })
    ) {
      setHasDraft(true);
      setFormData(draft);
    }
  }, []);

  // Save draft to localStorage on formData change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  }, [formData]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHasDraft(false);
    } catch (error) {
      console.error("Error clearing draft:", error);
    }
  };

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

      const result = await createEvent(data.data);
      setLoading(false);
      if (!result) {
        return;
      }
      clearDraft();
      resetForm(setFormData);
      setTab("eventList");
    } catch (error) {
      console.error("Error creating event:", error);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
        <CardDescription>
          Fill in the details below to create a new event
        </CardDescription>
        {hasDraft && (
          <Alert className="mt-4 bg-amber-50 dark:bg-amber-950">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes that have been automatically saved as a
              draft.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Basic Information */}
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
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setTab("eventList")}
              disabled={loading}
            >
              Cancel
            </Button>
            {hasDraft && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (confirm("Are you sure you want to discard your draft?")) {
                    clearDraft();
                    setFormData({
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
                  }
                }}
                disabled={loading}
              >
                Discard Draft
              </Button>
            )}
          </div>
          <Button type="submit" disabled={loading || !isFormValid()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Event
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function EventDescription({
  formData,
  handleInputChange,
}: {
  formData: z.infer<typeof eventSchema>;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}) {
  const [descriptionMode, setDescriptionMode] = useState<"edit" | "preview">(
    "edit",
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <Tabs
          value={descriptionMode}
          onValueChange={(v) => setDescriptionMode(v as "edit" | "preview")}
          className="w-auto"
        >
          <TabsList className="h-8">
            <TabsTrigger value="edit" className="text-xs h-7 px-3">
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-xs h-7 px-3">
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {descriptionMode === "edit" ? (
        <Textarea
          id="description"
          name="description"
          placeholder="Enter event description in Markdown format"
          value={formData.description}
          onChange={handleInputChange}
          rows={8}
          className="font-mono text-sm"
          required
        />
      ) : (
        <div className="min-h-50 rounded-md border border-input bg-muted/30 p-4">
          {formData.description ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{formData.description}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              No description provided. Switch to Edit mode to add content.
            </p>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Supports Markdown formatting (headings, lists, bold, italic, links,
        etc.)
      </p>
    </div>
  );
}
