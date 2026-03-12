// ============================================
//   MRL LOG - IA de Voz para WhatsApp
//   Substitui a função iniciarReconhecimento()
// ============================================

const MENSAGENS_RAPIDAS = {
  "tenda": "Boa tarde. Oi,tudo bem? Sou entregador do Tenda",
  "entrega tenda": "Boa tarde. Oi,tudo bem? Sou entregador do Tenda",
  "oi entrega": "Boa tarde. Oi,tudo bem? Sou entregador do Tenda",
  "localizacao": "Poderia me enviar sua localização?",
  "localização": "Poderia me enviar sua localização?",
  "onde voce esta": "Poderia me enviar sua localização?",
  "onde você está": "Poderia me enviar sua localização?",
  "caminho": "Estou a caminho da sua entrega. Tenda Delivery.",
  "a caminho": "Estou a caminho da sua entrega. Tenda Delivery.",
  "estou chegando": "Estou a caminho da sua entrega. Tenda Delivery.",
  "chegando": "Estou a caminho da sua entrega. Tenda Delivery.",
};

// Extrai números do texto falado — aceita qualquer forma de falar
function extrairNumero(texto) {
  const t = texto.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim();

  // 1. Sequência de dígitos direto (ex: "13999998888")
  const soDigitos = t.replace(/\s/g, '').match(/\d{10,11}/);
  if (soDigitos) return soDigitos[0];

  // 2. Dígitos separados por espaço (ex: "1 3 9 9 9 9 9 8 8 8 8")
  const todosDigitos = t.match(/\b\d\b/g);
  if (todosDigitos && todosDigitos.length >= 10) {
    return todosDigitos.join('').slice(0, 11);
  }

  // 3. Mapa completo palavras → dígitos
  const unidades = {
    'zero':'0','um':'1','uma':'1','dois':'2','duas':'2',
    'tres':'3','quatro':'4','cinco':'5','seis':'6',
    'sete':'7','oito':'8','nove':'9'
  };

  const dezenas = {
    'dez':'10','onze':'11','doze':'12','treze':'13',
    'catorze':'14','quatorze':'14','quinze':'15',
    'dezesseis':'16','dezasseis':'16',
    'dezessete':'17','dezassete':'17',
    'dezoito':'18','dezenove':'19','dezanove':'19',
    'vinte':'20','trinta':'30','quarenta':'40',
    'cinquenta':'50','sessenta':'60','setenta':'70',
    'oitenta':'80','noventa':'90'
  };

  const ignorar = ['e','o','a','para','pro','pra','do','da','de',
    'com','no','na','numero','fone','celular','telefone',
    'whatsapp','zap','manda','envia','cliente','entregar'];

  const palavras = t.split(/\s+/);
  let digits = '';
  let i = 0;

  while (i < palavras.length) {
    const p = palavras[i];
    if (ignorar.includes(p)) { i++; continue; }

    // Número direto como string (ex: "13", "99")
    if (/^\d+$/.test(p)) {
      digits += p;
      i++;
      continue;
    }

    // Dezena composta: "noventa e nove" → 99
    if (dezenas[p] !== undefined) {
      let val = parseInt(dezenas[p]);
      if (palavras[i+1] === 'e' && palavras[i+2] && unidades[palavras[i+2]] !== undefined) {
        val += parseInt(unidades[palavras[i+2]]);
        digits += val.toString();
        i += 3;
      } else if (palavras[i+1] && unidades[palavras[i+1]] !== undefined && val >= 20) {
        val += parseInt(unidades[palavras[i+1]]);
        digits += val.toString();
        i += 2;
      } else {
        digits += val.toString();
        i++;
      }
      continue;
    }

    // Unidade simples
    if (unidades[p] !== undefined) {
      digits += unidades[p];
      i++;
      continue;
    }

    i++;
  }

  digits = digits.replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(0, 11);
  return null;
}
// Identifica qual mensagem rápida usar pelo texto falado
function identificarMensagem(texto) {
  const t = texto.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .trim();

  for (const [chave, mensagem] of Object.entries(MENSAGENS_RAPIDAS)) {
    const chaveNorm = chave.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (t.includes(chaveNorm)) return mensagem;
  }
  return null;
}

