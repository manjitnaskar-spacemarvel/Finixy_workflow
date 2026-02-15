// import React, { useState, useEffect, useRef } from "react";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import { 
//   Send, Loader2, Paperclip, Eye, FileText
// } from "lucide-react";
// import { ChatMessage } from "@/types/index";
// import { useWorkflow } from "../store/WorkflowContext"; 
// import { INITIAL_CHAT_MESSAGE } from "../utils/constants";
// import { chatService, documentService } from "../services/api";
// import { mapBackendNodesToFrontend } from "../utils/workflowMapper";
// import { DocumentPreviewModal } from "./DocumentPreviewModal";
// import { OriginalFilePreviewModal } from "./OriginalFilePreviewModal";

// interface ExtendedChatMessage extends ChatMessage {
//   documentId?: string;
//   fileUrl?: string;
//   fileType?: string;
// }

// interface ChatPanelProps {
//   isExpanded: boolean;
// }

// export const ChatPanel: React.FC<ChatPanelProps> = ({ isExpanded }) => {
//   const { config, updateConfig, sessionId, chatHistory } = useWorkflow();
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [uploading, setUploading] = useState(false);
  
//   const [messages, setMessages] = useState<ExtendedChatMessage[]>(() => {
//     try {
//       const saved = sessionStorage.getItem("finixy_chat_messages");
//       if (saved) {
//         const parsed = JSON.parse(saved);
//         return parsed.map((m: any) => ({
//           ...m,
//           content: typeof m.content === 'string' ? m.content : "Analysis complete."
//         }));
//       }
//     } catch (e) {
//       console.error("Storage load failed:", e);
//     }
//     return [{ role: "assistant", content: INITIAL_CHAT_MESSAGE }];
//   });
  
//   const [parsedPreviewData, setParsedPreviewData] = useState<any>(null);
//   const [originalFileData, setOriginalFileData] = useState<{ url: string; type: string } | null>(null);
//   const [loadingPreview, setLoadingPreview] = useState(false);

//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const chatEndRef = useRef<HTMLDivElement>(null);
//   const prevSessionIdRef = useRef<string | number | null>(sessionId);

//   useEffect(() => {
//     sessionStorage.setItem("finixy_chat_messages", JSON.stringify(messages));
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages, loading, uploading]);

//   useEffect(() => {
//     const currentSession = sessionId?.toString();
//     const previousSession = prevSessionIdRef.current?.toString();
    
//     if (currentSession && currentSession !== previousSession && previousSession !== undefined) {
//       console.log("New session detected, resetting chat", { currentSession, previousSession });
//       setMessages([{ role: "assistant", content: INITIAL_CHAT_MESSAGE }]);
//       setParsedPreviewData(null);
//       setOriginalFileData(null);
//       prevSessionIdRef.current = sessionId;
//     }
//   }, [sessionId]);

//   useEffect(() => {
//     if (chatHistory && chatHistory.length > 0) {
//       setMessages(chatHistory);
//     }
//   }, [chatHistory]);

//   const handleViewParsedData = async (documentId: string) => {
//     setLoadingPreview(true);
//     try {
//       const response = await documentService.getDocument(documentId);
//       console.log("API Response:", response.data);
//       if (response.data.status === "success") {
//         console.log("Parsed Preview Data:", response.data.document);
//         setParsedPreviewData(response.data.document);
//       }
//     } catch (e) {
//       console.error("Error loading document:", e);
//       alert("Error loading parsed data.");
//     } finally {
//       setLoadingPreview(false);
//     }
//   };

//   const handleViewOriginalFile = (fileUrl: string, fileType: string) => {
//     console.log("Opening original file:", { fileUrl, fileType });
//     setOriginalFileData({ url: fileUrl, type: fileType });
//   };

//   const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;
//     setUploading(true);
//     setMessages(prev => [...prev, { role: "user", content: `📎 Uploading: ${file.name}` }]);

//     try {
//       const response = await documentService.upload(file);
//       console.log("Upload response:", response.data);
//       if (response.data.status === "success") {
//         const { document_id, extracted_data, file_url } = response.data;
//         const vendor = extracted_data?.vendor_name || "Detected Vendor";
        
