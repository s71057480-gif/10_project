const STORAGE_KEY = 'address-notes';

const form = {
  date: document.getElementById('recordDate'),
  name: document.getElementById('name'),
  phone: document.getElementById('phone'),
  roadAddress: document.getElementById('roadAddress'),
  homeAddress: document.getElementById('homeAddress'),
  memo: document.getElementById('memo')
};

const noteCover = document.getElementById('noteCover');
const appShell = document.getElementById('appShell');
const easterEggOverlay = document.getElementById('easterEggOverlay');
const selectedDateText = document.getElementById('selectedDateText');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const recordList = document.getElementById('recordList');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const tutorialBtn = document.getElementById('tutorialBtn');
const tutorialPanel = document.getElementById('tutorialPanel');
const closeTutorialBtn = document.getElementById('closeTutorialBtn');

let editingIndex = null;
let currentSortOrder = 'name';

const today = new Date();
const todayString = formatDateInput(today);
form.date.value = todayString;

function openNote() {
  document.body.classList.remove('note-closed');
  document.body.classList.add('note-open');
  appShell.setAttribute('aria-hidden', 'false');
}

function closeNote() {
  document.body.classList.remove('note-open');
  document.body.classList.add('note-closed');
  appShell.setAttribute('aria-hidden', 'true');
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function updateSelectedDateLabel() {
  const currentDate = formatDateInput(new Date());
  form.date.value = currentDate;
  selectedDateText.textContent = formatDisplayDate(currentDate);
}

function loadRecords() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
}

function saveRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function resetEditMode() {
  editingIndex = null;
  saveBtn.textContent = '저장';
}

function showKoreanFlag() {
  if (!easterEggOverlay) return;

  easterEggOverlay.classList.add('is-visible');
  easterEggOverlay.setAttribute('aria-hidden', 'false');

  clearTimeout(showKoreanFlag.timeoutId);
  showKoreanFlag.timeoutId = setTimeout(() => {
    easterEggOverlay.classList.remove('is-visible');
    easterEggOverlay.setAttribute('aria-hidden', 'true');
  }, 2000);
}

function getFormRecord() {
  return {
    date: form.date.value || todayString,
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    roadAddress: form.roadAddress.value.trim(),
    homeAddress: form.homeAddress.value.trim(),
    memo: form.memo.value.trim()
  };
}

function fillForm(record) {
  form.date.value = record.date || todayString;
  form.name.value = record.name || '';
  form.phone.value = record.phone || '';
  form.roadAddress.value = record.roadAddress || '';
  form.homeAddress.value = record.homeAddress || '';
  form.memo.value = record.memo || '';
  selectedDateText.textContent = formatDisplayDate(form.date.value);
}

function clearForm() {
  form.name.value = '';
  form.phone.value = '';
  form.roadAddress.value = '';
  form.homeAddress.value = '';
  form.memo.value = '';
  form.date.value = formatDateInput(new Date());
  updateSelectedDateLabel();
  resetEditMode();
}

