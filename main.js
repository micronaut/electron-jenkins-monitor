// Modules to control application life and create native browser window
const { app, BrowserWindow, Notification, Tray, net } = require("electron");
const path = require("path");
const nameToImageFileNameMap = {
  "abhishek.bhasin": "abhishek.bhasin",
  abhasin: "abhishek.bhasin",
  "alex.rebain": "alex.rebain",
  "alexander.rebain": "alex.rebain",
  arebain: "alex.rebain",
  "alyssa.poirier": "alyssa.poirier",
  apoirier: "alyssa.poirier",
  "anshuman.ambasht": "anshumanambasht",
  anshumanambasht: "anshumanambasht",
  "dan.muszynski": "dan.muszynski",
  dmuszyns: "dan.muszynski",
  "daniel.michon": "daniel.michon",
  dmichon: "daniel.michon",
  eannamal: "elamaran.annamalai",
  "elamaran.annamalai": "elamaran.annamalai",
  edanows: "eric.danowski",
  edanowsk: "eric.danowski",
  "eric.danowski": "eric.danowski",
  hdash: "himanshu.dash",
  "himanshu.dash": "himanshu.dash",
  "james.miazek": "jim",
  jim: "jim",
  "jim.miazek": "jim",
  jmiazek: "jim",
  "james.trammell": "james.trammell",
  jtrammel: "james.trammell",
  jamie: "jsmylny",
  "jamie.smylnycky": "jsmylny",
  jsmylny: "jsmylny",
  jquasne: "jeff.quasney",
  "kitcha.thirunavukkarasu": "kitcha.thirunavukkarasu",
  "krishnamoorthy.thirunavukarasu": "kitcha.thirunavukkarasu",
  kthirun: "kitcha.thirunavukkarasu",
  "maksuda.zaman": "maksuda.zaman",
  mzaman: "maksuda.zaman",
  pkrishna: "prabu",
  prabu: "prabu",
  "prabu.krishnakumar": "prabu",
  "priya.tilavi": "priya.tilavi",
  "ramanathan.krishnamoorthy": "ramanathan.krishnamoorthy",
  rkrishna: "ramanathan.krishnamoorthy",
  rwang: "rui.wang",
  "rui.wang": "rui.wang",
  spola: "spola",
  "sujana.pola": "spola",
  tsposito: "tsposito",
  unknown: "unknown"
};

let mainWindow = null;

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 880,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    }
  });

  mainWindow.on('show', () => {
    updateFromRadiator();
  })

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");



  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

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

app.on("ready", function() {
  setInterval(updateFromRadiator, 30000);

  // setInterval(() => {
  //   let jenkinsURLs = [
  //     "http://jenkins-as01.gale.web:8080/view/Omni-Radiator/api/json",
  //   ];

  //   jenkinsURLs.forEach(url => {
  //     const request = net.request(url);

  //     request.on('error', (e) => {
  //       new Notification({
  //         title: 'Error',
  //         body: `${e.message} (${url})`,
  //       }).show()
  //     });

  //     let body = "";
  //     request.on("response", response => {
  //       // console.log(`STATUS: ${response.statusCode}`);
  //       // console.log(`HEADERS: ${JSON.stringify(response.headers)}`);
  //       response.on("data", chunk => {
  //         console.log(`BODY: ${chunk}`);
  //         body += chunk.toString();
  //       });
  //       response.on("end", () => {
  //         console.log("No more data in response.");
  //         let brokenJobs = JSON.parse(body).jobs.filter(
  //           job => job.color === "red"
  //         );
  //         console.log(brokenJobs.length);

  //         try {
  //           mainWindow.webContents.send("clear", {});
  //         } catch (e) {
  //           console.log("webcontents was destoyed");
  //         }
  //         // new Notification('Title', {
  //         //   body: 'Lorem Ipsum Dolor Sit Amet'
  //         // }).show()

  //         if (brokenJobs?.length === 0) {
  //           app.dock.setBadge("");
  //           app.dock.setIcon(path.join(__dirname, "jenkins.png"));
  //         }

  //         brokenJobs.map(job => {
  //           let jobCulpritsMap = new Map();
  //           const culpritRequest = net.request(
  //             `http://jenkins-as01.gale.web:8080/job/${job.name}/lastBuild/api/json`
  //           );
  //           let jobDetails = "";
  //           culpritRequest.on("response", response => {
  //             response.on("data", chunk => {
  //               jobDetails += chunk.toString();
  //             });
  //             response.on("end", () => {
  //               console.log(jobDetails);
  //               let { culprits } = JSON.parse(jobDetails);
  //               console.log(culprits);
  //               let names = culprits.map(({ fullName }) => fullName);
  //               jobCulpritsMap.set(job.name, { names: names, url: job.url });
  //               try {
  //                 mainWindow.webContents.send("update", jobCulpritsMap);
  //               } catch (e) {
  //                 console.log("webcontents was destoyed");
  //               }
  //               if (brokenJobs?.length > 0) {
  //                 app.dock.setBadge(brokenJobs.length + "");
  //                 app.dock.setIcon(path.join(__dirname, "jenkinsfire.png"));
  //               } else {
  //                 app.dock.setBadge("");
  //                 app.dock.setIcon(path.join(__dirname, "jenkins.png"));
  //               }
  //             });
  //           });
  //           culpritRequest.end();
  //         });

  //       });
  //     });
  //     request.end();
  //   });
  // }, 5000);
});


