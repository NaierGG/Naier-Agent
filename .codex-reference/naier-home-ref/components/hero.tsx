"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-secondary/50 via-background to-background" />
      
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 mb-8"
          >
            <Sparkles className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">완전 무료 • API 키 직접 사용 • 데이터 판매 없음</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance"
          >
            주식 자동화,
            <br />
            <span className="text-muted-foreground">이제 말로 하세요</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            AI에게 원하는 자동화를 말하면 즉시 실행 가능한 워크플로우가 만들어집니다.
            <br className="hidden sm:block" />
            코딩 없이, 복잡한 설정 없이.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 px-8 gap-2">
              무료로 시작하기
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary gap-2">
              <Play className="w-4 h-4" />
              데모 보기
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 grid grid-cols-3 gap-8 border-t border-border pt-8"
          >
            <div className="text-center">
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-1">BYOK</p>
              <p className="text-sm text-muted-foreground">사용자 키 직접 사용</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-1">GEMINI FLASH</p>
              <p className="text-sm text-muted-foreground">개인 투자자용 AI 분석</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase mb-1">VERCEL CRON</p>
              <p className="text-sm text-muted-foreground">매분 스케줄 자동 실행</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
