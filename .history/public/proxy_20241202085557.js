import express from 'express'; // Use import instead of require
import fetch from 'node-fetch'; // Use import for node-fetch

const app = express();
const PORT = 3000;

// Middleware to handle CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Proxy endpoint
app.post('/ors-proxy', express.json(), async (req, res) => {
    const { apiUrl } = req.query;
    try {
        const response = await fetch(apiUrl, { method: 'POST' });
        if (!response.ok) {
            // Handle errors returned by the ORS API
            return res.status(response.status).json({ error: await response.json() });
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error in proxy:', error);
        res.status(500).json({ error: 'Failed to fetch data from OpenRouteService' });
    }
});

app.listen(PORT, () => console.log(`Proxy running on http://localhost:${PORT}`));
