// Modules to control application life and create native browser window
const { app, BrowserWindow, Notification, Tray, net, Menu, MenuItem } = require("electron");
const path = require("path");
const Store = require('./store.js');
const nameToImageFileNameMap = {
  "abhishek.bhasin": "abhishek.bhasin",
  "Bhasin, Abhishek": "abhishek.bhasin",
  abhasin: "abhishek.bhasin",
  "alex.rebain": "alex.rebain",
  "alexander.rebain": "alex.rebain",
  arebain: "alex.rebain",
  "alyssa.poirier": "alyssa.poirier",
  apoirier: "alyssa.poirier",
  "anshuman.ambasht": "anshumanambasht",
  "aanshuman": "anshumanambasht",
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
  "guri.zejnullahi": "guri.zejnullahi",
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
  jtmckinley: "jtmckinley",
  "james.mckinley": "jtmckinley",
  "joe.bishop": "joe.bishop",
  "kannan.krishnamurthy": "kannan.krishnamurthy",
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
  "ramkumar.vetrivelu": "ramkumar.vetrivelu",
  ramkumar: "ramkumar.vetrivelu",
  rwang: "rui.wang",
  "rui.wang": "rui.wang",
  "Selva.Kumar": "Selva.Kumar",
  "sgovil": "shubhamgovil", 
  "shubhamgovil": "shubhamgovil",
  spola: "spola",
  "sujana.pola": "spola",
  tsposito: "tsposito",
  unknown: "unknown"
};

const store = new Store({
  // We'll call our data file 'user-preferences'
  configName: 'user-preferences',
  defaults: {
    radiatorsToMonitor: [
      "http://jenkins-as01.gale.web:8080/view/Omni-Radiator/api/json",
      "http://jenkins-as01.gale.web:8080/view/CentralServices-Radiator/api/json"
    ],
    windowBounds: { width: 800, height: 400 }
  }
});

let mainWindow = null;
let disableNotifications;

function createWindow() {
  // Create the browser window.
  let { width, height } = store.get('windowBounds');
  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, "preload.js"),
    }
  });

  mainWindow.on('resize', () => {
    // The event doesn't pass us the window size, so we call the `getBounds` method which returns an object with
    // the height, width, and x and y coordinates.
    let { width, height } = mainWindow.getBounds();
    // Now that we have them, save them using the `set` method.
    store.set('windowBounds', { width, height });
  });


  mainWindow.on('show', () => {
    updateFromRadiator();
  })

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");


//TODO:  Add a refresh button
//TODO: fix the issue where sometimes on open it doesn't load
//TODO: ADD OCEAN TEAMWill you be able to make one for ocean team?
/*
http://jenkins-as01.ci.gale.web:8080/view/Ocean-EnvironmentHealth-Radiator/
http://jenkins-as01.ci.gale.web:8080/view/Ocean-Radiator/
11:29
these two are the ones they use
*/



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



