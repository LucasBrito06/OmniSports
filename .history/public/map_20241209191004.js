// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCn-QjHh9GTBVap2g8dQ30Apukmo2ZGmY8",
    authDomain: "omnisport-e5b1b.firebaseapp.com",
    projectId: "omnisport-e5b1b",
    storageBucket: "omnisport-e5b1b.appspot.com",
    messagingSenderId: "857774118262",
    appId: "1:857774118262:web:3aec65c7442d60d67a5657"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global variables
let userLocation = null;
let userLocationMarker = null; // To store the user's circle marker
let markers = [];
let polyline = null;
let sportsLocations = [];

// Initialize the map with Leaflet
const map = L.map('map', {
    center: [-22.9068, -43.1729],
    zoom: 12
});

// Add a tile layer to the Leaflet map
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

// Set up geolocation to watch user position dynamically
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(position => {
        userLocation = [position.coords.latitude, position.coords.longitude];
        if (!userLocationMarker) {
            // First time we get the location, set view and add the circle marker
            map.setView(userLocation, 13);
            userLocationMarker = L.circleMarker(userLocation, {
                radius: 10,
                fillColor: 'blue',
                color: 'white',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).bindPopup('<b>You are here!</b>').addTo(map);

            // Fetch data from Firebase now that we have a user location
            fetchDataFromFirebase();
        } else {
            // Update the location of the existing circle marker
            userLocationMarker.setLatLng(userLocation);
        }
    }, () => {
        alert("Could not get your location.");
        // If user location is not available, still fetch data, but no filtering
        fetchDataFromFirebase();
    }, { enableHighAccuracy: true });
} else {
    // Geolocation not supported
    fetchDataFromFirebase();
}

// Display user's location on the map and then fetch data
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
        userLocation = [position.coords.latitude, position.coords.longitude];
        map.setView(userLocation, 13);
        

        // Now that we have the user location, fetch data from Firebase
        fetchDataFromFirebase();
    }, () => {
        alert("Could not get your location.");
        // If user location is not available, we can still load data,
        // but no filtering by distance will be applied.
        fetchDataFromFirebase();
    });
} else {
    // Geolocation not supported
    fetchDataFromFirebase();
}

// Global color map for dynamically assigned colors for sports
const sportColorMap = {};

function getColorBySport(sport) {
    if (!sport || sport.toLowerCase() === 'unknown') {
        return 'gray';
    }

    // If we already have a color for this sport, return it
    if (sportColorMap[sport]) return sportColorMap[sport];

    // Generate a unique, vibrant color from the sport string
    const hash = [...sport].reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360; 
    // Vibrant color: full saturation (100%) and 50% lightness
    const color = `hsl(${hue}, 100%, 50%)`;
    sportColorMap[sport] = color;
    return color;
}

