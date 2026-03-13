"use client"

import { motion } from "framer-motion"
import { MessageSquare, Zap, Shield, Clock, Bot, TrendingUp } from "lucide-react"

const features = [
  {
    icon: MessageSquare,
    title: "자연어 입력",
    description: "복잡한 코드 없이 말로 워크플로우를 생성하세요. AI가 의도를 이해하고 즉시 실행 가능한 자동화를 만들어 드립니다.",
  },
  {
    icon: Zap,
    title: "즉시 실행",
    description: "생성된 워크플로우는 바로 실행됩니다. 설정이나 배포 과정 없이 클릭 한 번으로 자동화를 시작하세요.",
  },
  {
    icon: Shield,
    title: "데이터 보안",
    description: "BYOK(Bring Your Own Key) 방식으로 API 키는 사용자만 관리합니다. 데이터는 절대 외부로 유출되지 않습니다.",
  },
  {
    icon: Clock,
    title: "스케줄 자동화",
    description: "Vercel Cron으로 매분, 매시간, 매일 자동 실행됩니다. 설정한 시간에 정확히 워크플로우가 동작합니다.",
  },
  {
    icon: Bot,
    title: "AI 분석",
    description: "Gemini Flash가 뉴스, 공시, 재무제표를 분석하고 핵심 정보만 요약해 드립니다. 빠르고 정확한 인사이트를 제공합니다.",
  },
  {
    icon: TrendingUp,
    title: "실시간 알림",
    description: "텔레그램, 디스코드, 슬랙으로 즉시 알림을 받으세요. 중요한 순간을 놓치지 않습니다.",
  },
]

export function Features() {
  return (
    <section id="features" className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-medium tracking-wider text-muted-foreground uppercase mb-3">Features</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground text-balance">
            필요한 모든 기능을 제공합니다
          </h2>
          <p className="mt-4 text-muted-foreground">
            코딩 없이 강력한 주식 자동화 워크플로우를 구축하세요
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative p-6 rounded-2xl border border-border bg-card hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-secondary mb-4">
                <feature.icon className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
