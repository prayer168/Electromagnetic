/**
 * 奇妙的電磁世界 - 數位教材應用程式邏輯
 */

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initEarthCompassLab();
  initElectromagnetLab();
  initLifeApplications();
  initQuizChallenge();
});

// ==========================================
// 1. SPA Tab Navigation
// ==========================================
function initNavigation() {
  const tabs = document.querySelectorAll(".nav-tab");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-tab");

      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      const targetContent = document.getElementById(target);
      if (targetContent) {
        targetContent.classList.add("active");
      }
    });
  });

  // Lab Subtabs
  const subtabs = document.querySelectorAll(".lab-toggle-btn");
  const subcontents = document.querySelectorAll(".lab-sub-content");

  subtabs.forEach(subtab => {
    subtab.addEventListener("click", () => {
      const target = subtab.getAttribute("data-subtab");

      subtabs.forEach(t => t.classList.remove("active"));
      subcontents.forEach(c => c.classList.remove("active"));

      subtab.classList.add("active");
      const targetSubContent = document.getElementById(target);
      if (targetSubContent) {
        targetSubContent.classList.add("active");
      }
    });
  });
}

// ==========================================
// 2. Earth & Compass Lab
// ==========================================
function initEarthCompassLab() {
  const earthSvg = document.getElementById("earth-svg");
  const compassesGroup = document.getElementById("draggable-compasses-group");
  const linesGroup = document.getElementById("magnetic-lines-group");
  const innerMagnetGroup = document.getElementById("inner-magnet-group");
  
  const showLinesCheckbox = document.getElementById("btn-show-lines");
  const showMagnetCheckbox = document.getElementById("btn-show-inner-magnet");
  const resetBtn = document.getElementById("btn-reset-earth");

  const earthCenter = { x: 300, y: 250 };
  const nPole = { x: 300, y: 360 }; // Dipole North (Geographic South)
  const sPole = { x: 300, y: 140 }; // Dipole South (Geographic North)

  // Default coordinates of 4 compasses around Earth
  const initialCompassPositions = [
    { x: 160, y: 150, id: "c1" },
    { x: 440, y: 150, id: "c2" },
    { x: 160, y: 350, id: "c3" },
    { x: 440, y: 350, id: "c4" }
  ];

  let activeDragElement = null;
  let dragOffset = { x: 0, y: 0 };

  // Calculate magnetic field angle at coordinate (x,y)
  function getMagneticFieldAngle(x, y) {
    // Dipole model: field is sum of N pole repulsion and S pole attraction
    const dxN = x - nPole.x;
    const dyN = y - nPole.y;
    const distNSq = dxN * dxN + dyN * dyN + 100;
    const distN = Math.sqrt(distNSq);

    const dxS = x - sPole.x;
    const dyS = y - sPole.y;
    const distSSq = dxS * dxS + dyS * dyS + 100;
    const distS = Math.sqrt(distSSq);

    // B-field vector components
    // N-pole repels, S-pole attracts
    const Bx = (dxN / (distN * distNSq)) - (dxS / (distS * distSSq));
    const By = (dyN / (distN * distNSq)) - (dyS / (distS * distSSq));

    // Calculate rotation angle in degrees
    const rad = Math.atan2(By, Bx);
    // Offset by +90 degrees since needle N (red) points vertically up at 0 rotation
    return (rad * 180 / Math.PI) + 90;
  }

  // Draw magnetic field lines
  function drawMagneticFieldLines() {
    linesGroup.innerHTML = "";
    if (!showLinesCheckbox.checked) return;

    // We draw multiple elliptical paths to represent magnetic field lines
    // emanating from the bottom (Geographic South) and returning to top (Geographic North)
    const lineParameters = [
      { rx: 140, ry: 90, offset: 0 },
      { rx: 180, ry: 130, offset: 0 },
      { rx: 220, ry: 170, offset: 0 },
      { rx: 270, ry: 220, offset: 0 },
      { rx: 320, ry: 275, offset: 0 }
    ];

    lineParameters.forEach((params, idx) => {
      // Draw left and right symmetric loops
      [-1, 1].forEach(dir => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const cx = earthCenter.x;
        const cy = earthCenter.y;
        
        // Define control points for a smooth magnetic arc
        const startX = cx;
        const startY = cy + 110; // near South Pole
        const endX = cx;
        const endY = cy - 110;   // near North Pole
        const ctrlX = cx + dir * params.rx * 1.5;
        const ctrlY1 = cy + params.ry;
        const ctrlY2 = cy - params.ry;

        const d = `M ${startX} ${startY} C ${ctrlX} ${ctrlY1}, ${ctrlX} ${ctrlY2}, ${endX} ${endY}`;
        path.setAttribute("d", d);
        path.setAttribute("class", "mag-line");
        path.setAttribute("style", `animation-delay: ${idx * 0.4}s; stroke-opacity: ${0.8 - idx * 0.12}`);
        path.setAttribute("stroke", "#00f3ff");
        path.setAttribute("stroke-width", "1.5");
        path.setAttribute("fill", "none");
        
        linesGroup.appendChild(path);
      });
    });
  }

  // Create and place a compass at (x, y)
  function createCompass(x, y, id) {
    const compassG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    compassG.setAttribute("class", "draggable-compass");
    compassG.setAttribute("id", id);
    compassG.setAttribute("transform", `translate(${x}, ${y})`);

    // Outer circle
    const outerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    outerCircle.setAttribute("cx", "0");
    outerCircle.setAttribute("cy", "0");
    outerCircle.setAttribute("r", "16");
    outerCircle.setAttribute("fill", "#111");
    outerCircle.setAttribute("stroke", "rgba(255, 255, 255, 0.6)");
    outerCircle.setAttribute("stroke-width", "1.5");

    // Compass Needle Inner Group (will be rotated)
    const needleGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    needleGroup.setAttribute("class", "needle-group");
    
    // N Pole (Red)
    const nNeedle = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    nNeedle.setAttribute("points", "0,-12 4,0 0,2");
    nNeedle.setAttribute("fill", "#ff416c");

    // S Pole (Blue)
    const sNeedle = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    sNeedle.setAttribute("points", "0,12 4,0 0,-2");
    sNeedle.setAttribute("fill", "#00f3ff");

    // Pivot center dot
    const centerDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centerDot.setAttribute("cx", "0");
    centerDot.setAttribute("cy", "0");
    centerDot.setAttribute("r", "2");
    centerDot.setAttribute("fill", "#fff");

    needleGroup.appendChild(nNeedle);
    needleGroup.appendChild(sNeedle);
    needleGroup.appendChild(centerDot);

    compassG.appendChild(outerCircle);
    compassG.appendChild(needleGroup);

    // Event listeners for dragging
    const onStart = (e) => {
      e.preventDefault();
      activeDragElement = compassG;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const rect = earthSvg.getBoundingClientRect();
      // Scale coordinates relative to SVG viewBox 600x500
      const svgX = (clientX - rect.left) * (600 / rect.width);
      const svgY = (clientY - rect.top) * (500 / rect.height);

      dragOffset.x = svgX - x;
      dragOffset.y = svgY - y;
    };

    compassG.addEventListener("mousedown", onStart);
    compassG.addEventListener("touchstart", onStart, { passive: false });

    compassesGroup.appendChild(compassG);
    updateCompassRotation(compassG, x, y);
  }

  // Update specific compass needle rotation based on location
  function updateCompassRotation(compassElement, x, y) {
    const angle = getMagneticFieldAngle(x, y);
    const needle = compassElement.querySelector(".needle-group");
    if (needle) {
      needle.setAttribute("transform", `rotate(${angle})`);
    }
  }

  // Handle global move & end drag
  function initDragHandlers() {
    const onMove = (e) => {
      if (!activeDragElement) return;
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const rect = earthSvg.getBoundingClientRect();
      
      let svgX = (clientX - rect.left) * (600 / rect.width);
      let svgY = (clientY - rect.top) * (500 / rect.height);

      // Clamp within SVG boundaries
      svgX = Math.max(20, Math.min(580, svgX));
      svgY = Math.max(20, Math.min(480, svgY));

      const finalX = svgX - dragOffset.x;
      const finalY = svgY - dragOffset.y;

      activeDragElement.setAttribute("transform", `translate(${finalX}, ${finalY})`);
      updateCompassRotation(activeDragElement, finalX, finalY);
    };

    const onEnd = () => {
      activeDragElement = null;
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchend", onEnd);

    // Support clicking on canvas to teleport the nearest compass or place a new one
    earthSvg.addEventListener("click", (e) => {
      // If user clicked directly on a compass, ignore teleporting
      if (e.target.closest(".draggable-compass")) return;

      const rect = earthSvg.getBoundingClientRect();
      const clickX = (e.clientX - rect.left) * (600 / rect.width);
      const clickY = (e.clientY - rect.top) * (500 / rect.height);

      // Simple teleporter: find the closest compass and move it to click position
      const compasses = document.querySelectorAll(".draggable-compass");
      let closestCompass = null;
      let minDistance = Infinity;

      compasses.forEach(comp => {
        const transform = comp.getAttribute("transform");
        const match = /translate\(([^,]+),\s*([^)]+)\)/.exec(transform);
        if (match) {
          const cx = parseFloat(match[1]);
          const cy = parseFloat(match[2]);
          const dist = Math.hypot(clickX - cx, clickY - cy);
          if (dist < minDistance) {
            minDistance = dist;
            closestCompass = comp;
          }
        }
      });

      if (closestCompass && minDistance < 250) {
        closestCompass.setAttribute("transform", `translate(${clickX}, ${clickY})`);
        updateCompassRotation(closestCompass, clickX, clickY);

        // Re-attach standard coordinate attributes update logic
        // by rebinding the mousedown closure
        const onStartNew = (ev) => {
          ev.preventDefault();
          activeDragElement = closestCompass;
          const rectInner = earthSvg.getBoundingClientRect();
          const clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
          const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
          const svgX = (clientX - rectInner.left) * (600 / rectInner.width);
          const svgY = (clientY - rectInner.top) * (500 / rectInner.height);
          dragOffset.x = svgX - clickX;
          dragOffset.y = svgY - clickY;
        };

        closestCompass.onmousedown = onStartNew;
        closestCompass.ontouchstart = onStartNew;
      }
    });
  }

  // Setup options
  showLinesCheckbox.addEventListener("change", drawMagneticFieldLines);
  showMagnetCheckbox.addEventListener("change", () => {
    innerMagnetGroup.style.display = showMagnetCheckbox.checked ? "block" : "none";
  });

  resetBtn.addEventListener("click", () => {
    compassesGroup.innerHTML = "";
    initialCompassPositions.forEach(pos => createCompass(pos.x, pos.y, pos.id));
    showLinesCheckbox.checked = true;
    showMagnetCheckbox.checked = true;
    innerMagnetGroup.style.display = "block";
    drawMagneticFieldLines();
  });

  // Spawn initial compasses
  initialCompassPositions.forEach(pos => createCompass(pos.x, pos.y, pos.id));
  drawMagneticFieldLines();
  initDragHandlers();
}

