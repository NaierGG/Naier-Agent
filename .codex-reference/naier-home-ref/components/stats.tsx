"use client"

import { motion } from "framer-motion"

const stats = [
  { value: "10,000+", label: "활성 워크플로우" },
  { value: "98%", label: "실행 성공률" },
  { value: "50ms", label: "평균 응답 시간" },
  { value: "24/7", label: "자동 실행" },
]

export function Stats() {
  return (
    <section className="py-16 border-y border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl lg:text-4xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
