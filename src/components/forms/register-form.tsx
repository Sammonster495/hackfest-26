"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CloudinaryUpload } from "~/components/cloudinary-upload";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { courseEnum, genderEnum, stateEnum } from "~/db/enum";
import { apiFetch } from "~/lib/fetcher";
import {
  type RegisterUserInput,
  registerUserSchema,
} from "~/lib/validation/user";

interface College {
  id: string;
  name: string | null;
  state: string | null;
}

interface RegisterFormProps {
  initialGithubUsername?: string;
}

export function RegisterForm({ initialGithubUsername }: RegisterFormProps) {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(true);

  const form = useForm<RegisterUserInput>({
    // @ts-expect-error - Type conflict between react-hook-form type definitions
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      name: "",
      phone: "",
      state: undefined,
      course: undefined,
      gender: undefined,
      collegeId: undefined,
      github: initialGithubUsername,
      idProof: undefined,
    },
  });

  // Update form when initialGithubUsername is available
  useEffect(() => {
    if (initialGithubUsername && !form.getValues("github")) {
      form.setValue("github", initialGithubUsername);
    }
  }, [initialGithubUsername, form]);

  useEffect(() => {
    async function loadColleges() {
      try {
        const result = await apiFetch<{ colleges: College[] }>(
          "/api/colleges/list",
        );
        setColleges(result?.colleges || []);
      } finally {
        setLoadingColleges(false);
      }
    }
    loadColleges();
  }, []);

  async function onSubmit(data: RegisterUserInput) {
    const submitData = {
      name: data.name.trim(),
      phone: data.phone.trim(),
      state: data.state,
      course: data.course,
      gender: data.gender,
      collegeId: data.collegeId,
      github: data.github?.trim() || undefined,
      idProof: data.idProof,
    };

    await apiFetch("/api/users/register", {
      method: "POST",
      body: JSON.stringify(submitData),
    });
    router.push("/teams");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form
        // @ts-expect-error - Type conflict between react-hook-form type definitions
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          const firstError = Object.values(errors)[0];
          const errorMessage =
            firstError?.message ||
            "Please fill in all required fields correctly.";
          toast.error("Validation Error", {
            description: errorMessage,
          });
        })}
        className="space-y-4"
      >
        <FormField
          // @ts-expect-error - Type conflict between react-hook-form type definitions
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter your name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-expect-error - Type conflict between react-hook-form type definitions
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone *</FormLabel>
              <FormControl>
                <Input placeholder="Enter your phone number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-expect-error - Type conflict between react-hook-form type definitions
          control={form.control}
          name="state"
          render={({ field }) => (
            <FormItem>
              <FormLabel>State *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your state" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {stateEnum.enumValues.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-expect-error - Type conflict between react-hook-form type definitions
          control={form.control}
          name="course"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your course" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {courseEnum.enumValues.map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-expect-error - Type conflict between react-hook-form type definitions
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {genderEnum.enumValues.map((gender) => (
                    <SelectItem key={gender} value={gender}>
                      {gender}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-expect-error - Type conflict between react-hook-form type definitions
          control={form.control}
          name="collegeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>College *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || undefined}
                disabled={loadingColleges}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingColleges
                          ? "Loading colleges..."
                          : "Select your college"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {colleges.map((college) => (
                    <SelectItem key={college.id} value={college.id}>
                      {college.name || "Unnamed College"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          // @ts-expect-error - Type conflict between react-hook-form type definitions
          control={form.control}
          name="github"
          render={({ field }) => (
            <FormItem>
              <FormLabel>GitHub Username</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="username"
                  {...field}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                  value={field.value || initialGithubUsername || ""}
                />
              </FormControl>
              <FormMessage />
              {initialGithubUsername && (
                <p className="text-xs text-muted-foreground">
                  Automatically fetched from your GitHub account
                </p>
              )}
            </FormItem>
          )}
        />

        <FormField
          // @ts-expect-error - Type conflict between react-hook-form type definitions
          control={form.control}
          name="idProof"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ID Proof *</FormLabel>
              <FormControl>
                {field.value ? (
                  <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border">
                    <Image
                      src={field.value}
                      alt="ID Proof"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute right-2 top-2"
                      onClick={() => field.onChange(undefined)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <CloudinaryUpload
                    onUpload={field.onChange}
                    allowedFormats={["png", "jpg", "jpeg"]}
                    maxFileSize={1024 * 1024}
                    label="Upload ID Proof (Max 1MB)"
                    folder="idProof"
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Registering..." : "Register"}
        </Button>
      </form>
    </Form>
  );
}
