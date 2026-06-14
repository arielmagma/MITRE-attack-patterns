import React from "react";
import "./AttackDetail.css";

export default function AttackDetail({ attack, onBack }) 
{
    if (!attack) return null;

    return (
        <div className="detail-container">
            <button className="back-btn" onClick={onBack}>
                ← Back to List
            </button>

            <header className="detail-header">
                <h1 className="detail-title">{attack.name}</h1>
            </header>

            <div className="detail-list-box">
                
                <div className="detail-row">
                    <span className="detail-label">Attack Pattern ID</span>
                    <div>
                        <span className="detail-value mono">{attack.id}</span>
                    </div>
                </div>
                
                <div className="detail-row">
                    <span className="detail-label">Description</span>
                    <div className="detail-value">
                        {attack.description || "No description provided."}
                    </div>
                </div>

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
                            return <span className="text-muted">N/A</span>;
                        })()}
                    </div>
                </div>

                <div className="detail-row">
                    <span className="detail-label">Detection</span>
                    <div className="detail-value detection-text">
                        {attack.detection || "No explicit detection rules mapped."}
                    </div>
                </div>
                
                <div className="detail-row">
                    <span className="detail-label">Phases</span>
                    <div className="detail-value">
                        {(() => {
                            if (Array.isArray(attack.phases) && attack.phases.length > 0) {
                                return (
                                    <div className="detail-badges">
                                        {attack.phases.map((phase, i) => (
                                            <span key={i} className="badge phase-badge">{phase}</span>
                                        ))}
                                    </div>
                                );
                            }
                            
                            if (typeof attack.phases === "string" && attack.phases.trim() !== "") {
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

                            if (attack.phase) {
                                return (
                                    <div className="detail-badges">
                                        <span className="badge phase-badge">{attack.phase}</span>
                                    </div>
                                );
                            }

                            return <span className="text-muted">N/A</span>;
                        })()}
                    </div>
                </div>

            </div>
        </div>
    );
}