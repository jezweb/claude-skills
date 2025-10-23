# Database Schema Documentation

See `../schema.sql` for the complete schema definition.

---

## Tables

### users
- id (TEXT PRIMARY KEY)
- email (TEXT UNIQUE)
- name (TEXT)
- created_at (INTEGER)
- updated_at (INTEGER)

### items
- id (TEXT PRIMARY KEY)
- user_id (TEXT FK → users.id)
- title (TEXT)
- description (TEXT)
- status (TEXT)
- created_at (INTEGER)
- updated_at (INTEGER)

TODO: Document your tables here
