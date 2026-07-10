// DriveYo - Public Safety & Smart Mobility Web Application Logic

// ==========================================
// STATE SYSTEM (Simulated Local Database)
// ==========================================
let drivers = [
  {
    id: 1,
    name: "Chinedu Okafor",
    license: "DL-19385-LAG",
    plate: "EKY-498AB",
    address: "12, Herbert Macaulay Way, Yaba, Lagos",
    routeId: "yaba-ojuelegba",
    routeText: "Yaba to Ojuelegba Commercial Corridor",
    pin: "7392",
    checkedIn: true,
    pinStatus: "verified", // "verified" or "Suspended - Unverified"
    checkInTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toLocaleString(), // 4 hours ago
    coordinates: [6.5182, 3.3698], // Yaba Home
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 2,
    name: "Alhaji Ibrahim Musa",
    license: "DL-38495-KAD",
    plate: "KAD-789YY",
    address: "45, Murtala Muhammed Way, Ebute Metta, Lagos",
    routeId: "ikeja-surulere",
    routeText: "Ikeja to Surulere Commuter Expressway",
    pin: "2485",
    checkedIn: true,
    pinStatus: "verified", // "verified" or "Suspended - Unverified"
    checkInTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString(), // 2 hours ago
    coordinates: [6.5025, 3.3725], // Ebute Metta Home
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
  }
];

let passengers = [
  {
    id: 1,
    name: "Tunde Bakare",
    email: "tunde@gmail.com",
    avatarLetters: "TB"
  },
  {
    id: 2,
    name: "Ngozi Adebayo",
    email: "ngozi@yahoo.com",
    avatarLetters: "NA"
  }
];

const mockPassengerDetails = {
  1: {
    name: "Tunde Bakare",
    email: "tunde@gmail.com",
    avatarLetters: "TB"
  },
  2: {
    name: "Ngozi Adebayo",
    email: "ngozi@yahoo.com",
    avatarLetters: "NA"
  }
};

let activeDriver = null; // Currently logged-in driver session
let activePassenger = null; // Currently Google OAuth logged-in passenger
let handshakes = [
  // Seed initial past handshakes to demonstrate lookup ledger search immediately
  {
    passengerName: "Ngozi Adebayo",
    passengerEmail: "ngozi@yahoo.com",
    driverName: "Alhaji Ibrahim Musa",
    driverLicense: "DL-38495-KAD",
    driverPlate: "KAD-789YY",
    driverAddress: "45, Murtala Muhammed Way, Ebute Metta, Lagos",
    driverRoute: "Ikeja to Surulere Commuter Expressway",
    routeId: "ikeja-surulere",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    status: "Secure Route Active"
  },
  {
    passengerName: "Tunde Bakare",
    passengerEmail: "tunde@gmail.com",
    driverName: "Chinedu Okafor",
    driverLicense: "DL-19385-LAG",
    driverPlate: "EKY-498AB",
    driverAddress: "12, Herbert Macaulay Way, Yaba, Lagos",
    driverRoute: "Yaba to Ojuelegba Commercial Corridor",
    routeId: "yaba-ojuelegba",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    status: "Secure Route Active"
  }
];

let activeHandshake = null; // Current active boarding handshake

let missingPersons = [
  { name: "Tunde Bakare", routeId: "yaba-ojuelegba", routeText: "Yaba to Ojuelegba Commercial Corridor", timestamp: "12:45 PM", status: "Active Search" }
];

// Mock profiles for autocomplete
const mockDriverDetails = {
  1: {
    name: "Chinedu Okafor",
    license: "DL-19385-LAG",
    plate: "EKY-498AB",
    address: "12, Herbert Macaulay Way, Yaba, Lagos",
    route: "yaba-ojuelegba"
  },
  2: {
    name: "Alhaji Ibrahim Musa",
    license: "DL-38495-KAD",
    plate: "KAD-789YY",
    address: "45, Murtala Muhammed Way, Ebute Metta, Lagos",
    route: "ikeja-surulere"
  }
};

// ==========================================
// SPA NAVIGATION SYSTEM
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll("#main-nav-tabs .tab-btn");
  const panels = document.querySelectorAll(".panel-view");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const targetPanel = document.getElementById(tab.getAttribute("data-tab"));
      if (targetPanel) {
        targetPanel.classList.add("active");
      }

      // Invalidate Map size on dispatcher panel when tab becomes active
      if (tab.getAttribute("data-tab") === "dispatcher-tab") {
        setTimeout(() => {
          if (map) {
            map.invalidateSize();
          }
        }, 100);
      }
    });
  });

  // Pre-load default values for forms
  loadMockPassenger(1);
  loadMockLoginDriver(1);
  renderMissingAlertsList();
});

// Toast system
function showToast(message, type = "success") {
  const toast = document.getElementById("toast-notify");
  const icon = document.getElementById("toast-icon");
  const msgText = document.getElementById("toast-message");

  toast.className = `toast-notification ${type} active`;
  icon.textContent = type === "success" ? "✓" : "⚠";
  msgText.textContent = message;

  setTimeout(() => {
    toast.classList.remove("active");
  }, 4000);
}

