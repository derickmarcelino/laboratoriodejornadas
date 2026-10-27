// Simulador de participantes para ensaiar o painel sem celulares.
// Uso: node simular.js [participantes=12] [endereco=http://localhost:3000] [velocidade=1]
// Reaproveita as missões, o EscutAI e o Roteamento da própria página (index.html + missoes.js).

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const N = +process.argv[2] || 12;
const BASE = (process.argv[3] || 'http://localhost:3000').replace(/\/$/, '');
const VEL = +process.argv[4] || 1;

// Carrega a lógica da página num contexto isolado, com um "navegador" mínimo
const ctx = vm.createContext({
  console, setTimeout: () => 0, setInterval: () => 0,
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  location: { search: '', protocol: 'file:' },
  window: { scrollTo() {} },
  document: { querySelector: () => ({ innerHTML: '' }), querySelectorAll: () => [], addEventListener() {}, body: {} }
});
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const script = html.split('<script>')[1].split('</script>')[0];
vm.runInContext(fs.readFileSync(path.join(__dirname, 'missoes.js'), 'utf8') + '\n' + script +
  '\n;globalThis.__api={sentimento,classificar,MISSOES,INTENCOES,destLabel,setS:v=>{S=v;}};', ctx);
const { sentimento, classificar, MISSOES, INTENCOES, destLabel, setS } = ctx.__api;

const NOMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabi', 'Hugo', 'Íris', 'João', 'Karen', 'Léo', 'Marta', 'Nina', 'Otávio', 'Paula', 'Rui', 'Sofia', 'Téo', 'Vera'];
const CHEGADA = {
  pix: ['não consigo fazer o pix, diz que passou do limite noturno, que raiva', 'preciso mandar dinheiro pra Júlia hoje e o app não deixa'],
  boleto: ['preciso pagar a conta de luz hoje e o código de barras não funciona, estou preocupado com o corte', 'boleto vencendo e o app diz que só paga amanhã, absurdo'],
  investimento: ['quero investir mas o questionário trava e não entendi nada desses termos', 'tentei aplicar no CDB e deu erro de perfil'],
  contestacao: ['tem uma compra no meu cartão que eu não fiz e não consigo contestar!!', 'compra desconhecida de 489 reais, estou com medo de ter sido clonado'],
  viagem: ['meu cartão foi recusado no restaurante na argentina, socorro, o garçom está esperando', 'estou viajando e o cartão não passa, que vergonha'],
  limite: ['pedi aumento de limite e negaram sem explicação', 'preciso de limite pra comprar uma geladeira'],
  acesso: ['não consigo entrar no app no celular novo, o sms não chega', 'biometria não funciona e preciso ver meu saldo'],
  tarifa: ['apareceu uma cobrança estranha no extrato, eu nunca contratei pacote', 'que taxa é essa de 39,90? ninguém explica'],
  golpe: ['caí num golpe, mandei 800 reais pra um golpista, estou desesperado', 'fiz um pix pra um amigo e não era ele, foi golpe'],
  seguro: ['quero cancelar o seguro do celular e o app não deixa', 'como cancelo esse seguro que nem uso?'],
  divida: ['quero negociar minha fatura atrasada mas a entrada é muito alta', 'estou devendo o cartão e quero fazer um acordo'],
  cadastro: ['não consigo mandar o comprovante de renda, dá erro toda vez', 'quero atualizar minha renda e a foto do documento não vai']
};
const VAGO = ['me ajuda', 'deu erro aqui', 'oi'];
const AT1 = ['Pode ser, pode seguir', 'Não entendi, explica melhor?', 'Sério? Perdi um tempão com isso', 'ok', 'pode sim, obrigado'];
const AT2 = ['Ufa, resolveu! Obrigado', 'Ok… mas devia ser mais fácil pelo app', 'Ainda tenho receio de acontecer de novo', 'valeu, muito rápido'];
const FEED = ['No começo foi péssimo, muito erro no app, mas o atendimento resolveu rápido', 'Gostei muito, o especialista já sabia de tudo', 'Demorou demais, o app é confuso', 'Atendimento excelente, adorei não ter que repetir nada', 'ok, resolveu', 'Fiquei aliviado, obrigado!'];

const sorteia = a => a[Math.floor(Math.random() * a.length)];
const dormir = ms => new Promise(r => setTimeout(r, ms / VEL));

