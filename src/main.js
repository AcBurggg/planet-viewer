
// =============================
// Imports and Global Variables
// =============================
import * as Astronomy from 'astronomy-engine';

// Sky map state
let skyMapAzCenter = 180; // Center azimuth in degrees (default: South)
let skyMapAltCenter = 45; // Center altitude in degrees (default: halfway between horizon and zenith)
let isDragging = false;
let dragStartX = 0, dragStartY = 0, dragStartAz = 180, dragStartAlt = 45;

// User location
let userLat = null, userLon = null;

// Background image for sky map
const bgImg = new Image();
bgImg.src = 'milkyway.jpeg';

// =============================
// Utility Functions
// =============================
//helps with displaying date/times earlier than 10 into HTML
function pad(n) { return n < 10 ? '0' + n : n; }

// =============================
// Geolocation and Date/Time Setup
// =============================
function autofillGeolocation() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported. Enter coordinates manually.");
    return;
  }
  navigator.geolocation.getCurrentPosition(pos => {
    userLat = pos.coords.latitude;
    userLon = pos.coords.longitude;
    document.getElementById('lat-input').value = userLat.toFixed(6);
    document.getElementById('lon-input').value = userLon.toFixed(6);
  }, err => {
    alert("Location access denied. Enter coordinates manually or use default Deerlick Astronomy Village coords.");
    userLat = 33.5614;
    userLon = -82.7631;
    document.getElementById('lat-input').value = userLat;
    document.getElementById('lon-input').value = userLon;
  });
}

function setDefaultDateTime() {
  const now = new Date();
  const local = now.getFullYear() + '-' +
                pad(now.getMonth() + 1) + '-' +
                pad(now.getDate()) + 'T' +
                pad(now.getHours()) + ':' +
                pad(now.getMinutes());
  document.getElementById('datetime').value = local;
}

