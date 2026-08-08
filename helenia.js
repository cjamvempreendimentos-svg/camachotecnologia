(() => {
  'use strict';
  const chat = document.getElementById('heleniaChat');
  const options = document.getElementById('heleniaOptions');
  const restart = document.getElementById('heleniaRestart');
  if (!chat || !options || !restart) return;

  const questions = [
    { text: 'Como vocês controlam a operação hoje?', options: ['Papel e anotações', 'Planilhas', 'Um sistema', 'Vários aplicativos'] },
    { text: 'Qual é o maior gargalo atualmente?', options: ['Retrabalho', 'Falta de controle', 'Atendimento', 'Dados e relatórios'] },
    { text: 'O que você mais gostaria de melhorar?', options: ['Centralizar a operação', 'Automatizar tarefas', 'Acompanhar indicadores', 'Atender melhor clientes'] }
  ];
  let answers = [];
  let step = 0;

  const addMessage = (text, className = '') => {
    const el = document.createElement('div');
    el.className = `ai-message ${className}`.trim();
    el.textContent = text;
    chat.appendChild(el);
    chat.scrollTop = chat.scrollHeight;
  };

  const renderOptions = (items) => {
    options.replaceChildren();
    items.forEach((label) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', () => choose(label));
      options.appendChild(button);
    });
  };

  const finish = () => {
    const recommendations = [];
    if (answers.some(a => /Papel|Planilhas|Vários/.test(a))) recommendations.push('centralização dos dados em um sistema web');
    if (answers.some(a => /Retrabalho|Automatizar/.test(a))) recommendations.push('automação das tarefas repetitivas');
    if (answers.some(a => /Dados|indicadores|controle/i.test(a))) recommendations.push('painel gerencial com indicadores');
    if (answers.some(a => /Atendimento|Atender/.test(a))) recommendations.push('HelenIA aplicada ao atendimento e à qualificação');
    if (!recommendations.length) recommendations.push('diagnóstico detalhado da operação e evolução do sistema atual');
    const unique = [...new Set(recommendations)].slice(0, 4);
    addMessage(`Diagnóstico inicial: identifiquei oportunidade para ${unique.join('; ')}. Este resultado é preliminar — a arquitetura correta depende de mapear sua operação e regras de negócio.`, 'result');
    const link = document.createElement('a');
    link.className = 'btn primary-btn';
    const summary = encodeURIComponent(`Olá, fiz o diagnóstico com a HelenIA no site da Camacho Tecnologia. Negócio: ${answers[0]}. Cenário: ${answers.slice(1).join(' | ')}. Quero conversar sobre a solução.`);
    link.href = `https://wa.me/5571992438726?text=${summary}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Enviar diagnóstico para a Camacho';
    options.replaceChildren(link);
    restart.hidden = false;
  };

  function choose(value) {
    answers.push(value);
    addMessage(value, 'user');
    if (step < questions.length) {
      const q = questions[step++];
      window.setTimeout(() => { addMessage(q.text); renderOptions(q.options); }, 180);
    } else {
      window.setTimeout(finish, 180);
    }
  }

  options.querySelectorAll('[data-helenia]').forEach(btn => btn.addEventListener('click', () => choose(btn.dataset.helenia)));
  restart.addEventListener('click', () => {
    answers = []; step = 0; restart.hidden = true;
    chat.innerHTML = '<div class="ai-message">Olá. Posso fazer um diagnóstico inicial da sua operação e identificar onde sistemas, automação ou IA podem ajudar. Qual é o seu tipo de negócio?</div>';
    renderOptions(['Clínica ou saúde', 'Comércio ou loja', 'Alimentação', 'Outro negócio']);
  });
})();