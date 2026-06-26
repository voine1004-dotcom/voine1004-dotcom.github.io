// Global State
let employeeList = [];
let currentDashboardTab = 'all';
let currentUser = null; // Stores logged in user details or { role: 'admin' }

// Chart instances
let distChart = null;
let yearsChart = null;

// DOM Elements
const chatArea = document.querySelector('.chat-area');
const adminDashboard = document.getElementById('admin-dashboard');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const btnResetChat = document.getElementById('btn-reset-chat');
const quickOptionsContainer = document.getElementById('quick-options-container');

// Sidebar stats elements
const dbStatusDot = document.getElementById('db-status-dot');
const dbStatusText = document.getElementById('db-status-text');
const statTotalEmp = document.getElementById('stat-total-emp');
const statReserveCount = document.getElementById('stat-reserve-count');
const statCivilCount = document.getElementById('stat-civil-count');
const statExcludeCount = document.getElementById('stat-exclude-count');
const statsSection = document.getElementById('stats-section');

// Header Elements
const headerUserBadge = document.getElementById('header-user-badge');
const btnLogout = document.getElementById('btn-logout');

// FAQ navigation items
const faqNavItems = document.querySelectorAll('.faq-nav-item');

// Login Gate Elements
const loginGate = document.getElementById('login-gate');
const tabUser = document.getElementById('tab-user');
const tabAdmin = document.getElementById('tab-admin');
const formUser = document.getElementById('form-user');
const formAdmin = document.getElementById('form-admin');
const loginUserName = document.getElementById('login-user-name');
const loginUserId = document.getElementById('login-user-id');
const loginAdminPw = document.getElementById('login-admin-pw');
const userLoginError = document.getElementById('user-login-error');
const adminLoginError = document.getElementById('admin-login-error');
const btnLoginUser = document.getElementById('btn-login-user');
const btnLoginAdmin = document.getElementById('btn-login-admin');

// Admin Dashboard Elements
const dashTotalEmp = document.getElementById('dash-total-emp');
const dashReserveCount = document.getElementById('dash-reserve-count');
const dashCivilCount = document.getElementById('dash-civil-count');
const dashExcludeCount = document.getElementById('dash-exclude-count');
const tableSearchInput = document.getElementById('table-search-input');
const rosterTableTbody = document.getElementById('roster-table-tbody');
const filterBtns = document.querySelectorAll('.filter-btn');

// Init application
document.addEventListener('DOMContentLoaded', () => {
    // Hide Admin Stats and Main screens initially
    statsSection.style.display = 'none';
    chatArea.style.display = 'none';
    adminDashboard.style.display = 'none';

    loadRosterData();
    setupEventListeners();
    setupLoginEventListeners();
    setupDashboardEventListeners();
});

// Event Listeners for Chat
function setupEventListeners() {
    // Input Enter key
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleUserMessage();
        }
    });

    // Send button click
    btnSend.addEventListener('click', handleUserMessage);

    // Reset Chat button click
    btnResetChat.addEventListener('click', () => {
        if (confirm("대화 기록을 초기화하시겠습니까?")) {
            chatMessages.innerHTML = '';
            initChat();
        }
    });

    // Sidebar FAQ navigation click
    faqNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const query = item.getAttribute('data-query');
            sendQueryDirectly(query);
        });
    });

    // Logout button click
    btnLogout.addEventListener('click', handleLogout);
}

// Event Listeners for Login Gate
function setupLoginEventListeners() {
    // Tab switching
    tabUser.addEventListener('click', () => {
        tabUser.classList.add('active');
        tabAdmin.classList.remove('active');
        formUser.classList.add('active');
        formAdmin.classList.remove('active');
        userLoginError.classList.add('hidden');
        adminLoginError.classList.add('hidden');
    });

    tabAdmin.addEventListener('click', () => {
        tabAdmin.classList.add('active');
        tabUser.classList.remove('active');
        formAdmin.classList.add('active');
        formUser.classList.remove('active');
        userLoginError.classList.add('hidden');
        adminLoginError.classList.add('hidden');
    });

    // User Login submit
    btnLoginUser.addEventListener('click', handleUserLogin);
    [loginUserName, loginUserId].forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleUserLogin();
            }
        });
    });

    // Admin Login submit
    btnLoginAdmin.addEventListener('click', handleAdminLogin);
    loginAdminPw.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleAdminLogin();
        }
    });
}

// Dashboard event listeners
function setupDashboardEventListeners() {
    // Search input
    tableSearchInput.addEventListener('input', () => {
        filterRosterTable();
    });

    // Filter Buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterRosterTable();
        });
    });

    // Dashboard Sub-tabs click
    const dashTabs = document.querySelectorAll('.dash-tab');
    dashTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            dashTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentDashboardTab = tab.getAttribute('data-tab');
            
            // Clear AI Panel when switching tabs to avoid UI confusion
            const resultPanel = document.getElementById('admin-ai-result-panel');
            const queryInput = document.getElementById('admin-ai-input');
            if (resultPanel) resultPanel.classList.add('hidden');
            if (queryInput) queryInput.value = '';
            
            // BUG FIX: Reset lower roster category filter buttons to 'all' when switching tabs
            const filterBtns = document.querySelectorAll('.filter-btn');
            filterBtns.forEach(btn => {
                if (btn.getAttribute('data-filter') === 'all') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            
            renderAdminDashboard();
        });
    });

    // AI Query Submit
    const btnAdminAiQuery = document.getElementById('btn-admin-ai-query');
    if (btnAdminAiQuery) {
        btnAdminAiQuery.addEventListener('click', handleAdminAIQuery);
    }
    const adminAiInput = document.getElementById('admin-ai-input');
    if (adminAiInput) {
        adminAiInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleAdminAIQuery();
            }
        });
    }
}

