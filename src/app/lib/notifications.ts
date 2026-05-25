const BACKEND_URL = "https://push.paucar.eu";

export async function notifySplitCloud(params: {
  projectId: string;
  actor: string;
  recipients: string[];
  title: string;
  body: string;
}) {
  const response = await fetch(`${BACKEND_URL}/splitcloud/notify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...params,
      url: "https://cloud.paucar.eu/splitcloud",
    }),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(
      `Notification failed: ${response.status} ${response.statusText}${message ? ` - ${message}` : ""}`
    );
  }

  return response.json().catch(() => null);
}