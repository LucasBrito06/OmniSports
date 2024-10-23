// Step 1: Initialize the Map centered on Rio de Janeiro (optimized for mobile)
const map = L.map('map', {
    center: [-22.9068, -43.1729],
    zoom: 12,
    zoomSnap: 0.5,
    zoomDelta: 0.5,
    zoomAnimation: true,
    scrollWheelZoom: true,
    doubleClickZoom: true
});





// Step 2: Add a minimalist Tile Layer (clean map with only streets) -> GPT me deu isso para estilizar o mapa
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);





// Seleciona pontos -> Alterar lógica para incluir algoritimo e pegar somente os pontos proximos do usuario
const sportsLocations = [
    { name: 'Academia Vila', type: 'Gym', position: [-22.908, -43.176] },
    { name: 'Praia do Leblon', type: 'Beach', position: [-22.9838, -43.2165] },
    { name: 'Clube Flamengo', type: 'Club', position: [-22.9501, -43.1729] },
    { name: 'Maracanã', type: 'Field', position: [-22.9121, -43.2302] },
    { name: 'Quadra Tijuca', type: 'Court', position: [-22.921, -43.229] }
];

// Cores dos marcadores
const markerColors = {
    Gym: 'blue',
    Court: 'red',
    Beach: 'orange',
    Field: 'green',
    Club: 'black'
};

// Marcadores
sportsLocations.forEach(location => {
    const locationType = location.type.trim();
    const markerColor = markerColors[locationType] || "yellow";

    const customIcon = L.icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${markerColor}.png`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        shadowSize: [41, 41]
    });

    L.marker(location.position, { icon: customIcon })
        .bindPopup(`<b>${location.name}</b><br>Type: ${location.type}`)
        .addTo(map);
});

// Mostra usuario
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // Coloca como ponto principal do mapa
        map.setView([userLat, userLng], 13);

        // Marcador
        L.marker([userLat, userLng])
            .bindPopup('<b>You are here!</b>')
            .addTo(map);
    });
}