function getMarkerIconForSports(sports) {
    const sportsArray = Array.isArray(sports) ? sports : [];

    // Determine the base color from the first sport if available
    // If multiple sports, just use the first one's hue for simplicity
    let baseColor = 'gray';
    if (sportsArray.length === 1) {
        baseColor = getColorBySport(sportsArray[0]);
    } else if (sportsArray.length > 1) {
        baseColor = getColorBySport(sportsArray[0]);
    }

    // Extract hue from the HSL string
    let hueMatch = baseColor.match(/hsl\((\d+),/);
    let hue = hueMatch ? parseInt(hueMatch[1]) : 0;

    // Map hue ranges to specific colored marker icons
    // Adjust these ranges and mappings as desired
    let colorName = 'blue';
    if (hue < 30) colorName = 'red';
    else if (hue < 90) colorName = 'orange';
    else if (hue < 150) colorName = 'green';
    else if (hue < 210) colorName = 'blue';
    else if (hue < 270) colorName = 'purple';
    else if (hue < 330) colorName = 'violet';
    else colorName = 'red';

    const iconUrlMap = {
      red: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
      green: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
      blue: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      orange: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
      yellow: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png',
      violet: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
      grey: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png',
      purple: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png'
    };

    let chosenIconUrl = iconUrlMap[colorName] || iconUrlMap['blue'];

    return L.icon({
      iconUrl: chosenIconUrl,
      shadowUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
}

function addMarkers(locations) {
    // Remove all existing markers from the map
    markers.forEach(marker => map.removeLayer(marker));
    markers = []; // Clear the markers array

    locations.forEach(location => {
        const city = (location.city || '').toLowerCase();
        const name = (location.name || '').toLowerCase();
        const type = (location.type || '').toLowerCase();

        // Skip fields that are 'unknown'
        const displayName = (name && name !== 'unknown') 
            ? `<b>${location.name}</b><br>` 
            : '';
        const displayType = (type && type !== 'unknown') 
            ? `Type: ${location.type}<br>` 
            : '';
        const displayCity = (city && !city.includes('unknown')) 
            ? `City: ${location.city}<br>` 
            : '';
        const displaySports = (Array.isArray(location.sports) && location.sports.length > 0)
            ? `Sports: ${location.sports.join(', ')}<br><br>`
            : '<br>';

        let popupContentFields = `${displayName}${displayType}${displayCity}${displaySports}`.trim();

        // Clean up empty fields
        if (popupContentFields === '' || popupContentFields === '<br>' || popupContentFields === '<br><br>') {
            popupContentFields = '';
        }

        const popupContent = `
            ${popupContentFields}
            <button onclick="calculateShortestRoute('${location.name}', this)">Navigate Here</button>
            <button onclick="removeRoute()">Remove Route</button>
            <p id="travel-time-${location.name}" style="margin-top: 5px; font-size: 0.9em; color: #555;">
                Travel time: Calculating...
            </p>
        `;

        // Create a marker icon that looks like the user's marker but with different colors
        const markerIcon = getMarkerIconForSports(location.sports);

        const marker = L.marker(location.position, {
            icon: markerIcon,
            title: location.name
        }).bindPopup(popupContent).addTo(map);

        markers.push(marker);
    });
}

// Filtering function
function filterLocations(searchQuery) {
    const normalizedQuery = searchQuery.toLowerCase();

    const filteredLocations = sportsLocations.filter(location =>
        (location.name && location.name.toLowerCase().includes(normalizedQuery)) ||
        (location.type && location.type.toLowerCase().includes(normalizedQuery)) ||
        (location.city && location.city.toLowerCase().includes(normalizedQuery)) ||
        (Array.isArray(location.sports) && location.sports.some(sport => sport.toLowerCase().includes(normalizedQuery)))
    );

    if (polyline) {
        const routeDestinationName = markers.find(marker =>
            polyline.getBounds().contains(marker.getLatLng())
        )?.options.title;

        if (routeDestinationName) {
            const destinationInFilter = filteredLocations.some(
                location => location.name === routeDestinationName
            );

            if (!destinationInFilter) {
                removeRoute();
            }
        }
    }

    addMarkers(filteredLocations);
}

document.getElementById('search-box').addEventListener('input', (event) => {
    const searchQuery = event.target.value;
    filterLocations(searchQuery);
});

async function filterLocations(searchQuery) {
    const normalizedQuery = searchQuery.toLowerCase();

    // Filter locations from the global `allLocations`
    const filteredLocations = allLocations.filter(location =>
        (location.name && location.name.toLowerCase().includes(normalizedQuery)) ||
        (location.type && location.type.toLowerCase().includes(normalizedQuery)) ||
        (location.city && location.city.toLowerCase().includes(normalizedQuery)) ||
        (Array.isArray(location.sports) && location.sports.some(sport => sport.toLowerCase().includes(normalizedQuery)))
    );

    if (polyline) {
        const routeDestinationName = markers.find(marker =>
            polyline.getBounds().contains(marker.getLatLng())
        )?.options.title;

        if (routeDestinationName) {
            const destinationInFilter = filteredLocations.some(
                location => location.name === routeDestinationName
            );

            if (!destinationInFilter) {
                removeRoute();
            }
        }
    }

    // Update the markers on the map
    addMarkers(filteredLocations);
}

function calculateShortestRoute(destinationName, buttonElement) {
    if (!userLocation) {
        alert("User location not available.");
        return;
    }

    const destination = sportsLocations.find(loc => loc.name === destinationName);
    if (!destination) {
        alert("Destination not found.");
        return;
    }

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${destination.position[1]},${destination.position[0]}?overview=full&geometries=geojson`;

    fetch(osrmUrl)
        .then(response => response.json())
        .then(data => {
            if (data.code === "Ok") {
                const route = data.routes[0];

                if (polyline) map.removeLayer(polyline);

                polyline = L.geoJSON(route.geometry, { color: 'blue' }).addTo(map);
                map.fitBounds(polyline.getBounds());

                const travelTimeInSeconds = route.duration;
                const formattedTime = formatDuration(travelTimeInSeconds);
                const travelTimeElement = document.getElementById(`travel-time-${destinationName}`);
                if (travelTimeElement) {
                    travelTimeElement.textContent = `Travel time: ${formattedTime}`;
                }
            } else {
                alert("Failed to fetch the route.");
            }
        })
        .catch(error => {
            console.error("Error fetching route:", error);
            alert("An error occurred while fetching the route.");
        });
}

function formatDuration(durationInSeconds) {
    const hours = Math.floor(durationInSeconds / 3600);
    const minutes = Math.floor((durationInSeconds % 3600) / 60);
    const seconds = Math.floor(durationInSeconds % 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

function getDistance(coord1, coord2) {
    const toRad = deg => (deg * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(coord2[0] - coord1[0]);
    const dLon = toRad(coord2[1] - coord1[1]);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(coord1[0])) * Math.cos(toRad(coord2[0])) *
              Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function removeRoute() {
    if (polyline) {
        map.removeLayer(polyline);
        polyline = null;
    }
}
