const express = require('express');
const multer = require('multer');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 12; // Secure salt rounds for bcrypt

const app = express();
const PORT = 3000;
const DATA_DIR = 'data';
const UPLOADS_DIR = 'public/uploads';

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Secure session configuration
app.use(session({
    secret: 'international-affairs-secret-key-2024-change-this-in-production!',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS in production
        httpOnly: true, // Prevents access to cookie via JavaScript
        sameSite: 'strict', // Prevents CSRF attacks
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Storage configuration for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Data files
const DATA_FILES = {
    users: 'data/users.json',
    announcements: 'data/announcements.json',
    events: 'data/events.json',
    welfare: 'data/welfare.json',
    inbox: 'data/inbox.json',
    buses: 'data/buses.json'
};

// Initialize data files if they don't exist
async function initDataFiles() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR);
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR);
    }

    // Users with hashed passwords
    if (!fs.existsSync(DATA_FILES.users)) {
        const initialUsers = [];
        // Create 12 admin accounts
        for (let i = 1; i <= 12; i++) {
            const hashedPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
            initialUsers.push({
                id: i,
                username: i === 1 ? 'admin' : `admin${i}`,
                password: hashedPassword,
                role: 'admin'
            });
        }
        fs.writeFileSync(DATA_FILES.users, JSON.stringify(initialUsers, null, 2));
    }

    // Other initial data
    if (!fs.existsSync(DATA_FILES.announcements)) {
        const initialAnnouncements = [
            { id: 1, title: 'Welcome to the Committee Portal', description: 'This is the new portal for Ministry of International Affairs committee members.', date: new Date().toISOString(), image: null }
        ];
        fs.writeFileSync(DATA_FILES.announcements, JSON.stringify(initialAnnouncements, null, 2));
    }
    if (!fs.existsSync(DATA_FILES.events)) {
        const initialEvents = [
            { id: 1, title: 'Annual International Summit', description: 'Join us for the annual international affairs summit.', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), image: null }
        ];
        fs.writeFileSync(DATA_FILES.events, JSON.stringify(initialEvents, null, 2));
    }
    if (!fs.existsSync(DATA_FILES.welfare)) {
        fs.writeFileSync(DATA_FILES.welfare, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(DATA_FILES.inbox)) {
        const initialInbox = [
            { id: 1, title: 'Portal Update', message: 'The committee portal has been updated with new features.', date: new Date().toISOString() }
        ];
        fs.writeFileSync(DATA_FILES.inbox, JSON.stringify(initialInbox, null, 2));
    }
    if (!fs.existsSync(DATA_FILES.buses)) {
        const initialBuses = [
            { id: 1, title: 'Airport Shuttle', description: 'Daily shuttle from the main international airport to the ministry headquarters.', time: '08:00', route: 'Airport → Headquarters', date: new Date().toISOString(), image: null },
            { id: 2, title: 'Hotel Shuttle', description: 'Shuttle service from partner hotels to conference venues.', time: '09:00', route: 'Grand Hotel → Conference Center', date: new Date().toISOString(), image: null },
            { id: 3, title: 'Evening Return', description: 'Return service after official meetings.', time: '17:30', route: 'Headquarters → Airport / Hotels', date: new Date().toISOString(), image: null }
        ];
        fs.writeFileSync(DATA_FILES.buses, JSON.stringify(initialBuses, null, 2));
    }
}

// Read data from JSON files
function readData(file) {
    try {
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
}

// Write data to JSON files
function writeData(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Routes

// Check login status
app.get('/api/check-login', (req, res) => {
    if (req.session.user) {
        res.json({ loggedIn: true, user: req.session.user });
    } else {
        res.json({ loggedIn: false });
    }
});

// Login with password verification using bcrypt
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const users = readData(DATA_FILES.users);
        const user = users.find(u => u.username === username);
        
        if (user && await bcrypt.compare(password, user.password)) {
            req.session.user = { id: user.id, username: user.username, role: user.role };
            res.json({ success: true, user: req.session.user });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.json({ success: false });
    }
});

