// pdt-docs.jsx — Documents screen: ID input + download animation + list + reader

const DOC_SECTORS = ['B1', 'B2', 'C3', 'A2', 'COMMS-LR'];

const groupBySector = (docs) => {
  const map = {};
  docs.forEach(d => {
    if (!map[d.sector]) map[d.sector] = [];
    map[d.sector].push(d);
  });
  return DOC_SECTORS.filter(s => map[s]).map(s => ({ sector: s, docs: map[s] }));
};

// ── Download animation ─────────────────────────────────────────────────────────

const DocDownload = ({ docId, onComplete, onError }) => {
  const [pct,  setPct]  = React.useState(0);
  const [msg,  setMsg]  = React.useState('INICIANDO DOWNLOAD...');

  React.useEffect(() => {
    const msgs = ['LOCALIZANDO ARQUIVO...', `BAIXANDO ${docId}...`, 'DECRIPTANDO...', 'CONCLUÍDO'];
    let p = 0;
    const iv = setInterval(() => {
      const speed = p < 40 ? 12 : p < 70 ? 8 : p < 90 ? 4 : 2;
      p = Math.min(100, p + speed * (0.5 + Math.random()));
      setPct(Math.round(p));
      setMsg(msgs[Math.min(msgs.length-1, Math.floor(p/33))]);
      if (p >= 100) {
        clearInterval(iv);
        setTimeout(() => onComplete(docId), 500);
      }
    }, 160);
    return () => clearInterval(iv);
  }, []);

  const bar = (p) => '█'.repeat(Math.round(p/5)) + '░'.repeat(20-Math.round(p/5));

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px', gap:'16px' }}>
      <div style={vt(24, C.bright, { textShadow: glow(C.bright) })}>BAIXANDO ARQUIVO</div>
      <AsciiRule />
      <div style={vt(20, C.main)}>{docId}</div>
      <div style={{ ...vt(17, C.amber), fontFamily:"'Share Tech Mono', monospace", fontSize:'13px', letterSpacing:'0.02em' }}>
        {bar(pct)}  {pct}%
      </div>
      <div style={mono(10, C.dim)}>{msg}</div>
      <div style={mono(9, C.dim, { opacity:0.5 })}>SEEGSON FILE SYSTEM v4.2</div>
    </div>
  );
};

// ── Document list ──────────────────────────────────────────────────────────────

const DocsList = ({ docs, idInput, setIdInput, onDownload, onSelect }) => {
  const groups = groupBySector(docs);

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ padding:'8px 14px 6px', flexShrink:0 }}>
        <div style={vt(22, C.main)}>DOCUMENTOS COLETADOS</div>
        <div style={mono(11, C.dim, { marginTop:'2px' })}>TOTAL: {docs.length} de ?? encontrados</div>
      </div>
      <HRule />

      {/* ID input — always visible */}
      <div style={{ padding:'8px 14px', borderBottom:`1px solid ${C.ghost}`, flexShrink:0 }}>
        <div style={mono(10, C.dim, { marginBottom:'4px', letterSpacing:'0.06em' })}>INSERIR ID DO ARQUIVO:</div>
        <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
          <span style={vt(20, C.dim)}>▸</span>
          <input
            type="text" value={idInput}
            onChange={e => setIdInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key==='Enter' && idInput.trim() && onDownload(idInput.trim())}
            placeholder="EX: MT-0934"
            style={{ flex:1, background:'transparent', border:'none', borderBottom:`1px solid ${C.dim}`,
              color:C.main, fontFamily:"'VT323', monospace", fontSize:'20px',
              outline:'none', padding:'2px 0', caretColor:C.bright,
              letterSpacing:'0.06em',
            }}
          />
          <PDTButton variant="bright" onClick={() => idInput.trim() && onDownload(idInput.trim())}
            style={{ padding:'6px 12px', fontSize:'16px', whiteSpace:'nowrap' }}>
            BAIXAR
          </PDTButton>
        </div>
      </div>

      {/* Doc list */}
      <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'none' }}>
        {docs.length === 0 ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px', gap:'10px', textAlign:'center' }}>
            <div style={vt(24, C.mid)}>NENHUM DOCUMENTO<br />COLETADO AINDA</div>
            <AsciiRule />
            <div style={mono(12, C.dim, { lineHeight:1.7 })}>
              Explore os setores<br />da nave para encontrar<br />arquivos e registros
            </div>
          </div>
        ) : (
          groups.map(({ sector, docs: sdocs }) => (
            <React.Fragment key={sector}>
              <SectorLabel color={C.dim}>{sector}</SectorLabel>
              {sdocs.map((doc, i) => (
                <div key={doc.id} onClick={() => onSelect(doc)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'10px 14px', borderBottom:`1px solid ${C.ghost}`,
                    cursor:'pointer', minHeight:'56px' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <StatusDot online large />
                      <span style={vt(18, C.main)}>{doc.title}</span>
                    </div>
                    <div style={mono(10, C.dim, { marginTop:'2px', marginLeft:'22px' })}>{doc.date}</div>
                  </div>
                  <span style={{ ...vt(20, C.mid), paddingLeft:'12px', flexShrink:0 }}>[→]</span>
                </div>
              ))}
            </React.Fragment>
          ))
        )}
        <div style={{ height:'8px' }} />
      </div>
    </div>
  );
};

