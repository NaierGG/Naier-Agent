"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Workflow } from "lucide-react"

const navigation = [
  { name: "데모", href: "#demo" },
  { name: "기능", href: "#features" },
  { name: "가격", href: "#pricing" },
  { name: "문서", href: "#docs" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-foreground">
            <Workflow className="w-5 h-5 text-background" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-wide text-foreground">STOCKFLOW</span>
            <span className="text-[10px] text-muted-foreground tracking-wider">AI Agent Builder</span>
          </div>
        </div>

        <div className="hidden lg:flex lg:gap-x-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex lg:items-center lg:gap-x-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
            로그인
          </Button>
          <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90">
            무료로 시작하기
          </Button>
        </div>

        <button
          type="button"
          className="lg:hidden p-2 text-muted-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-background border-b border-border">
          <div className="px-6 py-4 space-y-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <Button variant="ghost" size="sm" className="w-full justify-center text-muted-foreground">
                로그인
              </Button>
              <Button size="sm" className="w-full bg-foreground text-background hover:bg-foreground/90">
                무료로 시작하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