function getFilteredRecords(records) {
  const keyword = searchInput.value.trim().toLowerCase();

  const normalized = records
    .map((record, index) => ({ record, index }))
    .filter(({ record }) => {
      const searchable = [
        record.name,
        record.phone,
        record.roadAddress,
        record.homeAddress,
        record.memo,
        record.date
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return !keyword || searchable.includes(keyword);
    });

  return normalized.sort((a, b) => {
    if (currentSortOrder === 'latest') {
      const timeA = new Date(`${a.record.date || '1970-01-01'}T00:00:00`).getTime();
      const timeB = new Date(`${b.record.date || '1970-01-01'}T00:00:00`).getTime();

      if (timeA !== timeB) {
        return timeB - timeA;
      }
    }

    const nameA = (a.record.name || '').trim();
    const nameB = (b.record.name || '').trim();

    if (!nameA && !nameB) return 0;
    if (!nameA) return 1;
    if (!nameB) return -1;

    return nameA.localeCompare(nameB, 'ko');
  });
}

function renderRecords() {
  const records = loadRecords();
  const filteredRecords = getFilteredRecords(records);

  if (!records.length) {
    recordList.innerHTML = '<div class="empty-state">아직 저장된 주소 기록이 없습니다.</div>';
    return;
  }

  if (!filteredRecords.length) {
    recordList.innerHTML = '<div class="empty-state">검색 결과가 없습니다.</div>';
    return;
  }

  recordList.innerHTML = filteredRecords
    .map(({ record, index }) => {
      const compactMemo = (record.memo || '').trim();
      const shortDate = escapeHtml(record.date || '-');
      const shortPhone = escapeHtml(record.phone || '-');
      const shortRoad = escapeHtml(record.roadAddress || '-');
      const shortHome = escapeHtml(record.homeAddress || '-');
      const shortName = escapeHtml(record.name || '이름 없음');

      return `
        <article class="record-card">
          <div class="record-main-row">
            <div class="record-chip date-chip"><span class="chip-label">날짜</span> ${shortDate}</div>
            <div class="record-chip name-chip"><span class="chip-label">이름</span> ${shortName}</div>
            <div class="record-chip phone-chip"><span class="chip-label">전화</span> ${shortPhone}</div>
            <div class="record-chip road-chip"><span class="chip-label">도로명</span> ${shortRoad}</div>
            <div class="record-chip home-chip"><span class="chip-label">집주소</span> ${shortHome}</div>
          </div>
          <div class="record-memo-row">
            <span class="memo-label">메모</span>
            <span class="memo-text">${escapeHtml(compactMemo || '-')}</span>
          </div>
          <div class="record-actions">
            <button type="button" class="record-action edit-btn" data-index="${index}" data-action="edit">수정</button>
            <button type="button" class="record-action delete-btn" data-index="${index}" data-action="delete">삭제</button>
          </div>
        </article>
      `;
    })
    .join('');
}

saveBtn.addEventListener('click', () => {
  const records = loadRecords();
  const newRecord = getFormRecord();

  if (!newRecord.name && !newRecord.phone && !newRecord.roadAddress && !newRecord.homeAddress && !newRecord.memo) {
    alert('입력한 내용이 없습니다.');
    return;
  }

  const triggerName = newRecord.name.trim();
  const koreanFlagNames = [
    '세종대왕',
    '안중근',
    '단군',
    '장영실',
    '유관순',
    '이순신',
    '김구',
    '윤봉길',
    '신채호',
    '방정환',
    '주시경',
    '윤동주',
    '안창호',
    '봉준호',
    '조수미',
    '손흥민',
    '김연아',
    '박세리',
    '이재용',
    '방탄소년단',
    '싸이',
    '박지성',
    '페이커',
    '류현진',
    '유재석'
  ];

  if (koreanFlagNames.includes(triggerName)) {
    showKoreanFlag();
  }

  if (editingIndex !== null) {
    records[editingIndex] = {
      ...records[editingIndex],
      ...newRecord
    };
  } else {
    records.push(newRecord);
  }

  saveRecords(records);
  renderRecords();
  clearForm();
});

clearBtn.addEventListener('click', () => {
  clearForm();
});

clearAllBtn.addEventListener('click', () => {
  const records = loadRecords();

  if (!records.length) {
    alert('삭제할 기록이 없습니다.');
    return;
  }

  const confirmed = window.confirm('모든 기록을 삭제할까요?');
  if (!confirmed) return;

  localStorage.removeItem(STORAGE_KEY);
  editingIndex = null;
  saveBtn.textContent = '저장';
  renderRecords();
  clearForm();
});

searchInput.addEventListener('input', () => {
  renderRecords();
});

sortSelect.addEventListener('change', (event) => {
  currentSortOrder = event.target.value;
  renderRecords();
});

recordList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const index = Number(button.dataset.index);
  const action = button.dataset.action;
  const records = loadRecords();
  const record = records[index];

  if (!record) return;

  if (action === 'edit') {
    fillForm(record);
    editingIndex = index;
    saveBtn.textContent = '수정 완료';
    openNote();
    return;
  }

  if (action === 'delete') {
    const label = record.name || '이름 없음';
    const confirmed = window.confirm(`${label} 기록을 삭제할까요?`);
    if (!confirmed) return;

    records.splice(index, 1);
    saveRecords(records);
    renderRecords();

    if (editingIndex === index) {
      clearForm();
    } else if (editingIndex !== null && editingIndex > index) {
      editingIndex -= 1;
    }
  }
});

function openTutorial() {
  tutorialPanel.classList.add('is-open');
  tutorialPanel.setAttribute('aria-hidden', 'false');
}

function closeTutorial() {
  tutorialPanel.classList.remove('is-open');
  tutorialPanel.setAttribute('aria-hidden', 'true');
}

noteCover.addEventListener('click', (event) => {
  if (event.target.closest('#tutorialBtn') || event.target.closest('.close-tutorial')) {
    return;
  }
  openNote();
});

noteCover.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openNote();
  }
});

tutorialBtn.addEventListener('click', (event) => {
  event.stopPropagation();
  openTutorial();
});

closeTutorialBtn.addEventListener('click', () => {
  closeTutorial();
});

tutorialPanel.addEventListener('click', (event) => {
  if (event.target === tutorialPanel) {
    closeTutorial();
  }
});

updateSelectedDateLabel();
setInterval(updateSelectedDateLabel, 60000);
renderRecords();
closeNote();
closeTutorial();