// =============================
// Sky Map Drawing
// =============================
function drawSkyMap(planetsData) {
  const canvas = document.getElementById('sky-map');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  // Draw background
  if (bgImg.complete) {
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Azimuth and altitude range shown (degrees) (i.e. how much user sees as given time)
  const azRange = 180;
  const altRange = 120;

  //azimuth range defined by fixed left point plus range
  const azMin = skyMapAzCenter - azRange/2;

  //alt needs upper/lower bound since range does not wrap around like azimuth (defined by center value)
  const altMin = skyMapAltCenter - altRange/2;
  const altMax = skyMapAltCenter + altRange/2;

  // Draw horizon line (altitude 0)... use lighter color for emphasis on dark background image
  const horizonY = canvas.height - 30 - ((0 - altMin) / altRange) * (canvas.height - 60);
  ctx.strokeStyle = '#888';
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(canvas.width, horizonY);
  ctx.stroke();

  // Draw azimuth degree labels (0°, 90°, 180°, 270°)
  ctx.font = '12px Times New Roman';
  ctx.fillStyle = '#aaa';
  ctx.textAlign = 'center';
  for (let az = 0; az < 360; az += 90) {
    let relAz = ((az - azMin + 360) % 360);
    if (relAz > azRange) continue;
    const x = (relAz / azRange) * canvas.width;
    let cardinalDirection = '';
    if (az === 0) cardinalDirection = 'N';
    else if (az === 90) cardinalDirection = 'E';
    else if (az === 180) cardinalDirection = 'S';
    else if (az === 270) cardinalDirection = 'W';
    ctx.fillText(`${cardinalDirection}/${az}°`, x, canvas.height - 10);
    ctx.beginPath();
    ctx.moveTo(x, horizonY);
    ctx.lineTo(x, horizonY + 10);
    ctx.strokeStyle = '#aaa';
    ctx.stroke();
  }

  // Draw altitude degree labels (e.g., -30, 0, 30, 60, 90)
  ctx.textAlign = 'right';
  for (let alt = Math.ceil((skyMapAltCenter - altRange/2)/30)*30; alt <= altMax; alt += 30) {
    const y = canvas.height - 30 - ((alt - altMin) / altRange) * (canvas.height - 60);
    ctx.fillText(`${alt}°`, 35, y + 4);
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(canvas.width, y);
    ctx.strokeStyle = alt === 0 ? '#888' : '#444';
    ctx.stroke();
  }

  // Draw zenith marker (altitude 90) (used chatGPT to help get x,y canvas coordinates formula from alt/az values...applies to zenith,nadir,planets)
  const zenithY = canvas.height - 30 - ((90 - altMin) / altRange) * (canvas.height - 60);
  ctx.beginPath();
  ctx.arc(canvas.width/2, zenithY, 10, 0, 2 * Math.PI);
  ctx.strokeStyle = '#aaa';
  ctx.stroke();
  ctx.font = '12px Times New Roman';
  ctx.fillStyle = '#aaa';
  ctx.textAlign = 'center';
  ctx.fillText('Zenith', canvas.width/2, zenithY - 10);

  // Draw nadir marker (altitude -90)
  const nadirY = canvas.height - 30 - ((-90 - altMin) / altRange) * (canvas.height - 60);
  ctx.beginPath();
  ctx.arc(canvas.width/2, nadirY, 10, 0, 2 * Math.PI);
  ctx.strokeStyle = '#aaa';
  ctx.stroke();
  ctx.font = '12px Times New Roman';
  ctx.fillStyle = '#aaa';
  ctx.textAlign = 'center';
  ctx.fillText('Nadir', canvas.width/2, nadirY + 22);

  // Draw each planet
  const planetColors = {
    "Mercury": "#b0b0b0",
    "Venus": "#e6e2af",
    "Mars": "#c1440e",
    "Jupiter": "#e3c07b",
    "Saturn": "#f7e7b4",
    "Uranus": "#7ad7f0",
    "Neptune": "#4062bb",
    "Moon": "#dddddd"
  };
  planetsData.forEach(obj => {
    let relAz = ((obj.azimuth - azMin + 360) % 360);
    if (relAz < 0 || relAz > azRange) return; //don't need to draw any planets not in view
    const x = (relAz / azRange) * canvas.width;
    const y = canvas.height - 30 - ((obj.altitude - altMin) / altRange) * (canvas.height - 60);
    if (y < 0 || y > canvas.height) return;
    const color = planetColors[obj.name] || "#FFD700";
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.font = '12px Times New Roman';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(obj.name, x, y - 12);
  });
}

// =============================
// Sky Map Interactivity (Drag-to-Pan)
// =============================
//used chatGPT to get drag and pan functionality
function setupSkyMapDrag() {
  const canvas = document.getElementById('sky-map');
  if (!canvas) return;

  // Mouse events
  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartAz = skyMapAzCenter;
    dragStartAlt = skyMapAltCenter;
    canvas.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    const azRange = 180;
    const altRange = 120;
    skyMapAzCenter = (dragStartAz - dx * (azRange / canvas.width) + 360) % 360;
    skyMapAltCenter = dragStartAlt + dy * (altRange / canvas.height);
    // Clamp altitude center
    const maxCenter = 90 - altRange / 2;
    const minCenter = -90 + altRange / 2;
    skyMapAltCenter = Math.max(minCenter, Math.min(maxCenter, skyMapAltCenter));
    if (window.lastPlanetsData) drawSkyMap(window.lastPlanetsData);
  });
  window.addEventListener('mouseup', () => {
    isDragging = false;
    canvas.style.cursor = 'pointer';
  });
  canvas.style.cursor = 'pointer';

  // Touch events for mobile
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length !== 1) return;
    isDragging = true;
    dragStartX = e.touches[0].clientX;
    dragStartY = e.touches[0].clientY;
    dragStartAz = skyMapAzCenter;
    dragStartAlt = skyMapAltCenter;
    // Prevent scrolling when touching the canvas
    e.preventDefault();
  }, { passive: false });
  window.addEventListener('touchmove', e => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartX;
    const dy = e.touches[0].clientY - dragStartY;
    const azRange = 180;
    const altRange = 120;
    skyMapAzCenter = (dragStartAz - dx * (azRange / canvas.width) + 360) % 360;
    skyMapAltCenter = dragStartAlt + dy * (altRange / canvas.height);
    // Clamp altitude center
    const maxCenter = 90 - altRange / 2;
    const minCenter = -90 + altRange / 2;
    skyMapAltCenter = Math.max(minCenter, Math.min(maxCenter, skyMapAltCenter));
    if (window.lastPlanetsData) drawSkyMap(window.lastPlanetsData);
    e.preventDefault();
  }, { passive: false });
  window.addEventListener('touchend', e => {
    isDragging = false;
    canvas.style.cursor = 'pointer';
  });
}

