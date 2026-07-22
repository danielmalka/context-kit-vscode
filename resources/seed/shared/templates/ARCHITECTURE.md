# Arquitetura — [Nome do Projeto]

_Ultima atualizacao: [YYYY-MM-DD]_

> Ancora de contexto do projeto (ver `shared/skills/context-engineering.md`).
> O agente le este arquivo no inicio de toda sessao e o atualiza ao final quando
> uma decisao arquitetural, invariante ou convencao nova surgir.

## Visao geral

[1-2 paragrafos sobre o que o sistema faz e sua estrutura principal]

## Bounded Contexts / Modulos principais

| Modulo | Responsabilidade | Pode depender de |
|--------|------------------|------------------|
| [nome] | [o que faz] | [modulos permitidos — mirror as greps in the Makefile arch-check target] |

## Decisoes arquiteturais (ADRs resumidos)

| Decisao | Motivo | Data |
|---------|--------|------|
| [o que foi decidido] | [por que] | [quando] |

## Invariantes do sistema

[regras que nunca devem ser violadas pelo agente — as automatizaveis viram greps escopados no target arch-check do Makefile]

## Convencoes de codigo

[convencoes especificas deste projeto alem do AGENTS.md]

## O que nao fazer

[decisoes descartadas e por que — evita que o agente as proponha de novo]
