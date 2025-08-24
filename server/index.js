const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const http = require('http');
const axios = require('axios');

// Replace with your actual API key from NewsAPI.org
const NEWS_API_KEY = '46bffea9aebe4569861060dc97f9d803';

const app = express();
const PORT = 3001;

// In-memory data store
const AppData = {
    incidents: [
        { id: 1, name: "Family Trapped", coords: [19.115, 72.855], priority: "HIGH", time: new Date(), description: "Family of 4 trapped in flooded building", status: "active" },
        { id: 2, name: "Medical Emergency", coords: [19.055, 72.820], priority: "HIGH", time: new Date(), description: "Elderly person needs evacuation", status: "active" },
        { id: 3, name: "Bridge Damage", coords: [19.075, 72.835], priority: "MEDIUM", time: new Date(), description: "Bridge reported unsafe", status: "investigating" }
    ],
    shelters: [
        { id: 1, name: "Andheri Community Center", coords: [19.115, 72.855], capacity: 200, current: 45, supplies: ["food", "water", "medical"] },
        { id: 2, name: "Bandra Relief Camp", coords: [19.055, 72.820], capacity: 150, current: 23, supplies: ["food", "blankets"] },
        { id: 3, name: "Colaba Safe House", coords: [18.945, 72.825], capacity: 100, current: 12, supplies: ["food", "water", "medical", "blankets"] }
    ],
    floodedZones: [
        { name: "Andheri Flooded", coords: [[19.120, 72.845], [19.120, 72.865], [19.110, 72.865], [19.110, 72.845]], alertLevel: "HIGH" },
        { name: "Bandra Flooded", coords: [[19.060, 72.810], [19.060, 72.830], [19.050, 72.830], [19.050, 72.810]], alertLevel: "MEDIUM" }
    ],
    resources: [
        { name: "Medical Supplies", total: 500, distributed: 234, location: "Central Warehouse" },
        { name: "Food Packages", total: 1000, distributed: 456, location: "Multiple Shelters" },
        { name: "Water Bottles", total: 2000, distributed: 789, location: "Distribution Centers" },
        { name: "Blankets", total: 300, distributed: 123, location: "Shelters" }
    ]
};

app.use(cors());
app.use(bodyParser.json());

function triageSocialMediaPost(postText) {
    const textLower = postText.toLowerCase();
    const keywords = {
        rescue: ['trapped', 'stuck', 'help', 'rescue', 'emergency'],
        food: ['food', 'water', 'hungry', 'thirsty', 'supplies'],
        safe: ['safe', 'ok', 'okay'],
        irrelevant: ['hello', 'hi', 'how are you', 'test']
    };
    let priority = 'LOW';
    let category = 'Irrelevant';
    let relevanceScore = 0;
    if (keywords.irrelevant.some(keyword => textLower.includes(keyword))) {
        return { priority: 'LOW', category: 'Irrelevant', relevanceScore: 0 };
    }
    if (keywords.rescue.some(keyword => textLower.includes(keyword))) {
        relevanceScore = 3;
        category = 'Needs Rescue';
        priority = 'HIGH';
    } else if (keywords.food.some(keyword => textLower.includes(keyword))) {
        relevanceScore = 2;
        category = 'Needs Food/Water';
        priority = 'MEDIUM';
    } else if (keywords.safe.some(keyword => textLower.includes(keyword))) {
        relevanceScore = 1;
        category = 'Safe';
        priority = 'LOW';
    }
    return { priority, category, relevanceScore };
}

app.get('/api/incidents', (req, res) => res.json(AppData.incidents));
app.delete('/api/incidents', (req, res) => {
    AppData.incidents = [];
    broadcastUpdate('incidents_cleared', { message: 'All incidents have been cleared.' });
    res.status(200).json({ message: 'All incidents have been cleared.' });
});
app.post('/api/incidents', (req, res) => {
    const newIncident = { id: Date.now(), ...req.body, time: new Date(), status: 'active' };
    AppData.incidents.push(newIncident);
    broadcastUpdate('incident_update', newIncident);
    res.status(201).json(newIncident);
});
app.put('/api/incidents/:id', (req, res) => {
    const { id } = req.params;
    const incident = AppData.incidents.find(i => i.id === parseInt(id));
    if (incident) {
        Object.assign(incident, req.body);
        broadcastUpdate('incident_update', incident);
        res.json(incident);
    } else {
        res.status(404).send('Incident not found');
    }
});
app.get('/api/shelters', (req, res) => res.json(AppData.shelters));
app.get('/api/resources', (req, res) => res.json(AppData.resources));
app.get('/api/weather', (req, res) => res.json({
    temperature: Math.floor(Math.random() * 15) + 20,
    humidity: Math.floor(Math.random() * 30) + 60,
    windSpeed: Math.floor(Math.random() * 20) + 5,
    condition: ['Sunny', 'Cloudy', 'Rainy', 'Stormy'][Math.floor(Math.random() * 4)],
    alerts: Math.random() > 0.7 ? ['Heavy rainfall expected'] : []
}));
app.post('/api/triage-social-media', async (req, res) => {
    const { postText } = req.body;
    const { priority, category, relevanceScore } = triageSocialMediaPost(postText);
    const RELEVANCE_THRESHOLD = 1;
    if (relevanceScore < RELEVANCE_THRESHOLD) {
        return res.status(200).json({ message: 'Post classified as irrelevant and filtered.', incident: null });
    }
    const newIncident = {
        id: Date.now(),
        name: `Social Media Alert (${category})`,
        coords: [19.0760 + (Math.random() - 0.5) * 0.1, 72.8777 + (Math.random() - 0.5) * 0.1],
        priority,
        description: `Post text: "${postText}"`,
        status: 'active',
        source: 'social_media',
        relevanceScore
    };
    AppData.incidents.push(newIncident);
    broadcastUpdate('social_media_triage', newIncident);
    res.status(201).json({ message: 'Post classified and added as an incident.', incident: newIncident });
});

async function pollNewsAPI() {
    console.log('Polling News API for new disaster reports...');
    const keywords = 'flood OR cyclone OR storm OR rescue OR emergency';
    try {
        const response = await axios.get(`https://newsapi.org/v2/everything?q=${keywords}&language=en&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`);
        const articles = response.data.articles || [];
        for (const article of articles) {
            const postText = article.title + ' ' + article.description;
            const { priority, category, relevanceScore } = triageSocialMediaPost(postText);
            const RELEVANCE_THRESHOLD = 2;
            if (relevanceScore >= RELEVANCE_THRESHOLD) {
                const newIncident = {
                    id: article.url,
                    name: `News Alert (${category})`,
                    coords: [19.0760 + (Math.random() - 0.5) * 0.1, 72.8777 + (Math.random() - 0.5) * 0.1],
                    priority,
                    description: article.title,
                    status: 'active',
                    source: 'news_api',
                    time: new Date(), // Set the time to a new Date object
                    relevanceScore
                };
                if (!AppData.incidents.find(inc => inc.id === newIncident.id)) {
                    AppData.incidents.push(newIncident);
                    broadcastUpdate('social_media_triage', newIncident);
                }
            }
        }
    } catch (error) {
        console.error('Error polling News API:', error.response?.data || error.message);
    }
}
setInterval(pollNewsAPI, 30000);

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
wss.on('connection', ws => {
    console.log('Frontend client connected via WebSocket');
});
function broadcastUpdate(type, data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type, data }));
        }
    });
}
server.listen(PORT, () => {
    console.log(`Express server and WebSocket server running on http://localhost:${PORT}`);
});