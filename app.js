// LifeBridge AI Emergency Response Operations Controller

// Global App State
let appState = {
  currentScenario: "clear",
  activeFilters: {
    shelters: true,
    roads: true,
    hospitals: true
  },
  activeGuideCategory: "flood",
  lowBandwidthMode: false,
  requests: [...window.emergencyData.initialRequests],
  communityOffers: [...window.emergencyData.initialCommunityOffers],
  selectedLocationId: null,
  checklistStates: {}
};

// Initialize Checklist States
function initChecklistStates() {
  const checklists = window.emergencyData.survivalChecklists;
  for (const cat in checklists) {
    appState.checklistStates[cat] = {};
    checklists[cat].forEach(item => {
      appState.checklistStates[cat][item.id] = false;
    });
  }
}

// Start Lifecycle
document.addEventListener("DOMContentLoaded", () => {
  initChecklistStates();
  renderAll();

  // Send welcome message
  addChatMessage("assistant", window.aiAssistant.getAIResponse("help", appState.currentScenario));

  // Live simulation update ticker (simulates dispatch triage activity)
  setInterval(simulateEmergencyUpdates, 15000);
});

// Primary Rendering Master function
function renderAll() {
  renderAlerts();
  renderContacts();
  renderTriageQueue();
  renderSuppliesCalculator();
  renderChecklist();
  renderCommunityBoard();

  if (appState.lowBandwidthMode) {
    renderLowBandwidthDashboard();
  } else {
    renderVectorMap();
  }
}

// 1. Render Alerts Ticker
function renderAlerts() {
  const ticker = document.getElementById("alerts-ticker");
  const scenario = window.emergencyData.scenarios[appState.currentScenario];
  ticker.innerHTML = "";

  scenario.alerts.forEach(alert => {
    const item = document.createElement("span");
    item.className = `ticker-item ${alert.type}`;

    let icon = "🔔";
    if (alert.type === "danger") icon = "🚨";
    if (alert.type === "warning") icon = "⚠️";

    item.innerHTML = `${icon} <strong>${alert.title}:</strong> ${alert.desc}`;
    ticker.appendChild(item);
  });
}

// 2. Render Emergency Contacts Quick Dial
function renderContacts() {
  const listEl = document.getElementById("contacts-list");
  listEl.innerHTML = "";

  window.emergencyData.contacts.general.forEach(c => {
    const item = document.createElement("div");
    item.className = "contact-item";

    let icon = "📞";
    if (c.icon === "shield") icon = "🛡️";
    if (c.icon === "heart") icon = "❤️";
    if (c.icon === "anchor") icon = "⚓";

    item.innerHTML = `
      <div class="contact-info">
        <h3>${icon} ${c.name}</h3>
        <p>${c.phone}</p>
      </div>
      <a href="tel:${c.phone.split(" ")[0]}" class="contact-btn">Dial</a>
    `;
    listEl.appendChild(item);
  });
}

// 3. Render Triage Dispatch Queue
function renderTriageQueue() {
  const queueEl = document.getElementById("dispatch-queue");
  queueEl.innerHTML = "";

  // Sort requests: danger first, then warning, then info
  const severityWeight = { danger: 3, warning: 2, info: 1 };
  const sortedRequests = [...appState.requests].sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

  sortedRequests.forEach(req => {
    const item = document.createElement("div");
    item.className = `dispatch-item ${req.severity}`;

    let badgeClass = "badge-info";
    if (req.status === "Dispatched") badgeClass = "badge-success";
    if (req.status === "Processing") badgeClass = "badge-warning";
    if (req.status === "Queued") badgeClass = "badge-danger";

    item.innerHTML = `
      <div class="dispatch-body">
        <h4>${req.name} (${req.sector})</h4>
        <p><strong>${req.type}:</strong> ${req.desc}</p>
      </div>
      <div class="dispatch-meta">
        <span class="badge ${badgeClass}">${req.status}</span>
        <span class="time-stamp">${req.time}</span>
      </div>
    `;
    queueEl.appendChild(item);
  });
}

