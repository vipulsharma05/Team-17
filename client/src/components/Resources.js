import React from 'react';

const Resources = ({ resources }) => {
    return (
        <div className="content-panel active" id="resources">
            <div className="panel-header">
                <h2 className="panel-title">Resource Distribution</h2>
            </div>
            <div id="resources-list">
                {resources.map(resource => {
                    const remaining = resource.total - resource.distributed;
                    const percentDistributed = ((resource.distributed / resource.total) * 100).toFixed(0);
                    return (
                        <div key={resource.name} className="resource-item">
                            <div>
                                <div className="resource-name">{resource.name}</div>
                                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                                    Location: {resource.location}
                                </div>
                            </div>
                            <div className="resource-status">
                                <div className="resource-count">{remaining} left</div>
                                <div style={{ fontSize: '12px' }}>{percentDistributed}% distributed</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Resources;