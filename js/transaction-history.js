// Top of file mein yeh line add karein
const API_URL = 'https://bots-hub-pay.onrender.com/api';
document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    if (!isLoggedIn) {
        window.location.href = 'index.html';
        return;
    }

    const userPhone = sessionStorage.getItem('userPhone');
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const currentUser = users.find(user => user.phone === userPhone);

    if (!currentUser) {
        sessionStorage.clear();
        window.location.href = 'index.html';
        return;
    }

    let currentFilter = 'all';
    let allTransactions = [];

    if (currentUser.transactions) {
        allTransactions = allTransactions.concat(currentUser.transactions.map(t => ({ ...t, status: 'approved' })));
    }
    if (currentUser.pendingApprovals) {
        const pendingTxs = currentUser.pendingApprovals
            .filter(a => a.status === 'pending')
            .map(a => ({
                type: a.type === 'add_fund' ? 'add' : a.type,
                amount: a.amount,
                description: a.type === 'add_fund' ? 'Add Fund (Pending)' :
                             a.type === 'withdraw' ? 'Withdraw (Pending)' :
                             'Pay to User (Pending)',
                time: a.timestamp,
                status: 'pending',
                isPending: true,
                approvalId: a.id
            }));
        allTransactions = allTransactions.concat(pendingTxs);
    }

    allTransactions.sort((a, b) => new Date(b.time) - new Date(a.time));
    document.getElementById('transactionCount').textContent = allTransactions.length + ' transactions';

    function getIconClass(type) {
        const icons = { 'add': 'add', 'withdraw': 'withdraw', 'sent': 'sent', 'received': 'received', 'pending': 'pending' };
        return icons[type] || 'add';
    }

    function getAmountClass(type, status) {
        if (status === 'pending') return 'pending';
        const classes = { 'add': 'add', 'withdraw': 'withdraw', 'sent': 'sent', 'received': 'received' };
        return classes[type] || 'add';
    }

    function getIcon(type) {
        const icons = {
            'add': 'fa-solid fa-circle-plus',
            'withdraw': 'fa-solid fa-arrow-right',
            'sent': 'fa-solid fa-paper-plane',
            'received': 'fa-solid fa-arrow-down',
            'pending': 'fa-regular fa-clock'
        };
        return icons[type] || 'fa-solid fa-circle';
    }

    function getStatusBadge(status) {
        if (status === 'pending') {
            return '<span class="status-badge pending">⏳ Pending</span>';
        } else if (status === 'approved') {
            return '<span class="status-badge approved">✅ Approved</span>';
        } else if (status === 'rejected') {
            return '<span class="status-badge rejected">❌ Rejected</span>';
        }
        return '';
    }

    function renderTransactions(filter) {
        const container = document.getElementById('transactionList');
        let filtered = allTransactions;
        if (filter !== 'all') {
            if (filter === 'pending') {
                filtered = allTransactions.filter(t => t.status === 'pending');
            } else {
                filtered = allTransactions.filter(t => t.type === filter && t.status === 'approved');
            }
        }

        if (filtered.length === 0) {
            container.innerHTML = `<div class="no-transactions"><i class="fa-regular fa-clock"></i><p>No transactions found</p></div>`;
            return;
        }

        container.innerHTML = filtered.map(t => {
            const time = new Date(t.time);
            const timeStr = time.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const iconClass = getIconClass(t.type);
            const amountClass = getAmountClass(t.type, t.status);
            const sign = t.type === 'add' || t.type === 'received' ? '+' : '-';
            const statusBadge = getStatusBadge(t.status);
            let displayDesc = t.description || t.type.charAt(0).toUpperCase() + t.type.slice(1);
            if (t.status === 'pending') { displayDesc = displayDesc + ' ⏳'; }

            return `<div class="transaction-item">
                <div class="transaction-left">
                    <div class="transaction-icon ${iconClass}"><i class="${getIcon(t.type)}"></i></div>
                    <div class="transaction-details">
                        <div class="desc">${displayDesc}</div>
                        <div class="time">${timeStr}</div>
                    </div>
                </div>
                <div class="transaction-right">
                    <div class="transaction-amount ${amountClass}">${sign}₹${t.amount.toFixed(2)}</div>
                    ${statusBadge}
                </div>
            </div>`;
        }).join('');
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.style.background = '#fff';
                b.style.color = '#1a1a2e';
            });
            this.style.background = '#4169ff';
            this.style.color = '#fff';
            currentFilter = this.dataset.filter;
            renderTransactions(currentFilter);
        });
    });

    renderTransactions('all');
});