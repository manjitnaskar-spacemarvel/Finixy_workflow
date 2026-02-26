import React, { useState, useEffect } from 'react';
import { Download, FileText, Loader2, AlertCircle, ExternalLink, ArrowLeft, Table } from 'lucide-react';
import { useWorkflow } from '../store/WorkflowContext';

// Lazy load XLSX
let XLSX: any = null;

const loadXLSX = async () => {
  if (!XLSX) {
    try {
      XLSX = await import('xlsx');
    } catch (err) {
      console.error("Failed to load XLSX:", err);
      throw new Error("Failed to load Excel library");
    }
  }
  return XLSX;
};

interface ReportViewerProps {
  reportUrl?: string | null;
  reportFileName?: string;
  onGoBack?: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ 
  reportUrl: propReportUrl, 
  reportFileName: propReportFileName,
  onGoBack 
}) => {
  const { config } = useWorkflow();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [sheetName, setSheetName] = useState<string>('');
  const [previewError, setPreviewError] = useState<string | null>(null);
  
  const reportUrl = propReportUrl || config.reportUrl;
  const reportFileName = propReportFileName || config.reportFileName || 'report.xlsx';
  
  const fileName = reportFileName.includes('/') 
    ? reportFileName.split('/').pop() || reportFileName 
    : reportFileName;

  useEffect(() => {
    if (reportUrl) {
      loadExcelPreview();
    }
  }, [reportUrl]);

  const loadExcelPreview = async () => {
    if (!reportUrl) return;
    
    console.log("=".repeat(80));
    console.log("📊 LOADING EXCEL PREVIEW");
    console.log("=".repeat(80));
    
    setPreviewLoading(true);
    setPreviewError(null);
    
    try {
      console.log("🔗 Report URL:", reportUrl);
      
      // Get token
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        console.error("❌ No auth token found in localStorage");
        console.log("Keys in localStorage:", Object.keys(localStorage));
        throw new Error("Please log in to view reports");
      }
      
      console.log("🔑 Token found:", token.substring(0, 20) + "...");
      
      // Load XLSX library
      console.log("📚 Loading XLSX library...");
      const xlsxLib = await loadXLSX();
      console.log("✅ XLSX loaded");
      
      // Fetch the Excel file
      console.log("📡 Fetching file with auth...");
      const response = await fetch(reportUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      console.log("📡 Response:", response.status, response.statusText);
      console.log("📋 Content-Type:", response.headers.get('content-type'));
      console.log("📦 Content-Length:", response.headers.get('content-length'));
      
      // Handle authentication errors
      if (response.status === 401) {
        console.error("❌ Authentication failed - token invalid or expired");
        throw new Error("Your session has expired. Please log in again.");
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Response error:", errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Get the file as array buffer
      console.log("📦 Downloading file...");
      const arrayBuffer = await response.arrayBuffer();
      const fileSize = arrayBuffer.byteLength;
      
      console.log("✅ Downloaded:", fileSize.toLocaleString(), "bytes");
      
      if (fileSize === 0) {
        throw new Error("Downloaded file is empty");
      }
      
      // Verify Excel signature
      const header = new Uint8Array(arrayBuffer.slice(0, 4));
      const headerHex = Array.from(header).map(b => b.toString(16).padStart(2, '0')).join(' ');
      const isValid = header[0] === 0x50 && header[1] === 0x4B;
      
      console.log("🔍 File signature:", headerHex);
      console.log("✅ Valid Excel?:", isValid);
      
      if (!isValid) {
        console.error("❌ Invalid Excel file - got:", headerHex);
        throw new Error("Invalid Excel file format");
      }
      
      // Parse Excel
      console.log("📋 Parsing workbook...");
      const workbook = xlsxLib.read(arrayBuffer, { type: 'array' });
      
      console.log("📑 Sheets:", workbook.SheetNames);
      
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      console.log("🔄 Converting to JSON...");
      const jsonData = xlsxLib.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: false
      });
      
      console.log("📊 Total rows:", jsonData.length);
      
      if (jsonData.length > 0) {
        const headers = (jsonData[0] as any[]).map(h => String(h || ''));
        const data = jsonData.slice(1) as any[][];
        
        console.log("📋 Headers:", headers);
        console.log("📊 Data rows:", data.length);
        
        setExcelHeaders(headers);
        setExcelData(data);
        setSheetName(firstSheetName);
        
        console.log("=".repeat(80));
        console.log("✅ EXCEL PREVIEW - SUCCESS");
        console.log("=".repeat(80));
      } else {
        throw new Error("Excel file is empty");
      }
      
    } catch (err: any) {
      console.log("=".repeat(80));
      console.error("❌ EXCEL PREVIEW - FAILED");
      console.error("Error:", err.message);
      console.log("=".repeat(80));
      setPreviewError(err.message || 'Failed to load preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!reportUrl) return;
    
    console.log("=".repeat(80));
    console.log("📥 DOWNLOADING FILE");
    console.log("=".repeat(80));
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        console.error("❌ No auth token found");
        throw new Error("Please log in to download reports");
      }
      
      console.log("🔗 URL:", reportUrl);
      console.log("📄 Filename:", fileName);
      console.log("🔑 Token:", token.substring(0, 20) + "...");
      
      console.log("📡 Fetching...");
      const response = await fetch(reportUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      console.log("📡 Status:", response.status, response.statusText);
      console.log("📋 Content-Type:", response.headers.get('content-type'));
      console.log("📦 Content-Length:", response.headers.get('content-length'));
      
      if (response.status === 401) {
        console.error("❌ Authentication failed");
        throw new Error("Your session has expired. Please log in again.");
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);
        throw new Error(`Download failed: ${response.status}`);
      }
      
      // Get file as blob
      console.log("📦 Creating blob...");
      const blob = await response.blob();
      console.log("📦 Blob size:", blob.size.toLocaleString(), "bytes");
      console.log("📋 Blob type:", blob.type);
      
      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }
      
      // Verify it's not JSON/HTML
      if (blob.type.includes('json') || blob.type.includes('html') || blob.type.includes('text')) {
        console.error("❌ Received wrong file type:", blob.type);
        const text = await blob.text();
        console.error("Response body:", text.substring(0, 500));
        throw new Error("Received invalid file type. Expected Excel file.");
      }
      
      // Create download link
      console.log("💾 Creating download link...");
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      
      console.log("🖱️ Triggering download...");
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      console.log("=".repeat(80));
      console.log("✅ DOWNLOAD - SUCCESS");
      console.log("=".repeat(80));
      
    } catch (err: any) {
      console.log("=".repeat(80));
      console.error("❌ DOWNLOAD - FAILED");
      console.error("Error:", err.message);
      console.log("=".repeat(80));
      setError(err.message || 'Failed to download');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInNewTab = () => {
    if (reportUrl) window.open(reportUrl, '_blank');
  };

  if (!reportUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center space-y-6 max-w-md p-8">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center border border-gray-700 shadow-xl">
            <FileText className="w-12 h-12 text-blue-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-100">No Report Generated Yet</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Run a workflow query to generate a report. Once complete, it will appear here with preview and download options.
            </p>
          </div>
          {onGoBack && (
            <button onClick={onGoBack} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl transition-all font-medium text-sm shadow-lg hover:shadow-blue-500/30">
              <ArrowLeft className="w-4 h-4" />
              Go to Workflow
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800 p-6 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Table className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-100">Report Ready</h2>
              <p className="text-sm text-gray-400 mt-1">{fileName}</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button onClick={handleOpenInNewTab} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-100 rounded-xl transition-all font-medium text-sm shadow-lg border border-gray-700">
              <ExternalLink className="w-4 h-4" />
              Open in New Tab
            </button>
            
            <button onClick={handleDownload} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl transition-all font-medium text-sm shadow-lg hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Report
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Excel Preview */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="h-full bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Preview Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                <Table className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-100">{sheetName || 'Excel Preview'}</p>
                <p className="text-xs text-gray-400">
                  {excelData.length > 0 ? `${excelData.length} rows • ${excelHeaders.length} columns` : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Preview Content */}
          <div className="flex-1 overflow-auto bg-gray-900">
            {previewLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                  <p className="text-sm text-gray-400">Loading preview...</p>
                </div>
              </div>
            ) : previewError ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md p-8">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-2xl flex items-center justify-center border border-yellow-700/50">
                    <AlertCircle className="w-10 h-10 text-yellow-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-100">Preview Unavailable</h3>
                    <p className="text-sm text-gray-400">{previewError}</p>
                  </div>
                  <button onClick={handleDownload} disabled={loading} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl transition-all font-medium text-sm shadow-lg hover:shadow-green-500/30 disabled:opacity-50">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download Excel File
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : excelData.length > 0 ? (
              <div className="overflow-auto h-full custom-scrollbar">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-gray-800 border-b-2 border-gray-700 shadow-lg">
                    <tr>
                      {excelHeaders.map((header, idx) => (
                        <th key={idx} className="px-6 py-3 text-xs font-bold text-gray-300 uppercase tracking-wider whitespace-nowrap border-r border-gray-700 last:border-r-0">
                          {header || `Column ${idx + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {excelData.slice(0, 100).map((row: any[], rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-gray-800/50 transition-colors">
                        {excelHeaders.map((_, cellIdx) => {
                          const cellValue = row[cellIdx];
                          const displayValue = cellValue !== null && cellValue !== undefined ? String(cellValue) : '-';
                          
                          return (
                            <td key={cellIdx} className="px-6 py-3 text-gray-300 whitespace-nowrap border-r border-gray-800/50 last:border-r-0">
                              {displayValue}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md p-8">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-2xl flex items-center justify-center border border-yellow-700/50">
                    <AlertCircle className="w-10 h-10 text-yellow-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-100">No Data Available</h3>
                    <p className="text-sm text-gray-400">Unable to load Excel preview. Download the file to view it in Excel.</p>
                  </div>
                  <button onClick={handleDownload} disabled={loading} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl transition-all font-medium text-sm shadow-lg hover:shadow-green-500/30 disabled:opacity-50">
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download Excel File
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 bg-gradient-to-r from-gray-900 to-black border-t border-gray-800 backdrop-blur-md">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Report Ready
            </span>
            <span>📊 Excel Format</span>
            <span>🔒 Secure Download</span>
          </div>
          <span>Powered by Finixy Automation</span>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #10b981, #059669);
          border-radius: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #34d399, #10b981);
        }
      `}</style>
    </div>
  );
};