// ==========================================
// 3. Electromagnet Lab
// ==========================================
function initElectromagnetLab() {
  const switchBtn = document.getElementById("btn-power-switch");
  const turnsSlider = document.getElementById("param-turns");
  const batterySlider = document.getElementById("param-batteries");
  const directionRadios = document.getElementsByName("param-direction");

  const magnetStrengthLabel = document.getElementById("label-magnet-strength");
  const clipsCountLabel = document.getElementById("label-clips-count");
  const leftPoleLabel = document.getElementById("label-left-pole");
  const rightPoleLabel = document.getElementById("label-right-pole");

  // SVG Groups
  const wireCoilsUnder = document.getElementById("wire-coils-under");
  const wireCoilsOver = document.getElementById("wire-coils-over");
  const battery2 = document.getElementById("battery-2");
  const battery3 = document.getElementById("battery-3");
  const switchBlade = document.getElementById("switch-blade");
  const clipsContainer = document.getElementById("paperclips-container");
  const compassNeedle = document.getElementById("em-compass-needle");
  const leftPoleGlow = document.getElementById("left-pole-glow");
  const rightPoleGlow = document.getElementById("right-pole-glow");
  const flowParticlesGroup = document.getElementById("flow-particles-group");
  const emMagneticLines = document.getElementById("em-magnetic-lines");

  let isPowerOn = false;
  const totalClips = 16;
  const clipElements = [];

  // Generate initial resting paperclips at bottom
  function generatePaperclips() {
    clipsContainer.innerHTML = "";
    clipElements.length = 0;

    for (let i = 0; i < totalClips; i++) {
      // Distribute clips on the table line y=310 to y=330, x=150 to x=400
      const rx = 140 + Math.random() * 260;
      const ry = 280 + Math.random() * 20;
      const rot = -45 + Math.random() * 90;

      const clipG = document.createElementNS("http://www.w3.org/2000/svg", "g");
      clipG.setAttribute("class", "paperclip");
      clipG.setAttribute("style", `--tx: ${rx}px; --ty: ${ry}px; --rot: ${rot}deg`);
      clipG.setAttribute("transform", `translate(${rx}, ${ry}) rotate(${rot})`);

      // SVG path of a standard paperclip loop
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", "M -12,-4 L 8,-4 A 4,4 0 0,1 12,0 A 4,4 0 0,1 8,4 L -8,4 A 3,3 0 0,1 -11,1 A 3,3 0 0,1 -8,-2 L 6,-2 A 2,2 0 0,1 8,0 A 2,2 0 0,1 6,2 L -4,2");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#bdc3c7");
      path.setAttribute("stroke-width", "2");

      clipG.appendChild(path);
      clipsContainer.appendChild(clipG);

      clipElements.push({
        element: clipG,
        originX: rx,
        originY: ry,
        originRot: rot
      });
    }
  }

  // Render Wire Coils dynamically based on Turns slider
  function renderCoils() {
    wireCoilsUnder.innerHTML = "";
    wireCoilsOver.innerHTML = "";
    
    const turns = parseInt(turnsSlider.value);
    const nailXStart = 150;
    const nailWidth = 240;
    const step = nailWidth / (turns - 1 || 1);

    for (let i = 0; i < turns; i++) {
      const x = nailXStart + i * step;

      // Behind nail (from bottom-left to top-right of next loop)
      const pathUnder = document.createElementNS("http://www.w3.org/2000/svg", "path");
      pathUnder.setAttribute("class", "coil-back");
      
      let dUnder = "";
      if (i < turns - 1) {
        dUnder = `M ${x + 6} 220 Q ${x + step/2} 240, ${x + step} 220`;
      }
      pathUnder.setAttribute("d", dUnder);
      wireCoilsUnder.appendChild(pathUnder);

      // In front of nail (curving down from top-left to bottom-right)
      const pathOver = document.createElementNS("http://www.w3.org/2000/svg", "path");
      pathOver.setAttribute("class", "coil-front");
      
      const dOver = `M ${x} 180 Q ${x + 8} 160, ${x + 12} 220`;
      pathOver.setAttribute("d", dOver);
      wireCoilsOver.appendChild(pathOver);

      // Add glow overlay if power is ON
      if (isPowerOn) {
        const glowUnder = pathUnder.cloneNode(true);
        glowUnder.setAttribute("class", "coil-back coil-glow");
        wireCoilsUnder.appendChild(glowUnder);

        const glowOver = pathOver.cloneNode(true);
        glowOver.setAttribute("class", "coil-front coil-glow");
        wireCoilsOver.appendChild(glowOver);
      }
    }
  }

  // Draw background magnetic lines for the electromagnet
  function renderElectromagnetFieldLines() {
    emMagneticLines.innerHTML = "";
    if (!isPowerOn) {
      emMagneticLines.setAttribute("opacity", "0");
      return;
    }
    
    emMagneticLines.setAttribute("opacity", "0.6");
    const paths = [
      "M 130 200 C 130 140, 410 140, 410 200",
      "M 130 200 C 100 100, 440 100, 410 200",
      "M 130 200 C 50 60, 490 60, 410 200",
      "M 130 200 C 130 260, 410 260, 410 200",
      "M 130 200 C 100 300, 440 300, 410 200",
      "M 130 200 C 50 340, 490 340, 410 200"
    ];

    paths.forEach(d => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#ff416c");
      path.setAttribute("stroke-width", "1.5");
      path.setAttribute("stroke-dasharray", "6,6");
      path.setAttribute("class", "mag-line");
      emMagneticLines.appendChild(path);
    });
  }

  // Update battery visualization
  function updateBatteries() {
    const batCount = parseInt(batterySlider.value);
    
    // Toggle battery items and translation offsets
    if (batCount === 1) {
      battery2.style.display = "none";
      battery3.style.display = "none";
    } else if (batCount === 2) {
      battery2.style.display = "block";
      battery3.style.display = "none";
    } else {
      battery2.style.display = "block";
      battery3.style.display = "block";
    }
  }

  // Update magnet physics state
  function updateSimulation() {
    renderCoils();
    updateBatteries();

    if (!isPowerOn) {
      // Off state
      magnetStrengthLabel.textContent = "0 %";
      clipsCountLabel.textContent = "0 個";
      leftPoleLabel.textContent = "-";
      rightPoleLabel.textContent = "-";
      
      leftPoleGlow.setAttribute("opacity", "0");
      rightPoleGlow.setAttribute("opacity", "0");
      
      compassNeedle.setAttribute("transform", "rotate(0)"); // Points North (up)
      
      // Release attracted paperclips
      clipElements.forEach(clip => {
        clip.element.classList.remove("attracted");
        clip.element.setAttribute("transform", `translate(${clip.originX}, ${clip.originY}) rotate(${clip.originRot})`);
      });

      renderElectromagnetFieldLines();
      return;
    }

    // On state: calculation
    const turns = parseInt(turnsSlider.value);
    const batteries = parseInt(batterySlider.value);
    
    // Strength formula
    const strengthPercent = Math.round((batteries * turns) / 120 * 100);
    magnetStrengthLabel.textContent = `${strengthPercent} %`;

    // Max count attracted is 16
    const clipsToAttract = Math.ceil((strengthPercent / 100) * totalClips);
    clipsCountLabel.textContent = `${clipsToAttract} 個`;

    // Determine current direction / poles
    const selectedDirection = Array.from(directionRadios).find(r => r.checked).value;
    const isNormal = selectedDirection === "normal";

    if (isNormal) {
      // Normal direction: left is S (Blue), right is N (Red)
      leftPoleLabel.innerHTML = '<span style="color:#00f3ff; font-weight:900">S (南極)</span>';
      rightPoleLabel.innerHTML = '<span style="color:#ff416c; font-weight:900">N (北極)</span>';

      leftPoleGlow.setAttribute("fill", "url(#southGlow)");
      leftPoleGlow.setAttribute("opacity", `${0.2 + (strengthPercent/100)*0.6}`);
      rightPoleGlow.setAttribute("fill", "url(#northGlow)");
      rightPoleGlow.setAttribute("opacity", `${0.2 + (strengthPercent/100)*0.6}`);

      // Compass N-pole (Red) gets repelled by Electromagnet N-pole (Right side)
      // Compass is placed at 520,200 (Right of right nail end).
      // So needle N-pole will point AWAY (right, 90 degrees)
      compassNeedle.setAttribute("transform", "rotate(90)");
    } else {
      // Reverse direction: left is N (Red), right is S (Blue)
      leftPoleLabel.innerHTML = '<span style="color:#ff416c; font-weight:900">N (北極)</span>';
      rightPoleLabel.innerHTML = '<span style="color:#00f3ff; font-weight:900">S (南極)</span>';

      leftPoleGlow.setAttribute("fill", "url(#northGlow)");
      leftPoleGlow.setAttribute("opacity", `${0.2 + (strengthPercent/100)*0.6}`);
      rightPoleGlow.setAttribute("fill", "url(#southGlow)");
      rightPoleGlow.setAttribute("opacity", `${0.2 + (strengthPercent/100)*0.6}`);

      // Compass N-pole (Red) gets attracted by Electromagnet S-pole (Right side)
      // Compass points TOWARDS the nail (left, -90 degrees)
      compassNeedle.setAttribute("transform", "rotate(-90)");
    }

    // Animate attracted paperclips
    // Nail bottom edge center is roughly y=220, x between 150 and 390
    clipElements.forEach((clip, idx) => {
      if (idx < clipsToAttract) {
        // Attract! Sticking around the nail
        clip.element.classList.add("attracted");
        
        // Distribute nicely along the coil area
        const nailX = 160 + (idx * (220 / (clipsToAttract - 1 || 1)));
        const nailY = 215 + Math.random() * 12; // cling to bottom edge
        const randomClingRot = -30 + Math.random() * 60; // hang slightly

        clip.element.setAttribute("transform", `translate(${nailX}, ${nailY}) rotate(${randomClingRot})`);
        clip.element.style.setProperty("--tx", `${nailX}px`);
        clip.element.style.setProperty("--ty", `${nailY}px`);
        clip.element.style.setProperty("--rot", `${randomClingRot}deg`);
      } else {
        // Not attracted, release or keep resting
        clip.element.classList.remove("attracted");
        clip.element.setAttribute("transform", `translate(${clip.originX}, ${clip.originY}) rotate(${clip.originRot})`);
      }
    });

    renderElectromagnetFieldLines();
  }

  // Power button toggle
  switchBtn.addEventListener("click", () => {
    isPowerOn = !isPowerOn;
    if (isPowerOn) {
      switchBtn.classList.remove("off");
      switchBtn.classList.add("on");
      switchBtn.textContent = "ON (通路)";
      // Animate knife blade down (to 0 rotation)
      switchBlade.setAttribute("transform", "rotate(0, 0, 0)");
    } else {
      switchBtn.classList.remove("on");
      switchBtn.classList.add("off");
      switchBtn.textContent = "OFF (斷路)";
      // Animate knife blade open (to -40 rotation)
      switchBlade.setAttribute("transform", "rotate(-40, 0, 0)");
    }
    updateSimulation();
  });

  // Slider events
  turnsSlider.addEventListener("input", updateSimulation);
  batterySlider.addEventListener("input", updateSimulation);
  directionRadios.forEach(radio => {
    radio.addEventListener("change", updateSimulation);
  });

  // Initialization
  generatePaperclips();
  updateSimulation();
}

