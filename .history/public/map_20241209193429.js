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
    let baseColor = 'gray';

    if (sportsArray.length > 0) {
        baseColor = getColorBySport(sportsArray[0]);
    }

    return L.divIcon({
        html: `<div style="background-color: ${baseColor}; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>`,
        className: '', // Prevent default icon styles
        iconSize: [15, 15],
        iconAnchor: [7.5, 7.5]
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



















function filterLocations(searchQuery) {
    const normalizedQuery = searchQuery.toLowerCase();

    const filteredLocations = searchQuery
        ? sportsLocations.filter(location =>
            (location.name && location.name.toLowerCase().includes(normalizedQuery)) ||
            (location.type && location.type.toLowerCase().includes(normalizedQuery)) ||
            (location.city && location.city.toLowerCase().includes(normalizedQuery)) ||
            (Array.isArray(location.sports) && location.sports.some(sport => sport.toLowerCase().includes(normalizedQuery)))
        )
        : sportsLocations.filter(loc => getDistance(userLocation, loc.position) <= 5);

    addMarkers(filteredLocations);
}

document.getElementById('search-box').addEventListener('input', (event) => {
    const searchQuery = event.target.value;
    filterLocations(searchQuery);
});


document.getElementById('search-box').addEventListener('input', (event) => {
    const searchQuery = event.target.value;
    filterLocations(searchQuery);
});

async function fetchDataFromFirebase() {
    const querySnapshot = await db.collection('sports_places').get();
    const fetchedLocations = [];

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Document data:", data);

        if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
            const latLngPosition = [data.latitude, data.longitude];

            fetchedLocations.push({
                name: data.name || 'Desconhecido', // Translate to Portuguese
                type: data.location_type || 'Tipo desconhecido',
                city: data.city || 'Cidade desconhecida',
                sports: Array.isArray(data.sports) ? data.sports.map(s => translateSport(s)) : [],
                position: latLngPosition
            });
        } else {
            console.error("No valid latitude/longitude for document:", doc.id, data);
        }
    });

    // Filter locations based on user's proximity
    if (userLocation) {
        sportsLocations = fetchedLocations.filter(loc => getDistance(userLocation, loc.position) <= 5);
    } else {
        sportsLocations = fetchedLocations;
    }

    addMarkers(sportsLocations);
}

// Translate sports to Portuguese
function translateSport(sport) {
    const translations = {
        'soccer': 'Futebol',
        'basketball': 'Basquete',
        'tennis': 'Tênis',
        'volleyball': 'Vôlei',
        // Add other sport translations here
    };
    return translations[sport.toLowerCase()] || sport;
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
