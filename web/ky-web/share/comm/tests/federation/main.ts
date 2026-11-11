const showError = (error: unknown) => {
  document.getElementById("runtime-error")!.textContent = String(error);
};
window.addEventListener("error", (event) => showError(event.error));
window.addEventListener("unhandledrejection", (event) =>
  showError(event.reason),
);

void Promise.all([
  import("comm/resource"),
  import("comm/management"),
  import("comm/utils"),
  import("comm/session"),
])
  .then(async ([, , , session]) => {
    session.setSessionId("comm-smoke-first");
    await import("./App");
  })
  .catch(showError);