// Load Roster from Excel
async function loadRosterData() {
    try {
        const response = await fetch('./대원현황.xlsx');
        if (!response.ok) {
            throw new Error(`엑셀 파일 호출 실패: status ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        
        // Normalize rows
        employeeList = rawJson.map(row => {
            const norm = {};
            for (let key in row) {
                const cleanKey = key.trim();
                if (cleanKey === '성명' || cleanKey === '이름' || cleanKey.includes('name')) {
                    norm.name = String(row[key]).trim();
                } else if (cleanKey === '사번' || cleanKey.includes('id')) {
                    norm.empId = String(row[key]).trim();
                } else if (cleanKey === '대상구분' || cleanKey === '훈련여부 (대상 구분)' || cleanKey.includes('훈련여부') || cleanKey.includes('구분')) {
                    norm.trainingStatus = String(row[key]).trim();
                } else if (cleanKey === '훈련유형' || cleanKey.includes('유형') || cleanKey.includes('type')) {
                    norm.trainingType = String(row[key]).trim();
                } else if (cleanKey === '부서명' || cleanKey.includes('부서') || cleanKey.includes('dept')) {
                    norm.dept = String(row[key]).trim();
                } else if (cleanKey === '사업장' || cleanKey.includes('site') || cleanKey.includes('location')) {
                    norm.site = String(row[key]).trim();
                } else if (cleanKey === '이메일' || cleanKey.includes('email')) {
                    norm.email = String(row[key]).trim();
                } else if (cleanKey === '연락처' || cleanKey.includes('phone') || cleanKey.includes('tel')) {
                    norm.phone = String(row[key]).trim();
                } else if (cleanKey === '비고' || cleanKey.includes('note')) {
                    norm.remarks = String(row[key]).trim();
                }
            }
            if (!norm.birth) norm.birth = '-';
            return norm;
        }).filter(item => item.name && item.empId);

        // Update UI status
        dbStatusDot.className = 'status-indicator connected';
        dbStatusText.textContent = `명부 연결됨 (${employeeList.length}명)`;
        
        // Calculate stats
        updateSidebarStats();
    } catch (error) {
        console.error("명부 로딩 실패:", error);
        dbStatusDot.className = 'status-indicator error';
        dbStatusText.textContent = '명부 로딩 실패';
        
        alert("명부 파일(대원현황.xlsx)을 로드하지 못했습니다. 로컬 서버 환경인지 확인바랍니다.");
    }
}

// User Mode Login Handler
function handleUserLogin() {
    const nameVal = loginUserName.value.trim();
    const idVal = loginUserId.value.trim();

    if (!nameVal || !idVal) {
        showLoginError(userLoginError, "이름과 사번을 모두 입력해 주세요.");
        return;
    }

    if (employeeList.length === 0) {
        showLoginError(userLoginError, "명부 데이터가 로드되지 않았습니다. 잠시 후 다시 시도하십시오.");
        return;
    }

    // Match employee exactly
    const matched = employeeList.find(emp => 
        emp.name.toLowerCase() === nameVal.toLowerCase() && 
        emp.empId === idVal
    );

    if (matched) {
        currentUser = matched;
        
        // Hide login gate
        loginGate.classList.add('fade-out');
        setTimeout(() => {
            loginGate.style.display = 'none';
        }, 500);

        // UI Adjustments for User Mode
        statsSection.style.display = 'none'; // Hide sidebar stats completely for employees
        chatArea.style.display = 'flex';
        adminDashboard.style.display = 'none';
        
        headerUserBadge.style.display = 'inline-block';
        headerUserBadge.className = 'user-badge';
        headerUserBadge.textContent = `${matched.name} 사원`;
        btnLogout.style.display = 'inline-block';

        // Clear chat and init
        chatMessages.innerHTML = '';
        initChat();
    } else {
        showLoginError(userLoginError, "입력하신 이름과 사번이 일치하는 사원 정보가 명부에 없습니다.");
    }
}

// Admin Mode Login Handler
function handleAdminLogin() {
    const pwVal = loginAdminPw.value.trim();

    if (!pwVal) {
        showLoginError(adminLoginError, "비밀번호를 입력해 주세요.");
        return;
    }

    if (pwVal === '0000') {
        currentUser = { role: 'admin' };

        // Hide login gate
        loginGate.classList.add('fade-out');
        setTimeout(() => {
            loginGate.style.display = 'none';
        }, 500);

        // UI Adjustments for Admin Mode
        statsSection.style.display = 'block'; // Show sidebar stats for Admin
        chatArea.style.display = 'none'; // Hide chatbot completely for Admin
        adminDashboard.style.display = 'flex'; // Show Dashboard
        
        headerUserBadge.style.display = 'inline-block';
        headerUserBadge.className = 'user-badge admin';
        headerUserBadge.textContent = `관리자`;
        btnLogout.style.display = 'inline-block';

        // Populate Dashboard
        renderAdminDashboard();
    } else {
        showLoginError(adminLoginError, "비밀번호가 일치하지 않습니다.");
    }
}

// Logout Handler
function handleLogout() {
    currentUser = null;
    
    // Clear login input forms
    loginUserName.value = '';
    loginUserId.value = '';
    loginAdminPw.value = '';
    
    // Show login gate again
    loginGate.style.display = 'flex';
    loginGate.classList.remove('fade-out');
    
    // Hide header info
    headerUserBadge.style.display = 'none';
    btnLogout.style.display = 'none';
    
    // Hide Admin Elements
    statsSection.style.display = 'none';
    chatArea.style.display = 'none';
    adminDashboard.style.display = 'none';

    // Clear charts
    if (distChart) {
        distChart.destroy();
        distChart = null;
    }
    if (yearsChart) {
        yearsChart.destroy();
        yearsChart = null;
    }

    // Reset Chat messages
    chatMessages.innerHTML = '';
}

// Error Message Helper for Login
function showLoginError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
}

// Initialize Chat (Employee Mode only)
function initChat() {
    if (!currentUser || currentUser.role === 'admin') return;

    const cardClass = currentUser.trainingStatus.includes('예비군') ? 'reserve' : (currentUser.trainingStatus.includes('민방위') ? 'civil' : 'exclude');
    const welcomeHtml = `
        <strong>${currentUser.name} 사원님, 환영합니다! 🙋‍♂️</strong><br><br>
        회사 근태 시스템 명부(**대원현황.xlsx**)에 등록된 사원님의 정보와 훈련 구분입니다.<br>
        
        <div class="user-info-card ${cardClass}" style="margin: 0.75rem 0;">
            <div class="card-row">
                <span class="card-label">사원명</span>
                <span class="card-value">${currentUser.name}</span>
            </div>
            <div class="card-row">
                <span class="card-label">사번</span>
                <span class="card-value">${currentUser.empId}</span>
            </div>
            <div class="card-row">
                <span class="card-label">소속 부서</span>
                <span class="card-value">${currentUser.dept || '-'} (${currentUser.site || '-'})</span>
            </div>
            <div class="card-row">
                <span class="card-label">연락처</span>
                <span class="card-value">${currentUser.phone || '-'}</span>
            </div>
            <div class="card-row">
                <span class="card-label">훈련 대상 구분</span>
                <span class="card-value">${currentUser.trainingStatus} ${currentUser.trainingType ? `(${currentUser.trainingType})` : ''}</span>
            </div>
            <div class="card-row">
                <span class="card-label">비고 (상태)</span>
                <span class="card-value">${currentUser.remarks || '정상 대상'}</span>
            </div>
        </div>
        
        사원님께 배정된 예비군/민방위 참석 기준이나 회사의 유급 공가 및 결근 규정에 대해 질문해 주세요. 아래 퀵 버튼을 누르면 빠른 답변이 가능합니다! 👇
    `;
    
    appendChatMessage('bot', welcomeHtml);
    renderQuickOptions(['회사 근태규정', '증빙서류 제출 방법', '담당자 연락처']);
}

// Render Admin Dashboard (Stats, Charts, Table)
function renderAdminDashboard() {
    if (employeeList.length === 0) return;

    // Calculate Summary numbers
    let reserveCount = 0;
    let civilCount = 0;
    let excludeCount = 0;

    // Detailed sub-category stats
    let reserve1_4 = 0;
    let reserve5_6 = 0;
    let reserve7_8 = 0;

    let civil1_2 = 0;
    let civil3_4 = 0;
    let civil5_plus = 0;

    employeeList.forEach(emp => {
        const status = emp.trainingStatus || '';
        const typeStr = emp.trainingType || '';
        if (status.includes('예비군')) {
            reserveCount++;
            if (typeStr.includes('1~4년차') || typeStr.includes('1~4년')) {
                reserve1_4++;
            } else if (typeStr.includes('5~6년차') || typeStr.includes('5~6년')) {
                reserve5_6++;
            } else {
                reserve7_8++;
            }
        } else if (status.includes('민방위')) {
            civilCount++;
            if (typeStr.includes('1~2년차') || typeStr.includes('1~2년') || typeStr.includes('집합')) {
                civil1_2++;
            } else if (typeStr.includes('3~4년차') || typeStr.includes('3~4년')) {
                civil3_4++;
            } else {
                civil5_plus++;
            }
        } else {
            excludeCount++;
        }
    });

    // Update summary cards based on tab
    const cards = document.querySelectorAll('.summary-card');
    if (cards.length >= 4) {
        if (currentDashboardTab === 'all') {
            setSummaryCard(cards[0], 'fa-users', '총 인원', `${employeeList.length}명`, 'card-total');
            setSummaryCard(cards[1], 'fa-person-military-pointing', '예비군 대상', `${reserveCount}명`, 'card-reserve');
            setSummaryCard(cards[2], 'fa-person-military-rifle', '민방위 대상', `${civilCount}명`, 'card-civil');
            setSummaryCard(cards[3], 'fa-user-xmark', '훈련 제외자', `${excludeCount}명`, 'card-exclude');
        } else if (currentDashboardTab === 'reserve') {
            setSummaryCard(cards[0], 'fa-person-military-pointing', '예비군 총원', `${reserveCount}명`, 'card-reserve');
            setSummaryCard(cards[1], 'fa-shield-halved', '1~4년차 (동원)', `${reserve1_4}명`, 'card-reserve');
            setSummaryCard(cards[2], 'fa-person-running', '5~6년차 (기본/작계)', `${reserve5_6}명`, 'card-reserve');
            setSummaryCard(cards[3], 'fa-hourglass-half', '7~8년차 (대기)', `${reserve7_8}명`, 'card-exclude');
        } else if (currentDashboardTab === 'civil') {
            setSummaryCard(cards[0], 'fa-person-military-rifle', '민방위 총원', `${civilCount}명`, 'card-civil');
            setSummaryCard(cards[1], 'fa-users-line', '1~2년차 (집합)', `${civil1_2}명`, 'card-civil');
            setSummaryCard(cards[2], 'fa-laptop', '3~4년차 (사이버)', `${civil3_4}명`, 'card-civil');
            setSummaryCard(cards[3], 'fa-mobile-screen-button', '5년차+ (사이버)', `${civil5_plus}명`, 'card-exclude');
        }
    }

    // Toggle chart card visibility based on active tab
    const chartCards = document.querySelectorAll('.chart-card');
    if (chartCards.length >= 2) {
        if (currentDashboardTab === 'all') {
            chartCards[0].style.display = 'flex';
            chartCards[1].style.display = 'flex';
        } else if (currentDashboardTab === 'reserve') {
            chartCards[0].style.display = 'flex';
            chartCards[1].style.display = 'none';
        } else if (currentDashboardTab === 'civil') {
            chartCards[0].style.display = 'none';
            chartCards[1].style.display = 'flex';
        }
    }

    // Render Table (Auto triggers filter to apply current sub-tab filters)
    filterRosterTable();

    // Destroy existing charts
    if (distChart) distChart.destroy();
    if (yearsChart) yearsChart.destroy();

    // Chart 1: 훈련 구분별 분포 (Distribution)
    const distData = {
        '예비군 (1~4년차)': 0,
        '예비군 (5~6년차)': 0,
        '예비군 (7~8년차/대기)': 0,
        '민방위 (집합)': 0,
        '민방위 (사이버)': 0,
        '훈련 제외자': 0
    };

    employeeList.forEach(emp => {
        const typeStr = emp.trainingType || '';
        const statusStr = emp.trainingStatus || '';
        
        if (statusStr.includes('예비군')) {
            if (typeStr.includes('1~4년차') || typeStr.includes('1~4년')) {
                distData['예비군 (1~4년차)']++;
            } else if (typeStr.includes('5~6년차') || typeStr.includes('5~6년')) {
                distData['예비군 (5~6년차)']++;
            } else {
                distData['예비군 (7~8년차/대기)']++;
            }
        } else if (statusStr.includes('민방위')) {
            if (typeStr.includes('집합') || typeStr.includes('1~2년차')) {
                distData['민방위 (집합)']++;
            } else {
                distData['민방위 (사이버)']++;
            }
        } else {
            distData['훈련 제외자']++;
        }
    });

    const ctxDist = document.getElementById('chart-distribution').getContext('2d');
    distChart = new Chart(ctxDist, {
        type: 'doughnut',
        data: {
            labels: Object.keys(distData),
            datasets: [{
                data: Object.values(distData),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.75)', // Blue
                    'rgba(29, 78, 216, 0.75)', // Deep Blue
                    'rgba(96, 165, 250, 0.5)',  // Soft Blue
                    'rgba(139, 92, 246, 0.75)', // Purple
                    'rgba(167, 139, 250, 0.65)', // Light Purple
                    'rgba(75, 85, 99, 0.6)'      // Gray
                ],
                borderColor: '#111827',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#a3aed0',
                        font: { family: 'Outfit, Noto Sans KR', size: 11 }
                    }
                }
            }
        }
    });

    // Chart 2: 연차별 대원 분포
    const yearsData = {
        '예비군 1~4년': 0, '예비군 5~6년': 0, '예비군 7~8년/대기': 0,
        '민방위 1~2년': 0, '민방위 3~4년': 0, '민방위 5년+': 0
    };

    employeeList.forEach(emp => {
        const typeStr = emp.trainingType || '';
        const statusStr = emp.trainingStatus || '';
        
        if (statusStr.includes('예비군')) {
            if (typeStr.includes('1~4년차') || typeStr.includes('1~4년')) {
                yearsData['예비군 1~4년']++;
            } else if (typeStr.includes('5~6년차') || typeStr.includes('5~6년')) {
                yearsData['예비군 5~6년']++;
            } else {
                yearsData['예비군 7~8년/대기']++;
            }
        } else if (statusStr.includes('민방위')) {
            if (typeStr.includes('1~2년차') || typeStr.includes('1~2년')) {
                yearsData['민방위 1~2년']++;
            } else if (typeStr.includes('3~4년차') || typeStr.includes('3~4년')) {
                yearsData['민방위 3~4년']++;
            } else {
                yearsData['민방위 5년+']++;
            }
        }
    });

    const ctxYears = document.getElementById('chart-years').getContext('2d');
    yearsChart = new Chart(ctxYears, {
        type: 'bar',
        data: {
            labels: Object.keys(yearsData),
            datasets: [{
                label: '대원 수',
                data: Object.values(yearsData),
                backgroundColor: Object.keys(yearsData).map(k => k.includes('예비군') ? 'rgba(59, 130, 246, 0.7)' : 'rgba(139, 92, 246, 0.7)'),
                borderColor: Object.keys(yearsData).map(k => k.includes('예비군') ? '#3b82f6' : '#8b5cf6'),
                borderWidth: 1.5,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: { color: '#626d8a', font: { family: 'Outfit, Noto Sans KR', size: 9 } }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.04)' },
                    ticks: { color: '#626d8a', font: { family: 'Outfit' }, stepSize: 2 },
                    beginAtZero: true
                }
            }
        }
    });
}

// Render Table Rows
function renderRosterTable(list) {
    rosterTableTbody.innerHTML = '';

    if (list.length === 0) {
        rosterTableTbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4" style="color: var(--text-muted); text-align: center;">검색 결과 조건에 맞는 사원이 없습니다.</td>
            </tr>
        `;
        return;
    }

    list.forEach(emp => {
        const tr = document.createElement('tr');
        const badgeClass = emp.trainingStatus.includes('예비군') ? 'badge-orange' : (emp.trainingStatus.includes('민방위') ? 'badge-purple' : 'badge-gray');
        tr.innerHTML = `
            <td><code>${emp.empId}</code></td>
            <td><strong>${emp.name}</strong></td>
            <td>${emp.dept || '-'} (${emp.site || '-'})</td>
            <td><span style="font-size: 0.85rem;">${emp.phone || '-'}</span></td>
            <td><span class="badge ${badgeClass}" style="padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">${emp.trainingStatus}</span></td>
            <td><span style="font-size: 0.85rem;">${emp.trainingType || '-'}</span></td>
            <td><span style="font-size: 0.8rem; color: ${emp.remarks === '정상 대상' ? 'var(--success)' : 'var(--text-secondary)'}">${emp.remarks || '-'}</span></td>
        `;
        rosterTableTbody.appendChild(tr);
    });
}

// Filter Roster Table based on search query and category buttons
function filterRosterTable() {
    const query = tableSearchInput.value.trim().toLowerCase();
    
    // Get active filter type
    const activeBtn = document.querySelector('.filter-btn.active');
    const filterType = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';

    let filtered = employeeList;

    // Apply category filter
    if (filterType === 'reserve') {
        filtered = filtered.filter(emp => emp.trainingStatus.includes('예비군'));
    } else if (filterType === 'civil') {
        filtered = filtered.filter(emp => emp.trainingStatus.includes('민방위'));
    } else if (filterType === 'exclude') {
        filtered = filtered.filter(emp => !emp.trainingStatus.includes('예비군') && !emp.trainingStatus.includes('민방위'));
    }

    // Apply search query
    if (query) {
        filtered = filtered.filter(emp => 
            emp.name.toLowerCase().includes(query) || 
            emp.empId.includes(query)
        );
    }

    renderRosterTable(filtered);
}

// Calculate stats for sidebar
function updateSidebarStats() {
    if (employeeList.length === 0) return;

    let reserveCount = 0;
    let civilCount = 0;
    let excludeCount = 0;

    employeeList.forEach(emp => {
        const status = emp.trainingStatus || '';
        if (status.includes('예비군')) {
            reserveCount++;
        } else if (status.includes('민방위')) {
            civilCount++;
        } else {
            excludeCount++;
        }
    });

    statTotalEmp.textContent = `${employeeList.length}명`;
    statReserveCount.textContent = `${reserveCount}명`;
    statCivilCount.textContent = `${civilCount}명`;
    statExcludeCount.textContent = `${excludeCount}명`;
}

// Date formatter helper
function formatDate(date) {
    if (!date || isNaN(date.getTime())) return '-';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

// Handle User Messages (Employee Mode only)
function handleUserMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Append user message
    appendChatMessage('user', text);
    chatInput.value = '';

    // Trigger Bot response with typing animation
    showTypingIndicator();

    setTimeout(() => {
        hideTypingIndicator();
        const botResponse = generateBotResponse(text);
        appendChatMessage('bot', botResponse.html, botResponse.quickOptions);
    }, 600);
}

// Shortcut query method (Employee Mode only)
function sendQueryDirectly(query) {
    appendChatMessage('user', query);
    showTypingIndicator();

    setTimeout(() => {
        hideTypingIndicator();
        const botResponse = generateBotResponse(query);
        appendChatMessage('bot', botResponse.html, botResponse.quickOptions);
    }, 600);
}

// Render recommended tags (Employee Mode only)
function renderQuickOptions(options) {
    quickOptionsContainer.innerHTML = '';
    if (!options || options.length === 0) return;

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quick-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => {
            sendQueryDirectly(opt);
        });
        quickOptionsContainer.appendChild(btn);
    });
}

