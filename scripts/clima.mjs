#!/usr/bin/env node
/**
 * clima.mjs — consulta clima atual + previsao via Open-Meteo (sem API key).
 *
 * Uso:
 *   node clima.mjs "<cidade>" [--dias N] [--horas] [--dia AAAA-MM-DD] [--json]
 *   node clima.mjs --lote capitais | --lote "Cidade1,Cidade2,..." [--json]
 *
 * Exemplos:
 *   node clima.mjs "Porto Alegre"                 # agora + 3 dias
 *   node clima.mjs "Florianopolis" --dias 7       # semana inteira
 *   node clima.mjs "Sao Paulo" --horas            # detalhe hora a hora (hoje e amanha)
 *   node clima.mjs "Lisboa" --dia 2026-08-02 --horas
 *   node clima.mjs "Curitiba" --json              # dados crus, pra montar tabela
 *   node clima.mjs --lote capitais                # as 27 capitais, 1 requisicao
 *   node clima.mjs --lote "Recife,Natal,Salvador" # comparar cidades quaisquer
 *
 * Sai com codigo 2 se a cidade nao for encontrada (o chamador deve pedir
 * desambiguacao ao usuario em vez de chutar).
 */

const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
const FC = 'https://api.open-meteo.com/v1/forecast';

// Codigos WMO -> descricao PT-BR + emoji. Fonte: tabela WW do Open-Meteo.
const WMO = {
  0:  ['céu limpo', '☀️'],
  1:  ['predominantemente limpo', '🌤️'],
  2:  ['parcialmente nublado', '⛅'],
  3:  ['nublado', '☁️'],
  45: ['nevoeiro', '🌫️'],
  48: ['nevoeiro com geada', '🌫️'],
  51: ['garoa fraca', '🌦️'],
  53: ['garoa moderada', '🌦️'],
  55: ['garoa forte', '🌧️'],
  56: ['garoa congelante fraca', '🌧️'],
  57: ['garoa congelante forte', '🌧️'],
  61: ['chuva fraca', '🌦️'],
  63: ['chuva moderada', '🌧️'],
  65: ['chuva forte', '🌧️'],
  66: ['chuva congelante fraca', '🌧️'],
  67: ['chuva congelante forte', '🌧️'],
  71: ['neve fraca', '🌨️'],
  73: ['neve moderada', '🌨️'],
  75: ['neve forte', '❄️'],
  77: ['grãos de neve', '🌨️'],
  80: ['pancadas de chuva fracas', '🌦️'],
  81: ['pancadas de chuva moderadas', '🌧️'],
  82: ['pancadas de chuva fortes', '⛈️'],
  85: ['pancadas de neve fracas', '🌨️'],
  86: ['pancadas de neve fortes', '❄️'],
  95: ['tempestade', '⛈️'],
  96: ['tempestade com granizo', '⛈️'],
  99: ['tempestade com granizo forte', '⛈️'],
};
const desc = (c) => (WMO[c] ?? ['condição desconhecida', '❓'])[0];
const emoji = (c) => (WMO[c] ?? ['', '❓'])[1];

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

// Datas do Open-Meteo ja vem no fuso local do lugar consultado; parsear como
// UTC evita que o fuso da MAQUINA desloque o dia da semana.
const diaSemana = (iso) => DIAS[new Date(iso + 'T12:00:00Z').getUTCDay()];
const ddmm = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

function parseArgs(argv) {
  const out = { cidade: null, dias: 3, horas: false, dia: null, json: false, lote: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dias') out.dias = Math.min(16, Math.max(1, parseInt(argv[++i], 10) || 3));
    else if (a === '--horas') out.horas = true;
    else if (a === '--dia') out.dia = argv[++i];
    else if (a === '--json') out.json = true;
    else if (a === '--lote') out.lote = argv[++i];
    else if (!a.startsWith('--') && !out.cidade) out.cidade = a;
  }
  return out;
}

async function getJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  return r.json();
}

async function geocode(nome) {
  const u = `${GEO}?name=${encodeURIComponent(nome)}&count=5&language=pt&format=json`;
  const { results } = await getJSON(u);
  return results ?? [];
}

