import { useState, useEffect } from "react";
import { getAnalysisDetails, uploadFileForAnalysis } from "./communicator.js"; // Import your new skeleton function
import "./AnalysisDetails.css";

export default function AnalysisDetails({ jobId, onBack, onAttackPatternSelect }) {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        getAnalysisDetails(jobId)
            .then((res) => {
                if (!isMounted) return;
                
                console.log("1. Raw API Response Object:", res);
                if (res && res.success && res.data) {
                    console.log("Full API Response received by React:", res);
                    console.log("Extracted report data:", res.data);
                    setReport(res.data);
                }
            })
            .catch((err) => console.error("Error loading analysis dashboard report:", err))
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => { isMounted = false; };
    }, [jobId]);

    if (loading) {
        return (
            <div className="analysis-page-wrapper loading-center">
                <div className="details-action-bar">
                    <button onClick={onBack} className="back-queue-btn">← Back to Queue</button>
                </div>
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#666" }}>
                    <h3>Fetching execution report matrices...</h3>
                    <p style={{ fontSize: "14px", opacity: 0.7 }}>Parsing virtual machine sandbox trace artifacts...</p>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="analysis-page-wrapper">
                <button onClick={onBack} className="back-queue-btn">← Back to Queue</button>
                <div style={{ textAlign: "center", padding: "40px", color: "red" }}>Failed to mount job record profile details.</div>
            </div>
        );
    }

    return (
        <div className="analysis-page-wrapper">
            <div className="details-action-bar">
                <button onClick={onBack} className="back-queue-btn">
                    <span>←</span> Back to Queue
                </button>
                <div className="job-badge-pill">
                    Job ID: <code>{report.jobId || "N/A"}</code>
                </div>
            </div>

            <div className="file-title-banner">
                <div>
                    <h1>{report.filename}</h1>
                </div>
            </div>

            <div className="details-main-container">
                <div className="summary-cards-grid">
                    <div className="profile-summary-card">
                        <h3>Static Metadata</h3>
                        <div className="metadata-list">
                            <div><span>Format:</span> <code>{report.metadata?.format}</code></div>
                            <div><span>Size:</span> <code>{report.metadata?.size}</code></div>
                            <div><span>SHA256:</span> <code className="truncate-hash">{report.metadata?.sha256}</code></div>
                        </div>
                    </div>

                    <div className="profile-summary-card">
                        <h3>Heuristic Analysis</h3>
                        <div className={`verdict-status-block ${report.heuristic?.verdictClass}`}>
                            <span className="verdict-indicator-dot"></span>
                            <span className="verdict-text-label">
                                {report.heuristic?.label} (Level: {report.threat_level})
                            </span>
                        </div>
                        <p className="verdict-summary-notes">{report.heuristic?.notes}</p>
                    </div>
                </div>

                <div className="main-details-grid">
                    <div className="left-behavior-panel">
                        <section className="dashboard-card">
                            <h2>Dynamic Behavior Log</h2>
                            <div className="timeline-container">
                                {report.behaviorLog?.map((log, index) => (
                                    <div key={index} className={`timeline-row ${log.type !== 'normal' ? log.type : ''}`}>
                                        <div className="timeline-body">
                                            <h4>{log.title}</h4>
                                            <p>{log.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="split-artifacts-box">
                            <div className="artifact-subcard">
                                <div className="card-header-icon">Network Connections</div>
                                <ul className="artifact-items-list">
                                    {report.networkConnections?.map((conn, index) => (
                                        <li key={index}>
                                            <code>{conn.target}</code> → <span className={conn.badgeClass}>{conn.label}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="artifact-subcard">
                                <div className="card-header-icon">File Mutations</div>
                                <ul className="artifact-items-list">
                                    {report.fileMutations?.map((mutation, index) => (
                                        <li key={index}>
                                            <span className={mutation.badgeClass}>{mutation.action}</span> <code>{mutation.path}</code>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <aside className="right-tactics-panel">
                        <h2>Identified MITRE Techniques</h2>
                        <p className="side-panel-desc">Framework capabilities triggered during sandbox detonation.</p>

                        <div className="tactics-scroll-stack">
                            {report.attackPatterns?.map((item) => (
                                <div 
                                    key={item.id} 
                                    className="mitre-side-card"
                                    onClick={() => onAttackPatternSelect && onAttackPatternSelect(item.id)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="mitre-card-header">
                                        <span className="mitre-name">{item.name}</span>
                                        <span className="mitre-id">{item.id}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}