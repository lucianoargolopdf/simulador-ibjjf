// Lógica Principal do Simulado Online IBJJF (500 Questões -> 20 por Prova)
const LETTERS = ['A', 'B', 'C', 'D'];
let currentExam = [];
let userAnswers = {};
let examSubmitted = false;
let examHistory = JSON.parse(localStorage.getItem('ibjjf_exam_history') || '[]');

let bankPage = 1;
let answerPage = 1;
const ITEMS_PER_PAGE = 25;

document.addEventListener('DOMContentLoaded', () => {
  populateCategoryFilters();
  createNewExam(true);
  renderQuestionBank();
  renderAnswerKey();
  renderResultsView();
});

function switchTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(sec => sec.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  document.getElementById('sec-' + tabId).classList.remove('hidden');
  const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function populateCategoryFilters() {
  const categories = [...new Set(BANCO_QUESTOES_IBJJF.map(q => q.categoria))];
  const selects = [document.getElementById('bank-cat-filter'), document.getElementById('ans-cat-filter')];
  selects.forEach(sel => {
    if (!sel) return;
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      sel.appendChild(opt);
    });
  });
}

// Gera nova prova com 20 questões aleatórias únicas do banco de 500
function createNewExam(isInitial = false) {
  if (!isInitial && Object.keys(userAnswers).length > 0 && !examSubmitted) {
    if (!confirm('Deseja descartar a prova atual e gerar uma nova prova com 20 questões?')) return;
  }

  const shuffled = [...BANCO_QUESTOES_IBJJF].sort(() => Math.random() - 0.5);
  currentExam = shuffled.slice(0, 20);
  userAnswers = {};
  examSubmitted = false;

  renderExam();
  updateProgress();
  switchTab('prova');
}

function renderExam() {
  const container = document.getElementById('exam-questions-container');
  container.innerHTML = '';

  currentExam.forEach((q, index) => {
    const card = document.createElement('div');
    card.className = 'question-card';
    card.id = `exam-q-${index}`;

    let optionsHtml = '';
    q.alternativas.forEach((altText, optIdx) => {
      const isSelected = userAnswers[index] === optIdx;
      let statusClass = isSelected ? 'selected' : '';

      if (examSubmitted) {
        if (optIdx === q.correta) {
          statusClass = 'correct-ans';
        } else if (isSelected && optIdx !== q.correta) {
          statusClass = 'wrong-ans';
        }
      }

      optionsHtml += `
        <div class="option-label ${statusClass}" onclick="selectOption(${index}, ${optIdx})">
          <span class="option-letter">${LETTERS[optIdx]}</span>
          <span>${altText}</span>
        </div>
      `;
    });

    const explanationHtml = examSubmitted
      ? `<div class="explanation-box"><strong>Fundamentação (${q.categoria}):</strong> ${q.explicacao}</div>`
      : '';

    card.innerHTML = `
      <div class="q-meta">
        <span class="q-number">Questão ${index + 1} de 20 (Banco #${q.id})</span>
        <span class="q-cat">${q.categoria}</span>
      </div>
      <p class="q-text">${q.pergunta}</p>
      <div class="options-list">${optionsHtml}</div>
      ${explanationHtml}
    `;
    container.appendChild(card);
  });
}

function selectOption(qIndex, optIdx) {
  if (examSubmitted) return;
  userAnswers[qIndex] = optIdx;
  renderExam();
  updateProgress();
}

function updateProgress() {
  const answeredCount = Object.keys(userAnswers).length;
  const pct = Math.round((answeredCount / 20) * 100);
  document.getElementById('progress-text').textContent = `Respondidas: ${answeredCount} de 20 (${pct}%)`;
  document.getElementById('progress-fill').style.width = `${pct}%`;
}

