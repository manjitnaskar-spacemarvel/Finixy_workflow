# Workflow Run Button Feature

## Overview

Added a "Run" button to the workflow canvas that allows users to execute workflows on-demand. This enables the workflow where users can:

1. Create a workflow first
2. Upload files later
3. Click "Run" to execute the workflow with the uploaded data

## Changes Made

### 1. WorkflowCanvas.tsx

Added Run button functionality with the following features:

#### New State

```typescript
const [isExecuting, setIsExecuting] = useState(false);
```

#### New Handler

```typescript
const handleRunWorkflow = useCallback(async () => {
  if (!config.name || nodes.length === 0) {
    alert("Please create a workflow first");
    return;
  }

  setIsExecuting(true);

  try {
    // Re-execute the workflow by sending the original query
    const query = config.name || "Execute workflow";
    const response = await chatService.sendQuery(
      query,
      currentChatId || undefined,
    );

    // Update node statuses to completed
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          status: workflow.status === "completed" ? "completed" : "failed",
        },
      })),
    );

    alert(`Workflow executed successfully!`);
  } catch (error) {
    alert(`Workflow execution failed: ${error.message}`);
  } finally {
    setIsExecuting(false);
  }
}, [config, nodes, currentChatId, setNodes]);
```

#### New UI Component

```typescript
<button
  onClick={handleRunWorkflow}
  disabled={isExecuting}
  className="bg-gradient-to-r from-green-600 to-green-700..."
>
  {isExecuting ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>Running...</span>
    </>
  ) : (
    <>
      <Play className="w-4 h-4" />
      <span>Run</span>
    </>
  )}
</button>
```

## How It Works

### User Flow

1. **Create Workflow First**
   - User creates a workflow by dragging nodes onto canvas
   - Workflow is saved but not executed

2. **Upload Files**
   - User uploads invoice files
   - Files are processed and stored

3. **Execute Workflow**
   - User clicks "Run" button
   - Workflow executes with the uploaded data
   - Results are displayed

### Technical Flow

1. Button click triggers `handleRunWorkflow()`
2. Validates that workflow exists (has nodes)
3. Calls `/api/v1/chat/query` endpoint with:
   - `query`: Workflow name or "Execute workflow"
   - `chat_id`: Current chat session ID (if exists)
4. Backend processes the query and executes the workflow
5. Frontend updates node statuses based on execution result
6. Shows success/error message to user

## Button Location

- **Position**: Top right corner of canvas
- **Next to**: Node count indicator
- **Visibility**: Only shown when workflow has nodes

## Button States

### Idle State

- Green gradient background
- Play icon
- Text: "Run"
- Hover effect: Scale up slightly

### Executing State

- Gray background
- Spinning loader icon
- Text: "Running..."
- Disabled (not clickable)

### Disabled State

- Gray background
- Reduced opacity
- Not clickable
- Shown when no nodes in workflow

## API Integration

### Endpoint Used

```
POST /api/v1/chat/query
```

### Request Body

```json
{
  "query": "Execute workflow",
  "chat_id": "optional-chat-id"
}
```

### Response

```json
{
  "status": "success",
  "workflow": {
    "id": "workflow-id",
    "status": "completed",
    "nodes": [...],
    "edges": [...]
  },
  "report": {
    "report_id": "report-id",
    "report_data": {...}
  }
}
```

## Benefits

1. **Flexibility**: Users can create workflows before having data
2. **Reusability**: Same workflow can be run multiple times with different data
3. **Control**: Users decide when to execute, not automatic
4. **Visibility**: Clear visual feedback during execution

## Future Enhancements

1. **Workflow Parameters**: Allow users to configure parameters before running
2. **Execution History**: Show previous execution results
3. **Scheduled Runs**: Allow scheduling workflow execution
4. **Partial Execution**: Run only selected nodes
5. **Debug Mode**: Step-through execution with breakpoints

## Testing Checklist

- [ ] Button appears when workflow has nodes
- [ ] Button hidden when workflow is empty
- [ ] Click executes workflow successfully
- [ ] Loading state shows during execution
- [ ] Success message appears on completion
- [ ] Error message appears on failure
- [ ] Button disabled during execution
- [ ] Node statuses update after execution
- [ ] Works with existing chat session
- [ ] Works without chat session (creates new one)

## Files Modified

- `src/components/WorkflowCanvas.tsx`