// As 27 capitais ja com coordenadas: evita 27 chamadas de geocoding e deixa o
// atalho `--lote capitais` instantaneo (uma requisicao so).
const CAPITAIS = [
  ['Rio Branco', 'AC', -9.9750, -67.8243], ['Maceió', 'AL', -9.6658, -35.7353],
  ['Macapá', 'AP', 0.0389, -51.0664], ['Manaus', 'AM', -3.1019, -60.0250],
  ['Salvador', 'BA', -12.9714, -38.5014], ['Fortaleza', 'CE', -3.7172, -38.5433],
  ['Brasília', 'DF', -15.7797, -47.9297], ['Vitória', 'ES', -20.3155, -40.3128],
  ['Goiânia', 'GO', -16.6869, -49.2648], ['São Luís', 'MA', -2.5297, -44.3028],
  ['Cuiabá', 'MT', -15.6014, -56.0979], ['Campo Grande', 'MS', -20.4697, -54.6201],
  ['Belo Horizonte', 'MG', -19.9167, -43.9345], ['Belém', 'PA', -1.4558, -48.5044],
  ['João Pessoa', 'PB', -7.1150, -34.8631], ['Curitiba', 'PR', -25.4284, -49.2733],
  ['Recife', 'PE', -8.0476, -34.8770], ['Teresina', 'PI', -5.0892, -42.8019],
  ['Rio de Janeiro', 'RJ', -22.9068, -43.1729], ['Natal', 'RN', -5.7945, -35.2110],
  ['Porto Alegre', 'RS', -30.0328, -51.2302], ['Porto Velho', 'RO', -8.7619, -63.9039],
  ['Boa Vista', 'RR', 2.8235, -60.6758], ['Florianópolis', 'SC', -27.5954, -48.5480],
  ['São Paulo', 'SP', -23.5505, -46.6333], ['Aracaju', 'SE', -10.9472, -37.0731],
  ['Palmas', 'TO', -10.1689, -48.3317],
];

/**
 * Modo lote: compara VARIAS cidades num instante so. A API aceita listas de
 * lat/lon separadas por virgula e devolve um array, entao 27 capitais custam
 * UMA requisicao — nao 27. Ordena do mais quente pro mais frio, que e como a
 * pergunta "onde tá mais quente?" costuma vir.
 */
