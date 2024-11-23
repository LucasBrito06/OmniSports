// Global variables
let userLocation = null;
let markers = [];
let polyline = null;

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

// Sports locations data
let sportsLocations = [
    { name: 'Academia Vila', type: 'Gym', position: [-22.908, -43.176] },
    { name: 'Praia do Leblon', type: 'Beach', position: [-22.9838, -43.2165] },
    { name: 'Clube Flamengo', type: 'Club', position: [-22.9501, -43.1729] },
    { name: 'Maracanã', type: 'Field', position: [-22.9121, -43.2302] },
    { name: 'Quadra Tijuca', type: 'Court', position: [-22.921, -43.229] }
];

// Display user's location on the map
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
        userLocation = [position.coords.latitude, position.coords.longitude];
        map.setView(userLocation, 13);
        L.marker(userLocation).bindPopup('<b>You are here!</b>').addTo(map);
    }, () => {
        alert("Could not get your location.");
    });
}

function addMarkers(locations) {
    // Remove all existing markers from the map
    markers.forEach(marker => map.removeLayer(marker));
    markers = []; // Clear the markers array

    // Add filtered markers to the map
    locations.forEach(location => {
        const marker = L.marker(location.position)
            .bindPopup(`
                <b>${location.name}</b><br>Type: ${location.type}<br>
                <button onclick="calculateShortestRoute('${location.name}', this)">Navigate Here</button>
                <button onclick="removeRoute()">Remove Route</button>
                <p id="travel-time-${location.name}" style="margin-top: 5px; font-size: 0.9em; color: #555;">
                    Travel time: Calculating...
                </p>
            `)
            .addTo(map);
        markers.push(marker); // Store the marker reference
    });
}

function filterLocations(searchQuery) {
    // Normalize query for case-insensitive search
    const normalizedQuery = searchQuery.toLowerCase();

    // Filter locations whose name or type matches the query
    const filteredLocations = sportsLocations.filter(location =>
        location.name.toLowerCase().includes(normalizedQuery) ||
        location.type.toLowerCase().includes(normalizedQuery)
    );

    // Check if the current route is still valid
    if (polyline) {
        const routeDestinationName = markers.find(marker => 
            polyline.getBounds().contains(marker.getLatLng())
        )?.options.title;

        if (routeDestinationName) {
            const destinationInFilter = filteredLocations.some(
                location => location.name === routeDestinationName
            );

            // If the destination is not in the filtered list, remove the route
            if (!destinationInFilter) {
                removeRoute();
            }
        }
    }

    // Update markers on the map with filtered locations
    addMarkers(filteredLocations);
}

// Attach the event listener for search functionality
document.getElementById('search-box').addEventListener('input', (event) => {
    const searchQuery = event.target.value;
    filterLocations(searchQuery);
});

addMarkers(sportsLocations);

// Function to calculate a route using OSRM
function calculateShortestRoute(destinationName, buttonElement) {
    if (!userLocation) {
        alert("User location not available.");
        return;
    }

    // Find the selected destination
    const destination = sportsLocations.find(loc => loc.name === destinationName);
    if (!destination) {
        alert("Destination not found.");
        return;
    }

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${destination.position[1]},${destination.position[0]}?overview=full&geometries=geojson`;

    // Fetch the route from OSRM
    fetch(osrmUrl)
        .then(response => response.json())
        .then(data => {
            if (data.code === "Ok") {
                const route = data.routes[0];

                // Remove existing route if any
                if (polyline) map.removeLayer(polyline);

                // Decode GeoJSON route and add to map
                polyline = L.geoJSON(route.geometry, { color: 'blue' }).addTo(map);

                // Fit the map to the route
                map.fitBounds(polyline.getBounds());

                // Extract and display travel time
                const travelTimeInSeconds = route.duration; // Duration in seconds
                const formattedTime = formatDuration(travelTimeInSeconds);

                // Update travel time under the button
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

// Calculate distance between two coordinates (Haversine formula)
function getDistance(coord1, coord2) {
    const toRad = deg => (deg * Math.PI) / 180;
    const R = 6371; // Radius of the Earth in km
    const dLat = toRad(coord2[0] - coord1[0]);
    const dLon = toRad(coord2[1] - coord1[1]);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(coord1[0])) * Math.cos(toRad(coord2[0])) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Dijkstra's algorithm implementation
function dijkstra(graph, start) {
    const distances = {};
    const previousNodes = {};
    const visited = new Set();
    const pq = new PriorityQueue();

    Object.keys(graph).forEach(node => {
        distances[node] = Infinity;
        previousNodes[node] = null;
    });

    distances[start] = 0;
    pq.enqueue(start, 0);

    while (!pq.isEmpty()) {
        const { element: currentNode } = pq.dequeue();
        if (visited.has(currentNode)) continue;

        visited.add(currentNode);

        for (const neighbor in graph[currentNode]) {
            const newDist = distances[currentNode] + graph[currentNode][neighbor];
            if (newDist < distances[neighbor]) {
                distances[neighbor] = newDist;
                previousNodes[neighbor] = currentNode;
                pq.enqueue(neighbor, newDist);
            }
        }
    }

    return { distances, previousNodes };
}

// Priority Queue implementation
class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(element, priority) {
        this.items.push({ element, priority });
        this.items.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length === 0;
    }
}

// Draw the route on the map
function drawRoute(path, graph) {
    if (polyline) map.removeLayer(polyline);

    const routeCoordinates = path.map(node => {
        if (node === 'User') return userLocation;
        const location = sportsLocations.find(loc => loc.name === node);
        return location.position;
    });

    polyline = L.polyline(routeCoordinates, { color: 'blue' }).addTo(map);
    map.fitBounds(polyline.getBounds());
}

function removeRoute() {
    if (polyline) {
        map.removeLayer(polyline);
        polyline = null;
    }
}
