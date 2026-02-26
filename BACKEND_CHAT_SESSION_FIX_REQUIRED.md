# CRITICAL: Backend Chat Session Management Issue

## The Real Problem

Your backend is creating a **NEW chat session for EVERY action** instead of continuing the same conversation. This is why you see:

- "Document Upload - 20..." (multiple times)
- "give me ap register re..." (multiple times)
- Each file upload creates a new chat
- Each query creates a new chat

## What Should Happen

1. User starts a new chat → Creates ONE chat session with a chat_id
2. User uploads a file → Uses SAME chat_id, adds message to existing chat
3. User sends query → Uses SAME chat_id, adds message to existing chat
4. User uploads another file → Uses SAME chat_id, adds message to existing chat

## Frontend Fix Applied

The Sidebar.tsx now filters out unwanted session types:

```typescript
const filteredChats = response.data.filter((chat: ChatItem) => {
  // Only show 'workflow' or 'chat' type sessions
  const validTypes = ["workflow", "chat", "conversation"];
  const sessionType = chat.session_type?.toLowerCase() || "chat";

  // Filter out sessions with generic titles like "Document Upload"
  const isGenericTitle = chat.session_title
    ?.toLowerCase()
    .includes("document upload");

  return validTypes.includes(sessionType) && !isGenericTitle;
});
```

This is a **TEMPORARY FIX**. The real issue is in your backend.

## Backend Changes Required

### 1. Document Upload Endpoint (`/api/v1/documents/upload`)

**Current behavior (WRONG):**

```python
# Creates a NEW chat every time
chat_id = str(uuid.uuid4())
chat = Chat(chat_id=chat_id, ...)
db.add(chat)
```

**Required behavior (CORRECT):**

```python
@router.post("/documents/upload")
async def upload_document(
    file: UploadFile,
    chat_id: Optional[str] = Form(None),  # Accept existing chat_id
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # If chat_id provided, use it; otherwise create new one
    if chat_id:
        # Verify chat exists and user has access
        chat = db.query(Chat).filter(
            Chat.chat_id == chat_id,
            Chat.user_id == current_user.id
        ).first()

        if not chat:
            raise HTTPException(404, "Chat not found")
    else:
        # Create new chat only if no chat_id provided
        chat_id = str(uuid.uuid4())
        chat = Chat(
            chat_id=chat_id,
            user_id=current_user.id,
            session_title="New Chat",  # NOT "Document Upload"
            session_type="chat",  # NOT "document_upload"
            ...
        )
        db.add(chat)
        db.commit()

    # Process document...

    # Add message to chat
    chat_service.add_message(
        chat_id=chat_id,
        role="user",
        content=f"Uploaded: {file.filename}",
        metadata={"document_id": document_id, "file_url": file_url}
    )

    return {
        "status": "success",
        "chat_id": chat_id,  # Return chat_id so frontend can reuse it
        "document_id": document_id,
        ...
    }
```

### 2. Chat Query Endpoint (`/api/v1/chat/query`)

**Current behavior (WRONG):**

```python
# Creates a NEW chat every time
if not chat_id:
    chat_id = str(uuid.uuid4())
    chat = Chat(chat_id=chat_id, ...)
    db.add(chat)
```

**Required behavior (CORRECT):**

```python
@router.post("/chat/query")
async def send_query(
    query: str,
    chat_id: Optional[str] = None,  # Accept existing chat_id
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # If chat_id provided, use it
    if chat_id:
        chat = db.query(Chat).filter(
            Chat.chat_id == chat_id,
            Chat.user_id == current_user.id
        ).first()

        if not chat:
            raise HTTPException(404, "Chat not found")
    else:
        # Create new chat ONLY if no chat_id provided
        chat_id = str(uuid.uuid4())
        chat = Chat(
            chat_id=chat_id,
            user_id=current_user.id,
            session_title=query[:50],  # Use first 50 chars of query as title
            session_type="chat",
            ...
        )
        db.add(chat)
        db.commit()

    # Add user message
    chat_service.add_message(
        chat_id=chat_id,
        role="user",
        content=query
    )

    # Process query and generate response...

    # Add assistant message
    chat_service.add_message(
        chat_id=chat_id,
        role="assistant",
        content=response_text,
        metadata={"workflow_id": workflow_id}
    )

    return {
        "status": "success",
        "chat_id": chat_id,  # Return chat_id
        "workflow": workflow_data,
        ...
    }
```

### 3. Session Type Standards

Use these session types consistently:

- `"chat"` - Regular chat conversations (DEFAULT)
- `"workflow"` - Workflow-related chats
- `"conversation"` - General conversations

**DO NOT USE:**

- `"document_upload"` - This creates noise in chat history
- `"file_upload"` - Same issue
- Any other type that's not a real conversation

### 4. Session Title Standards

**GOOD titles:**

- "AP Register Report"
- "Invoice Analysis"
- "Financial Summary"
- First 50 characters of user's first query

**BAD titles:**

- "Document Upload - invoice.pdf"
- "File Upload - 20240226"
- Generic system-generated titles

## Frontend Already Handles This

The frontend (ChatPanel.tsx) already passes `chat_id` to both endpoints:

```typescript
// File upload
const response = await documentService.upload(file, currentChatId || undefined);

// Query
const response = await chatService.sendQuery(query, currentChatId || undefined);
```

The backend just needs to USE this chat_id instead of creating new ones!

## Testing After Backend Fix

1. Start new chat (click "New Chat")
2. Upload a file → Should use same chat
3. Send a query → Should use same chat
4. Upload another file → Should use same chat
5. Check history → Should see ONE chat with all messages

## Summary

- Frontend is FIXED and ready
- Backend needs to STOP creating new chats for every action
- Backend needs to ACCEPT and USE the chat_id parameter
- Backend needs to use proper session_type ("chat", not "document_upload")
- Backend needs to use meaningful session titles (not "Document Upload")
