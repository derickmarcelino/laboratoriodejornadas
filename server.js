// Servidor do workshop "Missão Cliente".
// Recebe os eventos das missões (celulares) e transmite ao vivo para o painel.
// Sem dependências: rode com `node server.js` (porta padrão 3000, ou PORT=8080 node server.js).
//
// Funciona 100% offline (nenhum arquivo vem da internet). No dia, sem internet para os participantes:
//   1. Ligue o Wi-Fi do notebook: Configurações → Rede e Internet → Ponto de acesso móvel.
//      Se a política corporativa bloquear, use um roteador portátil (não precisa de internet, só de rede local).
//      Atenção: o hotspot do Windows aceita no máximo ~8 dispositivos; para turmas maiores, use o roteador.
//   2. Libere a porta no Firewall (uma vez, PowerShell como administrador):
//      New-NetFirewallRule -DisplayName "Missao Cliente 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Any
//   3. `node server.js` e abra http://localhost:3000/qrcode no notebook para projetar o QR.
//      Os celulares não usam "localhost": o QR já aponta para o IP do notebook na rede do hotspot.
//      Se o IP escolhido estiver errado, force: no PowerShell, $env:IP="192.168.137.1"; node server.js

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = +process.env.PORT || 3000;
const DIR = __dirname;
const DADOS = path.join(DIR, 'dados');
const ARQ = path.join(DADOS, 'eventos.jsonl');

fs.mkdirSync(DADOS, { recursive: true });

// Eventos ficam em memória e em disco (uma linha JSON por evento), para sobreviver a reinícios.
let eventos = [];
const ids = new Set();
if (fs.existsSync(ARQ)) {
  for (const linha of fs.readFileSync(ARQ, 'utf8').split('\n')) {
    if (!linha.trim()) continue;
    try { const e = JSON.parse(linha); if (!ids.has(e.id)) { ids.add(e.id); eventos.push(e); } } catch (_) {}
  }
}

// Mesma regra de XP da missão e do painel (definida em missoes.js)
const { pontuacao, MISSOES } = require('vm').runInNewContext(
  fs.readFileSync(path.join(DIR, 'missoes.js'), 'utf8') + '\n;({ pontuacao, MISSOES })');

// Ranking da turma: só entra quem concluiu a missão (deu a nota). Empate: quem terminou mais rápido.
function ranking(sid) {
  const ses = new Map();
  for (const e of eventos) {
    let s = ses.get(e.sid);
    if (!s) { s = { sid: e.sid, apelido: '', missao: e.missao, erros: 0, ajuda: false, resolvido: false, fb: null }; ses.set(e.sid, s); }
    if (e.apelido) s.apelido = e.apelido;
    if (e.tipo === 'erro') s.erros++;
    else if (e.tipo === 'ajuda') s.ajuda = true;
    else if (e.tipo === 'resolvido') s.resolvido = true;
    else if (e.tipo === 'feedback') s.fb = e;
  }
  const lista = [...ses.values()].filter(s => s.fb).map(s => ({
    sid: s.sid,
    nome: s.apelido || 'Agente ' + s.sid.slice(-4).toUpperCase(),
    codinome: (MISSOES.find(m => m.id === s.missao) || {}).codinome || s.missao,
    xp: pontuacao({ erros: s.erros, ajuda: s.ajuda, resolvido: s.resolvido, avaliou: true, ms: s.fb.t }),
    tempo: s.fb.t
  })).sort((a, b) => b.xp - a.xp || a.tempo - b.tempo);
  const linha = (r, i) => ({ posicao: i + 1, nome: r.nome, codinome: r.codinome, xp: r.xp, tempo: r.tempo, voce: r.sid === sid });
  const i = lista.findIndex(r => r.sid === sid);
  return {
    total: lista.length,
    andamento: ses.size - lista.length,
    posicao: i >= 0 ? i + 1 : null,
    voce: i >= 0 ? linha(lista[i], i) : null,
    top: lista.slice(0, 5).map(linha)
  };
}

const clientes = new Set();
function transmitir(tipo, dados) {
  const msg = `event: ${tipo}\ndata: ${JSON.stringify(dados)}\n\n`;
  for (const res of clientes) res.write(msg);
}

