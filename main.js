// Modules to control application life and create native browser window
const {app, BrowserWindow, Notification, Tray} = require('electron')
const path = require('path')

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 300,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('ready', function() {
  const { net } = require('electron')
  setInterval(() => {
    const request = net.request('http://jenkins-as01.gale.web:8080/view/Omni-Radiator/api/json')
    let body = '';
    request.on('response', (response) => {
      console.log(`STATUS: ${response.statusCode}`)
      console.log(`HEADERS: ${JSON.stringify(response.headers)}`)
      response.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`)
        body += chunk.toString();
      })
      response.on('end', () => {
        console.log('No more data in response.')
        let brokenJobs = JSON.parse(body).jobs.filter(job => job.color === 'red')
        console.log(brokenJobs.length)
        // new Notification('Title', {
        //   body: 'Lorem Ipsum Dolor Sit Amet'
        // }).show()
        if (brokenJobs?.length) {
          app.dock.setBadge(brokenJobs.length + '')
          app.dock.setIcon(path.join(__dirname, 'jenkinsfire.png'))
        } else {
          app.dock.setBadge('');
          app.dock.setIcon(path.join(__dirname, 'jenkins.png'))
        }
      })
    })
    request.end()
  }, 60000);
 
})

