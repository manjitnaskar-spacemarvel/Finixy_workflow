// import React, { useState, useEffect, useRef } from "react";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import { Send, Loader2, Paperclip, Eye, FileText } from "lucide-react";
// import { ChatMessage } from "@/types/index";
// import { useWorkflow } from "../store/WorkflowContext";
// import { INITIAL_CHAT_MESSAGE } from "../utils/constants";
// import { chatService, documentService } from "../services/api";
// import {
//   mapBackendNodesToFrontend,
//   mapBackendEdgesToFrontend,
// } from "../utils/workflowMapper";
// import { DocumentPreviewModal } from "./DocumentPreviewModal";
// import { OriginalFilePreviewModal } from "./OriginalFilePreviewModal";

// interface ExtendedChatMessage extends ChatMessage {
//   documentId?: string;
//   fileUrl?: string;
//   fileType?: string;
//   reportUrl?: string;
//   reportFileName?: string;
// }

// interface ChatPanelProps {
//   isExpanded: boolean;
//   onSwitchToReport?: (reportUrl: string, fileName: string) => void;
// }

// export const ChatPanel: React.FC<ChatPanelProps> = ({
//   isExpanded,
//   onSwitchToReport,
// }) => {
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
//           content:
//             typeof m.content === "string" ? m.content : "Analysis complete.",
//         }));
//       }
//     } catch (e) {
//       console.error("Storage load failed:", e);
//     }
//     return [{ role: "assistant", content: INITIAL_CHAT_MESSAGE }];
//   });

//   const [parsedPreviewData, setParsedPreviewData] = useState<any>(null);
//   const [originalFileData, setOriginalFileData] = useState<{
//     url: string;
//     type: string;
//   } | null>(null);
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

//     if (
//       currentSession &&
//       currentSession !== previousSession &&
//       previousSession !== undefined
//     ) {
//       console.log("New session detected, resetting chat", {
//         currentSession,
//         previousSession,
//       });
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

//   const handleFileUpload = async (
//     event: React.ChangeEvent<HTMLInputElement>,
//   ) => {
//     const file = event.target.files?.[0];
//     if (!file) return;
//     setUploading(true);
//     setMessages((prev) => [
//       ...prev,
//       { role: "user", content: `📎 Uploading: ${file.name}` },
//     ]);

//     try {
//       const response = await documentService.upload(file);
//       console.log("Upload response:", response.data);
//       if (response.data.status === "success") {
//         const { document_id, extracted_data, file_url } = response.data;
//         const vendor = extracted_data?.vendor_name || "Detected Vendor";

//         setMessages((prev) => [
//           ...prev,
//           {
//             role: "assistant",
//             content: `✅ **Successfully Processed: ${file.name}**\n\n**Vendor:** ${vendor}\n\nItemized financial records are now ready for review.`,
//             documentId: document_id,
//             fileUrl: file_url || URL.createObjectURL(file),
//             fileType: file.type,
//           },
//         ]);
//       }
//     } catch (error) {
//       console.error("Upload error:", error);
//       setMessages((prev) => [
//         ...prev,
//         { role: "assistant", content: "❌ Error processing document." },
//       ]);
//     } finally {
//       setUploading(false);
//       if (fileInputRef.current) fileInputRef.current.value = "";
//     }
//   };

//   // src/components/ChatPanel.tsx - Update handleSend function

//   const handleSend = async () => {
//     if (!input.trim() || loading || uploading) return;
//     const query = input;
//     setInput("");
//     setMessages((prev) => [...prev, { role: "user", content: query }]);
//     setLoading(true);

//     try {
//       const response = await chatService.sendQuery(query);
//       console.log("=== WORKFLOW RESPONSE ===");
//       console.log("Full response:", response.data);

//       const { workflow, report } = response.data;

//       // Extract report URL
//       let reportDownloadUrl = null;
//       let reportFilePath = null;

//       if (report) {
//         reportDownloadUrl = report.download_url || report.downloadUrl;
//         reportFilePath = report.file_path || report.filePath;
//       }

//       if (!reportDownloadUrl && workflow?.output_file_path) {
//         reportFilePath = workflow.output_file_path;
//         const fileName = reportFilePath.split("/").pop();
//         reportDownloadUrl = `http://localhost:8000/api/v1/reports/download/${fileName}`;
//       }