async function modoLote(spec, comoJson) {
  let pontos;
  if (/^(capitais|capitals)$/i.test(spec)) {
    pontos = CAPITAIS.map(([nome, uf, lat, lon]) => ({ rotulo: `${nome}/${uf}`, lat, lon }));
  } else {
    const nomes = spec.split(',').map((s) => s.trim()).filter(Boolean);
    if (!nomes.length) {
      console.error('--lote precisa de "Cidade1,Cidade2,..." ou do atalho "capitais"');
      process.exit(1);
    }
    const achados = await Promise.all(nomes.map(async (n) => {
      const r = (await geocode(n))[0];
      if (!r) { console.error(`⚠️  não encontrei "${n}" — pulando`); return null; }
      // Rotulo sempre desambiguado: no Brasil mostra o estado, fora mostra o pais.
      // Isso importa porque "Nova York" casa com Nova Iorque/Maranhão (existe!) —
      // e o usuario precisa VER que veio a cidade errada em vez de ler "/BR".
      const onde = r.country === 'Brasil' ? (r.admin1 || 'Brasil') : r.country;
      return { rotulo: `${r.name}/${onde}`, lat: r.latitude, lon: r.longitude };
    }));
    pontos = achados.filter(Boolean);
    if (!pontos.length) { console.error('nenhuma cidade da lista foi encontrada.'); process.exit(2); }
  }

  const p = new URLSearchParams({
    latitude: pontos.map((x) => x.lat).join(','),
    longitude: pontos.map((x) => x.lon).join(','),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m',
    timezone: 'auto',
  });
  const resp = await getJSON(`${FC}?${p}`);
  const lista = Array.isArray(resp) ? resp : [resp];

  const linhas = pontos.map((pt, i) => {
    const c = lista[i].current;
    return {
      local: pt.rotulo, temp: c.temperature_2m, sensacao: c.apparent_temperature,
      umidade: c.relative_humidity_2m, vento: c.wind_speed_10m,
      tempo: desc(c.weather_code), emoji: emoji(c.weather_code),
      hora: c.time.slice(11, 16), fuso: lista[i].timezone,
    };
  }).sort((a, b) => b.temp - a.temp);

  if (comoJson) { console.log(JSON.stringify(linhas, null, 2)); return; }

  // Se as cidades cruzam fusos, a "hora agora" nao e uma so — mostra por linha.
  const horas = [...new Set(linhas.map((l) => l.hora))];
  const larg = Math.max(...linhas.map((l) => l.local.length));
  const out = [];
  out.push(horas.length === 1 ? `🌡️  agora (${horas[0]} local) — ${linhas.length} lugares, do mais quente ao mais frio`
                              : `🌡️  agora — ${linhas.length} lugares em fusos diferentes (hora local por linha)`);
  out.push('');
  for (const l of linhas) {
    out.push(
      `  ${String(l.temp.toFixed(1)).padStart(5)}°C  sens ${String(l.sensacao.toFixed(1)).padStart(5)}°C  ` +
      `${l.local.padEnd(larg)}  ${l.emoji} ${l.tempo.padEnd(28)}` +
      `umid ${String(l.umidade).padStart(3)}%  vento ${String(Math.round(l.vento)).padStart(2)} km/h` +
      (horas.length > 1 ? `  (${l.hora})` : '')
    );
  }
  const q = linhas[0], f = linhas[linhas.length - 1];
  out.push('');
  out.push(`  amplitude: ${(q.temp - f.temp).toFixed(1)}°C entre ${q.local} e ${f.local}`);
  out.push('');
  out.push('fonte: Open-Meteo · temperaturas em °C, vento km/h');
  console.log(out.join('\n'));
}

const args = parseArgs(process.argv.slice(2));

if (args.lote) {
  try {
    await modoLote(args.lote, args.json);
    process.exit(0);
  } catch (e) {
    console.error(`erro no modo lote: ${e.message}`);
    process.exit(1);
  }
}

if (!args.cidade) {
  console.error('uso: node clima.mjs "<cidade>" [--dias N] [--horas] [--dia AAAA-MM-DD] [--json]\n     node clima.mjs --lote capitais\n     node clima.mjs --lote "Recife,Natal,Salvador"');
  process.exit(1);
}

let locais;
try {
  locais = await geocode(args.cidade);
} catch (e) {
  console.error(`erro ao consultar o geocoding: ${e.message}`);
  process.exit(1);
}

if (locais.length === 0) {
  console.error(`Cidade não encontrada: "${args.cidade}". Tente com o nome completo ou acrescente o estado/país.`);
  process.exit(2);
}

const loc = locais[0];
const ondeCurto = [loc.name, loc.admin1, loc.country].filter(Boolean).join(', ');

// Homonimas: so vale avisar quando a outra cidade e grande o bastante pra ser
// plausivel que o usuario quisesse ELA. "Lisboa, Mocambique" (um vilarejo) ao
// lado de Lisboa/Portugal e ruido — atrapalha mais do que ajuda. Corte em 20%
// da populacao do primeiro resultado, e deduplica lugares repetidos.
const vistos = new Set();
const ambiguos = locais
  .slice(1)
  .filter((l) => l.name.toLowerCase() === loc.name.toLowerCase())
  .filter((l) => (l.population ?? 0) >= (loc.population ?? 0) * 0.2)
  .map((l) => [l.name, l.admin1, l.country].filter(Boolean).join(', '))
  .filter((r) => !vistos.has(r) && vistos.add(r))
  .slice(0, 3);

// forecast_days precisa cobrir a data pedida em --dia
let forecastDays = args.dias;
if (args.dia) {
  const hoje = new Date();
  const alvo = new Date(args.dia + 'T12:00:00Z');
  const delta = Math.ceil((alvo - hoje) / 86400000) + 1;
  forecastDays = Math.min(16, Math.max(forecastDays, delta + 1));
}

