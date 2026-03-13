"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export function CTA() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-card border border-border p-8 lg:p-16"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-secondary via-transparent to-transparent" />
          
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground text-balance">
              지금 바로 시작하세요
            </h2>
            <p className="mt-4 text-muted-foreground">
              5분 안에 첫 번째 워크플로우를 만들 수 있습니다.
              <br className="hidden sm:block" />
              무료로 시작하고, 필요할 때 업그레이드하세요.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 px-8 gap-2">
                무료로 시작하기
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary">
                문서 보기
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