// ==========================================
// ROLE SELECTION GATEWAY
// ==========================================
function chooseUserRole(role) {
  document.getElementById("landing-tab").style.display = "none";
  document.getElementById("landing-tab").classList.remove("active");
  
  const navTabs = document.getElementById("main-nav-tabs");
  const exitBtn = document.getElementById("header-exit-btn");
  navTabs.style.display = "flex";
  exitBtn.style.display = "block";

  // Hide all tab buttons
  document.getElementById("nav-btn-driver").style.display = "none";
  document.getElementById("nav-btn-passenger").style.display = "none";
  document.getElementById("nav-btn-dispatcher").style.display = "none";

  document.querySelectorAll(".panel-view").forEach(p => p.classList.remove("active"));

  if (role === "driver") {
    // Lock to Driver view
    document.getElementById("nav-btn-driver").style.display = "block";
    setActiveTabButton("nav-btn-driver");
    document.getElementById("driver-tab").classList.add("active");
    
    // Reset login forms to show sign-in step by default
    toggleDriverAuthViews('login');
    showToast("Driver Portal Active", "success");
  } else if (role === "passenger") {
    // Lock to Passenger view
    document.getElementById("nav-btn-passenger").style.display = "block";
    setActiveTabButton("nav-btn-passenger");
    document.getElementById("passenger-tab").classList.add("active");
    
    showToast("Passenger Portal Active", "success");
  } else if (role === "dispatcher") {
    // Lock to Dispatcher view
    document.getElementById("nav-btn-dispatcher").style.display = "block";
    setActiveTabButton("nav-btn-dispatcher");
    document.getElementById("dispatcher-tab").classList.add("active");
    
    showToast("Law Enforcement Dispatch Open", "danger");
  }
}

function setActiveTabButton(btnId) {
  const tabs = document.querySelectorAll("#main-nav-tabs .tab-btn");
  tabs.forEach(t => {
    if (t.id === btnId) t.classList.add("active");
    else t.classList.remove("active");
  });
}

function exitToLanding() {
  if (animationTimer) {
    clearInterval(animationTimer);
  }
  isDeviating = false;
  currentPathIndex = 0;
  deviationIndex = 0;

  // Clear sessions
  resetDriverSession();
  handleOAuthLogout();

  // Reset dispatcher lookup view
  document.getElementById("ledger-search-output").style.display = "none";
  document.getElementById("ledger-no-results").style.display = "none";

  document.getElementById("main-nav-tabs").style.display = "none";
  document.getElementById("header-exit-btn").style.display = "none";

  document.querySelectorAll(".panel-view").forEach(p => p.classList.remove("active"));
  
  document.getElementById("landing-tab").style.display = "block";
  document.getElementById("landing-tab").classList.add("active");

  showToast("Role session reset. Please select a profile.", "success");
}

// ==========================================
// DRIVER ACTIONS: PROGRESSIVE WORKFLOW
// ==========================================
function toggleDriverAuthViews(view) {
  // Hide all progressive screens
  document.getElementById("driver-step-register").style.display = "none";
  document.getElementById("driver-step-login").style.display = "none";
  document.getElementById("driver-step-scan").style.display = "none";
  document.getElementById("driver-step-dashboard").style.display = "none";

  if (view === 'register') {
    document.getElementById("driver-step-register").style.display = "block";
  } else if (view === 'login') {
    document.getElementById("driver-step-login").style.display = "block";
  }
}

function loadMockDriver(id) {
  const mock = mockDriverDetails[id];
  if (!mock) return;

  document.getElementById("driver-name").value = mock.name;
  document.getElementById("driver-license").value = mock.license;
  document.getElementById("driver-plate").value = mock.plate;
  document.getElementById("driver-address").value = mock.address;
  document.getElementById("driver-route").value = mock.route;

  const badges = document.querySelectorAll("#driver-step-register .role-select-badge");
  badges.forEach((b, idx) => {
    if (idx + 1 === id) b.classList.add("active");
    else b.classList.remove("active");
  });
}

function loadMockLoginDriver(id) {
  const mock = mockDriverDetails[id];
  if (!mock) return;
  document.getElementById("login-license").value = mock.license;

  const badges = document.querySelectorAll("#driver-step-login .role-select-badge");
  badges.forEach((b, idx) => {
    if (idx + 1 === id) b.classList.add("active");
    else b.classList.remove("active");
  });
}

// Onboarding Registration Form Submit (Step 1 -> Step 2)
function handleDriverRegister(event) {
  event.preventDefault();
  
  const name = document.getElementById("driver-name").value;
  const license = document.getElementById("driver-license").value;
  const plate = document.getElementById("driver-plate").value;
  const address = document.getElementById("driver-address").value;
  const routeSelect = document.getElementById("driver-route");
  const routeId = routeSelect.value;
  const routeText = routeSelect.options[routeSelect.selectedIndex].text;

  // Create driver entry
  const newDriver = {
    id: Date.now(),
    name,
    license,
    plate,
    address,
    routeId,
    routeText,
    checkedIn: false,
    pin: null,
    pinStatus: "verified",
    coordinates: routeId === "yaba-ojuelegba" ? [6.5182, 3.3698] : [6.5982, 3.3398],
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"
  };

  drivers.push(newDriver);

  showToast(`Account Registered! Proceed to Daily Login.`, "success");
  
  // Advance to Login view (Step 2)
  toggleDriverAuthViews('login');
  document.getElementById("login-license").value = license;
}

// Login verification (Step 2 -> Step 3)
function handleDriverLoginAttempt(event) {
  event.preventDefault();
  const inputLicense = document.getElementById("login-license").value.trim();

  // Search DB for license ID
  const match = drivers.find(d => d.license.toLowerCase() === inputLicense.toLowerCase());

  if (!match) {
    showToast("License ID not found. Please onboard first.", "danger");
    return;
  }

  activeDriver = match;

  // Advance to scan panel (Step 3)
  document.getElementById("driver-step-login").style.display = "none";
  document.getElementById("driver-step-scan").style.display = "block";
  
  // Reset scanner state
  const scanner = document.getElementById("liveness-scanner");
  scanner.className = "scanner-container";
  document.getElementById("scanner-label").textContent = "Camera Ready - Start Scan";
  document.getElementById("start-checkin-btn").disabled = false;
  document.getElementById("start-checkin-btn").style.display = "inline-flex";

  showToast("License matched. Proceed with daily liveness check.", "success");
}

