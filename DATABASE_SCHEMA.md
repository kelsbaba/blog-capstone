# Blog Capstone — General Project Database Schema

**Database:** PostgreSQL / Neon

This document is the consolidated database schema reference for the Blog Capstone project, based on the schema patches and migrations supplied during development.

## 1. Database Tables

The project database contains seven tables:

1. `users`
2. `categories`
3. `posts`
4. `comments`
5. `likes`
6. `friendships`
7. `messages`

---

## 2. `users`

Stores user accounts and profile information.

| Column | Type | Constraints / Default |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `username` | `VARCHAR(100)` | `UNIQUE`, `NOT NULL` |
| `email` | `VARCHAR(255)` | `UNIQUE`, `NOT NULL` |
| `password_hash` | `TEXT` | `NOT NULL` |
| `created_at` | `TEXT` | `NOT NULL` |
| `display_name` | `VARCHAR(100)` | Nullable |
| `bio` | `TEXT` | Nullable |
| `profile_image` | `TEXT` | Nullable |

### Profile schema evolution

The following columns were added later:

```sql
display_name VARCHAR(100);
bio TEXT;
profile_image TEXT;
```

The migration used `ADD COLUMN IF NOT EXISTS`.

### Note

The supplied original schema defines `users.created_at` as `TEXT NOT NULL`. This document preserves that established type rather than changing it.

---

## 3. `categories`

Stores blog post categories.

| Column | Type | Constraints / Default |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `name` | `VARCHAR(100)` | `UNIQUE`, `NOT NULL` |

---

## 4. `posts`

Stores blog posts.

| Column | Type | Constraints / Default |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `title` | `VARCHAR(255)` | `NOT NULL` |
| `content` | `TEXT` | `NOT NULL` |
| `author` | `VARCHAR(100)` | `NOT NULL` |
| `date` | `VARCHAR(50)` | `NOT NULL` |
| `user_id` | `INTEGER` | FK → `users.id`, `ON DELETE CASCADE` |
| `category_id` | `INTEGER` | FK → `categories.id`, `ON DELETE SET NULL` |
| `image` | `TEXT` | Nullable |

### Relationships

- `posts.user_id` → `users.id` with `ON DELETE CASCADE`
- `posts.category_id` → `categories.id` with `ON DELETE SET NULL`

---

## 5. `comments`

Stores comments made on blog posts.

| Column | Type | Constraints / Default |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `content` | `TEXT` | `NOT NULL` |
| `post_id` | `INTEGER` | `NOT NULL`, FK → `posts.id`, `ON DELETE CASCADE` |
| `user_id` | `INTEGER` | `NOT NULL`, FK → `users.id`, `ON DELETE CASCADE` |
| `author` | `VARCHAR(100)` | `NOT NULL` |
| `date` | `VARCHAR(50)` | `NOT NULL` |

### Relationships

- `comments.post_id` → `posts.id` with `ON DELETE CASCADE`
- `comments.user_id` → `users.id` with `ON DELETE CASCADE`

### Schema-history note

The supplied core patch both defines `author` and `date` in the original `CREATE TABLE` and later contains `ADD COLUMN IF NOT EXISTS` statements for those same columns. The latter are therefore treated as historical/redundant safeguards, not additional final columns.

---

## 6. `likes`

Stores user likes on blog posts.

| Column | Type | Constraints / Default |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `post_id` | `INTEGER` | `NOT NULL`, FK → `posts.id`, `ON DELETE CASCADE` |
| `user_id` | `INTEGER` | `NOT NULL`, FK → `users.id`, `ON DELETE CASCADE` |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |

### Constraints

```sql
UNIQUE(post_id, user_id)
```

This prevents the same user from creating multiple like records for the same post.

### Relationships

- `likes.post_id` → `posts.id` with `ON DELETE CASCADE`
- `likes.user_id` → `users.id` with `ON DELETE CASCADE`

---

## 7. `friendships`

Supports friend requests and accepted/rejected friendships.

| Column | Type | Constraints / Default |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `sender_id` | `INTEGER` | `NOT NULL`, FK → `users.id`, `ON DELETE CASCADE` |
| `receiver_id` | `INTEGER` | `NOT NULL`, FK → `users.id`, `ON DELETE CASCADE` |
| `status` | `VARCHAR(20)` | `NOT NULL`, default `'pending'` |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |

### Status constraint

Allowed values:

- `pending`
- `accepted`
- `rejected`

Implemented with:

```sql
CHECK (status IN ('pending', 'accepted', 'rejected'))
```

### Self-friend prevention

```sql
CHECK (sender_id <> receiver_id)
```

### Duplicate prevention

```sql
UNIQUE(sender_id, receiver_id)
```

### Relationships