const menuArray = [
  {
    label: 'Settings',
    submenu: [
      {
        label: 'Central Services Radiator',
        type: 'checkbox',
        checked: store.get('radiatorsToMonitor').includes("http://jenkins-as01.gale.web:8080/view/CentralServices-Radiator/api/json"),
        click: (evt) => { 
          let currentRadiatorsToMonitor = store.get('radiatorsToMonitor');
          if (evt.checked) { 
            store.set('radiatorsToMonitor', [...currentRadiatorsToMonitor, "http://jenkins-as01.gale.web:8080/view/CentralServices-Radiator/api/json"]);
          } else {
            store.set('radiatorsToMonitor', currentRadiatorsToMonitor.filter(radiator => radiator !== "http://jenkins-as01.gale.web:8080/view/CentralServices-Radiator/api/json"));
          }
          updateFromRadiator();
        }
      },
      {
        label: 'Ocean Environment Health Radiator',
        type: 'checkbox',
        checked: store.get('radiatorsToMonitor').includes("http://jenkins-as01.ci.gale.web:8080/view/Ocean-EnvironmentHealth-Radiator/api/json"),
        click: (evt) => { 
          let currentRadiatorsToMonitor = store.get('radiatorsToMonitor');
          if (evt.checked) { 
            store.set('radiatorsToMonitor', [...currentRadiatorsToMonitor, "http://jenkins-as01.ci.gale.web:8080/view/Ocean-EnvironmentHealth-Radiator/api/json"]);
          } else {
            store.set('radiatorsToMonitor', currentRadiatorsToMonitor.filter(radiator => radiator !== "http://jenkins-as01.ci.gale.web:8080/view/Ocean-EnvironmentHealth-Radiator/api/json"));
          }
          updateFromRadiator();
        }
      },
      {
        label: 'Ocean Radiator',
        type: 'checkbox',
        checked: store.get('radiatorsToMonitor').includes("http://jenkins-as01.ci.gale.web:8080/view/Ocean-Radiator/api/json"),
        click: (evt) => { 
          let currentRadiatorsToMonitor = store.get('radiatorsToMonitor');
          if (evt.checked) { 
            store.set('radiatorsToMonitor', [...currentRadiatorsToMonitor, "http://jenkins-as01.ci.gale.web:8080/view/Ocean-Radiator/api/json"]);
          } else {
            store.set('radiatorsToMonitor', currentRadiatorsToMonitor.filter(radiator => radiator !== "http://jenkins-as01.ci.gale.web:8080/view/Ocean-Radiator/api/json"));
          }
          updateFromRadiator();
        }
      },
      {
        label: 'Omni Radiator',
        type: 'checkbox',
        checked: store.get('radiatorsToMonitor').includes("http://jenkins-as01.gale.web:8080/view/Omni-Radiator/api/json"),
        click: (evt) => { 
          let currentRadiatorsToMonitor = store.get('radiatorsToMonitor');
          if (evt.checked) { 
            store.set('radiatorsToMonitor', [...currentRadiatorsToMonitor, "http://jenkins-as01.gale.web:8080/view/Omni-Radiator/api/json"]);
          } else {
            store.set('radiatorsToMonitor', currentRadiatorsToMonitor.filter(radiator => radiator !== "http://jenkins-as01.gale.web:8080/view/Omni-Radiator/api/json"));
          }
          updateFromRadiator();
        }
      },
      {
        label: 'QA Radiator',
        type: 'checkbox',
        checked: store.get('radiatorsToMonitor').includes("http://jenkins-as01.gale.web:8080/view/Omni-Automation-QAI-Radiator/api/json"),
        click: (evt) => { 
          let currentRadiatorsToMonitor = store.get('radiatorsToMonitor');
          if (evt.checked) { 
            store.set('radiatorsToMonitor', [...currentRadiatorsToMonitor, "http://jenkins-as01.gale.web:8080/view/Omni-Automation-QAI-Radiator/api/json"]);
          } else {
            store.set('radiatorsToMonitor', currentRadiatorsToMonitor.filter(radiator => radiator !== "http://jenkins-as01.gale.web:8080/view/Omni-Automation-QAI-Radiator/api/json"));
          }
          updateFromRadiator();
        }
      },
      {type:'separator'}, 
      {
        label: 'Disable Notications',
        type: 'checkbox',
        checked: false,
        click: (evt) => { 
          disableNotifications = evt.checked;
        }
      },
      {
      label: 'Quit',
      role: 'quit'
    }
    ],
  }
];
const menu = Menu.buildFromTemplate(menuArray);
Menu.setApplicationMenu(menu);


app.on("ready", function() {
  setInterval(updateFromRadiator, 10000);
});


function updateFromRadiator() {

  let radiatorsToMonitor = store.get('radiatorsToMonitor');
  Promise.all(
    radiatorsToMonitor.map(url => {
      return new Promise(function(resolve, reject) {
        const request = net.request(url);

        request.on("error", e => {
          if (!disableNotifications) {
            new Notification({
              title: "Error",
              body: `${e.message} (${url})`
            }).show();
          }
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
      return JSON.parse(results).jobs.filter(job => job.color === "red" || job.color === 'yellow');
    });

    console.log('Number of broken jobs', brokenJobs.flat().length);
    if (!brokenJobs || brokenJobs.flat().length === 0) {
      app.dock.setBadge("");
      app.dock.setIcon(path.join(__dirname, "jenkins.png"));
      mainWindow.webContents.send("update", new Map());
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
          // console.log('**result', result)
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
              culprits.push(nameToImageFileNameMap[fullName] || "unknown");
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
            status: flattenedActionsObject.claimed ? "claimed" : "broken",
            reason: flattenedActionsObject.reason ? flattenedActionsObject.reason : ""
          });
        });
        // console.log(brokenJobsMap);
        try {
          mainWindow.webContents.send("update", brokenJobsMap);
        } catch (e) {
          console.log("webcontents was destoyed");
        }
        app.dock.setBadge(data.length + "");
        app.dock.setIcon(path.join(__dirname, "jenkinsfire.png"));
      }).catch(err => console.log("ERROR", err))
    }
  });
}