function resetDriverSession() {
  activeDriver = null;
  toggleDriverAuthViews('login');
  
  const scanner = document.getElementById("liveness-scanner");
  scanner.className = "scanner-container";
  document.getElementById("scanner-label").textContent = "Awaiting Login";
  
  document.getElementById("start-checkin-btn").disabled = true;
  document.getElementById("start-checkin-btn").style.display = "inline-flex";
  document.getElementById("pin-display-panel").style.display = "none";
  document.getElementById("driver-pin-code").textContent = "----";
  
  const pinCodeText = document.getElementById("driver-pin-code");
  pinCodeText.style.color = "var(--accent-cyan)";
  pinCodeText.style.textShadow = "0 0 10px rgba(2, 132, 199, 0.2)";
}

// Biometric face scan check-in (Step 3 -> Step 4)
function simulateFaceScan() {
  if (!activeDriver) return;

  const scanner = document.getElementById("liveness-scanner");
  const scannerLabel = document.getElementById("scanner-label");
  const scanBtn = document.getElementById("start-checkin-btn");

  scanBtn.disabled = true;
  scanner.className = "scanner-container scanning";
  scannerLabel.textContent = "Checking Liveness...";

  setTimeout(() => {
    scannerLabel.textContent = "Matching Face Grid...";
  }, 1200);

  setTimeout(() => {
    scannerLabel.textContent = "Authorizing Daily Session...";
  }, 2500);

  setTimeout(() => {
    scanner.className = "scanner-container success";
    scannerLabel.textContent = "Liveness Scan Match Verified";
    
    // Generate PIN
    const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
    activeDriver.pin = generatedPin;
    activeDriver.checkedIn = true;
    activeDriver.pinStatus = "verified";
    activeDriver.checkInTime = new Date().toLocaleString();

    // Update in database lists
    const idx = drivers.findIndex(d => d.license === activeDriver.license);
    if (idx !== -1) {
      drivers[idx].pin = generatedPin;
      drivers[idx].checkedIn = true;
      drivers[idx].pinStatus = "verified";
      drivers[idx].checkInTime = activeDriver.checkInTime;
    }

    // HIDE scan view, SHOW verified driver dashboard portal (Step 4)
    document.getElementById("driver-step-scan").style.display = "none";
    document.getElementById("driver-step-dashboard").style.display = "block";

    document.getElementById("display-driver-name").textContent = activeDriver.name;
    document.getElementById("display-driver-license").textContent = `License: ${activeDriver.license}`;
    document.getElementById("display-driver-plate").textContent = activeDriver.plate;
    document.getElementById("display-driver-address").textContent = activeDriver.address;
    document.getElementById("display-driver-route").textContent = activeDriver.routeText;

    // Display PIN code
    document.getElementById("pin-display-panel").style.display = "block";
    document.getElementById("driver-pin-code").textContent = generatedPin;
    
    const pinCodeText = document.getElementById("driver-pin-code");
    pinCodeText.style.color = "var(--accent-cyan)";
    pinCodeText.style.textShadow = "0 0 10px rgba(2, 132, 199, 0.2)";

    const completedInfo = document.getElementById("driver-checkin-completed-info");
    completedInfo.style.display = "block";
    completedInfo.style.background = "rgba(16, 185, 129, 0.04)";
    completedInfo.style.borderColor = "var(--accent-green)";
    completedInfo.innerHTML = `
      <h3>
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        Liveness Verified & Signed In
      </h3>
      <p>Dynamic 24h safety handshake PIN is generated and active.</p>
    `;

    showToast("Safety check-in verified. Daily Session Active.", "success");
  }, 4000);
}

// ==========================================
// PASSENGER ACTIONS & HANDSHAKE
// ==========================================
function loadMockPassenger(id) {
  const mock = mockPassengerDetails[id];
  if (!mock) return;

  const badges = document.querySelectorAll("#passenger-auth-view .role-select-badge");
  badges.forEach((b, idx) => {
    if (idx + 1 === id) b.classList.add("active");
    else b.classList.remove("active");
  });
}

function handleSimulatedOAuthLogin() {
  const activeBadge = document.querySelector("#passenger-auth-view .role-select-badge.active");
  let mockId = 1;
  if (activeBadge) {
    if (activeBadge.textContent.includes("Ngozi")) mockId = 2;
  }
  
  const mockCommuter = mockPassengerDetails[mockId];

  activePassenger = {
    name: mockCommuter.name,
    email: mockCommuter.email,
    avatarLetters: mockCommuter.avatarLetters
  };

  // HIDE registration auth, SHOW passenger handshake dashboard portal
  document.getElementById("passenger-auth-view").style.display = "none";
  document.getElementById("passenger-portal-view").style.display = "block";

  // Fill in session elements
  document.getElementById("passenger-logged-in-name").textContent = activePassenger.name;

  // Reset forms and hide successful/failed results
  resetHandshakeForm();

  showToast(`OAuth Sign-In Successful: Welcome ${activePassenger.name}`, "success");
}

function handleOAuthLogout() {
  activePassenger = null;
  document.getElementById("passenger-auth-view").style.display = "block";
  document.getElementById("passenger-portal-view").style.display = "none";
  
  document.getElementById("handshake-pin").value = "";
  document.getElementById("handshake-result-verified").style.display = "none";
  document.getElementById("handshake-result-unverified").style.display = "none";
}

