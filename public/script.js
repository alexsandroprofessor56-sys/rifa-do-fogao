const TOTAL_NUMBERS = 100;
let takenNumbers = new Set();
let currentNumber = null;

document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  generateGrid();
  loadTakenNumbers();
  setupModal();
});

function createParticles() {
  const c = document.getElementById('particles');
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDelay = Math.random() * 6 + 's';
    p.style.animationDuration = (4 + Math.random() * 4) + 's';
    p.style.width = (2 + Math.random() * 3) + 'px';
    p.style.height = p.style.width;
    c.appendChild(p);
  }
}

async function loadTakenNumbers() {
  try {
    const res = await fetch('/api/numeros');
    const data = await res.json();
    takenNumbers = new Set(data.taken || []);
    updateGrid();
  } catch {}
}

function generateGrid() {
  const grid = document.getElementById('numbersGrid');
  for (let i = 1; i <= TOTAL_NUMBERS; i++) {
    const cell = document.createElement('div');
    cell.className = 'number-cell';
    cell.id = 'num-' + i;
    cell.textContent = String(i).padStart(2, '0');
    cell.addEventListener('click', () => openModal(i));
    grid.appendChild(cell);
  }
}

function updateGrid() {
  for (const n of takenNumbers) {
    const cell = document.getElementById('num-' + n);
    if (cell) cell.classList.add('taken');
  }
}

function openModal(num) {
  if (takenNumbers.has(num)) {
    showToast('Este número já foi reservado.', 'error');
    return;
  }
  currentNumber = num;
  document.getElementById('modalNumber').textContent = String(num).padStart(2, '0');
  document.getElementById('modalNumber2').textContent = String(num).padStart(2, '0');
  document.getElementById('step1').classList.add('active');
  document.getElementById('step2').classList.remove('active');
  document.getElementById('step3').classList.remove('active');
  document.getElementById('modalName').value = '';
  document.getElementById('modalPhone').value = '';
  document.getElementById('modal').classList.add('open');
}

function closeModal() {
  document.getElementById('modal').classList.remove('open');
  currentNumber = null;
}

function setupModal() {
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  document.getElementById('step1Form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('modalName').value.trim();
    const phone = document.getElementById('modalPhone').value.trim();
    if (!name || !phone) {
      showToast('Preencha todos os campos.', 'error');
      return;
    }
    if (takenNumbers.has(currentNumber)) {
      showToast('Este número acabou de ser reservado.', 'error');
      closeModal();
      return;
    }
    document.getElementById('step1').classList.remove('active');
    document.getElementById('step2').classList.add('active');
  });

  document.getElementById('copyPixBtn').addEventListener('click', async () => {
    const key = document.getElementById('modalPixKey').textContent;
    try {
      await navigator.clipboard.writeText(key);
      showToast('Chave PIX copiada!', 'success');
    } catch {
      showToast('Copie manualmente a chave.', 'error');
    }
  });

  document.getElementById('confirmBtn').addEventListener('click', async () => {
    const name = document.getElementById('modalName').value.trim();
    const phone = document.getElementById('modalPhone').value.trim();
    const btn = document.getElementById('confirmBtn');
    btn.disabled = true;
    btn.textContent = 'Confirmando...';

    try {
      const res = await fetch('/api/reservar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, number: currentNumber })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro');
      }
      takenNumbers.add(currentNumber);
      updateGrid();
      document.getElementById('step2').classList.remove('active');
      document.getElementById('confirmedNumber').textContent = String(currentNumber).padStart(2, '0');
      document.getElementById('step3').classList.add('active');
      showToast('Número reservado com sucesso!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '✅ Confirmar Pagamento';
    }
  });

  document.getElementById('backBtn').addEventListener('click', () => {
    document.getElementById('step2').classList.remove('active');
    document.getElementById('step1').classList.add('active');
  });

  document.getElementById('closeSuccessBtn').addEventListener('click', closeModal);
}

function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  clearTimeout(t._timeout);
  t._timeout = setTimeout(() => t.classList.remove('show'), 3000);
}
