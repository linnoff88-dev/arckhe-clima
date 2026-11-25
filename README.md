ï»¿# clima

<div align="center">
  <img src="capa/logo.svg" alt="Arckhé AI" height="48" />
  <p><strong>Arckhé AI</strong></p>
</div>


Skill de **Claude Code** que consulta clima atual e previsêÂ£o do tempo de qualquer cidade do mundo ê¢â¬â sem API key.

## ê°Å¸ââ Guia de uso

Guia completo (landing + passo a passo): **https://linnoff88-dev.github.io/

A graêÂ§a nêÂ£o êÂ© despejar a tabela do tempo: êÂ© responder a pergunta que a pessoa fez de verdade. Quem pergunta *"levo guarda-chuva?"* quer ouvir **leva** ou **nêÂ£o precisa**, com o motivo em seguida ê¢â¬â nêÂ£o sete linhas de dados horêÂ¡rios.

## O que tem aqui

```
SKILL.md            a skill (frontmatter + instruêÂ§êÂµes de resposta)
scripts/clima.mjs   o script que fala com a Open-Meteo
evals/evals.json    casos de teste
```

## InstalaêÂ§êÂ£o

```bash
git clone https://github.com/linnoff88-dev/clima
cp -r clima ~/.claude/skills/clima
```

Depois êÂ© sêÂ³ perguntar em linguagem natural: *"vai chover amanhêÂ£?"*, *"posso gravar externa de manhêÂ£?"*, *"temperatura das capitais agora"*.

## O script, direto

```bash
node ~/.claude/skills/clima/scripts/clima.mjs "Porto Alegre"
node ~/.claude/skills/clima/scripts/clima.mjs "FlorianêÂ³polis" --dias 7
node ~/.claude/skills/clima/scripts/clima.mjs "SêÂ£o Paulo" --horas
node ~/.claude/skills/clima/scripts/clima.mjs --lote capitais
node ~/.claude/skills/clima/scripts/clima.mjs --lote "Recife,Natal,Salvador"
```

| OpêÂ§êÂ£o | O que faz |
|---|---|
| *(nada)* | agora + prêÂ³ximos 3 dias |
| `--dias N` | previsêÂ£o de N dias (1 a 16) |
| `--horas` | hora a hora (06hê¢â¬â22h, de 2 em 2) |
| `--dia AAAA-MM-DD` | foca num dia especêÂ­fico |
| `--lote capitais` | as 27 capitais do Brasil, ordenadas por temperatura |
| `--lote "A,B,C"` | compara as cidades listadas |
| `--json` | dados crus |

## Fonte

[Open-Meteo](https://open-meteo.com) ê¢â¬â pêÂºblica, sem chave, cobertura mundial, previsêÂ£o de atêÂ© 16 dias. NêÂ£o cobre clima histêÂ³rico de anos passados nem alertas oficiais de defesa civil.

Requer Node 18+ (usa `fetch` nativo). Sem dependêÂªncias.

---

<div align="center">
  <img src="capa/logo.svg" alt="Arckhé AI" height="32" />
  <p><strong>Arckhé AI</strong></p>
</div>