const {
  app,
  BrowserWindow,
  Notification,
  Menu,
  ipcMain,
  net,
} = require("electron");
const path = require("path");
const Store = require("./store.js");

const RADIATOR_URLS = {
  centralServices:
    "http://jenkins-as01.gale.web:8080/view/CentralServices-Radiator/api/json",
  oceanEnvironmentHealth:
    "http://jenkins-as01.ci.gale.web:8080/view/Ocean-EnvironmentHealth-Radiator/api/json",
  ocean: "http://jenkins-as01.ci.gale.web:8080/view/Ocean-Radiator/api/json",
  omni: "http://jenkins-as01.gale.web:8080/view/Omni-Radiator/api/json",
  qa: "http://jenkins-as01.gale.web:8080/view/Omni-Automation-QAI-Radiator/api/json",
};

const nameToImageFileNameMap = {
  "abhishek.bhasin": "abhishek.bhasin",
  "Bhasin, Abhishek": "abhishek.bhasin",
  abhasin: "abhishek.bhasin",
  "alex.rebain": "alex.rebain",
  "alexander.rebain": "alex.rebain",
  arebain: "alex.rebain",
  "alyssa.poirier": "alyssa.poirier",
  apoirier: "alyssa.poirier",
  "arthur.segeda": "arthur.segeda",
  "asegeda41470": "arthur.segeda",
  "dan.muszynski": "dan.muszynski",
  dmuszyns: "dan.muszynski",
  "daniel.michon": "daniel.michon",
  dmichon: "daniel.michon",
  edanows: "eric.danowski",
  edanowsk: "eric.danowski",
  "eric.danowski": "eric.danowski",
  hdash: "himanshu.dash",
  "himanshu.dash": "himanshu.dash",
  jchapman: "jeff.chapman",
  "jeffery.chapman": "jeff.chapman",
  "james.miazek": "jim",
  jim: "jim",
  "jim.miazek": "jim",
  jmiazek: "jim",
  "james.trammell": "james.trammell",
  jtrammel: "james.trammell",
  "joe.bishop": "joe.bishop",
  jatkins: "josh.atkins",
  "kitcha.thirunavukkarasu": "kitcha.thirunavukkarasu",
  "krishnamoorthy.thirunavukarasu": "kitcha.thirunavukkarasu",
  kthirun: "kitcha.thirunavukkarasu",
  lstepanenko46077: "lstepanenko46077",
  "maksuda.zaman": "maksuda.zaman",
  mzaman: "maksuda.zaman",
  mcarnaghi: "megan.carnaghi",
  "megan.carnaghi": "megan.carnaghi",
  "oleksandr.laskovskyi": "oleksandr.laskovskyi",
  "olaskovskyi47681": "oleksandr.laskovskyi",
  pkrishna: "prabu",
  prabu: "prabu",
  "prabu.krishnakumar": "prabu",
  rwang: "rui.wang",
  "rui.wang": "rui.wang",
  "sondos.albreim": "sondos.albreim",
  "salbreim48938": "sondos.albreim",
  tsposito: "tsposito",
  unknown: "unknown",
  "valeriy.venzyk": "valeriy.venzyk",
  "vvenzyk": "valeriy.venzyk",
};

const store = new Store({
  configName: "user-preferences",
  defaults: {
    radiatorsToMonitor: [RADIATOR_URLS.omni, RADIATOR_URLS.centralServices],
    windowBounds: { width: 800, height: 400 },
    jenkinsCredentials: { username: "", password: "" },
  },
});

let mainWindow = null;
let disableNotifications = false;
let updateFromRadiatorInterval = null;