// Usa Claude (Anthropic API) para interpretar comandos complexos
async function interpretarComIA(texto) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `Você é um assistente para entregador de delivery. 
O entregador falou por voz: "${texto}"

Extraia as informações e responda SOMENTE com JSON válido, sem texto extra:
{
  "numero": "número de telefone extraído (somente dígitos, 10-11 dígitos) ou null",
  "mensagem": "uma dessas exatas opções ou null:
    - Boa tarde. Oi,tudo bem? Sou entregador do Tenda
    - Poderia me enviar sua localização?
    - Estou a caminho da sua entrega. Tenda Delivery."
}

Exemplos:
- "manda localização pro treze noventa e nove..." → mensagem de localização + número
- "fala que tô chegando pro cliente" → mensagem a caminho
- "apresenta pro número tal" → mensagem tenda + número`
        }]
      })
    });

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    const clean = content.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.warn('IA indisponível, usando reconhecimento local', e);
    return null;
  }
}

// Feedback visual e sonoro
function mostrarFeedback(msg, tipo = 'info') {
  let feedback = document.getElementById('voz-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.id = 'voz-feedback';
    feedback.style.cssText = `
      position: fixed;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 8, 30, 0.95);
      border: 1px solid rgba(186, 125, 255, 0.4);
      color: #e0d6f5;
      padding: 12px 24px;
      border-radius: 30px;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 4px 20px rgba(186,125,255,0.2);
      transition: opacity 0.3s;
      text-align: center;
      max-width: 90vw;
    `;
    document.body.appendChild(feedback);
  }

  const cores = {
    'info': '#ba7dff',
    'success': '#25D366',
    'error': '#dc3545',
    'ouvindo': '#00b5f4'
  };

  feedback.style.borderColor = cores[tipo] || cores.info;
  feedback.innerHTML = msg;
  feedback.style.opacity = '1';

  if (tipo !== 'ouvindo') {
    setTimeout(() => { feedback.style.opacity = '0'; }, 3500);
  }
}

// Animação do microfone
function setMicAtivo(ativo) {
  const icones = document.querySelectorAll('.fa-microphone');
  icones.forEach(ic => {
    if (ativo) {
      ic.style.color = '#00b5f4';
      ic.style.animation = 'pulse 0.8s infinite';
    } else {
      ic.style.color = '#ba7dff';
      ic.style.animation = '';
    }
  });
}