// Botão Enviar Prova
function submitExam() {
  if (examSubmitted) {
    switchTab('resultados');
    return;
  }

  const answeredCount = Object.keys(userAnswers).length;
  if (answeredCount < 20) {
    const confirmBlank = confirm(`Você respondeu ${answeredCount} de 20 questões. Questões em branco serão consideradas erradas. Deseja enviar a prova mesmo assim?`);
    if (!confirmBlank) return;
  }

  examSubmitted = true;
  let correctCount = 0;
  let wrongList = [];

  currentExam.forEach((q, idx) => {
    const chosen = userAnswers[idx];
    if (chosen === q.correta) {
      correctCount++;
    } else {
      wrongList.push({
        numeroProva: idx + 1,
        idBanco: q.id,
        categoria: q.categoria,
        pergunta: q.pergunta,
        marcada: chosen !== undefined ? `${LETTERS[chosen]}) ${q.alternativas[chosen]}` : 'Não respondida (em branco)',
        correta: `${LETTERS[q.correta]}) ${q.alternativas[q.correta]}`,
        explicacao: q.explicacao
      });
    }
  });

  const wrongCount = 20 - correctCount;
  const scorePct = Math.round((correctCount / 20) * 100);

  const attemptRecord = {
    data: new Date().toLocaleString('pt-BR'),
    acertos: correctCount,
    erros: wrongCount,
    percentual: scorePct,
    questoesErradas: wrongList
  };

  examHistory.unshift(attemptRecord);
  localStorage.setItem('ibjjf_exam_history', JSON.stringify(examHistory));

  renderExam();
  renderResultsView();
  switchTab('resultados');
}

