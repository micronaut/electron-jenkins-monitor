// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const { ipcRenderer, shell } = require('electron')
const { version}  = require('./package.json');


ipcRenderer.on("update", (event, arg) => {
  document.getElementsByClassName('loader')[0].classList.add('hide')
  document.getElementById("updateTime").innerText = `View Refreshed: ${new Date().toLocaleString()}`
  document.getElementById("jobs").innerHTML = '';
  let list = [...arg.entries()].map(([job, {culprits, url, status, reason}]) => {
    return (
      `<li class="job ${status}">
        <div>
          <div>
            <input type="checkbox" class="build-select" data-job="${job}"/>
            <a target="_blank" class='jenkins-job' href='${url}'>${job}</a>
          </div>
          <div class="culpritlist">
            ${culprits.map(culprit => `<img class="culprit" src="assets/images/${culprit}.jpg" />`).join('')}
          </div>
          <div class="reason">${reason}</div>
        </div>
      </li>`
    )
  }).join('');

  document.getElementById('heading').innerHTML = `Jenkins Monitor - v${version}`

  document.getElementById("jobs").insertAdjacentHTML('beforeend', list);

  if (list.length === 0) {
    document.getElementsByClassName('nothing-to-see')[0].classList.remove('hide')
    document.getElementById('build-selected-jobs').classList.add('hide')
  } else {
    document.getElementsByClassName('nothing-to-see')[0].classList.add('hide')
    document.getElementById('build-selected-jobs').classList.remove('hide')
  }

});

document.addEventListener('click', function (event) {
  if (event.target.className === 'build-select') {
    ipcRenderer.sendSync('pauseUpdateInterval', {});
  }
  else if (event.target instanceof HTMLButtonElement) {
    let selectedJobs = [...document.querySelectorAll('.build-select:checked')].map(checkbox => checkbox.getAttribute('data-job'));
    [...document.querySelectorAll('.build-select:checked')].forEach(checkbox => checkbox.checked = false);
    ipcRenderer.sendSync('runSelected', selectedJobs);
  } else if (event.target.matches('.jenkins-job')) {
    // Run your code to open a modal
    event.preventDefault();
    shell.openExternal(event.target.getAttribute('href'));
  }
}, false);
