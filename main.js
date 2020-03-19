// Modules to control application life and create native browser window
const { app, BrowserWindow, Notification, Tray } = require("electron");
const path = require("path");

let mainWindow = null;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 500,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // mainWindow.webContents.on('did-finish-load', () => {
  // mainWindow.webContents.send('ping', 'whoooooooh!')
  // })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

async function getCulpritList(brokenJobs) {
  let brokenJobCulpritMap = brokenJobs.map(job => {
    const culpritRequest = net.request(
      `http://jenkins-as01.gale.web:8080/job/${job.name}/lastBuild/api/json`
    );
    let jobDetails = "";
    culpritRequest.on("response", response => {
      response.on("data", chunk => {
        jobDetails += chunk.toString();
      });
      response.on("end", () => {
        console.log(jobDetails);
        let { culprits } = JSON.parse(jobDetails);
        console.log(culprits);
        let names = culprits.map(({ fullName }) => fullName);
        return names;
      });
    });
    culpritRequest.end();
  });
}

app.on("ready", function() {
  const { net } = require("electron");
  setInterval(() => {
    let jenkinsURLs = [
      "http://jenkins-as01.gale.web:8080/view/Omni-Radiator/api/json",
    ];

    jenkinsURLs.forEach(url => {
      const request = net.request(url);
      let body = "";
      request.on("response", response => {
        // console.log(`STATUS: ${response.statusCode}`);
        // console.log(`HEADERS: ${JSON.stringify(response.headers)}`);
        response.on("data", chunk => {
          console.log(`BODY: ${chunk}`);
          body += chunk.toString();
        });
        response.on("end", () => {
          console.log("No more data in response.");
          let brokenJobs = JSON.parse(body).jobs.filter(
            job => job.color === "red"
          );
          console.log(brokenJobs.length);

          try {
            mainWindow.webContents.send("clear", {});
          } catch (e) {
            console.log("webcontents was destoyed");
          }
          // new Notification('Title', {
          //   body: 'Lorem Ipsum Dolor Sit Amet'
          // }).show()

          brokenJobs.map(job => {
            let jobCulpritsMap = new Map();
            const culpritRequest = net.request(
              `http://jenkins-as01.gale.web:8080/job/${job.name}/lastBuild/api/json`
            );
            let jobDetails = "";
            culpritRequest.on("response", response => {
              response.on("data", chunk => {
                jobDetails += chunk.toString();
              });
              response.on("end", () => {
                console.log(jobDetails);
                let { culprits } = JSON.parse(jobDetails);
                console.log(culprits);
                let names = culprits.map(({ fullName }) => fullName);
                jobCulpritsMap.set(job.name, { names: names, url: job.url });
                try {
                  mainWindow.webContents.send("update", jobCulpritsMap);
                } catch (e) {
                  console.log("webcontents was destoyed");
                }
                if (brokenJobs?.length) {
                  app.dock.setBadge(brokenJobs.length + "");
                  app.dock.setIcon(path.join(__dirname, "jenkinsfire.png"));
                } else {
                  app.dock.setBadge("");
                  app.dock.setIcon(path.join(__dirname, "jenkins.png"));
                }
              });
            });
            culpritRequest.end();
          });

        });
      });
      request.end();
    });
  }, 5000);
});

