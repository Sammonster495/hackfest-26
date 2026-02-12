"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CollegeStep } from "~/components/forms/register-steps/CollegeStep";
import { CourseStep } from "~/components/forms/register-steps/CourseStep";
import { GenderStep } from "~/components/forms/register-steps/GenderStep";
import { GithubStep } from "~/components/forms/register-steps/GithubStep";
import { IdProofStep } from "~/components/forms/register-steps/IdProofStep";
import { NameStep } from "~/components/forms/register-steps/NameStep";
import { PhoneStep } from "~/components/forms/register-steps/PhoneStep";
import { StateStep } from "~/components/forms/register-steps/StateStep";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import { apiFetch } from "~/lib/fetcher";
import {
  type RegisterParticipantInput,
  registerParticipantSchema,
} from "~/lib/validation/participant";

interface College {
  id: string;
  name: string | null;
  state: string | null;
}

interface RegisterFormProps {
  initialGithubUsername?: string;
}

type FormValues = RegisterParticipantInput;

export function RegisterForm({ initialGithubUsername }: RegisterFormProps) {
  const router = useRouter();

  const [colleges, setColleges] = useState<College[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(true);
  const [step, setStep] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(registerParticipantSchema) as any,
    defaultValues: {
      name: "",
      phone: "",
      state: undefined,
      course: undefined,
      gender: undefined,
      collegeId: "",
      github: initialGithubUsername ?? undefined,
      idProof: undefined,
    },
  });

  const steps = [
    "name",
    "phone",
    "state",
    "course",
    "gender",
    "collegeId",
    "github",
    "idProof",
  ] as const;

  const currentField = steps[step];
  const isLastStep = step === steps.length - 1;

  async function handleNext(): Promise<void> {
    const valid = await form.trigger(currentField);
    if (!valid) return;
    if (!isLastStep) setStep((s) => s + 1);
  }

  function handleBack(): void {
    if (step > 0) setStep((s) => s - 1);
  }

  useEffect(() => {
    async function loadColleges(): Promise<void> {
      try {
        const result = await apiFetch<{ colleges: College[] }>(
          "/api/colleges/list",
        );
        setColleges(result?.colleges ?? []);
      } finally {
        setLoadingColleges(false);
      }
    }
    loadColleges();
  }, []);

  async function onSubmit(data: RegisterParticipantInput): Promise<void> {
    await apiFetch("/api/users/register", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        name: data.name.trim(),
        phone: data.phone.trim(),
        github: data.github?.trim() || undefined,
      }),
    });

    router.push("/teams");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          const firstError = Object.values(errors)[0];
          toast.error("Validation Error", {
            description:
              firstError?.message ??
              "Please fill in all required fields correctly.",
          });
        })}
        // CHANGE 1: Added background image and white text base
        className="relative flex min-h-screen flex-col items-center justify-center px-6 bg-[url('/sunny.jpeg')] bg-cover bg-center bg-no-repeat text-white"
      >
        {/* CHANGE 2: Dark overlay to ensure text readability & slight blur for depth */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0" />

        {/* Progress Indicator - Updated z-index and color */}
        <div className="absolute top-6 left-6 text-sm text-white/60 z-10 font-medium">
          {step + 1} / {steps.length}
        </div>

        {/* CHANGE 3: The "Glass" Card Container */}
        <div
          key={step}
          className="relative z-10 w-full max-w-2xl space-y-10 p-10 rounded-3xl bg-white/10 border border-white/10 backdrop-blur-md shadow-2xl text-center animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {/* NAME */}
          {currentField === "name" && (
            <NameStep form={form} onNext={handleNext} onBack={handleBack} />
          )}

          {/* PHONE */}
          {currentField === "phone" && (
            <PhoneStep form={form} onNext={handleNext} onBack={handleBack} />
          )}

          {/* STATE */}
          {currentField === "state" && (
            <StateStep form={form} onNext={handleNext} onBack={handleBack} />
          )}

          {/* COURSE */}
          {currentField === "course" && (
            <CourseStep form={form} onNext={handleNext} onBack={handleBack} />
          )}

          {/* GENDER */}
          {currentField === "gender" && (
            <GenderStep form={form} onNext={handleNext} onBack={handleBack} />
          )}

          {/* COLLEGE */}
          {currentField === "collegeId" && (
            <CollegeStep
              form={form}
              onNext={handleNext}
              onBack={handleBack}
              colleges={colleges}
              loadingColleges={loadingColleges}
            />
          )}

          {/* GITHUB */}
          {currentField === "github" && (
            <GithubStep
              form={form}
              onNext={handleNext}
              onBack={handleBack}
              initialGithubUsername={initialGithubUsername}
            />
          )}

          {/* ID PROOF */}
          {currentField === "idProof" && (
            <IdProofStep form={form} onNext={handleNext} onBack={handleBack} />
          )}

          {/* Navigation */}
          <div className="flex justify-center gap-4 pt-4">
            {step > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                className="text-white hover:bg-white/20 hover:text-white"
              >
                Back
              </Button>
            )}

            {!isLastStep ? (
              <Button
                type="button"
                onClick={handleNext}
                className="bg-white text-black hover:bg-white/90 transition-all"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-white text-black hover:bg-white/90 transition-all"
              >
                {form.formState.isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