async function postar(lote) {
  try { await fetch(BASE + '/api/eventos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(lote) }); }
  catch (e) { console.error('Falha ao enviar para', BASE, '-', e.message); process.exit(1); }
}

async function participante(nome) {
  const m = sorteia(MISSOES);
  const sid = 'sim' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const t0 = Date.now(); let seq = 0; const eventosLocais = [];
  const ev = async (tipo, desc, extra = {}) => {
    const e = Object.assign({ id: sid + '-' + (++seq), sid, apelido: nome, missao: m.id, ts: Date.now(), t: Date.now() - t0, tipo, desc }, extra);
    eventosLocais.push(e); await postar([e]);
  };
  const msg = async (de, txt, extra = {}) => {
    const x = { de, txt, nome: extra.nome || null, fase: extra.fase || null };
    if (de === 'cliente' && extra.fase !== 'nota') { const s = sentimento(txt); x.score = +s.score.toFixed(3); x.emo = s.emo; x.termos = s.achados.map(a => ({ termo: a.termo, p: +a.p.toFixed(2), e: a.e })); }
    await ev('msg', txt, x);
  };
  const tela = async id => { const t = m.telas[id]; await ev('tela', id === 'home' ? 'Tela inicial do app' : `Tela “${t.t}${t.sub ? ' · ' + t.sub : ''}”`, { tela: id }); await dormir(1500 + Math.random() * 3000); };

  await ev('inicio', 'Missão aceita: ' + m.titulo);
  let atual = m.inicio || 'home';
  await tela(atual);
  if (atual === 'home') {
    if (Math.random() < 0.3) { await ev('desvio', 'Abriu “Extrato”, fora do caminho da missão', { tela: 'home' }); await dormir(1500); await ev('voltar', 'Voltou ao início'); }
    atual = Object.values(m.entradas)[0]; await ev('acao', 'Tocou no atalho da missão', { tela: 'home' }); await tela(atual);
  }
  // Percorre o app seguindo a ação principal de cada tela até chegar num beco sem saída
  const cliques = {};
  for (let passo = 0; passo < 9; passo++) {
    const t = m.telas[atual];
    const opcoes = t.acoes.map((a, i) => [a, i]).filter(([a]) => !a.ajuda);
    if (!opcoes.length) break;
    const [a, i] = Math.random() < 0.75 ? opcoes[0] : sorteia(opcoes);
    const k = atual + '|' + i, n = cliques[k] || 0; cliques[k] = n + 1;
    await ev(n ? 'retentativa' : 'acao', (n ? 'Tentou de novo “' : 'Tocou em “') + a.l + '”', { tela: atual });
    await dormir(a.espera || 600);
    if (a.erro && (a.vezes === undefined || n < a.vezes)) {
      await ev('erro', a.erro, { cod: a.cod, tela: atual }); await dormir(2000 + Math.random() * 2500);
      if (a.irErro) { atual = a.irErro; await tela(atual); }
      continue;
    }
    if (a.ir) { atual = a.ir; await tela(atual); }
  }
  // Atendimento
  await ev('ajuda', 'Pediu ajuda pelo botão “Falar com o banco”');
  await msg('agente', 'Olá! Me conta, com suas palavras: o que está acontecendo?', { nome: 'Atendimento digital' });
  await dormir(4000 + Math.random() * 4000);
  const textoChegada = Math.random() < 0.12 ? sorteia(VAGO) + ', ' + sorteia(CHEGADA[sorteia(Object.keys(CHEGADA))]) : sorteia(CHEGADA[m.id]);
  const tChegada = Date.now() - t0;
  await msg('cliente', textoChegada, { fase: 'chegada' });
  await ev('chat', 'Escreveu: “' + textoChegada.slice(0, 70) + '”');
  setS({ missao: m.id, eventos: eventosLocais });
  const r = classificar(textoChegada);
  await dormir(1400);
  const it = INTENCOES[r.top], certo = INTENCOES[m.intencao];
  await ev('roteamento', `Intenção “${it.nome}” (${Math.round(r.conf * 100)}%) → ${destLabel(it.destino)}`,
    { intencao: r.top, correta: m.intencao, conf: +r.conf.toFixed(3), destino: it.destino, sinalTexto: r.sinalTexto, sinalJornada: r.sinalJornada, termos: r.termos, ms: Date.now() - t0 - tChegada });
  await msg('sistema', 'Conectando você com ' + destLabel(it.destino) + '…');
  if (r.top !== m.intencao) {
    await dormir(1500);
    await msg('agente', `Olá! Pelo seu histórico, o seu caso é sobre ${certo.nome.toLowerCase()}, e quem resolve isso é outra equipe. Vou te transferir agora.`, { nome: destLabel(it.destino) });
    await ev('transferencia', 'Transferido para ' + destLabel(certo.destino), { de: it.destino, para: certo.destino });
  }
  await ev('atendimento', 'Atendimento iniciado com ' + destLabel(certo.destino), { destino: certo.destino });
  await dormir(2000);
  await msg('agente', m.roteiro[0], { nome: destLabel(certo.destino) });
  await dormir(5000 + Math.random() * 5000);
  await msg('cliente', sorteia(AT1), { fase: 'atendimento' });
  await dormir(2000);
  await msg('agente', m.roteiro[1], { nome: destLabel(certo.destino) });
  await ev('resolvido', 'Problema resolvido por ' + destLabel(certo.destino));
  await dormir(4000 + Math.random() * 4000);
  await msg('cliente', sorteia(AT2), { fase: 'atendimento' });
  await dormir(2000);
  await msg('agente', 'Antes de encerrar: em poucas palavras, como foi essa experiência pra você hoje?', { nome: destLabel(certo.destino) });
  await dormir(6000 + Math.random() * 6000);
  const fb = sorteia(FEED);
  await msg('cliente', fb, { fase: 'feedback' });
  await dormir(3000);
  const nota = Math.max(1, Math.min(5, Math.round(3 + sentimento(fb).score * 2 + (Math.random() - 0.5))));
  await msg('cliente', 'Nota ' + nota + ' de 5', { fase: 'nota' });
  await ev('feedback', 'Deu nota ' + nota + '/5', { nota });
  await dormir(3000);
  if (Math.random() < 0.8) await ev('bastidores', 'Abriu os bastidores da missão');
  console.log(`✔ ${nome} terminou “${m.titulo}”`);
}

(async () => {
  console.log(`Simulando ${N} participantes em ${BASE} (velocidade ${VEL}x)…`);
  const tarefas = [];
  for (let i = 0; i < N; i++) {
    tarefas.push(dormir(i * 2500).then(() => participante(NOMES[i % NOMES.length] + (i >= NOMES.length ? ' ' + (Math.floor(i / NOMES.length) + 1) : '') + ' (sim)')));
  }
  await Promise.all(tarefas);
  console.log('Simulação concluída.');
})();
