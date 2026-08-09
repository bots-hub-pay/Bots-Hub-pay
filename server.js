const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// CORS CONFIGURATION
// ============================================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.options('*', cors());

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(__dirname));

// Log all requests
app.use((req, res, next) => {
    console.log(`📝 ${req.method} ${req.url}`);
    next();
});

const DB_PATH = path.join(__dirname, 'database.json');

// ============================================
// DATABASE FUNCTIONS
// ============================================

function initDB() {
    if (!fs.existsSync(DB_PATH)) {
        saveDB({ users: [], ownerData: {} });
        console.log('✅ Database created');
    }
}

function getDB() {
    try {
        if (fs.existsSync(DB_PATH)) {
            return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        }
    } catch (e) {
        console.error('DB Read Error:', e);
    }
    return { users: [], ownerData: {} };
}

function saveDB(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
        console.log('✅ Database saved');
    } catch (e) {
        console.error('DB Write Error:', e);
    }
}

function getUsers() {
    const db = getDB();
    return db.users || [];
}

function saveUsers(users) {
    const db = getDB();
    db.users = users;
    saveDB(db);
}

function getUserByPhone(phone) {
    const users = getUsers();
    return users.find(u => u.phone === phone);
}

// ============================================
// CREATE OR UPDATE USER
// ============================================

function createOrUpdateUser(userData) {
    const users = getUsers();
    const index = users.findIndex(u => u.phone === userData.phone);
    
    if (index !== -1) {
        users[index] = {
            ...users[index],
            fullName: userData.fullName || users[index].fullName,
            email: userData.email || users[index].email,
            balance: userData.balance !== undefined ? userData.balance : users[index].balance,
            totalFundAdded: userData.totalFundAdded !== undefined ? userData.totalFundAdded : users[index].totalFundAdded,
            totalWithdrawn: userData.totalWithdrawn !== undefined ? userData.totalWithdrawn : users[index].totalWithdrawn,
            totalSent: userData.totalSent !== undefined ? userData.totalSent : users[index].totalSent,
            totalReceived: userData.totalReceived !== undefined ? userData.totalReceived : users[index].totalReceived,
            apiKey: userData.apiKey || users[index].apiKey,
            apiToken: userData.apiToken || users[index].apiToken,
            transactions: userData.transactions || users[index].transactions || [],
            activities: userData.activities || users[index].activities || [],
            pendingApprovals: userData.pendingApprovals || users[index].pendingApprovals || []
        };
        console.log(`✅ User ${userData.phone} updated`);
    } else {
        users.push({
            phone: userData.phone,
            fullName: userData.fullName || 'User',
            email: userData.email || '',
            password: userData.password || 'default123',
            balance: userData.balance || 0,
            totalFundAdded: 0,
            totalWithdrawn: 0,
            totalSent: 0,
            totalReceived: 0,
            apiKey: null,
            apiToken: null,
            isActive: true,
            createdAt: new Date().toISOString(),
            transactions: [],
            activities: [],
            pendingApprovals: []
        });
        console.log(`✅ New user ${userData.phone} created`);
    }
    
    saveUsers(users);
    return getUserByPhone(userData.phone);
}

function updateUser(user) {
    const users = getUsers();
    const index = users.findIndex(u => u.phone === user.phone);
    if (index !== -1) {
        users[index] = user;
        saveUsers(users);
        return true;
    }
    return false;
}

// ============================================
// API KEY GENERATORS
// ============================================

function generateApiKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'bh_';
    for (let i = 0; i < 20; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

function generateApiToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = 'tkn_';
    for (let i = 0; i < 40; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

// ============================================
// API ENDPOINTS
// ============================================

// Generate API Key
app.post('/api/generate-key', (req, res) => {
    const { phone, fullName, email, balance } = req.body;
    
    console.log('📝 Generate Key Request:', phone);
    
    if (!phone) {
        return res.status(400).json({ 
            success: false, 
            message: 'Phone number is required' 
        });
    }
    
    let user = getUserByPhone(phone);
    
    if (!user) {
        user = createOrUpdateUser({
            phone: phone,
            fullName: fullName || 'User',
            email: email || '',
            balance: balance || 0
        });
    } else {
        if (balance !== undefined && balance !== null) {
            user.balance = balance;
            updateUser(user);
        }
    }
    
    if (user.apiKey && user.apiToken) {
        return res.json({
            success: true,
            message: 'API key already exists',
            data: {
                apiKey: user.apiKey,
                apiToken: user.apiToken,
                phone: user.phone,
                name: user.fullName,
                balance: user.balance,
                alreadyExists: true
            }
        });
    }
    
    const apiKey = generateApiKey();
    const apiToken = generateApiToken();
    
    user.apiKey = apiKey;
    user.apiToken = apiToken;
    updateUser(user);
    
    return res.json({
        success: true,
        message: 'API key generated successfully',
        data: {
            apiKey: apiKey,
            apiToken: apiToken,
            phone: user.phone,
            name: user.fullName,
            balance: user.balance,
            alreadyExists: false
        }
    });
});

// Check Balance
app.get('/api/balance', (req, res) => {
    const { apiKey, apiToken } = req.query;
    
    if (!apiKey || !apiToken) {
        return res.status(400).json({ 
            success: false, 
            message: 'API key and token are required' 
        });
    }
    
    const user = getUsers().find(u => u.apiKey === apiKey && u.apiToken === apiToken);
    
    if (!user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid API credentials'
        });
    }
    
    return res.json({
        success: true,
        data: {
            phone: user.phone,
            name: user.fullName,
            balance: user.balance || 0,
            currency: 'INR'
        }
    });
});

// Payment API
app.get('/APIs/api', async (req, res) => {
    const { token, key, paytoNumber, amount, comment } = req.query;

    console.log('📱 Payment Request:', { token, key, paytoNumber, amount });

    if (!token || !key) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing API credentials' 
        });
    }
    
    if (!paytoNumber) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing paytoNumber' 
        });
    }
    
    if (!amount) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing amount' 
        });
    }

    // Clean phone number
    let cleanPhone = paytoNumber.toString().replace(/\D/g, '');
    
    if (cleanPhone.startsWith('91') && cleanPhone.length === 12) {
        cleanPhone = cleanPhone.substring(2);
    }
    if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
        cleanPhone = cleanPhone.substring(1);
    }
    
    if (!cleanPhone || cleanPhone.length === 0) {
        cleanPhone = '9876543210';
    }
    
    if (cleanPhone.length < 10) {
        cleanPhone = cleanPhone.padStart(10, '0');
    }
    
    if (cleanPhone.length > 10) {
        cleanPhone = cleanPhone.slice(-10);
    }

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid amount' 
        });
    }

    let users = getUsers();
    
    // Find sender
    let sender = users.find(u => u.apiKey === key && u.apiToken === token);

    if (!sender) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid API credentials' 
        });
    }

    const senderBalance = sender.balance || 0;
    if (amountNum > senderBalance) {
        return res.status(400).json({
            success: false,
            message: 'Insufficient balance',
            data: { 
                balance: senderBalance, 
                required: amountNum, 
                currency: 'INR'
            }
        });
    }

    // Find OR Create recipient
    let recipient = users.find(u => u.phone === cleanPhone);
    
    if (!recipient) {
        recipient = {
            phone: cleanPhone,
            fullName: 'Test User',
            email: 'test@example.com',
            password: 'default123',
            balance: 0,
            totalFundAdded: 0,
            totalWithdrawn: 0,
            totalSent: 0,
            totalReceived: 0,
            apiKey: null,
            apiToken: null,
            isActive: true,
            createdAt: new Date().toISOString(),
            transactions: [],
            activities: [],
            pendingApprovals: []
        };
        users.push(recipient);
        saveUsers(users);
    }

    // Refresh users
    users = getUsers();
    sender = users.find(u => u.apiKey === key && u.apiToken === token);
    recipient = users.find(u => u.phone === cleanPhone);

    // Process payment - DEDUCT FROM SENDER
    sender.balance = (sender.balance || 0) - amountNum;
    sender.totalSent = (sender.totalSent || 0) + amountNum;

    // Process payment - ADD TO RECIPIENT
    recipient.balance = (recipient.balance || 0) + amountNum;
    recipient.totalReceived = (recipient.totalReceived || 0) + amountNum;

    // Create transaction for sender
    const senderTx = {
        type: 'sent',
        amount: amountNum,
        description: `API Payment to ${recipient.fullName || cleanPhone}${comment ? ' - ' + comment : ''}`,
        time: new Date().toISOString(),
        apiPayment: true
    };
    if (!sender.transactions) sender.transactions = [];
    sender.transactions.unshift(senderTx);

    // Create transaction for recipient
    const recipientTx = {
        type: 'received',
        amount: amountNum,
        description: `API Payment from ${sender.fullName || sender.phone}${comment ? ' - ' + comment : ''}`,
        time: new Date().toISOString(),
        apiPayment: true
    };
    if (!recipient.transactions) recipient.transactions = [];
    recipient.transactions.unshift(recipientTx);

    // Update users in database
    const senderIndex = users.findIndex(u => u.phone === sender.phone);
    const recipientIndex = users.findIndex(u => u.phone === recipient.phone);

    if (senderIndex !== -1) users[senderIndex] = sender;
    if (recipientIndex !== -1) users[recipientIndex] = recipient;

    saveUsers(users);

    console.log('✅ Payment processed successfully!');

    return res.json({
        success: true,
        message: '✅ Payment Successful!'
    });
});

