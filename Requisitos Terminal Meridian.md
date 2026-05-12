# Requisitos Completos — Terminal USCSS Meridian
## Documento de referência — baseado em decisões tomadas na sessão de design

---

## VISÃO GERAL DO SISTEMA

Terminal interativo para oneshot de RPG do universo Alien (Halloween 2026).
7 jogadores conectam via celular (Wi-Fi local).
Mestre opera painel separado no laptop.
Node.js + Express + WebSocket. HTML/CSS/JS vanilla.

**Dois produtos distintos no mesmo sistema:**
- **PDT** — Personal Data Terminal — interface mobile dos jogadores
- **Painel Mestre** — interface desktop do mestre

---

## PARTE 1 — PDT DOS JOGADORES

### 1.1 Tela de Login

**Fluxo obrigatório em 3 momentos sequenciais:**

**Momento 1 — Credenciais:**
- Campo de usuário e senha
- Botão ACESSAR
- Visual limpo, centralizado, sem elementos extras

**Momento 2 — Verificação animada (2-3 segundos):**
- Barra de progresso
- Mensagens sequenciais: "VERIFICANDO CREDENCIAIS...", "CONSULTANDO REGISTRO W-Y...", "CARREGANDO PERFIL DE CAMPO..."

**Momento 3 — Ficha do personagem:**
- Nome do personagem
- Cargo e nível de acesso
- Linha de registro pessoal (backstory curto — a ser preenchido antes da sessão)
- Skill principal e Stress máximo
- Botão INICIAR MISSÃO

**Regra do android:**
- Flag `isAndroid` existe apenas no servidor, nunca enviada ao cliente
- Tela de login do android é visualmente idêntica à dos outros
- Diferenças do android são implementadas server-side

**7 personagens com credenciais únicas:**
- Engenheiro Chefe (android) — Skills: Tecnologia + Percepção — Stress: 40
- Técnico de Sistemas — Skills: Tecnologia + Furtividade — Stress: 45
- Médico — Skills: Medicina + Percepção — Stress: 40
- Oficial de Segurança — Skills: Combate + Percepção — Stress: 35
- Técnico de Manutenção — Skills: Tecnologia + Combate — Stress: 50
- Operador de Comms — Skills: Percepção + Furtividade — Stress: 45
- Especialista em Carga — Skills: Furtividade + Combate — Stress: 55

---

### 1.2 Layout Base do PDT

```
┌─────────────────────────────┐
│ PDT-[N] ◆ SETOR: [CÓD]     │  ← header 44px — só contexto, sem ações
│ [PERSONAGEM] // [CARGO]     │
├─────────────────────────────┤
│                             │
│      ÁREA PRINCIPAL         │  ← flex:1, protagonista de cada aba
│                             │
├─────────────────────────────┤
│ [◎ TRACKER][⌨ COMMS]       │
│ [▤ DOCS][⚙ SYS]            │  ← nav bottom 56px, sempre visível
└─────────────────────────────┘
```

**Dois modos de interface:**

**MODO A — Foco (cinematográfico):**
Nav bottom desaparece. Header reduz para 32px com 50% de opacidade.
Conteúdo ocupa 85-90% da viewport.
Usado em: leitura de documento, minigame ativo, alerta crítico, M.O.T.H.E.R.

**MODO B — Operacional:**
Nav bottom visível. Header completo.
Usado em: tracker, comms, lista de sistemas, lista de documentos.

**Transição entre modos:** 300ms ease-out. Nunca abrupta.

**Regras absolutas de UI:**
- Todos os elementos tocáveis: mínimo 48x48px
- Botões: opacidade mínima 80%, nunca abaixo disso
- Todo botão tem borda visível e estado hover/active
- Sem scroll horizontal em nenhum estado

---

### 1.3 ABA TRACKER (home — abre por padrão)

**Canvas de radar — comportamento:**
- Círculo com 3 raios concêntricos (decorativos)
- Linha de varredura girando 360° em 2 segundos continuamente
- Trail de fósforo: linha deixa rastro que desbota em 1 segundo
- Pulso radial saindo do centro a cada 2 segundos

