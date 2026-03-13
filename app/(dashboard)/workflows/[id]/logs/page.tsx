import { ExecutionLog } from "@/components/workflow/ExecutionLog";

export default function WorkflowLogsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-mono text-3xl font-semibold">실행 로그</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          워크플로우 실행 이력이 여기에 표시됩니다.
        </p>
      </div>
      <ExecutionLog />
    </section>
  );
}