// Sign Up with password hashing using bcrypt
app.post('/api/signup', async (req, res) => {
    try {
        const { username, password, confirmPassword } = req.body;
        
        if (password !== confirmPassword) {
            return res.json({ success: false, message: 'Passwords do not match' });
        }
        
        const users = readData(DATA_FILES.users);
        const existingUser = users.find(u => u.username === username);
        
        if (existingUser) {
            return res.json({ success: false, message: 'Username already exists' });
        }
        
        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        
        const newUser = {
            id: Date.now(),
            username,
            password: hashedPassword,
            role: 'member' // Default to member, admins are predefined
        };
        
        users.push(newUser);
        writeData(DATA_FILES.users, users);
        
        req.session.user = { id: newUser.id, username: newUser.username, role: newUser.role };
        res.json({ success: true, user: req.session.user });
    } catch (error) {
        console.error('Signup error:', error);
        res.json({ success: false, message: 'Internal server error' });
    }
});

// Logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Change Password (logged in user)
app.post('/api/change-password', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.json({ success: false, message: 'Not logged in' });
        }
        
        const { oldPassword, newPassword, confirmNewPassword } = req.body;
        
        if (newPassword !== confirmNewPassword) {
            return res.json({ success: false, message: 'New passwords do not match' });
        }
        
        const users = readData(DATA_FILES.users);
        const userIndex = users.findIndex(u => u.id === req.session.user.id);
        
        if (userIndex === -1) {
            return res.json({ success: false, message: 'User not found' });
        }
        
        const passwordMatch = await bcrypt.compare(oldPassword, users[userIndex].password);
        if (!passwordMatch) {
            return res.json({ success: false, message: 'Current password is incorrect' });
        }
        
        // Hash and update new password
        users[userIndex].password = await bcrypt.hash(newPassword, SALT_ROUNDS);
        writeData(DATA_FILES.users, users);
        
        res.json({ success: true, message: 'Password changed successfully!' });
    } catch (error) {
        console.error('Change password error:', error);
        res.json({ success: false, message: 'Internal server error' });
    }
});

// Reset Password (admin only)
app.post('/api/reset-password', async (req, res) => {
    try {
        if (!req.session.user || req.session.user.role !== 'admin') {
            return res.json({ success: false, message: 'Unauthorized' });
        }
        
        const { resetUsername, newResetPassword } = req.body;
        const users = readData(DATA_FILES.users);
        const userIndex = users.findIndex(u => u.username === resetUsername);
        
        if (userIndex === -1) {
            return res.json({ success: false, message: 'User not found' });
        }
        
        // Hash and update new password
        users[userIndex].password = await bcrypt.hash(newResetPassword, SALT_ROUNDS);
        writeData(DATA_FILES.users, users);
        
        res.json({ success: true, message: 'Password reset successfully!' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.json({ success: false, message: 'Internal server error' });
    }
});

// Change Username (logged in user)
app.post('/api/change-username', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.json({ success: false, message: 'Not logged in' });
        }
        
        const { newUsername, currentPassword } = req.body;
        const users = readData(DATA_FILES.users);
        const userIndex = users.findIndex(u => u.id === req.session.user.id);
        
        if (userIndex === -1) {
            return res.json({ success: false, message: 'User not found' });
        }
        
        // Check current password
        const passwordMatch = await bcrypt.compare(currentPassword, users[userIndex].password);
        if (!passwordMatch) {
            return res.json({ success: false, message: 'Current password is incorrect' });
        }
        
        // Check if new username exists
        const existingUser = users.find(u => u.username === newUsername && u.id !== req.session.user.id);
        if (existingUser) {
            return res.json({ success: false, message: 'Username already exists' });
        }
        
        // Update username
        users[userIndex].username = newUsername;
        writeData(DATA_FILES.users, users);
        
        // Update session
        req.session.user.username = newUsername;
        
        res.json({ success: true, message: 'Username changed successfully!', user: req.session.user });
    } catch (error) {
        console.error('Change username error:', error);
        res.json({ success: false, message: 'Internal server error' });
    }
});

// Get announcements
app.get('/api/announcements', (req, res) => {
    const announcements = readData(DATA_FILES.announcements);
    res.json(announcements);
});

// Get events
app.get('/api/events', (req, res) => {
    const events = readData(DATA_FILES.events);
    res.json(events);
});

// Get buses
app.get('/api/buses', (req, res) => {
    const buses = readData(DATA_FILES.buses);
    res.json(buses);
});

// Get welfare concerns
app.get('/api/welfare', (req, res) => {
    const welfare = readData(DATA_FILES.welfare);
    res.json(welfare);
});

