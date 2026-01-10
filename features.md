# Features Documentation

## 1. Authentication
- **Secure Login & Signup**: JWT-based authentication with password hashing (Bcrypt).
    - *Implementation*: `authController.js` handles logic. `bcryptjs` salts and hashes passwords.
- **Session Management**: User tokens are stored securely.
    - *Implementation*: `jsonwebtoken` generates tokens, stored in local storage/HTTP headers. `protect` middleware verifies them.
- **Quick Login**: Pre-configured test accounts (Alice/Bob) for rapid development testing.

## 2. Dashboard Interface
### Navbar
- **Responsive Navigation**: Adapts to mobile and desktop screens.
    - *Implementation*: Flexbox with `hidden` and `block` classes based on Tailwind breakpoints (`md:`).
- **User Profile**: Displays user initials with a dynamic gradient background.
    - *Implementation*: Helper function extracts initials from `userInfo.name` stored in localStorage.

### Sidebars (Resizable)
- **Drag-to-Resize**: Both the File Explorer and Chat sidebars can be resized.
    - *Implementation*: `Dashboard.jsx` uses `mousedown` listeners on global `window` to track cursor movement and update `width` state.
- **File Explorer (Left)**: Recursive tree structure.
    - *Implementation*: `FileExplorer.jsx` fetches flat data from MongoDB and constructs a tree. `FileItem` component recursively calls itself for folders.

### Main Workspace (Middle Area)
- **Dual View Support**: Switch seamlessly between **Code Editor** and **Canvas** modes.
    - *Implementation*: Conditional rendering in React based on `activeView` state ('editor' | 'canvas').
- **Canvas View**: Whiteboard area.
    - *Implementation*: HTML5 Canvas API (or upcoming library integration).
- **Code Editor View**: Syntax-highlighted editor.
    - *Implementation*: `CodeEditor.jsx` wrappers around `<textarea>` or usage of `monaco-editor`/`codemirror` (planned/basic version).

### File Management
- **File & Folder Operations**: Create, delete, and rename.
    - *Implementation*: REST API endpoints (`/api/files`) using Mongoose. `File` model stores strict `parentId` references for hierarchy.
- **Extension validation**: Enforces strict file extensions: `.java`, `.py`, `.c`, `.cpp`, `.txt`.
    - *Implementation*: Frontend regex/split check in `handleCreate`. Backend validation can also be added.
- **Smart Icons**: Displays specific icons for supported file types.
    - *Implementation*: `lucide-react` icons mapped based on file extension parsing.
- **Drag-and-Drop Organization**: Move files/folders.
    - *Implementation*: Native HTML5 DnD API (`draggable`, `onDragStart`, `onDrop`). `updateFile` endpoint handles the `parentId` change.

## 3. UI/UX Enhancements
- **Dark Mode Support**: Fully integrated dark theme.
    - *Implementation*: Tailwind's `dark:` modifier. State persisted in `localStorage`.
- **Responsive Design**: Mobile drawers and adaptive layout.
    - *Implementation*: Absolute positioning for drawers on mobile (`z-index`), Flexbox for column layout.
