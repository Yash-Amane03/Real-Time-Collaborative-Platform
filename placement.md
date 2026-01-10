# Project Architecture & Documentation

## 1. Architecture Diagram
The application follows the **MERN Stack** architecture (Monolithic Repo structure).

```mermaid
graph TD
    Client[Frontend (React + Vite)] <--> API[Backend API (Express)]
    API <--> DB[(MongoDB Database)]
    
    subgraph Frontend
        UI[UI Components]
        State[State Management]
        Router[React Router]
    end
    
    subgraph Backend
        Auth[Auth Controller]
        FileSys[File Controller]
        Models[Mongoose Models]
    end
```

## 2. Database Schema (MongoDB)

### User Collection
| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier |
| `name` | String | User's full name |
| `email` | String | User's email (Unique) |
| `password` | String | Hashed password (Bcrypt) |
| `createdAt` | Date | Timestamp |

### File Collection
| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier |
| `user` | ObjectId | Reference to User |
| `name` | String | File or Folder name |
| `type` | String | 'file' or 'folder' |
| `parentId` | ObjectId | Reference to parent Folder (null for root) |
| `content` | String | File content (empty for folders) |
| `createdAt` | Date | Timestamp |

## 3. API Routes

### Authentication (`/api/users`)
- `POST /` - Register a new user.
- `POST /login` - Authenticate user & get JWT.

### File Management (`/api/files`)
- `GET /` - Fetch all files/folders for the logged-in user.
- `POST /` - Create a new file or folder.
    - Body: `{ name, type, parentId }`
- `PUT /:id` - Update file content, rename, or move (DnD).
    - Body: `{ name, content, parentId }`
- `DELETE /:id` - Delete a file or folder (and its children).

## 4. Application Flow

1.  **Authentication**: User logs in/registers. JWT is stored.
2.  **Dashboard Load**: Client fetches user's file structure from `/api/files`.
3.  **File Explorer**:
    -   Recursive tree renders files/folders.
    -   **Drag & Drop**: Users can move files into folders or to the root using HTML5 DnD.
    -   **Creation**: Users create files (strict extension validation: .java, .py, .c, .cpp, .txt).
4.  **Editing**:
    -   Clicking a file loads its content into the central **Code Editor**.
    -   Dual View allows switching between Code and Canvas.

## 5. Implemented Features
-   **Secure Auth**: JWT + Bcrypt.
-   **Dynamic File Explorer**: Recursive folder structure with Drag-and-Drop capability.
-   **Strict Validation**: File creation enforced to specific programming extensions.
-   **Resizable Layout**: draggable sidebars for custom workspace setup.
-   **Theme Support**: Dark/Light mode toggle.
