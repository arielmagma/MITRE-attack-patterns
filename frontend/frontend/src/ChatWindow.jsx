import { useState } from "react";
import "./ChatWindow.css";
import { askFilterAssistant, uploadFileForAnalysis } from "./communicator.js";

export default function ChatWindow({ onApplyFilters, onOpenAnalysis }) 
{
    const [isMinimized, setIsMinimized] = useState(true);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);

    const toggleMinimize = () => {
        setIsMinimized(!isMinimized);
    };

    const handleFileUpload = async () =>
    {
        return new Promise((resolve, reject) =>
        {
            const input = document.createElement("input");
            input.type = "file";

            input.onchange = async () =>
            {
                const file = input.files?.[0];

                if (!file)
                    return reject("No file selected");

                setMessages(prev => [
                    ...prev,
                    {
                        role: "user",
                        content: `Uploaded file: ${file.name}`
                    }
                ]);

                try
                {
                    const result = await uploadFileForAnalysis(file);
                    resolve(result);
                }
                catch (err)
                {
                    reject(err);
                }
            };

            input.click();
        });
    };

    const handleSendMessage = async (e) => 
    {
        e.preventDefault();
        if (!inputValue.trim() || loading) return;

        const userText = inputValue.trim();
        setInputValue("");
        setLoading(true);

        const newUserMessage = { role: "user", content: userText };

        const updatedHistory = [...messages, newUserMessage];
        
        setMessages(updatedHistory);

        const responseData = await askFilterAssistant(updatedHistory);

        setMessages(prev => [...prev, 
        { 
            role: "assistant", 
            content: responseData.message 
        }]);

        if (responseData.type === "filter_action" && responseData.filters) 
        {
            if (typeof onApplyFilters === "function") 
            {
                onApplyFilters(responseData.filters, responseData.data || null);
            }
        }

        if (responseData.type === "sandbox_upload_request") 
        {
            const result = await handleFileUpload();

            if (result?.success)
            {
                setMessages(prev => [...prev,
                {
                    role: "assistant",
                    content: `Upload complete.\nJob ID: ${result.data?.job_id}`
                }]);
            }
        }

        if (responseData.type === "open_analysis_review")
        {
            onOpenAnalysis?.(responseData.data);
        }
    

        setLoading(false);
    };

    return (
        <div className={`chat-window ${isMinimized ? "minimized" : ""}`}>
            <div className="chat-header">
                <h3 className="chat-title">Pattern Filter Bot</h3>
                <div className="chat-controls">
                    <button 
                        className="chat-btn minimize-btn" 
                        onClick={toggleMinimize}
                        title={isMinimized ? "Restore" : "Minimize"}
                    >
                        {isMinimized ? "▴" : "▾"}
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div className="chat-body">
                    <div className="chat-messages">
                        {messages.length === 0 ? 
                        (
                            <div className="chat-empty-state">
                                <p>Ask me to adjust filters. For example:</p>
                                <small>"Show me attack patterns targeting Linux systems"</small>
                            </div>
                        ) : (
                            messages.map((msg, idx) => 
                            (
                                <div key={idx} className={`message ${msg.role === "user" ? "user" : "ai"}`}>
                                    <div className="message-content">{msg.content}</div>
                                </div>
                            ))
                        )}
                        {loading && (
                            <div className="message ai loading-pulse">
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!isMinimized && (
                <div className="chat-footer">
                    <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "8px", width: "100%" }}>
                        <input 
                            type="text" 
                            className="chat-input" 
                            placeholder="Ask me to filter patterns..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={loading}
                        />
                        <button 
                            className="chat-send-btn" 
                            type="submit"
                            disabled={loading || !inputValue.trim()}
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}