const jobsByName = new Map();
const selectedJobs = new Set();

let activeFilter = "all";
let lastRenderedJobs = [];

const failingList = document.getElementById("failingList");
const statsDonut = document.getElementById("statsDonut");
const jenkinsHomeUrl = "http://jenkins-as01.gale.web:8080/";
const themeStorageKey = "jenkins-monitor-theme";

function getStoredTheme() {
  try {
    const storedTheme = localStorage.getItem(themeStorageKey);

    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
  } catch {
    return null;
  }

  return null;
}

function getPreferredTheme() {
  const storedTheme = getStoredTheme();

  if (storedTheme) {
    return storedTheme;
  }

  return window.matchMedia?.("(prefers-color-scheme: light)")?.matches
    ? "light"
    : "dark";
}

function setStoredTheme(theme) {
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {
    // Theme persistence is non-critical; the current session still updates.
  }
}

function applyTheme(theme) {
  const isLight = theme === "light";
  const themeToggle = document.getElementById("themeToggle");
  const themeLabel = document.getElementById("themeLabel");

  document.documentElement.setAttribute("data-theme", theme);

  if (themeToggle) {
    themeToggle.setAttribute("aria-checked", String(isLight));
    themeToggle.setAttribute("title", `Switch to ${isLight ? "dark" : "light"} mode`);
  }

  if (themeLabel) {
    themeLabel.innerText = isLight ? "Light" : "Dark";
  }
}

applyTheme(getPreferredTheme());

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getStatusLabel(status) {
  return status === "claimed" ? "Claimed" : "Broken";
}

function getStatusGlyph(status) {
  return status === "claimed" ? "!" : "x";
}