function updatePassengerLogsTable() {
  const tbody = document.getElementById("passenger-logs-table-body");
  if (!tbody) return;
  if (!activePassenger) return;

  const logs = handshakes.filter(h => h.passengerEmail === activePassenger.email);
  if (logs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No recorded handshakes in this session</td></tr>`;
    return;
  }

  tbody.innerHTML = logs.map(h => `
    <tr>
      <td>${h.timestamp}</td>
      <td>${h.driverName}</td>
      <td style="font-family: monospace;">${h.driverPlate}</td>
      <td><span class="badge ${h.status.includes('DEVIATION') ? 'badge-red' : 'badge-green'}">${h.status}</span></td>
    </tr>
  `).join("");
}

function handlePreBoardingHandshake(event) {
  event.preventDefault();
  
  if (!activePassenger) {
    showToast("Please sign in as passenger first.", "danger");
    return;
  }

  const pinCode = document.getElementById("handshake-pin").value;

  // Lookup driver by PIN in local DB
  const driverMatch = drivers.find(d => d.pin === pinCode);

  // If driver doesn't match or is suspended/unverified
  if (!driverMatch || driverMatch.pinStatus === "Suspended - Unverified" || !driverMatch.checkedIn) {
    document.getElementById("passenger-handshake-form").style.display = "none";
    document.getElementById("handshake-result-verified").style.display = "none";
    document.getElementById("handshake-result-unverified").style.display = "block";
    
    // Register unverified attempt record silently in backend
    const failedLog = {
      passengerName: activePassenger.name,
      passengerEmail: activePassenger.email,
      driverName: driverMatch ? driverMatch.name : "UNKNOWN OPERATOR",
      driverLicense: driverMatch ? driverMatch.license : "UNKNOWN",
      driverPlate: driverMatch ? driverMatch.plate : "UNKNOWN",
      driverAddress: driverMatch ? driverMatch.address : "UNKNOWN",
      driverRoute: "UNKNOWN ROUTE",
      routeId: "unknown",
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      status: "🚨 UNVERIFIED BOARDING ATTEMPT"
    };
    handshakes.push(failedLog);
    updatePassengerLogsTable();

    showToast("WARNING: Dynamic PIN is unverified. DO NOT board this vehicle.", "danger");
    return;
  }

  // Create digital safety anchor silently in background
  activeHandshake = {
    passengerName: activePassenger.name,
    passengerEmail: activePassenger.email,
    driverName: driverMatch.name,
    driverLicense: driverMatch.license,
    driverPlate: driverMatch.plate,
    driverAddress: driverMatch.address,
    driverRoute: driverMatch.routeText,
    routeId: driverMatch.routeId,
    timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    status: "Secure Route Active"
  };

  handshakes.push(activeHandshake);

  // Hide form, show VERIFIED alert box
  document.getElementById("passenger-handshake-form").style.display = "none";
  document.getElementById("handshake-result-unverified").style.display = "none";
  document.getElementById("handshake-result-verified").style.display = "block";

  // Pre-seed dispatcher map coordinates silently in background
  startTelemetryTripSilently(driverMatch);

  updatePassengerLogsTable();
  showToast("PIN Verified. Safe to board.", "success");
}

function resetHandshakeForm() {
  document.getElementById("handshake-pin").value = "";
  document.getElementById("passenger-handshake-form").style.display = "block";
  document.getElementById("handshake-result-verified").style.display = "none";
  document.getElementById("handshake-result-unverified").style.display = "none";
}

// ==========================================
// DISPATCHER SECURITY / LAW ENFORCEMENT LEDGER
// ==========================================
function handleEmergencyLookup(event) {
  event.preventDefault();

  const searchName = document.getElementById("dispatcher-search-name").value.trim().toLowerCase();
  const searchRouteId = document.getElementById("dispatcher-search-route").value;

  // Search backend handshakes for matching name and route ID
  const matchLogs = handshakes
    .filter(h => h.passengerName.toLowerCase().includes(searchName) && h.routeId === searchRouteId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp)); // Latest first

  const outputDiv = document.getElementById("ledger-search-output");
  const noResultDiv = document.getElementById("ledger-no-results");

  if (matchLogs.length === 0) {
    outputDiv.style.display = "none";
    noResultDiv.style.display = "block";
    const detailsPanel = document.getElementById("dispatcher-driver-details-panel");
    if (detailsPanel) detailsPanel.style.display = "none";
    if (animationTimer) clearInterval(animationTimer);
    return;
  }

  const latestLog = matchLogs[0];

  // Retrieve full driver data matching log operator name
  const fullDriver = drivers.find(d => d.name === latestLog.driverName);
  const photoBox = document.getElementById("ledger-driver-photo-box");
  const statusBadge = document.getElementById("ledger-driver-status-badge");

  if (fullDriver) {
    photoBox.innerHTML = `<img src="${fullDriver.photo}" alt="${fullDriver.name}">`;
    if (fullDriver.pinStatus === "Suspended - Unverified") {
      statusBadge.textContent = "🚨 PIN Suspended";
      statusBadge.className = "badge badge-red";
      statusBadge.style.width = "100%";
    } else if (fullDriver.checkedIn) {
      statusBadge.textContent = "Check-in Active";
      statusBadge.className = "badge badge-green";
      statusBadge.style.width = "100%";
    } else {
      statusBadge.textContent = "Check-in Expired";
      statusBadge.className = "badge badge-red";
      statusBadge.style.width = "100%";
    }
  } else {
    photoBox.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>`;
    statusBadge.textContent = "Unregistered";
    statusBadge.className = "badge badge-warning";
    statusBadge.style.width = "100%";
  }

  // Populate text elements in ledger
  document.getElementById("ledger-driver-name").textContent = latestLog.driverName;
  document.getElementById("ledger-driver-plate").textContent = latestLog.driverPlate;
  document.getElementById("ledger-driver-license").textContent = latestLog.driverLicense;
  document.getElementById("ledger-handshake-time").textContent = `${new Date().toLocaleDateString('en-GB')} ${latestLog.timestamp}`;
  document.getElementById("ledger-driver-route").textContent = latestLog.driverRoute;
  document.getElementById("ledger-driver-address").textContent = latestLog.driverAddress;

  // Reveal retrieved driver profile card, keep map hidden until simulation
  noResultDiv.style.display = "none";
  outputDiv.style.display = "none";
  const detailsPanel = document.getElementById("dispatcher-driver-details-panel");
  if (detailsPanel) detailsPanel.style.display = "block";

  // Bind active handshake contexts
  activeHandshake = latestLog;
  selectedDriverObj = fullDriver || {
    name: latestLog.driverName,
    address: latestLog.driverAddress,
    routeId: latestLog.routeId,
    plate: latestLog.driverPlate,
    license: latestLog.driverLicense,
    routeText: latestLog.driverRoute
  };

  showToast("Ride credentials decrypted. Verification controls unlocked.", "success");
}