**Blips — dois tipos visuais:**
- Mesmo setor: círculo maior, cor intensa, com glow
- Setor adjacente: círculo menor, cor mais fraca, sem glow

**Entidades com blips distintos:**
- Organismo no mesmo setor: `--critical-red` 8px com glow
- Organismo em setor adjacente: `--warning-amber` 5px sem glow
- Humano (saqueador/jogador) mesmo setor: `--seegson-mid` 6px
- Humano adjacente: `--seegson-dim` 4px

**Fade de blip:** desaparece em 1.5s se não houver nova detecção
**Organismo parado = sem blip** (mecânica central do horror)

**Texto abaixo do radar:**
```
ÚLTIMA DETECÇÃO: [X] atrás — [DIREÇÃO]
STATUS: SETOR LIMPO / MOVIMENTO DETECTADO
```

**Quando sensor offline no setor:**
Canvas substituído por mensagem de sistema offline + botão IR PARA REPAROS

**WebSocket — evento recebido:**
```json
{
  "type": "tracker_update",
  "blips": [
    { "entity": "organism", "relation": "same|adjacent", "angle": 0-360, "distance": 0-1, "moving": true },
    { "entity": "human", "id": 1, "relation": "same|adjacent", "angle": 0-360, "distance": 0-1 }
  ]
}
```

---

### 1.4 ABA COMMS

**Formato de mensagens — IRC puro:**
```
[10:23] CHEN: mensagem aqui
[10:24] VOCÊ: minha resposta
[10:25] SISTEMA: notificação do sistema
[10:26] M.O.T.H.E.R: mensagem da IA
```

**Cores por tipo:**
- Outros jogadores: `--seegson-main`
- Próprio jogador: `--seegson-mid` (leve diferenciação)
- SISTEMA: `--warning-amber`
- M.O.T.H.E.R: `--signal-cyan` (voz Seegson) ou `--wy-main` (voz W-Y)

**Canais disponíveis:**
- GERAL — todos os jogadores
- Canal por setor (aparece quando há jogadores no setor)
- Canal W-Y — visível SOMENTE para o android (implementado server-side)

**Sistema de frequência/senha do Comms Local:**
- Após reparo do Comms Local, canal fica bloqueado
- Campo de input aparece: "FREQUÊNCIA: [input] [SINTONIZAR]"
- Frequência correta = valor encontrado no minigame de Comms Local
- Frequência é gerada aleatoriamente a cada sessão pelo servidor
- Jogador que fez o reparo comunicou a frequência para os outros
- Servidor valida a frequência inserida

**Quando comms offline:**
Input desabilitado, mensagem de sistema.

---

### 1.5 ABA DOCS

**Campo de ID (sempre visível no topo):**
```
INSERIR ID DO ARQUIVO: [input] [BAIXAR]
```

**Fluxo de download:**
1. Jogador digita ID e aperta BAIXAR
2. Servidor valida ID e nível de acesso
3. Se válido: animação de download (3-4 segundos, Modo A)
4. Animação: nome do arquivo + barra de progresso não-linear + mensagens de sistema
5. Documento abre automaticamente após download

**Erros possíveis:**
- "ARQUIVO NÃO ENCONTRADO" — ID inválido
- "CREDENCIAL INSUFICIENTE — NÍVEL [N] REQUERIDO" — acesso insuficiente
- Android nunca recebe erro de acesso insuficiente (server-side)

**Lista de documentos coletados:**
- Total: "[N] de ?? encontrados" — total nunca revelado
- Organizados por setor onde foram encontrados
- Ordenados por hora de desbloqueio (mais recente primeiro)
- Cada item: nome do documento, data, botão [→] para abrir

**Leitura de documento (Modo A):**
- Sem nav bottom, sem sidebar
- Header mínimo com botão VOLTAR e contador "[N] de [TOTAL]"
- Texto em fonte 20px, line-height 1.6
- Scroll vertical quando necessário

