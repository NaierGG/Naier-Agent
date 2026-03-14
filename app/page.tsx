import type { CSSProperties } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bot,
  ChevronRight,
  Cpu,
  GitBranch,
  Globe,
  LockKeyhole,
  Mail,
  MessageSquareShare,
  ShieldCheck,
  Sparkles,
  Webhook,
  Workflow,
  Wrench
} from "lucide-react";

const heroPrompts = [
  "매일 오전 9시에 운영 현황 API를 불러와서 이메일로 보내줘",
  "웹훅으로 들어오는 주문 요청을 검증해서 디스코드에 알려줘",
  "외부 API 응답을 AI가 정리해서 텔레그램으로 보내줘"
];

const proofPoints = [
  { label: "Visual + AI", value: "대화와 노드 편집기를 함께 제공" },
  { label: "BYOK", value: "모델 키와 알림 채널은 직접 관리" },
  { label: "Composable", value: "트리거 · HTTP · AI · 액션을 자유롭게 연결" }
];

const capabilityCards: Array<{
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    eyebrow: "Automation Core",
    title: "n8n처럼 흐름을 만들고",
    description:
      "스케줄, 웹훅, HTTP 요청, 조건 분기, 템플릿 변환을 조합해서 반복 작업을 하나의 그래프로 정리합니다.",
    icon: Workflow
  },
  {
    eyebrow: "Agent Layer",
    title: "Buildmyagent처럼 AI를 끼워 넣고",
    description:
      "Gemini 기반 에이전트 태스크와 요약 노드로 입력 데이터를 읽고, 다음 액션에 맞는 결과를 자동으로 생성합니다.",
    icon: Bot
  },
  {
    eyebrow: "Execution",
    title: "실행과 운영까지 연결합니다",
    description:
      "텔레그램, 디스코드, 이메일, 웹훅 같은 액션으로 결과를 전달하고, 로그와 수동 테스트로 바로 검증합니다.",
    icon: MessageSquareShare
  }
];

const integrations: Array<{
  name: string;
  description: string;
  icon: LucideIcon;
}> = [
  { name: "Webhook", description: "외부 이벤트 진입점", icon: Webhook },
  { name: "HTTP API", description: "임의 API 호출", icon: Globe },
  { name: "Gemini", description: "AI Agent / 요약 / 가공", icon: Sparkles },
  { name: "Telegram", description: "실시간 메시지 전달", icon: MessageSquareShare },
  { name: "Discord", description: "운영 채널 알림", icon: Cpu },
  { name: "Email", description: "리포트 발송", icon: Mail },
  { name: "Node Graph", description: "시각적 흐름 편집", icon: GitBranch },
  { name: "Custom Tools", description: "점진적 확장 구조", icon: Wrench }
];

const exampleFlows = [
  {
    title: "Ops Digest",
    description:
      "매일 오전 운영 API를 호출해 핵심 수치만 정리하고, AI가 짧은 브리핑으로 바꿔 이메일로 전송합니다.",
    nodes: ["스케줄", "HTTP 요청", "AI Agent", "이메일"]
  },
  {
    title: "Webhook Triage",
    description:
      "폼/주문/이벤트 웹훅이 들어오면 내용을 템플릿으로 정리하고, 조건에 따라 디스코드 채널로 분기 전송합니다.",
    nodes: ["웹훅", "템플릿 변환", "조건 분기", "디스코드"]
  },
  {
    title: "AI Relay",
    description:
      "외부 서비스 응답을 받아 에이전트가 요약하거나 JSON으로 정리하고, 후속 시스템에 다시 웹훅으로 넘깁니다.",
    nodes: ["HTTP 요청", "AI Agent", "웹훅 / 텔레그램"]
  }
];

const securityPoints = [
  "모델 키와 알림 채널 키는 사용자가 직접 관리합니다.",
  "Naier는 오케스트레이션과 UI를 제공하고, 실행 권한은 사용자 설정을 따릅니다.",
  "워크플로우 로그를 통해 어떤 입력이 어떤 액션으로 이어졌는지 추적할 수 있습니다."
];

function fadeStyle(delay: string) {
  return { ["--naier-delay" as string]: delay } as CSSProperties;
}

function lineStyle(index: number) {
  return { ["--naier-line-index" as string]: index } as CSSProperties;
}

