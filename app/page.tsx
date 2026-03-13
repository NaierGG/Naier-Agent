import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Bot,
  ChartCandlestick,
  ChevronRight,
  CircleDollarSign,
  DatabaseZap,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Workflow
} from "lucide-react";

const heroPrompts = [
  "삼성전자 뉴스 매일 아침 9시에 텔레그램으로 보내줘",
  "DART 공시 나오면 AI가 요약해서 알려줘",
  "내 종목 5% 오르면 바로 알림"
];

const steps = [
  {
    number: "01",
    title: "원하는 자동화를 AI에게 말하기",
    description:
      "복잡한 조건문 대신 자연어로 요청하면, 주식 자동화 의도를 바로 해석합니다."
  },
  {
    number: "02",
    title: "생성된 워크플로우 확인",
    description:
      "트리거, 뉴스 수집, AI 요약, 알림 전송까지 노드 흐름으로 깔끔하게 정리됩니다."
  },
  {
    number: "03",
    title: "활성화하면 자동 실행",
    description:
      "Vercel Cron과 Supabase 기반으로 설정한 스케줄에 맞춰 자동으로 실행됩니다."
  }
];

const integrations = [
  { name: "DART", tag: "공시", accent: "#00d4aa" },
  { name: "네이버 금융", tag: "뉴스", accent: "#00d4aa" },
  { name: "텔레그램", tag: "알림", accent: "#ff6b35" },
  { name: "디스코드", tag: "웹훅", accent: "#00d4aa" },
  { name: "Gmail", tag: "이메일", accent: "#ff6b35" },
  { name: "Gemini AI", tag: "분석", accent: "#00d4aa" },
  { name: "키움증권", tag: "Coming Soon", accent: "#ff6b35" }
];

const workflowExamples = [
  {
    title: "📰 매일 아침 주식 뉴스 브리핑",
    description:
      "시장 시작 전에 핵심 뉴스를 요약해서 개인 투자자 관점의 브리핑으로 전달합니다.",
    nodes: ["스케줄", "네이버뉴스", "AI요약", "텔레그램"],
    accent: "from-[#00d4aa]/20 to-transparent"
  },
  {
    title: "📋 DART 공시 즉시 알림",
    description:
      "중요 공시만 걸러 AI가 요약하고 디스코드 채널에 바로 올려 빠르게 대응할 수 있게 돕습니다.",
    nodes: ["스케줄", "DART수집", "키워드필터", "AI요약", "디스코드"],
    accent: "from-[#ff6b35]/20 to-transparent"
  },
  {
    title: "📈 관심종목 주가 모니터링",
    description:
      "관심 종목의 등락률을 추적하다가 조건을 만족하면 이메일로 즉시 보고합니다.",
    nodes: ["스케줄", "주가조회", "조건분기", "이메일"],
    accent: "from-[#00d4aa]/20 to-transparent"
  }
];

const byokPoints = [
  "모든 AI 처리는 본인의 Gemini API 키로 실행",
  "주식 데이터 API도 본인 키 사용",
  "StockFlow AI는 실행만 관리, 데이터 수집 없음"
];

const pricingPoints = [
  "워크플로우 무제한",
  "실행 횟수 무제한 (Vercel 한도 내)",
  "BYOK 구조로 AI 비용은 사용량만큼만 발생",
  "소스코드 공개 예정"
];

function fadeStyle(delay: string) {
  return { ["--landing-delay" as string]: delay } as CSSProperties;
}

function lineStyle(index: number) {
  return { ["--line-index" as string]: index } as CSSProperties;
}

