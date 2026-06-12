import { useState, useEffect } from "react";
import { getAnalysisJobs, uploadFileForAnalysis } from "./communicator.js";
import AnalysisDetails from "./AnalysisDetails.jsx";
import "./Analysis.css";

export default function Analysis({ onAttackPatternSelect }) 
{
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("All");

    const [selectedJobId, setSelectedJobId] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);

    const normalizeJobs = (res) =>
    {
        const data = res?.data ?? res;

        if (Array.isArray(data)) return data;
        if (data) return [data];
        return [];
    };

    const loadJobs = async () =>
    {
        try
        {
            const res = await getAnalysisJobs();
            const jobs = normalizeJobs(res);
            setSubmissions(jobs);
        }
        catch (err)
        {
            console.error("Failed to load jobs:", err);
            setSubmissions([]);
        }
    };

    useEffect(() =>
    {
        let isMounted = true;

        setLoading(true);

        loadJobs().finally(() =>
        {
            if (isMounted) setLoading(false);
        });

        return () =>
        {
            isMounted = false;
        };
    }, []);

    const handleFileSelect = (e) =>
    {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
    };

    const handleRunAnalysis = async () =>
    {
        if (!selectedFile)
        {
            alert("Please select a file first.");
            return;
        }

        try
        {
            const result = await uploadFileForAnalysis(selectedFile);

            if (!result?.success)
            {
                throw new Error("Upload failed");
            }

            alert("File submitted successfully!");

            setSelectedFile(null);

            await loadJobs();
        }
        catch (err)
        {
            console.error("Upload failed:", err);
            alert("Failed to upload file.");
        }
    };

    const filteredSubmissions = (Array.isArray(submissions) ? submissions : [])
        .filter(Boolean)
        .filter((sub) =>
        {
            if (filterStatus === "All") return true;
            return (sub.status || "").toLowerCase() === filterStatus.toLowerCase();
        });

    if (selectedJobId)
    {
        return (
            <AnalysisDetails
                jobId={selectedJobId}
                onBack={() => setSelectedJobId(null)}
                onAttackPatternSelect={onAttackPatternSelect}
            />
        );
    }

    return (
        <div className="analysis-container">

            <section className="upload-section">
                <h3>Submit New File for Sandbox Analysis</h3>

                <div className="upload-controls">

                    <div className="file-input-wrapper">

                        <input
                            type="file"
                            id="sandbox-file"
                            onChange={handleFileSelect}
                            style={{ display: "none" }}
                        />

                        <input
                            type="text"
                            readOnly
                            value={selectedFile?.name || ""}
                            placeholder="Select a file..."
                            className="file-path-input"
                        />

                        <label htmlFor="sandbox-file" className="browse-btn">
                            Browse
                        </label>

                    </div>

                    <button
                        className={`submit-analysis-btn ${selectedFile ? "ready" : ""}`}
                        onClick={handleRunAnalysis}
                        disabled={!selectedFile}
                    >
                        Run Analysis
                    </button>

                </div>

                <small className="upload-hint">
                    Upload safely isolated binaries to execute sandbox behaviors.
                </small>
            </section>

            {/* Header */}
            <header className="analysis-header">

                <div className="title-area">
                    <h2>Analysis Queue</h2>
                    <p>Track sandbox tasks and file scanning reports</p>
                </div>

                <div className="filter-controls">

                    <label>Status:</label>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        disabled={loading}
                    >
                        <option value="All">All Submissions</option>
                        <option value="Analyzing">Analyzing</option>
                        <option value="Completed">Completed</option>
                        <option value="Failed">Failed</option>
                    </select>

                </div>

            </header>

            {/* Table */}
            <div className="table-wrapper">

                <table className="submissions-table">

                    <thead>
                        <tr>
                            <th>Submission Name</th>
                            <th>Job ID</th>
                            <th>Platform</th>
                            <th>Status</th>
                            <th>Threat Level</th>
                        </tr>
                    </thead>

                    <tbody>

                        {loading ? (
                            <tr>
                                <td colSpan="5" className="empty-state">
                                    Loading active sandbox jobs...
                                </td>
                            </tr>
                        ) : filteredSubmissions.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="empty-state">
                                    No submissions found.
                                </td>
                            </tr>
                        ) : (
                            filteredSubmissions.map((sub) =>
                            {
                                if (!sub) return null;

                                const currentId = sub.id || sub.jobId;
                                const isAnalyzing =
                                    (sub.status || "").toLowerCase() === "analyzing";

                                return (
                                    <tr
                                        key={currentId}
                                        onClick={() =>
                                        {
                                            if (isAnalyzing) return;
                                            setSelectedJobId(currentId);
                                        }}
                                        className={`clickable-row ${isAnalyzing ? "disabled-row" : ""}`}
                                    >
                                        <td className="file-name-cell">
                                            {sub.name || sub.filename || "unknown_file"}
                                        </td>

                                        <td>
                                            <code>{currentId}</code>
                                        </td>

                                        <td>{sub.platform || "Unknown"}</td>

                                        <td>
                                            <span className={`status-badge ${(sub.status || "").toLowerCase()}`}>
                                                {sub.status || "Unknown"}
                                            </span>
                                        </td>

                                        <td>
                                            <span className={`threat-badge level-${sub.threat_level || 0}`}>
                                                {sub.threat_level || 0}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}