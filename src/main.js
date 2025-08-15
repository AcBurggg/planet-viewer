import * as Astronomy from 'astronomy-engine';


let userLat = null;
let userLon = null;

// Try to set lat/lon input fields to user's location
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
    alert("Location access denied. Enter coordinates manually or use Deerlick Astronomy Village.");
    userLat = 33.5614;
    userLon = -82.7631;
    document.getElementById('lat-input').value = userLat;
    document.getElementById('lon-input').value = userLon;
  });
}

document.getElementById('use-geoloc').addEventListener('click', e => {
  e.preventDefault();
  autofillGeolocation();
});

// Set default date/time to now
window.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  function pad(n) { return n < 10 ? '0' + n : n; }
  const local = now.getFullYear() + '-' +
                pad(now.getMonth() + 1) + '-' +
                pad(now.getDate()) + 'T' +
                pad(now.getHours()) + ':' +
                pad(now.getMinutes());
  document.getElementById('datetime').value = local;
  autofillGeolocation();
});





function updatePositions() {
  // Get lat/lon from input fields
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
      { name: "The Moon", body: Astronomy.Body.Moon, id: "moon" },
      { name: "Mercury", body: Astronomy.Body.Mercury, id: "mercury" },
      { name: "Venus", body: Astronomy.Body.Venus, id: "venus" },
      { name: "Mars", body: Astronomy.Body.Mars, id: "mars" },
      { name: "Jupiter", body: Astronomy.Body.Jupiter, id: "jupiter" },
      { name: "Saturn", body: Astronomy.Body.Saturn, id: "saturn" },
      { name: "Uranus", body: Astronomy.Body.Uranus, id: "uranus" },
      { name: "Neptune", body: Astronomy.Body.Neptune, id: "neptune" }
    ];

    planets.forEach(planet => {
      try {
        const equ = Astronomy.Equator(planet.body, date, observer, true, true);
        const horiz = Astronomy.Horizon(date, observer, equ.ra, equ.dec, "normal");
        document.getElementById(`${planet.id}-ra`).textContent = equ.ra.toFixed(1);
        document.getElementById(`${planet.id}-dec`).textContent = equ.dec.toFixed(1);
        document.getElementById(`${planet.id}-alt`).textContent = horiz.altitude.toFixed(1);
        document.getElementById(`${planet.id}-az`).textContent = horiz.azimuth.toFixed(1);
      } catch (err) {
        document.getElementById(`${planet.id}-ra`).textContent = 'Error';
        document.getElementById(`${planet.id}-dec`).textContent = 'Error';
        document.getElementById(`${planet.id}-alt`).textContent = 'Error';
        document.getElementById(`${planet.id}-az`).textContent = 'Error';
      }
    });
  } catch (e) {
    // If something goes wrong globally, clear all table cells
    const ids = ["moon","mercury","venus","mars","jupiter","saturn","uranus","neptune"];
    ids.forEach(id => {
      ["ra","dec","alt","az"].forEach(suffix => {
        const cell = document.getElementById(`${id}-${suffix}`);
        if (cell) cell.textContent = 'Error';
      });
    });
  }
}

document.getElementById("update-btn").addEventListener("click", updatePositions);
