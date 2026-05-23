import { useEffect, useState } from "react";
import { storage } from "./lib/storage";
import type { CospendLink } from "./types/cospend";
import { SetupScreen } from "./components/SetupScreen";
import { DashboardScreen } from "./components/DashboardScreen";
import { MembersScreen } from "./components/MembersScreen";
import { BillsScreen } from "./components/BillsScreen";
import { AddBillScreen } from "./components/AddBillScreen";
import { SettlementScreen } from "./components/SettlementScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { BottomNav, type Screen } from "./components/BottomNav";
import { Toaster } from "./components/ui/sonner";
import { Settings } from "lucide-react";
import { Button } from "./components/ui/button";

export default function App() {
  const [link, setLink] = useState<CospendLink | null>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>("dashboard");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const savedLink = storage.getLink();
    setLink(savedLink);
    setInitialized(true);
  }, []);

  const handleSetupComplete = () => {
    const savedLink = storage.getLink();
    setLink(savedLink);
    setCurrentScreen("dashboard");
  };

  const handleLogout = () => {
    setLink(null);
    setCurrentScreen("dashboard");
  };

  const handleBillAdded = () => {
    setCurrentScreen("bills");
  };

  if (!initialized) {
    return null;
  }

  if (!link) {
    return <SetupScreen onSetupComplete={handleSetupComplete} />;
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-gradient-to-b from-blue-50 to-slate-50 text-slate-900">
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-white/70 bg-white/75 px-4 backdrop-blur-xl">
        <h1 className="text-lg font-semibold tracking-tight">Splitcloud</h1>
        {currentScreen !== "settings" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentScreen("settings")}
          >
            <Settings className="h-5 w-5" />
          </Button>
        )}
      </div>

      <main className="pt-14">
        {currentScreen === "dashboard" && <DashboardScreen link={link} />}
        {currentScreen === "members" && <MembersScreen link={link} />}
        {currentScreen === "bills" && <BillsScreen link={link} />}
        {currentScreen === "add-bill" && (
          <AddBillScreen link={link} onBillAdded={handleBillAdded} />
        )}
        {currentScreen === "settlement" && <SettlementScreen link={link} />}
        {currentScreen === "settings" && (
          <SettingsScreen onLogout={handleLogout} />
        )}
      </main>

      <BottomNav currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
      <Toaster />
    </div>
  );
}