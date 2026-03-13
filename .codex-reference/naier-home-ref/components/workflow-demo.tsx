"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Check, ChevronRight, Sparkles, Bell, TrendingUp } from "lucide-react"

const steps = [
  { id: "schedule", label: "스케줄", icon: "⏰" },
  { id: "news", label: "뉴스수집", icon: "📰" },
  { id: "ai", label: "AI요약", icon: "🤖" },
  { id: "telegram", label: "텔레그램", icon: "📱" },
]

const tradingData = [
  { code: "005930", change: "+2.31%", positive: true },
  { code: "000660", change: "+4.87%", positive: true },
  { code: "KOSPI", change: "-0.41%", positive: false },
]

const alerts = [
  { title: "DART 공시 감지", time: "방금" },
  { title: "AI 3줄 요약 완료", time: "2분 전" },
  { title: "디스코드 알림 전송됨", time: "5분 전" },
]

export function WorkflowDemo() {
  const [activeStep, setActiveStep] = useState(0)
  const [typedText, setTypedText] = useState("")
  const fullText = "삼성전자 관련 뉴스를 매일 아침 9시에 수집해서 AI로 요약한 후 텔레그램으로 보내줘"

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let index = 0
    const typingInterval = setInterval(() => {
      if (index <= fullText.length) {
        setTypedText(fullText.slice(0, index))
        index++
      } else {
        clearInterval(typingInterval)
      }
    }, 50)
    return () => clearInterval(typingInterval)
  }, [])

  return (
    <section id="demo" className="py-24 lg:py-32 bg-secondary/20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center mb-16"
        >
          <p className="text-sm font-medium tracking-wider text-muted-foreground uppercase mb-3">Live Demo</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground text-balance">
            실시간으로 작동하는 워크플로우
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Main Demo Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            {/* Window Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-xs font-medium tracking-wider text-muted-foreground">LIVE WORKFLOW DEMO</span>
            </div>

            {/* Natural Language Input */}
            <div className="p-6 border-b border-border">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground mb-2">자연어 입력</p>
                  <p className="text-sm text-foreground leading-relaxed min-h-[3rem]">
                    {typedText}
                    <span className="animate-pulse">|</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Generated Flow */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">Generated Flow</p>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                  <Check className="w-3 h-3" />
                  Ready
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <motion.div
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                        index === activeStep
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-secondary text-foreground"
                      }`}
                      animate={{
                        scale: index === activeStep ? 1.05 : 1,
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <span>{step.icon}</span>
                      <span className="text-sm font-medium">{step.label}</span>
                    </motion.div>
                    {index < steps.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Side Cards */}
          <div className="grid gap-4">
            {/* Trading Snapshot */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-foreground" />
                <h3 className="font-semibold text-foreground">Trading Snapshot</h3>
              </div>
              <div className="space-y-3">
                {tradingData.map((item) => (
                  <div key={item.code} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm font-mono text-foreground">{item.code}</span>
                    <span className={`text-sm font-semibold ${item.positive ? "text-green-400" : "text-red-400"}`}>
                      {item.change}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Alert Channel */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-foreground" />
                <h3 className="font-semibold text-foreground">Alert Channel</h3>
              </div>
              <div className="space-y-3">
                <AnimatePresence>
                  {alerts.map((alert, index) => (
                    <motion.div
                      key={alert.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.2 }}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <span className="text-sm text-foreground">{alert.title}</span>
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
