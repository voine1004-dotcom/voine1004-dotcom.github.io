// Global State
let employeeList = [];
let currentYear = 2026;
let currentMonth = 6; // July (0-indexed)

// DOM Elements
const countOnyxReserve = document.getElementById('count-onyx-reserve');
const countOnyxCivil = document.getElementById('count-onyx-civil');
const countCheonanReserve = document.getElementById('count-cheonan-reserve');
const countCheonanCivil = document.getElementById('count-cheonan-civil');
const countTotal = document.getElementById('count-total');
const calendarGrid = document.getElementById('calendar-grid');
const tooltip = document.getElementById('tooltip');
const tooltipTitle = document.getElementById('tooltip-title');
const tooltipBody = document.getElementById('tooltip-body');
const dbLoadStatus = document.getElementById('db-load-status');
const navButtons = document.querySelectorAll('.nav-btn');
const tabViews = document.querySelectorAll('.tab-view');
const weeksTimelineContainer = document.getElementById('weeks-timeline-container');
const calendarYearSelect = document.getElementById('calendar-year-select');
const calendarMonthSelect = document.getElementById('calendar-month-select');

// Init application
document.addEventListener('DOMContentLoaded', () => {
    loadRosterData();
    setupTooltip();
    setupTabSwitching();
    render8WeeksTimeline();
    setupCalendarSelectors();
    setupTodoTable();
});

// Tab Switching Handler
function setupTabSwitching() {
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from buttons
            navButtons.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');

            // Hide all tab views
            tabViews.forEach(view => view.classList.remove('active'));
            
            // Show target view
            const targetId = btn.getAttribute('data-target');
            const targetView = document.getElementById(targetId);
            if (targetView) {
                targetView.classList.add('active');
            }
        });
    });
}

// Calendar Year/Month Selectors
function setupCalendarSelectors() {
    calendarYearSelect.addEventListener('change', (e) => {
        currentYear = parseInt(e.target.value);
        renderCalendar();
    });

    calendarMonthSelect.addEventListener('change', (e) => {
        currentMonth = parseInt(e.target.value);
        renderCalendar();
    });
}

