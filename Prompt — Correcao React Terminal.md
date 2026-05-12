# Prompt: Correção de Lógica React — Terminal USCSS Meridian

## Contexto

O terminal passou por redesign visual. A arquitetura React com prop drilling foi mantida, mas callbacks e handlers foram provavelmente desconectados durante a refatoração. O design visual pode estar correto — não altere CSS nem estrutura JSX visual a menos que seja estritamente necessário para reconectar lógica.

## Stack

- React com Babel (sem bundler complexo)
- WebSocket gerenciado no `<App />` (pdt-app.jsx)
- Estado global via `useState` no `<App />`, distribuído por prop drilling
- Componentes filhos: SysScreen, DocsScreen, TrackerScreen, CommsScreen, e outros

---

## Passo 1 — Auditoria obrigatória (não pule)

Antes de qualquer mudança, leia e mapeie:

### 1.1 Mapeie o App.jsx completamente

Identifique todos os `useState` declarados:
```jsx
// Exemplo do que procurar
const [loggedIn, setLoggedIn] = useState(false);
const [character, setCharacter] = useState(null);
const [shipSystems, setShipSystems] = useState({});
const [docList, setDocList] = useState([]);
const [activeTab, setActiveTab] = useState('tracker');
// ... quais outros existem?
```

Identifique todos os handlers de WebSocket:
```jsx
// Dentro do ws.onmessage, quais tipos de evento são tratados?
// Quais chamam setState?
// Quais estão faltando?
```

Identifique todos os callbacks passados como prop:
```jsx
// Quais funções o App passa para filhos?
<SysScreen onRepairCommand={handleRepair} ... />
// Todos esses callbacks ainda chegam nos filhos?
```

### 1.2 Mapeie cada componente filho

Para cada tela (SysScreen, DocsScreen, TrackerScreen, CommsScreen, etc.):
- Quais props recebe?
- Quais props usa de fato no JSX?
- Quais callbacks recebe e em quais eventos os chama?
- Há props que chegam como `undefined` porque o pai não passa mais?

### 1.3 Identifique a desconexão

O redesign provavelmente criou uma das seguintes situações:

**Situação A — Prop renomeada:**
App passa `onRepairStart` mas o componente filho espera `onRepairCommand`. Resultado: botão clicado não faz nada.

**Situação B — Prop não passada:**
App tem o handler mas esqueceu de passar na JSX do componente:
```jsx
// Antes
<SysScreen systems={shipSystems} onRepair={handleRepair} />
// Depois do redesign (bug)
<SysScreen systems={shipSystems} />  ← onRepair foi esquecido
```

**Situação C — useState não atualizado pelo ws.onmessage:**
O servidor envia `SHIP_SYSTEMS_UPDATE` mas o App não trata esse tipo de mensagem, então `shipSystems` nunca muda.

**Situação D — Componente novo sem conexão:**
O redesign criou novo componente para uma tela mas não conectou ao fluxo de dados do App.

**Situação E — Canvas do tracker fora do ciclo React:**
O `useEffect` que inicializa o canvas e o loop de animação foi removido ou não reconecta ao receber novos dados de blips.

---

## Passo 2 — O fluxo correto de dados

### 2.1 Fluxo de login

```
LoginScreen
  → usuário preenche formulário
  → chama onLogin(usuario, senha) [prop recebida do App]
  → App executa: ws.send(JSON.stringify({ type: 'login', usuario, senha }))
  → servidor responde com LOGIN_OK ou LOGIN_FAIL
  → ws.onmessage no App recebe
  → App chama setLoggedIn(true) e setCharacter(data.character)
  → React re-renderiza, LoginScreen some, PDT principal aparece
```

### 2.2 Fluxo de documentos

```
DocsScreen
  → jogador digita ID e clica BAIXAR
  → chama onDocFetch(docId) [prop recebida do App]
  → App executa: ws.send(JSON.stringify({ type: 'doc_fetch', docId }))
  → App muda estado para mostrar animação de download
  → servidor responde com DOC_DOWNLOAD_OK { doc: {...} } ou DOC_ACCESS_DENIED
  → ws.onmessage no App recebe
  → Se OK: App chama setDocList([...docList, doc])
  → DocsScreen re-renderiza com novo documento na lista
  → Documento abre automaticamente em modo de leitura
```