export default function HomePage() {
  return (
    <main className="naier-shell relative overflow-hidden text-zinc-100">
      <div className="naier-grid absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-cyan-400/10 to-transparent" />
      <div className="pointer-events-none absolute left-[-8%] top-40 h-96 w-96 rounded-full bg-emerald-400/12 blur-3xl" />
      <div className="pointer-events-none absolute right-[-8%] top-24 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-6 sm:px-8 lg:px-10">
        <header
          className="naier-fade-up flex items-center justify-between"
          style={fadeStyle("60ms")}
        >
          <Link href="/" className="font-mono text-lg tracking-[0.34em] text-white">
            NAIER
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
            <Link href="#platform" className="transition hover:text-white">
              플랫폼
            </Link>
            <Link href="#integrations" className="transition hover:text-white">
              노드
            </Link>
            <Link href="#security" className="transition hover:text-white">
              보안
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:text-white sm:inline-flex"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#04131a] transition hover:bg-cyan-50"
            >
              시작하기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="grid gap-12 pb-20 pt-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pt-20">
          <div className="space-y-8">
            <div
              className="naier-fade-up inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-4 py-2 text-sm text-cyan-100"
              style={fadeStyle("110ms")}
            >
              <Sparkles className="h-4 w-4" />
              AI Agent Builder meets Automation Workspace
            </div>

            <div className="space-y-5">
              <h1
                className="naier-fade-up max-w-4xl font-mono text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl"
                style={fadeStyle("160ms")}
              >
                워크플로우와 에이전트를
                <br />
                <span className="text-cyan-200">한 화면에서 만드는 Naier</span>
              </h1>

              <p
                className="naier-fade-up max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg"
                style={fadeStyle("220ms")}
              >
                n8n처럼 자동화 흐름을 설계하고, Buildmyagent처럼 AI를 노드에 끼워 넣으세요.
                대화로 초안을 만들고, 캔버스에서 세밀하게 다듬고, 바로 실행까지 이어집니다.
              </p>
            </div>

            <div
              className="naier-fade-up flex flex-col gap-3 sm:flex-row"
              style={fadeStyle("280ms")}
            >
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 text-base font-medium text-[#04131a] transition hover:bg-cyan-50"
              >
                워크스페이스 열기
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#showcase"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base text-zinc-100 transition hover:border-cyan-200/30 hover:bg-white/8"
              >
                예시 보기
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div
              className="naier-fade-up grid gap-3 sm:grid-cols-3"
              style={fadeStyle("340ms")}
            >
              {proofPoints.map((point) => (
                <div
                  key={point.label}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-200">
                    {point.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{point.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="naier-fade-up" style={fadeStyle("220ms")}>
            <div className="naier-panel naier-glow relative overflow-hidden rounded-[34px] p-5">
              <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
              <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="rounded-[28px] border border-white/8 bg-[#071018] p-5">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-200">
                    Prompt To Flow
                  </p>
                  <div className="naier-command-stack mt-6 font-mono text-sm leading-7 text-cyan-50">
                    {heroPrompts.map((prompt, index) => (
                      <p key={prompt} className="naier-command-line" style={lineStyle(index)}>
                        {prompt}
                      </p>
                    ))}
                  </div>
                  <div className="mt-6 rounded-[26px] border border-white/8 bg-black/25 p-4">
                    <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">
                      Generated Flow
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-zinc-100">
                      {["트리거", "HTTP/API", "AI Agent", "액션"].map((step, index) => (
                        <div key={step} className="flex items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                            {step}
                          </span>
                          {index < 3 ? <ChevronRight className="h-4 w-4 text-zinc-600" /> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[28px] border border-white/8 bg-[#08141d] p-5">
                    <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-200">
                      Runtime
                    </p>
                    <div className="mt-5 space-y-3">
                      {[
                        ["Webhook", "incoming event"],
                        ["HTTP", "api response"],
                        ["Agent", "reasoning layer"]
                      ].map(([name, tag]) => (
                        <div
                          key={name}
                          className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm text-zinc-100">{name}</span>
                            <span className="font-mono text-sm text-cyan-100">{tag}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-emerald-300/15 bg-emerald-300/8 p-5">
                    <div className="flex items-center gap-2 text-sm text-emerald-100">
                      <ShieldCheck className="h-4 w-4" />
                      Execution Policy
                    </div>
                    <div className="mt-4 space-y-3 text-sm leading-7 text-zinc-100">
                      <p>사용자 키 사용</p>
                      <p>노드 단위 테스트 가능</p>
                      <p>텔레그램 · 디스코드 · 이메일 · 웹훅 액션</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="space-y-8 py-16">
          <div className="max-w-2xl space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200">
              Platform
            </p>
            <h2 className="font-mono text-3xl text-white sm:text-4xl">
              자동화 엔진 위에 에이전트를 얹는 구조
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {capabilityCards.map((card, index) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.title}
                  className="naier-panel rounded-[30px] p-6"
                  style={fadeStyle(`${120 + index * 70}ms`)}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/8 text-cyan-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="mt-5 font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">
                    {card.eyebrow}
                  </p>
                  <h3 className="mt-3 text-xl font-medium text-white">{card.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-zinc-400">{card.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="integrations" className="space-y-8 py-16">
          <div className="max-w-2xl space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200">
              Integrations
            </p>
            <h2 className="font-mono text-3xl text-white sm:text-4xl">
              범용 자동화에 필요한 기본 블록부터 시작
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {integrations.map((integration) => {
              const Icon = integration.icon;

              return (
                <div key={integration.name} className="naier-panel rounded-[28px] p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-cyan-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-medium text-white">{integration.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {integration.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="showcase" className="space-y-8 py-16">
          <div className="max-w-2xl space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200">
              Example Flows
            </p>
            <h2 className="font-mono text-3xl text-white sm:text-4xl">
              바로 응용할 수 있는 범용 시나리오
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {exampleFlows.map((workflow) => (
              <article key={workflow.title} className="naier-panel rounded-[30px] p-6">
                <h3 className="text-xl font-medium text-white">{workflow.title}</h3>
                <p className="mt-4 text-sm leading-7 text-zinc-400">{workflow.description}</p>
                <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                  {workflow.nodes.map((node, index) => (
                    <div key={node} className="flex items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                        {node}
                      </span>
                      {index < workflow.nodes.length - 1 ? (
                        <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                      ) : null}
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="security" className="grid gap-6 py-16 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="naier-panel rounded-[32px] p-7">
            <div className="flex items-center gap-3 text-cyan-100">
              <LockKeyhole className="h-5 w-5" />
              <p className="font-mono text-xs uppercase tracking-[0.28em]">BYOK Security</p>
            </div>
            <h2 className="mt-5 font-mono text-3xl text-white sm:text-4xl">
              내 키로 실행하고, 내 데이터 흐름을 통제합니다
            </h2>

            <div className="mt-8 space-y-4">
              {securityPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"
                >
                  <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-cyan-100" />
                  <p className="text-sm leading-7 text-zinc-200">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="naier-panel rounded-[32px] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
                Positioning
              </p>
              <h3 className="mt-4 font-mono text-4xl text-white">n8n + Agent Builder</h3>
              <p className="mt-4 text-sm leading-7 text-zinc-300">
                Naier는 단순한 채팅 앱이 아니라, 노드 기반 자동화 엔진 위에 AI 에이전트 레이어를
                얹는 제품을 목표로 합니다.
              </p>
            </div>

            <div className="naier-panel rounded-[32px] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
                Ideal For
              </p>
              <div className="mt-5 space-y-3 text-sm leading-7 text-zinc-300">
                <p>반복 작업을 API와 메시징으로 연결하고 싶은 팀</p>
                <p>에이전트 결과를 실제 액션으로 이어가고 싶은 운영자</p>
                <p>코드와 노코드 사이에서 빠르게 자동화를 검증하고 싶은 빌더</p>
              </div>
            </div>

            <div className="naier-panel rounded-[32px] p-6">
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
                Start Now
              </p>
              <p className="mt-5 text-sm leading-7 text-zinc-300">
                먼저 간단한 HTTP + AI + 알림 플로우부터 만들고, 점차 팀에 맞는 커스텀 노드를
                늘려가면 됩니다.
              </p>
              <Link
                href="/signup"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-[#04131a] transition hover:bg-cyan-50"
              >
                Naier 시작하기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