// 8 Weeks Timeline Data (Categorized by Site (Onyx first) & Target Group)
const weeksData = [
    {
        week: '금주업무',
        dateRange: '6월 29일 ~ 7월 5일',
        onyx: {
            reserve: '온양 사업장 예비군 대원(16명) 대상자 실태 파악 및 1차 소집 안내문 발송.',
            civil: '온양 민방위 대원 비상 연락망 정비 및 사이버 교육 시작 1차 알림톡 전송.'
        },
        cheonan: {
            reserve: '천안 사업장 예비군 명부 대조 검증 및 훈련 일정 사전 공지 완료.',
            civil: '천안 민방위 대원 스마트 민방위 사이버 교육 이수 현황 주간 모니터링 개시.'
        }
    },
    {
        week: '37주차',
        dateRange: '7월 6일 ~ 7월 12일',
        onyx: {
            reserve: '수임군부대 연계 온양 예비군 교육 일정 조율 및 인사팀 유급휴가(공가) 처리 협의.',
            civil: '온양 민방위 교육 주간 운영 및 사이버 교육 미참석 대원 독려 전화 안내.'
        },
        cheonan: {
            reserve: '천안 예비군 집중 훈련을 위한 장비 지원 및 차량 배차 세부 계획 수립.',
            civil: '천안 민방위 소집교육장 사용 협조 공문 접수 및 관련 예산 집행 승인.'
        }
    },
    {
        week: '38주차',
        dateRange: '7월 13일 ~ 7월 19일',
        onyx: {
            reserve: '해외 출장 및 질병 등으로 인한 온양 대원 보류/연기 원서 접수 및 증빙서류 확인.',
            civil: '온양 민방위 비상소집 훈련 대피 시나리오 검토 및 대피로 통로 확보 점검.'
        },
        cheonan: {
            reserve: '천안 예비군 실기 훈련 안전사고 예방 체크리스트 작성 및 현장 구급 장비 확보.',
            civil: '천안 민방위 대면 소집교육 강사 섭외 및 교육 일정 최종 시간표 확인.'
        }
    },
    {
        week: '39주차',
        dateRange: '7월 20일 ~ 7월 26일',
        onyx: {
            reserve: '온양 예비군 훈련장 이동 셔틀버스 최종 배차 및 탑승 대원 안내문 발송.',
            civil: '온양 민방위 사이버 교육(3~4년차, 5년차 이상) 2차 알림톡 및 안내장 발송.'
        },
        cheonan: {
            reserve: '천안 예비군 동원훈련 전날 장비(헬멧, 탄대) 최종 정비 및 관리대장 점검.',
            civil: '천안 민방위 대면 집합교육 참석 대원 신원 대조 및 대기 명단 서류 확인.'
        }
    },
    {
        week: '40주차',
        dateRange: '7월 27일 ~ 8월 2일',
        onyx: {
            reserve: '온양 예비군 동원훈련 실시 및 안전관리팀 안전점검관 현장 동행 출장.',
            civil: '온양 민방위 스마트 교육 미이수 대원 대상 3차 알림톡 전송.'
        },
        cheonan: {
            reserve: '천안 예비군 실기훈련 실시 및 훈련 결과 이수증 수합.',
            civil: '천안 민방위 집합교육 출결 실시간 확인 및 불참 대원 사유서 집계.'
        }
    },
    {
        week: '41주차',
        dateRange: '8월 3일 ~ 8월 9일',
        onyx: {
            reserve: '온양 예비군 훈련 이수증 취합 및 인사 시스템 유급공가 실적 최종 승인.',
            civil: '온양 민방위 스마트 교육 이수 현황 주간 마감 보고서 작성.'
        },
        cheonan: {
            reserve: '천안 예비군 무단 불참자 분류 및 추가 보충 훈련 1차 안내 통보.',
            civil: '천안 민방위 스마트 교육 미이수자 개별 카카오 알림톡 재발송.'
        }
    },
    {
        week: '42주차',
        dateRange: '8월 10일 ~ 8월 16일',
        onyx: {
            reserve: '온양 예비군 훈련비 정산 및 식대 청구 자료 작성, 재무관리팀 이관.',
            civil: '온양 민방위 사이버 교육 최종 이수 완료 대원 명부 마감 처리.'
        },
        cheonan: {
            reserve: '천안 예비군 훈련 정비 보관소 물자 반납 수량 검수 및 정돈.',
            civil: '천안 민방위 교육 이수 서명 날인 서류 원본 문서고 아카이빙 작업.'
        }
    },
    {
        week: '43주차',
        dateRange: '8월 17일 ~ 8월 23일',
        onyx: {
            reserve: '온양 사업장 하반기 예비군 교육 훈련 개선 사항 분석 및 결과 보고.',
            civil: '온양 민방위 대원 비상식량 유통기한 전수 조사 및 노후 장비 폐기/교체 건의.'
        },
        cheonan: {
            reserve: '천안 사업장 훈련 결과 종합 분석 및 하반기 교육 개선 회의 소집.',
            civil: '천안 민방위 2026 하반기 안전 계획 수립 및 최종 보고서 작성 완료.'
        }
    }
];

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"]/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
    }[char]));
}

function render8WeeksTimeline(taskItems = []) {
    if (!weeksTimelineContainer) return;
    weeksTimelineContainer.innerHTML = '';

    weeksData.forEach((item, weekIndex) => {
        const card = document.createElement('div');
        card.className = 'timeline-card';

        const weekTasks = taskItems.filter(task => isTaskInWeek(task.date, item.dateRange));
        const taskHtml = weekTasks.length > 0
            ? weekTasks.map(task => renderTaskItem(task)).join('')
            : '<div class="empty-week-task">등록된 일자별 업무가 없습니다.</div>';
        
        card.innerHTML = `
            <div class="timeline-badge">
                <span class="badge-week">${item.week}</span>
                <span class="badge-dates">(${item.dateRange})</span>
                <button class="btn-add-week-task" data-week-index="${weekIndex}" title="이 주차에 업무 추가">
                    <i class="fa-solid fa-plus"></i>
                </button>
            </div>
            <div class="timeline-content">
                <div class="timeline-site-block block-onyx">
                    <div class="block-label">
                        <span class="status-icon icon-onyx-reserve"><i class="fa-solid fa-industry"></i></span>
                        <strong>온양 사업장</strong>
                    </div>
                    <div class="block-detail-row">
                        <span class="detail-tag tag-reserve"><i class="fa-solid fa-helmet-safety"></i> 예비군</span>
                        <p class="detail-text">${item.onyx.reserve}</p>
                    </div>
                    <div class="block-detail-row">
                        <span class="detail-tag tag-civil"><i class="fa-solid fa-triangle-exclamation"></i> 민방위</span>
                        <p class="detail-text">${item.onyx.civil}</p>
                    </div>
                </div>

                <div class="timeline-site-block block-cheonan">
                    <div class="block-label">
                        <span class="status-icon icon-cheonan-reserve"><i class="fa-solid fa-industry"></i></span>
                        <strong>천안 사업장</strong>
                    </div>
                    <div class="block-detail-row">
                        <span class="detail-tag tag-reserve-cheonan"><i class="fa-solid fa-helmet-safety"></i> 예비군</span>
                        <p class="detail-text">${item.cheonan.reserve}</p>
                    </div>
                    <div class="block-detail-row">
                        <span class="detail-tag tag-civil-cheonan"><i class="fa-solid fa-circle-exclamation"></i> 민방위</span>
                        <p class="detail-text">${item.cheonan.civil}</p>
                    </div>
                </div>

                <section class="week-task-panel">
                    <div class="week-task-heading">
                        <span><i class="fa-solid fa-list-check"></i> 일자별 업무</span>
                        <span>${weekTasks.length}건</span>
                    </div>
                    <div class="week-task-list">${taskHtml}</div>
                </section>
            </div>
        `;
        weeksTimelineContainer.appendChild(card);
    });
}

