import { useState } from "react";
import { CospendApi } from "../lib/cospend-api";
import { storage } from "../lib/storage";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { AlertCircle, Wallet } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";

interface SetupScreenProps {
  onSetupComplete: () => void;
}

export function SetupScreen({ onSetupComplete }: SetupScreenProps) {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddProject = () => {
    storage.clearLink();
    onLogout();
  };

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
      name: project.name || "Unnamed project",
      link: parsedLink,
    });

    onSetupComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Splitcloud Manager</CardTitle>
          <CardDescription>
            Enter your Splitcloud project link to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link">Splitcloud Link</Label>
              <Input
                id="link"
                type="text"
                placeholder="cospend://host/token/password"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground">
                Format: cospend://host/token/password
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>How to get your link:</strong>
                <br />
                1. Open your Cospend project in Nextcloud
                <br />
                2. Go to project settings
                <br />
                3. Enable public sharing
                <br />
                4. Copy the public link
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connecting..." : "Connect"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
