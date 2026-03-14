import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Header({
  onOpenMenu,
  userEmail
}: {
  onOpenMenu: () => void;
  userEmail: string;
}) {
  return (
    <header className="border-b border-white/10 bg-[#0a0a0a]/90 px-4 py-4 backdrop-blur sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onOpenMenu}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <p className="font-mono text-sm text-primary">
                Naier Control Panel
              </p>
              <p className="text-xs text-zinc-500">
                {
                  "\uC778\uC99D\uB41C \uB300\uC2DC\uBCF4\uB4DC \uC601\uC5ED\uC785\uB2C8\uB2E4."
                }
              </p>
            </div>
          </div>
        </div>
        <div className="hidden rounded-full border border-white/10 bg-[#111111] px-4 py-2 text-xs text-zinc-400 sm:block">
          {userEmail}
        </div>
      </div>
    </header>
  );
}
