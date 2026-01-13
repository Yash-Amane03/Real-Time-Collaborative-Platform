# Project Architecture & Documentation

## 1. Architecture Diagram
The application follows the **MERN Stack** architecture (Monolithic Repo structure).

```mermaid
graph TD
    Client["Frontend (React + Vite)"] <-->|HTTP REST| API["Backend API (Express)"]
    Client <-->|WebSocket| Socket["Socket.IO Server"]
    API <--> DB[("MongoDB Database")]
    Socket <--> API
    
    subgraph Frontend
        UI[UI Components]
        State[State Management (React Hooks)]
        Router[React Router]
        Canvas[Infinite Canvas Engine]
        SocketClient[Socket Client]
    end
    
    subgraph Backend
        Auth[Auth Controller]
        FileSys[File Controller]
        GroupSys[Group Controller]
        Models[Mongoose Models]
        SocketHandler[Socket Event Handlers]
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

### Group Collection
| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier |
| `name` | String | Group Name |
| `host` | ObjectId | Reference to User (Host) |
| `members` | Array<ObjectId> | List of User References |
| `drawingPermission` | Boolean | Host permission control (Default: true) |
| `createdAt` | Date | Timestamp |

### File Collection
| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier |
| `user` | ObjectId | Reference to User (Owner) |
| `name` | String | File/Folder name |
| `type` | String | 'file' or 'folder' |
| `parentId` | ObjectId | Reference to parent Folder (null for root) |
| `content` | String | File content (text) |
| `createdAt` | Date | Timestamp |

## 3. Implemented Features
-   **Authentication**: JWT + Bcrypt for secure login/signup.
-   **Advanced Code Editor**:
    -   **Monaco Engine**: Professional editing experience.
    -   **Multi-Language**: Support for JS, Python, Java, C, C++.
    -   **File Isolation**: State management for unsaved edits.
    -   **UI**: VS Code-style tabs and responsive drawer.
-   **File System**:
    -   CRUD operations for files and folders.
    -   Recursive structure.
    -   Drag and Drop organization.
-   **Infinite Canvas**:
    -   Vector-based drawing engine (Pencil, Shapes, Text).
    -   **Real-Time Collaboration**: Multi-user sync, live cursors, and host permissions.
    -   Selection, Drag-to-Move, Pan, and Zoom.
    -   Mobile-responsive toolbar with auto-hide logic.
-   **Communication**:
    -   Real-time chat using Socket.IO.
    -   Private Groups and Direct Messages.
    -   Persistent chat history stored in MongoDB.
-   **UI/UX**:
    -   Glassmorphism (Frosted glass effects).
    -   Responsive Layout (Mobile/Desktop adaptive).
    -   Resizable Sidebars (Drag handle).
