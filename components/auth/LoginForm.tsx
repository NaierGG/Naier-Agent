"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
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
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClientComponentClient } from "@/lib/supabase/client";
import { getAppUrl } from "@/lib/supabase/config";
import { cn } from "@/lib/utils/cn";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "\uC774\uBA54\uC77C\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694.")
    .email("\uC62C\uBC14\uB978 \uC774\uBA54\uC77C \uD615\uC2DD\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694."),
  password: z
    .string()
    .min(1, "\uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574\uC8FC\uC138\uC694.")
});

type LoginFormValues = z.infer<typeof loginSchema>;

function mapAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("email not confirmed")
  ) {
    return "\uC774\uBA54\uC77C \uB610\uB294 \uBE44\uBC00\uBC88\uD638\uB97C \uD655\uC778\uD574\uC8FC\uC138\uC694.";
  }

  if (normalized.includes("network")) {
    return "\uB124\uD2B8\uC6CC\uD06C \uC5F0\uACB0\uC744 \uD655\uC778\uD55C \uB4A4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.";
  }

  return "\uB85C\uADF8\uC778\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694.";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const callbackMessage = useMemo(
    () => searchParams.get("error") || searchParams.get("message"),
    [searchParams]
  );

  const nextPath = searchParams.get("next") || "/dashboard";

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: ""
    }
  });

  async function handleEmailLogin(values: LoginFormValues) {
    setSubmitError(null);
    const supabase = createClientComponentClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password
    });

    if (error) {
      setSubmitError(mapAuthError(error.message));
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  async function handleGoogleLogin() {
    setSubmitError(null);
    setIsGoogleLoading(true);
    const supabase = createClientComponentClient();

    const origin =
      typeof window !== "undefined" ? window.location.origin : getAppUrl();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/api/auth/callback?next=${encodeURIComponent(nextPath)}`
      }
    });

    if (error) {
      setSubmitError(
        "\uAD6C\uAE00 \uB85C\uADF8\uC778\uC744 \uC2DC\uC791\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4. \uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694."
      );
      setIsGoogleLoading(false);
    }
  }

  return (
    <Card className="border-white/10 bg-[#111111]">
      <CardHeader className="pb-6">
        <CardTitle>{"\uB85C\uADF8\uC778"}</CardTitle>
        <CardDescription>
          {
            "\uC8FC\uC2DD \uC790\uB3D9\uD654\uB97C \uB2E4\uC2DC \uC774\uC5B4\uC11C \uC2E4\uD589\uD574\uBCF4\uC138\uC694."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {callbackMessage ? (
          <Alert variant={searchParams.get("error") ? "destructive" : "success"}>
            <AlertTitle>
              {searchParams.get("error")
                ? "\uB85C\uADF8\uC778 \uC548\uB0B4"
                : "\uC54C\uB9BC"}
            </AlertTitle>
            <AlertDescription>{callbackMessage}</AlertDescription>
          </Alert>
        ) : null}

        {submitError ? (
          <Alert variant="destructive">
            <AlertTitle>{"\uB85C\uADF8\uC778 \uC624\uB958"}</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(handleEmailLogin)}
          noValidate
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
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

          <div className="space-y-2">
            <Label htmlFor="password">
              {"\uBE44\uBC00\uBC88\uD638"}
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="********"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="text-sm text-red-300">
                {form.formState.errors.password.message}
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
                {"\uB85C\uADF8\uC778 \uC911..."}
              </>
            ) : (
              <>
                {"\uC774\uBA54\uC77C\uB85C \uB85C\uADF8\uC778"}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">
              {"\uC18C\uC15C \uB85C\uADF8\uC778"}
            </p>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                {"\uAD6C\uAE00 \uC5F0\uACB0 \uC911..."}
              </>
            ) : (
              "\uAD6C\uAE00\uB85C \uACC4\uC18D\uD558\uAE30"
            )}
          </Button>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {"\uACC4\uC815\uC774 \uC5C6\uC73C\uC2E0\uAC00\uC694?"}{" "}
            <Link
              href="/signup"
              className={cn(
                "font-medium text-[#7ef5da] hover:text-[#00d4aa]",
                "transition"
              )}
            >
              {"\uD68C\uC6D0\uAC00\uC785"}
            </Link>
          </p>
          <Link
            href="/signup"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "justify-start px-0 text-[#7ef5da] hover:bg-transparent"
            })}
          >
            {"\uCC98\uC74C \uC0AC\uC6A9\uD558\uB294 \uACBD\uC6B0 \uAC00\uC785\uD558\uAE30"}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
