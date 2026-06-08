import { useEffect, useState, useRef } from "react";
import './App.css';
import { getAttackPatternById, getLimitedAttackPatterns, getTotalAttackPatterns } from "./communicator.js";
import AttackDetail from "./AttackDetail.jsx"; 
import ChatWindow from "./ChatWindow.jsx"; 

export default function App() 
{
    const [search, setSearch] = useState("");
    const [data, setData] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [totalPatterns, setTotalPatterns] = useState(null);
    
    const [selectedAttack, setSelectedAttack] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const [activeBotFilters, setActiveBotFilters] = useState(null);

    const LIMIT = 15;
    const stateRef = useRef({ data, loading, hasMore, activeBotFilters });
    
    useEffect(() => 
    {
        stateRef.current = { data, loading, hasMore, activeBotFilters };
    }, [data, loading, hasMore, activeBotFilters]);

    const loadInitialData = () => 
    {
        setLoading(true);
        setActiveBotFilters(null);
        
        Promise.all([
            getTotalAttackPatterns(),
            getLimitedAttackPatterns(0, LIMIT)
        ])
        .then(([count, res]) => {
            setTotalPatterns(count);
            if (res.success) {
                setData(res.data);
                setHasMore(res.hasMore);
            }
        })
        .catch(err => console.error("Initialization failed:", err))
        .finally(() => setLoading(false));
    };

    useEffect(() => 
    {
        loadInitialData();
    }, []);

    useEffect(() => 
    {
        const handleScroll = () => 
        {
            const { 
                loading: currentLoading, 
                hasMore: currentHasMore, 
                data: currentData,
                activeBotFilters: currentBotFilters 
            } = stateRef.current;
            
            if (currentLoading || !currentHasMore || search.trim() !== "" || selectedAttack || currentBotFilters) return;

            const { scrollTop, clientHeight, scrollHeight } = document.documentElement;
            if (scrollHeight - scrollTop - clientHeight < 100) {
                setLoading(true);
                getLimitedAttackPatterns(currentData.length, LIMIT)
                    .then(res => {
                        if (res.success) {
                            setData(prevData => {
                                const newItemsOnly = res.data.filter(
                                    newItem => !prevData.some(item => item.id === newItem.id)
                                );
                                return [...prevData, ...newItemsOnly];
                            });
                            setHasMore(res.hasMore);
                        }
                    })
                    .catch(err => console.error(err))
                    .finally(() => setLoading(false));
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [search, selectedAttack]);

    const handleBotFilters = (appliedFilters, filteredDataset) => 
    {
        if (filteredDataset) 
        {
            setData(filteredDataset);
            setActiveBotFilters(appliedFilters);
            setHasMore(false);
        }
    };

    async function handleCardClick(id) 
    {
        setLoadingDetails(true);
        try 
        {
            const res = await getAttackPatternById(id);
            if (res) 
            {
                setSelectedAttack(res.data || res); 
            }
        } 
        catch (error)
         {
            console.error("Error fetching attack details:", error);
        } 
        finally 
        {
            setLoadingDetails(false);
        }
    }

    const filtered = data.filter(item => {
        if (!search.trim()) return true;
        return item.description?.toLowerCase().includes(search.toLowerCase());
    });
    
    return (
        <div className="page">
            <nav className="navbar">
                <div className="logo-container" onClick={() => setSelectedAttack(null)} style={{ cursor: "pointer" }}>
                    <div className="logo-icon"><img src="public/MITRE-Icon.webp" alt="MITRE Matrix Logo" style={{ width: '40px', height: '40px', marginRight: '10px' }}/></div>
                    <span className="logo-text">MITRE Matrix</span>
                </div>
            </nav>

            {selectedAttack ? (
                <AttackDetail 
                    attack={selectedAttack} 
                    onBack={() => setSelectedAttack(null)} 
                />
            ) : (
                <div className="container">
                    <header className="header">
                        <h1 className="title">Attack Patterns Explorer</h1>
                    </header>

                    {activeBotFilters && (
                        <div className="filter-hud-banner" style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <strong>AI Filter Mode Active:</strong> Spanning options:

                                {activeBotFilters.platform?.length > 0 && (<span> [Platform: {activeBotFilters.platform.join(", ")}]</span>)}

                                {activeBotFilters.phase?.length > 0 && (<span> [Phase: {activeBotFilters.phase.join(", ")}]</span>)}

                                {activeBotFilters.name && (
                                    <span> [Name: "{activeBotFilters.name}"]</span>
                                )}

                                {activeBotFilters.detection && (
                                    <span> [Detection keyword: "{activeBotFilters.detection}"]</span>
                                )}

                                {activeBotFilters.description && (
                                    <span> [Description keyword: "{activeBotFilters.description}"]</span>
                                )}

                                {activeBotFilters.id && (
                                    <span> [Technique Code: {activeBotFilters.id}]</span>
                                )}
                            </div>
                            <button onClick={loadInitialData} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                                Clear Bot Filters
                            </button>
                        </div>
                    )}

                    <div className="search-wrapper">
                        <input
                            className="search"
                            placeholder="Filter by data in description..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            disabled={loadingDetails}
                        />
                    </div>

                    <div className="meta-count">
                        {loadingDetails ? "Loading pattern metrics..." : `Showing ${filtered.length} of ${totalPatterns ?? 0}`}
                    </div>

                    <div className="list">
                        {filtered.map(item => (
                            <div
                                key={item.id}
                                className="card"
                                onClick={() => handleCardClick(item.id)}
                                style={{ cursor: loadingDetails ? "not-allowed" : "pointer", opacity: loadingDetails ? 0.7 : 1 }}
                            >
                                <div className="title-group">
                                    <div className="card-title">{item.name}</div>
                                </div>

                                <div className="id-group">
                                    <div className="card-id">{item.id}</div>
                                </div>
                                
                                <div className="description-group">
                                    <div className="description truncate-text">{item.description}</div>
                                </div>

                                {item.platforms?.length > 0 && (
                                    <div className="platform-container">
                                        {item.platforms.map((platform, idx) => (
                                            <span key={idx} className="badge">
                                                {platform}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {loading && (
                        <div style={{ textAlign: "center", margin: "20px 0", color: "#64748b" }}>
                            Loading more patterns...
                        </div>
                    )}
                    
                    {!hasMore && !search && !activeBotFilters && (
                        <div style={{ textAlign: "center", margin: "40px 0", color: "#94a3b8" }}>
                            All attack patterns loaded.
                        </div>
                    )}
                </div>
            )}

            {/* FIXED: Hook the event handler wrapper to the Chat Window element */}
            <ChatWindow onApplyFilters={handleBotFilters} />
        </div>
    );
}