// 4. Submit Emergency Triage Request
window.submitEmergencyRequest = function (event) {
  event.preventDefault();

  const name = document.getElementById("req-name").value.trim();
  const sector = document.getElementById("req-sector").value.trim();
  const type = document.getElementById("req-type").value;
  const severity = document.getElementById("req-severity").value;
  const desc = document.getElementById("req-desc").value.trim();

  if (!name || !sector || !desc) return;

  const newReq = {
    id: `req-custom-${Date.now()}`,
    name,
    sector,
    type,
    desc,
    severity,
    status: "Queued",
    time: "Just now"
  };

  appState.requests.unshift(newReq);
  renderTriageQueue();

  // Alert the AI chatbot to prompt advice
  let promptMsg = `My name is ${name} in ${sector}. I submitted an emergency request for ${type}: ${desc}`;
  addChatMessage("user", promptMsg);

  setTimeout(() => {
    let aiResponse = {
      text: `### Request Received & Triaged\n\n🚨 **Hello ${name}**, I have registered your emergency report in the dispatch database. \n\n* **Reported Location**: ${sector}\n* **Assigned Severity**: **${severity.toUpperCase()}**\n\nEmergency dispatch is monitoring this queue. Please stay calm. If you have immediate access to safety, do not wait.`,
      action: "dispatch-ack"
    };
    addChatMessage("assistant", aiResponse);
  }, 1000);

  // Clear Form
  document.getElementById("triage-form").reset();
};

// 5. Simulated real-time dispatch state adjustments
function simulateEmergencyUpdates() {
  // Find first "Queued" request and change to Processing
  let queued = appState.requests.find(r => r.status === "Queued");
  if (queued) {
    queued.status = "Processing";
    queued.time = "Updated just now";
    renderTriageQueue();
    return;
  }

  // Find first "Processing" and change to Dispatched
  let processing = appState.requests.find(r => r.status === "Processing");
  if (processing) {
    processing.status = "Dispatched";
    processing.time = "Updated just now";
    renderTriageQueue();
    return;
  }
}

