import { Home, Users, Receipt, PlusCircle, TrendingUp } from "lucide-react";
import { createTranslator } from "../lib/i18n";
import { storage } from "../lib/storage";
import { cn } from "./ui/utils";

export type Screen =
  | "dashboard"
  | "members"
  | "bills"
  | "add-bill"
  | "settlement"
  | "settings";

interface BottomNavProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

export function BottomNav({ currentScreen, onScreenChange }: BottomNavProps) {
  const t = createTranslator(storage.getLanguage());

  const navItems: Array<{ screen: Screen; icon: typeof Home; label: string }> = [
    { screen: "dashboard", icon: Home, label: t("home") },
    { screen: "members", icon: Users, label: t("members") },
    { screen: "add-bill", icon: PlusCircle, label: t("add") },
    { screen: "bills", icon: Receipt, label: t("bills") },
    { screen: "settlement", icon: TrendingUp, label: t("settle") },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-lg items-center gap-1 rounded-[28px] border border-white/70 bg-white/85 px-2 py-2 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur-xl">
        {navItems.map(({ screen, icon: Icon, label }) => {
          const isActive = currentScreen === screen;
          return (
            <button
              key={screen}
              onClick={() => onScreenChange(screen)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2.5 transition-all duration-200 active:scale-95",
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className={cn("h-5 w-5", screen === "add-bill" && "h-6 w-6")} />
              <span className="text-[11px] font-medium leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
