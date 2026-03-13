import type { CSSProperties } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BellDot,
  Bot,
  CandlestickChart,
  ChevronRight,
  Disc3,
  FileSearch2,
  LineChart,
  LockKeyhole,
  Mail,
  MessageSquareShare,
  Newspaper,
  Radar,
  ShieldCheck,
  Sparkles,
  TimerReset,
  Webhook
} from "lucide-react";

const heroPrompts = [
  "매일 오전 8시 반도체 뉴스만 추려서 텔레그램으로 보내줘",
  "DART 공시가 올라오면 핵심 포인트만 AI가 3줄로 요약해줘",
  "관심 종목이 5% 이상 움직이면 바로 디스코드에 알려줘"
];

const proofPoints = [
  { label: "BYOK", value: "내 API 키로 직접 실행" },
  { label: "Realtime", value: "뉴스 · 공시 · 가격 흐름 감시" },
  { label: "Actionable", value: "알림에서 끝나지 않는 자동 실행" }
];

const featureTiles = [
  {
    eyebrow: "Signal In",
    title: "뉴스, 공시, 가격을 하나의 입력 흐름으로",
    description:
      "네이버 금융 뉴스, DART 공시, 국내 주가 데이터를 끌어와서 하나의 자동화 파이프라인으로 연결합니다.",
    icon: Newspaper
  },
  {
    eyebrow: "Reasoning",
    title: "AI가 읽고, 분류하고, 투자자 관점으로 정리",
    description:
      "Gemini를 본인 키로 호출해서 요약, 감성 판단, 조건 분기까지 한 번에 처리합니다.",
    icon: Bot
  },
  {
    eyebrow: "Action Out",
    title: "텔레그램, 디스코드, 이메일로 즉시 전달",
    description:
      "매번 앱을 켜둘 필요 없이 원하는 채널에 바로 결과를 보내고, 필요하면 웹훅으로 외부 시스템도 연결합니다.",
    icon: MessageSquareShare
  }
];

const integrations: Array<{
  name: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    name: "DART",
    description: "기업 공시 실시간 수집",
    icon: FileSearch2
  },
  {
    name: "네이버 금융",
    description: "종목 뉴스 소스",
    icon: Newspaper
  },
  {
    name: "Gemini",
    description: "요약 · 해석 · 분기",
    icon: Sparkles
  },
  {
    name: "Telegram",
    description: "실시간 푸시 알림",
    icon: BellDot
  },
  {
    name: "Discord",
    description: "팀 채널 공유",
    icon: Disc3
  },
  {
    name: "Email",
    description: "정리된 리포트 발송",
    icon: Mail
  },
  {
    name: "Webhook",
    description: "외부 시스템 연동",
    icon: Webhook
  },
  {
    name: "KR Price",
    description: "국내 종목 가격 모니터링",
    icon: CandlestickChart
  }
];

const workflowExamples: Array<{
  title: string;
  description: string;
  accent: string;
  nodes: string[];
  icon: LucideIcon;
}> = [
  {
    title: "Morning Brief",
    description:
      "장 시작 전 핵심 뉴스만 골라 투자 포인트를 짧게 정리해서 개인 텔레그램으로 전달합니다.",
    accent: "from-cyan-400/20 via-emerald-400/10 to-transparent",
    nodes: ["스케줄", "뉴스 수집", "AI 요약", "텔레그램"],
    icon: TimerReset
  },
  {
    title: "Disclosure Watch",
    description:
      "특정 기업의 DART 공시를 감시하고, 중요 키워드가 포함된 공시만 골라 디스코드에 올립니다.",
    accent: "from-orange-400/20 via-amber-400/10 to-transparent",
    nodes: ["스케줄", "DART", "키워드 필터", "AI 분석", "디스코드"],
    icon: Radar
  },
  {
    title: "Price Trigger",
    description:
      "관심 종목 등락률이 조건을 넘기면 이메일과 웹훅으로 동시에 전달해 후속 액션을 이어갑니다.",
    accent: "from-fuchsia-400/20 via-violet-400/10 to-transparent",
    nodes: ["스케줄", "가격 조회", "조건 분기", "이메일", "웹훅"],
    icon: LineChart
  }
];

