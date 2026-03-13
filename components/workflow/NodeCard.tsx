"use client";

import { useState } from "react";
import { LoaderCircle, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getNodeDefinition } from "@/lib/nodes/registry";
import { cn } from "@/lib/utils/cn";
import type { WorkflowNode } from "@/types";

type NodeTestResult = {
  input: unknown;
  output?: unknown;
  error?: string;
  testedAt: string;
};

type NodeCardProps = {
  node: WorkflowNode;
  isLast: boolean;
  isTesting: boolean;
  testResult?: NodeTestResult;
  onTest: (node: WorkflowNode, input?: unknown) => Promise<void>;
};

function formatJsonPreview(value: unknown) {
  if (value === undefined) {
    return "";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function summarizeConfig(config: Record<string, any>) {
  const entries = Object.entries(config || {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );

  if (entries.length === 0) {
    return "설정 없음";
  }

  return entries.slice(0, 5).map(([key, value]) => ({
    key,
    value: Array.isArray(value) ? value.join(", ") : String(value)
  }));
}

export function NodeCard({
  node,
  isTesting,
  testResult,
  onTest
}: NodeCardProps) {
  const [rawInput, setRawInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const definition = getNodeDefinition(node.type);
  const configSummary = summarizeConfig(node.config);

  async function handleTest() {
    setInputError(null);

    if (!rawInput.trim()) {
      await onTest(node);
      return;
    }

    try {
      const parsedInput = JSON.parse(rawInput);
      await onTest(node, parsedInput);
    } catch {
      setInputError("테스트 입력은 JSON 형식이어야 합니다.");
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-[#111111] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#00d4aa]/20 bg-[#00d4aa]/10 text-base">
              {definition.icon}
            </div>
            <div>
              <h3 className="font-medium text-zinc-100">{node.label}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                {definition.label} · {definition.category}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-400">{definition.description}</p>
        </div>

        <Button size="sm" onClick={() => void handleTest()} disabled={isTesting}>
          {isTesting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          단건 테스트
        </Button>
      </div>

      <div className="mt-5 rounded-2xl border border-white/5 bg-black/15 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Config Summary</p>
        <div className="mt-3 space-y-2 text-sm text-zinc-300">
          {typeof configSummary === "string" ? (
            <p className="text-zinc-400">{configSummary}</p>
          ) : (
            configSummary.map((item) => (
              <p key={item.key}>
                <span className="font-medium text-zinc-100">{item.key}</span>: {item.value}
              </p>
            ))
          )}
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
          Test Input (JSON, optional)
        </p>
        <Textarea
          value={rawInput}
          onChange={(event) => setRawInput(event.target.value)}
          placeholder='예: {"items":[{"title":"삼성전자 뉴스"}]}'
          className="min-h-[110px]"
        />
        {inputError ? <p className="mt-2 text-sm text-rose-300">{inputError}</p> : null}
      </div>

      {testResult ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
              Last Input
            </p>
            <pre className="overflow-x-auto rounded-2xl border border-white/5 bg-black/30 p-4 text-xs leading-6 text-zinc-300">
              {formatJsonPreview(testResult.input) || "null"}
            </pre>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
              Last Output
            </p>
            <pre
              className={cn(
                "overflow-x-auto rounded-2xl border p-4 text-xs leading-6",
                testResult.error
                  ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                  : "border-white/5 bg-black/30 text-zinc-300"
              )}
            >
              {testResult.error
                ? testResult.error
                : formatJsonPreview(testResult.output) || "null"}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