---

### 1.6 ABA SYS

**Fluxo de desbloqueio de sistemas (3 etapas):**

1. **Entrada no setor → Notificação automática:**
   - PDT vibra: `navigator.vibrate([100])`
   - Overlay aparece informando que sistema foi detectado no setor
   - Sistema aparece no SYS como BLOQUEADO (painel não acessado)

2. **Mestre libera painel → Segunda notificação:**
   - PDT vibra novamente
   - Sistema atualiza para DISPONÍVEL PARA REPARO
   - Botão [INICIAR REPARO] aparece

3. **Jogador inicia reparo → Minigame em Modo A**

**Estados possíveis de cada sistema:**
- `◆ ONLINE` — funcionando, sem ação disponível
- `◇ OFFLINE + ⚿ Painel não acessado` — detectado mas bloqueado
- `◇ OFFLINE + [INICIAR REPARO]` — disponível
- `⚙ EM REPARO` — outro jogador está reparando
- `◆ ONLINE (RECÉM REPARADO)` — feedback pós-conclusão

**Distribuição de sistemas por setor:**
```
C1 — Engenharia:    Reactor, Power Grid
C3 — Doca:          Lifepods, Door Control
A1 — Ponte:         Door Control, Comms Long Range
A2 — Sala Comms:    Comms Long Range, Comms Local
B1 — Medbay:        Life Support
Mezanino B-C:       Lighting (Deck C)
Corredores Deck B:  Lighting (Deck B), Motion Tracker
Corredores Deck A:  Lighting (Deck A)
```

**Briefing pré-minigame:**
- Nome do sistema
- Skill requerida e nível do personagem
- Dificuldade calculada automaticamente
- Descrição de 2 linhas do que o personagem está fazendo fisicamente
- Timer e número de disjuntores/etapas

**Android — info adicional no briefing:**
- Temperatura exata do setor
- Tempo estimado de reparo
- Integridade do sistema em percentual
- Aviso se integridade < 50%

**Tela de resultado — sucesso:**
- Sistema ONLINE confirmado
- Duração do reparo
- Tentativas usadas
- Revelação narrativa se aplicável (Power Grid e Life Support)

**Tela de resultado — falha:**
- Sistema permanece OFFLINE
- Mensagem narrativa: "O barulho pode ter chamado atenção"
- +1 STRESS (aplicado automaticamente pelo servidor)

---

## PARTE 2 — OS 9 MINIGAMES

Todos em Modo A (tela cheia). Header mínimo com: `[SISTEMA] — TIMER: [XX:XX] — TENTATIVAS: [N]/3`

### MINIGAME 1 — POWER GRID
**Narrativa:** reconectando cabos, roteando conexões elétricas dos decks

**Mecânica:** grade de nós elétricos em SVG/Canvas. Arrastar entre nós cria linha de conexão. Validação de carga por cabo em tempo real. Conexão sobrecarregada = vermelha. Todos os decks precisam estar conectados sem sobrecarga.

**Modulação por Tecnologia:**
- Sem skill: 12 nós, 3 fontes, limite de carga não mostrado
- Treinado: 10 nós, limite mostrado como número
- Veterano: 8 nós, limite + sugestão de rota
- Expert: 6 nós, rota pré-sugerida (aceitar ou modificar)

**Revelação narrativa obrigatória no resultado:**
```
⚠ ANOMALIA DETECTADA
SETOR C2 — PORÃO DE CARGA
SUBSTÂNCIA DESCONHECIDA
CONDUTIVIDADE: ORGÂNICA
CLASSIFICAÇÃO: NÃO CATALOGADA
```

---

### MINIGAME 2 — LIFE SUPPORT
**Narrativa:** substituição de fusíveis, ventilação, ajuste de gases, termômetro

**4 fases sequenciais:**

Fase 1 — Fusíveis: 6 slots queimados, bandeja com 10 opções de amperagem. Arrastar fusível correto pro slot. Amperagem necessária indicada no slot. Erro: spark + -1 tentativa global.

