import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Create Account"
      title="자동화와 에이전트를 함께 만드는 작업공간"
      description="계정을 만들고 웹훅, HTTP, AI, 메시징 액션을 하나의 워크플로우로 연결해보세요."
    >
      <SignupForm />
    </AuthShell>
  );
}