function formatCulpritName(culprits) {
  if (!culprits || culprits.length === 0) {
    return "Unassigned";
  }

  const firstCulprit = culprits[0];
  if (firstCulprit === "unknown") {
    return "Unknown owner";
  }

  return firstCulprit
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function getJobGroup(jobName) {
  const [prefix] = String(jobName || "").split(/[-_/]/);
  return prefix ? `${prefix.toLowerCase()} pipeline` : "jenkins pipeline";
}

function getReason(reason) {
  const trimmedReason = String(reason || "").trim();
  return trimmedReason || "No claim reason was reported for this build.";
}

function getFilteredJobs(jobs) {
  if (activeFilter === "all") {
    return jobs;
  }

  return jobs.filter((job) => job.status === activeFilter);
}

function renderClock(now) {
  document.getElementById("clockTime").innerText = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  document.getElementById("updateTime").innerText =
    `Refreshed ${now.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} at ${now.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    })}`;
}

function renderSummary(jobs) {
  const brokenCount = jobs.filter((job) => job.status !== "claimed").length;
  const claimedCount = jobs.filter((job) => job.status === "claimed").length;
  const issueCount = jobs.length;
  const allClear = issueCount === 0;

  document.getElementById("heading").innerText = "Jenkins Monitor";
  document.getElementById("appVersion").innerText =
    `v${window.electronAPI.getAppVersion()}`;
  document.getElementById("healthLabel").innerText = "Open Issues";
  document.getElementById("healthScore").innerText = issueCount;
  document.getElementById("healthScore").style.color = allClear
    ? "var(--green)"
    : brokenCount
      ? "var(--red)"
      : "var(--yellow)";
  document.getElementById("healthState").innerText = allClear
    ? "No broken or claimed jobs"
    : `${brokenCount} broken, ${claimedCount} claimed`;
  document.getElementById("healthState").style.color = allClear
    ? "var(--green)"
    : brokenCount
      ? "var(--red)"
      : "var(--yellow)";
  document.getElementById("brokenCount").innerText = brokenCount;
  document.getElementById("claimedCount").innerText = claimedCount;
  document.getElementById("failingCount").innerText = brokenCount;
  document.getElementById("statsTotal").innerText = issueCount;
  document.getElementById("legendBroken").innerText = brokenCount;
  document.getElementById("legendClaimed").innerText = claimedCount;
  document.getElementById("legendSelected").innerText = selectedJobs.size;
  document.getElementById("selectedCount").innerText = selectedJobs.size;
  document.getElementById("toastTitle").innerText = allClear
    ? "No Open Issues"
    : "Attention Required";
  document.getElementById("toastCopy").innerText = allClear
    ? "No broken or claimed jobs are currently reported by monitored radiators."
    : `${issueCount} open issue${issueCount === 1 ? "" : "s"} need a look.`;

  const redDegrees = issueCount ? (brokenCount / issueCount) * 360 : 0;
  const yellowDegrees = issueCount ? (claimedCount / issueCount) * 360 : 0;
  statsDonut.style.background = allClear
    ? "conic-gradient(rgba(160, 190, 204, 0.16) 0 360deg)"
    : `conic-gradient(var(--red) 0 ${redDegrees}deg, var(--yellow) ${redDegrees}deg ${
        redDegrees + yellowDegrees
      }deg, var(--blue) ${redDegrees + yellowDegrees}deg 360deg)`;
}

function renderFailingList(jobs) {
  const brokenJobs = jobs.filter((job) => job.status !== "claimed").slice(0, 5);

  if (brokenJobs.length === 0) {
    failingList.innerHTML = `
      <li class="failing-item">
        <span class="failing-dot claimed">!</span>
        <span>
          <span class="failing-name">No broken jobs</span>
          <span class="failing-detail">Only claimed issues or none reported</span>
        </span>
        <span class="failing-time">now</span>
      </li>`;
    return;
  }

  failingList.innerHTML = brokenJobs
    .map(
      (job) => `
        <li class="failing-item">
          <span class="failing-dot broken">x</span>
          <span>
            <a target="_blank" class="failing-name jenkins-job" href="${escapeHtml(job.url)}">${escapeHtml(job.job)}</a>
            <span class="failing-detail">${escapeHtml(getReason(job.reason))}</span>
          </span>
          <span class="failing-time">#${escapeHtml(job.buildNumber || "")}</span>
        </li>`
    )
    .join("");
}

function renderJobCard(job) {
  const { job: jobName, culprits, url, status, reason, buildNumber } = job;
  const safeJobName = escapeHtml(jobName);
  const actionClass = status === "claimed" ? "warning-button" : "danger-button";
  const isSelected = selectedJobs.has(jobName);
  const culpritImages = (culprits && culprits.length ? culprits : ["unknown"])
    .slice(0, 4)
    .map(
      (culprit) =>
        `<img class="culprit" src="assets/images/${escapeHtml(culprit)}.jpg" alt="">`
    )
    .join("");

  return `
    <li class="job-card ${escapeHtml(status)}">
      <div class="job-card__header">
        <label class="build-toggle" title="Select ${safeJobName} for rebuild">
          <input type="checkbox" class="build-select" data-job="${safeJobName}" ${isSelected ? "checked" : ""}>
          <span class="status-glyph" aria-hidden="true">${getStatusGlyph(status)}</span>
        </label>
        <div>
          <a target="_blank" class="job-title jenkins-job" href="${escapeHtml(url)}">${safeJobName}</a>
          <span class="job-subtitle">${escapeHtml(getJobGroup(jobName))}</span>
        </div>
        <div class="build-meta">
          <strong>#${escapeHtml(buildNumber || "")}</strong>
          <span>latest build</span>
        </div>
      </div>
      <div class="job-card__body">
        <div class="culprit-stack">${culpritImages}</div>
        <div>
          <div class="culprit-name">${escapeHtml(formatCulpritName(culprits))}</div>
          <div class="reason">${escapeHtml(getReason(reason))}</div>
        </div>
      </div>
      <div class="job-card__footer">
        <span class="issue-label">${escapeHtml(getStatusLabel(status))}</span>
        <div class="job-actions">
          <button type="button" class="${actionClass}" data-action="build-one" data-job="${safeJobName}">Rebuild</button>
        </div>
      </div>
    </li>`;
}

function renderJobs(jobs) {
  jobsByName.clear();
  jobs.forEach((job) => {
    jobsByName.set(job.job, job);
  });
  selectedJobs.forEach((jobName) => {
    if (!jobsByName.has(jobName)) {
      selectedJobs.delete(jobName);
    }
  });

  lastRenderedJobs = jobs;
  const now = new Date();
  const filteredJobs = getFilteredJobs(jobs);
  const loader = document.querySelector(".loader");
  const loaderPanel = document.querySelector(".loader-panel");

  loader.classList.add("hide");
  loaderPanel.classList.add("hide");
  renderClock(now);
  renderSummary(jobs);
  renderFailingList(jobs);

  document
    .querySelectorAll(".segment-button")
    .forEach((button) =>
      button.classList.toggle("active", button.getAttribute("data-filter") === activeFilter)
    );

  document.getElementById("jobs").innerHTML = filteredJobs.length
    ? filteredJobs.map(renderJobCard).join("")
    : jobs.length
      ? `<li class="job-card">
          <div class="job-card__body">
            <div>
              <div class="culprit-name">No ${escapeHtml(activeFilter)} jobs</div>
              <div class="reason">Switch filters to see the remaining monitored issues.</div>
            </div>
          </div>
        </li>`
      : "";

  if (jobs.length === 0) {
    document.querySelector(".nothing-to-see").classList.remove("hide");
    document.getElementById("build-selected-jobs").classList.add("hide");
  } else {
    document.querySelector(".nothing-to-see").classList.add("hide");
    document.getElementById("build-selected-jobs").classList.remove("hide");
  }
}

window.electronAPI.onUpdate(renderJobs);

async function runJobs(jobNames) {
  const runnableJobs = jobNames.filter(Boolean);

  if (runnableJobs.length === 0) {
    await window.electronAPI.runSelected([]);
    return;
  }

  runnableJobs.forEach((jobName) => selectedJobs.delete(jobName));
  await window.electronAPI.runSelected(runnableJobs);
  renderJobs([...jobsByName.values()]);
}

document.addEventListener(
  "click",
  async (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const filterButton = event.target.closest("[data-filter]");
    if (filterButton instanceof HTMLButtonElement) {
      activeFilter = filterButton.getAttribute("data-filter") || "all";
      renderJobs(lastRenderedJobs);
      return;
    }

    const buildSelect = event.target.closest(".build-select");
    if (buildSelect instanceof HTMLInputElement) {
      const jobName = buildSelect.getAttribute("data-job");

      if (jobName) {
        if (buildSelect.checked) {
          selectedJobs.add(jobName);
        } else {
          selectedJobs.delete(jobName);
        }
      }

      document.getElementById("selectedCount").innerText = selectedJobs.size;
      document.getElementById("legendSelected").innerText = selectedJobs.size;
      await window.electronAPI.pauseUpdateInterval();
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (actionButton instanceof HTMLButtonElement) {
      const action = actionButton.getAttribute("data-action");

      if (action === "build-selected") {
        await runJobs([...selectedJobs]);
        return;
      }

      if (action === "build-one") {
        await runJobs([actionButton.getAttribute("data-job")]);
        return;
      }

      if (action === "pause-refresh") {
        await window.electronAPI.pauseUpdateInterval();
        document.getElementById("toastTitle").innerText = "Refresh Paused";
        document.getElementById("toastCopy").innerText =
          "Automatic updates will resume shortly.";
        return;
      }

      if (action === "open-jenkins") {
        await window.electronAPI.openExternal(jenkinsHomeUrl);
        return;
      }

      if (action === "toggle-theme") {
        const currentTheme =
          document.documentElement.getAttribute("data-theme") === "light"
            ? "light"
            : "dark";
        const nextTheme = currentTheme === "light" ? "dark" : "light";

        setStoredTheme(nextTheme);
        applyTheme(nextTheme);
        return;
      }
    }

    const jobLink = event.target.closest(".jenkins-job");
    if (jobLink) {
      event.preventDefault();
      await window.electronAPI.openExternal(jobLink.getAttribute("href"));
    }
  },
  false
);