Fase 2 — Ventilação: toggles de dutos por setor. Alguns BLOQUEADOS (dano físico). Ativar os funcionais em sequência mostrada.

Fase 3 — Gases: 2 sliders (O2 e CO2). Zona verde estreita. Mexer O2 afeta CO2 levemente (±0.02%). Manter ambos no verde por 4 segundos.

Fase 4 — Termômetro: dial giratório. Temperatura atual e alvo mostradas. Manter na zona verde por 3 segundos. Temperatura oscila levemente.

**Revelação narrativa obrigatória:**
```
⚠ ANOMALIA SETOR C2
BIOMASSA DESCONHECIDA DETECTADA
COMPOSIÇÃO: NÃO CATALOGADA
TEMPERATURA LOCAL: +4.2°C ACIMA DO AMBIENTE
```

---

### MINIGAME 3 — COMMS LOCAL
**Narrativa:** chips queimados, alinhamento de antena, definição de frequência

**3 fases:**

Fase 1 — Chips: 4 slots queimados, 8 chips disponíveis com especificações (frequência MHz, capacidade Mbps). Tap no chip, tap no slot pra encaixar. Especificação do slot deve bater com o chip.

Fase 2 — Alinhamento: círculo com ponteiro. Ponto de sinal visível. Arrastar ponteiro até o ponto, manter por 2 segundos. Ponteiro oscila.

Fase 3 — Frequência: dial analógico horizontal. Interferência visual diminui conforme se aproxima do valor correto. Quando correto: sinal limpo, frequência travada.

**Revelação obrigatória:**
```
FREQUÊNCIA DEFINIDA: [XXX.X] MHz
CANAL: ◆ ATIVO
OUTROS MEMBROS DA EQUIPE
PRECISARÃO DESTA FREQUÊNCIA.
```
A frequência é gerada aleatoriamente pelo servidor e salva. Outros PDTs precisam inserir esse valor no Comms para desbloquear o canal.

---

### MINIGAME 4 — MOTION TRACKER
**Narrativa:** religar sensores, reiniciar software

**2 fases:**

Fase 1 — Sensores: 3 toggles grandes (UMIDADE, ULTRASSÔNICO, INFRAVERMELHO). Cada toggle tem barra de calibração de 2 segundos ao ativar.

Fase 2 — Boot: terminal de texto animado linha por linha com timing real. Sem interação — só observar o boot completar.

Sem revelação narrativa adicional.

---

### MINIGAME 5 — LIGHTING
**Narrativa:** reconexão de cabos, roteamento, fusíveis, voltagem — por deck

**3 rodadas (Deck A, B, C). Deck C mais danificado.**

Por rodada:
- Etapa 1: pares de terminais, arrastar linha do A ao B correto. Timer de 8s por par.
- Etapa 2: grade 3x3, tap nos nós do caminho correto em sequência.
- Etapa 3: selecionar amperagem correta entre 5 opções.
- Etapa 4: slider de voltagem, acertar zona verde.

Sem revelação narrativa. Mestre recebe notificação de qual deck foi restaurado (para controlar iluminação no Unreal).

---

### MINIGAME 6 — DOOR CONTROL
**Narrativa:** override de segurança, autenticação admin, diagnóstico de portas

**4 fases com estética hacker:**

Fase 1 — Usuário admin: tela com caracteres em cascata. Nome "SYSADMIN" aparece brevemente (800ms) a cada 3 segundos. Tocar nele quando aparecer. 3 aparições, precisa acertar 1.

Fase 2 — Senha: teclado de caracteres ASCII. Senha está nos documentos da nave. Sem documento: 3 tentativas com feedback parcial (caracteres corretos destacados após erro).

Fase 3 — Override: 4 comandos aparecem brevemente e somem. Botões grandes para confirmar na ordem. É confirmação (comandos visíveis durante execução), não memorização.

