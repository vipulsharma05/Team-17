import React from 'react';

const Shelters = ({ shelters }) => {
    return (
        <div className="content-panel active" id="shelters">
            <div className="panel-header">
                <h2 className="panel-title">Shelter Management</h2>
            </div>
            <div id="shelters-list">
                {shelters.map(shelter => {
                    const occupancyRate = ((shelter.current / shelter.capacity) * 100).toFixed(0);
                    return (
                        <div key={shelter.id} className="resource-item">
                            <div>
                                <div className="resource-name">{shelter.name}</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                                    Supplies: {shelter.supplies.join(", ")}
                                </div>
                                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                                    Location: {shelter.coords[0].toFixed(4)}, {shelter.coords[1].toFixed(4)}
                                </div>
                            </div>
                            <div className="resource-status">
                                <div className="resource-count">{shelter.current}/{shelter.capacity}</div>
                                <div style={{ fontSize: '12px' }}>{occupancyRate}% full</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Shelters;