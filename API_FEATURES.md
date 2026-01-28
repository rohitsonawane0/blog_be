# 🚀 API Features Specification

This document outlines the complete feature set of the Blog Backend API.

## 🔐 Authentication & Security (Implemented)
*   **User Registration:** allow new users to sign up (`POST /auth/register`).
*   **Secure Login:** JWT-based authentication using **Access Tokens** (short-lived) and **Refresh Tokens** (long-lived, stored in HttpOnly cookies).
*   **Token Management:**
    *   **Silent Refresh:** Automatically get new access tokens without user intervention (`POST /auth/refresh`).
    *   **Secure Logout:** Serverside invalidation of functionality by clearing cookies (`POST /auth/logout`).
*   **Profile Management:**
    *   Get current user profile (`GET /auth/me`).
    *   Change Password (`POST /auth/change-password`).
*   **RBAC (Role-Based Access Control):** Granular permissions distinguishing between `Admin` and `User` roles using custom Guards.

## 👤 User Management (Implemented)
*   **Admin Controls:**
    *   View all users.
    *   Create users manually.
    *   Delete users (Soft Delete mechanism to retain data history).
*   **Profile Management:** Users can view and update their own profiles.
*   **Data Privacy:** Automatic exclusion of sensitive fields (passwords) from API responses.

## 📝 Blog Posts (Core Features)
*   **CRUD Operations:** Create, Read, Update, and Delete blog posts.
*   **Publishing Workflow:** Draft vs. Published states.
*   **Rich Content:** Support for titles, content, excerpts, and featured images.
*   **Discovery:**
    *   Pagination support.
    *   Filtering by Author, Category, or Tags.
    *   Search functionality.
*   **Slug Generation:** SEO-friendly URLs for posts.

## 💬 Comments System
*   **Engagement:** Authenticated users can comment on blog posts.
*   **Moderation:**
    *   Admins can delete inappropriate comments.
    *   Users can delete their own comments.

## 🏷️ Content Organization
### Categories
*   Hierarchical or flat organization structure.
*   Create/Edit/Delete categories (Admin only).
*   View posts by category.

### Tags
*   Flexible tagging system for posts.
*   Many-to-Many relationship with posts.

## 🛠️ Technical Features
*   **Global Exception Handling:** Standardized error responses across the API.
*   **Response Transformation:** Uniform JSON response structure (e.g., `{ data: ..., status: true }`).
*   **Validation:** Strict input validation using DTOs to ensure data integrity.
*   **Database:** PostgreSQL with TypeORM for robust data management.
