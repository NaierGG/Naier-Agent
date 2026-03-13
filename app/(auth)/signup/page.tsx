import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Create Account"
      title={
        "\uD55C\uAD6D \uAC1C\uC778 \uD22C\uC790\uC790\uB97C \uC704\uD55C \uC790\uB3D9\uD654 \uD2B8\uB808\uC774\uB529 \uC791\uC5C5\uC2E4"
      }
      description={
        "\uACC4\uC815\uC744 \uB9CC\uB4E4\uACE0 DART, \uB274\uC2A4, AI \uC694\uC57D, \uD154\uB808\uADF8\uB7A8 \uC54C\uB9BC\uC744 \uD558\uB098\uC758 \uC6CC\uD06C\uD50C\uB85C\uC6B0\uB85C \uC5F0\uACB0\uD574\uBCF4\uC138\uC694."
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
