# Chat Persistence Fix - Workflows Stay in Same Chat

## Problem

When sending multiple queries in the same chat session, each query was creating a NEW chat instead of continuing in the existing chat. This resulted in:

- Multiple separate chats for what should be one conversation
- Loss of conversation context
- Cluttered chat history

## Root Cause

The frontend was not tracking the current `chat_id` and passing it to the backend when sending queries. The backend's `/api/v1/chat/query` endpoint accepts an optional `chat_id` parameter to continue an existing chat, but the frontend wasn't providing it.

## Solution

### 1. Added `currentChatId` to WorkflowContext

**File**: `src/store/WorkflowContext.tsx`

- Added `currentChatId` state to track the active chat session
- Added `setCurrentChatId` function to update it
- Exposed both in the context provider
- Reset `currentChatId` to `null` when `clearWorkflow()` is called (New Chat button)

### 2. Updated Sidebar to Set Chat ID

**File**: `src/components/Sidebar.tsx`

When loading a chat from history:

```typescript
// Set the current chat ID in context
setCurrentChatId(chat.chat_id);
console.log("💬 Set current chat ID:", chat.chat_id);
```

This ensures when you click on a chat in history, the frontend knows which chat is active.

### 3. Updated ChatPanel to Use and Pass Chat ID

**File**: `src/components/ChatPanel.tsx`

- Removed local `currentChatId` state
- Now uses `currentChatId` from WorkflowContext
- Passes `chat_id` to backend when sending queries:

```typescript
const response = await chatService.sendQuery(query, currentChatId || undefined);
```

- Updates `currentChatId` when backend returns a new `chat_id`:

```typescript
const { workflow, report, chat_id } = response.data;

// Update chat_id if returned from backend
if (chat_id && !currentChatId) {
  console.log("💬 Received new chat_id from backend:", chat_id);
  setCurrentChatId(chat_id);
}
```

## How It Works Now

### Scenario 1: New Chat

1. User clicks "New Chat" button
2. `clearWorkflow()` is called
3. `currentChatId` is set to `null`
4. User sends first query
5. Backend creates new chat and returns `chat_id`
6. Frontend saves `chat_id` to context
7. Subsequent queries in same session use this `chat_id`

### Scenario 2: Continue Existing Chat

1. User clicks on chat from history
2. Sidebar loads chat and sets `currentChatId`
3. User sends new query
4. Frontend passes existing `chat_id` to backend
5. Backend adds message to existing chat
6. Workflow stays in same chat session

### Scenario 3: Multiple Queries in Same Chat

1. User sends query: "give me the AR register report"
2. Backend creates chat, returns `chat_id`
3. Frontend saves `chat_id`
4. User sends another query: "now give me AP aging"
5. Frontend passes same `chat_id`
6. Backend adds to existing chat
7. Both workflows appear in same chat history

## Backend Requirements

The backend endpoint `/api/v1/chat/query` should:

1. **Accept optional `chat_id` parameter**:

```python
class ChatQuery(BaseModel):
    query: str
    chat_id: Optional[str] = None  # Optional: for continuing existing conversation
```

2. **Create new chat if no `chat_id` provided**:

```python
if not query_data.chat_id:
    # Create new chat session
    chat = chat_repo.create_chat_session(
        user_id=current_user.id,
        company_id=current_user.company_id,
        session_title=query[:100],
        initial_messages=[]
    )
    chat_id = chat.chat_id
else:
    # Use existing chat
    chat_id = query_data.chat_id
    chat = chat_repo.get_chat_by_id(chat_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
```

3. **Return `chat_id` in response**:

```python
return {
    "status": "success",
    "chat_id": chat_id,  # IMPORTANT: Return chat_id
    "workflow": {
        # ... workflow data
    },
    "report": {
        # ... report data
    }
}
```

## Testing

### Test 1: New Chat with Multiple Queries

1. Click "New Chat" button
2. Send query: "give me the AR register report"
3. Wait for workflow to complete
4. Send another query: "now give me AP aging"
5. ✅ Both workflows should appear in same chat
6. ✅ Check History - should see ONE chat with both queries

### Test 2: Continue from History

1. Click on existing chat from history
2. Send new query: "give me DSO report"
3. ✅ New workflow should appear in same chat
4. ✅ Chat history should show all previous messages + new query

### Test 3: New Chat Resets

1. Click "New Chat" button
2. Send query
3. ✅ Should create NEW chat (not continue previous)
4. ✅ Check History - should see new separate chat

## Console Logging

The fix includes detailed console logging:

- `📤 Sending query with chat_id: xxx` - Shows which chat_id is being sent
- `💬 Received new chat_id from backend: xxx` - Shows when new chat is created
- `💬 Set current chat ID: xxx` - Shows when loading chat from history

Check browser console (F12) to verify chat_id is being tracked correctly.

## Benefits

1. ✅ **Conversation Context**: All related queries stay in one chat
2. ✅ **Clean History**: No duplicate/fragmented chats
3. ✅ **Better UX**: Users can see full conversation flow
4. ✅ **Proper Threading**: Workflows are grouped logically
5. ✅ **Backend Alignment**: Frontend now properly uses backend's chat system

## Summary

The fix ensures that:

- New chats start fresh with no `chat_id`
- Subsequent queries in same session reuse the `chat_id`
- Loading from history preserves the `chat_id`
- "New Chat" button properly resets the `chat_id`

All workflows and queries now stay in the same chat session as intended!