const params = new URLSearchParams({
  latitude: loc.latitude,
  longitude: loc.longitude,
  current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
  daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,sunrise,sunset',
  hourly: 'temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m',
  timezone: 'auto',
  forecast_days: String(forecastDays),
});

let d;
try {
  d = await getJSON(`${FC}?${params}`);
} catch (e) {
  console.error(`erro ao consultar a previsão: ${e.message}`);
  process.exit(1);
}

if (args.json) {
  console.log(JSON.stringify({ local: { ...loc, rotulo: ondeCurto }, ambiguos, ...d }, null, 2));
  process.exit(0);
}

const L = [];
L.push(`📍 ${ondeCurto} (fuso ${d.timezone})`);
if (ambiguos.length) L.push(`⚠️  outros lugares com esse nome: ${ambiguos.join(' · ')}`);

// --- agora ---
const c = d.current;
L.push('');
L.push(`AGORA (${c.time.slice(11, 16)}) — ${emoji(c.weather_code)} ${desc(c.weather_code)}`);
L.push(
  `  ${c.temperature_2m}°C (sensação ${c.apparent_temperature}°C) · umidade ${c.relative_humidity_2m}% · vento ${c.wind_speed_10m} km/h` +
    (c.precipitation > 0 ? ` · chovendo ${c.precipitation} mm` : '')
);

// --- dias ---
const dl = d.daily;
const ate = args.dia ? dl.time.indexOf(args.dia) + 1 || args.dias : args.dias;
L.push('');
L.push('PREVISÃO');
for (let i = 0; i < Math.min(ate, dl.time.length); i++) {
  const t = dl.time[i];
  const rotulo = i === 0 ? 'hoje' : i === 1 ? 'amanhã' : diaSemana(t);
  L.push(
    `  ${ddmm(t)} ${rotulo.padEnd(8)} ${emoji(dl.weather_code[i])} ${desc(dl.weather_code[i]).padEnd(28)}` +
      ` ${String(Math.round(dl.temperature_2m_min[i])).padStart(2)}–${String(Math.round(dl.temperature_2m_max[i])).padStart(2)}°C` +
      ` · chuva ${String(dl.precipitation_probability_max[i] ?? 0).padStart(3)}% (${dl.precipitation_sum[i]} mm)` +
      ` · vento até ${Math.round(dl.wind_speed_10m_max[i])} km/h`
  );
}
const nascer = dl.sunrise[0]?.slice(11, 16);
const por = dl.sunset[0]?.slice(11, 16);
if (nascer) L.push(`  sol hoje: nasce ${nascer} · se põe ${por}`);

// --- horas (so quando pedido: e o que responde "posso sair as 15h?") ---
if (args.horas) {
  const alvos = args.dia ? [args.dia] : dl.time.slice(0, 2);
  const h = d.hourly;
  for (const dia of alvos) {
    L.push('');
    const idx = dl.time.indexOf(dia);
    const rot = idx === 0 ? 'hoje' : idx === 1 ? 'amanhã' : diaSemana(dia);
    L.push(`HORA A HORA — ${ddmm(dia)} ${rot}`);
    for (let i = 0; i < h.time.length; i++) {
      if (!h.time[i].startsWith(dia)) continue;
      const hora = parseInt(h.time[i].slice(11, 13), 10);
      if (hora < 6 || hora > 22 || hora % 2 !== 0) continue; // 06h–22h, de 2 em 2
      L.push(
        `  ${h.time[i].slice(11, 16)}  ${emoji(h.weather_code[i])} ${String(Math.round(h.temperature_2m[i])).padStart(2)}°C` +
          ` · chuva ${String(h.precipitation_probability[i]).padStart(3)}%` +
          ` · vento ${Math.round(h.wind_speed_10m[i])} km/h  ${desc(h.weather_code[i])}`
      );
    }
  }
}

L.push('');
L.push('fonte: Open-Meteo · temperaturas em °C, vento km/h, chuva mm');
console.log(L.join('\n'));
