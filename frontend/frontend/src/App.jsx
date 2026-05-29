import { useEffect, useState } from "react";

export default function App() {
    const [search, setSearch] = useState("");
    const [data, setData] = useState([]);

    // Fake data for now
    useEffect(() => {
        setData([
            {
                id: "T1053.005",
                name: "Scheduled Task",
                platforms: ["Windows", "macOS", "Linux"],
            },
            {
                id: "T1205.002",
                name: "Socket Filters",
                platforms: ["Linux"]
            },
            {
                id: "T1055",
                name: "Process Injection",
                platforms: ["Windows", "macOS"]
            }
        ]);
    }, []);

    const filtered = data.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div style={styles.page}>
            <nav style={styles.navbar}>
                <div style={styles.logoContainer}>
                    <div style={styles.logoIcon}>🛡️</div>
                    <span style={styles.logoText}>MITRE Matrix</span>
                </div>
            </nav>

            <div style={styles.container}>
                <header style={styles.header}>
                    <h1 style={styles.title}>Attack Patterns Explorer</h1>
                </header>

                <div style={styles.searchWrapper}>
                    <input
                        style={styles.search}
                        placeholder="Search by name, id, platform, or description..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div style={styles.metaCount}>
                    Showing <strong>{filtered.length}</strong> of {data.length}
                </div>

                <div style={styles.list}>
                    {filtered.map(item => (
                        <div key={item.id} style={styles.card}>
                            {/* Title & Centered ID Group */}
                            <div style={styles.titleGroup}>
                                <div style={styles.cardTitle}>{item.name}</div>
                                <div style={styles.idWrapperCentered}>
                                    <span style={styles.cardMeta}>{item.id}</span>
                                </div>
                            </div>
                            
                            <div style={styles.cardDesc}>{item.description}</div>
                            
                            {/* Platform Badges Section */}
                            {item.platforms && item.platforms.length > 0 && (
                                <div style={styles.platformContainer}>
                                    {item.platforms.map((platform, idx) => (
                                        <span key={idx} style={styles.badge}>
                                            {platform}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        background: "#f8fafc", 
        color: "#0f172a",      
        minHeight: "100vh",
        paddingBottom: "40px",
        colorScheme: "light",   
    },

    navbar: {
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
        background: "#ffffff",
        padding: "16px 40px",
        borderBottom: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)"
    },

    logoContainer: {
        display: "flex",
        alignItems: "center",
        gap: "10px"
    },

    logoIcon: {
        fontSize: "20px"
    },

    logoText: {
        fontWeight: "700",
        fontSize: "18px",
        letterSpacing: "-0.5px",
        color: "#0f172a"
    },

    container: {
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "0 20px"
    },

    header: {
        textAlign: "center",
        marginTop: "48px",
        marginBottom: "32px"
    },

    title: {
        margin: 0,
        fontSize: "36px",
        fontWeight: "800",
        letterSpacing: "-0.75px",
        color: "#0f172a"
    },

    subtitle: {
        marginTop: "8px",
        fontSize: "16px",
        color: "#64748b",
        maxWidth: "600px",
        margin: "8px auto 0"
    },

    searchWrapper: {
        maxWidth: "600px",
        margin: "0 auto 16px auto"
    },

    search: {
        width: "100%",
        boxSizing: "border-box", 
        padding: "14px 18px",
        borderRadius: "12px",
        border: "1px solid #cbd5e1",
        backgroundColor: "#ffffff",
        color: "#0f172a",
        fontSize: "16px",
        outline: "none",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
    },

    metaCount: {
        textAlign: "center",
        fontSize: "13px",
        color: "#64748b",
        marginBottom: "32px"
    },

    list: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "20px"
    },

    card: {
        background: "#ffffff",
        padding: "24px",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
    },

    titleGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px"
    },

    idWrapperCentered: {
        display: "flex",
        justifyContent: "center"
    },

    cardMeta: {
        fontFamily: "monospace",
        fontSize: "13px",
        fontWeight: "600",
        color: "#2563eb", 
        background: "#eff6ff",
        padding: "4px 8px",
        borderRadius: "6px"
    },

    platformContainer: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center", /* Also centered the platform container badges to keep symmetry if desired */
        gap: "6px",
        marginTop: "auto"
    },

    badge: {
        fontSize: "11px",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        fontWeight: "700",
        color: "#475569",
        background: "#f1f5f9",
        padding: "4px 8px",
        borderRadius: "6px"
    },

    cardTitle: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#1e293b",
        lineHeight: "1.3",
        textAlign: "center" /* Center-aligns the title text */
    },

    cardDesc: {
        fontSize: "14px",
        color: "#475569",
        lineHeight: "1.5",
        textAlign: "center" /* Center-aligns the description text to match */
    }
};