import { NodeEditor } from "@/components/workflow/NodeEditor";

export default function WorkflowDetailPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="font-mono text-3xl font-semibold">워크플로우 상세</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          노드 에디터와 워크플로우 상세 정보가 여기에 표시됩니다.
        </p>
      </div>
      <NodeEditor />
    </section>
  );
}
