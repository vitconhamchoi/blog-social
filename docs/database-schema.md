# Database Schema (PostgreSQL)

## users
- id (uuid, pk)
- email (varchar, unique, not null)
- password_hash (text, not null)
- full_name (varchar, not null)
- bio (text, null)
- avatar_media_id (uuid, null)
- created_at (timestamptz)
- updated_at (timestamptz)
- last_login_at (timestamptz, null)
- is_active (boolean)

## refresh_tokens
- id (uuid, pk)
- user_id (uuid, fk -> users)
- token_hash (text, not null)
- expires_at (timestamptz)
- revoked_at (timestamptz, null)
- created_at (timestamptz)
- user_agent (text, null)
- ip_address (varchar, null)

## friendships
- id (uuid, pk)
- requester_id (uuid, fk -> users)
- addressee_id (uuid, fk -> users)
- status (varchar) -- pending|accepted|rejected|cancelled
- responded_at (timestamptz, null)
- created_at (timestamptz)
- updated_at (timestamptz)

Constraint:
- unique(requester_id, addressee_id)
- requester_id != addressee_id

Gợi ý nâng cấp:
- chuẩn hóa cặp user nhỏ/lớn để tránh A->B và B->A cùng tồn tại

## posts
- id (uuid, pk)
- author_id (uuid, fk -> users)
- content (text, not null)
- visibility (varchar) -- friends_only, private (mở rộng sau)
- created_at (timestamptz)
- updated_at (timestamptz)
- deleted_at (timestamptz, null)

## post_media
- id (uuid, pk)
- post_id (uuid, fk -> posts)
- media_id (uuid, fk -> media_files)
- sort_order (int)
- created_at (timestamptz)

## media_files
- id (uuid, pk)
- owner_user_id (uuid, fk -> users)
- storage_key (text, not null)
- original_file_name (text)
- content_type (varchar)
- file_size (bigint)
- width (int, null)
- height (int, null)
- created_at (timestamptz)

## notifications (optional phase 2)
- id (uuid, pk)
- user_id (uuid, fk -> users)
- type (varchar)
- payload_json (jsonb)
- is_read (boolean)
- created_at (timestamptz)

## Helpful indexes
- posts(author_id, created_at desc)
- friendships(addressee_id, status)
- friendships(requester_id, status)
- refresh_tokens(user_id)