function createMainWindow() {
  const { width, height } = store.get("windowBounds");

  mainWindow = new BrowserWindow({
    width,
    height,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  mainWindow.on("resize", () => {
    const { width: nextWidth, height: nextHeight } = mainWindow.getBounds();
    store.set("windowBounds", { width: nextWidth, height: nextHeight });
  });

  mainWindow.webContents.on("did-finish-load", () => {
    void updateFromRadiator();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.loadFile("index.html");
}

function createCredentialsWindow() {
  const prefWindow = new BrowserWindow({
    x: 200,
    y: 200,
    width: 400,
    height: 220,
    resizable: false,
    parent: mainWindow ?? undefined,
    modal: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  prefWindow.removeMenu();
  prefWindow.loadFile("jenkinsCredentials.html");
  prefWindow.show();
}

function toggleRadiator(url, checked) {
  const currentRadiatorsToMonitor = store.get("radiatorsToMonitor");
  const nextRadiatorsToMonitor = checked
    ? [...new Set([...currentRadiatorsToMonitor, url])]
    : currentRadiatorsToMonitor.filter((radiator) => radiator !== url);

  store.set("radiatorsToMonitor", nextRadiatorsToMonitor);
  void updateFromRadiator();
}

function buildMenu() {
  const monitoredRadiators = store.get("radiatorsToMonitor");
  const menu = Menu.buildFromTemplate([
    {
      label: "Settings",
      submenu: [
        {
          label: "Central Services Radiator",
          type: "checkbox",
          checked: monitoredRadiators.includes(RADIATOR_URLS.centralServices),
          click: (menuItem) =>
            toggleRadiator(RADIATOR_URLS.centralServices, menuItem.checked),
        },
        {
          label: "Ocean Environment Health Radiator",
          type: "checkbox",
          checked: monitoredRadiators.includes(
            RADIATOR_URLS.oceanEnvironmentHealth
          ),
          click: (menuItem) =>
            toggleRadiator(
              RADIATOR_URLS.oceanEnvironmentHealth,
              menuItem.checked
            ),
        },
        {
          label: "Ocean Radiator",
          type: "checkbox",
          checked: monitoredRadiators.includes(RADIATOR_URLS.ocean),
          click: (menuItem) =>
            toggleRadiator(RADIATOR_URLS.ocean, menuItem.checked),
        },
        {
          label: "Omni Radiator",
          type: "checkbox",
          checked: monitoredRadiators.includes(RADIATOR_URLS.omni),
          click: (menuItem) =>
            toggleRadiator(RADIATOR_URLS.omni, menuItem.checked),
        },
        {
          label: "QA Radiator",
          type: "checkbox",
          checked: monitoredRadiators.includes(RADIATOR_URLS.qa),
          click: (menuItem) => toggleRadiator(RADIATOR_URLS.qa, menuItem.checked),
        },
        { type: "separator" },
        {
          label: "Set Jenkins Credentials",
          click: () => {
            createCredentialsWindow();
          },
        },
        {
          label: "Disable Notifications",
          type: "checkbox",
          checked: disableNotifications,
          click: (menuItem) => {
            disableNotifications = menuItem.checked;
          },
        },
        {
          label: "Quit",
          role: "quit",
        },
      ],
    },
  ]);

  Menu.setApplicationMenu(menu);
}

function showErrorNotification(body) {
  if (disableNotifications) {
    return;
  }

  new Notification({
    title: "Error",
    body,
  }).show();
}

function setDockState(badge, iconName) {
  if (process.platform !== "darwin" || !app.dock) {
    return;
  }

  app.dock.setBadge(badge);
  app.dock.setIcon(path.join(__dirname, iconName));
}

function requestText(url, options = {}) {
  return new Promise((resolve, reject) => {
    const request = net.request({ url, ...options });
    let body = "";

    request.on("response", (response) => {
      response.on("data", (chunk) => {
        body += chunk.toString();
      });
      response.on("end", () => {
        resolve(body);
      });
      response.on("error", reject);
    });

    request.on("error", reject);
    request.end();
  });
}

async function updateFromRadiator() {
  const radiatorsToMonitor = store.get("radiatorsToMonitor");

  try {
    const radiatorPayloads = await Promise.all(
      radiatorsToMonitor.map((url) =>
        requestText(url).catch((error) => {
          showErrorNotification(`${error.message} (${url})`);
          return JSON.stringify({ jobs: [] });
        })
      )
    );

    const brokenJobs = radiatorPayloads
      .map((results) => JSON.parse(results).jobs || [])
      .flat()
      .filter((job) => job.color === "red" || job.color === "yellow");

    if (brokenJobs.length === 0) {
      setDockState("", "jenkins.png");
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("update", []);
      }
      return;
    }

    const brokenJobPayloads = await Promise.all(
      brokenJobs.map((brokenJob) =>
        requestText(
          `http://jenkins-as01.gale.web:8080/job/${brokenJob.name}/lastBuild/api/json`
        )
      )
    );

    const brokenJobsMap = new Map();

    brokenJobPayloads.forEach((result) => {
      const parsedResult = JSON.parse(result);
      const flattenedActionsObject = Object.assign({}, ...parsedResult.actions);
      const culprits = [];

      if (flattenedActionsObject.claimedBy) {
        culprits.push(
          nameToImageFileNameMap[flattenedActionsObject.claimedBy] || "unknown"
        );
      } else if (parsedResult.culprits.length > 0) {
        parsedResult.culprits.forEach(({ fullName }) => {
          culprits.push(nameToImageFileNameMap[fullName] || "unknown");
        });
      } else {
        culprits.push("unknown");
      }

      const buildNumberSeparator = parsedResult.fullDisplayName.indexOf("#");
      const jobName =
        buildNumberSeparator === -1
          ? parsedResult.fullDisplayName
          : parsedResult.fullDisplayName.substring(0, buildNumberSeparator);

      brokenJobsMap.set(jobName, {
        buildNumber: parsedResult.number,
        job: jobName,
        culprits,
        reason: flattenedActionsObject.reason || "",
        status: flattenedActionsObject.claimed ? "claimed" : "broken",
        url: parsedResult.url,
      });
    });

    const brokenJobsList = [...brokenJobsMap.values()];

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update", brokenJobsList);
    }

    setDockState(String(brokenJobsList.length), "jenkinsfire.png");
  } catch (error) {
    showErrorNotification(error.message);
  }
}

function pauseUpdateInterval() {
  if (updateFromRadiatorInterval) {
    clearInterval(updateFromRadiatorInterval);
    updateFromRadiatorInterval = null;
  }

  setTimeout(() => {
    if (!updateFromRadiatorInterval) {
      updateFromRadiatorInterval = setInterval(() => {
        void updateFromRadiator();
      }, 10000);
    }
  }, 90000);
}

ipcMain.handle("pause-update-interval", () => {
  pauseUpdateInterval();
});

ipcMain.handle("run-selected", async (_event, selectedJobs) => {
  const jenkinsCredentials = store.get("jenkinsCredentials");

  if (
    !jenkinsCredentials ||
    !jenkinsCredentials.username ||
    !jenkinsCredentials.password
  ) {
    showErrorNotification("Please set your Jenkins credentials");
    return;
  }

  if (!selectedJobs.length) {
    showErrorNotification("Please select jobs to build");
    return;
  }

  const { username, password } = jenkinsCredentials;
  const authorization = Buffer.from(`${username}:${password}`).toString("base64");

  await Promise.all(
    selectedJobs.map((job) =>
      requestText(
        `http://jenkins-as01.gale.web:8080/view/Omni-Radiator/job/${job.trim()}/build`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${authorization}`,
          },
        }
      )
    )
  );
});

ipcMain.handle("save-credentials", (_event, credentials) => {
  store.set("jenkinsCredentials", credentials);
});

ipcMain.handle("get-credentials", () => {
  return store.get("jenkinsCredentials");
});

ipcMain.handle("close-current-window", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

app.whenReady().then(() => {
  createMainWindow();
  buildMenu();
  updateFromRadiatorInterval = setInterval(() => {
    void updateFromRadiator();
  }, 10000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
