# Upload File Phase 1 Report

## What changed
The post composer no longer requires typing an image URL manually.

### Frontend
- Replaced URL text input with file input (`accept=image/*`)
- Added upload progress state (simple loading text)
- Added local preview after upload returns URL
- Post creation now uses uploaded file URL returned by backend

### Backend
- Added `POST /api/uploads/image`
- Accepts multipart form-data with field name: `file`
- Saves uploaded image into backend local `uploads/` folder
- Exposes files via static route `/uploads/*`

## Current behavior
1. User selects an image file
2. Frontend uploads file to backend
3. Backend stores file locally and returns URL
4. Frontend previews image
5. User submits post
6. Post persists with uploaded image URL

## Limitations
- No file type/size validation yet beyond basic usage
- No image resizing/compression yet
- No media metadata persistence table yet
- Local file storage only for now
