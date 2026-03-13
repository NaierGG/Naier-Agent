"use client";

import Link from "next/link";
import {
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent
} from "react";
import { useRouter } from "next/navigation";
import {
  Cable,
  Copy,
  FileText,
  GripVertical,
  LayoutGrid,
  LoaderCircle,
  Play,
  Power,
  Save,
  Sparkles,
  Trash2,
  Webhook
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NodeCard } from "@/components/workflow/NodeCard";
import { getNodeDefinition, getNodesByCategory } from "@/lib/nodes/registry";
import { cn } from "@/lib/utils/cn";
import {
  formatDateTime,
  formatRelativeTime,
  formatWorkflowTrigger
} from "@/lib/utils/format";
import type {
  NodeCategory,
  NodeConfigField,
  Workflow,
  WorkflowEdge,
  WorkflowNode
} from "@/types";

const NODE_WIDTH = 224;
const NODE_HEIGHT = 116;
const GRID = 20;
const CATEGORY_ORDER: NodeCategory[] = ["trigger", "source", "filter", "ai", "action"];

type NodeTestResult = {
  input: unknown;
  output?: unknown;
  error?: string;
  testedAt: string;
};

type NoticeState = {
  type: "success" | "error";
  message: string;
} | null;

type PendingAction = "execute" | "toggle" | "delete" | "save" | null;

type DragState = {
  nodeId: string;
  offsetX: number;
  offsetY: number;
  maxX: number;
  maxY: number;
} | null;

function snap(value: number) {
  return Math.round(value / GRID) * GRID;
}

function sortNodes(nodes: WorkflowNode[]) {
  return [...nodes].sort((left, right) =>
    left.position.x === right.position.x
      ? left.position.y - right.position.y
      : left.position.x - right.position.x
  );
}

