# Features Documentation

## 1. Authentication
- **Secure Login & Signup**: JWT-based authentication with password hashing (Bcrypt).
    - *Implementation*: `authController.js` handles logic.
    ```javascript
    // Verify password during login
    if (user && (await bcrypt.compare(password, user.password))) {
        res.json({ _id: user.id, token: generateToken(user.id) });
    }
    ```
- **Session Management**: User tokens are stored securely.
    - *Implementation*: Stored in `localStorage`.
    ```javascript
    // Frontend: Store User Info
    localStorage.setItem('userInfo', JSON.stringify(data));
    ```

## 2. Dashboard Interface
### Navbar & Sidebars
- **Responsive Navigation**: Adapts to mobile and desktop screens.
    - *Implementation*: Tailwind classes `hidden md:flex` for desktop, `fixed inset-0` for mobile drawers.
- **Drag-to-Resize**: Resizable sidebars.
    - *Implementation*:
    ```javascript
    const startResizing = (mouseDown) => {
        const startX = mouseDown.clientX;
        const doDrag = (e) => setWidth(startWidth + (e.clientX - startX));
        document.addEventListener('mousemove', doDrag);
    };
    ```

### Main Workspace
- **Dual View Support**: Switch between Code Editor and Canvas.
    - *Implementation*:
    ```javascript
    {activeView === 'editor' ? <CodeEditor /> : <Canvas />}
    ```

### File Management
- **File Operations**: Create/Delete/Rename via API.
    - *Implementation*:
    ```javascript
    // Service: Create File
    await axios.post('/api/files', { name, type: 'file', parentId });
    ```
- **Drag-and-Drop**: HTML5 Draggable API.
    - *Implementation*:
    ```javascript
    <div draggable onDragStart={(e) => e.dataTransfer.setData("fileId", file._id)}>
        {file.name}
    </div>
    ```

## 4. Communication Features
- **Real-Time Chat**: Socket.IO integration.
    - *Implementation*:
    ```javascript
    // Frontend: Listen for messages
    useEffect(() => {
        socket.on('receive_message', (msg) => setMessages(prev => [...prev, msg]));
    }, []);
    ```
- **Group Management**: MongoDB Group Schema.
    - *Implementation*:
    ```javascript
    const GroupSchema = new Schema({
        name: String,
        host: { type: ObjectId, ref: 'User' },
        members: [{ type: ObjectId, ref: 'User' }]
    });
    ```
- **Direct Messages**: Unique Room ID generation.
    - *Implementation*: `roomId = [uid1, uid2].sort().join('_')` ensures consistence.

## 5. Security & Privacy
- **Role-Based Access Control (RBAC)**: Strict server-side validation ensures only group members can access chat history.
    - *Implementation*: Middleware checks user ID against Group Members array before returning messages.
    ```javascript
    // Backend: Verify Group Membership
    const isMember = group.members.includes(req.user._id);
    if (!isMember) return res.status(403).json({ message: 'Forbidden' });
    ```
- **Private Direct Messages**: DM Access is strictly limited to the two participants.
    - *Implementation*: Composite Room ID validation (`user1_user2`) prevents unauthorized access.
    ```javascript
    // Backend: Verify DM Participants
    const participants = roomId.split('_');
    if (!participants.includes(req.user._id.toString())) {
        return res.status(403).json({ message: 'Unauthorized' });
    }
    ```
- **Protected Routes**: All API endpoints require valid JWT authentication.
    - *Implementation*: `authMiddleware.js` verifies tokens on every request.
    ```javascript
    // Middleware: Protect Route
    const protect = asyncHandler(async (req, res, next) => {
        if (req.headers.authorization?.startsWith('Bearer')) {
             token = req.headers.authorization.split(' ')[1];
             const decoded = jwt.verify(token, process.env.JWT_SECRET);
             req.user = await User.findById(decoded.id).select('-password');
             next();
        }
    });
    ```