// ==========================================
// 4. Life Applications Demo
// ==========================================
function initLifeApplications() {
  const menuItems = document.querySelectorAll(".app-menu-item");
  const demoCards = document.querySelectorAll(".app-demo-card");

  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      const appId = item.getAttribute("data-app");

      menuItems.forEach(i => i.classList.remove("active"));
      demoCards.forEach(d => d.classList.remove("active"));

      item.classList.add("active");
      const targetCard = document.getElementById(appId);
      if (targetCard) {
        targetCard.classList.add("active");
      }

      // Reset any running application loops
      stopAllAppSimulations();
    });
  });

  // --- SUB-APP 1: MAGLEV TRAIN ---
  const btnRunMaglev = document.getElementById("btn-run-maglev");
  const btnStopMaglev = document.getElementById("btn-stop-maglev");
  const train = document.getElementById("maglev-train");
  const trackMagnets = document.querySelectorAll(".track-magnet");
  const levitationGlow = document.querySelector(".levitation-glow");

  let maglevInterval = null;
  let maglevPosition = 40; // Initial X position offset
  let polarityState = false;

  function runMaglev() {
    if (maglevInterval) return;
    
    // Glow train floating rail
    levitationGlow.setAttribute("opacity", "0.8");
    train.setAttribute("transform", `translate(${maglevPosition}, 143)`); // Float up slightly from 150 to 143

    maglevInterval = setInterval(() => {
      maglevPosition += 12;
      if (maglevPosition > 350) {
        maglevPosition = -40; // wrap around
      }
      
      // Move train
      train.setAttribute("transform", `translate(${maglevPosition}, 143)`);
      
      // Alternately switch track magnet polarity to simulate AC pushing
      polarityState = !polarityState;
      trackMagnets.forEach((mag, idx) => {
        const text = mag.querySelector(".mag-text");
        const rect = mag.querySelector("rect");
        const currentP = (idx % 2 === 0) ? polarityState : !polarityState;
        
        if (currentP) {
          text.textContent = "N";
          rect.setAttribute("fill", "#ff416c");
        } else {
          text.textContent = "S";
          rect.setAttribute("fill", "#00f3ff");
        }
      });
    }, 100);
  }

  function stopMaglev() {
    clearInterval(maglevInterval);
    maglevInterval = null;
    levitationGlow.setAttribute("opacity", "0");
    train.setAttribute("transform", `translate(${maglevPosition}, 150)`); // drop back to rail
    
    // Reset track colors
    trackMagnets.forEach(mag => {
      const text = mag.querySelector(".mag-text");
      const rect = mag.querySelector("rect");
      text.textContent = "-";
      rect.setAttribute("fill", "#555");
    });
  }

  btnRunMaglev.addEventListener("click", runMaglev);
  btnStopMaglev.addEventListener("click", stopMaglev);


  // --- SUB-APP 2: ELECTROMAGNETIC CRANE ---
  const btnCranePower = document.getElementById("btn-crane-power");
  const btnCraneLeft = document.getElementById("btn-crane-left");
  const btnCraneRight = document.getElementById("btn-crane-right");
  const craneTrolley = document.getElementById("crane-trolley");
  const craneGlow = document.getElementById("crane-glow");
  const craneStatusTxt = document.getElementById("crane-status-txt");
  const craneAttachedGroup = document.getElementById("crane-attached-scrap");
  const looseScrapGroup = document.getElementById("loose-scrap-group");

  let craneX = 100; // Left pile position
  let isCraneOn = false;
  let hasScrapAttached = false;

  // Render original scrap metal on the left ground
  const scrapData = [
    { id: "s1", path: "M 0 0 L 14 0 L 7 12 Z", x: 70, y: 250, rot: 15 },
    { id: "s2", path: "M -6 -6 L 6 -6 L 6 6 L -6 6 Z", x: 90, y: 254, rot: -40 },
    { id: "s3", path: "M -8 0 L 8 0 L 0 8 Z", x: 105, y: 252, rot: 95 },
    { id: "s4", path: "M 0 -8 L 8 0 L 0 8 L -8 0 Z", x: 60, y: 253, rot: 45 },
    { id: "s5", path: "M -10 -2 L 10 -2 L 5 4 L -5 4 Z", x: 80, y: 256, rot: 180 }
  ];

  function drawScrapMetals() {
    looseScrapGroup.innerHTML = "";
    craneAttachedGroup.innerHTML = "";
    
    scrapData.forEach(scrap => {
      const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
      el.setAttribute("d", scrap.path);
      el.setAttribute("fill", "#7f8c8d");
      el.setAttribute("stroke", "#444");
      el.setAttribute("transform", `translate(${scrap.x}, ${scrap.y}) rotate(${scrap.rot})`);
      el.setAttribute("id", scrap.id);
      looseScrapGroup.appendChild(el);
    });
  }

  btnCranePower.addEventListener("click", () => {
    isCraneOn = !isCraneOn;
    if (isCraneOn) {
      btnCranePower.textContent = "斷電 (放開)";
      craneGlow.setAttribute("opacity", "0.6");
      craneStatusTxt.textContent = "ON";

      // If we are at the left side (craneX == 100), attract the scrap metals!
      if (craneX === 100 && !hasScrapAttached) {
        hasScrapAttached = true;
        // Move them from floor to crane magnet head
        looseScrapGroup.innerHTML = ""; // Clear from ground
        
        // Re-draw inside crane attached group
        scrapData.forEach((scrap, idx) => {
          const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
          el.setAttribute("d", scrap.path);
          el.setAttribute("fill", "#bdc3c7");
          el.setAttribute("stroke", "#fff");
          
          // Position relative to the magnet hook (0, 75)
          const rx = -20 + idx * 8;
          const ry = 4 + Math.random() * 4;
          const rrot = -20 + Math.random() * 40;
          el.setAttribute("transform", `translate(${rx}, ${ry}) rotate(${rrot})`);
          craneAttachedGroup.appendChild(el);
        });
      }
    } else {
      btnCranePower.textContent = "通電 (吸取)";
      craneGlow.setAttribute("opacity", "0");
      craneStatusTxt.textContent = "OFF";

      // Drop scrap metals
      if (hasScrapAttached) {
        hasScrapAttached = false;
        craneAttachedGroup.innerHTML = ""; // Clear from hook

        // Redraw them falling down to target position depending on where the crane is
        const dropXOffset = craneX - 80;
        scrapData.forEach((scrap) => {
          const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
          el.setAttribute("d", scrap.path);
          el.setAttribute("fill", "#7f8c8d");
          el.setAttribute("stroke", "#333");
          
          // Animate fall transition
          const finalX = scrap.x + dropXOffset;
          const finalY = (craneX > 250) ? 245 : 252; // Drop into collector box or back on floor
          el.setAttribute("transform", `translate(${finalX}, 150) rotate(${scrap.rot})`);
          
          // Simple transition in coordinate space
          looseScrapGroup.appendChild(el);
          setTimeout(() => {
            el.setAttribute("style", "transition: transform 0.4s ease-in;");
            el.setAttribute("transform", `translate(${finalX}, ${finalY}) rotate(${scrap.rot + 20})`);
          }, 20);
        });
      }
    }
  });

  btnCraneLeft.addEventListener("click", () => {
    craneX = 100;
    craneTrolley.setAttribute("transform", `translate(${craneX}, 80)`);
  });

  btnCraneRight.addEventListener("click", () => {
    craneX = 380;
    craneTrolley.setAttribute("transform", `translate(${craneX}, 80)`);
  });


  // --- SUB-APP 3: ELECTRIC BELL ---
  const btnRingBell = document.getElementById("btn-ring-bell");
  const btnStopBell = document.getElementById("btn-stop-bell");
  const bellHammer = document.getElementById("bell-hammer-group");
  const bellWave = document.getElementById("bell-sound-wave");
  const sparkGlow = document.getElementById("spark-glow");
  const pushButton = document.getElementById("bell-push-button");

  let bellInterval = null;
  let isHammerStriking = false;

  function startBellRinging() {
    if (bellInterval) return;

    pushButton.setAttribute("cy", "-6"); // Press button visually
    
    // Rapid oscillation simulating make-and-break circuit
    bellInterval = setInterval(() => {
      isHammerStriking = !isHammerStriking;
      
      if (isHammerStriking) {
        // Strike: Rotate hammer group slightly clockwise to hit the bell gong at (380, 120)
        bellHammer.setAttribute("transform", "translate(230, 80) rotate(5)");
        
        // Show sound wave expanding
        bellWave.setAttribute("r", "60");
        bellWave.setAttribute("opacity", "0.8");
        
        // Spark is OFF because contact is broken at strike position
        sparkGlow.setAttribute("opacity", "0");
      } else {
        // Recoil: Return back
        bellHammer.setAttribute("transform", "translate(230, 80) rotate(-1)");
        
        // Hide sound wave
        bellWave.setAttribute("r", "50");
        bellWave.setAttribute("opacity", "0");
        
        // Spark is ON because circuit contact is closed in recoil position
        sparkGlow.setAttribute("opacity", "1");
      }
    }, 60); // ~16Hz vibration
  }

  function stopBellRinging() {
    clearInterval(bellInterval);
    bellInterval = null;
    
    pushButton.setAttribute("cy", "-10"); // Lift button
    bellHammer.setAttribute("transform", "translate(230, 80) rotate(0)");
    bellWave.setAttribute("opacity", "0");
    sparkGlow.setAttribute("opacity", "0");
  }

  btnRingBell.addEventListener("click", startBellRinging);
  btnStopBell.addEventListener("click", stopBellRinging);

  // Stop everything function
  function stopAllAppSimulations() {
    stopMaglev();
    stopBellRinging();
    
    // Reset crane variables
    isCraneOn = false;
    hasScrapAttached = false;
    craneX = 100;
    craneTrolley.setAttribute("transform", `translate(${craneX}, 80)`);
    craneGlow.setAttribute("opacity", "0");
    craneStatusTxt.textContent = "OFF";
    btnCranePower.textContent = "通電 (吸取)";
    drawScrapMetals();
  }

  // Draw initial layout of crane
  drawScrapMetals();
}

