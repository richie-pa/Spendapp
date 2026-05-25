self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  event.waitUntil(
    self.registration.showNotification(data.title || "SplitCloud", {
      body: data.body || "New update",
      icon: "/splitcloud/icon.png",
      badge: "/splitcloud/icon.png",
      data: {
        url: data.url || "/splitcloud",
      },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || "/splitcloud")
  );
});