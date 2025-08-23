import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayerGroup, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { formatTime } from '../utils';

// Workaround for a react-leaflet bug
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// A custom component to handle location logic inside MapContainer
const LocationMarker = ({ setLocationStatus, setUserLocation }) => {
    const map = useMap();
    
    useEffect(() => {
        setLocationStatus('Checking for location permission...');
        map.locate().on("locationfound", function (e) {
            setUserLocation(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
            setLocationStatus('Location found!');
        }).on("locationerror", function (e) {
            setLocationStatus(`Location access denied: ${e.message}`);
        });
    }, [map, setLocationStatus, setUserLocation]);

    return null;
};

const LiveMap = ({ incidents, shelters }) => {
    const [map, setMap] = useState(null);
    const [showingIncidents, setShowingIncidents] = useState(true);
    const [showingShelters, setShowingShelters] = useState(true);
    const [showingFloodZones, setShowingFloodZones] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState('Waiting for location...');

    useEffect(() => {
        if (map) {
            map.invalidateSize();
        }
    }, [map]);

    const reportIncidentAtLocation = async (latlng) => {
        const incidentData = {
            name: `Map Incident ${Date.now()}`,
            coords: [latlng.lat, latlng.lng],
            priority: 'MEDIUM',
            description: 'Incident reported via map click',
            source: 'map_click'
        };
        try {
            await axios.post('http://localhost:3001/api/incidents', incidentData);
            alert('Incident reported successfully!');
        } catch (error) {
            alert('Failed to report incident.');
            console.error('Failed to report incident:', error);
        }
    };
    
    const getCurrentLocation = () => {
        if (map) {
            setLocationStatus('Finding your location...');
            map.locate({ setView: true, maxZoom: 15 });
        }
    };

    const incidentIcon = L.divIcon({
        className: 'sos-icon',
        html: '<div style="animation: blink 1s infinite; color: red; font-weight: bold; font-size: 24px;">🚨</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });

    const floodZoneData = [
        { name: "Andheri Flooded", coords: [[19.120, 72.845], [19.120, 72.865], [19.110, 72.865], [19.110, 72.845]], alertLevel: "HIGH" },
        { name: "Bandra Flooded", coords: [[19.060, 72.810], [19.060, 72.830], [19.050, 72.830], [19.050, 72.810]], alertLevel: "MEDIUM" }
    ];

    const addNewIncident = async () => {
        const incidentData = {
            name: `Emergency ${Date.now()}`,
            coords: [19.0760 + (Math.random() - 0.5) * 0.1, 72.8777 + (Math.random() - 0.5) * 0.1],
            priority: ["HIGH", "MEDIUM", "LOW"][Math.floor(Math.random() * 3)],
            description: "Simulated emergency incident",
            source: 'simulation'
        };
        try {
            await axios.post('http://localhost:3001/api/incidents', incidentData);
            alert('Simulated incident created!');
        } catch (error) {
            console.error('Failed to create simulated incident:', error);
        }
    };

    return (
        <div className="content-panel active" id="map">
            <MapContainer
                center={[19.0760, 72.8777]}
                zoom={12}
                scrollWheelZoom={true}
                whenCreated={setMap}
                style={{ height: '100%', width: '100%' }}
                onClick={(e) => {
                    if (window.confirm('Report incident at this location?')) {
                        reportIncidentAtLocation(e.latlng);
                    }
                }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {showingIncidents && (
                    <LayerGroup>
                        {incidents.filter(i => i.status === 'active').map(incident => (
                            <Marker key={incident.id} position={incident.coords} icon={incidentIcon}>
                                <Popup>
                                    <b>{incident.name}</b><br/>
                                    <b>Priority:</b> {incident.priority}<br/>
                                    {incident.description}<br/>
                                    <b>Time:</b> {formatTime(incident.time)}
                                </Popup>
                            </Marker>
                        ))}
                    </LayerGroup>
                )}

                {showingShelters && (
                    <LayerGroup>
                        {shelters.map(shelter => (
                            <Marker key={shelter.id} position={shelter.coords}>
                                <Popup>
                                    <b>{shelter.name}</b><br/>
                                    <b>Capacity:</b> {shelter.current}/{shelter.capacity}<br/>
                                    <b>Supplies:</b> {shelter.supplies.join(", ")}
                                </Popup>
                            </Marker>
                        ))}
                    </LayerGroup>
                )}

                {showingFloodZones && (
                    <LayerGroup>
                        {floodZoneData.map(zone => (
                            <Polygon key={zone.name} positions={zone.coords} pathOptions={{ color: zone.alertLevel === 'HIGH' ? '#e3342f' : '#f59e0b', fillColor: zone.alertLevel === 'HIGH' ? '#e3342f' : '#f59e0b', fillOpacity: 0.6, weight: 2 }}>
                                <Popup>
                                    <b>Flooded Area: {zone.name}</b><br/>
                                    <b>Alert Level:</b> {zone.alertLevel}
                                </Popup>
                            </Polygon>
                        ))}
                    </LayerGroup>
                )}

                {userLocation && (
                    <Marker position={userLocation}>
                        <Popup>Your current location</Popup>
                    </Marker>
                )}
            </MapContainer>
            
            {/* Left side options */}
            <div className="floating-controls">
                <button className="control-btn" onClick={() => setShowingIncidents(!showingIncidents)}>📍 {showingIncidents ? 'Hide' : 'Show'} Incidents</button>
                <button className="control-btn" onClick={() => setShowingShelters(!showingShelters)}>🏠 {showingShelters ? 'Hide' : 'Show'} Shelters</button>
                <button className="control-btn" onClick={() => setShowingFloodZones(!showingFloodZones)}>🌊 {showingFloodZones ? 'Hide' : 'Show'} Flood Zones</button>
                <button className="control-btn" onClick={addNewIncident}>➕ Add Incident</button>
                <button className="control-btn" onClick={getCurrentLocation}>📍 My Location</button>
            </div>
            {locationStatus && (
                <div style={{ position: 'absolute', bottom: '10px', left: '10px', backgroundColor: 'rgba(0,0,0,0.7)', color: 'white', padding: '5px 10px', borderRadius: '5px', zIndex: 1000 }}>
                    {locationStatus}
                </div>
            )}
        </div>
    );
};

export default LiveMap;