//         setMessages(prev => [...prev, { 
//           role: "assistant", 
//           content: `✅ **Successfully Processed: ${file.name}**\n\n**Vendor:** ${vendor}\n\nItemized financial records are now ready for review.`,
//           documentId: document_id,
//           fileUrl: file_url || URL.createObjectURL(file),
//           fileType: file.type
//         }]);
//       }
//     } catch (error) {
//       console.error("Upload error:", error);
//       setMessages(prev => [...prev, { role: "assistant", content: "❌ Error processing document." }]);
//     } finally {
//       setUploading(false);
//       if (fileInputRef.current) fileInputRef.current.value = "";
//     }
//   };

//   const handleSend = async () => {
//     if (!input.trim() || loading || uploading) return;
//     const query = input;
//     setInput("");
//     setMessages(prev => [...prev, { role: "user", content: query }]);
//     setLoading(true);
//     try {
//       const response = await chatService.sendQuery(query);
//       console.log("Chat response:", response.data);
//       const { workflow } = response.data;
//       if (workflow?.nodes) {
//         const safeNodes = mapBackendNodesToFrontend(workflow.nodes, workflow.name || "", workflow.report_type || "");
//         updateConfig({ ...config, nodes: safeNodes });
//       }
//       setMessages(prev => [...prev, { role: "assistant", content: "AI has updated your workflow based on your request." }]);
//     } catch (e) {
//       console.error("Send error:", e);
//       setMessages(prev => [...prev, { role: "assistant", content: "⚠️ System connection error." }]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Don't render anything when collapsed
//   if (!isExpanded) {
//     return null;
//   }

//   return (
//     <div className="h-full flex flex-col relative bg-black">
//       {/* HEADER */}
//       <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black">
//         <h2 className="text-lg font-bold text-gray-100">Finixy Workflow Assistant</h2>
//       </div>
      
//       {/* CHAT MESSAGES */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">    
//         {messages.map((msg, i) => (
//           <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
//             <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
//               msg.role === "user" 
//                 ? "bg-blue-600 text-white rounded-br-none" 
//                 : "bg-gray-900 border border-gray-800 text-gray-200 rounded-bl-none"
//             }`}>
//               <div className="text-sm prose prose-blue max-w-none prose-p:leading-relaxed prose-strong:text-inherit prose-invert">
//                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                   {String(msg.content)}
//                 </ReactMarkdown>
//               </div>

//               {msg.documentId && (
//                 <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end gap-2">
//                   {msg.fileUrl && (
//                     <button 
//                       onClick={() => handleViewOriginalFile(msg.fileUrl!, msg.fileType || 'application/pdf')} 
//                       className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-xs font-bold rounded-lg border border-purple-600/30 transition-all shadow-sm"
//                     >
//                       <FileText className="w-3.5 h-3.5" /> Preview
//                     </button>
//                   )}
                  
//                   <button 
//                     onClick={() => handleViewParsedData(msg.documentId!)} 
//                     className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold rounded-lg border border-blue-600/30 transition-all shadow-sm"
//                   >
//                     <Eye className="w-3.5 h-3.5" /> Parsed Preview
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         ))}
//         {(loading || uploading || loadingPreview) && (
//           <div className="flex justify-start animate-pulse">
//             <div className="bg-gray-900 border border-gray-800 p-3 rounded-2xl flex items-center gap-3">
//               <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
//               <span className="text-sm font-medium text-gray-400">Working...</span>
//             </div>
//           </div>
//         )}
//         <div ref={chatEndRef} /> 
//       </div>

//       {/* INPUT AREA */}
//       <div className="p-4 border-t border-gray-800 bg-black">
//         <div className="flex gap-2 items-center">
//           <input 
//             type="file" 
//             ref={fileInputRef} 
//             onChange={handleFileUpload} 
//             className="hidden" 
//             accept=".pdf,.csv,.xlsx" 
//           />
//           <button 
//             onClick={() => fileInputRef.current?.click()} 
//             disabled={uploading} 
//             className="p-2.5 text-gray-500 hover:text-blue-400 hover:bg-gray-900 rounded-xl transition-all disabled:opacity-50"
//           >
//             <Paperclip className="w-5 h-5" />
//           </button>
//           <input 
//             type="text" 
//             value={input} 
//             onChange={(e) => setInput(e.target.value)} 
//             onKeyPress={(e) => e.key === "Enter" && handleSend()} 
//             placeholder="Upload an invoice or type a query..." 
//             className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl outline-none text-sm focus:ring-2 focus:ring-blue-600 transition-all text-gray-200 placeholder-gray-500" 
//           />
//           <button 
//             onClick={handleSend} 
//             disabled={!input.trim() || loading || uploading} 
//             className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <Send className="w-4 h-4" />
//           </button>
//         </div>
//       </div>

