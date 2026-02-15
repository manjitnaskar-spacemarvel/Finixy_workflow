
// import React, { useState, useEffect, useRef } from "react";
// import {
//   Plus, History, Settings, Search, X, FileText,
//   ChevronRight, Pin, Edit2, Trash2, AlertTriangle, CheckCircle, Loader2,
//   PanelLeftClose, PanelLeftOpen
// } from "lucide-react";
// import { chatService } from "../services/api";
// import { useWorkflow } from "../store/WorkflowContext"; 
// import { mapBackendNodesToFrontend } from "../utils/workflowMapper";
// import { INITIAL_CHAT_MESSAGE } from "../utils/constants";

// // --- Types ---
// interface Toast {
//   id: number;
//   message: string;
//   type: "success" | "error";
// }

// interface WorkflowItem {
//   id: string;
//   title: string;
//   date: string;
//   pinned: boolean;
// }

// interface SidebarProps {
//   isChatExpanded: boolean;
//   onToggleChat: () => void;
// }

// export const Sidebar: React.FC<SidebarProps> = ({ isChatExpanded, onToggleChat }) => {
//   const { loadWorkflow, clearWorkflow, setChatHistory } = useWorkflow();
//   const [isHistoryOpen, setIsHistoryOpen] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [historyItems, setHistoryItems] = useState<WorkflowItem[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

//   // --- Modal State ---
//   const [showDeleteModal, setShowDeleteModal] = useState(false);
//   const [itemToDelete, setItemToDelete] = useState<string | null>(null);
//   const [toasts, setToasts] = useState<Toast[]>([]);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [editValue, setEditValue] = useState("");
//   const menuRef = useRef<HTMLDivElement>(null);

//   const showToast = (message: string, type: "success" | "error" = "success") => {
//     const id = Date.now();
//     setToasts((prev) => [...prev, { id, message, type }]);
//     setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
//   };

//   // 1. Fetch Workflows
//   const fetchHistory = async () => {
//     setLoading(true);
//     try {
//       const response = await chatService.getWorkflowHistory();
//       if (response.data.status === "success") {
//         const mappedData = response.data.workflows.map((wf: any) => ({
//           id: wf.id,
//           title: wf.name || wf.query || "Untitled Workflow",
//           date: new Date(wf.created_at).toLocaleDateString(undefined, {
//             month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
//           }),
//           pinned: wf.is_pinned || false,
//         }));
//         setHistoryItems(mappedData);
//       }
//     } catch (error) {
//       showToast("Failed to load history", "error");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (isHistoryOpen) fetchHistory();
//   }, [isHistoryOpen]);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
//         setActiveMenuId(null);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   //  LOAD WORKFLOW HANDLER 
//   const handleHistoryItemClick = async (id: string) => {
//     if (activeMenuId || editingId) return;

//     try {
//       showToast("Loading workflow...", "success");
//       const response = await chatService.getWorkflowDetails(id);

//       if (response.data.status === "success") {
//         const wf = response.data.workflow;
        
//         // 1. Get Raw Data
//         const rawDef = wf.workflow_definition || {};
//         const rawNodes = rawDef.nodes || wf.nodes || [];
//         const rawEdges = rawDef.edges || wf.edges || [];

//         // 2. Use Mapper (Fixes crash & content)
//         const safeNodes = mapBackendNodesToFrontend(
//            rawNodes, 
//            wf.name || "", 
//            wf.report_type || wf.type || ""
//         );

//         // 3. EDGE SANITIZATION (Fixes "Select One Selects All" bug)
//         let safeEdges: any[] = [];