// Abre o WhatsApp com número e mensagem
function abrirWhatsApp(numero, mensagem) {
  const numLimpo = numero.replace(/\D/g, '');
  const numCompleto = numLimpo.startsWith('55') ? numLimpo : '55' + numLimpo;
  const url = `https://wa.me/${numCompleto}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}

// Preenche os campos visualmente
function preencherCampos(numero, mensagem) {
  if (numero) {
    const input = document.getElementById('whatsapp-scheduler-number');
    if (input) input.value = numero;
  }
  if (mensagem) {
    const textarea = document.getElementById('whatsapp-scheduler-message');
    if (textarea) textarea.value = mensagem;

    // Destaca o botão correspondente
    document.querySelectorAll('.whatsapp-scheduler-message-button').forEach(btn => {
      btn.style.background = btn.dataset.message === mensagem
        ? 'rgba(186, 125, 255, 0.4)'
        : '';
    });
  }
}

// ============================================
//   FUNÇÃO PRINCIPAL — substitui iniciarReconhecimento()
// ============================================
function iniciarReconhecimento() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    mostrarFeedback('❌ Seu navegador não suporta reconhecimento de voz', 'error');
    return;
  }

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'pt-BR';
  recognition.continuous = false;
  recognition.interimResults = false;

  setMicAtivo(true);
  mostrarFeedback('🎤 Ouvindo... fale o número e a mensagem', 'ouvindo');

  recognition.onresult = async function(event) {
    const texto = event.results[0][0].transcript;
    mostrarFeedback(`💬 Entendi: "${texto}"`, 'info');
    setMicAtivo(false);

    let numero = null;
    let mensagem = null;

    // 1. Tenta reconhecimento local primeiro (rápido)
    numero = extrairNumero(texto);
    mensagem = identificarMensagem(texto);

    // 2. Se não encontrou tudo, usa IA
    if (!numero || !mensagem) {
      mostrarFeedback('🤖 Processando com IA...', 'info');
      const resultado = await interpretarComIA(texto);
      if (resultado) {
        if (!numero && resultado.numero) numero = resultado.numero;
        if (!mensagem && resultado.mensagem) mensagem = resultado.mensagem;
      }
    }

    // 3. Preenche os campos
    preencherCampos(numero, mensagem);

    // 4. Abre WhatsApp se tiver número e mensagem
    if (numero && mensagem) {
      mostrarFeedback(`✅ Abrindo WhatsApp...`, 'success');
      setTimeout(() => abrirWhatsApp(numero, mensagem), 800);
    } else if (numero && !mensagem) {
      mostrarFeedback('📱 Número preenchido. Escolha a mensagem.', 'info');
    } else if (!numero && mensagem) {
      mostrarFeedback('✍️ Mensagem escolhida. Fale o número.', 'info');
    } else {
      mostrarFeedback('❓ Não entendi. Tente: "caminho pro 13 99999 8888"', 'error');
    }
  };

  recognition.onerror = function(e) {
    setMicAtivo(false);
    const erros = {
      'no-speech': '🔇 Nenhuma fala detectada. Tente novamente.',
      'not-allowed': '🚫 Permissão de microfone negada.',
      'network': '📡 Erro de rede. Verifique sua conexão.'
    };
    mostrarFeedback(erros[e.error] || `❌ Erro: ${e.error}`, 'error');
  };

  recognition.onend = function() {
    setMicAtivo(false);
  };

  recognition.start();
}

// Animação CSS para o microfone pulsando
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { transform: translateY(-50%) scale(1); opacity: 1; }
    50% { transform: translateY(-50%) scale(1.3); opacity: 0.7; }
  }
`;
document.head.appendChild(style);

// Compatibilidade: mantém o botão original do WhatsApp funcionando
document.addEventListener('DOMContentLoaded', () => {
  const btnEnviar = document.getElementById('whatsapp-scheduler-send');
  if (btnEnviar) {
    btnEnviar.addEventListener('click', () => {
      const numero = document.getElementById('whatsapp-scheduler-number')?.value;
      const mensagem = document.getElementById('whatsapp-scheduler-message')?.value;
      if (numero && mensagem) {
        abrirWhatsApp(numero, mensagem);
      } else {
        mostrarFeedback('⚠️ Preencha o número e a mensagem', 'error');
      }
    });
  }

  // Botões de mensagem rápida
  document.querySelectorAll('.whatsapp-scheduler-message-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const msg = btn.dataset.message;
      const textarea = document.getElementById('whatsapp-scheduler-message');
      if (textarea) textarea.value = msg;
      document.querySelectorAll('.whatsapp-scheduler-message-button').forEach(b => {
        b.style.background = b === btn ? 'rgba(186, 125, 255, 0.4)' : '';
      });
    });
  });
});    'sessenta': '60', 'setenta': '70', 'oitenta': '80', 'noventa': '90',
    'cem': '00', 'cento': '1'
  };

  let numeroStr = '';
  const palavras = texto.toLowerCase().split(/\s+/);
  for (const palavra of palavras) {
    if (mapaNumeros[palavra] !== undefined) {
      numeroStr += mapaNumeros[palavra];
    } else if (/^\d+$/.test(palavra)) {
      numeroStr += palavra;
    }
  }

  if (numeroStr.length >= 10) return numeroStr.slice(0, 11);
  return null;
}

// Identifica qual mensagem rápida usar pelo texto falado
function identificarMensagem(texto) {
  const t = texto.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos
    .trim();

  for (const [chave, mensagem] of Object.entries(MENSAGENS_RAPIDAS)) {
    const chaveNorm = chave.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (t.includes(chaveNorm)) return mensagem;
  }
  return null;
}

// Usa Claude (Anthropic API) para interpretar comandos complexos
async function interpretarComIA(texto) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `Você é um assistente para entregador de delivery. 
O entregador falou por voz: "${texto}"

Extraia as informações e responda SOMENTE com JSON válido, sem texto extra:
{
  "numero": "número de telefone extraído (somente dígitos, 10-11 dígitos) ou null",
  "mensagem": "uma dessas exatas opções ou null:
    - Boa tarde. Oi,tudo bem? Sou entregador do Tenda
    - Poderia me enviar sua localização?
    - Estou a caminho da sua entrega. Tenda Delivery."
}

Exemplos:
- "manda localização pro treze noventa e nove..." → mensagem de localização + número
- "fala que tô chegando pro cliente" → mensagem a caminho
- "apresenta pro número tal" → mensagem tenda + número`
        }]
      })
    });

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    const clean = content.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.warn('IA indisponível, usando reconhecimento local', e);
    return null;
  }
}

// Feedback visual e sonoro
function mostrarFeedback(msg, tipo = 'info') {
  let feedback = document.getElementById('voz-feedback');
  if (!feedback) {
    feedback = document.createElement('div');
    feedback.id = 'voz-feedback';
    feedback.style.cssText = `
      position: fixed;
      top: 70px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(15, 8, 30, 0.95);
      border: 1px solid rgba(186, 125, 255, 0.4);
      color: #e0d6f5;
      padding: 12px 24px;
      border-radius: 30px;
      font-size: 14px;
      z-index: 9999;
      box-shadow: 0 4px 20px rgba(186,125,255,0.2);
      transition: opacity 0.3s;
      text-align: center;
      max-width: 90vw;
    `;
    document.body.appendChild(feedback);
  }

  const cores = {
    'info': '#ba7dff',
    'success': '#25D366',
    'error': '#dc3545',
    'ouvindo': '#00b5f4'
  };

  feedback.style.borderColor = cores[tipo] || cores.info;
  feedback.innerHTML = msg;
  feedback.style.opacity = '1';

  if (tipo !== 'ouvindo') {
    setTimeout(() => { feedback.style.opacity = '0'; }, 3500);
  }
}

// Animação do microfone
function setMicAtivo(ativo) {
  const icones = document.querySelectorAll('.fa-microphone');
  icones.forEach(ic => {
    if (ativo) {
      ic.style.color = '#00b5f4';
      ic.style.animation = 'pulse 0.8s infinite';
    } else {
      ic.style.color = '#ba7dff';
      ic.style.animation = '';
    }
  });
}

