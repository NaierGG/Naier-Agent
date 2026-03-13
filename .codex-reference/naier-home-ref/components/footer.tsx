import Link from "next/link"
import { Workflow } from "lucide-react"

const footerLinks = {
  product: [
    { name: "기능", href: "#features" },
    { name: "가격", href: "#pricing" },
    { name: "데모", href: "#demo" },
    { name: "문서", href: "#docs" },
  ],
  company: [
    { name: "소개", href: "#about" },
    { name: "블로그", href: "#blog" },
    { name: "채용", href: "#careers" },
    { name: "연락처", href: "#contact" },
  ],
  legal: [
    { name: "이용약관", href: "#terms" },
    { name: "개인정보처리방침", href: "#privacy" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/20">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Logo & Description */}
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-foreground">
                <Workflow className="w-4 h-4 text-background" />
              </div>
              <span className="font-semibold text-foreground">STOCKFLOW</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI 에이전트로 주식 자동화를 쉽게.
              <br />
              코딩 없이 워크플로우를 만드세요.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">제품</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">회사</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">법적 고지</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2026 STOCKFLOW. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Twitter
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              GitHub
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Discord
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