//         if (rawEdges.length > 0) {
//           // If DB has edges, force UNIQUE IDs for every edge
//           safeEdges = rawEdges.map((edge: any, i: number) => ({
//             ...edge,
//             // Fallback to a unique generated ID if the stored one is missing or duplicate
//             id: (edge.id && edge.id !== "undefined") ? edge.id : `e-${edge.source}-${edge.target}-${i}-${Date.now()}`,
//             type: "custom",
//             animated: true,
//             style: { stroke: "#b1b1b7", strokeWidth: 2, ...edge.style },
//           }));
//         } else {
//           // If no edges in DB, generate linear connections
//           safeEdges = safeNodes.slice(0, -1).map((node: any, i: number) => ({
//             id: `e-${node.id}-${safeNodes[i + 1].id}`, // Guaranteed unique ID
//             source: node.id,
//             target: safeNodes[i + 1].id,
//             type: "custom",
//             animated: true,
//             style: { stroke: "#b1b1b7", strokeWidth: 2 },
//           }));
//         }

//         loadWorkflow(wf.name || wf.query || "Loaded Workflow", safeNodes, safeEdges);
//         // 5. RESTORE CHAT HISTORY
//         // This bridges the Sidebar -> ChatPanel gap
//         if (wf.query) {
//           setChatHistory([
//             { role: 'assistant', content: INITIAL_CHAT_MESSAGE },
//             { role: 'user', content: wf.query }, // The original prompt
//           ]);
//         } else {
//           setChatHistory([
//             { role: 'assistant', content: `Loaded "${wf.name}" from history.` }
//           ]);
//         }
//         setIsHistoryOpen(false);
//       }
//     } catch (error: any) {
//       console.error("Load Error:", error);
//       if (error.response?.status === 405) {
//         showToast("Backend requires restart (405)", "error");
//       } else {
//         showToast("Failed to load workflow", "error");
//       }
//     }
//   };

//   const handlePin = async (e: React.MouseEvent, id: string) => {
//       e.stopPropagation();
//       const item = historyItems.find(i => i.id === id);
//       if (!item) return;
//       try {
//         const newPinnedStatus = !item.pinned;
//         setHistoryItems(prev => prev.map(i => i.id === id ? { ...i, pinned: newPinnedStatus } : i));
//         await chatService.updateWorkflow(id, { is_pinned: newPinnedStatus });
//         showToast(newPinnedStatus ? "Workflow pinned" : "Workflow unpinned");
//       } catch (error) { showToast("Failed to pin", "error"); }
//       setActiveMenuId(null);
//   };

//   const startRename = (e: React.MouseEvent, id: string, currentTitle: string) => {
//       e.stopPropagation(); setEditingId(id); setEditValue(currentTitle); setActiveMenuId(null);
//   };

//   const saveRename = async () => {
//       if (editingId && editValue.trim()) {
//           try {
//               await chatService.updateWorkflow(editingId, { name: editValue });
//               setHistoryItems(prev => prev.map(i => i.id === editingId ? { ...i, title: editValue } : i));
//               showToast("Renamed successfully");
//           } catch { showToast("Rename failed", "error"); }
//           setEditingId(null);
//       }
//   };
  
//   const confirmDelete = (e: React.MouseEvent, id: string) => {
//       e.stopPropagation(); setItemToDelete(id); setShowDeleteModal(true); setActiveMenuId(null);
//   };

//   const executeDelete = async () => {
//       if (itemToDelete) {
//           try {
//               await chatService.deleteWorkflow(itemToDelete);
//               setHistoryItems(prev => prev.filter(i => i.id !== itemToDelete));
//               showToast("Workflow deleted");
//           } catch { showToast("Delete failed", "error"); }
//           setShowDeleteModal(false); setItemToDelete(null);
//       }
//   };

//   const toggleMenu = (e: React.MouseEvent, id: string) => {
//       e.stopPropagation(); setActiveMenuId(activeMenuId === id ? null : id);
//   };

//   const filteredHistory = historyItems
//       .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
//       .sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));

//   const handleNewChat = () => {
//     clearWorkflow();
//     setIsHistoryOpen(false);
//   };

