const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const DB_PATH = path.join(__dirname, 'database.json');

// ✅ Initialize database if not exists
function initDB() {
    if (!fs.existsSync(DB_PATH)) {
        saveDB({ users: [], ownerData: {} });
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
        console.log('✅ Database saved successfully');
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

// ✅ NEW: Create or update user in database
function createOrUpdateUser(userData) {
    const users = getUsers();
    const index = users.findIndex(u => u.phone === userData.phone);
    
    if (index !== -1) {
        // Update existing user
        users[index] = { ...users[index], ...userData };
    } else {
        // Create new user
        users.push({
            phone: userData.phone,
            fullName: userData.fullName || 'User',
            email: userData.email || '',
            password: userData.password || '',
            balance: userData.balance || 0,
            totalFundAdded: userData.totalFundAdded || 0,
            totalWithdrawn: userData.totalWithdrawn || 0,
            totalSent: userData.totalSent || 0,
            totalReceived: userData.totalReceived || 0,
            apiKey: userData.apiKey || null,
            apiToken: userData.apiToken || null,
            isActive: true,
            createdAt: userData.createdAt || new Date().toISOString(),
            transactions: userData.transactions || [],
            activities: userData.activities || [],
            pendingApprovals: userData.pendingApprovals || []
        });
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

function generateApiKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'bh_';
    for (let i = 0; i < 20; i++) key += chars.charAt(Math.floor(Math.random() * chars.length));
    return key;
}

function generateApiToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = 'tkn_';
    for (let i = 0; i < 40; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
    return token;
}

// ✅ FIXED: Generate API Key - Creates user if not exists
app.post('/api/generate-key', (req, res) => {
    const { phone, fullName, email } = req.body;
    
    console.log('📝 Generate Key Request:', { phone, fullName, email });
    
    if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
    }
    
    // ✅ Check if user exists, if not create one
    let user = getUserByPhone(phone);
    
    if (!user) {
        console.log('👤 User not found, creating new user:', phone);
        // Create user with provided data or default
        user = createOrUpdateUser({
            phone: phone,
            fullName: fullName || 'User',
            email: email || '',
            password: 'default123',
            balance: 0,
            createdAt: new Date().toISOString()
        });
        console.log('✅ New user created:', user);
    }
    
    // Generate new API keys
    const apiKey = generateApiKey();
    const apiToken = generateApiToken();
    
    user.apiKey = apiKey;
    user.apiToken = apiToken;
    updateUser(user);
    
    console.log('✅ API Keys Generated:', { phone, apiKey, apiToken });
    
    return res.json({
        success: true,
        message: 'API key generated successfully',
        data: {
            apiKey: apiKey,
            apiToken: apiToken,
            phone: user.phone,
            name: user.fullName
        }
    });
});

// ✅ FIXED: Balance API
app.get('/api/balance', (req, res) => {
    const { apiKey, apiToken } = req.query;
    
    console.log('💰 Balance Check:', { apiKey, apiToken });
    
    if (!apiKey || !apiToken) {
        return res.status(400).json({ success: false, message: 'API key and token are required' });
    }
    
    const user = getUsers().find(u => u.apiKey === apiKey && u.apiToken === apiToken);
    
    if (!user) {
        console.log('❌ Invalid credentials for balance check');
        return res.status(401).json({ success: false, message: 'Invalid API credentials' });
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

// ✅ FIXED: Payment API
app.get('/APIs/api', async (req, res) => {
    const { token, key, paytoNumber, amount, comment } = req.query;

    console.log('========================================');
    console.log('📱 API Payment Request:');
    console.log('Token:', token);
    console.log('Key:', key);
    console.log('PaytoNumber:', paytoNumber);
    console.log('Amount:', amount);
    console.log('========================================');

    if (!token || !key) {
        return res.status(400).json({ success: false, message: 'Missing API credentials' });
    }
    if (!paytoNumber) {
        return res.status(400).json({ success: false, message: 'Missing paytoNumber' });
    }
    if (!amount) {
        return res.status(400).json({ success: false, message: 'Missing amount' });
    }

    const cleanPhone = paytoNumber.replace(/\D/g, '');
    if (!/^[0-9]{10}$/.test(cleanPhone)) {
        return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const users = getUsers();
    
    // ✅ Debug: Log all users for checking
    console.log('👥 Total users in DB:', users.length);
    users.forEach(u => {
        console.log(`  - ${u.phone}: ${u.fullName} (API Key: ${u.apiKey ? '✅' : '❌'})`);
    });
    
    // ✅ Find sender with exact match
    const sender = users.find(u => u.apiKey === key && u.apiToken === token);

    if (!sender) {
        console.log('❌ Invalid API credentials - Sender not found');
        console.log(`  Received Key: ${key}`);
        console.log(`  Received Token: ${token}`);
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid API credentials',
            debug: {
                providedKey: key,
                providedToken: token,
                userCount: users.length
            }
        });
    }

    console.log('✅ Sender found:', sender.phone, sender.fullName);

    const senderBalance = sender.balance || 0;
    if (amountNum > senderBalance) {
        return res.status(400).json({
            success: false,
            message: 'Insufficient balance',
            data: { balance: senderBalance, required: amountNum, currency: 'INR' }
        });
    }

    const recipient = users.find(u => u.phone === cleanPhone);
    if (!recipient) {
        return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    // Process payment
    sender.balance = (sender.balance || 0) - amountNum;
    sender.totalSent = (sender.totalSent || 0) + amountNum;

    recipient.balance = (recipient.balance || 0) + amountNum;
    recipient.totalReceived = (recipient.totalReceived || 0) + amountNum;

    const senderTx = {
        type: 'sent',
        amount: amountNum,
        description: `API Payment to ${recipient.fullName || cleanPhone}${comment ? ' - ' + comment : ''}`,
        time: new Date().toISOString(),
        apiPayment: true
    };
    if (!sender.transactions) sender.transactions = [];
    sender.transactions.unshift(senderTx);

    const recipientTx = {
        type: 'received',
        amount: amountNum,
        description: `API Payment from ${sender.fullName || sender.phone}${comment ? ' - ' + comment : ''}`,
        time: new Date().toISOString(),
        apiPayment: true
    };
    if (!recipient.transactions) recipient.transactions = [];
    recipient.transactions.unshift(recipientTx);

    const senderIndex = users.findIndex(u => u.phone === sender.phone);
    const recipientIndex = users.findIndex(u => u.phone === recipient.phone);

    if (senderIndex !== -1) users[senderIndex] = sender;
    if (recipientIndex !== -1) users[recipientIndex] = recipient;

    saveUsers(users);

    console.log('✅ Payment processed successfully!');
    console.log('========================================');

    return res.json({
        success: true,
        message: 'Payment successful',
        data: {
            transaction_id: Date.now().toString(),
            amount: amountNum,
            currency: 'INR',
            recipient: cleanPhone,
            recipient_name: recipient.fullName || 'User',
            sender: sender.phone,
            sender_name: sender.fullName || 'User',
            sender_balance_after: sender.balance,
            recipient_balance_after: recipient.balance,
            timestamp: new Date().toISOString(),
            comment: comment || ''
        }
    });
});

app.post('/APIs/api', async (req, res) => {
    const { token, key, paytoNumber, amount, comment } = req.body;
    req.query = { token, key, paytoNumber, amount, comment };
    app._router.handle(req, res);
});

app.get('/api/users', (req, res) => {
    const users = getUsers();
    const safeUsers = users.map(u => ({
        phone: u.phone,
        name: u.fullName,
        email: u.email,
        balance: u.balance || 0,
        hasApiKey: !!(u.apiKey && u.apiToken),
        createdAt: u.createdAt,
        loginCount: u.loginCount || 0
    }));
    res.json({ success: true, total: safeUsers.length, users: safeUsers });
});

app.get('/api/status', (req, res) => {
    const users = getUsers();
    const totalUsers = users.length;
    const totalTransactions = users.reduce((sum, u) => sum + (u.transactions || []).length, 0);
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
            users_with_api: users.filter(u => u.apiKey).length
        }
    });
});

// ✅ Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*', (req, res) => {
    // If path has extension, try to serve static file
    if (req.path.includes('.')) {
        return res.status(404).send('File not found');
    }
    // Otherwise serve index.html for SPA routing
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize database
initDB();

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('🚀 Bots Hub API Server Running');
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 Domain: https://bots-hub-pay.onrender.com`);
    console.log(`📊 Total Users in DB: ${getUsers().length}`);
    console.log('========================================');
});