- `friendships.sender_id` → `users.id` with `ON DELETE CASCADE`
- `friendships.receiver_id` → `users.id` with `ON DELETE CASCADE`

---

## 8. `messages`

Stores private user-to-user messages.

| Column | Type | Constraints / Default |
|---|---|---|
| `id` | `SERIAL` | `PRIMARY KEY` |
| `sender_id` | `INTEGER` | `NOT NULL`, FK → `users.id`, `ON DELETE CASCADE` |
| `receiver_id` | `INTEGER` | `NOT NULL`, FK → `users.id`, `ON DELETE CASCADE` |
| `content` | `TEXT` | `NOT NULL` |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` |
| `read_at` | `TIMESTAMP` | Nullable |

### Self-message prevention

```sql
CHECK (sender_id <> receiver_id)
```

### Relationships

- `messages.sender_id` → `users.id` with `ON DELETE CASCADE`
- `messages.receiver_id` → `users.id` with `ON DELETE CASCADE`

### Read/unread mechanism

- `read_at IS NULL` → message is unread
- `read_at` containing a timestamp → message has been read

This supports the application's unread message counts and per-friend unread badges.

---

## 9. Message Indexes

The supplied messaging migration creates these indexes:

```sql
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver
ON messages(sender_id, receiver_id);
```

```sql
CREATE INDEX IF NOT EXISTS idx_messages_receiver_sender
ON messages(receiver_id, sender_id);
```

```sql
CREATE INDEX IF NOT EXISTS idx_messages_created_at
ON messages(created_at);
```

These indexes support conversation lookups, sender/receiver filtering, and chronological message queries.

---

## 10. Relationship Summary

### Users → Posts

A user can have multiple posts.

```text
posts.user_id → users.id
ON DELETE CASCADE
```

### Categories → Posts

A category can be associated with multiple posts.

```text
posts.category_id → categories.id
ON DELETE SET NULL
```

### Users → Comments

A user can create multiple comments.

```text
comments.user_id → users.id
ON DELETE CASCADE
```

### Posts → Comments

A post can have multiple comments.

```text
comments.post_id → posts.id
ON DELETE CASCADE
```

### Users → Likes

A user can create likes on posts.

```text
likes.user_id → users.id
ON DELETE CASCADE
```

### Posts → Likes

A post can have multiple likes.

```text
likes.post_id → posts.id
ON DELETE CASCADE
```

### Users → Friendships

A user can appear as both sender and receiver.

```text
friendships.sender_id → users.id
friendships.receiver_id → users.id
```

Both use `ON DELETE CASCADE`.

### Users → Messages

A user can appear as both sender and receiver.

```text
messages.sender_id → users.id
messages.receiver_id → users.id
```

Both use `ON DELETE CASCADE`.

---

## 11. Schema Evolution / Migration History

The database evolved in the following broad stages:

### Stage 1 — Core blog database

Created:

- `users`
- `categories`
- `posts`
- `comments`
- `likes`

### Stage 2 — User profiles

Added to `users`:

- `display_name`
- `bio`
- `profile_image`

### Stage 3 — Friend system

Created:

- `friendships`

with pending/accepted/rejected request states.

### Stage 4 — Private messaging

Created:

- `messages`

and added three supporting indexes.

### Stage 5 — Diagnostic verification

A `check-user-columns.js` script was used to inspect the `users` table. It does not change the schema and is therefore not considered a schema migration.

---

## 12. Complete Schema Inventory

| Table | Purpose |
|---|---|
| `users` | Authentication, account and profile data |
| `categories` | Blog categories |
| `posts` | Blog posts |
| `comments` | Post comments |
| `likes` | User likes on posts |
| `friendships` | Friend requests and relationships |
| `messages` | Private messaging and read/unread tracking |

---

## 13. Important Established Schema Characteristics

The following characteristics are preserved from the supplied schema patches:

- `users.created_at` is `TEXT NOT NULL`.
- `posts.date` is `VARCHAR(50) NOT NULL`.
- `comments.date` is `VARCHAR(50) NOT NULL`.
- `posts.author` stores author text in addition to `user_id`.
- `comments.author` stores author text in addition to `user_id`.
- `friendships` uses directional uniqueness with `UNIQUE(sender_id, receiver_id)`.
- `likes` uses `UNIQUE(post_id, user_id)`.
- `messages.read_at` controls message read/unread state.
- Message indexes are part of the established schema.
- No schema changes are implied beyond those present in the supplied patches.

---

## 14. Future Schema Changes

Before adding new database tables, columns, constraints, relationships, or indexes, update this document so it remains the master database reference for the Blog Capstone project.

This document represents the consolidated schema based on the schema patches supplied during the current project milestone.