function renderTaskItem(task) {
    const checklist = Array.isArray(task.checklist) ? task.checklist : [];
    const checklistHtml = checklist.length > 0
        ? checklist.map((item, index) => `
            <li class="checklist-row">
                <label>
                    <input type="checkbox" class="task-check" data-task-id="${task.id}" data-check-index="${index}" ${item.done ? 'checked' : ''}>
                    <span contenteditable="true" data-field="checkText" data-task-id="${task.id}" data-check-index="${index}">${escapeHtml(item.text)}</span>
                </label>
                <button class="btn-delete-check" data-task-id="${task.id}" data-check-index="${index}" title="체크리스트 삭제"><i class="fa-solid fa-xmark"></i></button>
            </li>
        `).join('')
        : '<li class="empty-checklist">체크리스트를 추가해보세요.</li>';

    return `
        <article class="task-item ${task.open ? 'open' : ''}" data-task-id="${task.id}">
            <div class="task-summary">
                <button class="task-title-toggle" data-task-id="${task.id}" title="세부항목 보기">
                    <i class="fa-solid fa-chevron-right"></i>
                </button>
                <span contenteditable="true" class="task-date" data-field="date" data-task-id="${task.id}">${escapeHtml(task.date)}</span>
                <strong class="task-title" data-task-id="${task.id}">${escapeHtml(task.title)}</strong>
                <button class="btn-delete-task" data-task-id="${task.id}" title="업무 삭제"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            <div class="task-detail-body">
                <div class="task-detail-label">업무제목</div>
                <div contenteditable="true" class="task-title-edit" data-field="title" data-task-id="${task.id}">${escapeHtml(task.title)}</div>
                <div class="task-detail-label">세부항목</div>
                <div contenteditable="true" class="task-details" data-field="details" data-task-id="${task.id}">${escapeHtml(task.details)}</div>
                <div class="task-detail-label">체크리스트</div>
                <ul class="task-checklist">${checklistHtml}</ul>
                <button class="btn-add-check" data-task-id="${task.id}"><i class="fa-solid fa-plus"></i> 체크리스트 추가</button>
            </div>
        </article>
    `;
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
            return norm;
        }).filter(item => item.name && item.empId);

        // Update UI status
        dbLoadStatus.textContent = `명부 연결됨 (${employeeList.length}명)`;
        dbLoadStatus.className = 'status-desc success';
        
        // Update Stats and Render Calendar
        updateStats();
        renderCalendar();
    } catch (error) {
        console.error("명부 로딩 실패:", error);
        dbLoadStatus.textContent = '명부 로딩 실패';
        dbLoadStatus.className = 'status-desc error';
        alert("명부 파일(대원현황.xlsx)을 로드하지 못했습니다. 로컬 서버 환경인지 확인바랍니다.");
    }
}

// Calculate and Update Header Statistics
function updateStats() {
    let onyxReserve = 0;
    let onyxCivil = 0;
    let cheonanReserve = 0;
    let cheonanCivil = 0;

    employeeList.forEach(emp => {
        if (emp.trainingStatus === '예비군') {
            if (emp.site === '온양') onyxReserve++;
            else if (emp.site === '천안') cheonanReserve++;
        } else if (emp.trainingStatus === '민방위') {
            if (emp.trainingType !== '대상아님') {
                if (emp.site === '온양') onyxCivil++;
                else if (emp.site === '천안') cheonanCivil++;
            }
        }
    });

    countOnyxReserve.textContent = onyxReserve;
    countOnyxCivil.textContent = onyxCivil;
    countCheonanReserve.textContent = cheonanReserve;
    countCheonanCivil.textContent = cheonanCivil;
    countTotal.textContent = onyxReserve + onyxCivil + cheonanReserve + cheonanCivil;
}