const ESTATICOS = {
  '/': 'index.html', '/index.html': 'index.html',
  '/painel': 'painel.html', '/painel.html': 'painel.html',
  '/qrcode': 'qrcode.html', '/qrcode.html': 'qrcode.html',
  '/missoes.js': 'missoes.js',
  '/vendor/qrcode.min.js': 'vendor/qrcode.min.js'
};
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };

// IP do hotspot primeiro (o QR usa o primeiro da lista): IP forçado, depois 192.168.137.* (Ponto de acesso
// móvel do Windows), depois outras faixas privadas; o resto (VPN, link-local) por último.
function prioridade(ip) {
  if (ip === process.env.IP) return 0;
  if (ip.startsWith('192.168.137.')) return 1;
  if (/^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip)) return 2;
  return 3;
}
function ipsDaRede() {
  const ips = Object.values(os.networkInterfaces()).flat()
    .filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  if (process.env.IP && !ips.includes(process.env.IP)) ips.push(process.env.IP);
  return ips.sort((a, b) => prioridade(a) - prioridade(b));
}

function lerCorpo(req) {
  return new Promise((ok, falha) => {
    let b = '';
    req.on('data', c => { b += c; if (b.length > 1e6) { falha(new Error('corpo grande demais')); req.destroy(); } });
    req.on('end', () => ok(b));
  });
}

function json(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

const servidor = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  try {
    if (req.method === 'GET' && ESTATICOS[url.pathname]) {
      const arq = ESTATICOS[url.pathname];
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arq)], 'Cache-Control': 'no-cache' });
      return fs.createReadStream(path.join(DIR, arq)).pipe(res);
    }

    // Missões enviam lotes de eventos
    if (req.method === 'POST' && url.pathname === '/api/eventos') {
      const lote = JSON.parse(await lerCorpo(req));
      const novos = [];
      for (const e of Array.isArray(lote) ? lote : [lote]) {
        if (!e || !e.id || !e.sid || ids.has(e.id)) continue;
        e.recebido = Date.now();
        ids.add(e.id); eventos.push(e); novos.push(e);
      }
      if (novos.length) {
        fs.appendFileSync(ARQ, novos.map(e => JSON.stringify(e)).join('\n') + '\n');
        transmitir('eventos', novos);
      }
      return json(res, 200, { ok: true, recebidos: novos.length });
    }

    // Painel: estado completo + fluxo ao vivo
    if (req.method === 'GET' && url.pathname === '/api/estado') return json(res, 200, { eventos, agora: Date.now() });

    if (req.method === 'GET' && url.pathname === '/api/stream') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write('retry: 2000\n\n');
      clientes.add(res);
      req.on('close', () => clientes.delete(res));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/ranking') return json(res, 200, ranking(url.searchParams.get('sid') || ''));

    if (req.method === 'GET' && url.pathname === '/api/info') return json(res, 200, { ips: ipsDaRede(), porta: PORT });

    // Nova turma: arquiva os eventos atuais e zera o painel
    // Publicado na internet, defina SENHA no servidor para que só quem a conhece zere o painel.
    if (req.method === 'POST' && url.pathname === '/api/reset') {
      if (process.env.SENHA && req.headers['x-senha'] !== process.env.SENHA) return json(res, 401, { erro: 'senha incorreta' });
      if (fs.existsSync(ARQ) && fs.statSync(ARQ).size) {
        fs.renameSync(ARQ, path.join(DADOS, `eventos-${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`));
      }
      eventos = []; ids.clear();
      transmitir('reset', {});
      return json(res, 200, { ok: true });
    }

    json(res, 404, { erro: 'não encontrado' });
  } catch (err) {
    json(res, 400, { erro: String(err.message || err) });
  }
});

setInterval(() => { for (const res of clientes) res.write(': ping\n\n'); }, 20000);

servidor.listen(PORT, () => {
  console.log(`\nMissão Cliente rodando na porta ${PORT}\n`);
  console.log(`  Painel:  http://localhost:${PORT}/painel`);
  console.log(`  QR code: http://localhost:${PORT}/qrcode`);
  ipsDaRede().forEach((ip, n) => console.log(`  Missões (celulares na mesma rede): http://${ip}:${PORT}/${n ? '' : '   ← usado no QR'}`));
  console.log(`\n  ${eventos.length} eventos carregados de ${ARQ}\n`);
});