export default function HomePage() {
  return (
    <main className="landing-shell relative overflow-hidden text-[#f4f5ef]">
      <div className="landing-grid absolute inset-0 opacity-35" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#00d4aa]/10 to-transparent" />
      <div className="pointer-events-none absolute right-[-10%] top-28 h-72 w-72 rounded-full bg-[#ff6b35]/10 blur-3xl" />
      <div className="pointer-events-none absolute left-[-10%] top-56 h-96 w-96 rounded-full bg-[#00d4aa]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-6 pb-16 pt-6 sm:px-8 lg:px-10">
        <header
          className="landing-fade-up flex items-center justify-between"
          style={fadeStyle("80ms")}
        >
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#00d4aa]">
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-sm tracking-[0.26em] text-[#00d4aa]">
                STOCKFLOW
              </p>
              <p className="text-sm text-zinc-400">AI Agent Builder</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
            <Link href="#demo" className="transition hover:text-white">
              데모
            </Link>
            <Link href="#integrations" className="transition hover:text-white">
              연동
            </Link>
            <Link href="#pricing" className="transition hover:text-white">
              가격
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
              className="inline-flex items-center gap-2 rounded-full bg-[#00d4aa] px-4 py-2 text-sm font-medium text-[#04110d] transition hover:bg-[#14e4bc]"
            >
              무료로 시작하기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="grid gap-12 pb-20 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20">
          <div className="landing-fade-up space-y-8" style={fadeStyle("140ms")}>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#00d4aa]/20 bg-[#00d4aa]/10 px-4 py-2 text-sm text-[#9df7e5]">
              <Sparkles className="h-4 w-4" />
              완전 무료 • API 키 직접 사용 • 데이터 판매 없음
            </div>

            <div className="space-y-5">
              <h1 className="font-mono text-5xl font-semibold leading-[1.04] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
                주식 자동화,
                <br />
                <span className="text-[#00d4aa]">이제 말로 하세요</span>
              </h1>

              <p className="max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
                AI에게 원하는 자동화를 말하면 즉시 실행 가능한 워크플로우가 만들어집니다.
                코딩 없이, 복잡한 설정 없이.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#00d4aa] px-6 py-4 text-base font-medium text-[#04110d] transition hover:bg-[#14e4bc]"
              >
                무료로 시작하기
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#demo"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-base text-zinc-100 transition hover:border-[#00d4aa]/40 hover:bg-[#00d4aa]/8"
              >
                데모 보기
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "BYOK", value: "사용자 키 직접 사용" },
                { label: "Gemini Flash", value: "개인 투자자용 AI 분석" },
                { label: "Vercel Cron", value: "매분 스케줄 자동 실행" }
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"
                >
                  <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00d4aa]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="landing-fade-up" style={fadeStyle("220ms")}>
            <div className="landing-panel landing-glow relative overflow-hidden rounded-[32px] p-5">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00d4aa]/60 to-transparent" />
              <div className="landing-scan pointer-events-none absolute left-0 right-0 top-0 h-24 bg-gradient-to-b from-[#00d4aa]/12 to-transparent" />

              <div className="flex items-center justify-between border-b border-white/8 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b35]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f6c445]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#00d4aa]" />
                </div>
                <div className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">
                  Live Workflow Demo
                </div>
              </div>

              <div className="grid gap-4 pt-5 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[28px] border border-white/8 bg-[#080808] p-5">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <MessageSquareText className="h-4 w-4 text-[#00d4aa]" />
                    자연어 입력
                  </div>
                  <div className="landing-type-stack mt-4 font-mono text-sm leading-7 text-[#b8fff0] sm:text-base">
                    {heroPrompts.map((prompt, index) => (
                      <p key={prompt} className="landing-type-line" style={lineStyle(index)}>
                        → {prompt}
                      </p>
                    ))}
                  </div>

                  <div className="mt-8 space-y-3 rounded-3xl border border-white/8 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00d4aa]">
                        Generated Flow
                      </p>
                      <span className="rounded-full border border-[#00d4aa]/20 bg-[#00d4aa]/10 px-3 py-1 text-xs text-[#97f7e4]">
                        Ready
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-200">
                      {["스케줄", "뉴스수집", "AI요약", "텔레그램"].map((node, index) => (
                        <div key={node} className="flex items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5">
                            {node}
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
                  <div className="rounded-[28px] border border-white/8 bg-[#080808] p-5">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <ChartCandlestick className="h-4 w-4 text-[#ff6b35]" />
                      Trading Snapshot
                    </div>
                    <div className="mt-5 space-y-3">
                      {[
                        ["005930", "+2.31%", "#00d4aa"],
                        ["000660", "+4.87%", "#00d4aa"],
                        ["KOSPI", "-0.41%", "#ff6b35"]
                      ].map(([name, value, color]) => (
                        <div
                          key={name}
                          className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
                        >
                          <span className="font-mono text-sm text-zinc-200">{name}</span>
                          <span style={{ color }} className="font-mono text-sm">
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-[#ff6b35]/20 bg-[#120b08] p-5">
                    <div className="flex items-center gap-2 text-sm text-[#ffc0aa]">
                      <BellRing className="h-4 w-4 text-[#ff6b35]" />
                      Alert Channel
                    </div>
                    <p className="mt-4 font-mono text-sm leading-7 text-zinc-100">
                      DART 공시 감지
                      <br />
                      AI 3줄 요약 완료
                      <br />
                      디스코드 알림 전송됨
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="space-y-8 py-16">
          <div className="landing-fade-up max-w-2xl space-y-4" style={fadeStyle("100ms")}>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00d4aa]">
              How It Works
            </p>
            <h2 className="font-mono text-3xl text-white sm:text-4xl">
              자동화는 세 단계면 충분합니다
            </h2>
            <p className="text-base leading-8 text-zinc-400">
              뉴스 브리핑, 공시 알림, 급등락 모니터링까지. 자연어 입력부터 실행까지
              흐름이 단순하게 이어집니다.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="landing-panel landing-fade-up rounded-[30px] p-6"
                style={fadeStyle(`${120 + index * 80}ms`)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm tracking-[0.24em] text-[#00d4aa]">
                    {step.number}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-400">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-medium text-white">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-zinc-400">{step.description}</p>
              </div>
            ))}
          </div>

          <div
            className="landing-panel landing-fade-up rounded-[30px] p-6"
            style={fadeStyle("260ms")}
          >
            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-center">
              {[
                "원하는 자동화를 AI에게 말하기",
                "생성된 워크플로우 확인",
                "활성화하면 자동 실행"
              ].map((item, index, array) => (
                <div key={item} className="contents">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-center text-sm text-zinc-200">
                    {item}
                  </div>
                  {index < array.length - 1 ? (
                    <div className="hidden font-mono text-[#00d4aa] md:block">→</div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="integrations" className="space-y-8 py-16">
          <div className="landing-fade-up max-w-2xl space-y-4" style={fadeStyle("100ms")}>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00d4aa]">
              Supported Integrations
            </p>
            <h2 className="font-mono text-3xl text-white sm:text-4xl">
              필요한 도구를 한 흐름으로 연결하세요
            </h2>
            <p className="text-base leading-8 text-zinc-400">
              공시, 뉴스, AI 분석, 메신저, 이메일까지. 개인 투자자에게 필요한 연동만
              먼저 담았습니다.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {integrations.map((integration, index) => (
              <div
                key={integration.name}
                className="landing-panel landing-fade-up rounded-[28px] p-5"
                style={fadeStyle(`${120 + index * 50}ms`)}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20 font-mono text-sm"
                  style={{ color: integration.accent }}
                >
                  {integration.name.slice(0, 2).toUpperCase()}
                </div>
                <h3 className="mt-5 text-lg font-medium text-white">{integration.name}</h3>
                <p className="mt-2 text-sm text-zinc-400">{integration.tag}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8 py-16">
          <div className="landing-fade-up max-w-2xl space-y-4" style={fadeStyle("100ms")}>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00d4aa]">
              Example Workflows
            </p>
            <h2 className="font-mono text-3xl text-white sm:text-4xl">
              바로 쓸 수 있는 자동화 예시
            </h2>
            <p className="text-base leading-8 text-zinc-400">
              아침 브리핑부터 공시 감지, 관심 종목 모니터링까지 자주 쓰는 흐름을
              기본 카드로 보여드립니다.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {workflowExamples.map((workflow, index) => (
              <article
                key={workflow.title}
                className="landing-panel landing-fade-up overflow-hidden rounded-[30px]"
                style={fadeStyle(`${120 + index * 80}ms`)}
              >
                <div className={`h-28 bg-gradient-to-br ${workflow.accent}`} />
                <div className="p-6">
                  <h3 className="text-xl font-medium text-white">{workflow.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-zinc-400">
                    {workflow.description}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {workflow.nodes.map((node) => (
                      <span
                        key={node}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300"
                      >
                        {node}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div
            className="landing-panel landing-fade-up rounded-[32px] p-7"
            style={fadeStyle("120ms")}
          >
            <div className="flex items-center gap-3 text-[#00d4aa]">
              <LockKeyhole className="h-5 w-5" />
              <p className="font-mono text-xs uppercase tracking-[0.28em]">
                BYOK Security
              </p>
            </div>
            <h2 className="mt-5 font-mono text-3xl text-white sm:text-4xl">
              내 API 키, 내 데이터
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">
              모든 AI 처리와 알림 전송은 사용자가 직접 등록한 키로 실행됩니다.
              StockFlow AI는 자동화 흐름을 관리할 뿐, 투자 데이터를 수집하거나 판매하지
              않습니다.
            </p>

            <div className="mt-8 space-y-4">
              {byokPoints.map((point) => (
                <div
                  key={point}
                  className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"
                >
                  <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-[#00d4aa]" />
                  <p className="text-sm leading-7 text-zinc-200">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div
              className="landing-panel landing-fade-up rounded-[32px] p-6"
              style={fadeStyle("180ms")}
            >
              <div className="flex items-center gap-3 text-[#ff6b35]">
                <DatabaseZap className="h-5 w-5" />
                <p className="font-mono text-xs uppercase tracking-[0.28em]">
                  Zero Collection
                </p>
              </div>
              <p className="mt-5 text-sm leading-7 text-zinc-300">
                저장되는 것은 워크플로우 구조와 실행 로그 중심입니다. 실제 AI 사용 비용은
                본인 키 사용량에 따라 직접 통제합니다.
              </p>
            </div>

            <div
              className="landing-panel landing-fade-up rounded-[32px] p-6"
              style={fadeStyle("240ms")}
            >
              <div className="flex items-center gap-3 text-[#00d4aa]">
                <Bot className="h-5 w-5" />
                <p className="font-mono text-xs uppercase tracking-[0.28em]">
                  Investor Friendly
                </p>
              </div>
              <p className="mt-5 text-sm leading-7 text-zinc-300">
                한국 개인투자자 기준으로 자주 쓰는 뉴스, 공시, 메신저 알림 중심의
                자동화를 먼저 지원합니다.
              </p>
            </div>

            <div
              className="landing-panel landing-fade-up rounded-[32px] p-6"
              style={fadeStyle("300ms")}
            >
              <div className="flex items-center gap-3 text-[#ff6b35]">
                <CircleDollarSign className="h-5 w-5" />
                <p className="font-mono text-xs uppercase tracking-[0.28em]">
                  Cost Control
                </p>
              </div>
              <p className="mt-5 text-sm leading-7 text-zinc-300">
                서비스 비용은 무료. AI 호출 비용은 원하는 모델과 빈도에 맞춰 직접
                조절할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        <section id="pricing" className="py-16">
          <div
            className="landing-panel landing-fade-up rounded-[36px] p-8 sm:p-10"
            style={fadeStyle("120ms")}
          >
            <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00d4aa]">
                  Pricing
                </p>
                <h2 className="mt-4 font-mono text-4xl text-white sm:text-5xl">
                  완전 무료
                </h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">
                  워크플로우를 마음껏 만들고 실행하세요. 인프라는 무료 스택 위에서
                  동작하고, AI 비용은 본인 키 사용량만 부담하면 됩니다.
                </p>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-black/20 p-6">
                <div className="flex items-center gap-2 text-[#00d4aa]">
                  <Sparkles className="h-4 w-4" />
                  <p className="font-mono text-xs uppercase tracking-[0.24em]">
                    Included
                  </p>
                </div>
                <div className="mt-5 space-y-3">
                  {pricingPoints.map((point) => (
                    <div key={point} className="flex items-start gap-3">
                      <span className="mt-2 h-2 w-2 rounded-full bg-[#00d4aa]" />
                      <p className="text-sm leading-7 text-zinc-200">{point}</p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/signup"
                  className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#00d4aa] px-5 py-3 text-sm font-medium text-[#04110d] transition hover:bg-[#14e4bc]"
                >
                  지금 시작하기
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col gap-6 border-t border-white/8 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[#00d4aa]">
              <Workflow className="h-4 w-4" />
            </div>
            <div>
              <p className="font-mono text-sm tracking-[0.26em] text-[#00d4aa]">
                STOCKFLOW AI
              </p>
              <p className="text-sm text-zinc-500">
                Bloomberg terminal meets modern SaaS
              </p>
            </div>
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
        </footer>
      </div>
    </main>
  );
}