//   return (
//     <>
//       <div className="relative w-12 bg-gray-50 flex flex-col items-center py-4 gap-4 border-r h-full z-50">
//         <button 
//           onClick={handleNewChat} 
//           className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors"
//           title="New Chat"
//         >
//           <Plus className="w-4 h-4 text-white" />
//         </button>

//         <button 
//           onClick={() => setIsHistoryOpen(!isHistoryOpen)} 
//           className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isHistoryOpen ? "bg-gray-600" : "bg-gray-400 hover:bg-gray-600"}`}
//           title="Chat History"
//         >
//           <History className="w-4 h-4 text-white" />
//         </button>

//         {/* CHAT TOGGLE BUTTON */}
//         <button 
//           onClick={onToggleChat}
//           className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isChatExpanded ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-400 hover:bg-purple-600"}`}
//           title={isChatExpanded ? "Collapse Chat" : "Expand Chat"}
//         >
//           {isChatExpanded ? (
//             <PanelLeftClose className="w-4 h-4 text-white" />
//           ) : (
//             <PanelLeftOpen className="w-4 h-4 text-white" />
//           )}
//         </button>

//         <button className="w-8 h-8 bg-gray-400 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors mt-auto">
//           <Settings className="w-4 h-4 text-white" />
//         </button>

//         {isHistoryOpen && (
//           <div className="absolute left-full top-0 h-full w-72 bg-white border-r shadow-2xl flex flex-col transition-all duration-300 ease-in-out z-40">
//             <div className="p-4 border-b bg-gray-50">
//               <div className="flex justify-between items-center mb-3">
//                 <h3 className="font-semibold text-gray-700 text-sm">Workflow History</h3>
//                 <button onClick={() => setIsHistoryOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
//               </div>
//               <div className="relative">
//                 <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
//                 <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-2 py-1.5 text-xs border rounded-md outline-none focus:ring-1 focus:ring-blue-500" />
//               </div>
//             </div>

//             <div className="flex-1 overflow-y-auto p-2 space-y-1" ref={menuRef}>
//               {loading ? (
//                 <div className="flex flex-col items-center justify-center h-32 text-gray-400"><Loader2 className="w-6 h-6 animate-spin mb-2" /><span className="text-xs">Loading...</span></div>
//               ) : filteredHistory.length === 0 ? (
//                 <div className="text-center py-8 text-gray-400 text-xs">No workflows found</div>
//               ) : (
//                 filteredHistory.map((item) => (
//                   <div key={item.id} onClick={() => handleHistoryItemClick(item.id)} className={`group relative flex items-center gap-3 p-2 hover:bg-gray-100 rounded-md cursor-pointer transition-colors ${item.pinned ? "bg-blue-50/50" : ""}`}>
//                     <div className="w-8 h-8 bg-white border text-blue-600 rounded flex items-center justify-center flex-shrink-0 shadow-sm">
//                       {item.pinned ? <Pin className="w-3.5 h-3.5 fill-current" /> : <FileText className="w-4 h-4" />}
//                     </div>
//                     <div className="flex-1 min-w-0">
//                       {editingId === item.id ? (
//                         <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} onBlur={saveRename} onKeyDown={(e) => e.key === 'Enter' && saveRename()} autoFocus className="w-full text-sm font-medium border border-blue-400 rounded px-1 py-0.5 outline-none" onClick={(e) => e.stopPropagation()} />
//                       ) : (
//                         <>
//                           <p className="text-sm font-medium text-gray-700 truncate">{item.title}</p>
//                           <p className="text-[10px] text-gray-400">{item.date}</p>
//                         </>
//                       )}
//                     </div>
//                     <button onClick={(e) => toggleMenu(e, item.id)} className="p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600"><ChevronRight className={`w-4 h-4 transition-transform ${activeMenuId === item.id ? "rotate-90" : ""}`} /></button>
//                     {activeMenuId === item.id && (
//                       <div className="absolute right-0 top-10 w-32 bg-white rounded-lg shadow-xl border z-50 py-1">
//                         <button onClick={(e) => handlePin(e, item.id)} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex gap-2"><Pin className="w-3 h-3" /> {item.pinned ? "Unpin" : "Pin"}</button>
//                         <button onClick={(e) => startRename(e, item.id, item.title)} className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex gap-2"><Edit2 className="w-3 h-3" /> Rename</button>
//                         <div className="h-px bg-gray-100 my-1"></div>
//                         <button onClick={(e) => confirmDelete(e, item.id)} className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex gap-2"><Trash2 className="w-3 h-3" /> Delete</button>
//                       </div>
//                     )}
//                   </div>
//                 ))
//               )}
//             </div>
//           </div>
//         )}
//       </div>

