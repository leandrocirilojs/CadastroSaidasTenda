// ============================================
//   MRL LOG - Voz para WhatsApp (v3 Robusto)
// ============================================

// === PAINEL DE DEBUG VISUAL (para tablet) ===
function criarDebug() {
  const d = document.createElement('div');
  d.id = 'mrl-debug';
  d.style.cssText = `
    position: fixed; bottom: 80px; left: 10px; right: 10px;
    background: rgba(0,0,0,0.85); color: #0f0; font-size: 12px;
    font-family: monospace; padding: 10px; border-radius: 10px;
    z-index: 99999; max-height: 180px; overflow-y: auto;
    border: 1px solid #ba7dff; display: none;
  `;
  document.body.appendChild(d);
  return d;
}

function log(msg) {
  console.log('[MRL]', msg);
  let d = document.getElementById('mrl-debug');
  if (!d) d = criarDebug();
  d.style.display = 'block';
  d.innerHTML += '<div>> ' + msg + '</div>';
  d.scrollTop = d.scrollHeight;
  clearTimeout(window._debugTimer);
  window._debugTimer = setTimeout(() => { d.style.display = 'none'; d.innerHTML = ''; }, 8000);
}

// === MENSAGENS ===
const MSGS = {
  tenda: "Boa tarde. Oi,tudo bem? Sou entregador do Tenda",
  localizacao: "Poderia me enviar sua localização?",
  caminho: "Estou a caminho da sua entrega. Tenda Delivery.",
};

function identificarMensagem(texto) {
  const t = texto.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (t.match(/caminho|chegando/)) return MSGS.caminho;
  if (t.match(/localiza|onde/)) return MSGS.localizacao;
  if (t.match(/tenda|entrega|apresenta/)) return MSGS.tenda;
  return null;
}

// === EXTRAÇÃO DE NÚMERO ===
function extrairNumero(texto) {
  log('Texto: ' + texto);
  const t = texto.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, ' ').trim();

  // 1. Dígitos diretos agrupados
  const grupos = t.match(/\d+/g);
  if (grupos) {
    const junto = grupos.join('');
    log('Digitos: ' + junto);
    if (junto.length >= 10) return junto.slice(0, 11);
  }

  // 2. Conversão por palavras
  const map = {
    'zero':'0','um':'1','uma':'1','dois':'2','duas':'2',
    'tres':'3','quatro':'4','cinco':'5','seis':'6',
    'sete':'7','oito':'8','nove':'9',
    'dez':'10','onze':'11','doze':'12','treze':'13',
    'catorze':'14','quatorze':'14','quinze':'15',
    'dezesseis':'16','dezasseis':'16','dezessete':'17',
    'dezassete':'17','dezoito':'18','dezenove':'19','dezanove':'19',
    'vinte':'20','trinta':'30','quarenta':'40',
    'cinquenta':'50','sessenta':'60','setenta':'70',
    'oitenta':'80','noventa':'90'
  };

  const ignorar = new Set(['e','o','a','para','pro','pra','do','da','de',
    'com','no','na','numero','fone','celular','telefone',
    'whatsapp','zap','manda','envia','cliente','entregar',
    'caminho','localizacao','tenda','chegando','entrega']);

  const palavras = t.split(/\s+/);
  let digits = '';
  let i = 0;

  while (i < palavras.length) {
    const p = palavras[i];
    if (ignorar.has(p)) { i++; continue; }
    if (/^\d+$/.test(p)) { digits += p; i++; continue; }
    if (map[p] && parseInt(map[p]) >= 10) {
      let val = parseInt(map[p]);
      if (palavras[i+1] === 'e' && map[palavras[i+2]] && parseInt(map[palavras[i+2]]) < 10) {
        val += parseInt(map[palavras[i+2]]); i += 3;
      } else if (map[palavras[i+1]] && parseInt(map[palavras[i+1]]) < 10 && val >= 20) {
        val += parseInt(map[palavras[i+1]]); i += 2;
      } else { i++; }
      digits += val.toString(); continue;
    }
    if (map[p]) { digits += map[p]; i++; continue; }
    i++;
  }

  log('Extraido: ' + digits);
  if (digits.length >= 10) return digits.slice(0, 11);
  return null;
}

// === FEEDBACK VISUAL ===
function mostrarFeedback(msg, tipo) {
  let el = document.getElementById('voz-feedback');
  if (!el) {
    el = document.createElement('div');
    el.id = 'voz-feedback';
    el.style.cssText = 'position:fixed;top:70px;left:50%;transform:translateX(-50%);' +
      'background:rgba(15,8,30,0.95);color:#e0d6f5;padding:12px 24px;border-radius:30px;' +
      'font-size:14px;z-index:9999;border:1px solid #ba7dff;text-align:center;' +
      'max-width:90vw;transition:opacity 0.3s;';
    document.body.appendChild(el);
  }
  const cores = {info:'#ba7dff',success:'#25D366',error:'#dc3545',ouvindo:'#00b5f4'};
  el.style.borderColor = cores[tipo] || cores.info;
  el.style.opacity = '1';
  el.innerHTML = msg;
  clearTimeout(el._timer);
  if (tipo !== 'ouvindo') el._timer = setTimeout(() => el.style.opacity = '0', 4000);
}

function setMicAtivo(ativo) {
  document.querySelectorAll('.fa-microphone').forEach(ic => {
    ic.style.color = ativo ? '#00b5f4' : '#ba7dff';
  });
}

function abrirWhatsApp(numero, mensagem) {
  const n = numero.replace(/\D/g, '');
  const num = n.startsWith('55') ? n : '55' + n;
  log('Abrindo: ' + num);
  window.open('https://wa.me/' + num + '?text=' + encodeURIComponent(mensagem), '_blank');
}

function preencherCampos(numero, mensagem) {
  if (numero) {
    const inp = document.getElementById('whatsapp-scheduler-number');
    if (inp) inp.value = numero;
  }
  if (mensagem) {
    const ta = document.getElementById('whatsapp-scheduler-message');
    if (ta) ta.value = mensagem;
    document.querySelectorAll('.whatsapp-scheduler-message-button').forEach(btn => {
      btn.style.background = btn.dataset.message === mensagem ? 'rgba(186,125,255,0.4)' : '';
    });
  }
}

// === FUNÇÃO PRINCIPAL ===
function iniciarReconhecimento() {
  log('Iniciando...');
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    mostrarFeedback('Navegador sem suporte a voz', 'error');
    log('SpeechRecognition indisponivel');
    return;
  }

  const recognition = new SR();
  recognition.lang = 'pt-BR';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  setMicAtivo(true);
  mostrarFeedback('🎤 Ouvindo... fale o número e a mensagem', 'ouvindo');

  recognition.onresult = function(event) {
    let melhorNumero = null;
    let melhorMensagem = null;

    for (let alt = 0; alt < event.results[0].length; alt++) {
      const texto = event.results[0][alt].transcript;
      log('Alt' + alt + ': ' + texto);
      if (!melhorNumero) melhorNumero = extrairNumero(texto);
      if (!melhorMensagem) melhorMensagem = identificarMensagem(texto);
      if (melhorNumero && melhorMensagem) break;
    }

    setMicAtivo(false);
    log('Num:' + melhorNumero + ' Msg:' + (melhorMensagem ? 'sim' : 'nao'));
    preencherCampos(melhorNumero, melhorMensagem);

    if (melhorNumero && melhorMensagem) {
      mostrarFeedback('✅ Abrindo WhatsApp...', 'success');
      setTimeout(() => abrirWhatsApp(melhorNumero, melhorMensagem), 800);
    } else if (melhorNumero) {
      mostrarFeedback('📱 Número ok! Escolha a mensagem.', 'info');
    } else if (melhorMensagem) {
      mostrarFeedback('✍️ Mensagem ok! Fale o número.', 'info');
    } else {
      mostrarFeedback('❓ Ex: "caminho pro 13 99999 8888"', 'error');
    }
  };

  recognition.onerror = function(e) {
    setMicAtivo(false);
    log('Erro: ' + e.error);
    const erros = {
      'no-speech':'🔇 Nenhuma fala. Tente novamente.',
      'not-allowed':'🚫 Permissão de microfone negada.',
      'network':'📡 Erro de rede.'
    };
    mostrarFeedback(erros[e.error] || 'Erro: ' + e.error, 'error');
  };

  recognition.onend = () => setMicAtivo(false);
  recognition.start();
  log('Microfone ativo');
}

// === BOTÕES ===
document.addEventListener('DOMContentLoaded', () => {
  const btnEnviar = document.getElementById('whatsapp-scheduler-send');
  if (btnEnviar) {
    btnEnviar.onclick = () => {
      const numero = document.getElementById('whatsapp-scheduler-number')?.value;
      const mensagem = document.getElementById('whatsapp-scheduler-message')?.value;
      if (numero && mensagem) abrirWhatsApp(numero, mensagem);
      else mostrarFeedback('Preencha número e mensagem', 'error');
    };
  }

  document.querySelectorAll('.whatsapp-scheduler-message-button').forEach(btn => {
    btn.onclick = () => {
      const ta = document.getElementById('whatsapp-scheduler-message');
      if (ta) ta.value = btn.dataset.message;
      document.querySelectorAll('.whatsapp-scheduler-message-button').forEach(b => {
        b.style.background = b === btn ? 'rgba(186,125,255,0.4)' : '';
      });
    };
  });

  log('vozIA carregado OK');
});
