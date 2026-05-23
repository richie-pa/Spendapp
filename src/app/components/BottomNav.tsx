import { Home, Users, Receipt, PlusCircle, TrendingUp, Settings } from "lucide-react";
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
  const navItems: Array<{ screen: Screen; icon: typeof Home; label: string }> = [
    { screen: "dashboard", icon: Home, label: "Home" },
    { screen: "members", icon: Users, label: "Members" },
    { screen: "add-bill", icon: PlusCircle, label: "Add" },
    { screen: "bills", icon: Receipt, label: "Bills" },
    { screen: "settlement", icon: TrendingUp, label: "Settle" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ screen, icon: Icon, label }) => {
          const isActive = currentScreen === screen;
          return (
            <button
              key={screen}
              onClick={() => onScreenChange(screen)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Icon className={cn("h-6 w-6", screen === "add-bill" && "h-7 w-7")} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