//       {showDeleteModal && (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
//           <div className="bg-white rounded-lg shadow-xl w-80 p-6">
//             <div className="flex flex-col items-center text-center">
//               <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-6 h-6 text-red-600" /></div>
//               <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Workflow?</h3>
//               <p className="text-sm text-gray-500 mb-6">Cannot be undone.</p>
//               <div className="flex gap-3 w-full">
//                 <button onClick={() => setShowDeleteModal(false)} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium">Cancel</button>
//                 <button onClick={executeDelete} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium">Delete</button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//       <div className="fixed bottom-4 right-4 z-[110] flex flex-col gap-2">
//         {toasts.map((toast) => (
//           <div key={toast.id} className={`flex items-center gap-3 px-4 py-3 text-white rounded-lg shadow-lg ${toast.type === "error" ? "bg-red-600" : "bg-gray-800"}`}>
//             <CheckCircle className="w-5 h-5 text-green-400" /> <span className="text-sm font-medium">{toast.message}</span>
//           </div>
//         ))}
//       </div>
//     </>
//   );
// };

import React, { useState, useEffect, useRef } from "react";
import {
  Plus, History, Settings, Search, X, FileText,
  ChevronRight, Pin, Edit2, Trash2, AlertTriangle, CheckCircle, Loader2,
  MessageSquare
} from "lucide-react";
import { chatService } from "../services/api";
import { useWorkflow } from "../store/WorkflowContext"; 
import { mapBackendNodesToFrontend } from "../utils/workflowMapper";
import { INITIAL_CHAT_MESSAGE } from "../utils/constants";

// --- Types ---
interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

interface WorkflowItem {
  id: string;
  title: string;
  date: string;
  pinned: boolean;
}