// Distribute Employees Deterministically to Calendar Days
function getScheduledEmployees(year, month, day, type, category) {
    const onyxReserveList = employeeList.filter(e => e.site === '온양' && e.trainingStatus === '예비군');
    const onyxCivilList = employeeList.filter(e => e.site === '온양' && e.trainingStatus === '민방위' && e.trainingType !== '대상아님');
    const cheonanReserveList = employeeList.filter(e => e.site === '천안' && e.trainingStatus === '예비군');
    const cheonanCivilList = employeeList.filter(e => e.site === '천안' && e.trainingStatus === '민방위' && e.trainingType !== '대상아님');

    if (month === 6) {
        if (category === 'onyx-reserve') {
            if (day === 1 && type === '동원훈련') return onyxReserveList.slice(0, 3);
            if (day === 10 && type === '실기/실습훈련') return onyxReserveList.slice(3, 6);
            if (day === 15 && type === '동원훈련') return onyxReserveList.slice(6, 11);
            if (day === 23 && type === '실기/실습훈련') return onyxReserveList.slice(11, 14);
            if (day === 31 && type === '동원훈련') return onyxReserveList.slice(14, 16);
        } 
        else if (category === 'onyx-civil') {
            if (day === 2 && type === '집합교육') return onyxCivilList.slice(0, 3);
            if (day === 7 && type === '교육/강의') return onyxCivilList.slice(3, 6);
            if (day === 11 && type === '집합교육') return onyxCivilList.slice(6, 8);
            if (day === 16 && type === '집합교육') return onyxCivilList.slice(8, 10);
            if (day === 24 && type === '집합교육') return onyxCivilList.slice(10, 12);
        } 
        else if (category === 'cheonan-reserve') {
            if (day === 4 && type === '실기/실습훈련') return cheonanReserveList.slice(0, 5);
            if (day === 9 && type === '동원훈련') return cheonanReserveList.slice(5, 8);
            if (day === 17 && type === '실기/실습훈련') return cheonanReserveList.slice(8, 11);
            if (day === 25 && type === '동원훈련') return cheonanReserveList.slice(11, 15);
            if (day === 30 && type === '실기/실습훈련') return cheonanReserveList.slice(15, 18);
        } 
        else if (category === 'cheonan-civil') {
            if (day === 9 && type === '집합교육') return cheonanCivilList.slice(0, 2);
            if (day === 14 && type === '교육/강의') return cheonanCivilList.slice(2, 5);
            if (day === 18 && type === '집합교육') return cheonanCivilList.slice(5, 7);
            if (day === 21 && type === '동원훈련') return cheonanCivilList.slice(7, 11);
            if (day === 22 && type === '사이버훈련') return cheonanCivilList.slice(11, 14);
            if (day === 28 && type === '집합교육') return cheonanCivilList.slice(14, 16);
            if (day === 28 && type === '사이버훈련') return cheonanCivilList.slice(16, 18);
            if (day === 29 && type === '교육/강의') return cheonanCivilList.slice(18, 22);
        }
    } else {
        const seed = (year + month * 13 + day * 37) % 5;
        if (category === 'onyx-reserve' && seed === 1 && (day % 7 === 2 || day % 7 === 4)) {
            if (type === '동원훈련') return onyxReserveList.slice(0, 3);
        }
        if (category === 'onyx-civil' && seed === 2 && (day % 7 === 1 || day % 7 === 3)) {
            if (type === '집합교육') return onyxCivilList.slice(0, 3);
        }
        if (category === 'cheonan-reserve' && seed === 3 && (day % 7 === 4 || day % 7 === 5)) {
            if (type === '실기/실습훈련') return cheonanReserveList.slice(0, 4);
        }
        if (category === 'cheonan-civil' && seed === 4 && (day % 7 === 2 || day % 7 === 5)) {
            if (type === '사이버훈련') return cheonanCivilList.slice(0, 4);
        }
    }

    return [];
}