Fase 4 — Diagnóstico: lista de portas por setor com status (DESBLOQUEADA / BLOQUEADA / DANIFICADA). Informação narrativa.

---

### MINIGAME 7 — REACTOR STABILIZATION
**Narrativa:** sequência de comandos + alinhamento de núcleo**

**2 fases distintas — mais longo e complexo:**

Fase 1 — Sequência (Genius):
- 5 botões: INJECT, VENT, COOL, CYCLE, FLUSH
- Reator exibe sequência piscando, depois apaga
- Jogador repete na ordem
- Começa com 4 comandos, adiciona 1 por rodada correta (máx 7)
- Erro: recomeça do zero, -1 tentativa

Modulação:
- Sem skill: 4→7 comandos, sequência some completamente
- Veterano: 4→6 comandos, último visível
- Expert: 4→5 comandos, dois últimos visíveis

Fase 2 — Alinhamento de núcleo:
- 4 gauges circulares em grade 2x2
- 4 sliders correspondentes
- Mexer um afeta outros levemente (±5%)
- Manter TODOS no verde simultaneamente por 5 segundos
- Requer dois polegares simultâneos — é intencional

**Revelação:**
```
REATOR: ◆ ESTÁVEL — 87%
ESTIMATIVA: 72h DE OPERAÇÃO
```

---

### MINIGAME 8 — COMMS LONG RANGE
**Narrativa:** localizar setor no espaço, calibrar frequência, maximizar sinal

**3 fases:**

Fase 1 — Mapa estelar: campo de estrelas pan-and-zoom. Coordenadas do receptor nos documentos de Singh. Mover o mapa, tocar no setor correto para confirmar. Sem documento: grade de coordenadas manual (3 tentativas).

Fase 2 — Calibração: 2 dials simultâneos (FREQUÊNCIA e COMPRIMENTO DE ONDA). Interferência visual diminui quando ambos corretos ao mesmo tempo. Mexer um afeta levemente o outro.

Fase 3 — Sinal: barra com flutuação ±10%. Slider de ângulo de antena. Manter acima de 80% por 4 segundos.

**Revelação obrigatória:**
Quando concluído, DOC-WY06 aparece automaticamente no PDT do jogador que fez o reparo (a transmissão W-Y não-lida "A Weyland-Yutani está vindo").

---

### MINIGAME 9 — LIFEPODS / DOCA
**Narrativa:** autorização, abastecimento, coordenadas de destino

**3 fases:**

Fase 1 — Código: teclado numérico. Código de 6 dígitos nas anotações de Kowalski. 3 tentativas.

Fase 2 — Abastecimento: 3 sliders de pods independentes. Zona verde 80-95%. Abastecer um drena outros levemente (-3%). Equilibrar os 3.

Fase 3 — Coordenadas: teclado numérico. Coordenadas nos documentos de Singh. Coordenadas erradas = destino errado (revelado no resultado).

**Revelação:**
```
DOCA: ◆ AUTORIZADA
NAVE AUXILIAR — BAIA 3
CAPACIDADE: 8 TRIPULANTES
STATUS: PRONTA PARA PARTIDA
```

---

## PARTE 3 — OVERLAYS DO PDT

Todos aparecem sobre qualquer aba ativa. Z-index máximo. Fade in 200ms.

### Notificação de sistema detectado
- Vibração: `[100]`
- Auto-dismiss após 5 segundos se não interagido
- Botões: VER NO SYS e DISPENSAR

### Alerta crítico (mestre dispara)
- Vibração: `[200, 100, 200]`
- Não auto-dismiss — requer toque em CONFIRMAR
- Background pulsa entre `#0a0000` e `#1a0000` a 800ms
- Texto do alerta em `--critical-red` 24px

### Mensagem M.O.T.H.E.R (mestre dispara)
- Vibração: `[100]`
- Texto aparece caractere por caractere (30ms por caractere)
- Voz Seegson: `--signal-cyan`
- Voz W-Y: `--wy-main`
- Botão: LI E ENTENDI