// 6. Vector Map Rendering
function renderVectorMap() {
  const roadsGroup = document.getElementById("map-roads-group");
  const markersGroup = document.getElementById("map-markers-group");
  const pathsGroup = document.getElementById("map-paths-group");

  roadsGroup.innerHTML = "";
  markersGroup.innerHTML = "";
  pathsGroup.innerHTML = "";

  const scenario = window.emergencyData.scenarios[appState.currentScenario];

  // Road Segment mapping (coordinates in %)
  // x1, y1, x2, y2 coordinates map directly to percentage points on 500x350 box
  const roadCoordinates = {
    "rd-1": { x1: 125, y1: 105, x2: 375, y2: 70 },   // sh-1 to sh-2 (Highway 10 North)
    "rd-2": { x1: 250, y1: 157.5, x2: 225, y2: 262.5 }, // hp-1 to sh-3 (Bridge Central)
    "rd-3": { x1: 225, y1: 262.5, x2: 400, y2: 245 },   // sh-3 to sh-4 (Valley Highway South)
    "rd-4": { x1: 425, y1: 140, x2: 400, y2: 245 },   // hp-3 to sh-4 (Coastal Highway East)
    "rd-5": { x1: 75, y1: 227.5, x2: 125, y2: 105 }   // hp-2 to sh-1 (Mountain Pass West)
  };

  // Draw Roads
  if (appState.activeFilters.roads) {
    scenario.roads.forEach(rd => {
      const coords = roadCoordinates[rd.id];
      if (!coords) return;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", coords.x1);
      line.setAttribute("y1", coords.y1);
      line.setAttribute("x2", coords.x2);
      line.setAttribute("y2", coords.y2);

      let strokeColorClass = "safe";
      let strokeWidth = 3;
      if (rd.status === "Blocked") strokeColorClass = "blocked";
      if (rd.status === "Hazardous") strokeColorClass = "hazardous";

      line.setAttribute("class", `map-road-line ${strokeColorClass}`);
      line.setAttribute("stroke-width", strokeWidth);

      // Event triggers
      line.addEventListener("mousemove", (e) => showMapTooltip(e, `<strong>${rd.name}</strong><br>Status: ${rd.status}<br>${rd.notes}`));
      line.addEventListener("mouseleave", hideMapTooltip);
      line.addEventListener("click", () => selectRoad(rd));

      roadsGroup.appendChild(line);

      // Label
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", (coords.x1 + coords.x2) / 2);
      text.setAttribute("y", (coords.y1 + coords.y2) / 2 - 6);
      text.setAttribute("class", "map-road-label");
      text.setAttribute("text-anchor", "middle");
      text.textContent = rd.name.split(" ")[0];
      roadsGroup.appendChild(text);
    });
  }

  // Gather all marker elements (shelters & hospitals)
  let markers = [];

  if (appState.activeFilters.shelters) {
    scenario.shelters.forEach(sh => {
      markers.push({
        id: sh.id,
        name: sh.name,
        x: sh.x * 5, // Translate % to 500 max SVG
        y: sh.y * 3.5, // Translate % to 350 max SVG
        type: "shelter",
        status: sh.status,
        color: sh.status.includes("Open") ? "#30d158" : (sh.status.includes("Full") ? "#ff9f0a" : "#ff3b30"),
        data: sh
      });
    });
  }

  if (appState.activeFilters.hospitals) {
    scenario.hospitals.forEach(hp => {
      markers.push({
        id: hp.id,
        name: hp.name,
        x: hp.x * 5,
        y: hp.y * 3.5,
        type: "hospital",
        status: hp.status,
        color: hp.status.includes("Closed") ? "#ff3b30" : "#ff453a",
        data: hp
      });
    });
  }

  // Render Markers
  markers.forEach(m => {
    // Group container
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Pulsing outer ring for active evacuations or emergencies
    if (m.type === "shelter" && m.status.includes("Open")) {
      const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      ring.setAttribute("cx", m.x);
      ring.setAttribute("cy", m.y);
      ring.setAttribute("r", 14);
      ring.setAttribute("fill", "none");
      ring.setAttribute("stroke", m.color);
      ring.setAttribute("stroke-width", "1.5");
      ring.setAttribute("class", "node-ring");
      g.appendChild(ring);
    }

    // Core dot
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", m.x);
    circle.setAttribute("cy", m.y);
    circle.setAttribute("r", m.type === "hospital" ? 9 : 8);
    circle.setAttribute("fill", m.color);
    circle.setAttribute("stroke", "#ffffff");
    circle.setAttribute("stroke-width", "1.5");
    circle.setAttribute("class", "map-node");

    if (m.id === appState.selectedLocationId) {
      circle.setAttribute("stroke", "#bf5af2");
      circle.setAttribute("stroke-width", "3");
      circle.setAttribute("r", m.type === "hospital" ? 11 : 10);
    }

    // Inner icon symbol
    const symbol = document.createElementNS("http://www.w3.org/2000/svg", "path");
    if (m.type === "hospital") {
      // Draw a cross
      symbol.setAttribute("d", `M ${m.x - 4} ${m.y} L ${m.x + 4} ${m.y} M ${m.x} ${m.y - 4} L ${m.x} ${m.y + 4}`);
      symbol.setAttribute("stroke", "#ffffff");
      symbol.setAttribute("stroke-width", "2");
    } else {
      // Draw a shelter peak
      symbol.setAttribute("d", `M ${m.x - 4} ${m.y + 3} L ${m.x} ${m.y - 3} L ${m.x + 4} ${m.y + 3}`);
      symbol.setAttribute("stroke", "#000000");
      symbol.setAttribute("stroke-width", "1.5");
      symbol.setAttribute("fill", "none");
    }

    // Interactive mouse listeners
    circle.addEventListener("mousemove", (e) => showMapTooltip(e, `<strong>${m.name}</strong><br>Type: ${m.type.toUpperCase()}<br>Status: ${m.status}`));
    circle.addEventListener("mouseleave", hideMapTooltip);
    circle.addEventListener("click", () => selectLocation(m));

    g.appendChild(circle);
    g.appendChild(symbol);
    markersGroup.appendChild(g);
  });
}

