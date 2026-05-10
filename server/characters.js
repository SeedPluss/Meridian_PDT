// server/characters.js

const characters = {
  "eng_chefe": {
    usuario: "mkb", // Will be used for login
    senha: "01",
    nome: "Engenheiro Chefe",
    cargo: "Engenheiro Chefe",
    nivel: 2,
    skills: ["Tecnologia", "Percepção"],
    stress_max: 40,
    registro: "[A SER PREENCHIDO - Placeholder para registro pessoal]",
    isAndroid: true,
    pdtId: 1
  },
  "tec_sistemas": {
    usuario: "tec",
    senha: "02",
    nome: "Técnico de Sistemas",
    cargo: "Técnico de Sistemas",
    nivel: 1,
    skills: ["Tecnologia", "Furtividade"],
    stress_max: 45,
    registro: "[A SER PREENCHIDO - Placeholder para registro pessoal]",
    isAndroid: false,
    pdtId: 2
  },
  "medico": {
    usuario: "med",
    senha: "03",
    nome: "Médico",
    cargo: "Médico",
    nivel: 1,
    skills: ["Medicina", "Percepção"],
    stress_max: 40,
    registro: "[A SER PREENCHIDO - Placeholder para registro pessoal]",
    isAndroid: false,
    pdtId: 3
  },
  "oficial_seguranca": {
    usuario: "seg",
    senha: "04",
    nome: "Oficial de Segurança",
    cargo: "Oficial de Segurança",
    nivel: 1,
    skills: ["Combate", "Percepção"],
    stress_max: 35,
    registro: "[A SER PREENCHIDO - Placeholder para registro pessoal]",
    isAndroid: false,
    pdtId: 4
  },
  "tec_manutencao": {
    usuario: "man",
    senha: "05",
    nome: "Técnico de Manutenção",
    cargo: "Técnico de Manutenção",
    nivel: 1,
    skills: ["Tecnologia", "Combate"],
    stress_max: 50,
    registro: "[A SER PREENCHIDO - Placeholder para registro pessoal]",
    isAndroid: false,
    pdtId: 5
  },
  "op_comms": {
    usuario: "com",
    senha: "06",
    nome: "Operador de Comms",
    cargo: "Operador de Comms",
    nivel: 1,
    skills: ["Percepção", "Furtividade"],
    stress_max: 45,
    registro: "[A SER PREENCHIDO - Placeholder para registro pessoal]",
    isAndroid: false,
    pdtId: 6
  },
  "esp_carga": {
    usuario: "car",
    senha: "07",
    nome: "Especialista em Carga",
    cargo: "Especialista em Carga",
    nivel: 1,
    skills: ["Furtividade", "Combate"],
    stress_max: 55,
    registro: "[A SER PREENCHIDO - Placeholder para registro pessoal]",
    isAndroid: false,
    pdtId: 7
  }
};

function getCharacter(username, password) {
  for (const key in characters) {
    if (characters[key].usuario === username && characters[key].senha === password) {
      return { id: key, ...characters[key] };
    }
  }
  return null;
}

function getCharacterById(id) {
  if (characters[id]) {
    return { id, ...characters[id] };
  }
  return null;
}

module.exports = {
  CHARACTERS: characters,
  getCharacter,
  getCharacterById
};
