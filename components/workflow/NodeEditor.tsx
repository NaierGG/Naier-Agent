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
  Copy,
  FileText,
  GripVertical,
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
const NODE_HEIGHT = 112;
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
    .map(([key]) => key);
}

function getWebhookNode(workflow: Workflow) {
  return workflow.nodes.find((node) => node.type === "trigger_webhook") || null;
}

export function NodeEditor({ workflow }: { workflow: Workflow }) {
  const router = useRouter();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState>(null);

  const [draftWorkflow, setDraftWorkflow] = useState(workflow);
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

  useEffect(() => {
    setDraftWorkflow(workflow);
    setSelectedNodeId(workflow.nodes[0]?.id ?? null);
    setIsDirty(false);
  }, [workflow]);

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

      setDraftWorkflow((current) => ({
        ...current,
        nodes: current.nodes.map((node) =>
          node.id === dragState.nodeId
            ? { ...node, position: { x: nextX, y: nextY } }
            : node
        )
      }));
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
    setDraftWorkflow((current) => updater(current));
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

    const rect = canvas.getBoundingClientRect();
    setSelectedNodeId(node.id);
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
        y: snap(120 + (draftWorkflow.nodes.length % 3) * 160)
      }
    };

    updateWorkflow((current) => ({
      ...current,
      nodes: [...current.nodes, newNode]
    }));
    setSelectedNodeId(newNode.id);
  }

  function handleDeleteSelectedNode() {
    if (!selectedNode) {
      return;
    }

    updateWorkflow((current) => ({
      ...current,
      nodes: current.nodes.filter((node) => node.id !== selectedNode.id),
      edges: current.edges.filter(
        (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
      )
    }));
  }

  function handleToggleEdge(targetId: string, checked: boolean) {
    if (!selectedNode) {
      return;
    }

    updateWorkflow((current) => {
      const filteredEdges = current.edges.filter(
        (edge) => !(edge.source === selectedNode.id && edge.target === targetId)
      );

      return {
        ...current,
        edges: checked
          ? [
              ...filteredEdges,
              {
                id: createEdgeId(selectedNode.id, targetId),
                source: selectedNode.id,
                target: targetId
              }
            ]
          : filteredEdges
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
          nodes: draftWorkflow.nodes,
          edges: draftWorkflow.edges
        })
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(result, "워크플로우 저장에 실패했습니다."));
      }

      setDraftWorkflow(result.workflow as Workflow);
      setIsDirty(false);
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
        throw new Error(getErrorMessage(result, "상태 변경에 실패했습니다."));
      }

      setDraftWorkflow(result.workflow as Workflow);
      setIsDirty(false);
      startTransition(() => router.refresh());
    } catch (error) {
      setNotice({
        type: "error",
        message: error instanceof Error ? error.message : "상태 변경에 실패했습니다."
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
        throw new Error(getErrorMessage(result, "단일 노드 실행에 실패했습니다."));
      }

      setTestResults((current) => ({
        ...current,
        [node.id]: {
          input: result.input,
          output: result.output,
          testedAt: new Date().toISOString()
        }
      }));
    } catch (error) {
      setTestResults((current) => ({
        ...current,
        [node.id]: {
          input,
          error:
            error instanceof Error ? error.message : "단일 노드 실행에 실패했습니다.",
          testedAt: new Date().toISOString()
        }
      }));
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
          <span>{field.label}</span>
        </label>
      );
    }

    if (field.type === "select" && field.multiple) {
      const values = Array.isArray(value) ? value.map(String) : [];

      return (
        <div key={field.key} className="space-y-3">
          <p className="text-sm font-medium text-zinc-100">{field.label}</p>
          {(field.options || []).map((option) => (
            <label
              key={option.value}
              className="mt-2 flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-200"
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
        <Input
          type={field.type === "number" ? "number" : "text"}
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
              "min-w-[260px] rounded-2xl border px-4 py-3 text-sm shadow-2xl shadow-black/30",
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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-mono text-2xl text-zinc-100">{draftWorkflow.name}</h2>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    draftWorkflow.is_active
                      ? "bg-emerald-500/12 text-emerald-300"
                      : "bg-zinc-800 text-zinc-400"
                  )}
                >
                  {draftWorkflow.is_active ? "활성" : "비활성"}
                </span>
                {isDirty ? (
                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">
                    저장 필요
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                캔버스에서 노드를 직접 움직이고, 오른쪽 인스펙터에서 설정을 수정하세요.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
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
                <Play className="h-4 w-4" />
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
                  : "아직 없음"}
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
                {draftWorkflow.nodes.length}개 노드 / {draftWorkflow.edges.length}개 연결
              </p>
            </div>
          </div>
        </div>

        {webhookNode ? (
          <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/6 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-cyan-100">
                <Webhook className="h-5 w-5" />
                <p className="font-mono text-sm uppercase tracking-[0.24em]">
                  Webhook Trigger
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  void handleCopy(
                    `/api/workflows/${draftWorkflow.id}/webhook`,
                    "웹훅 경로를 복사했습니다."
                  )
                }
              >
                <Copy className="h-4 w-4" />
                경로 복사
              </Button>
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
                <Save className="h-4 w-4" />
                순차 자동 연결
              </Button>
            </div>