//       {/* PARSED DATA MODAL */}
//       <DocumentPreviewModal 
//         previewData={parsedPreviewData}
//         onClose={() => setParsedPreviewData(null)}
//       />

//       {/* ORIGINAL FILE MODAL */}
//       <OriginalFilePreviewModal 
//         fileData={originalFileData}
//         onClose={() => setOriginalFileData(null)}
//       />
//     </div>
//   );
// };
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  Send, Loader2, Paperclip, Eye, FileText
} from "lucide-react";
import { ChatMessage } from "@/types/index";
import { useWorkflow } from "../store/WorkflowContext"; 
import { INITIAL_CHAT_MESSAGE } from "../utils/constants";
import { chatService, documentService } from "../services/api";
import { mapBackendNodesToFrontend, mapBackendEdgesToFrontend } from "../utils/workflowMapper";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { OriginalFilePreviewModal } from "./OriginalFilePreviewModal";

interface ExtendedChatMessage extends ChatMessage {
  documentId?: string;
  fileUrl?: string;
  fileType?: string;
}

interface ChatPanelProps {
  isExpanded: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ isExpanded }) => {
  const { config, updateConfig, sessionId, chatHistory } = useWorkflow();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [messages, setMessages] = useState<ExtendedChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem("finixy_chat_messages");
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          content: typeof m.content === 'string' ? m.content : "Analysis complete."
        }));
      }
    } catch (e) {
      console.error("Storage load failed:", e);
    }
    return [{ role: "assistant", content: INITIAL_CHAT_MESSAGE }];
  });
  
  const [parsedPreviewData, setParsedPreviewData] = useState<any>(null);
  const [originalFileData, setOriginalFileData] = useState<{ url: string; type: string } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const prevSessionIdRef = useRef<string | number | null>(sessionId);

  useEffect(() => {
    sessionStorage.setItem("finixy_chat_messages", JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, uploading]);

  useEffect(() => {
    const currentSession = sessionId?.toString();
    const previousSession = prevSessionIdRef.current?.toString();
    
    if (currentSession && currentSession !== previousSession && previousSession !== undefined) {
      console.log("New session detected, resetting chat", { currentSession, previousSession });
      setMessages([{ role: "assistant", content: INITIAL_CHAT_MESSAGE }]);
      setParsedPreviewData(null);
      setOriginalFileData(null);
      prevSessionIdRef.current = sessionId;
    }
  }, [sessionId]);

  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      setMessages(chatHistory);
    }
  }, [chatHistory]);

  const handleViewParsedData = async (documentId: string) => {
    setLoadingPreview(true);
    try {
      const response = await documentService.getDocument(documentId);
      console.log("API Response:", response.data);
      if (response.data.status === "success") {
        console.log("Parsed Preview Data:", response.data.document);
        setParsedPreviewData(response.data.document);
      }
    } catch (e) {
      console.error("Error loading document:", e);
      alert("Error loading parsed data.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleViewOriginalFile = (fileUrl: string, fileType: string) => {
    console.log("Opening original file:", { fileUrl, fileType });
    setOriginalFileData({ url: fileUrl, type: fileType });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMessages(prev => [...prev, { role: "user", content: `📎 Uploading: ${file.name}` }]);

    try {
      const response = await documentService.upload(file);
      console.log("Upload response:", response.data);
      if (response.data.status === "success") {
        const { document_id, extracted_data, file_url } = response.data;
        const vendor = extracted_data?.vendor_name || "Detected Vendor";
        
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: `✅ **Successfully Processed: ${file.name}**\n\n**Vendor:** ${vendor}\n\nItemized financial records are now ready for review.`,
          documentId: document_id,
          fileUrl: file_url || URL.createObjectURL(file),
          fileType: file.type
        }]);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "❌ Error processing document." }]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ✅ FIXED: Now generates edges and updates config properly
  const handleSend = async () => {
    if (!input.trim() || loading || uploading) return;
    const query = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: query }]);
    setLoading(true);
    
    try {
      const response = await chatService.sendQuery(query);
      console.log("=== WORKFLOW RESPONSE ===");
      console.log("Full response:", response.data);
      
      const { workflow } = response.data;
      
      if (workflow?.nodes) {
        // 1. Map nodes from backend
        const safeNodes = mapBackendNodesToFrontend(
          workflow.nodes, 
          workflow.name || "", 
          workflow.report_type || ""
        );

        console.log("Mapped nodes:", safeNodes);
        console.log("Node count:", safeNodes.length);

        // 2. Generate edges (connections between nodes)
        const safeEdges = mapBackendEdgesToFrontend(
          workflow.edges || [],
          safeNodes
        );

        console.log("Generated edges:", safeEdges);
        console.log("Edge count:", safeEdges.length);

        // 3. ✅ CRITICAL: Update config with BOTH nodes AND edges
        updateConfig({ 
          ...config, 
          name: workflow.name || config.name,
          nodes: safeNodes,
          edges: safeEdges  // This was missing!
        });

        console.log("=== CONFIG UPDATED ===");
        console.log("Nodes:", safeNodes.length);
        console.log("Edges:", safeEdges.length);
      }
      
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "AI has updated your workflow based on your request." 
      }]);
    } catch (e) {
      console.error("Send error:", e);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "⚠️ System connection error." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything when collapsed
  if (!isExpanded) {
    return null;
  }

  return (
    <div className="h-full flex flex-col relative bg-black">
      {/* HEADER */}
      <div className="p-4 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black">
        <h2 className="text-lg font-bold text-gray-100">Finixy Workflow Assistant</h2>
      </div>
      
      {/* CHAT MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">    
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              msg.role === "user" 
                ? "bg-blue-600 text-white rounded-br-none" 
                : "bg-gray-900 border border-gray-800 text-gray-200 rounded-bl-none"
            }`}>
              <div className="text-sm prose prose-blue max-w-none prose-p:leading-relaxed prose-strong:text-inherit prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {String(msg.content)}
                </ReactMarkdown>
              </div>

              {msg.documentId && (
                <div className="mt-4 pt-3 border-t border-gray-800 flex justify-end gap-2">
                  {msg.fileUrl && (
                    <button 
                      onClick={() => handleViewOriginalFile(msg.fileUrl!, msg.fileType || 'application/pdf')} 
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-xs font-bold rounded-lg border border-purple-600/30 transition-all shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5" /> Preview
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleViewParsedData(msg.documentId!)} 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold rounded-lg border border-blue-600/30 transition-all shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" /> Parsed Preview
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {(loading || uploading || loadingPreview) && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-gray-900 border border-gray-800 p-3 rounded-2xl flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              <span className="text-sm font-medium text-gray-400">Working...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} /> 
      </div>

      {/* INPUT AREA */}
      <div className="p-4 border-t border-gray-800 bg-black">
        <div className="flex gap-2 items-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".pdf,.csv,.xlsx" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading} 
            className="p-2.5 text-gray-500 hover:text-blue-400 hover:bg-gray-900 rounded-xl transition-all disabled:opacity-50"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            value={input} 
            onChange={(e) => setInput(e.target.value)} 
            onKeyPress={(e) => e.key === "Enter" && handleSend()} 
            placeholder="Upload an invoice or type a query..." 
            className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl outline-none text-sm focus:ring-2 focus:ring-blue-600 transition-all text-gray-200 placeholder-gray-500" 
          />
          <button 
            onClick={handleSend} 
            disabled={!input.trim() || loading || uploading} 
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PARSED DATA MODAL */}
      <DocumentPreviewModal 
        previewData={parsedPreviewData}
        onClose={() => setParsedPreviewData(null)}
      />

      {/* ORIGINAL FILE MODAL */}
      <OriginalFilePreviewModal 
        fileData={originalFileData}
        onClose={() => setOriginalFileData(null)}
      />
    </div>
  );
};