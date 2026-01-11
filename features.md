# Features Documentation

## 1. Authentication
- **Secure Login & Signup**: JWT-based authentication with password hashing (Bcrypt).
    - *Implementation*: `authController.js` handles logic.
    - **Frontend**: Protected Routes wrapper ensures only authenticated users access the Dashboard.
    ```javascript
    // Verify password during login
    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({ _id: user.id, token: generateToken(user.id) });
    }
    ```
- **Session Management**: User tokens are stored securely in `localStorage`.

## 2. Dashboard Interface
### Navbar & Resizable Sidebars
- **Responsive Navigation**: Adapts to mobile and desktop screens.
    - *Implementation*: Tailwind CSS classes (`hidden md:flex`) show/hide elements. Mobile drawers use `fixed inset-0` with transitions.
- **Drag-to-Resize**: Sidebars can be resized by dragging the edge.
    - *Implementation*: Mouse event listeners (`mousemove`, `mouseup`) update width state dynamically.

### Main Workspace
- **Dual View Support**: Seamlessly switch between **Code Editor** and **Canvas**.
    - *Logic*: Conditional rendering based on `activeView` state.
    ```javascript
    {activeView === 'editor' ? <CodeEditor /> : <Canvas />}
    ```
- **File Path Breadcrumbs**: Displays full directory path in editor header using recursive parent traversal.

### 3. Infinite Canvas (Whiteboard)
- **Infinite Space**: Pan and Zoom support with a dynamic dot grid.
    - *Math*: `screenToWorld` and `worldToScreen` transformation functions handle coordinate mapping based on `offset` (pan) and `scale` (zoom).
- **Vector-Based Rendering**: Shapes are stored as state objects (`{ type, x1, y1, ... }`) and re-rendered on the HTML5 Canvas 2D context.
    - *Optimization*: Uses `requestAnimationFrame` (via React render cycle) to only re-draw when state changes.
- **Tools**:
    - **Pencil/Eraser**: Freehand drawing using array of points.
    - **Shapes**: Rectangle, Circle, Line using mathematical geometry.
    - **Text**: Interactive text overlay that commits to canvas on blur/enter.
    - **Selection**: Hit-testing algorithms (`isWithinElement`) detect clicks on vector shapes for moving/editing.
- **Mobile Responsive Toolbar**:
    - **Auto-Hide**: Toolbar automatically hides on tool selection (Mobile) to maximize drawing space.
    - **Bottom Layout**: Toolkit positioned at bottom-screen for thumb accessibility on phones.

### 4. Real-Time Collaboration (New)
- **Multi-User Sync**:
    - **Drawing**: Instant replication of strokes and shapes across all connected clients in the room using Socket.IO `canvas_update` events.
        ```javascript
        socket.emit('canvas_update', { roomId, element: newElement, action: 'add' });
        ```
    - **Action Sync**: Synchronized `Undo`, `Redo`, and `Clear` actions ensure all users view the same canvas state.
        ```javascript
        socket.emit('canvas_action', { roomId, action: 'undo' });
        ```
- **Presence**:
    - **Live Cursors**: Visual tracking of other users' mouse movements with their real names displayed.
        ```javascript
        socket.emit('cursor_move', { roomId, userId, userName, x, y });
        ```
    - **Auto-Cleanup**: Cursors are automatically removed when a user disconnects or leaves the room.
- **Host Controls**:
    - **Permissions**: Group hosts can "Lock" the canvas, disabling drawing tools for all other members.
        ```javascript
        socket.emit('toggle_permission', { roomId, canDraw: newPermission });
        ```
    - **UI Indicators**: Toolbar shows a Lock/Unlock icon for hosts; members receive alerts if they try to draw while locked.

## 5. File Management system
- **File Operations**: Create/Delete/Rename/Read via REST API.
- **Drag-and-Drop**: Built using HTML5 DnD API to move files into folders or update directory structure.
    - *Backend*: Updates `parentId` in MongoDB.

## 6. Communication Features
- **Real-Time Chat**: Socket.IO integration for instant messaging.
- **Room Management**:
    - **Groups**: Persistent group chats stored in MongoDB.
    - **Direct Messages**: Dynamic rooms generated using sorted user IDs (`userA_userB`).
- **Access Control**: Backend strictly validates that a requesting user is a member of the group or DM before returning chat history.

## 7. Security
- **RBAC**: Middleware checks User ID against Group Members array.
- **Protected Routes**: API endpoints require valid Bearer token.