// Tooltip management
function showMapTooltip(event, htmlContent) {
  const tooltip = document.getElementById("map-tooltip");
  const viewport = document.getElementById("map-viewport");
  const rect = viewport.getBoundingClientRect();

  tooltip.innerHTML = htmlContent;
  tooltip.style.opacity = "1";

  // Calculate relative mouse positions
  const x = event.clientX - rect.left + 12;
  const y = event.clientY - rect.top + 12;

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function hideMapTooltip() {
  const tooltip = document.getElementById("map-tooltip");
  tooltip.style.opacity = "0";
}

// Select details card content
function selectLocation(marker) {
  appState.selectedLocationId = marker.id;
  renderVectorMap(); // updates selection rings

  const detailCard = document.getElementById("map-detail-card");
  detailCard.className = "map-detail-card"; // remove hidden-element

  const m = marker.data;
  if (marker.type === "shelter") {
    detailCard.innerHTML = `
      <div>
        <h4>🏠 ${m.name}</h4>
        <p>${m.address} | Occupancy: <strong>${m.filled}/${m.capacity}</strong></p>
        <p>Facilities: ${m.pets ? "🐾 Pets Allowed" : "🚫 No Pets"} | ${m.medical ? "⚕️ Doctor Present" : "No Medical Staff"}</p>
      </div>
      <div>
        <span class="badge ${m.status.includes("Open") ? "badge-success" : "badge-danger"}">${m.status}</span>
        <button class="btn btn-sm btn-accent" style="margin-left: 8px;" onclick="promptChatAbout('${m.name}')">Ask AI</button>
      </div>
    `;
  } else {
    detailCard.innerHTML = `
      <div>
        <h4>🏥 ${m.name}</h4>
        <p>${m.address} | Phone: <strong>${m.phone}</strong></p>
        <p>Occupancy state: <strong>${m.occupancy}</strong></p>
      </div>
      <div>
        <span class="badge ${m.status === "Active" ? "badge-success" : "badge-danger"}">${m.status}</span>
        <button class="btn btn-sm btn-accent" style="margin-left: 8px;" onclick="promptChatAbout('${m.name}')">Ask AI</button>
      </div>
    `;
  }
}

function selectRoad(road) {
  const detailCard = document.getElementById("map-detail-card");
  detailCard.className = "map-detail-card";

  const statusBadge = road.status === "Safe" ? "badge-success" : (road.status === "Hazardous" ? "badge-warning" : "badge-danger");

  detailCard.innerHTML = `
    <div>
      <h4>🚧 ${road.name}</h4>
      <p>Report: <strong>${road.notes}</strong></p>
    </div>
    <div>
      <span class="badge ${statusBadge}">${road.status}</span>
      <button class="btn btn-sm btn-accent" style="margin-left: 8px;" onclick="promptChatAbout('${road.name}')">Ask AI</button>
    </div>
  `;
}

// 7. Route Safety Inspector Logic
window.calculateRouteSafety = function () {
  const startVal = document.getElementById("route-start").value;
  const endVal = document.getElementById("route-end").value;
  const resultBox = document.getElementById("route-result");

  const scenario = window.emergencyData.scenarios[appState.currentScenario];

  // Define simple paths (what roads are used for each combination)
  const routePaths = {
    "West Sector": {
      "sh-1": ["rd-5"],
      "sh-2": ["rd-5", "rd-1"],
      "sh-4": ["rd-5", "rd-2", "rd-3"],
      "hp-1": ["rd-5", "rd-2"]
    },
    "Central": {
      "sh-1": ["rd-1"],
      "sh-2": ["rd-1"],
      "sh-4": ["rd-2", "rd-3"],
      "hp-1": []
    },
    "North Sector": {
      "sh-1": [],
      "sh-2": ["rd-1"],
      "sh-4": ["rd-1", "rd-4"],
      "hp-1": ["rd-1", "rd-2"]
    },
    "South Sector": {
      "sh-1": ["rd-2", "rd-1"],
      "sh-2": ["rd-2", "rd-1"],
      "sh-4": ["rd-3"],
      "hp-1": ["rd-2"]
    }
  };

  const segments = routePaths[startVal]?.[endVal] || [];
  resultBox.className = "route-result-box"; // remove hidden

  if (segments.length === 0) {
    resultBox.className += " safe";
    resultBox.innerHTML = `🏁 <strong>Destination Reached:</strong> You are already within this sector range.`;
    return;
  }

  let blockedDetails = [];
  let hazardousDetails = [];

  segments.forEach(segId => {
    const rd = scenario.roads.find(r => r.id === segId);
    if (!rd) return;
    if (rd.status === "Blocked") blockedDetails.push(rd);
    if (rd.status === "Hazardous") hazardousDetails.push(rd);
  });

  if (blockedDetails.length > 0) {
    resultBox.className += " blocked";
    let desc = blockedDetails.map(rd => `<strong>${rd.name}</strong> (${rd.notes})`).join("<br>");
    resultBox.innerHTML = `🛑 <strong>ROUTE BLOCKED:</strong> We cannot recommend this route.<br>${desc}`;
  } else if (hazardousDetails.length > 0) {
    resultBox.className += " blocked"; // styled orange/red alert
    let desc = hazardousDetails.map(rd => `<strong>${rd.name}</strong> (${rd.notes})`).join("<br>");
    resultBox.innerHTML = `⚠️ <strong>HAZARDOUS CORRIDOR:</strong> Proceed with caution. Slow transit expected:<br>${desc}`;
  } else {
    resultBox.className += " safe";
    resultBox.innerHTML = `✅ <strong>ROUTE CLEAR & SAFE:</strong> Road conditions along this corridor are reported stable. Target checkpoints are clear.`;
  }
};

// 8. Emergency Supply Calculator
window.calculateSupplies = function () {
  const adults = parseInt(document.getElementById("calc-adults").value) || 0;
  const children = parseInt(document.getElementById("calc-children").value) || 0;
  const pets = parseInt(document.getElementById("calc-pets").value) || 0;
  const days = parseInt(document.getElementById("calc-days").value) || 3;

  const totalPeople = adults + children;

  // Formulas
  const water = (totalPeople * 4 + pets * 2) * days; // Liters
  const food = (totalPeople * 2000 + pets * 800) * days; // Calories
  const meals = Math.ceil(food / 700); // 700 cal canned meal pack average
  const medicalKits = Math.ceil(totalPeople / 4);
  const batteries = (adults * 2 + children * 1) * (days > 3 ? 4 : 2);
  const flashlights = Math.max(1, adults);

  const resultsEl = document.getElementById("calc-results");
  resultsEl.innerHTML = `
    <div class="calc-grid">
      <div class="calc-item calc-item-name">🥤 Clean Water Needs</div>
      <div class="calc-item calc-item-val">${water} Liters</div>
      
      <div class="calc-item calc-item-name">🥫 Canned/Dry Food Meals</div>
      <div class="calc-item calc-item-val">${meals} Meals (${food.toLocaleString()} Calories)</div>
      
      <div class="calc-item calc-item-name">⚕️ First-Aid Kits</div>
      <div class="calc-item calc-item-val">${medicalKits} Standard Pack</div>
      
      <div class="calc-item calc-item-name">🔦 Flashlights Required</div>
      <div class="calc-item calc-item-val">${flashlights} Units</div>
      
      <div class="calc-item calc-item-name">🔋 Spare Batteries</div>
      <div class="calc-item calc-item-val">${batteries} Cells (AA/AAA)</div>
    </div>
  `;
};

function renderSuppliesCalculator() {
  calculateSupplies();
}

// 9. Survival Guides Checklist
window.loadGuideCategory = function (category) {
  appState.activeGuideCategory = category;

  // Highlight Category button
  const buttons = document.querySelectorAll(".btn-guide-cat");
  buttons.forEach(btn => {
    btn.classList.remove("active");
    if (btn.id === `btn-guide-${category}`) btn.classList.add("active");
  });

  renderChecklist();
};

function renderChecklist() {
  const cat = appState.activeGuideCategory;
  const container = document.getElementById("checklist-items");
  container.innerHTML = "";

  const list = window.emergencyData.survivalChecklists[cat] || [];

  let checkedCount = 0;

  list.forEach(item => {
    const isChecked = appState.checklistStates[cat][item.id] || false;
    if (isChecked) checkedCount++;

    const div = document.createElement("div");
    div.className = `chk-item ${isChecked ? "checked" : ""}`;
    div.innerHTML = `
      <input type="checkbox" id="chk-${item.id}" ${isChecked ? "checked" : ""} onchange="toggleChecklistItem('${cat}', '${item.id}')">
      <span>${item.text}</span>
    `;
    div.onclick = (e) => {
      if (e.target.tagName !== "INPUT") {
        const chk = document.getElementById(`chk-${item.id}`);
        chk.checked = !chk.checked;
        toggleChecklistItem(cat, item.id);
      }
    };
    container.appendChild(div);
  });

  // Calculate percentage
  const pct = list.length > 0 ? Math.round((checkedCount / list.length) * 100) : 0;
  document.getElementById("guide-progress-pct").textContent = `${pct}%`;
  document.getElementById("guide-progress-fill").style.width = `${pct}%`;
}

window.toggleChecklistItem = function (cat, itemId) {
  const isChecked = appState.checklistStates[cat][itemId];
  appState.checklistStates[cat][itemId] = !isChecked;
  renderChecklist();
};

// 10. Community P2P Help Board
window.submitCommunityOffer = function (event) {
  event.preventDefault();

  const author = document.getElementById("co-name").value.trim();
  const contact = document.getElementById("co-phone").value.trim();
  const category = document.getElementById("co-cat").value;
  const offer = document.getElementById("co-desc").value.trim();

  if (!author || !contact || !offer) return;

  const newOffer = {
    id: `co-custom-${Date.now()}`,
    author,
    contact,
    offer,
    category,
    verified: false
  };

  appState.communityOffers.unshift(newOffer);
  renderCommunityBoard();

  // Clear Form
  document.getElementById("community-form").reset();
};

function renderCommunityBoard() {
  const boardEl = document.getElementById("community-listings");
  boardEl.innerHTML = "";

  appState.communityOffers.forEach(co => {
    const item = document.createElement("div");
    item.className = "community-item";

    const verifiedBadge = co.verified
      ? `<span class="co-verified">✔️ Verified Volunteer</span>`
      : `<span class="co-phone">Pending Verification</span>`;

    item.innerHTML = `
      <div class="co-header">
        <span class="co-author">${co.author}</span>
        <span class="co-tag">${co.category}</span>
      </div>
      <p class="co-desc">${co.offer}</p>
      <div class="co-footer">
        <span class="co-phone">☎️ ${co.contact}</span>
        ${verifiedBadge}
      </div>
    `;
    boardEl.appendChild(item);
  });
}

// 11. Tab Switching for Right Column
window.switchToolsTab = function (tabName) {
  // Hide all panels
  document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));

  // Show active
  document.getElementById(`tab-content-${tabName}`).classList.add("active");
  document.getElementById(`tab-btn-${tabName}`).classList.add("active");
};