// Botão Ver Resultados e Análise de Erros
function renderResultsView() {
  const latest = examHistory[0];
  const statsContainer = document.getElementById('latest-stats');
  const wrongContainer = document.getElementById('wrong-questions-analysis');
  const historyContainer = document.getElementById('history-list');

  if (!latest) {
    statsContainer.innerHTML = `<div class="question-card" style="grid-column: 1 / -1; text-align:center;">Nenhuma prova enviada ainda. Responda o simulado e clique em <strong>Enviar Prova</strong>.</div>`;
    wrongContainer.innerHTML = '';
    historyContainer.innerHTML = '';
    return;
  }

  statsContainer.innerHTML = `
    <div class="stat-card" style="border-color:#86efac; background:#f0fdf4;">
      <span class="stat-val" style="color:#15803d;">${latest.acertos}</span>
      <span class="stat-lbl">Acertos</span>
    </div>
    <div class="stat-card" style="border-color:#fca5a5; background:#fef2f2;">
      <span class="stat-val" style="color:#b91c1c;">${latest.erros}</span>
      <span class="stat-lbl">Erros</span>
    </div>
    <div class="stat-card" style="border-color:#93c5fd; background:#eff6ff;">
      <span class="stat-val" style="color:#1d4ed8;">${latest.percentual}%</span>
      <span class="stat-lbl">Aproveitamento</span>
    </div>
  `;

  if (latest.questoesErradas.length === 0) {
    wrongContainer.innerHTML = `<div class="question-card" style="border-color:#86efac; background:#f0fdf4; color:#14532d;"><strong>Parabéns!</strong> Você acertou todas as 20 questões desta prova!</div>`;
  } else {
    wrongContainer.innerHTML = latest.questoesErradas.map(err => `
      <div class="question-card" style="border-left: 5px solid #dc2626;">
        <div class="q-meta">
          <span class="q-number" style="background:#fef2f2; color:#b91c1c;">Erro na Questão ${err.numeroProva} (Banco #${err.idBanco})</span>
          <span class="q-cat">${err.categoria}</span>
        </div>
        <p class="q-text">${err.pergunta}</p>
        <p style="margin:0.4rem 0; color:#b91c1c; font-size:0.88rem;"><strong>Sua resposta:</strong> ${err.marcada}</p>
        <p style="margin:0.4rem 0; color:#15803d; font-size:0.88rem;"><strong>Resposta correta:</strong> ${err.correta}</p>
        <div class="explanation-box"><strong>Análise da Regra:</strong> ${err.explicacao}</div>
      </div>
    `).join('');
  }

  historyContainer.innerHTML = examHistory.slice(0, 10).map((h, i) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:0.65rem 0.85rem; border-bottom:1px solid #e2e8f0; font-size:0.85rem;">
      <span><strong>#${examHistory.length - i}</strong> — ${h.data}</span>
      <span><strong style="color:#15803d;">${h.acertos} acertos</strong> / <strong style="color:#b91c1c;">${h.erros} erros</strong> (${h.percentual}%)</span>
    </div>
  `).join('');
}

// Renderiza o Banco de 500 Questões (Página Separada das Respostas)
function renderQuestionBank() {
  const search = (document.getElementById('bank-search')?.value || '').toLowerCase();
  const cat = document.getElementById('bank-cat-filter')?.value || '';

  const filtered = BANCO_QUESTOES_IBJJF.filter(q => {
    const matchCat = !cat || q.categoria === cat;
    const matchText = !search || q.pergunta.toLowerCase().includes(search) || q.alternativas.some(a => a.toLowerCase().includes(search));
    return matchCat && matchText;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  if (bankPage > totalPages) bankPage = 1;
  const slice = filtered.slice((bankPage - 1) * ITEMS_PER_PAGE, bankPage * ITEMS_PER_PAGE);

  const list = document.getElementById('bank-list');
  list.innerHTML = slice.map(q => `
    <div class="question-card">
      <div class="q-meta">
        <span class="q-number">Questão #${q.id}</span>
        <span class="q-cat">${q.categoria}</span>
      </div>
      <p class="q-text">${q.pergunta}</p>
      <ul style="margin:0; padding-left:1.2rem; font-size:0.88rem; color:#334155;">
        ${q.alternativas.map((alt, i) => `<li style="margin-bottom:0.3rem;"><strong>${LETTERS[i]})</strong> ${alt}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  document.getElementById('bank-pagination').innerHTML = `
    <button class="btn btn-outline" onclick="changeBankPage(-1)" ${bankPage <= 1 ? 'disabled' : ''}>Anterior</button>
    <span style="font-size:0.85rem; font-weight:700;">Página ${bankPage} de ${totalPages} (${filtered.length} questões)</span>
    <button class="btn btn-outline" onclick="changeBankPage(1)" ${bankPage >= totalPages ? 'disabled' : ''}>Próxima</button>
  `;
}

function changeBankPage(delta) {
  bankPage += delta;
  renderQuestionBank();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Renderiza o Gabarito Oficial (Página Separada das Perguntas)
function renderAnswerKey() {
  const search = (document.getElementById('ans-search')?.value || '').toLowerCase();
  const cat = document.getElementById('ans-cat-filter')?.value || '';

  const filtered = BANCO_QUESTOES_IBJJF.filter(q => {
    const matchCat = !cat || q.categoria === cat;
    const matchText = !search || q.pergunta.toLowerCase().includes(search) || q.explicacao.toLowerCase().includes(search) || String(q.id) === search;
    return matchCat && matchText;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  if (answerPage > totalPages) answerPage = 1;
  const slice = filtered.slice((answerPage - 1) * ITEMS_PER_PAGE, answerPage * ITEMS_PER_PAGE);

  const list = document.getElementById('answers-list');
  list.innerHTML = slice.map(q => `
    <div class="question-card" style="border-left:4px solid #16a34a;">
      <div class="q-meta">
        <span class="q-number" style="background:#f0fdf4; color:#15803d;">Gabarito #${q.id}</span>
        <span class="q-cat">${q.categoria}</span>
      </div>
      <p style="margin:0 0 0.4rem; font-size:0.85rem; color:#475569;">${q.pergunta}</p>
      <p style="margin:0 0 0.5rem; font-size:0.95rem; font-weight:800; color:#15803d;">
        Resposta Correta: ${LETTERS[q.correta]}) ${q.alternativas[q.correta]}
      </p>
      <div class="explanation-box">${q.explicacao}</div>
    </div>
  `).join('');

  document.getElementById('ans-pagination').innerHTML = `
    <button class="btn btn-outline" onclick="changeAnsPage(-1)" ${answerPage <= 1 ? 'disabled' : ''}>Anterior</button>
    <span style="font-size:0.85rem; font-weight:700;">Página ${answerPage} de ${totalPages} (${filtered.length} respostas)</span>
    <button class="btn btn-outline" onclick="changeAnsPage(1)" ${answerPage >= totalPages ? 'disabled' : ''}>Próxima</button>
  `;
}

function changeAnsPage(delta) {
  answerPage += delta;
  renderAnswerKey();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