// Append Chat Message (Employee Mode only)
function appendChatMessage(sender, htmlText) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const timeStr = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const avatarIcon = sender === 'bot' ? '<i class="fa-solid fa-robot"></i>' : '<i class="fa-solid fa-user"></i>';
    const senderName = sender === 'bot' ? '가이드봇' : '나';

    messageDiv.innerHTML = `
        <div class="msg-avatar">${avatarIcon}</div>
        <div class="msg-content-wrapper">
            <div class="msg-bubble">${htmlText}</div>
            <div class="msg-meta">${senderName} • ${timeStr}</div>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    scrollChatToBottom();
}

// Typing Indicator Helpers (Employee Mode only)
function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message bot';
    indicator.id = 'typing-indicator';
    indicator.innerHTML = `
        <div class="msg-avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="msg-content-wrapper">
            <div class="msg-bubble">
                <div class="typing-indicator">
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                    <span class="typing-dot"></span>
                </div>
            </div>
        </div>
    `;
    chatMessages.appendChild(indicator);
    scrollChatToBottom();
}

// Hide Typing Indicator (Employee Mode only)
function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
}

// Scroll chat area to bottom (Employee Mode only)
function scrollChatToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Main response matching logic (Employee Mode only)
function generateBotResponse(userInput) {
    const cleanInput = userInput.trim().toLowerCase().replace(/\s+/g, '');
    let html = '';
    let quickOptions = ['회사 근태규정', '증빙서류 제출 방법', '담당자 연락처'];

    // 1. Search employee roster (Privacy Enforcement: Employee can only see their own detail card)
    const matchedEmployee = findEmployee(cleanInput);
    if (matchedEmployee) {
        const emp = matchedEmployee;
        
        // Prevent employee from querying someone else's ID or name
        if (currentUser && currentUser.empId !== emp.empId) {
            html = `
                🔒 <strong>조회 권한 제한 안내</strong><br><br>
                사원 모드에서는 보안 유지를 위해 **본인의 예비군/민방위 정보만 조회**가 가능합니다.<br>
                동료의 명부 정보 조회가 필요하시다면 인사팀 예비군/민방위 담당자에게 문의하시기 바랍니다.<br><br>
                • **담당자 연락처**: 인사팀 김철수 대리 (내선 5678)
            `;
            return { html, quickOptions };
        }

        const cardClass = emp.trainingStatus.includes('예비군') ? 'reserve' : (emp.trainingStatus.includes('민방위') ? 'civil' : 'exclude');
        let detailGuide = '';
        
        const typeStr = emp.trainingType || '';
        const statusStr = emp.trainingStatus || '';
        
        if (typeStr.includes('동원훈련')) {
            detailGuide = `🎖️ **동원훈련 대상자 안내**:<br>
            • **내용**: 2박 3일(28시간) 동안 군부대 입영하여 동원훈련을 실시합니다.<br>
            • **근태**: 사전에 근태 시스템에 훈련 통지서를 첨부하여 <strong>유급 공가</strong>를 상신하십시오.<br>
            • **사후**: 퇴소 시 훈련장에서 발급받은 '교육훈련필증'을 근태 시스템에 등록하여 확정받아야 합니다.`;
        } else if (typeStr.includes('동미참') || typeStr.includes('동작기본') || typeStr.includes('기본훈련') || typeStr.includes('5~6년차')) {
            detailGuide = `🎖️ **동미참 및 기본/작계 훈련 대상자 안내**:<br>
            • **내용**: 연차별로 기본훈련 및 작계훈련(또는 동미참훈련)을 출퇴근 형식으로 이수해야 합니다.<br>
            • **근태**: 훈련 참석일 전체 또는 참석 시간만큼 <strong>유급 공가</strong>가 보장됩니다.<br>
            • **사후**: 훈련장에서 발급받은 '교육훈련필증'을 사내 시스템에 제출하십시오.`;
        } else if (typeStr.includes('7~8년차') || typeStr.includes('대기')) {
            detailGuide = `🎖️ **7~8년차 예비군 안내**:<br>
            • **내용**: 예비군 대기 기간으로, 기본 소집 훈련은 없습니다.<br>
            • **근태**: 소집 훈련이 없으므로 정상 출근 대상이며 별도의 공가 신청은 필요하지 않습니다.`;
        } else if (typeStr.includes('민방위 1~2년차') || typeStr.includes('집합')) {
            detailGuide = `🛡️ **민방위 집합교육 대상자 안내**:<br>
            • **내용**: 연 1회 오프라인 교육 4시간을 지정 교육장에서 이수하셔야 합니다.<br>
            • **근태**: 교육 소집 시간(이동시간 포함)만큼 <strong>유급 공가</strong>로 처리됩니다.<br>
            • **사후**: 참석 후 발급받은 '교육이수증'을 제출하십시오.`;
        } else if (typeStr.includes('민방위 3~4년차') || (typeStr.includes('사이버') && (typeStr.includes('3~4년') || typeStr.includes('3~4년차')))) {
            detailGuide = `🛡️ **민방위 사이버교육(3~4년차) 안내**:<br>
            • **내용**: 온라인 스마트민방위 웹사이트 등을 통해 연 1회 2시간 교육을 이수해야 합니다.<br>
            • **근태**: 교육이 평일 근무시간 외(예: 퇴근 후 또는 주말)에 온라인으로 진행되는 경우, 별도 근태 공가는 부여되지 않습니다. 단, 평일 근무 시간에 이수하시는 경우 이수시간에 대해 부서장 승인 후 수강이 권장됩니다.<br>
            • **사후**: 온라인 교육 수료 후 이수증(PDF)을 발급받아 보관하시기 바랍니다.`;
        } else if (typeStr.includes('민방위 5년') || typeStr.includes('5년차 이상') || (typeStr.includes('사이버') && typeStr.includes('5년'))) {
            detailGuide = `🛡️ **민방위 사이버교육(5년차 이상) 안내**:<br>
            • **내용**: 만 40세까지 편성되며, 온라인으로 연 1회 1시간의 교육을 이수해야 합니다.<br>
            • **근태**: 평일 일과 시간 외 수강이 권장되며, 수강 완료 후 교육 이수증(PDF)을 출력해 보관하십시오.`;
        } else {
            detailGuide = `🚫 **훈련 대상 제외 안내**:<br>
            현재 명부 상 예비군 및 민방위 편성 대상이 아닙니다. (사유: ${emp.remarks || '일반 제외자'})`;
        }

        html = `
            🔍 <strong>사원님의 훈련 정보 조회 결과입니다.</strong>
            
            <div class="user-info-card ${cardClass}">
                <div class="card-row">
                    <span class="card-label">사원명</span>
                    <span class="card-value">${emp.name}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">사번</span>
                    <span class="card-value">${emp.empId}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">소속 부서</span>
                    <span class="card-value">${emp.dept || '-'} (${emp.site || '-'})</span>
                </div>
                <div class="card-row">
                    <span class="card-label">연락처</span>
                    <span class="card-value">${emp.phone || '-'}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">훈련 대상 구분</span>
                    <span class="card-value">${emp.trainingStatus} ${emp.trainingType ? `(${emp.trainingType})` : ''}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">비고 (상태)</span>
                    <span class="card-value">${emp.remarks || '정상 대상'}</span>
                </div>
            </div>
            <br>
            ${detailGuide}
        `;
        return { html, quickOptions };
    }

    // 2. Search Keyword FAQs
    // FAQ 1: 예비군 참석기준
    if (matchKeywords(cleanInput, ['예비군', '참석기준', '훈련시간', '연차', '작계', '동원', '동미참'])) {
        html = `
            🎖️ <strong>예비군 훈련 연차별 참석 기준 및 시간</strong> 안내입니다.<br><br>
            • <strong>1 ~ 4년차 예비군</strong><br>
            &nbsp;&nbsp;- <strong>동원지정자</strong>: 2박 3일(28시간) 군부대 입영 훈련<br>
            &nbsp;&nbsp;- <strong>동미참대상자</strong>: 32시간 (출퇴근 4일, 하루 8시간씩)<br>
            • <strong>5 ~ 6년차 예비군</strong><br>
            &nbsp;&nbsp;- 기본훈련 8시간 + 작계훈련 12시간 (전반기 6H, 후반기 6H) = 총 20시간 (출퇴근)<br>
            • <strong>7 ~ 8년차 예비군</strong><br>
            &nbsp;&nbsp;- 기본 소집 훈련 없음 (비상 연락체계 유지 및 대기 기간)<br><br>
            💡 상세 일정 및 훈련 장소는 병무청 <strong>예비군 홈페이지</strong>(yebigun.mil.kr) 또는 개별 수령한 훈련 소집 통지서에서 확인 가능합니다.
        `;
    }
    // FAQ 2: 민방위 교육일정
    else if (matchKeywords(cleanInput, ['민방위', '교육일정', '사이버', '집합', '스마트민방위'])) {
        html = `
            🛡️ <strong>민방위 대원 연차별 교육 일정 및 시간</strong> 안내입니다.<br><br>
            • <strong>1 ~ 2년차 민방위</strong><br>
            &nbsp;&nbsp;- 집합 교육 4시간 (연 1회, 오프라인 소집교육)<br>
            • <strong>3 ~ 4년차 민방위</strong><br>
            &nbsp;&nbsp;- 사이버 교육 2시간 (연 1회, 온라인 교육)<br>
            • <strong>5년차 이상 ~ 만 40세 이하</strong><br>
            &nbsp;&nbsp;- 사이버 교육 1시간 (연 1회, 온라인 교육)<br><br>
            💡 오프라인 집합 교육의 일시는 거주 지역 행정동 교육 일정에 따릅니다. 온라인 교육은 지자체에서 전송한 모바일 스마트민방위 교육 알림톡을 통해 이수하실 수 있습니다.
        `;
    }
    // FAQ 3: 회사 근태규정
    else if (matchKeywords(cleanInput, ['근태', '근태규정', '공가', '유급', '휴가', '신청'])) {
        html = `
            📄 <strong>예비군 및 민방위 참석에 대한 회사 근태 규정</strong> 안내입니다.<br><br>
            우리 회사는 관련 법령(예비군법 제10조 및 근로기준법 제10조)에 의거하여 임직원의 비상 소집 및 훈련 기간에 대해 <strong>100% 유급 공가</strong>를 전액 보장합니다.<br><br>
            • <strong>공가 신청 방법 (사전)</strong>:<br>
            1. 병무청 또는 행정안전부에서 송부된 <strong>훈련 소집 통지서</strong>를 캡처하거나 다운로드합니다.<br>
            2. 사내 근태관리 시스템에 접속하여 결재 문서 작성 시 근태 구분을 '<strong>공가(유급)</strong>'로 선택합니다.<br>
            3. 훈련 소집 통지서를 첨부 문서로 등록한 후 상신하여 부서장 결재를 득합니다.<br><br>
            ※ 입영 훈련(동원 2박 3일)의 경우 해당 기간(3일) 전체에 대해 공가가 부여되며, 반일 교육(예: 민방위 4시간, 예비군 기본훈련 8시간)의 경우 실제 교육 시간 및 이동 시간에 비례하여 공가가 적용됩니다.
        `;
    }
    // FAQ 4: 증빙서류 제출 방법
    else if (matchKeywords(cleanInput, ['증빙', '필증', '이수증', '서류', '제출'])) {
        html = `
            📁 <strong>훈련 참석 사후 증빙서류 제출 방법</strong> 안내입니다.<br><br>
            훈련 이수 후 급여 삭감이나 근태 결근 처리가 되지 않으려면 반드시 <strong>사후 증빙서류를 제출</strong>해 주셔야 최종 공가 처리가 확정됩니다.<br><br>
            • <strong>제출 서류 종류</strong>:<br>
            &nbsp;&nbsp;- <strong>예비군</strong>: 훈련장에서 수령하는 <strong>'교육훈련 필증'</strong> (또는 예비군 홈페이지에서 출력 가능)<br>
            &nbsp;&nbsp;- <strong>민방위</strong>: 집합교육 수료증 또는 온라인 <strong>'교육 이수증'</strong><br><br>
            • <strong>제출 방법</strong>:<br>
            훈련 복귀 후 <strong>3일 이내</strong>에 사내 근태시스템의 공가 신청 건에 첨부 파일로 추가 등록하고 최종 제출을 완료하십시오.
        `;
    }
    // FAQ 5: 담당자 연락처
    else if (matchKeywords(cleanInput, ['담당자', '연락처', '인사팀', '전화번호', '김철수', '대리', '이메일', '전화', '콜'])) {
        html = `
            📞 <strong>인사팀 예비군/민방위 담당자 안내</strong>입니다.<br><br>
            상세한 문의나 행정 지원이 필요하신 경우 아래 인사팀 담당자에게 직접 연락 주시면 감사하겠습니다.<br><br>
            • **담당자**: 인사팀 김철수 대리<br>
            • **사내 내선번호**: 5678<br>
            • **이메일**: <a href="mailto:chulsoo.kim@company.com" style="color: var(--primary); text-decoration: none;">chulsoo.kim@company.com</a>
        `;
    }
    // 3. Fallback message
    else {
        html = `
            죄송합니다. 입력하신 내용("<code>${escapeHtml(userInput)}</code>")에 대한 답변을 찾지 못했습니다. 😢<br><br>
            자주 묻는 질문('예비군 참석기준', '민방위 교육일정', '회사 근태규정', '담당자 연락처' 등)을 입력하시거나 아래 퀵 버튼을 클릭해 보세요.<br><br>
            상세 문의는 **인사팀 예비군 담당자(김철수 대리, 내선 5678)**에게 문의 바랍니다.
        `;
    }

    return { html, quickOptions };
}

// Find employee by name or ID
function findEmployee(searchTerm) {
    if (employeeList.length === 0) return null;

    // Check exact employee ID
    let found = employeeList.find(emp => emp.empId.toLowerCase() === searchTerm);
    if (found) return found;

    // Check exact name
    found = employeeList.find(emp => emp.name.toLowerCase() === searchTerm);
    if (found) return found;

    // Substring match for name
    found = employeeList.find(emp => emp.name.toLowerCase().includes(searchTerm) && searchTerm.length >= 2);
    if (found) return found;

    return null;
}

// Match keywords helper
function matchKeywords(input, keywords) {
    return keywords.some(keyword => input.includes(keyword.toLowerCase().replace(/\s+/g, '')));
}

// HTML Escaper
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Helper to set summary cards inside admin dashboard
function setSummaryCard(cardEl, iconClass, label, value, className) {
    cardEl.className = `summary-card ${className}`;
    cardEl.querySelector('.card-icon i').className = `fa-solid ${iconClass}`;
    cardEl.querySelector('.card-label').textContent = label;
    cardEl.querySelector('h4').textContent = value;
}

// AI Statistics & Roster Natural Language Query Parser
function handleAdminAIQuery() {
    const queryInput = document.getElementById('admin-ai-input');
    const resultPanel = document.getElementById('admin-ai-result-panel');
    
    if (!queryInput || !resultPanel) return;
    
    const rawQuery = queryInput.value.trim();
    if (!rawQuery) {
        alert("질문을 입력해 주세요.");
        return;
    }
    
    const query = rawQuery.toLowerCase().replace(/\s+/g, '');
    
    let filtered = employeeList;
    let appliedFilters = [];
    
    // 1. Business Site matching
    if (query.includes('온양')) {
        filtered = filtered.filter(emp => (emp.site || '').includes('온양'));
        appliedFilters.push('<strong>사업장: 온양</strong>');
    } else if (query.includes('천안')) {
        filtered = filtered.filter(emp => (emp.site || '').includes('천안'));
        appliedFilters.push('<strong>사업장: 천안</strong>');
    }
    
    // 2. Department matching
    const departments = ['인사기획팀', '재무관리팀', 'R&D', '영업', 'IT전략본부'];
    departments.forEach(dept => {
        const cleanDept = dept.toLowerCase().replace(/\s+/g, '');
        if (query.includes(cleanDept) || (dept === 'IT전략본부' && query.includes('it전략'))) {
            filtered = filtered.filter(emp => (emp.dept || '').toLowerCase().includes(dept.toLowerCase()));
            appliedFilters.push(`<strong>부서: ${dept}</strong>`);
        }
    });
    
    // 3. Training Type matching
    if (query.includes('예비군')) {
        filtered = filtered.filter(emp => emp.trainingStatus.includes('예비군'));
        appliedFilters.push('<strong>대상: 예비군</strong>');
    } else if (query.includes('민방위')) {
        filtered = filtered.filter(emp => emp.trainingStatus.includes('민방위'));
        appliedFilters.push('<strong>대상: 민방위</strong>');
    } else if (query.includes('제외') || query.includes('대상아님') || query.includes('대상아닌') || query.includes('면제')) {
        filtered = filtered.filter(emp => !emp.trainingStatus.includes('예비군') && !emp.trainingStatus.includes('민방위'));
        appliedFilters.push('<strong>대상: 훈련 제외자</strong>');
    }
    
    // 4. Detailed types
    if (query.includes('동원')) {
        filtered = filtered.filter(emp => (emp.trainingType || '').includes('동원'));
        appliedFilters.push('<strong>유형: 동원훈련</strong>');
    } else if (query.includes('동미참') || query.includes('동작기본') || query.includes('기본') || query.includes('작계')) {
        filtered = filtered.filter(emp => (emp.trainingType || '').includes('동미참') || (emp.trainingType || '').includes('동작기본') || (emp.trainingType || '').includes('기본'));
        appliedFilters.push('<strong>유형: 동작기본/기본훈련</strong>');
    } else if (query.includes('집합') || query.includes('오프라인')) {
        filtered = filtered.filter(emp => (emp.trainingType || '').includes('집합'));
        appliedFilters.push('<strong>유형: 집합교육</strong>');
    } else if (query.includes('사이버') || query.includes('온라인') || query.includes('인터넷')) {
        filtered = filtered.filter(emp => (emp.trainingType || '').includes('사이버') || (emp.trainingType || '').includes('온라인'));
        appliedFilters.push('<strong>유형: 사이버교육</strong>');
    }
    
    // 5. Year matching
    if (query.includes('1~4년') || query.includes('1-4년') || query.includes('1에서4년')) {
        filtered = filtered.filter(emp => (emp.trainingType || '').includes('1~4년') || (emp.trainingType || '').includes('1-4년'));
        appliedFilters.push('<strong>연차: 1~4년차</strong>');
    } else if (query.includes('5~6년') || query.includes('5-6년')) {
        filtered = filtered.filter(emp => (emp.trainingType || '').includes('5~6년') || (emp.trainingType || '').includes('5-6년'));
        appliedFilters.push('<strong>연차: 5~6년차</strong>');
    } else if (query.includes('1~2년') || query.includes('1-2년')) {
        filtered = filtered.filter(emp => (emp.trainingType || '').includes('1~2년') || (emp.trainingType || '').includes('1-2년'));
        appliedFilters.push('<strong>연차: 1~2년차</strong>');
    } else if (query.includes('3~4년') || query.includes('3-4년')) {
        filtered = filtered.filter(emp => (emp.trainingType || '').includes('3~4년') || (emp.trainingType || '').includes('3-4년'));
        appliedFilters.push('<strong>연차: 3~4년차</strong>');
    } else if (query.includes('5년이상') || query.includes('5년차이상') || query.includes('5년+')) {
        filtered = filtered.filter(emp => (emp.trainingType || '').includes('5년') || (emp.trainingType || '').includes('이상'));
        appliedFilters.push('<strong>연차: 5년차 이상</strong>');
    }
    
    // 6. Missing value check
    if (query.includes('이메일') && (query.includes('없는') || query.includes('미등록') || query.includes('누락') || query.includes('빈'))) {
        filtered = filtered.filter(emp => !emp.email || emp.email.trim() === '');
        appliedFilters.push('<strong>이메일 미등록 사원</strong>');
    } else if (query.includes('연락처') && (query.includes('없는') || query.includes('미등록') || query.includes('누락') || query.includes('빈') || query.includes('전화번호'))) {
        filtered = filtered.filter(emp => !emp.phone || emp.phone.trim() === '');
        appliedFilters.push('<strong>연락처 미등록 사원</strong>');
    }
    
    // Fallback basic text search on Name or ID if nothing else matches
    if (appliedFilters.length === 0) {
        const textMatches = employeeList.filter(emp => 
            emp.name.toLowerCase().includes(query) || 
            emp.empId.includes(query)
        );
        if (textMatches.length > 0) {
            filtered = textMatches;
            appliedFilters.push(`<strong>검색 키워드: "${rawQuery}"</strong>`);
        } else {
            resultPanel.innerHTML = `
                <div class="ai-result-summary" style="color: var(--danger); font-size: 0.85rem;">
                    ❌ <strong>분석할 수 없는 질문이거나 조건에 맞는 대원이 없습니다.</strong><br>
                    입력된 검색어: "<code>${escapeHtml(rawQuery)}</code>"<br><br>
                    💡 **이런 질문을 해보세요:**<br>
                    • <em>"온양 사업장 예비군 몇 명?"</em><br>
                    • <em>"인사기획팀 민방위 대상자 명단 보여줘"</em><br>
                    • <em>"이메일 미등록 사원 목록"</em><br>
                    • <em>"5~6년차 예비군 수 확인해줘"</em><br>
                    • <em>"천안 재무관리팀 명단"</em>
                </div>
            `;
            resultPanel.classList.remove('hidden');
            return;
        }
    }
    
    const totalCount = filtered.length;
    const reserveCount = filtered.filter(e => e.trainingStatus.includes('예비군')).length;
    const civilCount = filtered.filter(e => e.trainingStatus.includes('민방위')).length;
    const excludeCount = totalCount - reserveCount - civilCount;
    
    let htmlContent = `
        <div class="ai-result-summary">
            📊 <strong>분석 조건:</strong> ${appliedFilters.join(' + ')}<br>
            질문하신 조건에 부합하는 사원은 총 <strong>${totalCount}명</strong>입니다.
        </div>
        
        <div class="ai-mini-stats">
            <div class="ai-stat-card">
                <span class="stat-val">${totalCount}명</span>
                <span class="stat-lbl">부합 인원</span>
            </div>
            ${reserveCount > 0 ? `
            <div class="ai-stat-card accent-blue">
                <span class="stat-val">${reserveCount}명</span>
                <span class="stat-lbl">예비군</span>
            </div>` : ''}
            ${civilCount > 0 ? `
            <div class="ai-stat-card accent-green">
                <span class="stat-val">${civilCount}명</span>
                <span class="stat-lbl">민방위</span>
            </div>` : ''}
            ${excludeCount > 0 ? `
            <div class="ai-stat-card">
                <span class="stat-val">${excludeCount}명</span>
                <span class="stat-lbl">제외자</span>
            </div>` : ''}
        </div>
    `;
    
    // Render list if results found
    if (totalCount > 0) {
        let rowsHtml = '';
        filtered.forEach(emp => {
            rowsHtml += `
                <tr>
                    <td><code>${emp.empId}</code></td>
                    <td><strong>${emp.name}</strong></td>
                    <td>${emp.dept || '-'} (${emp.site || '-'})</td>
                    <td>${emp.phone || '-'}</td>
                    <td><span style="font-size:0.75rem; color: ${emp.trainingStatus.includes('예비군') ? 'var(--orange)' : (emp.trainingStatus.includes('민방위') ? 'var(--purple)' : 'var(--text-muted)')}; font-weight:600;">${emp.trainingStatus}</span></td>
                    <td>${emp.trainingType || '-'}</td>
                </tr>
            `;
        });
        
        htmlContent += `
            <div class="ai-mini-table-wrapper">
                <table class="ai-mini-table">
                    <thead>
                        <tr>
                            <th>사번</th>
                            <th>성명</th>
                            <th>부서 (사업장)</th>
                            <th>연락처</th>
                            <th>대상구분</th>
                            <th>훈련유형</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
        `;
    }
    
    resultPanel.innerHTML = htmlContent;
    resultPanel.classList.remove('hidden');
}