//       const reportFileName = reportFilePath
//         ? reportFilePath.split("/").pop()
//         : "report.xlsx";

//       if (workflow?.nodes) {
//         const safeNodes = mapBackendNodesToFrontend(
//           workflow.nodes,
//           workflow.name || "",
//           workflow.report_type || "",
//         );

//         const mappedEdges = mapBackendEdgesToFrontend(
//           workflow.edges || [],
//           safeNodes,
//         );

//         const safeEdges = mappedEdges.filter(
//           (edge): edge is NonNullable<typeof edge> => edge !== null,
//         );

//         updateConfig({
//           ...config,
//           name: workflow.name || config.name,
//           nodes: safeNodes,
//           edges: safeEdges,
//           reportUrl: reportDownloadUrl,
//           reportFileName: reportFileName,
//         });
//       }

//       const hasReport = reportDownloadUrl && reportFilePath;

//       // ✅ FIXED: Clean message without file path
//       let assistantMessage =
//         "✅ **Workflow Created Successfully**\n\nYour workflow has been generated and is ready to execute.";

//       if (hasReport) {
//         assistantMessage = `✅ **Report Generated Successfully**\n\n📊 **AP REGISTER Report** is ready for review.\n\nClick "View Report" below or switch to the Report tab to download.`;

//         // Auto-switch to Report tab
//         setTimeout(() => {
//           if (onSwitchToReport && reportDownloadUrl) {
//             onSwitchToReport(reportDownloadUrl, reportFileName);
//           }
//         }, 1500);
//       }

//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content: assistantMessage,
//           reportUrl: reportDownloadUrl,
//           reportFileName: reportFileName,
//         },
//       ]);
//     } catch (e) {
//       console.error("Send error:", e);
//       setMessages((prev) => [
//         ...prev,
//         {
//           role: "assistant",
//           content: "⚠️ System connection error. Please try again.",
//         },
//       ]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleViewReport = (reportUrl: string, fileName: string) => {
//     if (onSwitchToReport) {
//       onSwitchToReport(reportUrl, fileName);
//     }
//   };

//   // Don't render anything when collapsed
//   if (!isExpanded) {
//     return null;
//   }

//   return (
//     <div className="h-full flex flex-col relative bg-gradient-to-br from-gray-900 via-black to-gray-900">
//       {/* CHAT MESSAGES - Full height with custom scrollbar */}
//       <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/50 backdrop-blur-sm custom-scrollbar">
//         {messages.map((msg, i) => (
//           <div
//             key={i}
//             className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-in-up`}
//             style={{
//               animationDelay: `${i * 0.1}s`,
//               animationFillMode: "both",
//             }}
//           >
//             // In ChatPanel.tsx - Update the message container div
//             <div
//               className={`max-w-[85%] rounded-2xl p-4 shadow-2xl backdrop-blur-md transition-all hover:scale-[1.02] break-words ${
//                 msg.role === "user"
//                   ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none border border-blue-500/50 shadow-blue-500/20"
//                   : "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-gray-100 rounded-bl-none"
//               }`}
//             >
//               <div className="text-sm prose prose-blue max-w-none prose-p:leading-relaxed prose-strong:text-inherit prose-invert overflow-hidden">
//                 <ReactMarkdown remarkPlugins={[remarkGfm]}>
//                   {String(msg.content)}
//                 </ReactMarkdown>
//               </div>

//               {/* Document Preview Buttons */}
//               {msg.documentId && (
//                 <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-end gap-2">
//                   {msg.fileUrl && (
//                     <button
//                       onClick={() =>
//                         handleViewOriginalFile(
//                           msg.fileUrl!,
//                           msg.fileType || "application/pdf",
//                         )
//                       }
//                       className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/30 transition-all shadow-lg hover:shadow-purple-500/20"
//                     >
//                       <FileText className="w-3.5 h-3.5" /> Preview
//                     </button>
//                   )}

//                   <button
//                     onClick={() => handleViewParsedData(msg.documentId!)}
//                     className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/30 transition-all shadow-lg hover:shadow-blue-500/20"
//                   >
//                     <Eye className="w-3.5 h-3.5" /> Parsed Preview
//                   </button>
//                 </div>
//               )}

