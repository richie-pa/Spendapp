import { useState } from "react";
import { CospendApi } from "../lib/cospend-api";
import { createTranslator } from "../lib/i18n";
import { storage } from "../lib/storage";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { AlertCircle, Wallet } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { LanguageSelector } from "./LanguageSelector";

interface SetupScreenProps {
  onSetupComplete: () => void;
}

export function SetupScreen({ onSetupComplete }: SetupScreenProps) {
  const t = createTranslator(storage.getLanguage());
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const parsedLink = CospendApi.parseCospendLink(link.trim());
      const api = new CospendApi(parsedLink);

    const project = await api.getProject();

    storage.saveLink(parsedLink);

    storage.saveProject({
      id: parsedLink.token,
      name: project.name || t("noActiveProject"),
      link: parsedLink,
    });

    onSetupComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToConnect"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-end">
            <LanguageSelector onLanguageChange={() => window.location.reload()} />
          </div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">{t("setupTitle")}</CardTitle>
          <CardDescription>
            {t("setupDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link">{t("splitcloudLink")}</Label>
              <Input
                id="link"
                type="text"
                placeholder={t("splitcloudLinkPlaceholder")}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                {t("linkFormat")}
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>{t("howToGetLink")}</strong>
                <br />
                1. {t("setupStep1")}
                <br />
                2. {t("setupStep2")}
                <br />
                3. {t("setupStep3")}
                <br />
                4. {t("setupStep4")}
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("connecting") : t("connect")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