// ── Doc reader (Mode A) ────────────────────────────────────────────────────────

const DocReader = ({ doc, allDocs, onBack }) => {
  const idx   = allDocs.indexOf(doc);
  const total = allDocs.length;
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'6px 14px', flexShrink:0, borderBottom:`1px solid ${C.dim}`, minHeight:'44px' }}>
        <button onClick={onBack} style={{ ...vt(20, C.mid), background:'transparent', border:'none',
          cursor:'pointer', padding:'4px 0', minHeight:'44px' }}>← VOLTAR</button>
        <span style={mono(11, C.dim)}>DOCS — {idx+1}/{total}</span>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'16px 14px 20px', scrollbarWidth:'none' }}>
        <div style={vt(22, C.bright, { textShadow:glow(C.bright), marginBottom:'2px' })}>{doc.title}</div>
        <div style={mono(11, C.dim, { marginBottom:'12px' })}>{doc.author} // {doc.date}</div>
        <AsciiRule />
        <pre style={{ ...vt(20, C.main), whiteSpace:'pre-wrap', wordBreak:'break-word',
          lineHeight:1.65, margin:'12px 0 0' }}>{doc.content}</pre>
      </div>
    </div>
  );
};

// ── Error overlay ──────────────────────────────────────────────────────────────

const DocError = ({ type, level, onBack }) => (
  <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'32px 20px', gap:'12px' }}>
    <div style={{ ...vt(22, C.red), textShadow:glow(C.red) }}>
      {type==='not_found' ? 'ARQUIVO NÃO ENCONTRADO' : 'CREDENCIAL INSUFICIENTE'}
    </div>
    <AsciiRule />
    {type==='no_access' && <div style={vt(18, C.amber)}>NÍVEL {level} REQUERIDO</div>}
    <div style={mono(10, C.dim, { textAlign:'center' })}>
      {type==='not_found' ? 'ID inválido ou arquivo não existe.' : 'Seu nível de acesso é insuficiente.'}
    </div>
    <div style={{ marginTop:'16px' }}>
      <PDTButton variant="normal" onClick={onBack}>[ VOLTAR ]</PDTButton>
    </div>
  </div>
);

// ── DocsScreen orchestrator ────────────────────────────────────────────────────

const DocsScreen = ({ docsState, setDocsState, selectedDoc, setSelectedDoc, unlockedDocs, isAndroid, onDownloadRequest, downloadError }) => {
  const [idInput,    setIdInput]    = React.useState('');
  const [dlState,    setDlState]    = React.useState(null); // null | 'loading' | 'error'
  const [dlDocId,    setDlDocId]    = React.useState('');
  const [errType,    setErrType]    = React.useState(null);
  const [errLevel,   setErrLevel]   = React.useState(null);

  const visibleDocs = unlockedDocs || [];

  // Update effect to detect when the doc is fully loaded by the server
  React.useEffect(() => {
    if (docsState === 'reading' && dlState === 'loading') {
      setDlState(null);
    }
  }, [docsState]);

  React.useEffect(() => {
    if (downloadError && dlState === 'loading') {
      setErrType(downloadError.type);
      setErrLevel(downloadError.level);
      setDlState('error');
    }
  }, [downloadError]);

  const handleDownload = (docId) => {
    setDlDocId(docId);
    setIdInput('');
    setDlState('loading');
  };

  const handleDlComplete = (docId) => {
    // Send the actual request to the server after the animation finishes
    if (onDownloadRequest) onDownloadRequest(docId);
  };

  const handleDlError = (type, level) => {
    setErrType(type);
    setErrLevel(level);
    setDlState('error');
  };

  if (dlState === 'loading') {
    return <DocDownload docId={dlDocId} onComplete={handleDlComplete} onError={handleDlError} />;
  }
  if (dlState === 'error') {
    return <DocError type={errType} level={errLevel} onBack={() => setDlState(null)} />;
  }
  if (docsState === 'reading' && selectedDoc) {
    return <DocReader doc={selectedDoc} allDocs={visibleDocs} onBack={() => setDocsState('list')} />;
  }
  return (
    <DocsList
      docs={visibleDocs}
      idInput={idInput}
      setIdInput={setIdInput}
      onDownload={handleDownload}
      onSelect={doc => { setSelectedDoc(doc); setDocsState('reading'); }}
    />
  );
};

Object.assign(window, { DocsScreen });
