const BACKEND_URL = "https://push.paucar.eu/";

export async function notifySplitCloud(params: {
  projectId: string;
  actor: string;
  title: string;
  body: string;
}) {
  try {
    await fetch(`${BACKEND_URL}/splitcloud/notify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...params,
        url: "https://cloud.paucar.eu/splitcloud",
      }),
    });
  } catch (err) {
    console.warn("Notification failed", err);
  }
}