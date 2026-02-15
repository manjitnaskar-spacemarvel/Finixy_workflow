// import React, { useCallback, useEffect, useRef } from 'react';
// import ReactFlow, {
//   addEdge,
//   Background,
//   Controls,
//   Connection,
//   useNodesState,
//   useEdgesState,
//   NodeTypes,
//   EdgeTypes,
//   ReactFlowInstance,
// } from 'reactflow';
// import 'reactflow/dist/style.css';
// import { CustomNode } from '@components/CustomNode';
// import { CustomEdge } from '@components/CustomEdge';
// import { useWorkflow } from '@store/WorkflowContext';
// import { WorkflowNode, NodeType } from '@/types/index';

// const nodeTypes: NodeTypes = {
//   custom: CustomNode,
// };

// const edgeTypes: EdgeTypes = {
//   custom: CustomEdge,
// };

// export const WorkflowCanvas: React.FC = () => {
//   const { config, updateConfig, setSelectedNode } = useWorkflow();
//   const [nodes, setNodes, onNodesChange] = useNodesState([]);
//   const [edges, setEdges, onEdgesChange] = useEdgesState([]);
//   const reactFlowWrapper = useRef<HTMLDivElement>(null);
//   const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);
  
//   const isInternalUpdate = useRef(false);
//   const prevConfigRef = useRef(config);

//   const onNodesChangeHandler = useCallback(
//     (changes: any[]) => {
//       const hasRemoval = changes.some(change => change.type === 'remove');
//       if (hasRemoval) {
//         setSelectedNode(null);
//       }
//       onNodesChange(changes);
//     },
//     [onNodesChange, setSelectedNode]
//   );

//   const onPaneClick = useCallback(() => {
//     setSelectedNode(null);
//   }, [setSelectedNode]);

//   // ✅ CRITICAL: Sync config to canvas - Force update when config changes
//   useEffect(() => {
//     const configChanged = 
//       JSON.stringify(prevConfigRef.current.nodes) !== JSON.stringify(config.nodes) ||
//       JSON.stringify(prevConfigRef.current.edges) !== JSON.stringify(config.edges);

//     if (configChanged) {
//       console.log("=== FORCE CANVAS UPDATE ===");
//       console.log("New nodes:", config.nodes?.length);
//       console.log("New edges:", config.edges?.length);
//       console.log("Edge details:", config.edges);

//       // Force update nodes
//       setNodes(config.nodes || []);

//       // Force update edges with proper formatting
//       const formattedEdges = (config.edges || []).map((edge, idx) => {
//         const formatted = {
//           id: edge.id || `edge-${idx}`,
//           source: edge.source,
//           target: edge.target,
//           type: 'custom',
//           animated: true,
//           style: { 
//             stroke: '#b1b1b7', 
//             strokeWidth: 2 
//           }
//         };
//         console.log("Formatted edge:", formatted);
//         return formatted;
//       });

//       setEdges(formattedEdges);
//       prevConfigRef.current = config;

//       console.log("=== CANVAS UPDATED ===");
//       console.log("Canvas now has:", formattedEdges.length, "edges");
//     }
//   }, [config, setNodes, setEdges]);

//   // Handle edge deletions
//   useEffect(() => {
//     const handleDeleteEdge = (event: CustomEvent) => {
//       const { edgeId } = event.detail;
//       setEdges((currentEdges) => {
//         const updatedEdges = currentEdges.filter(edge => edge.id !== edgeId);
//         isInternalUpdate.current = true;
//         setTimeout(() => {
//           updateConfig({
//             ...config,
//             edges: updatedEdges,
//             lastModified: new Date().toISOString(),
//           });
//           isInternalUpdate.current = false;
//         }, 0);
//         return updatedEdges;
//       });
//     };

//     window.addEventListener('deleteEdge', handleDeleteEdge as EventListener);
//     return () => {
//       window.removeEventListener('deleteEdge', handleDeleteEdge as EventListener);
//     };
//   }, [setEdges, config, updateConfig]);

//   // Sync canvas changes back to config (debounced)
//   useEffect(() => {
//     if (isInternalUpdate.current) return;
    
//     const workflowNodes: WorkflowNode[] = nodes.map(node => ({
//       id: node.id,
//       type: node.type || 'custom',
//       position: node.position,
//       data: node.data
//     }));
    
//     if (nodes.length > 0 && JSON.stringify(workflowNodes) !== JSON.stringify(config.nodes)) {
//       const timeoutId = setTimeout(() => {
//         updateConfig({
//           ...config,
//           nodes: workflowNodes,
//           lastModified: new Date().toISOString(),
//         });
//       }, 100);
//       return () => clearTimeout(timeoutId);
//     }
//   }, [nodes]);

//   useEffect(() => {
//     if (isInternalUpdate.current) return;
    
//     if (edges.length > 0 && JSON.stringify(edges) !== JSON.stringify(config.edges)) {
//       const timeoutId = setTimeout(() => {
//         updateConfig({
//           ...config,
//           edges: edges,
//           lastModified: new Date().toISOString(),
//         });
//       }, 100);
//       return () => clearTimeout(timeoutId);
//     }
//   }, [edges]);