// Submit welfare concern
app.post('/api/welfare', (req, res) => {
    console.log('Received welfare concern:', req.body);
    try {
        const welfare = readData(DATA_FILES.welfare);
        console.log('Current welfare data:', welfare);
        const newConcern = {
            id: Date.now(),
            title: req.body.title,
            description: req.body.description,
            date: new Date().toISOString()
        };
        welfare.unshift(newConcern);
        writeData(DATA_FILES.welfare, welfare);
        console.log('Welfare data saved');
        
        const inbox = readData(DATA_FILES.inbox);
        inbox.unshift({
            id: Date.now(),
            title: 'New Welfare Concern',
            message: `A new welfare concern has been submitted: ${req.body.title}`,
            date: new Date().toISOString()
        });
        writeData(DATA_FILES.inbox, inbox);
        console.log('Inbox updated');
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error processing welfare concern:', error);
        res.json({ success: false, error: error.message });
    }
});

// Get inbox
app.get('/api/inbox', (req, res) => {
    const inbox = readData(DATA_FILES.inbox);
    res.json(inbox);
});

// Upload (admin only)
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.json({ success: false, message: 'Unauthorized' });
    }
    
    const { type, title, description, date, time, route } = req.body;
    const image = req.file ? req.file.filename : null;
    
    if (type === 'announcement') {
        const announcements = readData(DATA_FILES.announcements);
        announcements.unshift({
            id: Date.now(),
            title,
            description,
            date: new Date().toISOString(),
            image
        });
        writeData(DATA_FILES.announcements, announcements);
    } else if (type === 'event') {
        const events = readData(DATA_FILES.events);
        events.unshift({
            id: Date.now(),
            title,
            description,
            date: date ? new Date(date).toISOString() : new Date().toISOString(),
            image
        });
        writeData(DATA_FILES.events, events);
    } else if (type === 'bus') {
        const buses = readData(DATA_FILES.buses);
        buses.unshift({
            id: Date.now(),
            title,
            description,
            time: time || '08:00',
            route: route || 'Not specified',
            date: new Date().toISOString(),
            image
        });
        writeData(DATA_FILES.buses, buses);
    } else if (type === 'welfare') {
        const welfare = readData(DATA_FILES.welfare);
        welfare.unshift({
            id: Date.now(),
            title,
            description,
            date: new Date().toISOString(),
            image
        });
        writeData(DATA_FILES.welfare, welfare);
    } else if (type === 'inbox') {
        const inbox = readData(DATA_FILES.inbox);
        inbox.unshift({
            id: Date.now(),
            title,
            message: description,
            date: new Date().toISOString(),
            image
        });
        writeData(DATA_FILES.inbox, inbox);
    }
    
    res.json({ success: true });
});

// Delete endpoints (admin only)
app.delete('/api/announcements/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.json({ success: false, message: 'Unauthorized' });
    }
    
    let announcements = readData(DATA_FILES.announcements);
    announcements = announcements.filter(a => a.id !== parseInt(req.params.id));
    writeData(DATA_FILES.announcements, announcements);
    res.json({ success: true });
});

app.delete('/api/events/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.json({ success: false, message: 'Unauthorized' });
    }
    
    let events = readData(DATA_FILES.events);
    events = events.filter(e => e.id !== parseInt(req.params.id));
    writeData(DATA_FILES.events, events);
    res.json({ success: true });
});

app.delete('/api/buses/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.json({ success: false, message: 'Unauthorized' });
    }
    
    let buses = readData(DATA_FILES.buses);
    buses = buses.filter(b => b.id !== parseInt(req.params.id));
    writeData(DATA_FILES.buses, buses);
    res.json({ success: true });
});

app.delete('/api/welfare/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.json({ success: false, message: 'Unauthorized' });
    }
    
    let welfare = readData(DATA_FILES.welfare);
    welfare = welfare.filter(w => w.id !== parseInt(req.params.id));
    writeData(DATA_FILES.welfare, welfare);
    res.json({ success: true });
});

app.delete('/api/inbox/:id', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.json({ success: false, message: 'Unauthorized' });
    }
    
    let inbox = readData(DATA_FILES.inbox);
    inbox = inbox.filter(i => i.id !== parseInt(req.params.id));
    writeData(DATA_FILES.inbox, inbox);
    res.json({ success: true });
});

// Initialize data and start server
initDataFiles().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error('Error initializing server:', error);
});
