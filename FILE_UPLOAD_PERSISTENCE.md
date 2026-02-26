# File Upload Chat Persistence - Implementation Guide

## Overview

File uploads now persist in chat history by saving upload messages to the backend using the chat API.

## Frontend Changes ✅ COMPLETE

### 1. Updated `src/services/api.ts`

- Modified `documentService.upload()` to accept optional `chat_id` parameter
- Passes `chat_id` as form data when uploading files

```typescript
upload: (file: File, chat_id?: string) => {
  const formData = new FormData();
  formData.append("file", file);
  if (chat_id) {
    formData.append("chat_id", chat_id);
  }
  return api.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
```

### 2. Updated `src/components/ChatPanel.tsx`

- `handleFileUpload()` now passes `currentChatId` to upload function
- After successful upload, saves both messages to chat history:
  - User message: "📎 Uploading: {filename}"
  - Assistant message: Success message with vendor info and metadata
- Uses `chatService.addMessage()` to persist messages
- Updates `currentChatId` if backend returns a new `chat_id`

## Backend Requirements 🔧 TODO

### 1. Update `/api/v1/documents/upload` Endpoint

The document upload endpoint should:

1. Accept optional `chat_id` parameter from form data
2. If `chat_id` is provided, save upload messages to that chat
3. If `chat_id` is NOT provided, create a new chat session
4. Return `chat_id` in the response

**Example Backend Code (Python/FastAPI):**

```python
@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    chat_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Process file upload
    document = process_document(file, current_user.id, db)

    # Handle chat persistence
    if not chat_id:
        # Create new chat session
        chat = ChatService.create_chat(
            user_id=current_user.id,
            session_title=f"Document: {file.filename}",
            db=db
        )
        chat_id = chat.chat_id

    # Save upload messages to chat
    ChatService.add_message(
        chat_id=chat_id,
        role="user",
        content=f"📎 Uploading: {file.filename}",
        db=db
    )

    # Save assistant success message with metadata
    ChatService.add_message(
        chat_id=chat_id,
        role="assistant",
        content=f"✅ Successfully Processed: {file.filename}\n\nVendor: {document.vendor_name}",
        metadata={
            "document_id": document.id,           # ← REQUIRED for "Parsed Preview" button
            "file_url": document.file_url,        # ← REQUIRED for "Preview" button (original file)
            "file_type": file.content_type,       # ← REQUIRED for file type detection
            "vendor": document.vendor_name,
            "category": document.category
        },
        db=db
    )

    return {
        "status": "success",
        "document_id": document.id,
        "chat_id": chat_id,  # ← IMPORTANT: Return chat_id
        "extracted_data": document.extracted_data,
        "file_url": document.file_url,
        "category": document.category,
        "party": document.party
    }
```

### 2. Ensure `/api/v1/chats/{chat_id}/messages` Endpoint Exists

