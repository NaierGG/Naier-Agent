"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  LoaderCircle,
  MessageSquarePlus,
  RefreshCcw,
  SendHorizonal,
  Settings,
  Sparkles
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { NODE_DEFINITIONS } from "@/lib/nodes/registry";
import type { ConversationMessage, Workflow } from "@/types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  kind?: "text" | "workflow_generated";
  questions?: string[];
  workflowName?: string;
};

type GenerateWorkflowResponse = {
  workflow?: Workflow;
  message?: string;
  workflowId?: string;
  needsMoreInfo?: boolean;
  needsSetup?: boolean;
  questions?: string[];
  error?: string;
};

const initialAssistantMessage =
  "안녕하세요! 어떤 자동화나 AI 에이전트를 만들고 싶으신가요?\n예시:\n• '매일 오전 9시에 운영 현황 API를 불러와서 이메일로 보내줘'\n• '웹훅으로 들어오는 요청을 검증해서 디스코드로 알려줘'\n• '외부 API 응답을 AI가 요약해서 텔레그램으로 보내줘'";

const suggestionChips = [
  "매일 리포트 이메일 받기",
  "웹훅 요청 검증하기",
  "외부 API 결과 알림 받기",
  "AI가 정리한 작업 브리핑 받기"
];

function createInitialMessages(): ChatMessage[] {
  return [
    {
      id: "assistant-initial",
      role: "assistant",
      content: initialAssistantMessage,
      kind: "text"
    }
  ];
}

function formatSchedule(workflow: Partial<Workflow> | null) {
  if (!workflow?.nodes || workflow.nodes.length === 0) {
    return "\uD83D\uDD18 \uC218\uB3D9 \uC2E4\uD589";
  }

  const triggerNode = workflow.nodes.find(
    (node) => node.type === "trigger_schedule" || node.type === "trigger_manual"
  );

  if (!triggerNode || triggerNode.type === "trigger_manual") {
    return "\uD83D\uDD18 \uC218\uB3D9 \uC2E4\uD589";
  }

  const cron = String(triggerNode.config?.cron_expression || workflow.schedule_cron || "");

  if (cron === "0 9 * * 1-5") {
    return "\u23F0 \uD3C9\uC77C \uC624\uC804 9\uC2DC \uC2E4\uD589";
  }

  if (cron === "0 8 * * 1-5") {
    return "\u23F0 \uD3C9\uC77C \uC624\uC804 8\uC2DC \uC2E4\uD589";
  }

  if (cron) {
    return `\u23F0 Cron: ${cron}`;
  }

  return "\u23F0 \uC2A4\uCF00\uC904 \uC2E4\uD589";
}