// Render Calendar Grid dynamically
function renderCalendar() {
    calendarGrid.innerHTML = '';

    const startDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const gridDays = [];

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
        gridDays.push({ isCurrentMonth: false, day: prevMonthDays - i });
    }

    for (let i = 1; i <= totalDays; i++) {
        gridDays.push({ isCurrentMonth: true, day: i });
    }

    const remainingCells = 42 - gridDays.length;
    for (let i = 1; i <= remainingCells; i++) {
        gridDays.push({ isCurrentMonth: false, day: i });
    }

    const defaultComments = {
        7: '민방위 교육 주간',
        9: '천안 예비군 집중일',
        17: '안전점검 동행',
        25: '분기 장비점검'
    };

    gridDays.forEach((dayObj, index) => {
        const cell = document.createElement('div');
        cell.className = 'calendar-day-cell';
        if (!dayObj.isCurrentMonth) {
            cell.classList.add('dimmed');
        }

        const dayOfWeek = index % 7;
        if (dayOfWeek === 0) cell.classList.add('sun');
        if (dayOfWeek === 6) cell.classList.add('sat');

        const dateLabel = document.createElement('div');
        dateLabel.className = 'day-number';
        dateLabel.textContent = dayObj.day;
        cell.appendChild(dateLabel);

        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'day-events-container';

        if (dayObj.isCurrentMonth) {
            const dayNum = dayObj.day;
            const dailyEvents = getEventsForDay(currentYear, currentMonth, dayNum);

            dailyEvents.forEach(evt => {
                const emps = getScheduledEmployees(currentYear, currentMonth, dayNum, evt.type, evt.category);
                if (emps.length > 0) {
                    const eventEl = document.createElement('div');
                    eventEl.className = `event-badge ${evt.category}`;
                    
                    const iconEl = document.createElement('span');
                    iconEl.className = 'badge-icon';
                    iconEl.innerHTML = `<i class="${getCategoryIcon(evt.category)}"></i><i class="${getTypeIcon(evt.type)}"></i>`;
                    
                    const countEl = document.createElement('span');
                    countEl.className = 'badge-count';
                    countEl.textContent = `${emps.length}명`;

                    eventEl.appendChild(iconEl);
                    eventEl.appendChild(countEl);

                    eventEl.addEventListener('mouseenter', (e) => showTooltip(e, emps, dayNum, evt.type, evt.category));
                    eventEl.addEventListener('mouseleave', hideTooltip);

                    eventsContainer.appendChild(eventEl);
                }
            });

            const commentKey = `comment_${currentYear}_${currentMonth}_${dayNum}`;
            const storedComment = localStorage.getItem(commentKey);
            
            const initialComment = currentMonth === 6 && defaultComments[dayNum] 
                ? defaultComments[dayNum] 
                : '-';
            const activeComment = storedComment !== null ? storedComment : initialComment;

            const commentEl = document.createElement('div');
            commentEl.className = 'day-comment editable-comment-trigger';
            commentEl.title = '클릭하여 코멘트 수정';
            
            if (activeComment !== '-') {
                commentEl.textContent = `코멘트 : ${activeComment}`;
                commentEl.classList.add('highlight-comment');
            } else {
                commentEl.textContent = '코멘트 : -';
            }

            commentEl.addEventListener('click', () => {
                const currentText = activeComment;
                const inputEl = document.createElement('input');
                inputEl.type = 'text';
                inputEl.className = 'inline-comment-edit-input';
                inputEl.value = currentText === '-' ? '' : currentText;
                inputEl.placeholder = '코멘트 입력...';

                const saveComment = () => {
                    const newValue = inputEl.value.trim();
                    const finalValue = newValue === '' ? '-' : newValue;
                    localStorage.setItem(commentKey, finalValue);
                    renderCalendar();
                };

                inputEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') saveComment();
                    if (e.key === 'Escape') renderCalendar();
                });

                inputEl.addEventListener('blur', saveComment);

                commentEl.replaceWith(inputEl);
                inputEl.focus();
            });

            cell.appendChild(eventsContainer);
            cell.appendChild(commentEl);
        } else {
            const spacer = document.createElement('div');
            spacer.className = 'dimmed-spacer';
            cell.appendChild(spacer);
        }

        calendarGrid.appendChild(cell);
    });
}