const securityPoints = [
  "모든 AI 호출은 본인의 Gemini API 키로 실행됩니다.",
  "알림 채널과 데이터 키는 사용자별 설정에만 저장됩니다.",
  "Naier는 자동화 오케스트레이션만 담당하고, 투자 데이터를 판매하지 않습니다."
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
            <Link href="#signal-flow" className="transition hover:text-white">
              제품
            </Link>
            <Link href="#integrations" className="transition hover:text-white">
              연동
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
              무료로 시작하기
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
              AI 자동화를 투자자의 실행 흐름으로 바꾸는 운영 레이어
            </div>

            <div className="space-y-5">
              <h1
                className="naier-fade-up max-w-4xl font-mono text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl"
                style={fadeStyle("160ms")}
              >
                투자 자동화의
                <br />
                <span className="text-cyan-200">새 기본값, Naier</span>
              </h1>

              <p
                className="naier-fade-up max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg"
                style={fadeStyle("220ms")}
              >
                뉴스 수집, DART 공시 감시, 가격 조건 체크, AI 요약, 알림 발송까지.
                말을 입력하면 바로 실행 가능한 자동화 플로우가 만들어집니다.
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
                href="#workflow-showcase"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base text-zinc-100 transition hover:border-cyan-200/30 hover:bg-white/8"
              >
                예시 플로우 보기
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

              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[28px] border border-white/8 bg-[#071018] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-200">
                        Command Layer
                      </p>
                      <p className="mt-2 text-sm text-zinc-400">
                        대화가 바로 자동화 구조로 변환됩니다.
                      </p>
                    </div>
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                      Live Draft
                    </span>
                  </div>

                  <div className="naier-command-stack mt-6 font-mono text-sm leading-7 text-cyan-50">
                    {heroPrompts.map((prompt, index) => (
                      <p
                        key={prompt}
                        className="naier-command-line"
                        style={lineStyle(index)}
                      >
                        {prompt}
                      </p>
                    ))}
                  </div>

                  <div className="mt-6 rounded-[26px] border border-white/8 bg-black/25 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xs uppercase tracking-[0.24em] text-zinc-500">
                        Generated Flow
                      </p>
                      <span className="rounded-full bg-emerald-400/12 px-3 py-1 text-xs text-emerald-200">
                        Ready to run
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-zinc-100">
                      {["트리거", "데이터 수집", "AI 처리", "실행 채널"].map((step, index) => (
                        <div key={step} className="flex items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                            {step}
                          </span>
                          {index < 3 ? (
                            <ChevronRight className="h-4 w-4 text-zinc-600" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[28px] border border-white/8 bg-[#08141d] p-5">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Radar className="h-4 w-4 text-cyan-200" />
                      Market Radar
                    </div>
                    <div className="mt-5 space-y-3">
                      {[
                        ["005930", "+2.31%", "news surge"],
                        ["000660", "+4.87%", "earnings watch"],
                        ["KOSPI", "-0.41%", "macro drift"]
                      ].map(([name, value, tag]) => (
                        <div
                          key={name}
                          className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm text-zinc-100">{name}</span>
                            <span className="font-mono text-sm text-cyan-100">{value}</span>
                          </div>
                          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
                            {tag}
                          </p>
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
                      <p>본인 키 사용</p>
                      <p>조건 분기 완료</p>
                      <p>텔레그램 · 디스코드 · 이메일 대응</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 py-6 md:grid-cols-3">
          {[
            {
              value: "3 min",
              label: "첫 자동화를 만들기까지 걸리는 평균 시간"
            },
            {
              value: "0 infra",
              label: "서버와 스케줄러를 직접 만질 필요 없는 구성"
            },
            {
              value: "100%",
              label: "사용자 BYOK 기반으로 비용과 데이터 흐름 제어"
            }
          ].map((stat, index) => (
            <div
              key={stat.label}
              className="naier-panel naier-fade-up rounded-[28px] p-6"
              style={fadeStyle(`${140 + index * 70}ms`)}
            >
              <p className="font-mono text-3xl text-white">{stat.value}</p>
              <p className="mt-3 text-sm leading-7 text-zinc-400">{stat.label}</p>
            </div>
          ))}
        </section>

        <section id="signal-flow" className="space-y-8 py-16">
          <div className="naier-fade-up max-w-2xl space-y-4" style={fadeStyle("100ms")}>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200">
              Signal To Action
            </p>
            <h2 className="font-mono text-3xl text-white sm:text-4xl">
              보기 좋은 랜딩이 아니라, 바로 실행되는 투자 워크스페이스
            </h2>
            <p className="text-base leading-8 text-zinc-400">
              Naier는 데이터를 모아 보여주는 데서 끝나지 않습니다. 감지, 요약, 조건 판단,
              전달까지 한 번에 묶어 실제 행동으로 이어지게 만듭니다.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="grid gap-5">
              {featureTiles.map((tile, index) => {
                const Icon = tile.icon;

                return (
                  <article
                    key={tile.title}
                    className="naier-panel naier-fade-up rounded-[30px] p-6"
                    style={fadeStyle(`${120 + index * 70}ms`)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/8 text-cyan-100">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-3">
                        <p className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">
                          {tile.eyebrow}
                        </p>
                        <h3 className="text-xl font-medium text-white">{tile.title}</h3>
                        <p className="text-sm leading-7 text-zinc-400">{tile.description}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="naier-panel naier-fade-up rounded-[30px] p-6" style={fadeStyle("260ms")}>
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
                Workflow DNA
              </p>
              <h3 className="mt-5 text-2xl font-medium text-white">
                자연어에서 실행 그래프까지
              </h3>
              <div className="mt-8 space-y-4">
                {[
                  {
                    title: "입력",
                    description: "사용자의 문장을 트리거, 데이터 소스, 액션으로 분해"
                  },
                  {
                    title: "생성",
                    description: "AI가 노드와 엣지를 조합해 실행 가능한 플로우로 구성"
                  },
                  {
                    title: "테스트",
                    description: "노드 단위 실행과 로그를 통해 바로 검증"
                  },
                  {
                    title: "자동화",
                    description: "스케줄과 웹훅까지 연결해 지속 실행"
                  }
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4"
                  >
                    <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {item.title}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-zinc-300">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="integrations" className="space-y-8 py-16">
          <div className="naier-fade-up max-w-2xl space-y-4" style={fadeStyle("100ms")}>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200">
              Integrations
            </p>
            <h2 className="font-mono text-3xl text-white sm:text-4xl">
              필요한 채널만 깔끔하게 연결하는 현대적 자동화 스택
            </h2>
            <p className="text-base leading-8 text-zinc-400">
              요즘 랜딩처럼 아이콘만 늘어놓지 않고, 각 연동이 플로우에서 어떤 역할을 하는지도
              명확하게 보이도록 구성했습니다.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {integrations.map((integration, index) => {
              const Icon = integration.icon;

              return (
                <div
                  key={integration.name}
                  className="naier-panel naier-fade-up rounded-[28px] p-5"
                  style={fadeStyle(`${120 + index * 45}ms`)}
                >
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

        <section id="workflow-showcase" className="space-y-8 py-16">
          <div className="naier-fade-up max-w-2xl space-y-4" style={fadeStyle("100ms")}>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200">
              Example Flows
            </p>
            <h2 className="font-mono text-3xl text-white sm:text-4xl">
              바로 복제하고 싶은 자동화 시나리오
            </h2>
            <p className="text-base leading-8 text-zinc-400">
              단순한 카드 나열 대신, 어떤 흐름으로 실행되는지 한눈에 읽히는 구조로 정리했습니다.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {workflowExamples.map((workflow, index) => {
              const Icon = workflow.icon;

              return (
                <article
                  key={workflow.title}
                  className="naier-panel naier-fade-up overflow-hidden rounded-[30px]"
                  style={fadeStyle(`${120 + index * 80}ms`)}
                >
                  <div className={`h-28 bg-gradient-to-br ${workflow.accent}`} />
                  <div className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-100">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">
                          Automation
                        </p>
                        <h3 className="mt-1 text-xl font-medium text-white">{workflow.title}</h3>
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-7 text-zinc-400">{workflow.description}</p>

                    <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-zinc-300">
                      {workflow.nodes.map((node, nodeIndex) => (
                        <div key={node} className="flex items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                            {node}
                          </span>
                          {nodeIndex < workflow.nodes.length - 1 ? (
                            <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="security" className="grid gap-6 py-16 lg:grid-cols-[1.08fr_0.92fr]">
          <div
            className="naier-panel naier-fade-up rounded-[32px] p-7"
            style={fadeStyle("120ms")}
          >
            <div className="flex items-center gap-3 text-cyan-100">
              <LockKeyhole className="h-5 w-5" />
              <p className="font-mono text-xs uppercase tracking-[0.28em]">BYOK Security</p>
            </div>
            <h2 className="mt-5 font-mono text-3xl text-white sm:text-4xl">
              내 키로 실행하고, 내 흐름을 통제합니다
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">
              Naier는 실행 환경을 정리해 주는 레이어입니다. 실제 AI 호출과 알림 채널 연결은
              사용자 키를 기준으로 돌아가며, 플랫폼 자체가 투자 데이터의 소유권을 가져가지
              않습니다.
            </p>

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
            <div
              className="naier-panel naier-fade-up rounded-[32px] p-6"
              style={fadeStyle("180ms")}
            >
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
                Pricing
              </p>
              <h3 className="mt-4 font-mono text-4xl text-white">Free to start</h3>
              <p className="mt-4 text-sm leading-7 text-zinc-300">
                플랫폼 사용 비용은 무료입니다. AI 비용은 BYOK 구조로 사용자 사용량에 따라 직접
                관리합니다.
              </p>
            </div>

            <div
              className="naier-panel naier-fade-up rounded-[32px] p-6"
              style={fadeStyle("240ms")}
            >
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
                Ideal For
              </p>
              <div className="mt-5 space-y-3 text-sm leading-7 text-zinc-300">
                <p>장 시작 전에 핵심 뉴스 브리핑이 필요한 개인 투자자</p>
                <p>공시와 가격 트리거를 즉시 채널로 받아야 하는 팀</p>
                <p>코드보다 빠르게 AI 자동화를 테스트하고 싶은 운영자</p>
              </div>
            </div>

            <div
              className="naier-panel naier-fade-up rounded-[32px] p-6"
              style={fadeStyle("300ms")}
            >
              <p className="font-mono text-xs uppercase tracking-[0.28em] text-cyan-200">
                Start Now
              </p>
              <p className="mt-5 text-sm leading-7 text-zinc-300">
                첫 워크플로우를 만들고 싶다면 지금 바로 회원가입 후 Gemini 키만 등록하면 됩니다.
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

        <footer className="border-t border-white/8 py-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-sm tracking-[0.32em] text-white">NAIER</p>
              <p className="mt-2 text-sm text-zinc-500">
                Automation workspace for signal-driven investors
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-sm text-zinc-500">
              <Link href="/login" className="transition hover:text-white">
                로그인
              </Link>
              <Link href="/signup" className="transition hover:text-white">
                회원가입
              </Link>
              <Link href="/dashboard" className="transition hover:text-white">
                대시보드
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
