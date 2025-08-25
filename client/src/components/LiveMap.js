import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayerGroup, Polygon, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import { formatTime } from '../utils';

// Workaround for a react-leaflet bug with marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LiveMap = ({ incidents, shelters, selectedIncident, onBack, fullScreen = true }) => {
    // Original state from first component
    const [mapInstance, setMapInstance] = useState(null);
    const [showingIncidents, setShowingIncidents] = useState(true);
    const [showingShelters, setShowingShelters] = useState(true);
    const [showingFloodZones, setShowingFloodZones] = useState(true);
    const [userLocation, setUserLocation] = useState(null);
    const [locationStatus, setLocationStatus] = useState(null);
    
    // Additional state from second component
    const [floodPolygons, setFloodPolygons] = useState([]);
    const [backendIncidents, setBackendIncidents] = useState([]);
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeLayer, setActiveLayer] = useState('all');
    const [showingResources, setShowingResources] = useState(true);

    const MapEvents = () => {
        const map = useMapEvents({
            click: (e) => {
                if (window.confirm('Report incident at this location?')) {
                    reportIncidentAtLocation(e.latlng);
                }
            },
            locationfound: (e) => {
                setUserLocation(e.latlng);
                map.flyTo(e.latlng, map.getZoom());
                setLocationStatus(null);
            },
            locationerror: (e) => {
                setLocationStatus(`Location access denied: ${e.message}`);
            },
        });
        
        return null;
    };

    // Effect to pan the map to the selected incident
    useEffect(() => {
        if (selectedIncident && mapInstance) {
            mapInstance.flyTo(selectedIncident.coords, 15);
        }
    }, [selectedIncident, mapInstance]);

    useEffect(() => {
        if (mapInstance) {
            mapInstance.invalidateSize();
        }
    }, [mapInstance]);

    // ESC key handler for closing fullscreen map
    useEffect(() => {
        const handleEsc = (event) => {
            if (event.keyCode === 27 && fullScreen) { // ESC key
                if (onBack) {
                    onBack();
                } else {
                    window.history.back();
                }
            }
        };
        
        if (fullScreen) {
            document.addEventListener('keydown', handleEsc, false);
            return () => {
                document.removeEventListener('keydown', handleEsc, false);
            };
        }
    }, [fullScreen, onBack]);

    // Load data from backend (second component functionality)
    useEffect(() => {
        Promise.all([
            fetchFloodData(),
            fetchBackendIncidents(),
            fetchResources()
        ]).finally(() => {
            setLoading(false);
        });
    }, []);

    const fetchFloodData = async () => {
        try {
            const response = await fetch('http://localhost:5000/get_flood_polygons');
            if (!response.ok) {
                throw new Error('Failed to fetch flood data');
            }
            const data = await response.json();
            console.log('Flood data:', data);

            // Convert GeoJSON coordinates for Leaflet (swap lat/lng)
            const coords = data.features.map((feature, index) => ({
                id: index,
                positions: feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]]),
                properties: feature.properties || {}
            }));
            console.log("Converted polygons:", coords);
            
            setFloodPolygons(coords);
        } catch (err) {
            console.error('Error fetching flood data:', err);
            setError(prev => prev || err.message);
        }
    };

    const fetchBackendIncidents = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/incidents');
            if (response.ok) {
                const data = await response.json();
                setBackendIncidents(data.incidents || []);
            }
        } catch (err) {
            console.error('Failed to fetch backend incidents:', err);
        }
    };

    const fetchResources = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/resources');
            if (response.ok) {
                const data = await response.json();
                // Filter resources that have location coordinates
                const resourcesWithLocation = data.resources.filter(resource => 
                    resource.lat && resource.lng
                );
                setResources(resourcesWithLocation);
            }
        } catch (err) {
            console.error('Failed to fetch resources:', err);
        }
    };

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
            // Refresh incidents after reporting
            fetchBackendIncidents();
        } catch (error) {
            alert('Failed to report incident.');
            console.error('Failed to report incident:', error);
        }
    };
    
    const getCurrentLocation = () => {
        if (mapInstance) {
            setLocationStatus('Finding your location...');
            mapInstance.locate({ setView: true, maxZoom: 15 });
        }
    };

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
            // Refresh incidents after adding
            fetchBackendIncidents();
        } catch (error) {
            alert('Failed to report incident.');
            console.error('Failed to report incident:', error);
        }
    };

    const toggleLayer = (layerType) => {
        setActiveLayer(layerType);
    };

    // Custom icons
    const incidentIcon = L.divIcon({
        className: 'sos-icon',
        html: '<div style="animation: blink 1s infinite; color: red; font-weight: bold; font-size: 24px;">🚨</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
    
    const selectedIcon = L.divIcon({
        className: 'selected-icon',
        html: '<div style="animation: bounce 1s infinite; font-size: 32px; color: yellow;">📍</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });

    if (loading) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                zIndex: 2000
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    border: '4px solid rgba(255,255,255,0.3)',
                    borderTop: '4px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '20px'
                }}></div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>Loading Mumbai Flood Map...</h3>
                <p style={{ margin: 0, fontSize: '16px', opacity: 0.8 }}>Fetching real-time data...</p>
                <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                color: 'white',
                zIndex: 2000,
                padding: '20px'
            }}>
                <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚠️</div>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>Unable to Load Map Data</h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '16px', opacity: 0.9, textAlign: 'center' }}>{error}</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        onClick={() => window.location.reload()} 
                        style={{
                            padding: '10px 20px',
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '25px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        Reload Page
                    </button>
                    <button 
                        onClick={() => setError(null)} 
                        style={{
                            padding: '10px 20px',
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '25px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        Dismiss Error
                    </button>
                </div>
            </div>
        );
    }

    const allIncidents = incidents || [];
    const totalIncidents = allIncidents.length + backendIncidents.length;

    return (
        <div style={{ 
            position: fullScreen ? 'fixed' : 'relative', 
            top: fullScreen ? 0 : 'auto', 
            left: fullScreen ? 0 : 'auto', 
            right: fullScreen ? 0 : 'auto', 
            bottom: fullScreen ? 0 : 'auto', 
            zIndex: fullScreen ? 1000 : 'auto',
            backgroundColor: '#f8f9fa',
            display: 'flex',
            flexDirection: 'column',
            height: fullScreen ? '100vh' : '600px',
            width: fullScreen ? '100vw' : '100%'
        }}>
            <style jsx>{`
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.3; }
                }
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                    60% { transform: translateY(-5px); }
                }
                @keyframes pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.1); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .popup-content h4 {
                    margin: 0 0 10px 0;
                    color: #333;
                    font-size: 16px;
                }
                .popup-content p {
                    margin: 5px 0;
                    font-size: 14px;
                    color: #666;
                }
                .status {
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    margin-left: 5px;
                }
                .status.active { background: #d4edda; color: #155724; }
                .status.resolved { background: #f8d7da; color: #721c24; }
                .severity.high { background: #f8d7da; color: #721c24; }
                .severity.medium { background: #fff3cd; color: #856404; }
                .severity.low { background: #d4edda; color: #155724; }
            `}</style>
            
            {/* Map Header with Controls */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '1rem 2rem',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                zIndex: fullScreen ? 1001 : 'auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Close/Back Button - Always show when fullScreen */}
                        {(onBack || fullScreen) && (
                            <button 
                                onClick={onBack || (() => window.history.back())}
                                style={{
                                    padding: '0.75rem',
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s ease',
                                    backdropFilter: 'blur(10px)',
                                    width: '45px',
                                    height: '45px'
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.background = 'rgba(255,255,255,0.3)';
                                    e.target.style.transform = 'translateX(-2px)';
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.background = 'rgba(255,255,255,0.2)';
                                    e.target.style.transform = 'translateX(0)';
                                }}
                                title={fullScreen ? "Close Map" : "Back to Dashboard"}
                            >
                                {fullScreen ? '✕' : '←'}
                            </button>
                        )}
                        
                        <div>
                            <h1 style={{ margin: 0, fontSize: fullScreen ? '1.75rem' : '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                🗺️ Mumbai Disaster Response Map
                            </h1>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{
                                    background: 'rgba(255,255,255,0.2)', 
                                    backdropFilter: 'blur(10px)',
                                    color: 'white', 
                                    padding: '0.25rem 0.75rem', 
                                    borderRadius: '20px', 
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}>
                                    🌊 {floodPolygons.length} Flood Zones
                                </span>
                                <span style={{
                                    background: 'rgba(255,255,255,0.2)', 
                                    backdropFilter: 'blur(10px)',
                                    color: 'white', 
                                    padding: '0.25rem 0.75rem', 
                                    borderRadius: '20px', 
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}>
                                    ⚠️ {totalIncidents} Active Incidents
                                </span>
                                <span style={{
                                    background: 'rgba(255,255,255,0.2)', 
                                    backdropFilter: 'blur(10px)',
                                    color: 'white', 
                                    padding: '0.25rem 0.75rem', 
                                    borderRadius: '20px', 
                                    fontSize: '0.875rem',
                                    fontWeight: '500'
                                }}>
                                    📦 {resources.length + (shelters?.length || 0)} Resources
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Layer Toggle Controls */}
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button 
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                borderRadius: '25px',
                                background: activeLayer === 'floods' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                                color: activeLayer === 'floods' ? '#667eea' : 'white',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                transition: 'all 0.3s ease',
                                backdropFilter: 'blur(10px)'
                            }}
                            onClick={() => toggleLayer('floods')}
                            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                            🌊 Flood Zones
                        </button>
                        <button 
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                borderRadius: '25px',
                                background: activeLayer === 'incidents' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                                color: activeLayer === 'incidents' ? '#667eea' : 'white',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                transition: 'all 0.3s ease',
                                backdropFilter: 'blur(10px)'
                            }}
                            onClick={() => toggleLayer('incidents')}
                            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                            ⚠️ Incidents
                        </button>
                        <button 
                            style={{
                                padding: '0.5rem 1rem',
                                border: 'none',
                                borderRadius: '25px',
                                background: activeLayer === 'all' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                                color: activeLayer === 'all' ? '#667eea' : 'white',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                transition: 'all 0.3s ease',
                                backdropFilter: 'blur(10px)'
                            }}
                            onClick={() => toggleLayer('all')}
                            onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                            📍 All Layers
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ flex: 1, position: 'relative' }}>
                <MapContainer
                    center={[19.0760, 72.8777]}
                    zoom={12}
                    scrollWheelZoom={true}
                    ref={setMapInstance}
                    style={{ height: '100%', width: '100%' }}
                    className="leaflet-container"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <MapEvents />

                    {/* Props-based incidents (original functionality) */}
                    {showingIncidents && (activeLayer === 'incidents' || activeLayer === 'all') && (
                        <LayerGroup>
                            {allIncidents.filter(i => i.status === 'active').map(incident => (
                                <Marker key={incident.id} position={incident.coords} icon={incidentIcon}>
                                    <Popup>
                                        <div className="popup-content">
                                            <h4><b>{incident.name}</b></h4>
                                            <p><b>Priority:</b> {incident.priority}</p>
                                            <p>{incident.description}</p>
                                            <p><b>Time:</b> {formatTime(incident.time)}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </LayerGroup>
                    )}

                    {/* Backend incidents (second component functionality) */}
                    {(activeLayer === 'incidents' || activeLayer === 'all') && 
                        backendIncidents.map((incident) => (
                            <Marker 
                                key={`backend-incident-${incident.id}`}
                                position={[incident.lat, incident.lng]}
                                icon={incidentIcon}
                            >
                                <Popup>
                                    <div className="popup-content">
                                        <h4>⚠️ {incident.title}</h4>
                                        <p>{incident.description}</p>
                                        <p><strong>Status:</strong> 
                                            <span className={`status ${incident.status}`}>
                                                {incident.status.toUpperCase()}
                                            </span>
                                        </p>
                                        <p><strong>Severity:</strong> 
                                            <span className={`severity ${incident.severity}`}>
                                                {incident.severity.toUpperCase()}
                                            </span>
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))
                    }

                    {/* Selected incident marker */}
                    {selectedIncident && (
                        <Marker key={`selected-${selectedIncident.id}`} position={selectedIncident.coords} icon={selectedIcon}>
                            <Popup>
                                <div className="popup-content">
                                    <h4><b>SELECTED: {selectedIncident.name}</b></h4>
                                    <p><b>Priority:</b> {selectedIncident.priority}</p>
                                    <p>{selectedIncident.description}</p>
                                    <p><b>Time:</b> {formatTime(selectedIncident.time)}</p>
                                </div>
                            </Popup>
                        </Marker>
                    )}

                    {/* Props-based shelters (original functionality) */}
                    {showingShelters && (activeLayer === 'all') && shelters && (
                        <LayerGroup>
                            {shelters.map(shelter => (
                                <Marker key={shelter.id} position={shelter.coords}>
                                    <Popup>
                                        <div className="popup-content">
                                            <h4><b>{shelter.name}</b></h4>
                                            <p><b>Capacity:</b> {shelter.current}/{shelter.capacity}</p>
                                            <p><b>Supplies:</b> {shelter.supplies.join(", ")}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </LayerGroup>
                    )}

                    {/* Backend resources (second component functionality) */}
                    {showingResources && (activeLayer === 'all') && 
                        resources.map((resource) => (
                            <Marker 
                                key={`resource-${resource.id}`}
                                position={[resource.lat, resource.lng]}
                            >
                                <Popup>
                                    <div className="popup-content">
                                        <h4>📦 {resource.name}</h4>
                                        <p><strong>Type:</strong> {resource.type}</p>
                                        <p><strong>Status:</strong> 
                                            <span className={`status ${resource.status}`}>
                                                {resource.status.toUpperCase()}
                                            </span>
                                        </p>
                                        <p><strong>Location:</strong> {resource.location}</p>
                                        <p><strong>Quantity:</strong> {resource.quantity}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))
                    }

                    {/* Backend flood polygons */}
                    {showingFloodZones && (activeLayer === 'floods' || activeLayer === 'all') && 
                        floodPolygons.map((floodZone) => (
                            <Polygon 
                                key={`flood-${floodZone.id}`}
                                positions={floodZone.positions} 
                                pathOptions={{ 
                                    color: '#ff4444', 
                                    fillColor: '#ff6666',
                                    fillOpacity: 0.4,
                                    weight: 2,
                                    opacity: 0.8
                                }}
                            >
                                <Popup>
                                    <div className="popup-content">
                                        <h4>🌊 Flood Zone #{floodZone.id + 1}</h4>
                                        <p><strong>Risk Level:</strong> High</p>
                                        <p><strong>Last Updated:</strong> {new Date().toLocaleString()}</p>
                                    </div>
                                </Popup>
                            </Polygon>
                        ))
                    }

                    {/* User location marker */}
                    {userLocation && (
                        <Marker position={userLocation}>
                            <Popup>Your current location</Popup>
                        </Marker>
                    )}
                </MapContainer>
                
                {/* Additional Quick Actions - Only show in fullScreen mode */}
                {fullScreen && (
                    <div style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        zIndex: 1000
                    }}>
                        {/* ESC key hint */}
                        <div style={{
                            padding: '8px 12px',
                            background: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            borderRadius: '20px',
                            fontSize: '12px',
                            backdropFilter: 'blur(10px)',
                            opacity: 0.8
                        }}>
                            Press ESC to close
                        </div>
                    </div>
                )}

                {/* Floating controls (original functionality) */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    zIndex: 1000
                }}>
                    <button 
                        style={{
                            padding: '10px 15px',
                            background: showingIncidents ? '#dc3545' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '25px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(10px)'
                        }}
                        onClick={() => setShowingIncidents(!showingIncidents)}
                        onMouseOver={(e) => {e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'}}
                        onMouseOut={(e) => {e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'}}
                    >
                        📍 {showingIncidents ? 'Hide' : 'Show'} Incidents
                    </button>
                    <button 
                        style={{
                            padding: '10px 15px',
                            background: showingShelters ? '#dc3545' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '25px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(10px)'
                        }}
                        onClick={() => setShowingShelters(!showingShelters)}
                        onMouseOver={(e) => {e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'}}
                        onMouseOut={(e) => {e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'}}
                    >
                        🏠 {showingShelters ? 'Hide' : 'Show'} Shelters
                    </button>
                    <button 
                        style={{
                            padding: '10px 15px',
                            background: showingFloodZones ? '#dc3545' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '25px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(10px)'
                        }}
                        onClick={() => setShowingFloodZones(!showingFloodZones)}
                        onMouseOver={(e) => {e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'}}
                        onMouseOut={(e) => {e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'}}
                    >
                        🌊 {showingFloodZones ? 'Hide' : 'Show'} Flood Zones
                    </button>
                    <button 
                        style={{
                            padding: '10px 15px',
                            background: showingResources ? '#dc3545' : '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '25px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(10px)'
                        }}
                        onClick={() => setShowingResources(!showingResources)}
                        onMouseOver={(e) => {e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'}}
                        onMouseOut={(e) => {e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'}}
                    >
                        📦 {showingResources ? 'Hide' : 'Show'} Resources
                    </button>
                    <button 
                        style={{
                            padding: '10px 15px',
                            background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '25px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(10px)'
                        }}
                        onClick={addNewIncident}
                        onMouseOver={(e) => {e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'}}
                        onMouseOut={(e) => {e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'}}
                    >
                        ➕ Add Incident
                    </button>
                    <button 
                        style={{
                            padding: '10px 15px',
                            background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '25px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s ease',
                            backdropFilter: 'blur(10px)'
                        }}
                        onClick={getCurrentLocation}
                        onMouseOver={(e) => {e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)'}}
                        onMouseOut={(e) => {e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)'}}
                    >
                        📍 My Location
                    </button>
                </div>

                {/* Location status */}
                {locationStatus && (
                    <div style={{ 
                        position: 'absolute', 
                        bottom: '20px', 
                        left: '20px', 
                        background: 'rgba(0,0,0,0.8)', 
                        color: 'white', 
                        padding: '10px 20px', 
                        borderRadius: '25px', 
                        zIndex: 1000,
                        fontSize: '14px',
                        fontWeight: '500',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        {locationStatus}
                    </div>
                )}

                {/* Map Legend */}
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(10px)',
                    padding: '20px',
                    borderRadius: '15px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    minWidth: '250px'
                }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🗺️ Map Legend
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                background: 'linear-gradient(135deg, #ff4444, #ff6666)',
                                borderRadius: '4px',
                                border: '2px solid #ff4444'
                            }}></div>
                            <span style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>
                                Flood Risk Areas ({floodPolygons.length})
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                background: 'linear-gradient(135deg, #ffc107, #ffeb3b)',
                                borderRadius: '50%',
                                border: '2px solid #ffc107'
                            }}></div>
                            <span style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>
                                Active Incidents ({totalIncidents})
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                background: 'linear-gradient(135deg, #28a745, #20c997)',
                                borderRadius: '4px',
                                border: '2px solid #28a745'
                            }}></div>
                            <span style={{ fontSize: '14px', color: '#333', fontWeight: '500' }}>
                                Emergency Resources ({resources.length + (shelters?.length || 0)})
                            </span>
                        </div>
                    </div>
                    
                    {/* Real-time Status */}
                    <div style={{ 
                        marginTop: '15px', 
                        paddingTop: '15px', 
                        borderTop: '1px solid #eee',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px' 
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            background: '#28a745',
                            borderRadius: '50%',
                            animation: 'pulse 2s infinite'
                        }}></div>
                        <span style={{ fontSize: '14px', color: '#28a745', fontWeight: '500' }}>
                            Real-time Updates Active
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveMap;