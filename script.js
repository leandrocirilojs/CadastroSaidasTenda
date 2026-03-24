// ============================================
//   MRL LOG - script.js com Firebase
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, deleteDoc,
  doc, onSnapshot, query, orderBy, where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// === CREDENCIAIS ===
const firebaseConfig = {
  apiKey: "AIzaSyCN81LSya9eIGY1y1r8pFG67CyhKHL5mQU",
  authDomain: "cadastrosaidas.firebaseapp.com",
  projectId: "cadastrosaidas",
  storageBucket: "cadastrosaidas.firebasestorage.app",
  messagingSenderId: "701449632259",
  appId: "1:701449632259:web:e44106ca4571ede006ac36"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// === TELA DE LOGIN ===
function criarTelaLogin() {
  const div = document.createElement('div');
  div.id = 'tela-login';
  div.style.cssText = `
    position: fixed; inset: 0; background: #0a0618;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    z-index: 9999; padding: 20px;
    background-image: linear-gradient(rgba(186,125,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(186,125,255,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
  `;
  div.innerHTML = `
    <div style="
      background: rgba(20,10,45,0.95);
      border: 1px solid rgba(186,125,255,0.25);
      border-radius: 16px; padding: 32px;
      width: 100%; max-width: 380px;
      box-shadow: 0 0 40px rgba(186,125,255,0.1);
    ">
      <div style="text-align:center; font-size: 48px; margin-bottom: 8px;">🔥</div>
      <h2 style="text-align:center; color:#ba7dff; margin-bottom: 4px; font-size:22px;">MRL Log</h2>
      <p style="text-align:center; color:rgba(186,125,255,0.5); font-size:13px; margin-bottom:24px;">
        Faça login para acessar
      </p>
      <div id="login-status" style="
        display:none; padding:10px; border-radius:8px;
        margin-bottom:12px; font-size:14px; text-align:center;
      "></div>
      <input id="login-email" type="email" placeholder="Seu email"
        style="width:100%; padding:12px; margin-bottom:10px; border-radius:8px;
        border:1px solid rgba(186,125,255,0.3); background:rgba(30,15,55,0.9);
        color:#e0d6f5; font-size:15px; outline:none; box-sizing:border-box;">
      <input id="login-senha" type="password" placeholder="Senha"
        style="width:100%; padding:12px; margin-bottom:16px; border-radius:8px;
        border:1px solid rgba(186,125,255,0.3); background:rgba(30,15,55,0.9);
        color:#e0d6f5; font-size:15px; outline:none; box-sizing:border-box;">
      <button id="btn-login" style="
        width:100%; padding:13px; border:none; border-radius:8px;
        background:#7a3fd4; color:white; font-size:16px;
        font-weight:bold; cursor:pointer;">
        🔑 Entrar
      </button>
    </div>
  `;
  document.body.appendChild(div);

  document.getElementById('btn-login').addEventListener('click', fazerLogin);
  document.getElementById('login-senha').addEventListener('keydown', e => {
    if (e.key === 'Enter') fazerLogin();
  });
}

async function fazerLogin() {
  const email = document.getElementById('login-email').value.trim();
  const senha = document.getElementById('login-senha').value;
  const status = document.getElementById('login-status');

  if (!email || !senha) {
    mostrarLoginStatus('⚠️ Preencha email e senha!', 'error');
    return;
  }

  mostrarLoginStatus('🔄 Entrando...', 'loading');
  document.getElementById('btn-login').disabled = true;

  try {
    await signInWithEmailAndPassword(auth, email, senha);
  } catch (erro) {
    const msgs = {
      'auth/invalid-credential': '❌ Email ou senha incorretos.',
      'auth/user-not-found': '❌ Usuário não encontrado.',
      'auth/wrong-password': '❌ Senha incorreta.',
      'auth/too-many-requests': '⚠️ Muitas tentativas. Aguarde.',
      'auth/invalid-email': '❌ Email inválido.'
    };
    mostrarLoginStatus(msgs[erro.code] || '❌ Erro ao entrar.', 'error');
    document.getElementById('btn-login').disabled = false;
  }
}

function mostrarLoginStatus(msg, tipo) {
  const el = document.getElementById('login-status');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  const estilos = {
    error: 'background:rgba(220,53,69,0.15);border:1px solid rgba(220,53,69,0.4);color:#ff6b7a',
    loading: 'background:rgba(186,125,255,0.1);border:1px solid rgba(186,125,255,0.3);color:#ba7dff',
    success: 'background:rgba(37,211,102,0.15);border:1px solid rgba(37,211,102,0.4);color:#25D366'
  };
  el.style.cssText += ';' + (estilos[tipo] || estilos.error);
}

// === MONITOR DE AUTH ===
criarTelaLogin();

onAuthStateChanged(auth, (usuario) => {
  const telaLogin = document.getElementById('tela-login');
  if (usuario) {
    if (telaLogin) telaLogin.remove();
    iniciarApp();
    adicionarBotaoLogout(usuario.email);
  } else {
    if (!document.getElementById('tela-login')) criarTelaLogin();
  }
});

// === BOTÃO LOGOUT NO HEADER ===
function adicionarBotaoLogout(email) {
  // Remove botão anterior se existir
  const anterior = document.getElementById('btn-logout');
  if (anterior) anterior.remove();

  const inserir = () => {
    const header = document.querySelector('.header');
    if (!header) return;

    const btn = document.createElement('button');
    btn.id = 'btn-logout';
    btn.innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> Sair`;
    btn.title = `Sair (${email})`;
    btn.style.cssText = `
      background: rgba(108,31,58,0.9) !important;
      border: 1px solid rgba(220,53,69,0.4) !important;
      color: white !important; padding: 7px 14px !important;
      border-radius: 8px !important; cursor: pointer !important;
      font-size: 13px !important; font-weight: bold !important;
      margin-left: auto !important; margin-right: 60px !important;
      z-index: 1001 !important; position: relative !important;
      display: flex !important; align-items: center !important; gap: 6px !important;
    `;
    btn.addEventListener('click', () => {
      if (confirm('Deseja sair?')) signOut(auth);
    });
    header.appendChild(btn);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inserir);
  } else {
    inserir();
  }
}

// === APP PRINCIPAL ===
let filteredExpenses = [];
let unsubscribe = null;

let appIniciado = false;

function iniciarApp() {
  if (appIniciado) return;
  appIniciado = true;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupApp);
  } else {
    setupApp();
  }
}

function setupApp() {
  const expenseForm = document.getElementById('expense-form');
  const filterStartDate = document.getElementById('filter-start-date');
  const filterEndDate = document.getElementById('filter-end-date');
  const filterDriver = document.getElementById('filter-driver');
  const filterStore = document.getElementById('filter-store');

  // === ADICIONAR SAÍDA ===
  expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const expense = {
      driver: document.getElementById('driver-name').value,
      store: document.getElementById('store-name').value,
      amount: document.getElementById('expense-amount').value,
      received: document.getElementById('received-amount').value,
      weight: document.getElementById('expense-weight').value,
      nfs: document.getElementById('expense-nfs').value,
      date: document.getElementById('expense-date').value,
      profit: (
        parseFloat(document.getElementById('received-amount').value) -
        parseFloat(document.getElementById('expense-amount').value)
      ).toFixed(2),
      criadoEm: new Date().toISOString(),
      criadoPor: auth.currentUser?.email
    };

    try {
      await addDoc(collection(db, "saidas"), expense);

      // Reseta apenas o NFs para 1
      document.getElementById('expense-nfs').value = '1';

      // Mantém filtro do dia após adicionar
      const today = new Date().toISOString().split('T')[0];
      if (filterStartDate) filterStartDate.value = today;
      if (filterEndDate) filterEndDate.value = today;
      applyFilters();
    } catch (erro) {
      alert('Erro ao salvar saída: ' + erro.message);
    }
  });

  // === REMOVER SAÍDA ===
  window.removeExpense = async (id) => {
    const password = prompt("Digite a senha para confirmar a remoção:");
    if (password === "2702") {
      try {
        await deleteDoc(doc(db, "saidas", id));
      } catch (erro) {
        alert('Erro ao remover: ' + erro.message);
      }
    } else {
      alert("Senha incorreta! A saída não foi removida.");
    }
  };

  // === FILTROS ===
  const applyFilters = () => {
    const startDate = filterStartDate?.value || '';
    const endDate = filterEndDate?.value || '';
    const driver = filterDriver?.value || '';
    const store = filterStore?.value || '';
    carregarSaidas(startDate, endDate, driver, store);
  };

  if (filterStartDate) filterStartDate.addEventListener('change', applyFilters);
  if (filterEndDate) filterEndDate.addEventListener('change', applyFilters);
  if (filterDriver) filterDriver.addEventListener('change', applyFilters);
  if (filterStore) filterStore.addEventListener('change', applyFilters);

  // === CARREGAR DO DIA AO INICIAR ===
  const today = new Date().toISOString().split('T')[0];
  if (filterStartDate) filterStartDate.value = today;
  if (filterEndDate) filterEndDate.value = today;
  applyFilters();

  // === PDF ===
  document.getElementById('download-pdf')?.addEventListener('click', gerarPDF);

  // === EXCEL ===
  document.getElementById('export-excel')?.addEventListener('click', exportToExcel);

  // === WHATSAPP RELATÓRIO ===
  document.getElementById('send-whatsapp')?.addEventListener('click', enviarWhatsApp);
}

// === CARREGAR SAÍDAS DO FIREBASE ===
function carregarSaidas(startDate, endDate, driverFilter, storeFilter) {
  if (unsubscribe) unsubscribe();

  const expenseList = document.getElementById('expenses');
  const totalAmount = document.getElementById('total-amount');
  const totalProfit = document.getElementById('total-profit');

  const q = query(collection(db, "saidas"), orderBy("criadoEm", "desc"));

  unsubscribe = onSnapshot(q, (snapshot) => {
    expenseList.innerHTML = '';
    filteredExpenses = [];
    window.filteredExpenses = filteredExpenses;
    let total = 0;
    let totalProf = 0;

    snapshot.forEach((docSnap) => {
      const expense = { id: docSnap.id, ...docSnap.data() };
      const dateExpense = new Date(expense.date + 'T00:00:00');

      const startMatch = !startDate || dateExpense >= new Date(startDate + 'T00:00:00');
      const endMatch = !endDate || dateExpense <= new Date(endDate + 'T00:00:00');
      const driverMatch = !driverFilter || expense.driver === driverFilter;
      const storeMatch = !storeFilter || expense.store === storeFilter;

      if (startMatch && endMatch && driverMatch && storeMatch) {
        const li = document.createElement('li');
        li.innerHTML = `
          <div style="width:300px;background:#ffffff;border-radius:10px;
            box-shadow:0 4px 8px rgba(0,0,0,0.1);padding:20px;
            position:relative;font-family:Arial,sans-serif;">
            <button onclick="removeExpense('${expense.id}')"
              style="position:absolute;top:15px;right:15px;color:red;
              font-weight:bold;border:none;background:none;
              font-size:20px;cursor:pointer;">&times;</button>
            <div>
              <h2 style="margin:0;text-align:left;font-size:1.5em;color:#333;">${expense.driver}</h2>
              <p style="margin:5px 0;color:#666;">${expense.store}</p>
            </div>
            <table style="width:100%;margin-top:20px;">
              <tr>
                <td style="padding:8px;vertical-align:top;">
                  <p style="font-size:0.9em;color:#666;">Valor Pago</p>
                  <p style="font-size:1.2em;font-weight:bold;color:#333;">R$${expense.amount}</p>
                </td>
                <td style="padding:8px;vertical-align:top;">
                  <p style="font-size:0.9em;color:#666;">Recebido</p>
                  <p style="font-size:1.2em;font-weight:bold;color:#333;">R$${expense.received}</p>
                </td>
                <td style="padding:8px;vertical-align:top;">
                  <p style="font-size:0.9em;color:#666;">Peso:</p>
                  <p style="font-size:1.2em;font-weight:bold;color:#333;">${expense.weight}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:8px;vertical-align:top;">
                  <p style="font-size:0.9em;color:#666;">Qtd NFs:</p>
                  <p style="font-size:1.2em;font-weight:bold;color:#333;">${expense.nfs}</p>
                </td>
                <td style="padding:8px;vertical-align:top;">
                  <p style="font-size:0.9em;color:#666;">Lucro</p>
                  <p style="font-size:1.2em;font-weight:bold;color:green;">R$${expense.profit}</p>
                </td>
                <td style="padding:8px;vertical-align:top;">
                  <p style="font-size:0.9em;color:#666;">Data</p>
                  <p style="font-size:1.2em;font-weight:bold;color:#333;">${expense.date}</p>
                </td>
              </tr>
            </table>
          </div>`;
        expenseList.appendChild(li);
        total += parseFloat(expense.amount || 0);
        totalProf += parseFloat(expense.profit || 0);
        filteredExpenses.push(expense);
      }
    });
    window.filteredExpenses = filteredExpenses;

    if (totalAmount) totalAmount.textContent = total.toFixed(2);
    if (totalProfit) totalProfit.textContent = totalProf.toFixed(2);

  }, (erro) => {
    console.error('Erro ao carregar saídas:', erro);
  });
}

// === GERAR PDF ===
function gerarPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;
  const lineHeight = 10;

  const addNewPage = () => { doc.addPage(); y = margin; };

  doc.setFontSize(18);
  doc.text('Fechamento Tenda', margin, y);
  y += lineHeight * 2;

  const startDate = document.getElementById('filter-start-date')?.value || 'Não especificada';
  const endDate = document.getElementById('filter-end-date')?.value || 'Não especificada';
  doc.setFontSize(14);
  doc.text(`Período: ${startDate} a ${endDate}`, margin, y);
  y += lineHeight * 2;

  doc.setFontSize(12);
  doc.text('Motorista - Loja - Valor - Data - Peso (kg) - Qtd NFs', margin, y);
  y += lineHeight;

  let totalValue = 0, totalWeight = 0, totalNfs = 0;

  filteredExpenses.forEach((expense) => {
    if (y + lineHeight > pageHeight - margin) addNewPage();
    const text = `${expense.driver} - ${expense.store} - Valor: R$${expense.received} - Data: ${expense.date} - Peso: ${expense.weight || 0}kg - Nfs: ${expense.nfs || 0}`;
    doc.text(text, margin, y);
    y += lineHeight;
    totalValue += parseFloat(expense.received || 0);
    totalWeight += parseFloat(expense.weight || 0);
    totalNfs += parseInt(expense.nfs || 0);
  });

  if (y + lineHeight * 5 > pageHeight - margin) addNewPage();
  doc.setFontSize(14);
  y += lineHeight;
  doc.text(`Quantidade de Saídas: ${filteredExpenses.length}`, margin, y); y += lineHeight;
  doc.text(`Peso Total: ${totalWeight.toFixed(2)} kg`, margin, y); y += lineHeight;
  doc.text(`Total de NFs: ${totalNfs}`, margin, y); y += lineHeight;
  doc.text(`Valor Total Recebido: R$ ${totalValue.toFixed(2)}`, margin, y);
  doc.save('Relatorio_de_Saidas.pdf');
}

// === EXCEL ===
function exportToExcel() {
  const data = filteredExpenses.map(expense => [
    expense.driver, expense.date, expense.store,
    expense.infor, expense.pedEstacionamento, expense.km,
    expense.nfs, expense.received, expense.received,
  ]);

  const totalSaidas = filteredExpenses.length;
  const valorTotal = filteredExpenses.reduce((t, e) => t + parseFloat(e.received || 0), 0);

  data.push([], [], []);
  data.push(['', '', '', '', '', '', '', totalSaidas, `R$ ${valorTotal.toFixed(2)}`]);

  const ws = XLSX.utils.aoa_to_sheet([
    ['TRANSPORTADOR MOTORISTA', 'DATA SAIDA', 'LOJA SAÍDA',
     'INFORMAÇÕES ADICIONAIS', 'PEDAGIO ESTACIONAMENTO R$',
     'KM EXCEDIDOS R$', 'NOTAS E VIAGENS ADICIONAIS',
     'FRETE EMBARCADO', 'FRETE TOTAL R$'],
    ...data
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Saídas');
  XLSX.writeFile(wb, 'Relatorio_Saidas.xlsx');
}

// === WHATSAPP RELATÓRIO ===
function enviarWhatsApp() {
  if (filteredExpenses.length === 0) {
    alert("Nenhuma saída filtrada para enviar.");
    return;
  }

  const startDate = document.getElementById('filter-start-date')?.value || 'Não especificada';
  const endDate = document.getElementById('filter-end-date')?.value || 'Não especificada';
  const driver = document.getElementById('filter-driver')?.value || 'Não especificado';
  const store = document.getElementById('filter-store')?.value || 'Não especificada';

  let totalValue = 0;
  const groupedByDate = {};

  filteredExpenses.forEach(expense => {
    totalValue += parseFloat(expense.received || 0);
    if (!groupedByDate[expense.date]) groupedByDate[expense.date] = [];
    groupedByDate[expense.date].push(expense);
  });

  let message = `*Fechamento Tenda*\n\n*${store}*\n\n*${driver}*\n\n`;

  Object.keys(groupedByDate).sort().forEach(date => {
    const [ano, mes, dia] = date.split('-');
    message += `- Data -> ${dia}/${mes}/${ano}\n-`;
    groupedByDate[date].forEach((expense, index) => {
      message += ` Saída ${index + 1} -> Qtd Nfs -> ${expense.nfs || 'X'} - Peso: ${expense.weight}\n`;
    });
    message += `\n`;
  });

  message += `Total de Saídas: ${filteredExpenses.length} saída${filteredExpenses.length > 1 ? 's' : ''}\n`;
  message += `Valor total: R$ ${totalValue.toFixed(2)}\n`;

  const phoneNumber = "5513981335733";
  window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
                            }