function getEventsForDay(year, month, day) {
    if (month === 6) {
        const list = [];
        if (day === 1) {
            list.push({ category: 'onyx-reserve', type: '동원훈련' });
            list.push({ category: 'onyx-civil', type: '사이버훈련' });
        }
        if (day === 2) {
            list.push({ category: 'onyx-civil', type: '집합교육' });
        }
        if (day === 4) {
            list.push({ category: 'cheonan-reserve', type: '실기/실습훈련' });
        }
        if (day === 7) {
            list.push({ category: 'onyx-civil', type: '교육/강의' });
        }
        if (day === 8) {
            list.push({ category: 'onyx-civil', type: '사이버훈련' });
        }
        if (day === 9) {
            list.push({ category: 'cheonan-reserve', type: '동원훈련' });
            list.push({ category: 'cheonan-civil', type: '집합교육' });
        }
        if (day === 10) {
            list.push({ category: 'onyx-reserve', type: '실기/실습훈련' });
        }
        if (day === 11) {
            list.push({ category: 'onyx-civil', type: '집합교육' });
        }
        if (day === 14) {
            list.push({ category: 'cheonan-civil', type: '교육/강의' });
        }
        if (day === 15) {
            list.push({ category: 'onyx-reserve', type: '동원훈련' });
            list.push({ category: 'onyx-civil', type: '사이버훈련' });
        }
        if (day === 16) {
            list.push({ category: 'onyx-civil', type: '집합교육' });
        }
        if (day === 17) {
            list.push({ category: 'cheonan-reserve', type: '실기/실습훈련' });
        }
        if (day === 18) {
            list.push({ category: 'cheonan-civil', type: '집합교육' });
        }
        if (day === 21) {
            list.push({ category: 'cheonan-civil', type: '동원훈련' });
        }
        if (day === 22) {
            list.push({ category: 'cheonan-civil', type: '사이버훈련' });
        }
        if (day === 23) {
            list.push({ category: 'onyx-reserve', type: '실기/실습훈련' });
        }
        if (day === 24) {
            list.push({ category: 'onyx-civil', type: '집합교육' });
        }
        if (day === 25) {
            list.push({ category: 'cheonan-reserve', type: '동원훈련' });
        }
        if (day === 28) {
            list.push({ category: 'cheonan-civil', type: '집합교육' });
            list.push({ category: 'cheonan-civil', type: '사이버훈련' });
        }
        if (day === 29) {
            list.push({ category: 'cheonan-civil', type: '교육/강의' });
        }
        if (day === 30) {
            list.push({ category: 'cheonan-reserve', type: '실기/실습훈련' });
        }
        if (day === 31) {
            list.push({ category: 'onyx-reserve', type: '동원훈련' });
        }
        return list;
    } else {
        const list = [];
        const seed = (year + month * 13 + day * 37) % 5;
        const dayOfWeek = new Date(year, month, day).getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            if (seed === 1 && (day === 2 || day === 15 || day === 28)) {
                list.push({ category: 'onyx-reserve', type: '동원훈련' });
            }
            if (seed === 2 && (day === 5 || day === 12 || day === 19)) {
                list.push({ category: 'onyx-civil', type: '집합교육' });
            }
            if (seed === 3 && (day === 9 || day === 22)) {
                list.push({ category: 'cheonan-reserve', type: '실기/실습훈련' });
            }
            if (seed === 4 && (day === 4 || day === 18 || day === 25)) {
                list.push({ category: 'cheonan-civil', type: '사이버훈련' });
            }
        }
        return list;
    }
}

function getCategoryIcon(cat) {
    if (cat === 'onyx-reserve') return 'fa-solid fa-helmet-safety color-green';
    if (cat === 'onyx-civil') return 'fa-solid fa-triangle-exclamation color-yellow';
    if (cat === 'cheonan-reserve') return 'fa-solid fa-helmet-safety color-blue';
    if (cat === 'cheonan-civil') return 'fa-solid fa-circle-exclamation color-purple';
    return '';
}

function getTypeIcon(type) {
    if (type === '동원훈련') return 'fa-solid fa-crosshairs';
    if (type === '사이버훈련') return 'fa-solid fa-desktop';
    if (type === '집합교육') return 'fa-solid fa-building';
    if (type === '실기/실습훈련') return 'fa-solid fa-person-running';
    if (type === '교육/강의') return 'fa-solid fa-bullhorn';
    return '';
}

function setupTooltip() {
    document.addEventListener('mousemove', (e) => {
        if (tooltip.style.display === 'block') {
            tooltip.style.left = `${e.pageX + 15}px`;
            tooltip.style.top = `${e.pageY + 15}px`;
        }
    });
}

