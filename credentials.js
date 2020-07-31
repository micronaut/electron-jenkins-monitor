const { remote, ipcRenderer } = require('electron');


window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('save').addEventListener('click', function(e) {
    let credentials = {};
    credentials['username'] = document.getElementById("username").value
    credentials['password'] = document.getElementById("password").value
    ipcRenderer.send("saveCredentials", credentials)
    const window = remote.getCurrentWindow();
    window.close();
  })
  document.getElementById('cancel').addEventListener('click', function(e) {
    const window = remote.getCurrentWindow();
    window.close();
  })
})