//   const onConnect = useCallback(
//     (params: Connection) => {
//       const sourceNode = nodes.find(n => n.id === params.source);
//       const isConditionNode = sourceNode?.data?.nodeType === 'condition';
      
//       const newEdge = {
//         ...params,
//         type: 'smoothstep',
//         animated: true,
//         label: isConditionNode 
//           ? params.sourceHandle === 'if' ? '✓ IF' : '✗ ELSE'
//           : undefined,
//         style: isConditionNode
//           ? params.sourceHandle === 'if'
//             ? { stroke: '#0916cc', strokeWidth: 2 }
//             : { stroke: '#ef4444', strokeWidth: 2 }
//           : { stroke: '#b1b1b7', strokeWidth: 2 },
//       };
      
//       isInternalUpdate.current = true;
//       setEdges((eds) => {
//         const updated = addEdge(newEdge, eds);
//         setTimeout(() => {
//           isInternalUpdate.current = false;
//         }, 100);
//         return updated;
//       });
//     },
//     [setEdges, nodes]
//   );

//   const onDragOver = useCallback((event: React.DragEvent) => {
//     event.preventDefault();
//     event.dataTransfer.dropEffect = 'move';
//   }, []);

//   const onDrop = useCallback(
//     (event: React.DragEvent) => {
//       event.preventDefault();
//       const data = event.dataTransfer.getData('application/reactflow');
//       if (!data || !reactFlowInstance) return;

//       const { nodeType, label } = JSON.parse(data) as { nodeType: NodeType; label: string };
//       const position = reactFlowInstance.screenToFlowPosition({
//         x: event.clientX,
//         y: event.clientY,
//       });

//       const newNode: WorkflowNode = {
//         id: `node-${Date.now()}`,
//         type: 'custom',
//         position,
//         data: {
//           label,
//           nodeType,
//           config: { name: label },
//         },
//       };

//       isInternalUpdate.current = true;
//       setNodes((nds) => {
//         setTimeout(() => {
//           isInternalUpdate.current = false;
//         }, 100);
//         return [...nds, newNode];
//       });
//     },
//     [reactFlowInstance, setNodes]
//   );

//   return (
//     <div className="h-full bg-black" ref={reactFlowWrapper}>
//       <ReactFlow
//         nodes={nodes}
//         edges={edges}
//         onNodesChange={onNodesChangeHandler}
//         onEdgesChange={onEdgesChange}
//         onConnect={onConnect}
//         onInit={setReactFlowInstance}
//         onDrop={onDrop}
//         onDragOver={onDragOver}
//         onPaneClick={onPaneClick}
//         nodeTypes={nodeTypes}
//         edgeTypes={edgeTypes}
//         fitView
//         className="bg-black"
//         deleteKeyCode="Delete"
//         defaultEdgeOptions={{
//           type: 'smoothstep',
//           animated: true,
//           style: { stroke: '#b1b1b7', strokeWidth: 2 }
//         }}
//         edgesUpdatable={true}
//         edgesFocusable={true}
//         elementsSelectable={true}
//         selectNodesOnDrag={false}
//       >
//         <Background color="#aaa" gap={16} />
//         <Controls />
//       </ReactFlow>
//     </div>
//   );
// };

import React, { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Connection,
  useNodesState,
  useEdgesState,
  NodeTypes,
  EdgeTypes,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CustomNode } from '@components/CustomNode';
import { CustomEdge } from '@components/CustomEdge';
import { useWorkflow } from '@store/WorkflowContext';
import { WorkflowNode, NodeType } from '@/types/index';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

