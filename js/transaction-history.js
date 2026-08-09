// Transaction History JavaScript - Bots Hub Pay

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
        allTransactions = allTransactions.concat(currentUser.transactions);
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
                status: 'pending'
            }));
        allTransactions = allTransactions.concat(pendingTxs);
    }

    allTransactions.sort((a, b) => new Date(b.time) - new Date(a.time));
    document.getElementById('transactionCount').textContent = allTransactions.length + ' transactions';

    function renderTransactions(filter) {
        const container = document.getElementById('transactionList');
        let filtered = allTransactions;
        
        if (filter !== 'all') {
            if (filter === 'pending') {
                filtered = allTransactions.filter(t => t.status === 'pending');
            } else {
                filtered = allTransactions.filter(t => t.type === filter && t.status !== 'pending');
            }
        }

        if (filtered.length === 0) {
            container.innerHTML = `<div class="no-transactions"><i class="fa-regular fa-clock"></i><p>No transactions found</p></div>`;
            return;
        }

        container.innerHTML = filtered.map(t => {
            const time = new Date(t.time);
            const timeStr = time.toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            
            let iconClass = 'add';
            let icon = 'fa-solid fa-circle-plus';
            let amountClass = 'add';
            let sign = '+';
            let displayDesc = t.description || t.type;

            if (t.status === 'pending') {
                iconClass = 'pending';
                icon = 'fa-regular fa-clock';
                amountClass = 'pending';
                sign = '⏳';
            } else if (t.type === 'sent' || t.type === 'withdraw') {
                iconClass = 'sent';
                icon = 'fa-solid fa-paper-plane';
                amountClass = 'sent';
                sign = '-';
            } else if (t.type === 'received' || t.type === 'add') {
                iconClass = 'received';
                icon = 'fa-solid fa-arrow-down';
                amountClass = 'received';
                sign = '+';
            }

            const statusBadge = t.status === 'pending' ? 
                '<span class="status-badge pending">⏳ Pending</span>' : 
                '<span class="status-badge approved">✅ Completed</span>';

            return `<div class="transaction-item">
                <div class="transaction-left">
                    <div class="transaction-icon ${iconClass}"><i class="${icon}"></i></div>
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
