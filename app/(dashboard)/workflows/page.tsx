import { WorkflowList } from "@/components/workflow/WorkflowList";

export default function WorkflowsPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-mono text-3xl font-semibold">워크플로우</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          생성된 자동화 워크플로우 목록이 여기에 표시됩니다.
        </p>
      </div>
      <WorkflowList />
    </section>
  );
}
