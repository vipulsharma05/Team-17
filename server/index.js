// server/index.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const WebSocket = require('ws');

const app = express();
const PORT = 3001;

// In-memory data store to mimic your original AppData
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
    nonFloodedZones: [
        { name: "Colaba Safe", coords: [[18.930, 72.810], [18.930, 72.840], [18.950, 72.840], [18.950, 72.810]] }
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

// API Endpoints
app.get('/api/incidents', (req, res) => res.json(AppData.incidents));
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

// WebSocket Server
const wss = new WebSocket.Server({ port: 8080 });

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

// Simulate real-time updates every 10-30 seconds
setInterval(() => {
    const messageTypes = ['incident_update', 'shelter_update', 'resource_alert', 'weather_warning'];
    const type = messageTypes[Math.floor(Math.random() * messageTypes.length)];
    let data;
    switch (type) {
        case 'incident_update':
            data = { id: AppData.incidents[0].id, status: 'escalated' };
            break;
        case 'shelter_update':
            data = { id: AppData.shelters[0].id, occupancy_change: 10 };
            break;
        case 'resource_alert':
            data = { resource: 'Water Bottles', level: 'low', location: 'Distribution Center' };
            break;
        case 'weather_warning':
            data = { type: 'heavy_rain', severity: 'high', area: 'Downtown District' };
            break;
    }
    broadcastUpdate(type, data);
}, Math.random() * 20000 + 10000);

app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
});