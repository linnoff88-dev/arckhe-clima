# clima

<div align="center">
  <img src="capa/logo.svg" alt="Arckhé AI" height="48" />
  <p><strong>Arckhé AI</strong></p>
</div>


Skill de **Claude Code** que consulta clima atual e previsÃ£o do tempo de qualquer cidade do mundo â€” sem API key.

## ðŸ“– Guia de uso

Guia completo (landing + passo a passo): **https://linnoff88-dev.github.io/

A graÃ§a nÃ£o Ã© despejar a tabela do tempo: Ã© responder a pergunta que a pessoa fez de verdade. Quem pergunta *"levo guarda-chuva?"* quer ouvir **leva** ou **nÃ£o precisa**, com o motivo em seguida â€” nÃ£o sete linhas de dados horÃ¡rios.

## O que tem aqui

```
SKILL.md            a skill (frontmatter + instruÃ§Ãµes de resposta)
scripts/clima.mjs   o script que fala com a Open-Meteo
evals/evals.json    casos de teste
```

## InstalaÃ§Ã£o

```bash
git clone https://github.com/linnoff88-dev/clima
cp -r clima ~/.claude/skills/clima
```

Depois Ã© sÃ³ perguntar em linguagem natural: *"vai chover amanhÃ£?"*, *"posso gravar externa de manhÃ£?"*, *"temperatura das capitais agora"*.

## O script, direto

```bash
node ~/.claude/skills/clima/scripts/clima.mjs "Porto Alegre"
node ~/.claude/skills/clima/scripts/clima.mjs "FlorianÃ³polis" --dias 7
node ~/.claude/skills/clima/scripts/clima.mjs "SÃ£o Paulo" --horas
node ~/.claude/skills/clima/scripts/clima.mjs --lote capitais
node ~/.claude/skills/clima/scripts/clima.mjs --lote "Recife,Natal,Salvador"
```

| OpÃ§Ã£o | O que faz |
|---|---|
| *(nada)* | agora + prÃ³ximos 3 dias |
| `--dias N` | previsÃ£o de N dias (1 a 16) |
| `--horas` | hora a hora (06hâ€“22h, de 2 em 2) |
| `--dia AAAA-MM-DD` | foca num dia especÃ­fico |
| `--lote capitais` | as 27 capitais do Brasil, ordenadas por temperatura |
| `--lote "A,B,C"` | compara as cidades listadas |
| `--json` | dados crus |

## Fonte

[Open-Meteo](https://open-meteo.com) â€” pÃºblica, sem chave, cobertura mundial, previsÃ£o de atÃ© 16 dias. NÃ£o cobre clima histÃ³rico de anos passados nem alertas oficiais de defesa civil.

Requer Node 18+ (usa `fetch` nativo). Sem dependÃªncias.

---

<div align="center">
  <img src="capa/logo.svg" alt="Arckhé AI" height="32" />
  <p><strong>Arckhé AI</strong></p>
</div>