// ==========================================
// 5. Quiz Challenge System
// ==========================================
function initQuizChallenge() {
  const quizData = [
    {
      q: "地磁的「磁北極」其實靠近地球的哪一個地理方位？",
      options: ["地理北極", "地理南極", "地理赤道", "地理東方"],
      correct: 0,
      desc: "地磁的S極位於地理的北極附近，因此在學術上地磁的「磁北極」在物理定義中實際上是一個地磁S極（吸引磁鐵N極的磁極）。所以指北針的N極會指北。"
    },
    {
      q: "指北針的N極（紅色）之所以指引北方，是因為跟地球磁體的什麼極互相吸引？",
      options: ["地球內部的地磁 N 極", "地球內部的地磁 S 極", "北極熊居住的極點", "太陽的重力場"],
      correct: 1,
      desc: "磁鐵的同極相斥、異極相吸。指北針的N極（磁北極）會指向北方，是由於地理北方存在著巨大的地磁S極，兩者異極相吸所導致。"
    },
    {
      q: "當你想把製作的電磁鐵「磁力增強」時，下列哪一個操作「完全沒有幫助」？",
      options: ["增加線圈的繞線圈數", "串聯更多顆電池以增強電流", "將電池正負極方向反接", "在漆包線線圈內放入鐵釘"],
      correct: 2,
      desc: "將電池反接只會「改變電流方向」與「磁極N/S的方位」，並不會改變磁力強度。增加線圈、電流或放入鐵芯（鐵釘）都能大幅增加磁力。"
    },
    {
      q: "在電磁鐵線圈側邊放置一個小指北針，將開關接通後發現指北針偏轉了，如果此時把電池正負極反接，指北針指針會如何變化？",
      options: ["指針偏轉角度變大", "指針偏轉方向反轉", "指針完全不偏轉了", "指針開始快速旋轉"],
      correct: 1,
      desc: "電池正負極反接，電磁鐵線圈內的電流方向改變，導致電磁鐵兩端的磁極（N與S極）對調。附近的指北針受吸引的電磁極性互換，指針會偏轉到相反方向。"
    },
    {
      q: "關於「電磁鐵」與「一般磁鐵」的比較，下列敘述何者錯誤？",
      options: ["電磁鐵的磁力強弱隨時可以調整，一般磁鐵則不行", "電磁鐵的磁極方向永遠固定不變，一般磁鐵亦同", "電磁鐵只要斷電就沒有磁力，一般磁鐵隨時都保有磁力", "生活中如電磁起重機、磁浮列車等都是電磁鐵的應用"],
      correct: 1,
      desc: "電磁鐵的磁極方向是可以改變的！只要改變電流方向（將電池反接），電磁鐵的N/S極性就會跟著對調。這也是它比一般磁鐵更好應用的原因。"
    }
  ];

  let currentQuestionIdx = 0;
  let score = 0;

  const welcomeScreen = document.getElementById("quiz-welcome-screen");
  const gameplayScreen = document.getElementById("quiz-gameplay-screen");
  const certScreen = document.getElementById("quiz-certificate-screen");

  const btnStartQuiz = document.getElementById("btn-start-quiz");
  const btnRestartQuiz = document.getElementById("btn-restart-quiz");
  const btnNextQuestion = document.getElementById("btn-next-question");
  const btnPrintCert = document.getElementById("btn-print-cert");

  const progressFill = document.getElementById("quiz-progress-fill");
  const labelQuestionNum = document.getElementById("label-question-num");
  const labelCurrentScore = document.getElementById("label-current-score");
  const questionText = document.getElementById("question-text");
  const optionsContainer = document.getElementById("options-container");
  const feedbackBox = document.getElementById("quiz-feedback");
  const feedbackTitle = document.getElementById("feedback-title");
  const feedbackDesc = document.getElementById("feedback-desc");

  const certScoreVal = document.getElementById("cert-score-val");
  const certDateVal = document.getElementById("cert-date-val");

  function startQuiz() {
    currentQuestionIdx = 0;
    score = 0;
    welcomeScreen.classList.add("hide");
    certScreen.classList.add("hide");
    gameplayScreen.classList.remove("hide");
    loadQuestion();
  }

  function loadQuestion() {
    feedbackBox.classList.add("hide");
    btnNextQuestion.classList.add("hide");
    
    // Progress
    const qData = quizData[currentQuestionIdx];
    progressFill.style.width = `${((currentQuestionIdx) / quizData.length) * 100}%`;
    labelQuestionNum.textContent = `問題 ${currentQuestionIdx + 1} / ${quizData.length}`;
    labelCurrentScore.textContent = `目前得分：${score} 分`;

    questionText.textContent = qData.q;
    optionsContainer.innerHTML = "";

    qData.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.setAttribute("class", "option-btn");
      btn.textContent = `${idx + 1}. ${opt}`;
      btn.addEventListener("click", () => handleAnswer(idx, btn));
      optionsContainer.appendChild(btn);
    });
  }

  function handleAnswer(selectedIdx, clickedBtn) {
    const qData = quizData[currentQuestionIdx];
    const optionButtons = optionsContainer.querySelectorAll(".option-btn");
    
    // Disable all option buttons
    optionButtons.forEach(btn => {
      btn.disabled = true;
    });

    feedbackBox.classList.remove("hide");
    feedbackDesc.textContent = qData.desc;

    if (selectedIdx === qData.correct) {
      score += 20;
      clickedBtn.classList.add("correct");
      feedbackBox.setAttribute("class", "feedback-box correct-style");
      feedbackTitle.textContent = "🎉 回答正確！太棒了！";
    } else {
      clickedBtn.classList.add("wrong");
      // Highlight the correct one
      optionButtons[qData.correct].classList.add("correct");
      feedbackBox.setAttribute("class", "feedback-box wrong-style");
      feedbackTitle.textContent = "❌ 答錯了喔，再加把勁！";
    }

    labelCurrentScore.textContent = `目前得分：${score} 分`;
    
    // Show next or finish button
    btnNextQuestion.classList.remove("hide");
    if (currentQuestionIdx === quizData.length - 1) {
      btnNextQuestion.textContent = "觀看結算證書";
    } else {
      btnNextQuestion.textContent = "下一題";
    }
  }

  function handleNext() {
    if (currentQuestionIdx < quizData.length - 1) {
      currentQuestionIdx++;
      loadQuestion();
    } else {
      showCertificate();
    }
  }

  function showCertificate() {
    gameplayScreen.classList.add("hide");
    certScreen.classList.remove("hide");

    // Populate certificate details
    certScoreVal.textContent = score;
    
    const today = new Date();
    const formattedDate = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
    certDateVal.textContent = formattedDate;
  }

  btnStartQuiz.addEventListener("click", startQuiz);
  btnRestartQuiz.addEventListener("click", startQuiz);
  btnNextQuestion.addEventListener("click", handleNext);

  btnPrintCert.addEventListener("click", () => {
    window.print();
  });
}