// 12. Chatbot Dialogues
window.sendChatMessage = function () {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;

  // Add user bubble
  addChatMessage("user", text);
  input.value = "";

  // Typing state
  const typingId = addChatTypingIndicator();

  setTimeout(() => {
    removeChatTypingIndicator(typingId);
    const response = window.aiAssistant.getAIResponse(text, appState.currentScenario);
    addChatMessage("assistant", response);
  }, 900 + Math.random() * 500); // realistic delay
};

function addChatMessage(sender, data) {
  const chatMessages = document.getElementById("chat-messages");
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${sender}`;

  if (sender === "user") {
    bubble.textContent = data;
  } else {
    // Clean text for speech synthesis
    const rawText = data.text;
    const cleanText = rawText.replace(/\*\*/g, "").replace(/\*/g, "").replace(/###/g, "").replace(/##/g, "").replace(/#/g, "").replace(/`/g, "");
    const encodedText = encodeURIComponent(cleanText);
    
    // Markdown formatting helper + Voice Button
    bubble.innerHTML = `
      <div class="chat-text-content">${formatMarkdown(rawText)}</div>
      <button class="voice-btn" onclick="speakChatText(this, decodeURIComponent('${encodedText}'))" title="Read Aloud">🔊</button>
    `;
  }

  chatMessages.appendChild(bubble);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