export const WorkflowCanvas: React.FC = () => {
  const { config, updateConfig, setSelectedNode } = useWorkflow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);
  
  const isInternalUpdate = useRef(false);
  const prevConfigRef = useRef(config);

  const onNodesChangeHandler = useCallback(
    (changes: any[]) => {
      const hasRemoval = changes.some(change => change.type === 'remove');
      if (hasRemoval) {
        setSelectedNode(null);
      }
      onNodesChange(changes);
    },
    [onNodesChange, setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  // ✅ CRITICAL: Sync config to canvas - Force update when config changes
  useEffect(() => {
    const configChanged = 
      JSON.stringify(prevConfigRef.current.nodes) !== JSON.stringify(config.nodes) ||
      JSON.stringify(prevConfigRef.current.edges) !== JSON.stringify(config.edges);

    if (configChanged) {
      console.log("=== FORCE CANVAS UPDATE ===");
      console.log("New nodes:", config.nodes?.length);
      console.log("New edges:", config.edges?.length);
      
      // Debug: Show actual node IDs
      if (config.nodes && config.nodes.length > 0) {
        console.log("Node IDs:", config.nodes.map((n: any) => n.id));
      }
      
      // Debug: Show edge connections
      if (config.edges && config.edges.length > 0) {
        console.log("Edge connections:", config.edges.map((e: any) => 
          `${e.id}: ${e.source} -> ${e.target}`
        ));
      }

      // Force update nodes
      setNodes(config.nodes || []);

      // Force update edges with proper formatting - MUST USE 'custom' TYPE
      const formattedEdges = (config.edges || []).map((edge, idx) => {
        const formatted = {
          id: edge.id || `edge-${idx}`,
          source: edge.source,
          target: edge.target,
          type: 'custom', // CRITICAL: Must match edgeTypes
          animated: true,
          style: { 
            stroke: '#b1b1b7', 
            strokeWidth: 2 
          }
        };
        console.log("Formatted edge:", formatted);
        return formatted;
      });

      setEdges(formattedEdges);
      prevConfigRef.current = config;

      console.log("=== CANVAS UPDATED ===");
      console.log("Canvas now has:", formattedEdges.length, "edges");
      
      // VALIDATION: Check if edges can connect to nodes
      if (config.nodes && config.edges && config.edges.length > 0) {
        const nodeIds = new Set(config.nodes.map((n: any) => n.id));
        console.log("=== EDGE VALIDATION ===");
        config.edges.forEach((edge: any) => {
          const sourceExists = nodeIds.has(edge.source);
          const targetExists = nodeIds.has(edge.target);
          const status = sourceExists && targetExists ? "✅ VALID" : "❌ INVALID";
          console.log(`${status} Edge: ${edge.source} -> ${edge.target} (source: ${sourceExists}, target: ${targetExists})`);
        });
      }
    }
  }, [config, setNodes, setEdges]);

  // Handle edge deletions
  useEffect(() => {
    const handleDeleteEdge = (event: CustomEvent) => {
      const { edgeId } = event.detail;
      setEdges((currentEdges) => {
        const updatedEdges = currentEdges.filter(edge => edge.id !== edgeId);
        isInternalUpdate.current = true;
        setTimeout(() => {
          updateConfig({
            ...config,
            edges: updatedEdges,
            lastModified: new Date().toISOString(),
          });
          isInternalUpdate.current = false;
        }, 0);
        return updatedEdges;
      });
    };

    window.addEventListener('deleteEdge', handleDeleteEdge as EventListener);
    return () => {
      window.removeEventListener('deleteEdge', handleDeleteEdge as EventListener);
    };
  }, [setEdges, config, updateConfig]);

  // Sync canvas changes back to config (debounced)
  useEffect(() => {
    if (isInternalUpdate.current) return;
    
    const workflowNodes: WorkflowNode[] = nodes.map(node => ({
      id: node.id,
      type: node.type || 'custom',
      position: node.position,
      data: node.data
    }));
    
    if (nodes.length > 0 && JSON.stringify(workflowNodes) !== JSON.stringify(config.nodes)) {
      const timeoutId = setTimeout(() => {
        updateConfig({
          ...config,
          nodes: workflowNodes,
          lastModified: new Date().toISOString(),
        });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [nodes]);

  useEffect(() => {
    if (isInternalUpdate.current) return;
    
    if (edges.length > 0 && JSON.stringify(edges) !== JSON.stringify(config.edges)) {
      const timeoutId = setTimeout(() => {
        updateConfig({
          ...config,
          edges: edges,
          lastModified: new Date().toISOString(),
        });
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [edges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      const isConditionNode = sourceNode?.data?.nodeType === 'condition';
      
      const newEdge = {
        ...params,
        type: 'custom', // CRITICAL: Must match edgeTypes
        animated: true,
        label: isConditionNode 
          ? params.sourceHandle === 'if' ? '✓ IF' : '✗ ELSE'
          : undefined,
        style: isConditionNode
          ? params.sourceHandle === 'if'
            ? { stroke: '#0916cc', strokeWidth: 2 }
            : { stroke: '#ef4444', strokeWidth: 2 }
          : { stroke: '#b1b1b7', strokeWidth: 2 },
      };
      
      isInternalUpdate.current = true;
      setEdges((eds) => {
        const updated = addEdge(newEdge, eds);
        setTimeout(() => {
          isInternalUpdate.current = false;
        }, 100);
        return updated;
      });
    },
    [setEdges, nodes]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const data = event.dataTransfer.getData('application/reactflow');
      if (!data || !reactFlowInstance) return;

      const { nodeType, label } = JSON.parse(data) as { nodeType: NodeType; label: string };
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: WorkflowNode = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          label,
          nodeType,
          config: { name: label },
        },
      };

      isInternalUpdate.current = true;
      setNodes((nds) => {
        setTimeout(() => {
          isInternalUpdate.current = false;
        }, 100);
        return [...nds, newNode];
      });
    },
    [reactFlowInstance, setNodes]
  );

  return (
    <div className="h-full bg-black" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeHandler}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-black"
        deleteKeyCode="Delete"
        defaultEdgeOptions={{
          type: 'custom', // CRITICAL: Must match edgeTypes
          animated: true,
          style: { stroke: '#b1b1b7', strokeWidth: 2 }
        }}
        edgesUpdatable={true}
        edgesFocusable={true}
        elementsSelectable={true}
        selectNodesOnDrag={false}
      >
        <Background color="#aaa" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};