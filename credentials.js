window.addEventListener("DOMContentLoaded", async () => {
  const credentials = await window.electronAPI.getCredentials();

  document.getElementById("username").value = credentials?.username || "";
  document.getElementById("password").value = credentials?.password || "";

  document.getElementById("save").addEventListener("click", async () => {
    const nextCredentials = {
      username: document.getElementById("username").value,
      password: document.getElementById("password").value,
    };

    await window.electronAPI.saveCredentials(nextCredentials);
    await window.electronAPI.closeCurrentWindow();
  });

  document.getElementById("cancel").addEventListener("click", async () => {
    await window.electronAPI.closeCurrentWindow();
  });
});
