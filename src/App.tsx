// import React, { useState } from 'react';
// import { WorkflowProvider, useWorkflow } from '@store/WorkflowContext';
// import { AuthProvider, useAuth } from '@store/AuthContext';
// import { Header } from '@components/Header';
// import { Sidebar } from '@components/Sidebar';
// import { ChatPanel } from '@components/ChatPanel';
// import { WorkflowCanvas } from '@components/WorkflowCanvas';
// import { ConfigPanel } from '@components/ConfigPanel';
// import { NodePalette } from '@components/NodePalette';
// import { ReportViewer } from '@components/ReportViewer';
// import { Login } from '@components/Login';

// type Tab = 'workflow' | 'analysis' | 'report';

// // --- MAIN APP CONTENT ---
// const MainLayout: React.FC = () => {
//   const { isAuthenticated } = useAuth();
//   const { selectedNode } = useWorkflow();
  
//   const [activeTab, setActiveTab] = useState<Tab>('workflow');
//   const [isChatExpanded, setIsChatExpanded] = useState(true);

//   if (!isAuthenticated) {
//     return <Login />;
//   }

//   return (
//     <div className="h-screen flex flex-col bg-gray-900">
//       <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
//       <div className="flex-1 flex overflow-hidden">
//         <Sidebar 
//           isChatExpanded={isChatExpanded}
//           onToggleChat={() => setIsChatExpanded(!isChatExpanded)}
//         />
        
//         {/* Chat Panel - Only show on Workflow tab */}
//         {activeTab === 'workflow' && isChatExpanded && (
//           <div className="w-96 bg-black border-r border-gray-800 flex flex-col transition-all duration-300">
//             <ChatPanel isExpanded={isChatExpanded} />
//           </div>
//         )}
        
//         {/* Main Content Area - Switch based on active tab */}
//         <div className="flex-1 flex flex-col transition-all duration-300">
//           {activeTab === 'workflow' && (
//             <>
//               <NodePalette />
//               <div className="flex-1">
//                 <WorkflowCanvas />
//               </div>
//             </>
//           )}
          
//           {activeTab === 'analysis' && (
//             <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
//               <div className="text-center space-y-4">
//                 <h2 className="text-2xl font-bold text-gray-100">Analysis Dashboard</h2>
//                 <p className="text-gray-400">Coming Soon</p>
//               </div>
//             </div>
//           )}
          
//           {activeTab === 'report' && (
//             <div className="flex-1">
//               <ReportViewer />
//             </div>
//           )}
//         </div>
        
//         {/* Config Panel - Only show on Workflow tab when node is selected */}
//         {activeTab === 'workflow' && selectedNode && (
//           <div className="w-80 bg-white border-l flex-shrink-0 transition-all duration-300">
//             <ConfigPanel />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // --- ROOT APP ---
// const App: React.FC = () => {
//   return (
//     <AuthProvider>
//       <WorkflowProvider>
//         <MainLayout />
//       </WorkflowProvider>
//     </AuthProvider>
//   );
// };

// export default App;
// src/App.tsx
import React, { useState, useEffect } from 'react';
import { WorkflowProvider, useWorkflow } from '@store/WorkflowContext';
import { AuthProvider, useAuth } from '@store/AuthContext';
import { Header } from '@components/Header';
import { Sidebar } from '@components/Sidebar';
import { ChatPanel } from '@components/ChatPanel';
import { WorkflowCanvas } from '@components/WorkflowCanvas';
import { ConfigPanel } from '@components/ConfigPanel';
import { NodePalette } from '@components/NodePalette';
import { ReportViewer } from '@components/ReportViewer';
import { Login } from '@components/Login';

type Tab = 'workflow' | 'analysis' | 'report';

// --- MAIN APP CONTENT ---
const MainLayout: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { selectedNode, config } = useWorkflow();
  
  const [activeTab, setActiveTab] = useState<Tab>('workflow');
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [currentReportUrl, setCurrentReportUrl] = useState<string | null>(null);
  const [currentReportFileName, setCurrentReportFileName] = useState<string>('report.xlsx');

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleSwitchToReport = (reportUrl: string, fileName: string) => {
    console.log("Switching to report tab:", { reportUrl, fileName });
    setCurrentReportUrl(reportUrl);
    setCurrentReportFileName(fileName);
    setActiveTab('report');
  };

  const handleGoBackToWorkflow = () => {
    setActiveTab('workflow');
  };

  // Sync report from config if available
  useEffect(() => {
    if (config.reportUrl) {
      console.log("Config updated with report URL:", config.reportUrl);
      setCurrentReportUrl(config.reportUrl);
      setCurrentReportFileName(config.reportFileName || 'report.xlsx');
    }
  }, [config.reportUrl, config.reportFileName]);

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex overflow-hidden">
        <Sidebar 
          isChatExpanded={isChatExpanded}
          onToggleChat={() => setIsChatExpanded(!isChatExpanded)}
        />
        
        {/* Chat Panel - Show on both Workflow and Report tabs */}
        {(activeTab === 'workflow' || activeTab === 'report') && isChatExpanded && (
          <div className="w-96 bg-black border-r border-gray-800 flex flex-col transition-all duration-300">
            <ChatPanel 
              isExpanded={isChatExpanded}
              onSwitchToReport={handleSwitchToReport}
            />
          </div>
        )}
        
        {/* Main Content Area - Switch based on active tab */}
        <div className="flex-1 flex flex-col transition-all duration-300">
          {activeTab === 'workflow' && (
            <>
              <NodePalette />
              <div className="flex-1">
                <WorkflowCanvas />
              </div>
            </>
          )}
          
          {activeTab === 'analysis' && (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-gray-100">Analysis Dashboard</h2>
                <p className="text-gray-400">Coming Soon</p>
              </div>
            </div>
          )}
          
          {activeTab === 'report' && (
            <div className="flex-1">
              <ReportViewer 
                reportUrl={currentReportUrl}
                reportFileName={currentReportFileName}
                onGoBack={handleGoBackToWorkflow}
              />
            </div>
          )}
        </div>
        
        {/* Config Panel - Only show on Workflow tab when node is selected */}
        {activeTab === 'workflow' && selectedNode && (
          <div className="w-80 bg-white border-l flex-shrink-0 transition-all duration-300">
            <ConfigPanel />
          </div>
        )}
      </div>
    </div>
  );
};

// --- ROOT APP ---
const App: React.FC = () => {
  return (
    <AuthProvider>
      <WorkflowProvider>
        <MainLayout />
      </WorkflowProvider>
    </AuthProvider>
  );
};

export default App;