let currentUtterance = null;
window.speakChatText = function (btn, text) {
  if (window.speechSynthesis) {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      document.querySelectorAll(".voice-btn").forEach(b => b.classList.remove("playing"));
      if (currentUtterance && currentUtterance.btn === btn) {
        currentUtterance = null;
        return;
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    let voiceLang = "en-US";
    if (currentLanguage === "es") voiceLang = "es-ES";
    if (currentLanguage === "hi") voiceLang = "hi-IN";
    if (currentLanguage === "fr") voiceLang = "fr-FR";
    
    const matchingVoice = voices.find(v => v.lang.startsWith(currentLanguage) || v.lang.startsWith(voiceLang));
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }
    utterance.lang = voiceLang;

    utterance.onstart = () => {
      btn.classList.add("playing");
    };

    utterance.onend = () => {
      btn.classList.remove("playing");
    };

    utterance.onerror = () => {
      btn.classList.remove("playing");
    };

    currentUtterance = { utterance, btn };
    window.speechSynthesis.speak(utterance);
  } else {
    alert("Text-to-speech is not supported in this browser.");
  }
};

function addChatTypingIndicator() {
  const chatMessages = document.getElementById("chat-messages");
  const wrap = document.createElement("div");
  wrap.className = "chat-bubble assistant typing-indicator";
  wrap.id = `typing-${Date.now()}`;
  wrap.innerHTML = `
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  `;
  chatMessages.appendChild(wrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return wrap.id;
}

function removeChatTypingIndicator(id) {
  const indicator = document.getElementById(id);
  if (indicator) indicator.remove();
}

function formatMarkdown(text) {
  let html = text;

  // Header sizes
  html = html.replace(/### (.*?)\n/g, '<h3>$1</h3>');
  html = html.replace(/## (.*?)\n/g, '<h2>$1</h2>');

  // Strong
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Bullet lists
  html = html.replace(/^- (.*?)\n/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>');

  // Linebreaks
  html = html.replace(/\n/g, '<br>');

  return html;
}

window.focusOnMap = function (locationId) {
  // If in low bandwidth mode, don't focus map but alert user
  if (appState.lowBandwidthMode) {
    alert(`Map details disabled in Low Bandwidth mode. Location: ${locationId}`);
    return;
  }

  appState.selectedLocationId = locationId;
  renderVectorMap();

  // Find location and update detail card
  const scenario = window.emergencyData.scenarios[appState.currentScenario];
  let loc = scenario.shelters.find(s => s.id === locationId);
  let type = "shelter";
  if (!loc) {
    loc = scenario.hospitals.find(h => h.id === locationId);
    type = "hospital";
  }
  if (!loc) {
    loc = scenario.roads.find(r => r.id === locationId);
    type = "road";
  }

  if (loc) {
    if (type === "road") {
      selectRoad(loc);
    } else {
      selectLocation({ id: loc.id, type, data: loc });
    }

    // Smooth scroll map viewport into view if on small screens
    document.getElementById("map-card-panel").scrollIntoView({ behavior: "smooth" });
  }
};

window.promptChatAbout = function (name) {
  const input = document.getElementById("chat-input");
  input.value = `Tell me about ${name}`;
  sendChatMessage();
};

// 13. Scenario Sandbox Handler
window.setScenario = function (scenId) {
  appState.currentScenario = scenId;
  appState.selectedLocationId = null;

  // Update sandbox active buttons classes
  const buttons = document.querySelectorAll(".btn-scen");
  buttons.forEach(btn => {
    btn.classList.remove("active");
  });
  document.getElementById(`btn-scen-${scenId}`).classList.add("active");

  // Update Body styling context
  document.body.className = "";
  if (scenId !== "clear") {
    document.body.classList.add(`scenario-${scenId}`);
  }

  // Reset selected detail card
  document.getElementById("map-detail-card").className = "map-detail-card hidden-element";
  document.getElementById("route-result").className = "route-result-box hidden-element";

  // Re-render
  renderAll();

  // Notify user in chat
  let systemMsg = {
    text: `⚠️ **SYSTEM TRIGGER:** Active Scenario updated to: **${window.emergencyData.scenarios[scenId].title}**.\n\nAll real-time sensors, alerts, roadblocks, shelter statuses, and guidance documents have refreshed.`,
    action: "scenario-changed"
  };
  addChatMessage("assistant", systemMsg);
};

// 14. Low Bandwidth / Offline Mode Toggle
window.toggleLowBandwidth = function () {
  appState.lowBandwidthMode = !appState.lowBandwidthMode;

  const body = document.body;
  const banner = document.getElementById("low-bandwidth-banner");

  if (appState.lowBandwidthMode) {
    body.classList.add("low-bandwidth-active");
    banner.classList.remove("hidden-element");
  } else {
    body.classList.remove("low-bandwidth-active");
    banner.classList.add("hidden-element");
  }

  renderAll();
};

function renderLowBandwidthDashboard() {
  const shList = document.getElementById("lb-shelters-list");
  const rdList = document.getElementById("lb-roads-list");
  const hpList = document.getElementById("lb-hospitals-list");

  shList.innerHTML = "";
  rdList.innerHTML = "";
  hpList.innerHTML = "";

  const scenario = window.emergencyData.scenarios[appState.currentScenario];

  // Shelters
  scenario.shelters.forEach(sh => {
    const item = document.createElement("div");
    item.className = `lb-item ${sh.status === "Full" ? "danger" : "safe"}`;
    item.innerHTML = `
      <strong>${sh.name}</strong> - ${sh.status}<br>
      Capacity: ${sh.filled}/${sh.capacity} | Address: ${sh.address}<br>
      Pets: ${sh.pets ? "Yes" : "No"} | Medical: ${sh.medical ? "Yes" : "No"}
    `;
    shList.appendChild(item);
  });

  // Roads
  scenario.roads.forEach(rd => {
    const item = document.createElement("div");
    item.className = `lb-item ${rd.status === "Blocked" ? "danger" : (rd.status === "Hazardous" ? "warning" : "")}`;
    item.innerHTML = `
      <strong>${rd.name}</strong> - Status: <strong>${rd.status}</strong><br>
      Notes: ${rd.notes}
    `;
    rdList.appendChild(item);
  });

  // Hospitals
  scenario.hospitals.forEach(hp => {
    const item = document.createElement("div");
    item.className = `lb-item ${hp.status !== "Active" ? "danger" : ""}`;
    item.innerHTML = `
      <strong>${hp.name}</strong> - Status: ${hp.status} (Tel: ${hp.phone})<br>
      Occupancy: ${hp.occupancy} | Address: ${hp.address}
    `;
    hpList.appendChild(item);
  });
}