interface SidebarProps {
  isChatExpanded: boolean;
  onToggleChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isChatExpanded, onToggleChat }) => {
  const { loadWorkflow, clearWorkflow, setChatHistory } = useWorkflow();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [historyItems, setHistoryItems] = useState<WorkflowItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // --- Modal State ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  // 1. Fetch Workflows
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await chatService.getWorkflowHistory();
      if (response.data.status === "success") {
        const mappedData = response.data.workflows.map((wf: any) => ({
          id: wf.id,
          title: wf.name || wf.query || "Untitled Workflow",
          date: new Date(wf.created_at).toLocaleDateString(undefined, {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
          }),
          pinned: wf.is_pinned || false,
        }));
        setHistoryItems(mappedData);
      }
    } catch (error) {
      showToast("Failed to load history", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHistoryOpen) fetchHistory();
  }, [isHistoryOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  //  LOAD WORKFLOW HANDLER 
  const handleHistoryItemClick = async (id: string) => {
    if (activeMenuId || editingId) return;

    try {
      showToast("Loading workflow...", "success");
      const response = await chatService.getWorkflowDetails(id);

      if (response.data.status === "success") {
        const wf = response.data.workflow;
        
        const rawDef = wf.workflow_definition || {};
        const rawNodes = rawDef.nodes || wf.nodes || [];
        const rawEdges = rawDef.edges || wf.edges || [];

        const safeNodes = mapBackendNodesToFrontend(
           rawNodes, 
           wf.name || "", 
           wf.report_type || wf.type || ""
        );

        let safeEdges: any[] = [];

        if (rawEdges.length > 0) {
          safeEdges = rawEdges.map((edge: any, i: number) => ({
            ...edge,
            id: (edge.id && edge.id !== "undefined") ? edge.id : `e-${edge.source}-${edge.target}-${i}-${Date.now()}`,
            type: "custom",
            animated: true,
            style: { stroke: "#b1b1b7", strokeWidth: 2, ...edge.style },
          }));
        } else {
          safeEdges = safeNodes.slice(0, -1).map((node: any, i: number) => ({
            id: `e-${node.id}-${safeNodes[i + 1].id}`,
            source: node.id,
            target: safeNodes[i + 1].id,
            type: "custom",
            animated: true,
            style: { stroke: "#b1b1b7", strokeWidth: 2 },
          }));
        }

        loadWorkflow(wf.name || wf.query || "Loaded Workflow", safeNodes, safeEdges);
        
        if (wf.query) {
          setChatHistory([
            { role: 'assistant', content: INITIAL_CHAT_MESSAGE },
            { role: 'user', content: wf.query },
          ]);
        } else {
          setChatHistory([
            { role: 'assistant', content: `Loaded "${wf.name}" from history.` }
          ]);
        }
        setIsHistoryOpen(false);
      }
    } catch (error: any) {
      console.error("Load Error:", error);
      if (error.response?.status === 405) {
        showToast("Backend requires restart (405)", "error");
      } else {
        showToast("Failed to load workflow", "error");
      }
    }
  };

  const handlePin = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const item = historyItems.find(i => i.id === id);
      if (!item) return;
      try {
        const newPinnedStatus = !item.pinned;
        setHistoryItems(prev => prev.map(i => i.id === id ? { ...i, pinned: newPinnedStatus } : i));
        await chatService.updateWorkflow(id, { is_pinned: newPinnedStatus });
        showToast(newPinnedStatus ? "Workflow pinned" : "Workflow unpinned");
      } catch (error) { showToast("Failed to pin", "error"); }
      setActiveMenuId(null);
  };

  const startRename = (e: React.MouseEvent, id: string, currentTitle: string) => {
      e.stopPropagation(); setEditingId(id); setEditValue(currentTitle); setActiveMenuId(null);
  };

  const saveRename = async () => {
      if (editingId && editValue.trim()) {
          try {
              await chatService.updateWorkflow(editingId, { name: editValue });
              setHistoryItems(prev => prev.map(i => i.id === editingId ? { ...i, title: editValue } : i));
              showToast("Renamed successfully");
          } catch { showToast("Rename failed", "error"); }
          setEditingId(null);
      }
  };
  
  const confirmDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); setItemToDelete(id); setShowDeleteModal(true); setActiveMenuId(null);
  };

  const executeDelete = async () => {
      if (itemToDelete) {
          try {
              await chatService.deleteWorkflow(itemToDelete);
              setHistoryItems(prev => prev.filter(i => i.id !== itemToDelete));
              showToast("Workflow deleted");
          } catch { showToast("Delete failed", "error"); }
          setShowDeleteModal(false); setItemToDelete(null);
      }
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
      e.stopPropagation(); setActiveMenuId(activeMenuId === id ? null : id);
  };

  const filteredHistory = historyItems
      .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));

  const handleNewChat = () => {
    clearWorkflow();
    setIsHistoryOpen(false);
  };

  return (
    <>
      <div className="relative w-12 bg-black flex flex-col items-center py-4 gap-4 border-r border-gray-800 h-full z-50">
        {/* CHAT TOGGLE BUTTON - TOP */}
        <button 
          onClick={onToggleChat}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isChatExpanded 
              ? "bg-blue-600 hover:bg-blue-700" 
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          title={isChatExpanded ? "Collapse Chat" : "Expand Chat"}
        >
          <MessageSquare className="w-4 h-4 text-white" />
        </button>

        <button 
          onClick={handleNewChat} 
          className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
          title="New Chat"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>

        <button 
          onClick={() => setIsHistoryOpen(!isHistoryOpen)} 
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isHistoryOpen ? "bg-gray-600" : "bg-gray-700 hover:bg-gray-600"
          }`}
          title="Chat History"
        >
          <History className="w-4 h-4 text-white" />
        </button>

        <button className="w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors mt-auto">
          <Settings className="w-4 h-4 text-white" />
        </button>

        {isHistoryOpen && (
          <div className="absolute left-full top-0 h-full w-72 bg-gray-900 border-r border-gray-800 shadow-2xl flex flex-col transition-all duration-300 ease-in-out z-40">
            <div className="p-4 border-b border-gray-800 bg-black">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-300 text-sm">Workflow History</h3>
                <button onClick={() => setIsHistoryOpen(false)} className="text-gray-500 hover:text-gray-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-md outline-none focus:ring-1 focus:ring-blue-500 text-gray-300 placeholder-gray-500" 
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1" ref={menuRef}>
              {loading ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-xs">No workflows found</div>
              ) : (
                filteredHistory.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleHistoryItemClick(item.id)} 
                    className={`group relative flex items-center gap-3 p-2 hover:bg-gray-800 rounded-md cursor-pointer transition-colors ${
                      item.pinned ? "bg-gray-800/50" : ""
                    }`}
                  >
                    <div className="w-8 h-8 bg-gray-800 border border-gray-700 text-blue-400 rounded flex items-center justify-center flex-shrink-0">
                      {item.pinned ? <Pin className="w-3.5 h-3.5 fill-current" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingId === item.id ? (
                        <input 
                          type="text" 
                          value={editValue} 
                          onChange={(e) => setEditValue(e.target.value)} 
                          onBlur={saveRename} 
                          onKeyDown={(e) => e.key === 'Enter' && saveRename()} 
                          autoFocus 
                          className="w-full text-sm font-medium bg-gray-800 border border-blue-500 rounded px-1 py-0.5 outline-none text-gray-200" 
                          onClick={(e) => e.stopPropagation()} 
                        />
                      ) : (
                        <>
                          <p className="text-sm font-medium text-gray-200 truncate">{item.title}</p>
                          <p className="text-[10px] text-gray-500">{item.date}</p>
                        </>
                      )}
                    </div>
                    <button 
                      onClick={(e) => toggleMenu(e, item.id)} 
                      className="p-1 rounded-md hover:bg-gray-700 text-gray-500 hover:text-gray-300"
                    >
                      <ChevronRight className={`w-4 h-4 transition-transform ${activeMenuId === item.id ? "rotate-90" : ""}`} />
                    </button>
                    {activeMenuId === item.id && (
                      <div className="absolute right-0 top-10 w-32 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 py-1">
                        <button 
                          onClick={(e) => handlePin(e, item.id)} 
                          className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 flex gap-2"
                        >
                          <Pin className="w-3 h-3" /> {item.pinned ? "Unpin" : "Pin"}
                        </button>
                        <button 
                          onClick={(e) => startRename(e, item.id, item.title)} 
                          className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 flex gap-2"
                        >
                          <Edit2 className="w-3 h-3" /> Rename
                        </button>
                        <div className="h-px bg-gray-700 my-1"></div>
                        <button 
                          onClick={(e) => confirmDelete(e, item.id)} 
                          className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex gap-2"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-xl w-80 p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4 border border-red-500/30">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">Delete Workflow?</h3>
              <p className="text-sm text-gray-400 mb-6">Cannot be undone.</p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-md text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeDelete} 
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="fixed bottom-4 right-4 z-[110] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className={`flex items-center gap-3 px-4 py-3 text-white rounded-lg shadow-lg ${
              toast.type === "error" ? "bg-red-600" : "bg-gray-800"
            }`}
          >
            <CheckCircle className="w-5 h-5 text-green-400" /> 
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </>
  );
};