// ==========================================
// AI VEHICLE TELEMETRY & MAP ENGINE (BACKEND DETECT)
// ==========================================
let map = null;
let vehicleMarker = null;
let homeMarker = null;
let routePolyline = null;
let deviationZonePolygon = null;

let currentRoutePath = [];
let routeCoordinates = {
  "yaba-ojuelegba": [
    [6.5182, 3.3698], // Home starting point
    [6.5165, 3.3685], // Exit home street onto Commercial way
    [6.5140, 3.3690], // Herbert Macaulay intersection
    [6.5115, 3.3692], // Sabo Yaba Commercial core
    [6.5085, 3.3670], // Adekunle turnoff axis
    [6.5050, 3.3630], // Tejuosho Road
    [6.5020, 3.3600], // Ojuelegba Underbridge terminal
    [6.4975, 3.3610]  // Lawanson commuter pathway
  ],
  "ikeja-surulere": [
    [6.5982, 3.3398], // Ikeja start
    [6.5840, 3.3420],
    [6.5700, 3.3510],
    [6.5510, 3.3630],
    [6.5320, 3.3680],
    [6.5150, 3.3650],
    [6.5025, 3.3725]  // Ebute Metta Terminal
  ]
};

// Deviation coordinates heading into unpopulated zones
const deviationRouteCoords = [
  [6.5085, 3.3670], // Departure Point (Adekunle turnoff axis)
  [6.5040, 3.3750], // Eastward lagoon bypass
  [6.4970, 3.3850], // Swamp bank (Bush Zone)
  [6.4910, 3.3950]  // Forested delta
];

const outOfBoundsRouteCoords = [
  [6.5085, 3.3670], // Departure Point (Adekunle turnoff axis)
  [6.4600, 3.3900], // Heading south off-grid boundary line
  [6.4100, 3.4100], // Breaching metropolitan sector limits
  [6.3500, 3.4300], // Out of bounds zone (Open lagoon/ocean boundary)
  [6.2900, 3.4500]  // Critical danger grid
];

const bushZonePolygonCoords = [
  [6.5070, 3.3720],
  [6.5080, 3.3980],
  [6.4800, 3.4020],
  [6.4800, 3.3750]
];

let animationTimer = null;
let currentPathIndex = 0;
let isDeviating = false;
let deviationIndex = 0;
let isOutOfBounds = false;
let outOfBoundsIndex = 0;
let selectedDriverObj = null;

function initTelemetryMap() {
  map = L.map("map-telemetry-viewport").setView([6.512, 3.370], 14);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  deviationZonePolygon = L.polygon(bushZonePolygonCoords, {
    color: 'red',
    fillColor: '#ef4444',
    fillOpacity: 0.15,
    dashArray: '5, 8'
  }).addTo(map).bindPopup("<b>High-Risk Warning Zone</b><br>Declared unpopulated delta bypass.");
}

function startTelemetryTripSilently(driverObj) {
  // Preloads coordinates into variables, but DOES NOT activate intervals or visual mapping overlays
  // Telemetry map is purely loaded inside the Dispatcher security views upon missing report query.
  selectedDriverObj = driverObj;
  currentRoutePath = routeCoordinates[driverObj.routeId] || routeCoordinates["yaba-ojuelegba"];
  isDeviating = false;
  currentPathIndex = 0;
  deviationIndex = 0;
}

