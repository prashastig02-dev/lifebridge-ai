// LifeBridge AI Chatbot Logic

const aiAssistant = {
  getAIResponse: function(query, scenarioId) {
    const cleanQuery = query.toLowerCase().trim();
    const data = window.emergencyData;
    const scenario = data.scenarios[scenarioId] || data.scenarios.clear;
    
    // Help & Greetings
    if (cleanQuery === "hello" || cleanQuery === "hi" || cleanQuery === "help" || cleanQuery.includes("start")) {
      return {
        text: `**Hello, I am LifeBridge AI**, your emergency response assistant. 
        
I monitor active threats and coordinate relief data. You can ask me:
- 🏥 *'Where is the nearest hospital?'*
- 🏠 *'Find open shelters near me'*
- 🚗 *'Is the bridge or Highway 10 safe to drive?'*
- 📦 *'What supplies do I need?'*

*Current active scenario:* **${scenario.title}**.`,
        action: "greet"
      };
    }
    
    // Medical Emergency / Ambulance / Injury
    if (cleanQuery.includes("medical") || cleanQuery.includes("hospital") || cleanQuery.includes("doctor") || cleanQuery.includes("injured") || cleanQuery.includes("hurt") || cleanQuery.includes("ambulance")) {
      let responseText = `### Emergency Medical Support\n\n`;
      if (cleanQuery.includes("hurt") || cleanQuery.includes("injured") || cleanQuery.includes("ambulance")) {
        responseText += `⚠️ **IF THIS IS A LIFE-THREATENING EMERGENCY, DISPATCH RESCUE IMMEDIATELY using the request form below or call ${data.contacts.general[0].phone}!**\n\n`;
      }
      
      responseText += `Here are the active medical centers:\n`;
      scenario.hospitals.forEach(hp => {
        const warningIcon = hp.status !== "Active" ? "⚠️ " : "🏥 ";
        responseText += `- **${warningIcon}${hp.name}**: ${hp.occupancy} | Status: *${hp.status}* (Call: ${hp.phone}) <button class="chat-btn" onclick="focusOnMap('${hp.id}')">View on Map</button>\n`;
      });
      
      return {
        text: responseText,
        focus: "hospitals",
        action: "show-hospitals"
      };
    }
    
    // Shelters / Evacuation
    if (cleanQuery.includes("shelter") || cleanQuery.includes("evacuate") || cleanQuery.includes("where to go") || cleanQuery.includes("refuge") || cleanQuery.includes("housing") || cleanQuery.includes("stay")) {
      let responseText = `### Shelter Finder\n\n`;
      
      if (scenarioId === "flood") {
        responseText += `🌊 **Flood Notice:** Head to high-ground shelters immediately. Avoid low elevation valleys.\n\n`;
      } else if (scenarioId === "cyclone") {
        responseText += `🌀 **Cyclone Notice:** Seek storm-hardened structures. Do not venture outdoors during high winds.\n\n`;
      } else if (scenarioId === "earthquake") {
        responseText += `🧱 **Earthquake Notice:** Only enter shelters verified structurally sound. Watch out for masonry cracking.\n\n`;
      }
      
      const openShelters = scenario.shelters.filter(s => s.status.includes("Open") || s.status.includes("Nearly Full"));
      if (openShelters.length === 0) {
        responseText += `Currently, no open shelters are registered nearby. Please stay tuned for rescue dispatches.`;
      } else {
        responseText += `Active Shelters:\n`;
        openShelters.forEach(sh => {
          const petAlert = sh.pets ? "🐾 Pets allowed" : "🚫 No pets";
          const medAlert = sh.medical ? "⚕️ Medical support on-site" : "No medical staff";
          responseText += `- **🏠 ${sh.name}** (${sh.filled}/${sh.capacity} filled)\n  *Status:* **${sh.status}** | *Info:* ${petAlert}, ${medAlert}\n  *Address:* ${sh.address} <button class="chat-btn" onclick="focusOnMap('${sh.id}')">Locate</button>\n`;
        });
      }
      
      return {
        text: responseText,
        focus: "shelters",
        action: "show-shelters"
      };
    }
    
    // Roads / Travel / Safe route
    if (cleanQuery.includes("road") || cleanQuery.includes("bridge") || cleanQuery.includes("highway") || cleanQuery.includes("drive") || cleanQuery.includes("route") || cleanQuery.includes("blocked") || cleanQuery.includes("traffic")) {
      let responseText = `### Road Status & Traffic Report\n\n`;
      
      const blockedRoads = scenario.roads.filter(r => r.status === "Blocked");
      const hazardousRoads = scenario.roads.filter(r => r.status === "Hazardous");
      
      if (blockedRoads.length > 0) {
        responseText += `🚫 **Blocked Routes (Do Not Drive):**\n`;
        blockedRoads.forEach(rd => {
          responseText += `- **${rd.name}**: ${rd.notes} <button class="chat-btn" onclick="focusOnMap('${rd.id}')">Show Roadblock</button>\n`;
        });
        responseText += `\n`;
      }
      
      if (hazardousRoads.length > 0) {
        responseText += `⚠️ **Hazardous/Slow Routes:**\n`;
        hazardousRoads.forEach(rd => {
          responseText += `- **${rd.name}**: ${rd.notes} <button class="chat-btn" onclick="focusOnMap('${rd.id}')">Show Hazard</button>\n`;
        });
        responseText += `\n`;
      }
      
      const safeRoads = scenario.roads.filter(r => r.status === "Safe");
      if (safeRoads.length > 0) {
        responseText += `✅ **Safe Routes:**\n`;
        safeRoads.forEach(rd => {
          responseText += `- **${rd.name}**: ${rd.notes} <button class="chat-btn" onclick="focusOnMap('${rd.id}')">Locate</button>\n`;
        });
      }
      
      responseText += `\n*Tip:* You can use the **Safe Route Planner** widget in the side panel to calculate path safety.`;
      
      return {
        text: responseText,
        focus: "roads",
        action: "show-roads"
      };
    }
    
    // Supplies / Food / Water
    if (cleanQuery.includes("food") || cleanQuery.includes("water") || cleanQuery.includes("supply") || cleanQuery.includes("supplies") || cleanQuery.includes("ration") || cleanQuery.includes("blanket")) {
      return {
        text: `### Supply Assistance & Calculations
        
If you are running low on critical items, here are the recommendations:
1. **Supply Calculator**: Use the **Emergency Supplies Calculator** in the sidebar to compute your family's exact resource requirements for 3 or 7 days.
2. **Community Help Board**: Local community volunteers are offering supplies (e.g. food rations, water bottles, transport). Check the **Community Help Board** section.
3. **Request Supplies**: If you require urgent state aid delivery, submit a **Supplies Dispatch Request** through the triage form.
4. **General Evacuation Info**: Shelters also stock food, clean water, and medical kits.
`,
        focus: "calculator",
        action: "show-calculator"
      };
    }
    
    // Earthquake specific instructions if mentioned
    if (cleanQuery.includes("earthquake") || cleanQuery.includes("quake") || cleanQuery.includes("tremor")) {
      return {
        text: `### Earthquake Guidelines
        
1. **Drop, Cover, and Hold On**: If an aftershock hits, get under a sturdy desk or table.
2. **Outside Precautions**: Stay away from power lines, buildings, masonry, and windows.
3. **Utility Hazards**: Shut off gas valves immediately if you smell gas. Do not use open flames.
4. **Checked Shelters**: *Central High School* and *Arena Community Center* are structurally cleared. Avoid *Grace Church Safe Haven* as it reports fractures. <button class="chat-btn" onclick="focusOnMap('sh-1')">Locate High School Shelter</button>`,
        action: "show-earthquake-guide"
      };
    }
    
    // Flooding specific instructions if mentioned
    if (cleanQuery.includes("flood") || cleanQuery.includes("water rise") || cleanQuery.includes("drown")) {
      return {
        text: `### Flood Guidelines
        
1. **High Ground**: Go to elevated sectors. Do not cross flooded bridges.
2. **Water Hygiene**: Boil or chemically purify water before drinking.
3. **Electrical Hazard**: Turn off power mains if water enters your home.
4. **Blocked Pathways**: *Central Bridge* and *Valley Underpass* are completely blocked. Use the north corridor. <button class="chat-btn" onclick="focusOnMap('sh-4')">Locate Metro Exhibition Hall (High Ground)</button>`,
        action: "show-flood-guide"
      };
    }
    
    // Default reply if no trigger matches
    return {
      text: `### I'm here to help
      
I detected your message but couldn't map it directly to a specific automated database search. 

* **To locate medical aid**, type *'hospital'* or *'doctor'*.
* **To find safe shelters**, type *'shelter'* or *'where is safe'*.
* **To check road closures**, type *'road status'* or *'highway'*.
* **To view emergency prep checklists**, click on the **Survival Prep Guides** panel.

If you are in immediate physical danger, please use the **Emergency Request Hub** below to dispatch help.`,
      action: "default"
    };
  }
};

window.aiAssistant = aiAssistant;