### Nota secreta (mestre dispara)
- Sem vibração dramática — aparece silenciosamente
- Sem indicação de origem
- Botão: ENTENDIDO

### Countdown (mestre inicia)
- Banner fixo abaixo do header, 32px
- Não bloqueia conteúdo das abas
- `--critical-red` pulsando
- Atualiza a cada segundo via WebSocket

### Aba bloqueada (mestre bloqueia)
- Toque na aba mostra: "ACESSO SUSPENSO — M.O.T.H.E.R"
- Não substitui conteúdo atual — só bloqueia navegação

---

## PARTE 4 — FUNCIONALIDADES DO ANDROID

Todas server-side. Cliente android não sabe que é especial.

### Acesso nível 3 automático
Sem erro de credencial insuficiente em nenhum documento.

### Diagnóstico avançado no briefing pré-minigame
Campo extra visível apenas para o android:
```
DIAGNÓSTICO ANDROID:
TEMPERATURA DO SETOR: [X.X]°C
TEMPO ESTIMADO: [X-X] minutos
INTEGRIDADE DO SISTEMA: [X]%
[⚠ RISCO DE FALHA EM X-Xh] ← se integridade < 50%
```

### Localização da equipe
Seção extra na aba SYS (não uma aba separada):
```
LOCALIZAÇÃO DA EQUIPE:
──────────────────────
CHEN: B1 — 10:23
RODRIGUEZ: C2 — 10:19
...
```

### Canal W-Y no Comms
Quinto canal visível apenas no PDT do android.
Chat direto com o mestre.
Nunca aparece para outros jogadores.

---

## PARTE 5 — SISTEMA DE TRACKER (servidor)

### Estado do organismo

```javascript
{
  currentSector: 'C2',        // começa em C2
  isMoving: false,
  mode: 'patrol',             // 'patrol' | 'hunt'
  territory: ['C1','C2','C3','MBC'],  // patrulha só aqui
  huntTarget: null,           // playerId quando em hunt
  lastMoveTime: Date.now()
}
```

### Patrulha automática

- Executa a cada 5 segundos
- 60% de chance de mover quando espera suficiente
- Tempo parado: 30-90 segundos (aleatório)
- Move para setor adjacente dentro do território
- Ao mover: `isMoving = true`, broadcast tracker
- Para após 2-4 segundos: `isMoving = false`, broadcast (blip some)

### Modo Hunt

- Ativado por botão no painel mestre (um por jogador)
- Organismo move em direção ao setor do jogador alvo
- Percorre setores adjacentes um a um com 15-30s entre movimentos
- Ao chegar no setor do jogador: para por 2-3 minutos
- Retorna automaticamente ao modo patrol após esse tempo

### Saqueadores automáticos

- 5 saqueadores, todos começam em C3 quando chegam na nave
- Movimento: a cada 45-75 segundos, move para setor adjacente aleatório
- `isMoving = true` sempre quando vivos (aparecem como blip constante)
- Mestre pode marcar saqueador como morto (some do tracker)
- Raio de detecção: mesmo setor + adjacente (igual ao organismo)

### Cálculo de blips para cada PDT

Por jogador, servidor calcula:
- Relação do organismo com o setor do jogador: `same | adjacent | none`
- Relação de cada saqueador com o setor do jogador
- Apenas `same` e `adjacent` geram blips
- Blips enviados com ângulo e distância calculados

### Sistema de temperatura

- Temperatura base por setor: 7°C (Deck C), 9°C (Deck B), 11°C (Deck A)
- Organismo no setor: +4°C no setor atual, +1.5°C nos adjacentes
- Atualiza automaticamente toda vez que organismo muda de setor
- Enviada ao android via campo adicional nos eventos WebSocket
- Outros jogadores não recebem essa informação

---

## PARTE 6 — PAINEL MESTRE

### Layout geral

6 abas no topo. Mestre opera no laptop — densidade permitida.

### ABA JOGADORES

