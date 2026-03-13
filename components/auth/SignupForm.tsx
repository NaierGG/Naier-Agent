"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClientComponentClient } from "@/lib/supabase/client";
import { getAppUrl } from "@/lib/supabase/config";

const signupSchema = z
  .object({
    displayName: z
      .string()
      .min(2, "\uD45C\uC2DC \uC774\uB984\uC740 2\uC790 \uC774\uC0C1 \uC785\uB825\uD574\uC8FC\uC138\uC694.")
      .max(30, "\uD45C\uC2DC \uC774\uB984\uC740 30\uC790 \uC774\uD558\uB85C \uC785\uB825\uD574\uC8FC\uC138\uC694."),
    email: z
      .string()
      .min(1, "\uC774\uBA54\uC77C\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.")
      .email("\uC62C\uBC14\uB978 \uC774\uBA54\uC77C \uD615\uC2DD\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694."),
    password: z
      .string()
      .min(8, "\uBE44\uBC00\uBC88\uD638\uB294 8\uC790 \uC774\uC0C1\uC73C\uB85C \uC124\uC815\uD574\uC8FC\uC138\uC694."),
    confirmPassword: z
      .string()
      .min(1, "\uBE44\uBC00\uBC88\uD638 \uD655\uC778\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694."),
    terms: z.boolean().refine((value) => value, {
      message: "\uC11C\uBE44\uC2A4 \uC774\uC6A9 \uC548\uB0B4\uC5D0 \uB3D9\uC758\uD574\uC8FC\uC138\uC694."
    })
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "\uBE44\uBC00\uBC88\uD638\uAC00 \uC77C\uCE58\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    path: ["confirmPassword"]
  });

type SignupFormValues = z.infer<typeof signupSchema>;

function mapSignupError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("already registered")) {
    return "\uC774\uBBF8 \uAC00\uC785\uB41C \uC774\uBA54\uC77C\uC785\uB2C8\uB2E4.";
  }

  return "\uD68C\uC6D0\uAC00\uC785\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.";
}

export function SignupForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false
    }
  });

  async function handleSignup(values: SignupFormValues) {
    setSubmitError(null);
    setSuccessMessage(null);
    const supabase = createClientComponentClient();

    const origin =
      typeof window !== "undefined" ? window.location.origin : getAppUrl();

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          display_name: values.displayName
        },
        emailRedirectTo: `${origin}/api/auth/callback?next=%2Fdashboard`
      }
    });

    if (error) {
      setSubmitError(mapSignupError(error.message));
      return;
    }

    setSuccessMessage(
      "\uC778\uC99D \uBA54\uC77C\uC744 \uBCF4\uB0C8\uC2B5\uB2C8\uB2E4. \uBA54\uC77C\uC744 \uD655\uC778\uD55C \uB4A4 \uB85C\uADF8\uC778\uD574\uC8FC\uC138\uC694."
    );
    form.reset();
  }

  return (
    <Card className="border-white/10 bg-[#111111]">
      <CardHeader className="pb-6">
        <CardTitle>{"\uD68C\uC6D0\uAC00\uC785"}</CardTitle>
        <CardDescription>
          {
            "\uBCF8\uC778 \uD0A4\uB85C \uC2E4\uD589\uB418\uB294 \uC8FC\uC2DD \uC790\uB3D9\uD654 \uC6CC\uD06C\uD50C\uB85C\uC6B0\uB97C \uC9C0\uAE08 \uC2DC\uC791\uD574\uBCF4\uC138\uC694."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {submitError ? (
          <Alert variant="destructive">
            <AlertTitle>{"\uD68C\uC6D0\uAC00\uC785 \uC624\uB958"}</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        {successMessage ? (
          <Alert variant="success">
            <AlertTitle>{"\uC774\uBA54\uC77C \uC778\uC99D \uC548\uB0B4"}</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(handleSignup)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="displayName">
              {"\uD45C\uC2DC \uC774\uB984"}
            </Label>
            <Input
              id="displayName"
              placeholder="StockFlow Trader"
              {...form.register("displayName")}
            />
            {form.formState.errors.displayName ? (
              <p className="text-sm text-red-300">
                {form.formState.errors.displayName.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signupEmail">Email</Label>
            <Input
              id="signupEmail"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-sm text-red-300">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">
                {"\uBE44\uBC00\uBC88\uD638"}
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="********"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-sm text-red-300">
                  {form.formState.errors.password.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {"\uBE44\uBC00\uBC88\uD638 \uD655\uC778"}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="********"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword ? (
                <p className="text-sm text-red-300">
                  {form.formState.errors.confirmPassword.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <label className="flex items-start gap-3 text-sm text-zinc-300">
              <Checkbox className="mt-1" {...form.register("terms")} />
              <span>
                {
                  "\uC11C\uBE44\uC2A4 \uC774\uC6A9 \uC548\uB0B4\uC640 \uAC04\uB2E8\uD55C \uAC1C\uC778\uC815\uBCF4 \uCC98\uB9AC \uBC29\uC2DD\uC5D0 \uB3D9\uC758\uD569\uB2C8\uB2E4."
                }
              </span>
            </label>
            {form.formState.errors.terms ? (
              <p className="mt-2 text-sm text-red-300">
                {form.formState.errors.terms.message}
              </p>
            ) : null}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                {"\uACC4\uC815 \uC0DD\uC131 \uC911..."}
              </>
            ) : (
              <>
                {"\uBB34\uB8CC\uB85C \uC2DC\uC791\uD558\uAE30"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <p className="border-t border-white/10 pt-5 text-sm text-zinc-400">
          {"\uC774\uBBF8 \uACC4\uC815\uC774 \uC788\uC73C\uC2E0\uAC00\uC694?"}{" "}
          <Link className="font-medium text-[#7ef5da]" href="/login">
            {"\uB85C\uADF8\uC778"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
