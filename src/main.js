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
  document.getElementById('datetime').value = now.toISOString().slice(0,16);
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
    const eqCoords = Astronomy.Equator(Astronomy.Body.Mars, date, observer, true, true); //needs first true to get 'correct horizontal coordinates' for Horizon() call.
    const horiz = Astronomy.Horizon(date, observer, eqCoords.ra, eqCoords.dec, "normal"); 
    //horizon takes in a date (flexibleDateTime), observer (Observer), ra(number), dec(number), refraction (string), it returns a horizontalCoordinates object
    let html = `<table><tr><th>Planet</th><th>Altitude (°)</th><th>Azimuth (°)</th></tr>`;
    html += `<tr>
                <td>Mars</td>
                <td>${horiz.altitude.toFixed(1)}</td>
                <td>${horiz.azimuth.toFixed(1)}</td>
             </tr>`;
    html += `</table>`;
    document.getElementById("output").innerHTML = html;
  } catch (e) {
    document.getElementById("output").innerHTML = `<p>Error: ${e.message}</p>`;
  }
}

document.getElementById("update-btn").addEventListener("click", updatePositions);