function updateFromRadiator() {

  Promise.all(
    [
      "http://jenkins-as01.gale.web:8080/view/Omni-Radiator/api/json",
      "http://jenkins-as01.gale.web:8080/view/CentralServices-Radiator/api/json"
    ].map(url => {
      return new Promise(function(resolve, reject) {
        const request = net.request(url);

        request.on("error", e => {
          new Notification({
            title: "Error",
            body: `${e.message} (${url})`
          }).show();
        });
        let body = "";
        request.on("response", response => {
          response.on("data", chunk => {
            body += chunk.toString();
          });
          response.on("end", () => {
            resolve(body);
          });
        });
        request.end();
      });
    })
  ).then(data => {
    let brokenJobs = data.map(results => {
      return JSON.parse(results).jobs.filter(job => job.color === "red");
    });

    console.log(brokenJobs.flat().length);
    if (brokenJobs.length === 0) {
      app.dock.setBadge("");
      app.dock.setIcon(path.join(__dirname, "jenkins.png"));
    } else {
      Promise.all(
        brokenJobs.flat().map(brokenJob => {
          return new Promise(function(resolve, reject) {
            const request = net.request(
              `http://jenkins-as01.gale.web:8080/job/${brokenJob.name}/lastBuild/api/json`
            );
            let body = "";
            request.on("response", response => {
              response.on("data", chunk => {
                body += chunk.toString();
              });
              response.on("end", () => {
                resolve(body);
              });
            });
            request.end();
          });
        })
      ).then(data => {
        let brokenJobsMap = new Map();
        data.forEach(result => {
          let flattenedActionsObject = Object.assign(
            ...JSON.parse(result).actions
          );
          let culprits = [];
          if (flattenedActionsObject.claimedBy) {
            culprits.push(
              nameToImageFileNameMap[flattenedActionsObject.claimedBy] ||
                "unknown"
            );
          } else if (JSON.parse(result).culprits.length > 0) {
            JSON.parse(result).culprits.forEach(({ fullName }) => {
              culprits.push(nameToImageFileNameMap(fullName) || "unknown");
            });
          } else {
            culprits.push("unknown");
          }
          let jobName = JSON.parse(result).fullDisplayName.substr(
            0,
            JSON.parse(result).fullDisplayName.indexOf("#")
          );
          brokenJobsMap.set(jobName, {
            culprits: culprits,
            url: JSON.parse(result).url,
            status: flattenedActionsObject.claimed ? "claimed" : "broken"
          });
        });
        // console.log(brokenJobsMap);
        try {
          mainWindow.webContents.send("update", brokenJobsMap);
        } catch (e) {
          console.log("webcontents was destoyed");
        }
        app.dock.setBadge(data.length + "");
        app.dock.setIcon(path.join(__dirname, "jenkinsFire.png"));
      });
    }
  });
}
