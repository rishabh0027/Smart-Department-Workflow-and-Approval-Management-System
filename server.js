<<<<<<< HEAD
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

// 2. App init
const app = express();
const PORT = 3000;

// 3. Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use((req, res, next) => {
    res.locals.message = req.session?.message;
    if (req.session) delete req.session.message;
    next();
});

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 4. Models

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'Student' }
});
const User = mongoose.model('User', userSchema);

const requestSchema = new mongoose.Schema({
    title: String,
    description: String,
    status: { type: String, default: 'Pending Mentor' },
    currentStage: { type: String, default: 'Mentor' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});
const Request = mongoose.model('Request', requestSchema);

//  Auth Middleware
function requireLogin(req, res, next) {
    if (!req.session.userId) return res.redirect('/login');
    next();
}

// Home
app.get('/', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    res.render('index');
});

// Login
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Register
app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// DASHBOARD
app.get('/dashboard', requireLogin, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        if (!user) {
            req.session.destroy(() => res.redirect('/login'));
            return;
        }

        let requests = [];

        if (user.role === 'Student') {
            requests = await Request.find({ owner: user._id });
        }
        else if (user.role === 'Mentor') {
            requests = await Request.find({
                currentStage: { $in: ['Mentor', 'HOD', 'Done'] }
            })
                .populate('owner');
        }
        else if (user.role === 'HOD') {
            requests = await Request.find({
                currentStage: { $in: ['Mentor', 'HOD', 'Done'] }
            })
                .populate('owner');
        }

        const formatted = requests.map(r => ({
            _id: r._id,
            title: r.title,
            description: r.description,
            status: r.status,
            currentStage: r.currentStage,
            ownerName: r.owner?.name || user.name,
            ownerEmail: r.owner?.email || user.email,
            createdAt: r.createdAt
        }));

        res.render('dashboard', {
            user,
            requests: formatted
        });
    } catch (err) {
        console.error(err);
        res.redirect('/login');
    }
});

//  CREATE REQUEST
app.post('/request/create', requireLogin, async (req, res) => {
    try {
        const { title, description } = req.body;

        const newRequest = new Request({
            title,
            description,
            owner: req.session.userId,
            status: 'Pending Mentor',
            currentStage: 'Mentor'
        });

        await newRequest.save();
        req.session.message = "Request sent to Mentor";

        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

//  APPROVE / REJECT
app.post('/request/action', requireLogin, async (req, res) => {
    try {
        const { requestId, action } = req.body;

        const request = await Request.findById(requestId);
        const user = await User.findById(req.session.userId);

        if (!request) return res.redirect('/dashboard');
        if (!user) return res.redirect('/login');

        if (user.role === 'Mentor' && request.currentStage === 'Mentor') {
            if (action === 'approve') {
                request.currentStage = 'HOD';
                request.status = 'Pending HOD';
                req.session.message = "Request forwarded to HOD";
            } else {
                request.status = 'Rejected';
                request.currentStage = 'Done';
                req.session.message = "Request rejected by Mentor";
            }
        }

        else if (user.role === 'HOD' && request.currentStage === 'HOD') {
            if (action === 'approve') {
                request.status = 'Approved';
                request.currentStage = 'Done';
                req.session.message = "Request approved successfully";
            } else {
                request.status = 'Rejected';
                request.currentStage = 'Done';
                req.session.message = "Request rejected by HOD";
            }
        }

        await request.save();

        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

//  REGISTER 
app.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body; 

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('register', { error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await new User({
            name,
            email,
            password: hashedPassword,
            role 
        }).save();

        res.redirect('/login');

    } catch (err) {
        console.error(err);
        res.render('register', { error: "Something went wrong" });
    }
});

// LOGIN
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.render('login', { error: "Invalid credentials" });
        }

        req.session.userId = user._id;

        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        res.render('login', { error: "Something went wrong" });
    }
});

// LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

// Start Server
async function startServer() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/smart-department");
        console.log("✅ Database Connected");

        app.listen(PORT, () => {
            console.log(`🚀 http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

=======
// 1. Imports
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');

// 2. App init
const app = express();
const PORT = 3000;

// 3. Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 4. Models

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, default: 'Student' }
});
const User = mongoose.model('User', userSchema);

const requestSchema = new mongoose.Schema({
    title: String,
    description: String,
    status: { type: String, default: 'Pending Mentor' },
    currentStage: { type: String, default: 'Mentor' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});
const Request = mongoose.model('Request', requestSchema);

// 🔐 Auth Middleware
function requireLogin(req, res, next) {
    if (!req.session.userId) return res.redirect('/login');
    next();
}

// Home
app.get('/', (req, res) => {
    if (req.session.userId) return res.redirect('/dashboard');
    res.render('index');
});

// Login
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Register
app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// 🔥 DASHBOARD
app.get('/dashboard', requireLogin, async (req, res) => {
    const user = await User.findById(req.session.userId);

    let requests = [];

    if (user.role === 'Student') {
        requests = await Request.find({ owner: user._id });
    }
    else if (user.role === 'Mentor') {
        requests = await Request.find({ currentStage: 'Mentor' })
            .populate('owner');
    }
    else if (user.role === 'HOD') {
        requests = await Request.find({ currentStage: 'HOD' })
            .populate('owner');
    }

    const formatted = requests.map(r => ({
        _id: r._id,
        title: r.title,
        description: r.description,
        status: r.status,
        currentStage: r.currentStage,
        ownerName: r.owner?.name || user.name,
        createdAt: r.createdAt
    }));

    res.render('dashboard', {
        user,
        requests: formatted
    });
});

// 🔥 CREATE REQUEST
app.post('/request/create', requireLogin, async (req, res) => {
    try {
        const { title, description } = req.body;

        const newRequest = new Request({
            title,
            description,
            owner: req.session.userId,
            status: 'Pending Mentor',
            currentStage: 'Mentor'
        });

        await newRequest.save();

        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// 🔥 APPROVE / REJECT
app.post('/request/action', requireLogin, async (req, res) => {
    try {
        const { requestId, action } = req.body;

        const request = await Request.findById(requestId);
        const user = await User.findById(req.session.userId);

        if (!request) return res.redirect('/dashboard');

        if (user.role === 'Mentor' && request.currentStage === 'Mentor') {
            if (action === 'approve') {
                request.currentStage = 'HOD';
                request.status = 'Pending HOD';
            } else {
                request.status = 'Rejected';
                request.currentStage = 'Done';
            }
        }

        else if (user.role === 'HOD' && request.currentStage === 'HOD') {
            if (action === 'approve') {
                request.status = 'Approved';
                request.currentStage = 'Done';
            } else {
                request.status = 'Rejected';
                request.currentStage = 'Done';
            }
        }

        await request.save();

        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// 🔥 REGISTER (FIXED HERE)
app.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body; // ✅ FIX

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('register', { error: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await new User({
            name,
            email,
            password: hashedPassword,
            role // ✅ FIX
        }).save();

        res.redirect('/login');

    } catch (err) {
        console.error(err);
        res.render('register', { error: "Something went wrong" });
    }
});

// LOGIN
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.render('login', { error: "Invalid credentials" });
        }

        req.session.userId = user._id;

        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        res.render('login', { error: "Something went wrong" });
    }
});

// LOGOUT
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login'));
});

// Start Server
async function startServer() {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/smart-department");
        console.log("✅ Database Connected");

        app.listen(PORT, () => {
            console.log(`🚀 http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error("❌ Error:", err.message);
    }
}

>>>>>>> b309a6394068bf51600e5eb0e4e6c34411a91637
startServer();