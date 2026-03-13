import { ChatToWorkflow } from "@/components/ai/ChatToWorkflow";

export default function NewWorkflowPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-mono text-3xl font-semibold">새 워크플로우</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          AI 대화형 워크플로우 생성 화면이 여기에 들어옵니다.
        </p>
      </div>
      <ChatToWorkflow />
    </section>
  );
}
