// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const { ipcRenderer, shell } = require('electron')

ipcRenderer.on("update", (event, arg) => {
  document.getElementById("updateTime").innerText = `View Refreshed: ${new Date().toLocaleString()}`
  document.getElementById("jobs").innerHTML = '';
  let list = [...arg.entries()].map(([job, {culprits, url, status}]) => {
    return (
      `<li class="job ${status}">
        <div>
          <div>
            <a target="_blank" class='jenkins-job' href='${url}'>${job}</a>
          </div>
          <div class="culpritlist">
            ${culprits.map(culprit => `<img class="culprit" src="${culprit}.jpg" />`).join('')}
          </div>
        </div>
      </li>`
    )
  }).join('');

  // ipcRenderer.on('clear', () => {
  //   document.getElementById("jobs").innerHTML = '';
  // });


  document.getElementById("jobs").insertAdjacentHTML('beforeend', list);
  // document.getElementById("jobs").innerHTML = list;

  // document.addEventListener('click', function (event) {
  //   debugger;
  //   if (event.target.matches('.jenkins-job')) {
  //     // Run your code to open a modal
  //     event.preventDefault();
  //     shell.openExternal(event.target.getAttribute('href'));
  //   }
  // }, false);




  // debugger;
  // let list = arg.map(job => `<li><a target="_blank" class='jenkins-job' href='${job.url}'>${job.name}</a></li>`).join('')
  // document.getElementById("jobs").innerHTML = list;
  // document.addEventListener('click', function (event) {
  //   if (event.target.matches('.jenkins-job')) {
  //     // Run your code to open a modal
  //     event.preventDefault();
  //     shell.openExternal(event.target.getAttribute('href'));
  //   }
  // }, false);

});


document.addEventListener('click', function (event) {
  if (event.target.matches('.jenkins-job')) {
    // Run your code to open a modal
    event.preventDefault();
    shell.openExternal(event.target.getAttribute('href'));
  }
}, false);