// POST support for API
app.post('/APIs/api', async (req, res) => {
    const { token, key, paytoNumber, amount, comment } = req.body;
    req.query = { token, key, paytoNumber, amount, comment };
    app._router.handle(req, res);
});

// Get all users
app.get('/api/users', (req, res) => {
    const users = getUsers();
    const safeUsers = users.map(u => ({
        phone: u.phone,
        name: u.fullName,
        email: u.email,
        balance: u.balance || 0,
        hasApiKey: !!(u.apiKey && u.apiToken),
        createdAt: u.createdAt
    }));
    res.json({ 
        success: true, 
        total: safeUsers.length, 
        users: safeUsers 
    });
});

// Server status
app.get('/api/status', (req, res) => {
    const users = getUsers();
    const totalUsers = users.length;
    const totalTransactions = users.reduce((sum, u) => sum + (u.transactions || []).length, 0);
    const usersWithApi = users.filter(u => u.apiKey).length;
    
    res.json({
        status: 'active',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            payment: '/APIs/api',
            balance: '/api/balance',
            generate_key: '/api/generate-key',
            users: '/api/users',
            status: '/api/status'
        },
        stats: { 
            total_users: totalUsers, 
            total_transactions: totalTransactions,
            users_with_api: usersWithApi
        }
    });
});

// ============================================
// SERVE HTML FILES
// ============================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/add-fund', (req, res) => {
    res.sendFile(path.join(__dirname, 'add-fund.html'));
});

app.get('/api-keys', (req, res) => {
    res.sendFile(path.join(__dirname, 'api-keys.html'));
});

app.get('/forgot-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'forgot-password.html'));
});

app.get('/owner-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'owner-dashboard.html'));
});

app.get('/pay-user', (req, res) => {
    res.sendFile(path.join(__dirname, 'pay-user.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'profile.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'settings.html'));
});

app.get('/transaction-history', (req, res) => {
    res.sendFile(path.join(__dirname, 'transaction-history.html'));
});

app.get('/withdraw', (req, res) => {
    res.sendFile(path.join(__dirname, 'withdraw.html'));
});

// Catch all
app.get('*', (req, res) => {
    if (req.path.includes('.')) {
        return res.status(404).send('File not found');
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================
// START SERVER
// ============================================

initDB();

app.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('🚀 Bots Hub API Server Running');
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 URL: https://bots-hub-pay.onrender.com`);
    const users = getUsers();
    console.log(`📊 Total Users: ${users.length}`);
    console.log(`🔑 Users with API: ${users.filter(u => u.apiKey).length}`);
    console.log('========================================');
});