Tabela com todos os 7 jogadores:
- Nome, setor atual, stress atual/máximo
- Botões: [+1 STRESS] [+2 STRESS] [VER PDT]
- Stress atualiza em tempo real

### ABA TRACKER

**Coluna esquerda — controle do organismo:**
- Mapa simplificado da nave com setores clicáveis
- Marcador do organismo no setor atual
- Clicar em setor: mover organismo manualmente
- Configurar território: toggle por setor
- Modo atual: PATRULHA AUTO / HUNT

**Coluna direita — ações:**
- Status: setor atual, se está movendo, temperatura do setor
- Botões de encontro: um botão por jogador → ativa modo Hunt
- Lista de saqueadores com setor atual e botão [MORTO]

### ABA DOCS

**Catálogo completo de documentos:**
- Organizados por setor
- Cada documento: ID, título, nível de acesso
- Por documento: botão por jogador para liberar individualmente
- Botão [+N] expande para mostrar todos os jogadores

**Eventos em lote (liberação automática de conjuntos):**
- [ LOCKDOWN ATIVA ]
- [ CONTÊINER W-Y DESCOBERTO → TODOS ]
- [ OSEI ENCONTRADO ]
- [ SAQUEADORES CHEGAM ]
- [ ORGANISMO CONFIRMADO ]
- (conjunto de documentos de cada evento configurado no servidor)

### ABA MSG

**M.O.T.H.E.R Direta:**
- Dropdown: jogador específico ou TODOS
- Dropdown: voz SEEGSON ou W-Y
- Textarea + botão ENVIAR
- Aparece como overlay no PDT do destinatário

**Nota Secreta:**
- Dropdown: jogador específico
- Textarea + botão ENVIAR
- Aparece silenciosamente no PDT, sem indicação de origem

**Canal W-Y:**
- Chat direto com o android
- Histórico visível só aqui e no PDT do android

### ABA ALERTAS

**Alerta rápido:**
- Dropdown de setor (ou TODOS)
- Dropdown de tipo (PROXIMIDADE / SISTEMA / NARRATIVO)
- Campo de mensagem
- Botões: DISPARAR PARA O SETOR / DISPARAR GLOBAL

**Countdown:**
- Campo de texto (ex: "AUTODESTRUIÇÃO")
- Duração em MM:SS
- Dropdown: TODOS ou jogador específico
- Botão: INICIAR / PARAR

**Ferramentas de PDT:**
- Vibração silenciosa: dropdown de jogador + ENVIAR
- Bloquear aba: dropdown de jogador + dropdown de aba + BLOQUEAR
- Revelar posição: de qual jogador + para qual jogador + REVELAR
- Corromper documento: ID do documento + novo texto + CORROMPER

### ABA SISTEMAS

**Liberar painéis:**
- Tabela: setor + sistema + botão por jogador
- ◇ = não liberado → ◆ = liberado (toque único)
- Ao liberar: PDT do jogador vibra automaticamente

---

## PARTE 7 — DOCUMENTOS DO SISTEMA

### Estrutura de um documento

```javascript
{
  id: 'MT-0934',           // ID digitável no campo de busca
  titulo: 'Log de Manutenção — MT-0934',
  autor: 'Kowalski, M.',
  data: '17.07.2137',
  setor: 'C1',             // onde foi encontrado fisicamente
  nivel: 1,                // nível de acesso (1, 2 ou 3)
  corpo: '...',            // texto completo do documento
  revelacao: null          // texto extra exibido após leitura (opcional)
}
```

### Regras de acesso

- Nível 1: qualquer jogador com credencial W-Y
- Nível 2: requer cartão de tripulante Seegson (encontrável na nave)
- Nível 3: requer credencial especial — ou android (acesso automático)

### Desbloqueio

- Mestre libera por jogador individualmente (um toque)
- Ou por evento em lote
- Ou jogador digita o ID manualmente (se tiver o ID)
- Documento só aparece na lista depois de desbloqueado

---

## PARTE 8 — EVENTOS WEBSOCKET