// =============================
// Main Planet Position Calculation and Table Update
// =============================
function updatePositions() {
  const latVal = parseFloat(document.getElementById('lat-input').value);
  const lonVal = parseFloat(document.getElementById('lon-input').value);
  if (isNaN(latVal) || isNaN(lonVal)) {
    alert("Please enter valid latitude and longitude.");
    return;
  }
  userLat = latVal;
  userLon = lonVal;

  const dateInput = document.getElementById("datetime").value;
  const date = dateInput ? new Date(dateInput) : new Date();

  try {
    const observer = new Astronomy.Observer(userLat, userLon, 0);
    const planets = [
      { name: "Moon", body: Astronomy.Body.Moon, id: "moon"},
      { name: "Mercury", body: Astronomy.Body.Mercury, id: "mercury"},
      { name: "Venus", body: Astronomy.Body.Venus, id: "venus"},
      { name: "Mars", body: Astronomy.Body.Mars, id: "mars"},
      { name: "Jupiter", body: Astronomy.Body.Jupiter, id: "jupiter"},
      { name: "Saturn", body: Astronomy.Body.Saturn, id: "saturn"},
      { name: "Uranus", body: Astronomy.Body.Uranus, id: "uranus"},
      { name: "Neptune", body: Astronomy.Body.Neptune, id: "neptune"}
    ];

    const planetsData = [];
    planets.forEach(planet => {
      try {
        const equ = Astronomy.Equator(planet.body, date, observer, true, true);
        const horiz = Astronomy.Horizon(date, observer, equ.ra, equ.dec, "normal");
        document.getElementById(`${planet.id}-ra`).textContent = equ.ra.toFixed(1);
        document.getElementById(`${planet.id}-dec`).textContent = equ.dec.toFixed(1);
        document.getElementById(`${planet.id}-alt`).textContent = horiz.altitude.toFixed(1);
        document.getElementById(`${planet.id}-az`).textContent = horiz.azimuth.toFixed(1);
        planetsData.push({
          name: planet.name,
          azimuth: horiz.azimuth,
          altitude: horiz.altitude
        });
      } catch (err) {
        document.getElementById(`${planet.id}-ra`).textContent = 'Error';
        document.getElementById(`${planet.id}-dec`).textContent = 'Error';
        document.getElementById(`${planet.id}-alt`).textContent = 'Error';
        document.getElementById(`${planet.id}-az`).textContent = 'Error';
      }
    });
    window.lastPlanetsData = planetsData;
    drawSkyMap(planetsData);
  } catch (e) {
    // If something goes really wrong, clear all table cells
    const ids = ["moon","mercury","venus","mars","jupiter","saturn","uranus","neptune"];
    ids.forEach(id => {
      ["ra","dec","alt","az"].forEach(suffix => {
        const cell = document.getElementById(`${id}-${suffix}`);
        if (cell) cell.textContent = 'Error';
      });
    });
    window.lastPlanetsData = [];
    drawSkyMap([]);
  }
}

// =============================
// Event Listeners and Initialization
// =============================
window.addEventListener('DOMContentLoaded', () => {
  setDefaultDateTime();
  autofillGeolocation();
  setupSkyMapDrag();
});

document.getElementById('use-geoloc').addEventListener('click', e => {
  e.preventDefault();
  autofillGeolocation();
});

document.getElementById("update-btn").addEventListener("click", updatePositions);