// Abre o WhatsApp com número e mensagem
function abrirWhatsApp(numero, mensagem) {
  const numLimpo = numero.replace(/\D/g, '');
  const numCompleto = numLimpo.startsWith('55') ? numLimpo : '55' + numLimpo;
  const url = `https://wa.me/${numCompleto}?text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}

// Preenche os campos visualmente
function preencherCampos(numero, mensagem) {
  if (numero) {
    const input = document.getElementById('whatsapp-scheduler-number');
    if (input) input.value = numero;
  }
  if (mensagem) {
    const textarea = document.getElementById('whatsapp-scheduler-message');
    if (textarea) textarea.value = mensagem;

    // Destaca o botão correspondente
    document.querySelectorAll('.whatsapp-scheduler-message-button').forEach(btn => {
      btn.style.background = btn.dataset.message === mensagem
        ? 'rgba(186, 125, 255, 0.4)'
        : '';
    });
  }
}

// ============================================
//   FUNÇÃO PRINCIPAL — substitui iniciarReconhecimento()
// ============================================
function iniciarReconhecimento() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    mostrarFeedback('❌ Seu navegador não suporta reconhecimento de voz', 'error');
    return;
  }

  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'pt-BR';
  recognition.continuous = false;
  recognition.interimResults = false;

  setMicAtivo(true);
  mostrarFeedback('🎤 Ouvindo... fale o número e a mensagem', 'ouvindo');

  recognition.onresult = async function(event) {
    const texto = event.results[0][0].transcript;
    mostrarFeedback(`💬 Entendi: "${texto}"`, 'info');
    setMicAtivo(false);

    let numero = null;
    let mensagem = null;

    // 1. Tenta reconhecimento local primeiro (rápido)
    numero = extrairNumero(texto);
    mensagem = identificarMensagem(texto);

    // 2. Se não encontrou tudo, usa IA
    if (!numero || !mensagem) {
      mostrarFeedback('🤖 Processando com IA...', 'info');
      const resultado = await interpretarComIA(texto);
      if (resultado) {
        if (!numero && resultado.numero) numero = resultado.numero;
        if (!mensagem && resultado.mensagem) mensagem = resultado.mensagem;
      }
    }

    // 3. Preenche os campos
    preencherCampos(numero, mensagem);

    // 4. Abre WhatsApp se tiver número e mensagem
    if (numero && mensagem) {
      mostrarFeedback(`✅ Abrindo WhatsApp...`, 'success');
      setTimeout(() => abrirWhatsApp(numero, mensagem), 800);
    } else if (numero && !mensagem) {
      mostrarFeedback('📱 Número preenchido. Escolha a mensagem.', 'info');
    } else if (!numero && mensagem) {
      mostrarFeedback('✍️ Mensagem escolhida. Fale o número.', 'info');
    } else {
      mostrarFeedback('❓ Não entendi. Tente: "caminho pro 13 99999 8888"', 'error');
    }
  };

  recognition.onerror = function(e) {
    setMicAtivo(false);
    const erros = {
      'no-speech': '🔇 Nenhuma fala detectada. Tente novamente.',
      'not-allowed': '🚫 Permissão de microfone negada.',
      'network': '📡 Erro de rede. Verifique sua conexão.'
    };
    mostrarFeedback(erros[e.error] || `❌ Erro: ${e.error}`, 'error');
  };

  recognition.onend = function() {
    setMicAtivo(false);
  };

  recognition.start();
}

// Animação CSS para o microfone pulsando
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% { transform: translateY(-50%) scale(1); opacity: 1; }
    50% { transform: translateY(-50%) scale(1.3); opacity: 0.7; }
  }
`;
document.head.appendChild(style);

// Compatibilidade: mantém o botão original do WhatsApp funcionando
document.addEventListener('DOMContentLoaded', () => {
  const btnEnviar = document.getElementById('whatsapp-scheduler-send');
  if (btnEnviar) {
    btnEnviar.addEventListener('click', () => {
      const numero = document.getElementById('whatsapp-scheduler-number')?.value;
      const mensagem = document.getElementById('whatsapp-scheduler-message')?.value;
      if (numero && mensagem) {
        abrirWhatsApp(numero, mensagem);
      } else {
        mostrarFeedback('⚠️ Preencha o número e a mensagem', 'error');
      }
    });
  }

  // Botões de mensagem rápida
  document.querySelectorAll('.whatsapp-scheduler-message-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const msg = btn.dataset.message;
      const textarea = document.getElementById('whatsapp-scheduler-message');
      if (textarea) textarea.value = msg;
      document.querySelectorAll('.whatsapp-scheduler-message-button').forEach(b => {
        b.style.background = b === btn ? 'rgba(186, 125, 255, 0.4)' : '';
      });
    });
  });
});