### 2.3 Fluxo de sistemas e minigames

```
SysScreen
  → recebe systems={shipSystems} [prop do App]
  → renderiza lista de sistemas com status correto
  → jogador clica INICIAR REPARO
  → chama onRepairStart(systemId) [prop do App]
  → App muda estado para mostrar minigame (setActiveMinigame(systemId))
  → Minigame renderiza em Modo A
  → Jogador completa ou falha
  → Minigame chama onRepairComplete(systemId, success) [prop do App]
  → App executa: ws.send({ type: 'minigame_result', systemId, success })
  → servidor responde com SYSTEM_ONLINE { systemId }
  → ws.onmessage: App atualiza setShipSystems({...shipSystems, [systemId]: 'online'})
  → SysScreen re-renderiza com sistema online
```

### 2.4 Fluxo do tracker

```
TrackerScreen
  → recebe blips={trackerBlips} e sensorOnline={...} [props do App]
  → useEffect com dependência em [blips]: atualiza canvas quando blips mudam
  → requestAnimationFrame loop: linha de varredura, fade de blips
  → quando desmonta (troca de aba): cancelAnimationFrame
  
App
  → ws.onmessage recebe TRACKER_UPDATE { blips }
  → setTrackerBlips(data.blips)
  → React re-renderiza TrackerScreen com novos blips
  → useEffect do tracker detecta mudança e atualiza canvas
```

### 2.5 Fluxo de overlays

```
App
  → ws.onmessage recebe ALERT { message, sector }
  → setActiveOverlay({ type: 'alert', message, sector })
  → React renderiza componente de overlay sobre tudo
  → Jogador clica CONFIRMAR
  → overlay chama onDismiss() [prop do App]
  → App: ws.send({ type: 'overlay_dismiss', overlayType: 'alert' })
  → App: setActiveOverlay(null)
```

---

## Passo 3 — Eventos WebSocket que o App deve tratar

Verificar se `ws.onmessage` tem case/handler para CADA um destes:

```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch(data.type) {
    case 'LOGIN_OK':
      setLoggedIn(true);
      setCharacter(data.character);
      break;

    case 'LOGIN_FAIL':
      setLoginError(data.message);
      break;

    case 'TRACKER_UPDATE':
      setTrackerBlips(data.blips);
      setSensorOnline(data.sensorOnline);
      break;

    case 'DOCUMENT_UNLOCKED':
      setDocList(prev => [...prev, data.doc]);
      setOverlayQueue(prev => [...prev, { type: 'doc_notification', doc: data.doc }]);
      triggerVibration([100]);
      break;

    case 'DOC_DOWNLOAD_OK':
      setDocList(prev => [...prev, data.doc]);
      setDownloadState({ status: 'complete', doc: data.doc });
      break;

    case 'DOC_ACCESS_DENIED':
      setDownloadState({ status: 'error', message: data.message });
      break;

    case 'ALERT':
      setActiveOverlay({ type: 'alert', ...data });
      triggerVibration([200, 100, 200]);
      break;

    case 'MOTHER_MESSAGE':
      setActiveOverlay({ type: 'mother', text: data.text, voice: data.voice });
      triggerVibration([100]);
      break;

    case 'SECRET_NOTE':
      setActiveOverlay({ type: 'note', text: data.text });
      break;

    case 'COUNTDOWN_START':
      setCountdown({ active: true, label: data.label, endsAt: Date.now() + data.seconds * 1000 });
      break;

    case 'COUNTDOWN_STOP':
      setCountdown({ active: false });
      break;

    case 'SYSTEM_DETECTED':
      setShipSystems(prev => ({
        ...prev,
        [data.systemId]: { ...prev[data.systemId], detected: true, panelUnlocked: false }
      }));
      triggerVibration([100]);
      break;

    case 'PANEL_UNLOCKED':
      setShipSystems(prev => ({
        ...prev,
        [data.systemId]: { ...prev[data.systemId], panelUnlocked: true }
      }));
      triggerVibration([100]);
      break;

    case 'SYSTEM_ONLINE':
      setShipSystems(prev => ({
        ...prev,
        [data.systemId]: { ...prev[data.systemId], status: 'online' }
      }));
      break;

    case 'TAB_BLOCKED':
      setBlockedTabs(prev => ({ ...prev, [data.tab]: data.blocked }));
      break;

    case 'SILENT_VIBRATE':
      triggerVibration([100]);
      break;

    case 'SECTOR_UPDATE':
      setCurrentSector(data.sector);
      setSectorName(data.sectorName);
      break;

    case 'ANDROID_DATA':
      setAndroidData(data); // temperatura, localizações da equipe
      break;

    case 'COMMS_MESSAGE':
      setCommsHistory(prev => [...prev, data.message]);
      if (activeTab !== 'comms') {
        setCommsUnread(prev => prev + 1);
      }
      break;

    case 'COMMS_FREQUENCY_OK':
      setCommsUnlocked(true);
      break;

    case 'COMMS_FREQUENCY_FAIL':
      setCommsFrequencyError(true);
      break;
  }
};
```

