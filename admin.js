document.addEventListener('DOMContentLoaded', async () => {

    // 1. Determine current page
    const pathname = window.location.pathname;
    const isLoginPage = pathname.includes('admin-login.html');
    const isDashboard = pathname.includes('admin-dashboard.html');

    // 2. Check Auth Session
    const { data: { session } } = await supabase.auth.getSession();

    if (isDashboard && !session) {
        // Protect Dashboard: Redirect to login if no session
        window.location.href = 'admin-login.html';
        return;
    }

    if (isLoginPage && session) {
        // Redirect to dashboard if already logged in
        window.location.href = 'admin-dashboard.html';
        return;
    }

    // 3. Page Specific Logic
    if (isLoginPage) {
        setupLogin();
    } else if (isDashboard) {
        setupDashboard(session);
    }
});

// === Login Logic ===
function setupLogin() {
    const loginForm = document.getElementById('loginForm');
    const errorDiv = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Reset UI
        errorDiv.innerText = '';
        loginBtn.disabled = true;
        loginBtn.innerText = 'Signing In...';

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            // Success - Redirect happens automatically via session check or explicitly here
            window.location.href = 'admin-dashboard.html';

        } catch (err) {
            console.error('Login Failed:', err);
            errorDiv.innerText = 'Invalid login credentials.';
            loginBtn.disabled = false;
            loginBtn.innerText = 'Sign In';
        }
    });
}

// === Dashboard Logic ===
function setupDashboard(session) {
    // Show User Email
    if (session && session.user) {
        document.getElementById('userEmail').innerText = session.user.email;
    }

    // Logout Handler
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        await supabase.auth.signOut();
        window.location.href = 'admin-login.html';
    });

    // Tab Switching
    const tabs = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.dashboard-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // Add active to current
            tab.classList.add('active');
            const targetId = tab.getAttribute('data-tab') + '-section';
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Initial Data Load
    loadMessages();
    loadQuotes();
}

// Load General Messages
async function loadMessages() {
    const tbody = document.querySelector('#messagesTable tbody');
    const loading = document.getElementById('messagesLoading');

    tbody.innerHTML = '';
    loading.style.display = 'block';

    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        loading.style.display = 'none';

        if (!data || data.length === 0) {
            loading.innerText = 'No messages found.';
            loading.style.display = 'block';
            return;
        }

        data.forEach(msg => {
            const date = new Date(msg.created_at).toLocaleDateString();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="date-cell">${date}</td>
                <td><strong>${escapeHtml(msg.name)}</strong></td>
                <td><a href="mailto:${escapeHtml(msg.email)}">${escapeHtml(msg.email)}</a></td>
                <td>${escapeHtml(msg.subject || '-')}</td>
                <td><div class="message-preview" title="${escapeHtml(msg.message)}">${escapeHtml(msg.message)}</div></td>
            `;
            tbody.appendChild(row);
        });

    } catch (err) {
        console.error('Error loading messages:', err);
        loading.innerText = 'Error loading data. ' + err.message;
    }
}

// Load Quote Requests
async function loadQuotes() {
    const tbody = document.querySelector('#quotesTable tbody');
    const loading = document.getElementById('quotesLoading');

    tbody.innerHTML = '';
    loading.style.display = 'block';

    try {
        const { data, error } = await supabase
            .from('quote_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        loading.style.display = 'none';

        if (!data || data.length === 0) {
            loading.innerText = 'No quotes found.';
            loading.style.display = 'block';
            return;
        }

        data.forEach(quote => {
            const date = new Date(quote.created_at).toLocaleDateString();

            // Badge style
            let badgeClass = 'badge';
            const service = (quote.service_type || '').toLowerCase();
            if (service.includes('built')) badgeClass += ' badge-built';
            if (service.includes('digital')) badgeClass += ' badge-digital';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="date-cell">${date}</td>
                <td><span class="${badgeClass}">${escapeHtml(quote.service_type || 'Unknown')}</span></td>
                <td><strong>${escapeHtml(quote.name)}</strong></td>
                <td>
                    ${escapeHtml(quote.email)}<br>
                    <small>${escapeHtml(quote.phone || '')}</small>
                </td>
                <td><div class="message-preview" title="${escapeHtml(quote.message)}">${escapeHtml(quote.message)}</div></td>
            `;
            tbody.appendChild(row);
        });

    } catch (err) {
        console.error('Error loading quotes:', err);
        loading.innerText = 'Error loading data. ' + err.message;
    }
}

// Utility to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