function startTelemetryTrip(driverObj) {
  selectedDriverObj = driverObj;
  
  if (animationTimer) {
    clearInterval(animationTimer);
  }

  isDeviating = false;
  currentPathIndex = 0;
  deviationIndex = 0;
  isOutOfBounds = false;
  outOfBoundsIndex = 0;

  // Reset dispatcher alert UI
  closeDispatcherMessageBox();
  document.getElementById("anomaly-warning-banner").classList.remove("active");
  document.getElementById("map-emergency-overlay").classList.remove("active");
  document.getElementById("gps-status-value").textContent = "ONLINE";
  document.getElementById("gps-status-value").className = "status-indicator-value verified";
  document.getElementById("route-status-value").textContent = "ON ROUTE";
  document.getElementById("route-status-value").className = "status-indicator-value verified";
  
  const statusIndicator = document.getElementById("global-status-indicator");
  statusIndicator.className = "system-status";
  document.getElementById("status-text").textContent = "Network Secured";

  // Clean map layers
  if (vehicleMarker) map.removeLayer(vehicleMarker);
  if (homeMarker) map.removeLayer(homeMarker);
  if (routePolyline) map.removeLayer(routePolyline);

  currentRoutePath = routeCoordinates[driverObj.routeId] || routeCoordinates["yaba-ojuelegba"];

  // Create Home Marker
  const homeIcon = L.divIcon({
    html: '<div style="background: var(--accent-green); width: 14px; height: 14px; transform: rotate(45deg); border: 2px solid white; box-shadow: var(--shadow-green);"></div>',
    className: 'custom-home-icon',
    iconSize: [14, 14]
  });
  homeMarker = L.marker(currentRoutePath[0], {icon: homeIcon}).addTo(map)
    .bindPopup(`<b>Verified Residential Home</b><br>${driverObj.address}`).openPopup();

  // Create route polyline path
  routePolyline = L.polyline(currentRoutePath, {
    color: '#0284c7',
    weight: 4,
    opacity: 0.8
  }).addTo(map);

  // Moving Vehicle marker
  const vehicleIcon = L.divIcon({
    html: '<div style="background: var(--accent-cyan); width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: var(--shadow-cyan);"></div>',
    className: 'custom-vehicle-icon',
    iconSize: [16, 16]
  });
  
  vehicleMarker = L.marker(currentRoutePath[0], {icon: vehicleIcon}).addTo(map)
    .bindPopup(`<b>Transit Vehicle (Active)</b><br>Operator: ${driverObj.name}`);

  map.setView(currentRoutePath[0], 14);

  // Run GPS coordinate step animation
  animationTimer = setInterval(() => {
    simulateGPSStep();
  }, 2000);
}

function simulateGPSStep() {
  if (!vehicleMarker || currentRoutePath.length === 0) return;

  let nextLatLon;

  if (isOutOfBounds) {
    if (outOfBoundsIndex < outOfBoundsRouteCoords.length) {
      nextLatLon = outOfBoundsRouteCoords[outOfBoundsIndex];
      outOfBoundsIndex++;
      
      if (outOfBoundsIndex >= 2) {
        triggerOutOfBoundsAlarm(nextLatLon);
      }
    } else {
      clearInterval(animationTimer);
      return;
    }
  } else if (isDeviating) {
    if (deviationIndex < deviationRouteCoords.length) {
      nextLatLon = deviationRouteCoords[deviationIndex];
      deviationIndex++;
      
      checkSpatialVariance(nextLatLon);
    } else {
      clearInterval(animationTimer);
      return;
    }
  } else {
    if (currentPathIndex < currentRoutePath.length) {
      nextLatLon = currentRoutePath[currentPathIndex];
      currentPathIndex++;
    } else {
      clearInterval(animationTimer);
      showToast("Vehicle arrived safely at route destination.", "success");
      document.getElementById("route-status-value").textContent = "ARRIVED";
      return;
    }
  }

  vehicleMarker.setLatLng(nextLatLon);
  document.getElementById("telemetry-gps-coords").textContent = `${nextLatLon[0].toFixed(5)}, ${nextLatLon[1].toFixed(5)}`;
  map.panTo(nextLatLon);
}

function checkSpatialVariance(coords) {
  if (deviationIndex >= 1) {
    triggerSafetyAlarm();
  }
}

function triggerSafetyAlarm() {
  const statusIndicator = document.getElementById("global-status-indicator");
  statusIndicator.className = "system-status anomaly";
  document.getElementById("status-text").textContent = "ANOMALY SIGNAL TRIGGERED";

  const routeStatus = document.getElementById("route-status-value");
  routeStatus.textContent = "PATH DEVIATED";
  routeStatus.className = "status-indicator-value danger";

  const gpsStatus = document.getElementById("gps-status-value");
  gpsStatus.textContent = "EMERGENCY";
  gpsStatus.className = "status-indicator-value danger";

  document.getElementById("map-emergency-overlay").classList.add("active");
  document.getElementById("anomaly-warning-banner").classList.add("active");

  // Redraw vehicle marker to red
  const emergencyIcon = L.divIcon({
    html: '<div style="background: var(--accent-red); width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: var(--shadow-red); animation: blink 0.5s infinite alternate;"></div>',
    className: 'custom-vehicle-icon-danger',
    iconSize: [18, 18]
  });
  vehicleMarker.setIcon(emergencyIcon);
  vehicleMarker.setPopupContent(`<b>🚨 EMERGENCY ALERT: VECHICLE DEVIATED</b><br>Driver: ${selectedDriverObj.name}<br>Commuter Name: ${activeHandshake.passengerName}`);
  vehicleMarker.openPopup();

  // CRITICAL SECURITY FEATURE: Revoke the Driver's dynamic PIN
  selectedDriverObj.checkedIn = false;
  selectedDriverObj.pinStatus = "Suspended - Unverified";

  // Update in local database lists
  const dbIndex = drivers.findIndex(d => d.license === selectedDriverObj.license);
  if (dbIndex !== -1) {
    drivers[dbIndex].checkedIn = false;
    drivers[dbIndex].pinStatus = "Suspended - Unverified";
  }

  // Update Dispatcher ledger status badge immediately
  document.getElementById("ledger-driver-status-badge").textContent = "🚨 PIN Suspended";
  document.getElementById("ledger-driver-status-badge").className = "badge badge-red";

  // Update active driver dashboard liveness checks if matching operator logs
  if (activeDriver && activeDriver.license === selectedDriverObj.license) {
    activeDriver.checkedIn = false;
    activeDriver.pinStatus = "Suspended - Unverified";
    
    const driverPinBox = document.getElementById("driver-pin-code");
    driverPinBox.textContent = "REVOKED";
    driverPinBox.style.color = "var(--accent-red)";
    driverPinBox.style.textShadow = "0 0 10px rgba(239, 68, 68, 0.3)";

    const driverSafetyBanner = document.getElementById("driver-checkin-completed-info");
    driverSafetyBanner.style.background = "rgba(239, 68, 68, 0.04)";
    driverSafetyBanner.style.borderColor = "var(--accent-red)";
    driverSafetyBanner.innerHTML = `
      <h3 style="color: var(--accent-red);">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        PIN Suspended & Unverified
      </h3>
      <p style="color: var(--text-primary); font-size: 0.8rem;">Anomalous route deviation detected. Your dynamic boarding PIN has been suspended by the safety network. Contact dispatch to clarify path variance.</p>
    `;
  }

  // Update log entry status
  activeHandshake.status = "🚨 ANOMALOUS DEVIATION - INTERCEPTED";
  updatePassengerLogsTable();

  showToast("EMERGENCY INTERCEPT: Driver safety PIN suspended and revoked.", "danger");
}