**Se algum desses cases não existir no ws.onmessage atual, adicionar.**

---

## Passo 4 — Props que cada componente deve receber

Verificar se o App passa TODAS essas props para cada componente:

### TrackerScreen
```jsx
<TrackerScreen
  blips={trackerBlips}
  sensorOnline={sensorOnline}
  currentSector={currentSector}
/>
```

### CommsScreen
```jsx
<CommsScreen
  history={commsHistory}
  unread={commsUnread}
  unlocked={commsUnlocked}
  activeChannel={activeCommsChannel}
  isAndroid={character?.isAndroid}
  onSendMessage={(text, channel) => ws.send(...)}
  onFrequencySubmit={(freq) => ws.send(...)}
  onChannelChange={setActiveCommsChannel}
  onRead={() => setCommsUnread(0)}
/>
```

### DocsScreen
```jsx
<DocsScreen
  docList={docList}
  downloadState={downloadState}
  onDocFetch={(docId) => ws.send(...)}
  onDocRead={(docId) => setDownloadState(null)}
/>
```

### SysScreen
```jsx
<SysScreen
  systems={shipSystems}
  currentSector={currentSector}
  character={character}
  activeMinigame={activeMinigame}
  androidData={character?.isAndroid ? androidData : null}
  onRepairStart={(systemId) => setActiveMinigame(systemId)}
  onRepairComplete={(systemId, success) => {
    ws.send(JSON.stringify({ type: 'minigame_result', systemId, success }));
    setActiveMinigame(null);
  }}
/>
```

### Overlay (renderizado condicionalmente pelo App)
```jsx
{activeOverlay && (
  <Overlay
    overlay={activeOverlay}
    onDismiss={() => {
      ws.send(JSON.stringify({ type: 'overlay_dismiss', overlayType: activeOverlay.type }));
      setActiveOverlay(null);
    }}
  />
)}
```

### Countdown banner (renderizado pelo App abaixo do header)
```jsx
{countdown.active && (
  <CountdownBanner
    label={countdown.label}
    endsAt={countdown.endsAt}
    onExpire={() => setCountdown({ active: false })}
  />
)}
```

---

## Passo 5 — Canvas do tracker em React

O tracker é o componente mais propenso a quebrar em redesign. Verificar:

```jsx
function TrackerScreen({ blips, sensorOnline, currentSector }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const blipsRef = useRef(blips); // ref para acesso no loop sem re-render

  // Manter blipsRef atualizado
  useEffect(() => {
    blipsRef.current = blips;
  }, [blips]);

  // Iniciar loop de animação uma vez
  useEffect(() => {
    if (!sensorOnline) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let sweepAngle = 0;

    function render() {
      // Clear com persistência de fósforo
      ctx.fillStyle = 'rgba(0, 10, 4, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Raios concêntricos
      // Linha de varredura + trail
      // Blips de blipsRef.current

      sweepAngle = (sweepAngle + 1) % 360;
      animFrameRef.current = requestAnimationFrame(render);
    }

    render();

    // Cleanup ao desmontar ou quando sensorOnline muda
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [sensorOnline]); // Re-inicia só quando sensor muda de estado

  if (!sensorOnline) {
    return <SensorOfflineState />;
  }

  return (
    <div className="tracker-container">
      <canvas ref={canvasRef} width={280} height={280} />
      {/* texto de última detecção */}
    </div>
  );
}
```

**Problema comum:** canvas desenhado com `document.getElementById` em vez de `useRef`. Em React, o elemento pode não existir ainda quando o código roda. Sempre usar `useRef`.

---

## Passo 6 — Sistema de abas em React

```jsx
function App() {
  const [activeTab, setActiveTab] = useState('tracker');
  const [blockedTabs, setBlockedTabs] = useState({});

  function handleTabChange(tab) {
    if (blockedTabs[tab]) {
      setActiveOverlay({ type: 'tab_blocked', tab });
      return;
    }
    setActiveTab(tab);
    // Limpar badge de não-lido da aba
    if (tab === 'comms') setCommsUnread(0);
  }

  return (
    <div className="pdt-container">
      <Header sector={currentSector} sectorName={sectorName} character={character} />

      {countdown.active && <CountdownBanner ... />}

      <main className="pdt-main">
        {activeTab === 'tracker' && <TrackerScreen ... />}
        {activeTab === 'comms' && <CommsScreen ... />}
        {activeTab === 'docs' && <DocsScreen ... />}
        {activeTab === 'sys' && <SysScreen ... />}
      </main>

      <NavBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        blockedTabs={blockedTabs}
        badges={{ comms: commsUnread }}
      />

      {activeOverlay && <Overlay ... />}
    </div>
  );
}
```

---

## Passo 7 — Modo A e Modo B em React

Modo A (foco) deve ser aplicado via classe no container principal, não via CSS inline:

```jsx
// No App ou no componente específico
const isModeA = activeMinigame !== null
  || downloadState?.status === 'reading'
  || activeOverlay?.type === 'alert'
  || activeOverlay?.type === 'mother';

<div className={`pdt-container ${isModeA ? 'mode-a' : 'mode-b'}`}>
```

CSS trata o resto:
```css
.mode-a .pdt-nav { display: none; }
.mode-a .pdt-header { height: 32px; opacity: 0.5; }
.mode-a .pdt-main { flex: 1; }
```

---

## Passo 8 — Vibração

```javascript
// Função utilitária no App
function triggerVibration(pattern) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}
```

Passar como prop onde necessário, ou chamar diretamente no ws.onmessage do App.

---

## O que NÃO alterar

- CSS e classes visuais que estão corretas
- Estrutura JSX dos componentes que estão renderizando corretamente
- Lógica de minigame que já estava funcionando
- Qualquer funcionalidade que o usuário confirmou como funcionando

---

## Checklist de validação final

**Conectividade:**
- [ ] ws.onmessage tem handler para todos os tipos de evento listados no Passo 3
- [ ] Todos os componentes filhos recebem as props listadas no Passo 4
- [ ] Todos os callbacks das props chegam a algum `ws.send` no App

**Componentes:**
- [ ] TrackerScreen usa `useRef` para o canvas (não `getElementById`)
- [ ] Loop de animação do tracker tem cleanup no return do `useEffect`
- [ ] Modo A aplicado via classe quando minigame ou overlay ativo
- [ ] Abas bloqueadas não navegam, mostram overlay de bloqueio

**Estado:**
- [ ] Login atualiza `loggedIn` e `character` corretamente
- [ ] Documentos desbloqueados aparecem na lista após evento do servidor
- [ ] Sistemas atualizam status após resultado do minigame
- [ ] Countdown conta regressivamente em tempo real

**Referência completa:** consultar `Requisitos Terminal Meridian.md` para comportamento esperado de qualquer funcionalidade.
EOF