This endpoint should already exist (it's in the frontend API service). Verify it accepts:

```python
@router.post("/chats/{chat_id}/messages")
async def add_message(
    chat_id: str,
    role: str,
    content: str,
    metadata: Optional[dict] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    message = ChatService.add_message(
        chat_id=chat_id,
        role=role,
        content=content,
        metadata=metadata,
        db=db
    )
    return {"status": "success", "message": message}
```

## How It Works

### Flow Diagram

```
User uploads file
    ↓
Frontend: ChatPanel.handleFileUpload()
    ↓
API: POST /documents/upload (with chat_id if available)
    ↓
Backend: Process file + Save to DB
    ↓
Backend: Create/use chat session
    ↓
Backend: Save upload messages to chat
    ↓
Backend: Return response with chat_id
    ↓
Frontend: Update UI + Save messages via chatService.addMessage()
    ↓
Messages now persist in chat history ✅
```

### Message Persistence Strategy

1. **First Upload (No chat_id)**:
   - Backend creates new chat session
   - Returns `chat_id` in response
   - Frontend stores `chat_id` in `WorkflowContext.currentChatId`
   - Frontend calls `chatService.addMessage()` to save messages

2. **Subsequent Uploads (Has chat_id)**:
   - Frontend passes `currentChatId` to upload
   - Backend uses existing chat session
   - Frontend saves messages to same chat

3. **Loading from History**:
   - When user clicks chat in sidebar
   - `Sidebar.handleChatItemClick()` sets `currentChatId`
   - All new uploads/queries stay in same chat

## Testing Checklist

- [ ] Upload file without existing chat → Creates new chat
- [ ] Upload file in existing chat → Adds to same chat
- [ ] Upload messages appear in chat history
- [ ] Preview buttons appear on upload messages
- [ ] Reload page → Upload messages persist
- [ ] Load chat from history → Preview buttons appear
- [ ] Click "Preview" button → Shows original file
- [ ] Click "Parsed Preview" button → Shows parsed data with financial summary
- [ ] Switch between chats → Upload messages load correctly
- [ ] Document metadata (vendor, category) saved in message metadata
- [ ] Preview buttons work for uploaded documents in loaded chats

## Benefits

✅ File uploads now persist across sessions
✅ Chat history shows complete conversation including uploads
✅ Users can see what files were uploaded in each chat
✅ Document metadata preserved in chat messages
✅ Consistent chat experience for all interactions
✅ Preview buttons work when loading from chat history

## Message Metadata Structure

When saving messages to the database, ensure the metadata is stored as JSON and includes:

**For Upload Messages:**

```json
{
  "document_id": "doc_123",
  "file_url": "https://s3.../document.pdf",
  "file_type": "application/pdf",
  "vendor": "Vendor Name",
  "category": "purchase"
}
```

**For Report Messages:**

```json
{
  "report_url": "https://s3.../report.xlsx",
  "report_file_name": "ap_register_2024.xlsx",
  "report_id": "report_123"
}
```

The frontend will automatically extract this metadata when loading chat history and display the appropriate preview buttons.

## Frontend Message Transformation

When chat history is loaded, the frontend transforms messages:

```typescript
// Backend message format
{
  role: "assistant",
  content: "Successfully processed file",
  metadata: {
    document_id: "doc_123",
    file_url: "https://...",
    file_type: "application/pdf"
  }
}

// Frontend transformed format
{
  role: "assistant",
  content: "Successfully processed file",
  documentId: "doc_123",      // ← Extracted from metadata
  fileUrl: "https://...",      // ← Extracted from metadata
  fileType: "application/pdf"  // ← Extracted from metadata
}
```

This transformation happens automatically in `ChatPanel.tsx` when `chatHistory` is loaded.

## Troubleshooting

### Preview Buttons Not Showing

If the "Preview" or "Parsed Preview" buttons don't appear when loading chat from history:

1. **Check Browser Console**
   - Look for logs: `📦 Message metadata:` and `✅ Transformed message:`
   - Verify that `documentId` and `fileUrl` are present in transformed messages

2. **Verify Backend Metadata**
   - Ensure backend is saving `file_url` in message metadata
   - Check database: `SELECT metadata FROM messages WHERE chat_id = 'xxx'`
   - Metadata should contain: `{"document_id": "...", "file_url": "...", "file_type": "..."}`

3. **Common Issues**
   - Backend not saving `file_url` → Update upload endpoint to include it
   - Metadata field names mismatch → Frontend checks both snake_case and camelCase
   - File URL is null/empty → Ensure document upload returns valid S3 URL

### Expected Behavior

When loading a chat with uploaded documents:

- ✅ "Parsed Preview" button appears if `document_id` exists in metadata
- ✅ "Preview" button appears if both `document_id` AND `file_url` exist in metadata
- ✅ Both buttons should be visible for successfully uploaded documents

### Debug Steps

1. Upload a file in a new chat
2. Check browser console for: `💾 Saving upload messages to chat:`
3. Reload page and load the same chat from history
4. Check console for: `📦 Message metadata:` - should show `file_url`
5. If `file_url` is missing, backend isn't saving it correctly
