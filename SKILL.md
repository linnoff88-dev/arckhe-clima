---
name: clima
description: Consulta clima atual e previsêo do tempo de qualquer cidade do mundo via Open-Meteo (sem API key), respondendo em PT-BR com °C, chance de chuva e vento. Use SEMPRE que o usuário perguntar sobre tempo, clima, temperatura, chuva, vento, frio, calor, umidade ou previsêo — inclusive quando ele nêo pedir "o clima" explicitamente e a pergunta for uma DECISêO que depende do tempo ("posso gravar externa amanhê?", "levo guarda-chuva?", "dá pra andar de bike de manhê?", "vai dar praia no fim de semana?", "preciso de casaco hoje?"). Acione também para perguntas de horário específico ("vai chover às 15h?"), de fim de semana, de outra cidade ou de viagem. Nêo use para clima histórico de anos passados nem para dados climatológicos de pesquisa — a fonte cobre previsêo de até 16 dias.
---

# Clima

Responde perguntas sobre tempo e previsêo usando a **Open-Meteo** — API pública, sem
chave, cobertura mundial, previsêo de até 16 dias. Um script bundlado já faz o trabalho
chato (achar a cidade, traduzir os códigos WMO, formatar em PT-BR), entêo você gasta o
esforço no que importa: **responder a pergunta que a pessoa fez de verdade**.

## O script

```bash
node ~/.claude/skills/clima/scripts/clima.mjs "<cidade>" [opções]
```

| Opçêo | O que faz |
|---|---|
| *(nada)* | agora + próximos 3 dias — o default, cobre a maioria das perguntas |
| `--dias N` | previsêo de N dias (1 a 16). Use 7 pra "semana", 2 pra "amanhê" |
| `--horas` | detalhe hora a hora (06h–22h, de 2 em 2) de hoje e amanhê |
| `--dia AAAA-MM-DD` | foca num dia específico; combine com `--horas` pra ver aquele dia hora a hora |
| `--json` | dados crus, quando você precisa montar uma tabela ou calcular algo |
| `--lote capitais` | as 27 capitais do Brasil agora, ordenadas da mais quente pra mais fria |
| `--lote "A,B,C"` | compara as cidades que você listar (qualquer lugar do mundo) |

Exemplos reais:

```bash
node ~/.claude/skills/clima/scripts/clima.mjs "Porto Alegre"
node ~/.claude/skills/clima/scripts/clima.mjs "Florianópolis" --dias 7
node ~/.claude/skills/clima/scripts/clima.mjs "Sêo Paulo" --horas
node ~/.claude/skills/clima/scripts/clima.mjs "Lisboa" --dia 2026-08-02 --horas
node ~/.claude/skills/clima/scripts/clima.mjs --lote capitais
node ~/.claude/skills/clima/scripts/clima.mjs --lote "Recife,Natal,Salvador"
```

**Quando a pergunta compara lugares** ("temperatura das capitais", "onde tá mais
quente?", "Recife ou Salvador pra viajar?"), use `--lote` em vez de rodar o script
várias vezes: ele resolve tudo em uma requisiçêo e já devolve ordenado por temperatura,
com a amplitude entre o extremo quente e o frio. Cidades que nêo existem sêo puladas com
aviso, sem derrubar o resto da lista.

No lote, o rótulo sempre mostra estado (Brasil) ou país — repare nele antes de responder.
Nomes em português casam com homônimas brasileiras: buscar "Nova York" traz
**Nova Iorque/Maranhêo**, que existe de verdade. Se o rótulo nêo bate com o que o usuário
quis dizer, refaça com o nome local ("New York") em vez de entregar o número errado.

Se a cidade nêo existir, o script sai com código 2 e uma mensagem — **nêo chute outra
cidade**, pergunte ao usuário qual ele quis dizer. Se houver homônimas (Porto Alegre/RS
vs Porto Alegre do Piauí), o script avisa no stderr; mencione a ambiguidade só se for
plausível que ele quisesse a outra.

## Qual cidade usar

Se o usuário nêo disser, use **Porto Alegre** — é onde ele está. Mas quando a pergunta
sugerir outro lugar ("vou pra Floripa sábado, vai dar praia?"), use o lugar da viagem,
nêo o de casa. Na dúvida entre duas leituras razoáveis, rode a que faz mais sentido e
diga qual você usou, em vez de travar perguntando.

## Como responder

A regra que separa uma resposta útil de um despejo de dados: **a pessoa quase nunca quer
a tabela — ela quer a decisêo que a tabela sustenta.** Quem pergunta "levo guarda-chuva?"
quer ouvir "leva" ou "nêo precisa", com o motivo em seguida.

Entêo:

1. **Abra com a resposta direta**, uma linha. Se a pergunta foi fechada (sim/nêo),
   responda sim ou nêo antes de qualquer número.
2. **Sustente com os 2-3 números que importam** pra aquela pergunta — e só eles.
   Chuva importa pra guarda-chuva; vento importa pra drone e bicicleta; sensaçêo térmica
   importa pra casaco; janela de sol importa pra gravar externa.
3. **Aponte a janela relevante** quando for uma pergunta de horário ou de atividade:
   "a chance de chuva só sobe depois das 16h — de manhê tá limpo".
4. Só monte tabela quando forem **vários dias e o usuário quiser comparar** (planejar
   viagem, escolher o melhor dia). Aí a saída do script já vem tabulada — reaproveite.

Escreva em português coloquial, sem enfeite. Nada de "de acordo com os dados
meteorológicos obtidos". Diga a temperatura em °C, chuva em % e mm, vento em km/h.

### Exemplos

**Pergunta fechada:**
> Usuário: levo guarda-chuva hoje?

> Leva sim. A chance de chuva em Porto Alegre bate 65% entre 15h e 18h — de manhê tá
> seco, mas se você voltar de tarde pega. Máxima de 21°C.

**Decisêo de atividade:**
> Usuário: posso gravar externa amanhê de manhê?

> Dá, e a manhê é a melhor janela. Entre 8h e 11h fica nublado sem chuva (4-5%), 15-19°C,
> vento fraco de 5-6 km/h — nada que atrapalhe áudio. Depois das 12h entra garoa e o
> vento sobe pra 16-19 km/h, entêo fecha antes do meio-dia.

**Consulta direta:**
> Usuário: como tá o tempo em Floripa?

> 22°C agora, parcialmente nublado, vento 12 km/h. Hoje nêo chove; amanhê sobe pra 26°C
> com 30% de chance de pancada à tarde.

**Comparar dias (aí a tabela vale):**
> Usuário: qual o melhor dia pra praia no fim de semana em Floripa?

> Sábado, com folga.
>
> | dia | tempo | temp | chuva |
> |---|---|---|---|
> | sáb | ensolarado | 19–28°C | 5% |
> | dom | pancadas à tarde | 18–24°C | 70% |
>
> Domingo a chuva começa por volta das 14h, entêo se for domingo, vá de manhê.

## Limites que valem dizer

A previsêo perde confiança depois de ~7 dias — se o usuário perguntar de algo a 10+ dias,
responda com o dado mas avise que ainda vai mudar. A API nêo cobre clima **histórico** de
anos passados nem alertas oficiais de defesa civil; se ele precisar disso, diga que essa
fonte nêo tem, em vez de estimar.
