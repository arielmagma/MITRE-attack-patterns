import React from "react";

export default function AttackDetail({ attack, onBack }) {
    if (!attack) return null;

    return (
        <div className="container detail-container">
            <button className="back-btn" onClick={onBack}>
                ← Back to List
            </button>

            <header className="detail-header">
                <h1 className="detail-title">{attack.name}</h1>
            </header>

            {/* List Box Structure in strict requested order */}
            <div className="detail-list-box">
                
                {/* 1. Attack Pattern ID */}
                <div className="detail-row">
                    <span className="detail-label">Attack Pattern ID</span>
                    <span className="detail-value mono">{attack.id}</span>
                </div>
                
                {/* 2. Description */}
                <div className="detail-row">
                    <span className="detail-label">Description</span>
                    <span className="detail-value">{attack.description || "No description provided."}</span>
                </div>

                {/* 3. Platforms */}
                <div className="detail-row">
                    <span className="detail-label">Platforms</span>
                    <div className="detail-value">
                        {(() => {
                            if (Array.isArray(attack.platforms) && attack.platforms.length > 0) {
                                return (
                                    <div className="detail-badges">
                                        {attack.platforms.map((p, i) => (
                                            <span key={i} className="badge">{p}</span>
                                        ))}
                                    </div>
                                );
                            }
                            if (typeof attack.platforms === "string" && attack.platforms.trim() !== "") {
                                return (
                                    <div className="detail-badges">
                                        {attack.platforms.split(",").map((p, i) => (
                                            <span key={i} className="badge">{p.trim()}</span>
                                        ))}
                                    </div>
                                );
                            }
                            return "N/A";
                        })()}
                    </div>
                </div>

                {/* 4. Detection */}
                <div className="detail-row">
                    <span className="detail-label">Detection</span>
                    <span className="detail-value detection-text">
                        {attack.detection || "No explicit detection rules mapped."}
                    </span>
                </div>

                {/* 5. Phases */}
                <div className="detail-row">
                    <span className="detail-label">Phases</span>
                    <div className="detail-value">
                        {(() => {
                            // Case 1: Valid array
                            if (Array.isArray(attack.phases) && attack.phases.length > 0) 
                            {
                                return (
                                    <div className="detail-badges">
                                        {attack.phases.map((phase, i) => (
                                            <span key={i} className="badge phase-badge">{phase}</span>
                                        ))}
                                    </div>
                                );
                            }
                            
                            if (typeof attack.phases === "string" && attack.phases.trim() !== "") 
                            {
                                let cleanPhases = attack.phases;
                                
                                if (cleanPhases.includes('""')) {
                                    cleanPhases = cleanPhases.replace(/""/g, '","');
                                }
                                
                                cleanPhases = cleanPhases.replace(/[\[\]"']/g, "");
                                
                                const phaseArray = cleanPhases.split(",").map(p => p.trim());
                                
                                return (
                                    <div className="detail-badges">
                                        {phaseArray.map((phase, i) => (
                                            <span key={i} className="badge phase-badge">{phase}</span>
                                        ))}
                                    </div>
                                );
                            }

                            if (attack.phase) 
                            {
                                return (
                                    <div className="detail-badges">
                                        <span className="badge phase-badge">{attack.phase}</span>
                                    </div>
                                );
                            }

                            return "N/A";
                        })()}
                    </div>
                </div>

            </div>
        </div>
    );
}