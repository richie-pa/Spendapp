import { storage } from "./storage";
import type { CospendLink, Member } from "../types/cospend";

const BACKEND_URL = "https://push.paucar.eu/";
const VAPID_PUBLIC_KEY = "BOwiN0NRhCDEIgRiqjSgzfmVdDoHgIu4-tdgWgJF35f7rdTOc0NZsC_zTUNMUdC9YXFNCp7Vfytb8AIWQhOq0gM";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);

  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function subscribeToSplitCloudPush(params: {
  link: CospendLink;
  members: Member[];
}) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Push notifications are not supported here");
  }

  const memberId = storage.getCurrentMember();
  const member = params.members.find((m) => m.id === memberId);

  if (!member) {
    throw new Error("Select who you are in Members first");
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error("Notification permission was not granted");
  }

  const registration = await navigator.serviceWorker.register("/splitcloud/sw.js");

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  const response = await fetch(`${BACKEND_URL}/splitcloud/subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      projectId: params.link.token,
      username: member.name,
      subscription,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to register push subscription");
  }

  return response.json();
}