//               {/* Report View Button */}
//               {msg.reportUrl && msg.role === "assistant" && (
//                 <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-end">
//                   <button
//                     onClick={() =>
//                       handleViewReport(
//                         msg.reportUrl!,
//                         msg.reportFileName || "report.xlsx",
//                       )
//                     }
//                     className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 text-green-400 text-sm font-bold rounded-lg border border-green-500/30 transition-all shadow-lg hover:shadow-green-500/20"
//                   >
//                     <FileText className="w-4 h-4" />
//                     View Report
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         ))}

//         {(loading || uploading || loadingPreview) && (
//           <div className="flex justify-start animate-pulse">
//             <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-4 rounded-2xl flex items-center gap-3 shadow-xl">
//               <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
//               <span className="text-sm font-medium text-gray-300">
//                 {uploading
//                   ? "Uploading..."
//                   : loading
//                     ? "Generating workflow..."
//                     : "Loading..."}
//               </span>
//             </div>
//           </div>
//         )}
//         <div ref={chatEndRef} />
//       </div>

//       {/* INPUT AREA - Two rows: input on top, buttons below */}
//       <div className="p-2 border-t border-gray-800 bg-gradient-to-r from-gray-900 to-black backdrop-blur-md">
//         <div className="flex flex-col gap-3">
//           {/* Top Row: Input Field */}
//           <input
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             onKeyPress={(e) => e.key === "Enter" && handleSend()}
//             placeholder="Type your query here..."
//             className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl outline-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-100 placeholder-gray-500 shadow-lg"
//             disabled={loading || uploading}
//           />

//           {/* Bottom Row: File Upload & Send Button */}
//           <div className="flex gap-3 items-center">
//             <input
//               type="file"
//               ref={fileInputRef}
//               onChange={handleFileUpload}
//               className="hidden"
//               accept=".pdf,.csv,.xlsx"
//             />
//             <button
//               onClick={() => fileInputRef.current?.click()}
//               disabled={uploading || loading}
//               className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-lg hover:shadow-purple-500/30 flex items-center justify-center gap-2"
//             >
//               <Paperclip className="w-4 h-4" />
//               Upload Invoice
//             </button>
//             <button
//               onClick={handleSend}
//               disabled={!input.trim() || loading || uploading}
//               className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl transition-all font-medium text-sm shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//             >
//               <Send className="w-4 h-4" />
//               {loading ? "Processing..." : "Send Query"}
//             </button>
//           </div>
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

//       {/* Add custom scrollbar styles */}
//       <style>{`
//         @keyframes slide-in-up {
//           from {
//             opacity: 0;
//             transform: translateY(20px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         .animate-slide-in-up {
//           animation: slide-in-up 0.5s ease-out;
//         }

//         .custom-scrollbar::-webkit-scrollbar {
//           width: 8px;
//         }

//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: rgba(0, 0, 0, 0.3);
//           border-radius: 4px;
//         }

//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: linear-gradient(to bottom, #3b82f6, #2563eb);
//           border-radius: 4px;
//         }

//         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//           background: linear-gradient(to bottom, #60a5fa, #3b82f6);
//         }
//       `}</style>
//     </div>
//   );
// };
// src/components/ChatPanel.tsx
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Loader2,
  Paperclip,
  Eye,
  FileText,
  Download,
} from "lucide-react";
import { ChatMessage } from "@/types/index";
import { useWorkflow } from "../store/WorkflowContext";
import { INITIAL_CHAT_MESSAGE } from "../utils/constants";
import { chatService, documentService } from "../services/api";
import {
  mapBackendNodesToFrontend,
  mapBackendEdgesToFrontend,
} from "../utils/workflowMapper";
import { DocumentPreviewModal } from "./DocumentPreviewModal";
import { OriginalFilePreviewModal } from "./OriginalFilePreviewModal";
import { generateExcelFromDocument } from "../utils/excelGenerator";

interface ExtendedChatMessage extends ChatMessage {
  documentId?: string;
  fileUrl?: string;
  fileType?: string;
  reportUrl?: string;
  reportFileName?: string;
}

