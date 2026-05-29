import { createTranslator, getLanguageLabel } from "../lib/i18n";
import { storage, type AppLanguage } from "../lib/storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface LanguageSelectorProps {
  onLanguageChange?: () => void;
}

export function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const language = storage.getLanguage();
  const t = createTranslator(language);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{t("language")}</p>

      <Select
        value={language}
        onValueChange={(value) => {
          storage.setLanguage(value as AppLanguage);
          onLanguageChange?.();
        }}
      >
        <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white">
          <SelectValue placeholder={t("pleaseChooseLanguage")} />
        </SelectTrigger>

        <SelectContent className="rounded-2xl border-slate-200">
          <SelectItem value="en">{getLanguageLabel("en")}</SelectItem>
          <SelectItem value="de">{getLanguageLabel("de")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}