function summarizeConfig(config: Record<string, any> | undefined) {
  if (!config) {
    return "\uC124\uC815 \uC5C6\uC74C";
  }

  const entries = Object.entries(config)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .slice(0, 2)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${value.join(", ")}`;
      }

      return `${key}: ${String(value)}`;
    });

  return entries.length > 0 ? entries.join(" · ") : "\uC124\uC815 \uC5C6\uC74C";
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-[#1a1a1a] px-4 py-3 text-sm text-zinc-400">
      <span className="h-2 w-2 animate-bounce rounded-full bg-[#00d4aa] [animation-delay:-0.2s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-[#00d4aa] [animation-delay:-0.1s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-[#00d4aa]" />
    </div>
  );
}

export function ChatToWorkflow() {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(createInitialMessages);
  const [generatedWorkflow, setGeneratedWorkflow] = useState<Partial<Workflow> | null>(null);
  const [generatedWorkflowId, setGeneratedWorkflowId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "preview">("chat");

  const hasUserMessages = useMemo(
    () => messages.some((message) => message.role === "user"),
    [messages]
  );

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function resetConversation() {
    setMessages(createInitialMessages());
    setGeneratedWorkflow(null);
    setGeneratedWorkflowId(null);
    setDraft("");
    setError(null);
    setNeedsSetup(false);
    setMobileTab("chat");
  }

  async function submitMessage(rawMessage: string) {
    const message = rawMessage.trim();

    if (!message || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: message,
      kind: "text"
    };

    const historyPayload: ConversationMessage[] = messages.map((chatMessage) => ({
      role: chatMessage.role,
      content: chatMessage.content
    }));

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setError(null);
    setNeedsSetup(false);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message,
          history: historyPayload
        })
      });

      const result = (await response.json()) as GenerateWorkflowResponse;

      if (!response.ok) {
        setNeedsSetup(Boolean(result.needsSetup));
        throw new Error(
          result.error ||
            "\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694."
        );
      }

      const assistantBaseMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant" as const,
        content:
          result.message ||
          "\uC6CC\uD06C\uD50C\uB85C\uC6B0 \uC694\uCCAD\uC744 \uCC98\uB9AC\uD588\uC2B5\uB2C8\uB2E4."
      };

      if (result.needsMoreInfo) {
        setMessages((current) => [
          ...current,
          {
            ...assistantBaseMessage,
            kind: "text",
            questions: result.questions || []
          }
        ]);
        return;
      }

      if (result.workflow) {
        const workflow = result.workflow;

        setGeneratedWorkflow(workflow);
        setGeneratedWorkflowId(result.workflowId || workflow.id || null);
        setMobileTab("preview");
        setMessages((current) => [
          ...current,
          {
            ...assistantBaseMessage,
            kind: "workflow_generated",
            workflowName:
              workflow.name ||
              "\uC0C8 \uC6CC\uD06C\uD50C\uB85C\uC6B0"
          }
        ]);
        return;
      }

      setMessages((current) => [
        ...current,
        {
          ...assistantBaseMessage,
          kind: "text"
        }
      ]);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "\uC7A0\uC2DC \uD6C4 \uB2E4\uC2DC \uC2DC\uB3C4\uD574\uC8FC\uC138\uC694."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submitMessage(draft);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-2xl border border-white/10 bg-[#111111] p-1 lg:hidden">
        {[
          { key: "chat", label: "\uCC44\uD305" },
          { key: "preview", label: "\uBBF8\uB9AC\uBCF4\uAE30" }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`flex-1 rounded-xl px-4 py-2 text-sm transition ${
              mobileTab === tab.key
                ? "bg-[#00d4aa] text-black"
                : "text-zinc-400"
            }`}
            onClick={() => setMobileTab(tab.key as "chat" | "preview")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          className={`border-white/10 bg-[#111111] ${
            mobileTab === "preview" ? "hidden lg:flex" : "flex"
          } flex-col`}
        >
          <CardHeader className="border-b border-white/10 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Bot className="h-5 w-5 text-[#00d4aa]" />
                  {"AI \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uBE4C\uB354"}
                </CardTitle>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {
                    "\uC790\uC5F0\uC5B4\uB85C \uC790\uB3D9\uD654 \uC758\uB3C4\uB97C \uC124\uBA85\uD558\uBA74, \uC2E4\uD589 \uAC00\uB2A5\uD55C \uC6CC\uD06C\uD50C\uB85C\uC6B0\uB85C \uC815\uB9AC\uD574\uB4DC\uB9B4\uAC8C\uC694."
                  }
                </p>
              </div>
              <Button variant="outline" onClick={resetConversation}>
                <RefreshCcw className="h-4 w-4" />
                {"\uB2E4\uC2DC \uB9CC\uB4E4\uAE30"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex min-h-[720px] flex-1 flex-col pt-6">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              {!hasUserMessages ? (
                <div className="mb-2 flex flex-wrap gap-2">
                  {suggestionChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className="rounded-full border border-[#00d4aa]/25 bg-[#00d4aa]/10 px-4 py-2 text-sm text-[#8cf5df] transition hover:border-[#00d4aa]/45 hover:bg-[#00d4aa]/15"
                      onClick={() => void submitMessage(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              ) : null}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-[#00d4aa] text-black"
                        : "bg-[#1a1a1a] text-zinc-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>

                    {message.questions && message.questions.length > 0 ? (
                      <div className="mt-3 space-y-2 border-t border-white/10 pt-3 text-sm text-zinc-300">
                        {message.questions.map((question) => (
                          <p key={question}>• {question}</p>
                        ))}
                      </div>
                    ) : null}

                    {message.kind === "workflow_generated" ? (
                      <div className="mt-4 rounded-xl border border-[#00d4aa]/25 bg-[#00d4aa]/10 p-4 text-zinc-100">
                        <div className="flex items-center gap-2 text-[#8cf5df]">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {"\uC6CC\uD06C\uD50C\uB85C\uC6B0\uAC00 \uC0DD\uC131\uB418\uC5C8\uC2B5\uB2C8\uB2E4!"}
                          </span>
                        </div>
                        <p className="mt-2 font-mono text-base">
                          {message.workflowName}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              {isLoading ? <TypingIndicator /> : null}
              <div ref={scrollRef} />
            </div>

            <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
              {error ? (
                <Alert variant="destructive">
                  <AlertTitle>
                    {"\uC624\uB958"}
                  </AlertTitle>
                  <AlertDescription className="flex flex-wrap items-center gap-3">
                    <span>{error}</span>
                    {needsSetup ? (
                      <Link
                        href="/settings"
                        className="inline-flex items-center gap-1 font-medium text-[#8cf5df]"
                      >
                        <Settings className="h-4 w-4" />
                        {"API \uD0A4 \uC124\uC815"}
                      </Link>
                    ) : null}
                  </AlertDescription>
                </Alert>
              ) : null}

              <Textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  "\uC608: \uC0BC\uC131\uC804\uC790 \uB274\uC2A4\uB97C \uD3C9\uC77C \uC624\uC804 9\uC2DC\uC5D0 \uD154\uB808\uADF8\uB7A8\uC73C\uB85C \uBCF4\uB0B4\uC918"
                }
                className="min-h-[120px]"
                disabled={isLoading}
              />

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-500">
                  {"Enter \uC804\uC1A1 / Shift+Enter \uC904\uBC14\uAFC8"}
                </p>
                <Button
                  onClick={() => void submitMessage(draft)}
                  disabled={isLoading || !draft.trim()}
                >
                  {isLoading ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizonal className="h-4 w-4" />
                  )}
                  {"\uBCF4\uB0B4\uAE30"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border-white/10 bg-[#111111] ${
            mobileTab === "chat" ? "hidden lg:flex" : "flex"
          } flex-col`}
        >
          <CardHeader className="border-b border-white/10 pb-5">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-[#00d4aa]" />
              {"\uC6CC\uD06C\uD50C\uB85C\uC6B0 \uBBF8\uB9AC\uBCF4\uAE30"}
            </CardTitle>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              {
                "\uC0DD\uC131\uB41C \uB178\uB4DC \uD750\uB984\uC744 \uBBF8\uB9AC \uD655\uC778\uD558\uACE0, \uC800\uC7A5\uB41C \uC0C1\uC138 \uD654\uBA74\uC73C\uB85C \uC774\uB3D9\uD558\uC138\uC694."
              }
            </p>
          </CardHeader>
          <CardContent className="flex min-h-[720px] flex-1 flex-col pt-6">
            {generatedWorkflow ? (
              <>
                <div className="rounded-2xl border border-[#00d4aa]/20 bg-[#00d4aa]/8 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[#7ef5da]">
                        {"Generated Workflow"}
                      </p>
                      <h3 className="mt-3 font-mono text-2xl text-zinc-100">
                        {generatedWorkflow.name}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-zinc-400">
                        {generatedWorkflow.description}
                      </p>
                    </div>
                    <CheckCircle2 className="h-6 w-6 text-[#00d4aa]" />
                  </div>
                  <p className="mt-5 rounded-xl bg-black/20 px-3 py-2 text-sm text-zinc-200">
                    {formatSchedule(generatedWorkflow)}
                  </p>
                  {generatedWorkflowId ? (
                    <p className="mt-3 text-xs text-zinc-500">
                      {
                        "\uC0DD\uC131 \uC2DC \uC790\uB3D9 \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uBC84\uD2BC\uC744 \uB20C\uB7EC \uC0C1\uC138 \uD654\uBA74\uC73C\uB85C \uC774\uB3D9\uD558\uC138\uC694."
                      }
                    </p>
                  ) : null}
                </div>

                <div className="mt-6 flex-1 overflow-y-auto pr-1">
                  <div className="space-y-4">
                    {(generatedWorkflow.nodes || []).map((node, index, nodes) => {
                      const nodeDefinition = NODE_DEFINITIONS[node.type];

                      return (
                        <div key={node.id} className="relative pl-10">
                          {index < nodes.length - 1 ? (
                            <div className="absolute left-[18px] top-11 h-[calc(100%+1rem)] w-px bg-gradient-to-b from-[#00d4aa]/50 to-transparent" />
                          ) : null}
                          <div className="absolute left-0 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#00d4aa]/25 bg-black/30 text-base">
                            {nodeDefinition?.icon || "\u25A1"}
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium text-zinc-100">
                                  {node.label}
                                </p>
                                <p className="mt-1 text-sm text-zinc-500">
                                  {nodeDefinition?.label || node.type}
                                </p>
                              </div>
                              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-zinc-400">
                                {nodeDefinition?.category || "node"}
                              </span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-zinc-400">
                              {summarizeConfig(node.config)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5">
                  <Button
                    onClick={() =>
                      generatedWorkflowId
                        ? router.push(`/workflows/${generatedWorkflowId}`)
                        : undefined
                    }
                    disabled={!generatedWorkflowId}
                  >
                    <MessageSquarePlus className="h-4 w-4" />
                    {"\uC774 \uC6CC\uD06C\uD50C\uB85C\uC6B0 \uC800\uC7A5\uD558\uAE30"}
                  </Button>
                  <Button variant="outline" onClick={resetConversation}>
                    <RefreshCcw className="h-4 w-4" />
                    {"\uB2E4\uC2DC \uB9CC\uB4E4\uAE30"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 text-center">
                <Sparkles className="h-10 w-10 text-[#00d4aa]" />
                <h3 className="mt-4 font-mono text-xl text-zinc-100">
                  {"\uC544\uC9C1 \uBBF8\uB9AC\uBCF4\uAE30\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4"}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-zinc-400">
                  {
                    "\uCC57\uC5D0 \uC790\uB3D9\uD654 \uC694\uCCAD\uC744 \uC785\uB825\uD558\uBA74 \uC624\uB978\uCABD\uC5D0 \uB178\uB4DC \uD750\uB984\uACFC \uC2A4\uCF00\uC904 \uC815\uBCF4\uAC00 \uD45C\uC2DC\uB429\uB2C8\uB2E4."
                  }
                </p>
                <Button
                  variant="outline"
                  className="mt-5"
                  onClick={() => setMobileTab("chat")}
                >
                  <ArrowRight className="h-4 w-4" />
                  {"\uCC44\uD305 \uC2DC\uC791\uD558\uAE30"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
