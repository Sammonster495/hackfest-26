"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
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

  // Calculate progress percentage
  const progressPercentage = ((step + 1) / steps.length) * 100;

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
        className="relative flex min-h-screen flex-col items-center justify-center px-6 overflow-hidden bg-gradient-to-b from-[#10569c] via-[#61b2e4] to-[#eef7fb] text-white"
      >
        {/* --- TOP PROGRESS BAR --- */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-white/20 z-50">
          <div
            className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] transition-all duration-700 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* --- DECORATIVE ELEMENTS (The Beach) --- */}
        <div className="absolute -bottom-[5%] left-[-20%] w-[140%] h-[35vh] bg-[#fffac2]/40 rounded-[100%] blur-3xl z-0 pointer-events-none" />
        <div className="absolute -bottom-[12%] left-[-10%] w-[120%] h-[30vh] bg-[#fbf6db] rounded-[50%] shadow-[0_-10px_50px_rgba(240,230,180,0.8)] z-0 pointer-events-none" />
        {/* Step Counter Text */}
        <div className="absolute top-8 left-6 text-sm text-white/80 z-20 font-medium tracking-wide">
          STEP {step + 1} OF {steps.length}
        </div>

        {/* Form Container */}
        <div
          key={step}
          className="relative z-10 w-full max-w-xl space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500"
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

          {/* Navigation Buttons */}
          <div className="flex w-full items-center gap-3 pt-6">
            {/* BACK BUTTON - FRAMELESS GLASS */}
            {step > 0 && (
              <Button
                type="button"
                // Changed to 'ghost' to remove default borders
                variant="ghost"
                onClick={handleBack}
                className="
                  // Colors
                  bg-white/40                // Soft translucent white base
                  text-[#10569c]               // Deep blue text for contrast on both Sky & Sand
                  hover:bg-white/40            // Brightens on hover
                  
                  // Effects
                  backdrop-blur-md             // Glass effect
                  shadow-sm                    // Subtle depth
                  
                  // Layout & Typography
                  h-12 px-6 rounded-xl transition-all font-bold
                "
              >
                Back
              </Button>
            )}

            {/* CONTINUE / SUBMIT BUTTON */}
            <Button
              type={isLastStep ? "submit" : "button"}
              onClick={!isLastStep ? handleNext : undefined}
              disabled={form.formState.isSubmitting}
              className="
                flex-1 h-12 rounded-xl text-lg font-bold shadow-lg transition-all
                bg-white text-[#10569c] hover:bg-white/90 hover:scale-[1.01] active:scale-[0.99]
                disabled:opacity-70 disabled:pointer-events-none
              "
            >
              {form.formState.isSubmitting ? (
                "Submitting..."
              ) : isLastStep ? (
                <>
                  Submit <ArrowRight className="ml-2 w-5 h-5" />
                </>
              ) : (
                <>
                  Continue <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