// ==========================================
// MISSING PERSONS PORTAL ROUTINES
// ==========================================
function openMissingPersonModal() {
  document.getElementById("missing-person-modal").style.display = "flex";
  document.getElementById("missing-name").value = "";
  document.getElementById("missing-route").value = "";
}

function closeMissingPersonModal() {
  document.getElementById("missing-person-modal").style.display = "none";
}

function submitMissingPersonAlert(event) {
  event.preventDefault();
  const name = document.getElementById("missing-name").value.trim();
  const routeSelect = document.getElementById("missing-route");
  const routeId = routeSelect.value;
  const routeText = routeSelect.options[routeSelect.selectedIndex].text;
  const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  missingPersons.push({
    name,
    routeId,
    routeText,
    timestamp,
    status: "Active Search"
  });

  renderMissingAlertsList();
  closeMissingPersonModal();

  showToast(`🚨 Missing alert broadcasted: ${name} flagged on safety feeds.`, "danger");
}

function renderMissingAlertsList() {
  const listDiv = document.getElementById("dispatcher-missing-list");
  if (!listDiv) return;

  if (missingPersons.length === 0) {
    listDiv.innerHTML = `<div style="text-align: center; font-size: 0.8rem; color: var(--text-muted); padding: 1rem;">No active public missing reports broadcasted.</div>`;
    return;
  }

  listDiv.innerHTML = missingPersons.map(m => `
    <div class="missing-alert-item" onclick="selectMissingAlert('${m.name.replace(/'/g, "\\'")}', '${m.routeId}')" style="background: rgba(239, 68, 68, 0.04); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem; cursor: pointer; transition: all 0.2s ease-in-out; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-weight: 700; font-size: 0.85rem; color: var(--accent-red);">${m.name}</div>
        <div style="font-size: 0.7rem; color: var(--text-secondary);">${m.routeText || m.routeId}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span class="badge badge-red" style="font-size: 0.65rem; padding: 0.2rem 0.5rem;">${m.status}</span>
        <button class="delete-alert-btn" onclick="deleteMissingAlert(event, '${m.name.replace(/'/g, "\\'")}')" style="background: none; border: none; font-size: 1.25rem; color: var(--text-secondary); cursor: pointer; padding: 0 0.25rem; line-height: 1;" title="Resolve Case">&times;</button>
      </div>
    </div>
  `).join("");
}

function selectMissingAlert(name, routeId) {
  // Populate dispatcher search form
  document.getElementById("dispatcher-search-name").value = name;
  document.getElementById("dispatcher-search-route").value = routeId;
  
  // Trigger lookup
  const mockEvent = { preventDefault: () => {} };
  handleEmergencyLookup(mockEvent);
}

function deleteMissingAlert(event, name) {
  event.stopPropagation(); // Avoid triggering details card select search
  missingPersons = missingPersons.filter(m => m.name !== name);
  renderMissingAlertsList();
  showToast(`Commuter ${name} removed from missing ledger.`, "success");
  
  // Clear search panel if they delete the currently viewed user
  const currentSearchName = document.getElementById("dispatcher-search-name").value;
  if (currentSearchName.toLowerCase() === name.toLowerCase()) {
    clearRetrievedDriverDetails();
  }
}

function clearRetrievedDriverDetails() {
  document.getElementById("dispatcher-driver-details-panel").style.display = "none";
  document.getElementById("ledger-search-output").style.display = "none";
  closeDispatcherMessageBox();
  
  if (animationTimer) {
    clearInterval(animationTimer);
  }
  
  isDeviating = false;
  isOutOfBounds = false;
  currentPathIndex = 0;
  deviationIndex = 0;
  outOfBoundsIndex = 0;

  // Clear markers
  if (vehicleMarker && map) map.removeLayer(vehicleMarker);
  if (homeMarker && map) map.removeLayer(homeMarker);
  if (routePolyline && map) map.removeLayer(routePolyline);

  document.getElementById("dispatcher-search-name").value = "";
  document.getElementById("dispatcher-search-route").value = "";
}

function triggerRouteDeviation() {
  if (!selectedDriverObj) {
    showToast("Retrieve ride credentials first.", "danger");
    return;
  }
  
  isDeviating = true;
  isOutOfBounds = false;
  deviationIndex = 0;
  currentPathIndex = 0; // Begin from home path coordinates

  // Update floating alert details
  document.getElementById("floating-driver-alert-text").innerHTML = `
    Operator: <strong>${selectedDriverObj.name}</strong> (Plate: <strong>${selectedDriverObj.plate}</strong>)<br>
    Declared Pathway: <strong>${selectedDriverObj.routeText || selectedDriverObj.routeId}</strong><br>
    Status: 🚨 Vehicle departing declared pathway. Safety PIN suspended.
  `;

  // Reveal map coordinates panel
  document.getElementById("ledger-search-output").style.display = "block";

  setTimeout(() => {
    if (!map) {
      initTelemetryMap();
    }
    map.invalidateSize();
    startTelemetryTrip(selectedDriverObj);
  }, 100);

  showToast("Simulating route deviation. Vehicle tracking active.", "warning");
}