### Servidor → PDT

```javascript
// Atualização do tracker
{ type: 'tracker_update', blips: [...], sensorOnline: bool }

// Novo documento desbloqueado
{ type: 'document_unlocked', docId: 'MT-0934', titulo: '...' }

// Alerta crítico
{ type: 'alert', message: '...', sector: 'B1'|null }

// Mensagem M.O.T.H.E.R
{ type: 'mother_message', text: '...', voice: 'seegson'|'wy' }

// Nota secreta
{ type: 'secret_note', text: '...' }

// Countdown
{ type: 'countdown_start', label: '...', seconds: 900 }
{ type: 'countdown_stop' }

// Notificação de sistema detectado no setor
{ type: 'system_detected', systemId: 'life_support', sectorId: 'B1' }

// Painel liberado
{ type: 'panel_unlocked', systemId: 'life_support' }

// Aba bloqueada/desbloqueada
{ type: 'tab_blocked', tab: 'docs', blocked: true }

// Vibração silenciosa
{ type: 'silent_vibrate' }

// Atualização de setor do jogador
{ type: 'sector_update', sector: 'B1', sectorName: 'Medbay' }

// Dados exclusivos android
{ type: 'android_data', temperatures: {...}, teamLocations: [...] }
```

### PDT → Servidor

```javascript
// Login
{ type: 'login', usuario: '...', senha: '...' }

// Busca de documento por ID
{ type: 'doc_fetch', docId: '...' }

// Mensagem de comms
{ type: 'comms_message', canal: 'geral'|'B1'|'wy', text: '...' }

// Sintonizar frequência do comms
{ type: 'comms_frequency', value: '847.3' }

// Resultado de minigame
{ type: 'minigame_result', systemId: '...', success: bool, attempts: 1 }

// Confirmar overlay (alerta, M.O.T.H.E.R, etc.)
{ type: 'overlay_dismiss', overlayType: '...' }
```

### Mestre → Servidor

```javascript
// Mover organismo manualmente
{ type: 'master_organism_move', sector: 'C2' }

// Iniciar modo hunt
{ type: 'master_hunt', targetPlayerId: 1 }

// Atualizar território
{ type: 'master_territory', sectors: ['C1','C2','C3','MBC'] }

// Matar saqueador
{ type: 'master_scavenger_kill', scavengerId: 1 }

// Liberar documento
{ type: 'master_doc_unlock', docId: '...', playerId: 1 }

// Liberar painel de sistema
{ type: 'master_panel_unlock', systemId: '...', playerId: 1 }

// Disparar alerta
{ type: 'master_alert', message: '...', sector: 'B1'|null }

// Enviar mensagem M.O.T.H.E.R
{ type: 'master_mother', text: '...', voice: 'seegson'|'wy', targetId: 1|'all' }

// Nota secreta
{ type: 'master_note', text: '...', targetId: 1 }

// Iniciar countdown
{ type: 'master_countdown', label: '...', seconds: 900, targetId: 1|'all' }

// Ferramentas de PDT
{ type: 'master_vibrate', targetId: 1 }
{ type: 'master_block_tab', targetId: 1, tab: 'docs', blocked: true }
{ type: 'master_reveal_location', fromId: 1, toId: 2 }
{ type: 'master_corrupt_doc', docId: '...', newText: '...' }

// Stress manual
{ type: 'master_stress', targetId: 1, amount: 1 }
```

---

## PARTE 9 — REGRAS DE PERFORMANCE

- 60fps em celular médio com radar animado e todos os efeitos ativos
- Sem memory leaks nos loops de animação (cancelar requestAnimationFrame ao trocar de aba)
- WebSocket reconecta automaticamente se cair (retry com backoff)
- Estado do PDT persiste se jogador fechar e reabrir (sessionStorage ou servidor mantém estado)
- Canvas do tracker: clear com alpha 0.15 por frame (efeito fósforo), não clear total
- Sem WebGL no mobile — efeitos CRT via CSS puro
EOF