function showTooltip(e, employees, day, type, category) {
    let categoryName = '';
    if (category === 'onyx-reserve') categoryName = '온양 예비군';
    if (category === 'onyx-civil') categoryName = '온양 민방위';
    if (category === 'cheonan-reserve') categoryName = '천안 예비군';
    if (category === 'cheonan-civil') categoryName = '천안 민방위';

    const displayMonth = currentMonth + 1;
    tooltipTitle.innerHTML = `<span class="tag-title ${category}">${categoryName}</span> ${displayMonth}월 ${day}일 (${type})`;
    
    let html = '<table class="tooltip-table"><thead><tr><th>이름</th><th>부서</th><th>연락처</th><th>비고</th></tr></thead><tbody>';
    employees.forEach(emp => {
        html += `<tr>
            <td class="bold">${emp.name}</td>
            <td>${emp.dept || '-'}</td>
            <td>${emp.phone || '-'}</td>
            <td class="remark-text">${emp.remarks || '-'}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    
    tooltipBody.innerHTML = html;
    tooltip.style.display = 'block';
    
    tooltip.style.left = `${e.pageX + 15}px`;
    tooltip.style.top = `${e.pageY + 15}px`;
}

function hideTooltip() {
    tooltip.style.display = 'none';
}

// 2 Weeks default todo items (6.29 - 7.12)
const defaultTodoItems = [
    { date: '6.29(월)', title: '온양 예비군 소집 명단 최종 검증', details: '소집 대상 대원 사번/연락처 누락 여부 확인 및 군부대 통보 명부 교차 검증', checklist: ['명단 최신본 확인', '연락처 누락자 보완', '군부대 통보본 대조'] },
    { date: '7.2(목)', title: '온양 민방위 알림톡 발송 모니터링', details: '1차 알림톡 발송 후 미수신 오류자 대상 개별 유선 연락망 수동 정비', checklist: ['발송 결과 확인', '미수신자 추출', '개별 연락 처리'] },
    { date: '7.4(금)', title: '천안 예비군 수송 버스 안전 점검', details: '임차 버스 차량 종합보험 증명서 수합 및 운전기사 음주 측정 및 안전 준수 서약서 징구', checklist: ['보험 증명서 수합', '운전기사 정보 확인', '안전 준수 서약서 보관'] },
    { date: '7.7(월)', title: '민방위 사이버 교육 시스템 최종 테스트', details: '스마트 민방위 교육 사이트 접속 안정성 점검 및 임직원 로그인 안내문 사내 게시', checklist: ['접속 테스트', '로그인 안내문 게시', '문의 응대 담당 지정'] },
    { date: '7.9(수)', title: '천안 예비군 집중일 비상 연락 체계 가동', details: '훈련 당일 이동 대원 현장 인솔 책임자 임명 및 군부대 연락관 핫라인 사전 구축', checklist: ['인솔 책임자 지정', '핫라인 확인', '당일 이동 명단 공유'] },
    { date: '7.11(금)', title: '사업장 비상대피소 및 피난 유도선 전수 점검', details: '민방위 대피 훈련 대비 피난 유도등/유도선 점검 및 비상식량 유통기한 전수 조사', checklist: ['대피소 상태 확인', '유도등 점검', '비상식량 유통기한 확인'] }
];

function setupTodoTable() {
    const btnAddTodo = document.getElementById('btn-add-todo');
    if (!weeksTimelineContainer) return;

    const storageKey = 'todo_items_v3';
    let items = loadTaskItems();

    function loadTaskItems() {
        const saved = localStorage.getItem(storageKey);
        if (saved) return JSON.parse(saved).map(normalizeTaskItem);

        const legacy = localStorage.getItem('todo_items_v2');
        if (legacy) {
            const migrated = JSON.parse(legacy).map(normalizeTaskItem);
            localStorage.setItem(storageKey, JSON.stringify(migrated));
            return migrated;
        }

        const defaults = defaultTodoItems.map(normalizeTaskItem);
        localStorage.setItem(storageKey, JSON.stringify(defaults));
        return defaults;
    }

    function normalizeTaskItem(item, index = 0) {
        const sourceChecklist = Array.isArray(item.checklist) ? item.checklist : [];
        return {
            id: item.id || `task_${Date.now()}_${Math.random().toString(16).slice(2)}_${index}`,
            date: item.date || '7.1(수)',
            title: item.title || '새 업무 제목',
            details: item.details || '세부항목을 입력하세요.',
            open: Boolean(item.open),
            checklist: sourceChecklist.map(check => typeof check === 'string'
                ? { text: check, done: false }
                : { text: check.text || '새 체크리스트', done: Boolean(check.done) })
        };
    }

    function saveItems() {
        items.sort((a, b) => {
            const da = parseDateStr(a.date);
            const db = parseDateStr(b.date);
            if (da.month !== db.month) return da.month - db.month;
            return da.day - db.day;
        });
        localStorage.setItem(storageKey, JSON.stringify(items));
        render8WeeksTimeline(items);
    }

    function parseDateStr(str) {
        const match = String(str).match(/(\d+)[./](\d+)/);
        if (match) return { month: parseInt(match[1]), day: parseInt(match[2]) };
        return { month: 99, day: 99 };
    }

    function findTask(taskId) {
        return items.find(item => item.id === taskId);
    }

    function getFirstDateFromRange(dateRange) {
        const match = String(dateRange).match(/(\d+)월\s*(\d+)일/);
        if (!match) return '7.1(수)';
        return `${parseInt(match[1])}.${parseInt(match[2])}`;
    }

    function addTask(date = '7.1(수)') {
        items.push(normalizeTaskItem({
            date,
            title: '새 업무 제목',
            details: '세부항목을 입력하세요.',
            open: true,
            checklist: ['체크리스트를 입력하세요']
        }));
        saveItems();
    }

    weeksTimelineContainer.addEventListener('click', (e) => {
        const toggle = e.target.closest('.task-title-toggle, .task-title');
        if (toggle && toggle.dataset.taskId) {
            const task = findTask(toggle.dataset.taskId);
            if (task) {
                task.open = !task.open;
                saveItems();
            }
            return;
        }

        const addWeekBtn = e.target.closest('.btn-add-week-task');
        if (addWeekBtn) {
            const week = weeksData[parseInt(addWeekBtn.dataset.weekIndex, 10)];
            addTask(getFirstDateFromRange(week.dateRange));
            return;
        }

        const deleteTaskBtn = e.target.closest('.btn-delete-task');
        if (deleteTaskBtn && confirm('이 업무를 삭제하시겠습니까?')) {
            items = items.filter(item => item.id !== deleteTaskBtn.dataset.taskId);
            saveItems();
            return;
        }

        const addCheckBtn = e.target.closest('.btn-add-check');
        if (addCheckBtn) {
            const task = findTask(addCheckBtn.dataset.taskId);
            if (task) {
                task.checklist.push({ text: '새 체크리스트', done: false });
                task.open = true;
                saveItems();
            }
            return;
        }

        const deleteCheckBtn = e.target.closest('.btn-delete-check');
        if (deleteCheckBtn) {
            const task = findTask(deleteCheckBtn.dataset.taskId);
            if (task) {
                task.checklist.splice(parseInt(deleteCheckBtn.dataset.checkIndex, 10), 1);
                task.open = true;
                saveItems();
            }
        }
    });

    weeksTimelineContainer.addEventListener('change', (e) => {
        if (!e.target.classList.contains('task-check')) return;
        const task = findTask(e.target.dataset.taskId);
        if (!task) return;
        const check = task.checklist[parseInt(e.target.dataset.checkIndex, 10)];
        if (check) {
            check.done = e.target.checked;
            task.open = true;
            localStorage.setItem(storageKey, JSON.stringify(items));
        }
    });

    weeksTimelineContainer.addEventListener('blur', (e) => {
        const field = e.target.dataset.field;
        const taskId = e.target.dataset.taskId;
        if (!field || !taskId) return;

        const task = findTask(taskId);
        if (!task) return;

        if (field === 'checkText') {
            const check = task.checklist[parseInt(e.target.dataset.checkIndex, 10)];
            if (check) check.text = e.target.innerText.trim() || '새 체크리스트';
        } else {
            task[field] = e.target.innerText.trim() || (field === 'title' ? '새 업무 제목' : '-');
        }
        task.open = true;
        saveItems();
    }, true);

    weeksTimelineContainer.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && e.target.matches('[contenteditable="true"]')) {
            e.preventDefault();
            e.target.blur();
        }
    });

    if (btnAddTodo) {
        btnAddTodo.addEventListener('click', () => addTask('7.1(수)'));
    }

    saveItems();
}

function isTaskInWeek(dateText, dateRange) {
    const taskDate = parseMonthDay(dateText);
    const matches = [...String(dateRange).matchAll(/(\d+)월\s*(\d+)일/g)];
    if (!taskDate || matches.length < 2) return false;

    const start = { month: parseInt(matches[0][1]), day: parseInt(matches[0][2]) };
    const end = { month: parseInt(matches[1][1]), day: parseInt(matches[1][2]) };
    const taskValue = taskDate.month * 100 + taskDate.day;
    const startValue = start.month * 100 + start.day;
    const endValue = end.month * 100 + end.day;

    return taskValue >= startValue && taskValue <= endValue;
}

function parseMonthDay(dateText) {
    const match = String(dateText).match(/(\d+)[./](\d+)/);
    if (!match) return null;
    return { month: parseInt(match[1]), day: parseInt(match[2]) };
}


