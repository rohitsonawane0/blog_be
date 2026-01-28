# Blog Module Implementation Guide

## 1. Overview
The Blog module is the core of the application, allowing users to publish, manage, and view articles. It supports rich content, categorization, tagging, and status management (draft vs published).

---

## 2. Entities & Fields

### **Blog Entity**
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Number (PK) | Unique identifier |
| `title` | String | Blog headline (Required, Max 100 chars) |
| `slug` | String | URL-friendly unique string (e.g., `my-first-blog`) |
| `content` | Text / LongText | The main body of the blog (Markdown or HTML) |
| `summary` | String | Short excerpt for card views/SEO (Optional) |
| `coverImage` | String | URL to the featured image |
| `status` | Enum | `DRAFT`, `PUBLISHED`, `ARCHIVED` (Default: `DRAFT`) |
| `authorId` | Number (FK) | Relation to **User** entity (Many-to-One) |
| `categoryId`| Number (FK) | Relation to **Category** entity (Many-to-One) |
| `viewCount` | Number | Tracks how many times the blog was read (Default: 0) |
| `isFeatured`| Boolean | Marks the blog for the "Featured" section (Admin/Editor only) |
| `publishedAt`| Date | Timestamp when status changed to `PUBLISHED` |
| `createdAt` | Date | Auto-timestamp |
| `updatedAt` | Date | Auto-timestamp |

### **Relations**
- **User (ManyToOne)**: A blog belongs to one Author.
- **Category (ManyToOne)**: A blog belongs to one Category.
- **Tags (ManyToMany)**: A blog can have multiple Tags.
- **Comments (OneToMany)**: A blog can have many Comments.

---

## 3. Functionalities

### **Core Features**
1.  **CRUD Operations**: Create, Read, Update, Delete blogs.
2.  **Slug Generation**: Automatically generate slugs from titles on creation (e.g., "My New Post" -> `my-new-post`).
3.  **Status Management**:
    - Users can save as `DRAFT` and publish later.
    - Only `PUBLISHED` blogs appear in public feeds.
4.  **Access Control**:
    - **Public**: Can view published blogs.
    - **User**: Can create blogs, edit/delete *their own* blogs.
    - **Admin**: Can edit/delete *any* blog, feature blogs.
5.  **View Counting**: Increment `viewCount` when a single blog is fetched.

### **Search & Filters**
- Filter by **Category**.
- Filter by **Tags**.
- Filter by **Author**.
- **Search** by text (title/summary).

---

## 4. API Endpoints

### **Public Routes**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/blogs` | Get paginated list of **published** blogs. Supports query params: `?page=1&limit=10&category=tech&search=nest`. |
| `GET` | `/blogs/:slug` | Get a single blog by its slug. **Increments view count.** |
| `GET` | `/blogs/featured` | Get a list of featured blogs. |

### **Protected Routes (Authenticated Users)**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/blogs` | Create a new blog. payload: `{ title, content, categoryId, tags, status? }` |
| `GET` | `/blogs/my-blogs` | Get list of blogs created by the current logged-in user (includes Drafts). |
| `PATCH` | `/blogs/:id` | Update a blog. **Rule**: Users can only update their own blogs. |
| `DELETE` | `/blogs/:id` | Delete a blog. **Rule**: Users can only delete their own blogs. |

### **Admin Routes (Role: ADMIN)**
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `PATCH` | `/blogs/:id/feature` | Toggle `isFeatured` status. |
| `DELETE` | `/blogs/admin/:id` | Force delete any blog (moderation). |

---

## 5. DTOs

### **CreateBlogDto**
- `title`: string, required, min 5 chars.
- `content`: string, required.
- `summary`: string, optional.
- `coverImage`: string, optional (URL format).
- `categoryId`: number, required.
- `tags`: number[] (Array of Tag IDs), optional.
- `status`: Enum (DRAFT, PUBLISHED), optional.

### **UpdateBlogDto**
- Partial of `CreateBlogDto`.

### **BlogResponseDto**
- Should include the full `author` object (sans password) and `category` name to avoid extra frontend calls.

---

## 6. Implementation Steps
1.  **Entity**: Define the `Blog` entity with all columns and relations.
2.  **DTOs**: Create validation classes.
3.  **Service**:
    - Implement `create` (handle slug generation).
    - Implement `findAll` (with pagination & filtering).
    - Implement `findOne` (increment views).
    - Implement `update`/`remove` (check ownership).
4.  **Controller**: Set up routes and apply `@UseGuards(JwtGuard)` and `@Roles()` where appropriate.
5.  **Module**: Register `TypeOrmModule.forFeature([Blog])`.
