// pdt-exclusive-tab.jsx — Dispatcher for exclusive character tabs

const ExclusiveTabScreen = ({ tabType, level, data, character }) => {
  switch (tabType) {
    case 'biometric':      return window.BiometricTab      ? <window.BiometricTab      level={level} data={data} character={character} /> : null;
    case 'infrastructure': return window.InfrastructureTab ? <window.InfrastructureTab level={level} data={data} character={character} /> : null;
    case 'structural':     return window.StructuralTab     ? <window.StructuralTab     level={level} data={data} character={character} /> : null;
    case 'comms_spectrum': return window.CommsSpectrumTab  ? <window.CommsSpectrumTab  level={level} data={data} character={character} /> : null;
    case 'security':       return window.SecurityTab       ? <window.SecurityTab       level={level} data={data} character={character} /> : null;
    case 'cargo':          return window.CargoTab          ? <window.CargoTab          level={level} data={data} character={character} /> : null;
    case 'analysis':       return window.AnalysisTab       ? <window.AnalysisTab       level={level} data={data} character={character} /> : null;
    default:
      return (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={mono(12, C.dim)}>ABA EXCLUSIVA NÃO CONFIGURADA</span>
        </div>
      );
  }
};

Object.assign(window, { ExclusiveTabScreen });