function triggerOutOfBoundsRoute() {
  if (!selectedDriverObj) {
    showToast("Retrieve ride credentials first.", "danger");
    return;
  }
  
  isOutOfBounds = true;
  isDeviating = false;
  outOfBoundsIndex = 0;
  currentPathIndex = 0; // Begin from home path coordinates

  // Update floating alert details
  document.getElementById("floating-driver-alert-text").innerHTML = `
    Operator: <strong>${selectedDriverObj.name}</strong> (Plate: <strong>${selectedDriverObj.plate}</strong>)<br>
    Declared Pathway: <strong>${selectedDriverObj.routeText || selectedDriverObj.routeId}</strong><br>
    Status: 🚨 Sector Breach. Crossing metropolitan safety boundaries.
  `;

  // Reveal map coordinates panel
  document.getElementById("ledger-search-output").style.display = "block";

  setTimeout(() => {
    if (!map) {
      initTelemetryMap();
    }
    map.invalidateSize();
    startTelemetryTrip(selectedDriverObj);
  }, 100);

  showToast("Simulating out-of-bounds breach. Vehicle tracking active.", "warning");
}

function triggerOutOfBoundsAlarm(coords) {
  const statusIndicator = document.getElementById("global-status-indicator");
  statusIndicator.className = "system-status anomaly";
  document.getElementById("status-text").textContent = "OUT OF BOUNDS ALARM TRIGGERED";

  const routeStatus = document.getElementById("route-status-value");
  routeStatus.textContent = "OUT OF SECTOR";
  routeStatus.className = "status-indicator-value danger";

  const gpsStatus = document.getElementById("gps-status-value");
  gpsStatus.textContent = "ILLEGAL SECTOR";
  gpsStatus.className = "status-indicator-value danger";

  document.getElementById("map-emergency-overlay").classList.add("active");

  // Redraw vehicle marker to red flash
  const emergencyIcon = L.divIcon({
    html: '<div style="background: var(--accent-red); width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: var(--shadow-red); animation: blink 0.5s infinite alternate;"></div>',
    className: 'custom-vehicle-icon-danger',
    iconSize: [18, 18]
  });
  vehicleMarker.setIcon(emergencyIcon);
  vehicleMarker.setPopupContent(`<b>🚨 EMERGENCY ALARM: SECTOR BOUNDARY BREACHED</b><br>Driver: ${selectedDriverObj.name}<br>Commuter Name: ${activeHandshake.passengerName}`);
  vehicleMarker.openPopup();

  // Send broadcast alert message warning card to the dispatcher
  const messageBox = document.getElementById("dispatcher-message-box");
  const messageContent = document.getElementById("dispatcher-message-content");
  if (messageBox && messageContent) {
    messageContent.innerHTML = `
      <strong>🚨 METROPOLITAN SECTOR BOUNDARY BREACHED</strong><br>
      Vehicle Operator: <strong>${selectedDriverObj.name}</strong> (Plate: <strong>${selectedDriverObj.plate}</strong>)<br>
      Commuter Passenger: <strong>${activeHandshake.passengerName}</strong><br>
      GPS coordinates logged: <strong>[${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}]</strong>.<br>
      Safety Status: Driver daily safety PIN credentials immediately <strong>SUSPENDED</strong>. FRSC Sector Patrol command alerts active.
    `;
    messageBox.style.display = "block";
    messageBox.scrollIntoView({ behavior: 'smooth' });
  }

  // Revoke driver PIN
  selectedDriverObj.checkedIn = false;
  selectedDriverObj.pinStatus = "Suspended - Unverified";

  // Update databases
  const dbIndex = drivers.findIndex(d => d.license === selectedDriverObj.license);
  if (dbIndex !== -1) {
    drivers[dbIndex].checkedIn = false;
    drivers[dbIndex].pinStatus = "Suspended - Unverified";
  }

  document.getElementById("ledger-driver-status-badge").textContent = "🚨 PIN Suspended";
  document.getElementById("ledger-driver-status-badge").className = "badge badge-red";

  if (activeDriver && activeDriver.license === selectedDriverObj.license) {
    activeDriver.checkedIn = false;
    activeDriver.pinStatus = "Suspended - Unverified";
    
    const driverPinBox = document.getElementById("driver-pin-code");
    driverPinBox.textContent = "REVOKED";
    driverPinBox.style.color = "var(--accent-red)";
    driverPinBox.style.textShadow = "0 0 10px rgba(239, 68, 68, 0.3)";

    const driverSafetyBanner = document.getElementById("driver-checkin-completed-info");
    driverSafetyBanner.style.background = "rgba(239, 68, 68, 0.04)";
    driverSafetyBanner.style.borderColor = "var(--accent-red)";
    driverSafetyBanner.innerHTML = `
      <h3 style="color: var(--accent-red);">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        PIN Suspended & Unverified
      </h3>
      <p style="color: var(--text-primary); font-size: 0.8rem;">Metropolitan safety boundary breach detected. Your dynamic boarding PIN has been suspended. Sector authorities have been dispatched.</p>
    `;
  }

  activeHandshake.status = "🚨 SECTOR BREACH - OUT OF BOUNDS";
  updatePassengerLogsTable();

  showToast("BOUNDARY SECURITY ALARM: Dispatcher emergency alert broadcasted.", "danger");
}

function closeDispatcherMessageBox() {
  const box = document.getElementById("dispatcher-message-box");
  if (box) box.style.display = "none";
}