function createNodeId() {
  return `node_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function createEdgeId(source: string, target: string) {
  return `edge_${source}_${target}_${Math.random().toString(36).slice(2, 6)}`;
}

function getErrorMessage(result: any, fallbackMessage: string) {
  if (result && typeof result.message === "string" && result.message.trim()) {
    return result.message;
  }

  if (result && typeof result.error === "string" && result.error.trim()) {
    return result.error;
  }

  return fallbackMessage;
}

function getDefaultFieldValue(field: NodeConfigField) {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  if (field.multiple) {
    return [];
  }

  if (field.type === "boolean") {
    return false;
  }

  return "";
}

function getDefaultNodeConfig(type: WorkflowNode["type"]) {
  const definition = getNodeDefinition(type);

  return Object.fromEntries(
    definition.configSchema.map((field) => [field.key, getDefaultFieldValue(field)])
  );
}

function getCanvasSize(nodes: WorkflowNode[]) {
  const maxX = nodes.reduce((largest, node) => Math.max(largest, node.position.x), 80);
  const maxY = nodes.reduce((largest, node) => Math.max(largest, node.position.y), 80);

  return {
    width: Math.max(980, maxX + NODE_WIDTH + 120),
    height: Math.max(560, maxY + NODE_HEIGHT + 120)
  };
}

function buildEdgePath(source: WorkflowNode, target: WorkflowNode) {
  const sourceX = source.position.x + NODE_WIDTH;
  const sourceY = source.position.y + NODE_HEIGHT / 2;
  const targetX = target.position.x;
  const targetY = target.position.y + NODE_HEIGHT / 2;
  const offset = Math.max(80, Math.abs(targetX - sourceX) * 0.4);

  return `M ${sourceX} ${sourceY} C ${sourceX + offset} ${sourceY}, ${targetX - offset} ${targetY}, ${targetX} ${targetY}`;
}

function summarizeNode(node: WorkflowNode) {
  return Object.entries(node.config || {})
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .slice(0, 2)
    .map(([key, value]) =>
      Array.isArray(value) ? `${key}: ${value.join(", ")}` : `${key}: ${String(value)}`
    );
}

function getWebhookNode(workflow: Workflow) {
  return workflow.nodes.find((node) => node.type === "trigger_webhook") || null;
}

function syncWorkflowSchedule(workflow: Workflow) {
  const triggerNode = workflow.nodes.find((node) => node.type.startsWith("trigger_"));

  if (triggerNode?.type === "trigger_schedule") {
    const cronExpression = String(triggerNode.config?.cron_expression || "").trim();

    return {
      ...workflow,
      schedule_cron: cronExpression || null
    };
  }

  return {
    ...workflow,
    schedule_cron: null
  };
}

function getCategoryLabel(category: NodeCategory) {
  switch (category) {
    case "trigger":
      return "트리거";
    case "source":
      return "데이터";
    case "filter":
      return "가공";
    case "ai":
      return "AI";
    case "action":
      return "액션";
    default:
      return category;
  }
}

function hasPath(
  edges: WorkflowEdge[],
  start: string,
  target: string,
  visited = new Set<string>()
): boolean {
  if (start === target) {
    return true;
  }

  if (visited.has(start)) {
    return false;
  }

  visited.add(start);

  return edges
    .filter((edge) => edge.source === start)
    .some((edge) => hasPath(edges, edge.target, target, visited));
}

function wouldCreateCycle(edges: WorkflowEdge[], source: string, target: string) {
  if (source === target) {
    return true;
  }

  return hasPath(edges, target, source);
}

export function NodeEditor({ workflow }: { workflow: Workflow }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState>(null);

  const [draftWorkflow, setDraftWorkflow] = useState(() => syncWorkflowSchedule(workflow));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    workflow.nodes[0]?.id ?? null
  );
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [testingNodeId, setTestingNodeId] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [testResults, setTestResults] = useState<Record<string, NodeTestResult>>({});
  const [isDirty, setIsDirty] = useState(false);

  const canvasSize = useMemo(() => getCanvasSize(draftWorkflow.nodes), [draftWorkflow.nodes]);
  const nodeMap = useMemo(
    () => new Map(draftWorkflow.nodes.map((node) => [node.id, node])),
    [draftWorkflow.nodes]
  );
  const selectedNode = useMemo(
    () => draftWorkflow.nodes.find((node) => node.id === selectedNodeId) || null,
    [draftWorkflow.nodes, selectedNodeId]
  );
  const selectedDefinition = selectedNode ? getNodeDefinition(selectedNode.type) : null;
  const outgoingTargets = useMemo(
    () =>
      new Set(
        draftWorkflow.edges
          .filter((edge) => edge.source === selectedNodeId)
          .map((edge) => edge.target)
      ),
    [draftWorkflow.edges, selectedNodeId]
  );
  const webhookNode = useMemo(() => getWebhookNode(draftWorkflow), [draftWorkflow]);
  const webhookPath = `/api/workflows/${draftWorkflow.id}/webhook`;
  const webhookUrl =
    typeof window === "undefined" ? webhookPath : `${window.location.origin}${webhookPath}`;
  const webhookSecret = String(webhookNode?.config?.webhook_secret || "").trim();
  const webhookCurl = webhookSecret
    ? `curl -X POST "${webhookUrl}" -H "x-naier-webhook-secret: ${webhookSecret}" -H "Content-Type: application/json" -d '{"symbol":"005930"}'`
    : `curl -X POST "${webhookUrl}" -H "Content-Type: application/json" -d '{"symbol":"005930"}'`;

  useEffect(() => {
    const nextWorkflow = syncWorkflowSchedule(workflow);
    setDraftWorkflow(nextWorkflow);
    setSelectedNodeId(nextWorkflow.nodes[0]?.id ?? null);
    setIsDirty(false);
  }, [workflow]);

  useEffect(() => {
    if (!selectedNodeId || nodeMap.has(selectedNodeId)) {
      return;
    }

    setSelectedNodeId(draftWorkflow.nodes[0]?.id ?? null);
  }, [draftWorkflow.nodes, nodeMap, selectedNodeId]);

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setNotice(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const dragState = dragStateRef.current;
      const canvas = canvasRef.current;

      if (!dragState || !canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const nextX = snap(
        Math.min(
          dragState.maxX,
          Math.max(40, event.clientX - rect.left + canvas.scrollLeft - dragState.offsetX)
        )
      );
      const nextY = snap(
        Math.min(
          dragState.maxY,
          Math.max(40, event.clientY - rect.top + canvas.scrollTop - dragState.offsetY)
        )
      );

      setDraftWorkflow((current) =>
        syncWorkflowSchedule({
          ...current,
          nodes: current.nodes.map((node) =>
            node.id === dragState.nodeId
              ? { ...node, position: { x: nextX, y: nextY } }
              : node
          )
        })
      );
      setIsDirty(true);
    }

    function handlePointerUp() {
      dragStateRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  function updateWorkflow(updater: (current: Workflow) => Workflow) {
    setDraftWorkflow((current) => syncWorkflowSchedule(updater(current)));
    setIsDirty(true);
  }

  function updateNode(nodeId: string, updater: (node: WorkflowNode) => WorkflowNode) {
    updateWorkflow((current) => ({
      ...current,
      nodes: current.nodes.map((node) => (node.id === nodeId ? updater(node) : node))
    }));
  }

  function handleNodePointerDown(node: WorkflowNode, event: ReactPointerEvent<HTMLButtonElement>) {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    event.preventDefault();
    setSelectedNodeId(node.id);

    const rect = canvas.getBoundingClientRect();
    dragStateRef.current = {
      nodeId: node.id,
      offsetX: event.clientX - rect.left + canvas.scrollLeft - node.position.x,
      offsetY: event.clientY - rect.top + canvas.scrollTop - node.position.y,
      maxX: canvasSize.width - NODE_WIDTH - 40,
      maxY: canvasSize.height - NODE_HEIGHT - 40
    };
  }

  function handleAddNode(type: WorkflowNode["type"]) {
    const definition = getNodeDefinition(type);
    const hasTriggerNode = draftWorkflow.nodes.some((node) =>
      node.type.startsWith("trigger_")
    );

    if (definition.category === "trigger" && hasTriggerNode) {
      const existingTrigger = draftWorkflow.nodes.find((node) =>
        node.type.startsWith("trigger_")
      );

      if (existingTrigger) {
        setSelectedNodeId(existingTrigger.id);
      }

      setNotice({
        type: "error",
        message: "트리거 노드는 워크플로우당 하나만 둘 수 있습니다."
      });
      return;
    }

    const rightMostX = draftWorkflow.nodes.reduce(
      (largest, node) => Math.max(largest, node.position.x),
      80
    );
    const newNode: WorkflowNode = {
      id: createNodeId(),
      type,
      label: definition.label,
      config: getDefaultNodeConfig(type),
      position: {
        x: snap(rightMostX + 280),
        y: snap(120 + (draftWorkflow.nodes.length % 3) * 170)
      }
    };

    updateWorkflow((current) => ({
      ...current,
      nodes: [...current.nodes, newNode]
    }));
    setSelectedNodeId(newNode.id);
    setNotice({
      type: "success",
      message: `${definition.label} 노드를 추가했습니다.`
    });
  }

  function handleDeleteSelectedNode() {
    if (!selectedNode) {
      return;
    }

    const remainingNodes = draftWorkflow.nodes.filter((node) => node.id !== selectedNode.id);

    updateWorkflow((current) => ({
      ...current,
      nodes: current.nodes.filter((node) => node.id !== selectedNode.id),
      edges: current.edges.filter(
        (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
      )
    }));
    setSelectedNodeId(remainingNodes[0]?.id ?? null);
  }

  function handleToggleEdge(targetId: string, checked: boolean) {
    if (!selectedNode || selectedNode.id === targetId) {
      return;
    }

    updateWorkflow((current) => {
      const filteredEdges = current.edges.filter(
        (edge) => !(edge.source === selectedNode.id && edge.target === targetId)
      );

      if (!checked) {
        return {
          ...current,
          edges: filteredEdges
        };
      }

      if (wouldCreateCycle(filteredEdges, selectedNode.id, targetId)) {
        setNotice({
          type: "error",
          message: "순환 참조가 생기는 연결은 만들 수 없습니다."
        });
        return current;
      }

      return {
        ...current,
        edges: [
          ...filteredEdges,
          {
            id: createEdgeId(selectedNode.id, targetId),
            source: selectedNode.id,
            target: targetId
          }
        ]
      };
    });
  }

  async function handleCopy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice({
        type: "success",
        message
      });
    } catch {
      setNotice({
        type: "error",
        message: "클립보드 복사에 실패했습니다."
      });
    }
  }

  async function handleSave() {
    setPendingAction("save");

    try {
      const response = await fetch(`/api/workflows/${draftWorkflow.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: draftWorkflow.name,
          description: draftWorkflow.description,
          schedule_cron: draftWorkflow.schedule_cron,
          nodes: draftWorkflow.nodes,
          edges: draftWorkflow.edges
        })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(result, "워크플로우 저장에 실패했습니다."));
      }

      setDraftWorkflow(syncWorkflowSchedule(result.workflow as Workflow));
      setIsDirty(false);
      setNotice({
        type: "success",
        message: "워크플로우를 저장했습니다."
      });
      startTransition(() => router.refresh());
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "워크플로우 저장에 실패했습니다."
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleExecute() {
    setPendingAction("execute");

    try {
      const response = await fetch(`/api/workflows/${draftWorkflow.id}/execute`, {
        method: "POST"
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(result, "워크플로우 실행에 실패했습니다."));
      }

      setNotice({
        type: result.status === "success" ? "success" : "error",
        message:
          result.status === "success"
            ? "워크플로우 실행이 완료되었습니다."
            : "워크플로우 실행 중 오류가 발생했습니다."
      });
      startTransition(() => router.refresh());
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "워크플로우 실행에 실패했습니다."
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleToggle() {
    setPendingAction("toggle");

    try {
      const response = await fetch(`/api/workflows/${draftWorkflow.id}/toggle`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          is_active: !draftWorkflow.is_active
        })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(result, "활성 상태 변경에 실패했습니다."));
      }

      setDraftWorkflow(syncWorkflowSchedule(result.workflow as Workflow));
      setIsDirty(false);
      setNotice({
        type: "success",
        message: draftWorkflow.is_active
          ? "워크플로우를 비활성화했습니다."
          : "워크플로우를 활성화했습니다."
      });
      startTransition(() => router.refresh());
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "활성 상태 변경에 실패했습니다."
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDeleteWorkflow() {
    const shouldDelete = window.confirm(
      `'${draftWorkflow.name}' 워크플로우를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`
    );

    if (!shouldDelete) {
      return;
    }

    setPendingAction("delete");

    try {
      const response = await fetch(`/api/workflows/${draftWorkflow.id}`, {
        method: "DELETE"
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(result, "워크플로우 삭제에 실패했습니다."));
      }

      router.push("/workflows");
      router.refresh();
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "워크플로우 삭제에 실패했습니다."
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleTestNode(node: WorkflowNode, input?: unknown) {
    setTestingNodeId(node.id);

    try {
      const response = await fetch("/api/nodes/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          node,
          input,
          triggerType: node.type === "trigger_webhook" ? "webhook" : "manual"
        })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(result, "단일 노드 테스트에 실패했습니다."));
      }

      setTestResults((current) => ({
        ...current,
        [node.id]: {
          input: result.input,
          output: result.output,
          testedAt: new Date().toISOString()
        }
      }));
      setNotice({
        type: "success",
        message: `${node.label} 노드 테스트가 완료되었습니다.`
      });
    } catch (error) {
      setTestResults((current) => ({
        ...current,
        [node.id]: {
          input,
          error: error instanceof Error ? error.message : "단일 노드 테스트에 실패했습니다.",
          testedAt: new Date().toISOString()
        }
      }));
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "단일 노드 테스트에 실패했습니다."
      });
    } finally {
      setTestingNodeId(null);
    }
  }

  function renderField(field: NodeConfigField) {
    if (!selectedNode) {
      return null;
    }

    const value = selectedNode.config?.[field.key] ?? getDefaultFieldValue(field);

    if (field.type === "boolean") {
      return (
        <label
          key={field.key}
          className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-200"
        >
          <Checkbox
            checked={Boolean(value)}
            onChange={(event) =>
              updateNode(selectedNode.id, (node) => ({
                ...node,
                config: { ...node.config, [field.key]: event.target.checked }
              }))
            }
          />
          <div className="space-y-1">
            <span className="block">{field.label}</span>
            {field.description ? (
              <span className="block text-xs text-zinc-500">{field.description}</span>
            ) : null}
          </div>
        </label>
      );
    }

    if (field.type === "select" && field.multiple) {
      const values = Array.isArray(value) ? value.map(String) : [];

      return (
        <div key={field.key} className="space-y-3">
          <div>
            <p className="text-sm font-medium text-zinc-100">{field.label}</p>
            {field.description ? (
              <p className="mt-1 text-xs text-zinc-500">{field.description}</p>
            ) : null}
          </div>
          {(field.options || []).map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-200"
            >
              <Checkbox
                checked={values.includes(option.value)}
                onChange={(event) => {
                  const nextValues = event.target.checked
                    ? Array.from(new Set([...values, option.value]))
                    : values.filter((item) => item !== option.value);

                  updateNode(selectedNode.id, (node) => ({
                    ...node,
                    config: { ...node.config, [field.key]: nextValues }
                  }));
                }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div key={field.key} className="space-y-2">
          <label className="text-sm font-medium text-zinc-100">{field.label}</label>
          {field.description ? (
            <p className="text-xs text-zinc-500">{field.description}</p>
          ) : null}
          <select
            value={String(value ?? "")}
            onChange={(event) =>
              updateNode(selectedNode.id, (node) => ({
                ...node,
                config: { ...node.config, [field.key]: event.target.value }
              }))
            }
            className="flex h-11 w-full rounded-xl border border-border bg-[#0d0d0d] px-4 py-2 text-sm text-foreground outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
          >
            <option value="">선택하세요</option>
            {(field.options || []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={field.key} className="space-y-2">
          <label className="text-sm font-medium text-zinc-100">{field.label}</label>
          {field.description ? (
            <p className="text-xs text-zinc-500">{field.description}</p>
          ) : null}
          <Textarea
            value={String(value ?? "")}
            placeholder={field.placeholder}
            className="min-h-[110px]"
            onChange={(event) =>
              updateNode(selectedNode.id, (node) => ({
                ...node,
                config: { ...node.config, [field.key]: event.target.value }
              }))
            }
          />
        </div>
      );
    }

    return (
      <div key={field.key} className="space-y-2">
        <label className="text-sm font-medium text-zinc-100">{field.label}</label>
        {field.description ? <p className="text-xs text-zinc-500">{field.description}</p> : null}
        <Input
          type={field.type === "number" ? "number" : "text"}
          min={field.min}
          max={field.max}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            updateNode(selectedNode.id, (node) => ({
              ...node,
              config: {
                ...node.config,
                [field.key]:
                  field.type === "number"
                    ? event.target.value === ""
                      ? ""
                      : Number(event.target.value)
                    : event.target.value
              }
            }))
          }
        />
      </div>
    );
  }

  return (
    <>
      {notice ? (
        <div className="fixed right-4 top-4 z-50">
          <div
            className={cn(
              "min-w-[280px] rounded-2xl border px-4 py-3 text-sm shadow-2xl shadow-black/30",
              notice.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-200"
                : "border-rose-500/30 bg-rose-500/12 text-rose-200"
            )}
          >
            {notice.message}
          </div>
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-[#111111] p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Workflow Name
                </label>
                <Input
                  value={draftWorkflow.name}
                  onChange={(event) =>
                    updateWorkflow((current) => ({
                      ...current,
                      name: event.target.value
                    }))
                  }
                  placeholder="워크플로우 이름"
                  className="h-12 font-mono text-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Description
                </label>
                <Textarea
                  value={draftWorkflow.description || ""}
                  onChange={(event) =>
                    updateWorkflow((current) => ({
                      ...current,
                      description: event.target.value
                    }))
                  }
                  placeholder="이 워크플로우가 어떤 자동화를 하는지 간단히 적어주세요."
                  className="min-h-[96px]"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 xl:justify-end">
              <Button
                variant="secondary"
                onClick={() => void handleSave()}
                disabled={pendingAction !== null || !isDirty}
              >
                {pendingAction === "save" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                저장
              </Button>
              <Button onClick={() => void handleExecute()} disabled={pendingAction !== null}>
                {pendingAction === "execute" ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                실행
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleToggle()}
                disabled={pendingAction !== null}
              >
                <Power className="h-4 w-4" />
                {draftWorkflow.is_active ? "비활성화" : "활성화"}
              </Button>
              <Link
                href={`/workflows/${draftWorkflow.id}/logs`}
                className={buttonVariants({ variant: "outline" })}
              >
                <FileText className="h-4 w-4" />
                로그
              </Link>
              <Button
                variant="outline"
                onClick={() => void handleDeleteWorkflow()}
                disabled={pendingAction !== null}
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Trigger</p>
              <p className="mt-2 text-sm text-zinc-200">
                {formatWorkflowTrigger(draftWorkflow)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Last Run</p>
              <p className="mt-2 text-sm text-zinc-200">
                {draftWorkflow.last_executed_at
                  ? formatRelativeTime(draftWorkflow.last_executed_at)
                  : "아직 실행 기록이 없습니다."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Updated</p>
              <p className="mt-2 text-sm text-zinc-200">
                {formatDateTime(draftWorkflow.updated_at)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-black/15 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Graph</p>
              <p className="mt-2 text-sm text-zinc-200">
                {draftWorkflow.nodes.length}개 노드 · {draftWorkflow.edges.length}개 연결
              </p>
            </div>
          </div>

          {isDirty ? (
            <p className="mt-4 text-sm text-amber-200">
              변경 사항이 아직 저장되지 않았습니다. 저장 후 새로고침해야 목록과 로그에서 최신 값이 반영됩니다.
            </p>
          ) : null}
        </div>

        {webhookNode ? (
          <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/6 p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-cyan-100">
                  <Webhook className="h-5 w-5" />
                  <p className="font-mono text-sm uppercase tracking-[0.24em]">
                    Webhook Trigger
                  </p>
                </div>
                <div className="space-y-2 text-sm text-cyan-50/90">
                  <p>URL: {webhookUrl}</p>
                  <p>Secret: {webhookSecret || "노드 설정에서 webhook_secret 값을 넣어주세요."}</p>
                </div>
                <pre className="overflow-x-auto rounded-2xl border border-cyan-200/10 bg-black/30 p-4 text-xs leading-6 text-cyan-50/80">
                  {webhookCurl}
                </pre>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() =>
                    void handleCopy(webhookUrl, "웹훅 URL을 클립보드에 복사했습니다.")
                  }
                >
                  <Copy className="h-4 w-4" />
                  URL 복사
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    void handleCopy(webhookCurl, "샘플 curl 명령을 클립보드에 복사했습니다.")
                  }
                >
                  <Copy className="h-4 w-4" />
                  curl 복사
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
          <section className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  updateWorkflow((current) => ({
                    ...current,
                    nodes: sortNodes(current.nodes).map((node, index) => ({
                      ...node,
                      position: {
                        x: 80 + (index % 4) * 280,
                        y: 100 + Math.floor(index / 4) * 180
                      }
                    }))
                  }))
                }
              >
                <Sparkles className="h-4 w-4" />
                자동 정렬
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  updateWorkflow((current) => {
                    const orderedNodes = sortNodes(current.nodes);
                    const edges: WorkflowEdge[] = orderedNodes.slice(0, -1).map(
                      (node, index) => ({
                        id: createEdgeId(node.id, orderedNodes[index + 1].id),
                        source: node.id,
                        target: orderedNodes[index + 1].id
                      })
                    );

                    return {
                      ...current,
                      edges
                    };
                  })
                }
              >
                <Cable className="h-4 w-4" />
                순차 자동 연결
              </Button>
            </div>

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#111111]">
              <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
                <div>
                  <p className="font-medium text-zinc-100">Workflow Canvas</p>
                  <p className="text-sm text-zinc-500">
                    노드를 드래그해서 이동하고, 오른쪽 패널에서 설정과 연결을 관리하세요.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <LayoutGrid className="h-4 w-4" />
                  20px grid snap
                </div>
              </div>

              <div ref={canvasRef} className="relative h-[680px] overflow-auto">
                <div
                  className="relative"
                  style={{
                    width: canvasSize.width,
                    height: canvasSize.height
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
                      backgroundSize: `${GRID}px ${GRID}px`
                    }}
                  />

                  <svg className="absolute inset-0 h-full w-full">
                    {draftWorkflow.edges.map((edge) => {
                      const source = nodeMap.get(edge.source);
                      const target = nodeMap.get(edge.target);

                      if (!source || !target) {
                        return null;
                      }

                      const isHighlighted =
                        selectedNodeId === edge.source || selectedNodeId === edge.target;

                      return (
                        <g key={edge.id}>
                          <path
                            d={buildEdgePath(source, target)}
                            fill="none"
                            stroke={isHighlighted ? "#00d4aa" : "rgba(255,255,255,0.18)"}
                            strokeWidth={isHighlighted ? 2.5 : 1.8}
                            strokeLinecap="round"
                          />
                          <circle
                            cx={target.position.x}
                            cy={target.position.y + NODE_HEIGHT / 2}
                            r={4}
                            fill={isHighlighted ? "#00d4aa" : "rgba(255,255,255,0.35)"}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {draftWorkflow.nodes.map((node) => {
                    const definition = getNodeDefinition(node.type);
                    const summary = summarizeNode(node);
                    const isSelected = node.id === selectedNodeId;
                    const outgoingCount = draftWorkflow.edges.filter(
                      (edge) => edge.source === node.id
                    ).length;

                    return (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => setSelectedNodeId(node.id)}
                        onPointerDown={(event) => handleNodePointerDown(node, event)}
                        className={cn(
                          "absolute left-0 top-0 flex h-[116px] w-[224px] cursor-grab flex-col rounded-3xl border px-4 py-4 text-left transition active:cursor-grabbing",
                          isSelected
                            ? "border-[#00d4aa]/70 bg-[#00d4aa]/10 shadow-[0_0_0_1px_rgba(0,212,170,0.25)] shadow-[#00d4aa]/10"
                            : "border-white/10 bg-[#0d0d0d]/95 hover:border-white/20"
                        )}
                        style={{
                          transform: `translate(${node.position.x}px, ${node.position.y}px)`
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-base">
                              {definition.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-zinc-100">
                                {node.label}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                {getCategoryLabel(definition.category)}
                              </p>
                            </div>
                          </div>
                          <GripVertical className="h-4 w-4 shrink-0 text-zinc-500" />
                        </div>

                        <div className="mt-4 flex min-h-[36px] flex-col justify-end">
                          {summary.length > 0 ? (
                            summary.map((item) => (
                              <p key={item} className="truncate text-xs text-zinc-400">
                                {item}
                              </p>
                            ))
                          ) : (
                            <p className="text-xs text-zinc-500">설정 요약이 아직 없습니다.</p>
                          )}
                        </div>

                        <div className="mt-auto flex items-center justify-between pt-3 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
                          <span>{definition.type.replaceAll("_", " ")}</span>
                          <span>{outgoingCount} outputs</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-[#111111] p-5">
              <div className="mb-4">
                <p className="font-medium text-zinc-100">Node Library</p>
                <p className="mt-1 text-sm text-zinc-500">
                  필요한 블록을 추가해서 실행 흐름을 확장하세요.
                </p>
              </div>

              <div className="space-y-5">
                {CATEGORY_ORDER.map((category) => {
                  const definitions = getNodesByCategory(category);

                  return (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                          {getCategoryLabel(category)}
                        </p>
                        <span className="text-xs text-zinc-600">{definitions.length}</span>
                      </div>

                      <div className="grid gap-2">
                        {definitions.map((definition) => (
                          <button
                            key={definition.type}
                            type="button"
                            onClick={() => handleAddNode(definition.type)}
                            className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-left transition hover:border-[#00d4aa]/30 hover:bg-[#00d4aa]/6"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-base">
                                {definition.icon}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-zinc-100">
                                  {definition.label}
                                </p>
                                <p className="mt-1 text-xs leading-5 text-zinc-500">
                                  {definition.description}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedNode && selectedDefinition ? (
              <>
                <div className="rounded-3xl border border-white/10 bg-[#111111] p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-100">Node Inspector</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        선택된 노드의 라벨과 설정 값을 수정합니다.
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDeleteSelectedNode}>
                      <Trash2 className="h-4 w-4" />
                      삭제
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-100">라벨</label>
                      <Input
                        value={selectedNode.label}
                        onChange={(event) =>
                          updateNode(selectedNode.id, (node) => ({
                            ...node,
                            label: event.target.value
                          }))
                        }
                        placeholder="노드 이름"
                      />
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-black/15 px-4 py-3 text-xs text-zinc-500">
                      <p>Node ID: {selectedNode.id}</p>
                      <p className="mt-1">
                        Position: {selectedNode.position.x}, {selectedNode.position.y}
                      </p>
                    </div>

                    {selectedDefinition.configSchema.length > 0 ? (
                      <div className="space-y-4">{selectedDefinition.configSchema.map(renderField)}</div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-4 text-sm text-zinc-500">
                        이 노드는 별도 설정이 없습니다.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[#111111] p-5">
                  <div className="mb-4">
                    <p className="font-medium text-zinc-100">Connections</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      현재 노드 다음에 실행할 노드를 선택하세요. 순환 연결은 자동으로 막습니다.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {sortNodes(
                      draftWorkflow.nodes.filter((node) => node.id !== selectedNode.id)
                    ).map((node) => (
                      <label
                        key={node.id}
                        className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-200"
                      >
                        <Checkbox
                          checked={outgoingTargets.has(node.id)}
                          onChange={(event) => handleToggleEdge(node.id, event.target.checked)}
                        />
                        <span className="text-base">{getNodeDefinition(node.type).icon}</span>
                        <span className="flex-1">{node.label}</span>
                      </label>
                    ))}

                    {draftWorkflow.nodes.length <= 1 ? (
                      <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 px-4 py-4 text-sm text-zinc-500">
                        연결할 다른 노드가 아직 없습니다.
                      </div>
                    ) : null}
                  </div>
                </div>

                <NodeCard
                  node={selectedNode}
                  isTesting={testingNodeId === selectedNode.id}
                  testResult={testResults[selectedNode.id]}
                  onTest={handleTestNode}
                />
              </>
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 bg-[#111111] p-6 text-center">
                <p className="text-sm font-medium text-zinc-200">선택된 노드가 없습니다.</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  캔버스에서 노드를 클릭하거나 오른쪽 라이브러리에서 새 노드를 추가해보세요.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