interface ChatPanelProps {
  isExpanded: boolean;
  onSwitchToReport?: (reportUrl: string, fileName: string) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isExpanded,
  onSwitchToReport,
}) => {
  const {
    config,
    updateConfig,
    sessionId,
    chatHistory,
    setChatHistory,
    currentChatId,
    setCurrentChatId,
    refreshSidebar,
  } = useWorkflow();
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
          content:
            typeof m.content === "string" ? m.content : "Analysis complete.",
        }));
      }
    } catch (e) {
      console.error("Storage load failed:", e);
    }
    return [{ role: "assistant", content: INITIAL_CHAT_MESSAGE }];
  });

  const [parsedPreviewData, setParsedPreviewData] = useState<any>(null);
  const [originalFileData, setOriginalFileData] = useState<{
    url: string;
    type: string;
  } | null>(null);
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

    if (
      currentSession &&
      currentSession !== previousSession &&
      previousSession !== undefined
    ) {
      console.log("New session detected, resetting chat", {
        currentSession,
        previousSession,
      });
      setMessages([{ role: "assistant", content: INITIAL_CHAT_MESSAGE }]);
      setParsedPreviewData(null);
      setOriginalFileData(null);
      prevSessionIdRef.current = sessionId;
    }
  }, [sessionId]);

  useEffect(() => {
    if (chatHistory && chatHistory.length > 0) {
      console.log("🔍 RAW CHAT HISTORY:", JSON.stringify(chatHistory, null, 2));

      // Transform messages to include document metadata from message.metadata
      const transformedMessages = chatHistory.map((msg: any, index: number) => {
        const transformed: ExtendedChatMessage = {
          role: msg.role,
          content: msg.content,
        };

        // If message has metadata with document info, add it to the message
        if (msg.metadata) {
          console.log(`📦 Message ${index} metadata:`, msg.metadata);

          // Document ID - check multiple possible field names
          if (msg.metadata.document_id) {
            transformed.documentId = msg.metadata.document_id;
          } else if (msg.metadata.documentId) {
            transformed.documentId = msg.metadata.documentId;
          }

          // File URL - check multiple possible field names
          if (msg.metadata.file_url) {
            transformed.fileUrl = msg.metadata.file_url;
            console.log(
              `✅ Found file_url for message ${index}:`,
              msg.metadata.file_url,
            );
          } else if (msg.metadata.fileUrl) {
            transformed.fileUrl = msg.metadata.fileUrl;
            console.log(
              `✅ Found fileUrl for message ${index}:`,
              msg.metadata.fileUrl,
            );
          } else {
            console.warn(
              `⚠️ No file_url found for message ${index} with documentId:`,
              transformed.documentId,
            );
          }

          // File Type - check multiple possible field names
          if (msg.metadata.file_type) {
            transformed.fileType = msg.metadata.file_type;
          } else if (msg.metadata.fileType) {
            transformed.fileType = msg.metadata.fileType;
          }

          // Report URL - check multiple possible field names
          if (msg.metadata.report_url) {
            transformed.reportUrl = msg.metadata.report_url;
          } else if (msg.metadata.reportUrl) {
            transformed.reportUrl = msg.metadata.reportUrl;
          }

          // Report File Name - check multiple possible field names
          if (msg.metadata.report_file_name) {
            transformed.reportFileName = msg.metadata.report_file_name;
          } else if (msg.metadata.reportFileName) {
            transformed.reportFileName = msg.metadata.reportFileName;
          }

          console.log(`✅ Transformed message ${index}:`, transformed);
        }

        return transformed;
      });

      console.log("📝 FINAL transformed messages:", transformedMessages);
      setMessages(transformedMessages);
    }
  }, [chatHistory]);

  const handleViewParsedData = async (documentId: string) => {
    setLoadingPreview(true);
    try {
      console.log("📄 Fetching parsed data for document:", documentId);
      const response = await documentService.getDocument(documentId);
      console.log("📦 API Response:", response.data);

      if (response.data.status === "success" && response.data.document) {
        console.log("✅ Parsed Preview Data:", response.data.document);
        setParsedPreviewData(response.data.document);
      } else {
        console.error("❌ Invalid response format:", response.data);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ Unable to load parsed data. The document may still be processing.",
          },
        ]);
      }
    } catch (e: any) {
      console.error("❌ Error loading document:", e);
      const errorMsg = e.response?.data?.detail || e.message || "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error loading parsed data: ${errorMsg}`,
        },
      ]);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownloadExcel = async (documentId: string) => {
    setLoadingPreview(true);
    try {
      console.log("📥 Downloading Excel for document:", documentId);
      const response = await documentService.getDocument(documentId);

      if (response.data.status === "success" && response.data.document) {
        await generateExcelFromDocument(response.data.document);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "✅ Excel file downloaded successfully!",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "⚠️ Unable to generate Excel. Document data not available.",
          },
        ]);
      }
    } catch (e: any) {
      console.error("❌ Error generating Excel:", e);
      const errorMsg = e.response?.data?.detail || e.message || "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Error generating Excel: ${errorMsg}`,
        },
      ]);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleViewOriginalFile = async (
    fileUrl: string,
    fileType: string,
    documentId?: string,
  ) => {
    console.log("Opening original file:", { fileUrl, fileType, documentId });

    // If fileUrl is missing but we have documentId, fetch it from the API
    if ((!fileUrl || fileUrl === "") && documentId) {
      console.log("📥 Fetching file URL from document API for:", documentId);
      setLoadingPreview(true);
      try {
        const response = await documentService.getDocument(documentId);
        console.log("📦 Full document response:", response.data);

        if (response.data.status === "success" && response.data.document) {
          const doc = response.data.document;
          console.log("📄 Document object:", doc);

          // Check multiple possible field names for file URL
          const fetchedFileUrl =
            doc.file_url ||
            doc.fileUrl ||
            doc.s3_url ||
            doc.s3Url ||
            doc.url ||
            doc.original_file_url ||
            doc.originalFileUrl;

          const fetchedFileType =
            doc.file_type ||
            doc.fileType ||
            doc.mime_type ||
            doc.mimeType ||
            fileType ||
            "application/pdf";

          if (fetchedFileUrl) {
            console.log("✅ Fetched file URL:", fetchedFileUrl);
            console.log("✅ File type:", fetchedFileType);
            setOriginalFileData({ url: fetchedFileUrl, type: fetchedFileType });
          } else {
            // If no URL found in document, use the download endpoint
            const downloadUrl = documentService.getFileUrl(documentId);
            console.log(
              "⚠️ No file URL in document response, using download endpoint:",
              downloadUrl,
            );
            setOriginalFileData({ url: downloadUrl, type: fetchedFileType });
          }
        } else {
          console.error("❌ Invalid document response:", response.data);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "⚠️ File URL not available for this document.",
            },
          ]);
        }
      } catch (e: any) {
        console.error("❌ Error fetching file URL:", e);
        const errorMsg =
          e.response?.data?.detail || e.message || "Unknown error";
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ Error loading file: ${errorMsg}`,
          },
        ]);
      } finally {
        setLoadingPreview(false);
      }
    } else {
      setOriginalFileData({ url: fileUrl, type: fileType });
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const uploadMessage = {
      role: "user" as const,
      content: `📎 Uploading: ${file.name}`,
    };
    setMessages((prev) => [...prev, uploadMessage]);

    try {
      // Pass current chat_id to upload if available
      const response = await documentService.upload(
        file,
        currentChatId || undefined,
      );
      console.log("Upload response:", response.data);

      if (response.data.status === "success") {
        const {
          document_id,
          extracted_data,
          file_url,
          category,
          party,
          chat_id,
        } = response.data;
        const vendor =
          extracted_data?.vendor_name ||
          party?.vendor_name ||
          "Detected Vendor";

        const successMessage = {
          role: "assistant" as const,
          content: `✅ **Successfully Processed: ${file.name}**\n\n**Vendor:** ${vendor}\n**Category:** ${category || "Unknown"}\n\nItemized financial records are now ready for review.`,
          documentId: document_id,
          fileUrl: file_url || URL.createObjectURL(file),
          fileType: file.type,
        };

        setMessages((prev) => [...prev, successMessage]);

        // Update chat_id if returned from backend
        if (chat_id && !currentChatId) {
          console.log("💬 Received chat_id from file upload:", chat_id);
          setCurrentChatId(chat_id);

          // Trigger sidebar refresh to show the new chat
          setTimeout(() => {
            console.log("🔄 Triggering sidebar refresh after file upload");
            refreshSidebar();
          }, 500);
        }

        // Save messages to backend chat if chat_id exists
        const activeChatId = chat_id || currentChatId;
        if (activeChatId) {
          try {
            console.log("💾 Saving upload messages to chat:", activeChatId);

            // Save user upload message
            await chatService.addMessage(
              activeChatId,
              "user",
              uploadMessage.content,
            );

            // Save assistant success message with metadata
            await chatService.addMessage(
              activeChatId,
              "assistant",
              successMessage.content,
              {
                document_id,
                file_url,
                file_type: file.type,
                vendor,
                category,
              },
            );

            console.log("✅ Upload messages saved to chat history");
          } catch (saveError) {
            console.error("❌ Error saving messages to chat:", saveError);
          }
        } else {
          console.log(
            "⚠️ No chat_id available, messages not persisted to backend",
          );
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Error processing document." },
      ]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || uploading) return;
    const query = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setLoading(true);

    console.log("📤 Sending query with chat_id:", currentChatId);

    try {
      const response = await chatService.sendQuery(
        query,
        currentChatId || undefined,
      );
      console.log("=== WORKFLOW RESPONSE ===");
      console.log("Full response:", response.data);

      const { workflow, report, chat_id } = response.data;

      // Update chat_id if returned from backend
      if (chat_id && !currentChatId) {
        console.log("💬 Received new chat_id from backend:", chat_id);
        setCurrentChatId(chat_id);

        // Trigger sidebar refresh to show the new chat
        setTimeout(() => {
          console.log("🔄 Triggering sidebar refresh after query");
          refreshSidebar();
        }, 500);
      }

      // Extract report ID and URL
      let reportId = null;
      let reportDownloadUrl = null;
      let reportFilePath = null;

      if (report) {
        reportId = report.report_id;
        reportDownloadUrl = report.download_url || report.downloadUrl;
        reportFilePath = report.file_path || report.filePath;

        console.log("📊 Report found:");
        console.log("  - Report ID:", reportId);
        console.log("  - Download URL:", reportDownloadUrl);
        console.log("  - File Path:", reportFilePath);
      }

      if (!reportDownloadUrl && workflow?.output_file_path) {
        reportFilePath = workflow.output_file_path;
        const fileName = reportFilePath.split("/").pop();
        reportDownloadUrl = `http://localhost:8000/api/v1/reports/download/${fileName}`;
      }

      const reportFileName = reportFilePath
        ? reportFilePath.split("/").pop()
        : "report.xlsx";

      // Check if workflow exists and has nodes
      console.log("🔍 Checking workflow structure:");
      console.log("  - workflow exists:", !!workflow);
      console.log("  - workflow.nodes:", workflow?.nodes);
      console.log(
        "  - workflow.workflow_definition:",
        workflow?.workflow_definition,
      );

      if (workflow) {
        // Try to get nodes from multiple possible locations
        let rawNodes =
          workflow.nodes || workflow.workflow_definition?.nodes || [];
        let rawEdges =
          workflow.edges || workflow.workflow_definition?.edges || [];

        console.log("📦 Raw nodes:", rawNodes);
        console.log("📦 Raw edges:", rawEdges);

        if (rawNodes && rawNodes.length > 0) {
          const safeNodes = mapBackendNodesToFrontend(
            rawNodes,
            workflow.name || "",
            workflow.report_type || "",
          );

          const mappedEdges = mapBackendEdgesToFrontend(
            rawEdges || [],
            safeNodes,
          );

          const safeEdges = mappedEdges.filter(
            (edge): edge is NonNullable<typeof edge> => edge !== null,
          );

          console.log("✅ Mapped nodes:", safeNodes.length);
          console.log("✅ Mapped edges:", safeEdges.length);
          console.log("✅ Safe nodes:", safeNodes);

          updateConfig({
            ...config,
            name: workflow.name || config.name,
            nodes: safeNodes,
            edges: safeEdges,
            reportId: reportId,
            reportUrl: reportDownloadUrl,
            reportFileName: reportFileName,
          });

          console.log("💾 Config updated with workflow");
        } else {
          console.warn("⚠️ No nodes found in workflow response");
        }
      } else {
        console.warn("⚠️ No workflow in response");
      }

      const hasReport = reportDownloadUrl && reportFilePath;

      let assistantMessage =
        "✅ **Workflow Created Successfully**\n\nYour workflow has been generated and is ready to execute.";

      if (hasReport) {
        assistantMessage = `✅ **Report Generated Successfully**\n\n📊 **Report** is ready for review.\n\nSwitch to the Report tab to view the interactive dashboard.`;

        setTimeout(() => {
          if (onSwitchToReport && reportDownloadUrl) {
            onSwitchToReport(reportDownloadUrl, reportFileName);
          }
        }, 1500);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantMessage,
          reportUrl: reportDownloadUrl,
          reportFileName: reportFileName,
        },
      ]);
    } catch (e) {
      console.error("Send error:", e);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ System connection error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = (reportUrl: string, fileName: string) => {
    if (onSwitchToReport) {
      onSwitchToReport(reportUrl, fileName);
    }
  };

  if (!isExpanded) {
    return null;
  }

  return (
    <div className="h-full flex flex-col relative bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* CHAT MESSAGES - Reduced horizontal padding */}
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-4 bg-black/50 backdrop-blur-sm custom-scrollbar">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-slide-in-up`}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationFillMode: "both",
            }}
          >
            <div
              className={`max-w-[92%] rounded-2xl p-4 shadow-2xl backdrop-blur-md transition-all hover:scale-[1.02] break-words overflow-hidden ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-none border border-blue-500/50 shadow-blue-500/20"
                  : "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 text-gray-100 rounded-bl-none"
              }`}
            >
              <div className="text-sm prose prose-blue max-w-none prose-p:leading-relaxed prose-strong:text-inherit prose-invert overflow-hidden">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {String(msg.content)}
                </ReactMarkdown>
              </div>

              {msg.documentId && (
                <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-end gap-2 flex-wrap">
                  <button
                    onClick={() =>
                      handleViewOriginalFile(
                        msg.fileUrl || "",
                        msg.fileType || "application/pdf",
                        msg.documentId,
                      )
                    }
                    className="flex items-center gap-2 px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 text-xs font-bold rounded-lg border border-purple-500/30 transition-all shadow-lg hover:shadow-purple-500/20"
                  >
                    <FileText className="w-3.5 h-3.5" /> Preview
                  </button>

                  <button
                    onClick={() => handleViewParsedData(msg.documentId!)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-bold rounded-lg border border-blue-500/30 transition-all shadow-lg hover:shadow-blue-500/20"
                  >
                    <Eye className="w-3.5 h-3.5" /> Parsed Preview
                  </button>

                  <button
                    onClick={() => handleDownloadExcel(msg.documentId!)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs font-bold rounded-lg border border-green-500/30 transition-all shadow-lg hover:shadow-green-500/20"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Excel
                  </button>
                </div>
              )}

              {msg.reportUrl && msg.role === "assistant" && (
                <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-end">
                  <button
                    onClick={() =>
                      handleViewReport(
                        msg.reportUrl!,
                        msg.reportFileName || "report.xlsx",
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600/20 to-emerald-600/20 hover:from-green-600/30 hover:to-emerald-600/30 text-green-400 text-sm font-bold rounded-lg border border-green-500/30 transition-all shadow-lg hover:shadow-green-500/20"
                  >
                    <FileText className="w-4 h-4" />
                    View Report
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {(loading || uploading || loadingPreview) && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 p-4 rounded-2xl flex items-center gap-3 shadow-xl">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
              <span className="text-sm font-medium text-gray-300">
                {uploading
                  ? "Uploading..."
                  : loading
                    ? "Generating workflow..."
                    : "Loading..."}
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-3 border-t border-gray-800 bg-gradient-to-r from-gray-900 to-black backdrop-blur-md">
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your query here..."
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl outline-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-100 placeholder-gray-500 shadow-lg"
            disabled={loading || uploading}
          />

          <div className="flex gap-3 items-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.csv,.xlsx"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm shadow-lg hover:shadow-purple-500/30 flex items-center justify-center gap-2"
            >
              <Paperclip className="w-4 h-4" />
              Upload Invoice
            </button>

            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || uploading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl transition-all font-medium text-sm shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? "Processing..." : "Send Query"}
            </button>
          </div>
        </div>
      </div>

      <DocumentPreviewModal
        previewData={parsedPreviewData}
        onClose={() => setParsedPreviewData(null)}
      />

      <OriginalFilePreviewModal
        fileData={originalFileData}
        onClose={() => setOriginalFileData(null)}
      />

      <style>{`
        @keyframes slide-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-in-up {
          animation: slide-in-up 0.5s ease-out;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #2563eb);
          border-radius: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #60a5fa, #3b82f6);
        }
      `}</style>
    </div>
  );
};
