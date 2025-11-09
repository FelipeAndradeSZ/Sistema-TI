import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Package,
  Wrench,
  CheckSquare,
  FileText,
  Users,
  Search,
  Plus,
  Download,
  Calendar as CalendarIcon,
  Bell,
  TrendingUp,
  Edit,
  Trash2,
  Eye,
  LogOut,
  Menu,
  X,
  BarChart3,
  Sun,
  Moon,
  Settings,
  QrCode,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

// ==== Serviços (Supabase) ====
import {
  autenticarUsuario,
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
} from "./services/usuarios";


import {
  listarEstoque,
  listarHistoricoEstoque,
} from "./services/estoque";

import {
  listarEquipamentos,
  criarEquipamento,
  atualizarEquipamento,
  deletarEquipamento,
} from "./services/equipamentos";


import {
  listarPreventivas,
  criarPreventiva,
  atualizarPreventiva,
  deletarPreventiva,
} from "./services/preventivas";

import {
  listarChamados,
  criarChamado,
  atualizarChamado,
  deletarChamado,
} from "./services/chamados";



// ==== Armazenamento Persistente ====

const storage = {
  get: (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
};



// ==== App Principal ====

const App = () => {
  const [usuario, setUsuario] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState("dashboard");
  const [estoque, setEstoque] = useState([]);
  const [chamados, setChamados] = useState([]);
  const [preventivas, setPreventivas] = useState([]);
  const [historicoEstoque, setHistoricoEstoque] = useState([]);
  const [equipamentos, setEquipamentos] = useState([]);
  const [menuAberto, setMenuAberto] = useState(false);
  const [theme, setTheme] = useState("light");
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [notificacoes, setNotificacoes] = useState([]);

  useEffect(() => {
  carregarDadosIniciais();
}, []);


  useEffect(() => {
    const salvo = storage.get("theme") || "light";
    setTheme(salvo);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    storage.set("theme", theme);
  }, [theme]);

  useEffect(() => {
    gerarNotificacoes();
  }, [estoque, chamados, preventivas]);

  const carregarDadosIniciais = async () => {
  try {
    const [
      usuariosDB,
      estoqueDB,
      chamadosDB,
      preventivasDB,
      historicoDB,
      equipamentosDB,
    ] = await Promise.all([
      listarUsuarios(),
      listarEstoque(),
      listarChamados(),
      listarPreventivas(),
      listarHistoricoEstoque(),
      listarEquipamentos(),
    ]);

    setUsuarios(usuariosDB || []);
    setEstoque(estoqueDB || []);
    setChamados(chamadosDB || []);
    setPreventivas(preventivasDB || []);
    setHistoricoEstoque(historicoDB || []);
    setEquipamentos(equipamentosDB || []);
  } catch (error) {
    console.error("Erro ao carregar dados iniciais do Supabase:", error);
  }
};

  const fazerLogin = async (email, senha) => {
  const user = await autenticarUsuario(email, senha);

  if (user && (user.ativo === undefined || user.ativo === true)) {
    setUsuario(user);
    return true;
  }

  return false;
};


  const fazerLogout = () => {
    setUsuario(null);
    setPaginaAtual("dashboard");
  };

  const gerarNotificacoes = () => {
    const novaLista = [];
    const hoje = new Date();

    // Estoque baixo
    estoque.forEach((item) => {
      if (item.quantidade <= item.minimo) {
        novaLista.push({
          id: `estoque-${item.id}`,
          tipo: "Alerta",
          nivel: "alerta",
          mensagem: `Item "${item.nome}" abaixo do mínimo.`,
          modulo: "estoque",
        });
      }
    });

    // Chamados atrasados (pendente/em andamento com mais de 3 dias)
    chamados.forEach((c) => {
      if (c.status !== "concluido" && c.data) {
        const d = new Date(c.data);
        const diff = Math.floor((hoje - d) / (1000 * 60 * 60 * 24));
        if (diff >= 3) {
          novaLista.push({
            id: `chamado-${c.id}`,
            tipo: "Urgente",
            nivel: "urgente",
            mensagem: `Chamado "${c.titulo}" atrasado (${diff} dias).`,
            modulo: "chamados",
          });
        }
      }
    });

    // Preventivas próximas (até 7 dias)
    preventivas.forEach((p) => {
      if (p.status === "pendente" && p.data) {
        const d = new Date(p.data);
        const diff = Math.floor((d - hoje) / (1000 * 60 * 60 * 24));
        if (diff >= 0 && diff <= 7) {
          novaLista.push({
            id: `preventiva-${p.id}`,
            tipo: "Alerta",
            nivel: "info",
            mensagem: `Preventiva em "${p.sala}" em ${p.data}.`,
            modulo: "preventivas",
          });
        }
      }
    });

    setNotificacoes(novaLista);
  };

  const handleNotificationClick = (notif) => {
    if (notif.modulo) {
      setPaginaAtual(notif.modulo);
      setMenuAberto(false);
    }
  };

  const gerarBackup = () => {
  const dados = {
    usuarios,
    estoque,
    chamados,
    preventivas,
    historicoEstoque,
    equipamentos,
  };

  const blob = new Blob([JSON.stringify(dados, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `backup-ti-${new Date()
    .toISOString()
    .split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};


  const importarBackup = (jsonData) => {
  try {
    const parsed =
      typeof jsonData === "string" ? JSON.parse(jsonData) : jsonData;

    if (parsed.usuarios) {
      setUsuarios(parsed.usuarios);
    }
    if (parsed.estoque) {
      setEstoque(parsed.estoque);
    }
    if (parsed.chamados) {
      setChamados(parsed.chamados);
    }
    if (parsed.preventivas) {
      setPreventivas(parsed.preventivas);
    }
    if (parsed.historicoEstoque) {
      setHistoricoEstoque(parsed.historicoEstoque);
    }
    if (parsed.equipamentos) {
      setEquipamentos(parsed.equipamentos);
    }

    alert(
      "Backup importado na interface. (Para persistir no Supabase, precisamos adaptar esta função para escrever no banco.)"
    );
  } catch (e) {
    console.error(e);
    alert("Falha ao importar backup. Verifique o arquivo.");
  }
};


  const handleSelectGlobalResult = (modulo) => {
    setPaginaAtual(modulo);
    setGlobalSearchOpen(false);
    setMenuAberto(false);
  };

  if (!usuario) {
    return <TelaLogin onLogin={fazerLogin} />;
  }

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-slate-900 dark:text-slate-100">
        <Header
          usuario={usuario}
          onLogout={fazerLogout}
          menuAberto={menuAberto}
          setMenuAberto={setMenuAberto}
          theme={theme}
          setTheme={setTheme}
          notificacoes={notificacoes}
          onNotificationClick={handleNotificationClick}
          onOpenSearch={() => setGlobalSearchOpen(true)}
        />

        <div className="flex">
          <Sidebar
            usuario={usuario}
            paginaAtual={paginaAtual}
            setPaginaAtual={setPaginaAtual}
            chamados={chamados}
            estoque={estoque}
            preventivas={preventivas}
            equipamentos={equipamentos}
            menuAberto={menuAberto}
            setMenuAberto={setMenuAberto}
          />

          <main className="flex-1 p-4 sm:p-6 lg:ml-64 transition-colors">
            {paginaAtual === "dashboard" && (
              <Dashboard
                chamados={chamados}
                estoque={estoque}
                preventivas={preventivas}
                historicoEstoque={historicoEstoque}
              />
            )}

            {paginaAtual === "estoque" && (
              <Estoque
                estoque={estoque}
                setEstoque={setEstoque}
                usuario={usuario}
                historicoEstoque={historicoEstoque}
                setHistoricoEstoque={setHistoricoEstoque}
              />
            )}

            {paginaAtual === "chamados" && (
              <Chamados
                chamados={chamados}
                setChamados={setChamados}
                usuario={usuario}
              />
            )}

            {paginaAtual === "preventivas" && (
              <Preventivas
                preventivas={preventivas}
                setPreventivas={setPreventivas}
                usuario={usuario}
              />
            )}

            {paginaAtual === "relatorios" && (
              <Relatorios
                chamados={chamados}
                estoque={estoque}
                preventivas={preventivas}
                historicoEstoque={historicoEstoque}
                onBackup={gerarBackup}
              />
            )}

            {paginaAtual === "equipamentos" && (
              <Equipamentos
                equipamentos={equipamentos}
                setEquipamentos={setEquipamentos}
              />
            )}

            {paginaAtual === "calendario" && (
              <Calendario preventivas={preventivas} />
            )}

            {paginaAtual === "configuracoes" && (
              <Configuracoes
                usuarioLogado={usuario}
                usuarios={usuarios}
                setUsuarios={setUsuarios}
                importarBackup={importarBackup}
              />
            )}
          </main>
        </div>

        <GlobalSearchModal
          open={globalSearchOpen}
          term={globalSearchTerm}
          setTerm={setGlobalSearchTerm}
          chamados={chamados}
          estoque={estoque}
          preventivas={preventivas}
          equipamentos={equipamentos}
          onClose={() => setGlobalSearchOpen(false)}
          onSelect={handleSelectGlobalResult}
        />
      </div>
    </div>
  );
};

// ==== Tela de Login ====

const TelaLogin = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const handleSubmit = async (e) => {
  e.preventDefault();
  const ok = await onLogin(email, senha);
  if (ok) {
    setErro("");
  } else {
    setErro("Email, senha incorretos ou usuário inativo.");
  }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Sistema interno TI - Estacio RP</h1>
          <p className="text-gray-600 mt-2">Gestão de Infraestrutura</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              {erro}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Entrar
          </button>
        </form>

        
      </div>
    </div>
  );
};

// ==== Header ====

const Header = ({
  usuario,
  onLogout,
  menuAberto,
  setMenuAberto,
  theme,
  setTheme,
  notificacoes,
  onNotificationClick,
  onOpenSearch,
}) => {
  const [notifOpen, setNotifOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const getBadgeColor = (nivel) => {
    if (nivel === "urgente") return "bg-red-100 text-red-700";
    if (nivel === "alerta") return "bg-yellow-100 text-yellow-800";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40">
      <div className="px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMenuAberto(!menuAberto)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            {menuAberto ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>

          <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-slate-100">
            Sistema de Gestão TI - Estacio RP
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Busca Global */}
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
            title="Busca Global"
          >
            <Search className="w-5 h-5 text-gray-600 dark:text-slate-200" />
          </button>

          {/* Notificações */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
              title="Notificações"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-slate-200" />

              {notificacoes.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {notificacoes.length}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl max-h-80 overflow-y-auto text-sm">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-semibold text-gray-800 dark:text-slate-100">
                    Notificações
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Urgente / Alerta / Info
                  </span>
                </div>

                {notificacoes.length === 0 && (
                  <div className="p-3 text-gray-500 text-xs">
                    Nenhuma notificação no momento.
                  </div>
                )}

                {notificacoes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      onNotificationClick(n);
                      setNotifOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 flex flex-col gap-1"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] rounded-full ${getBadgeColor(
                          n.nivel
                        )}`}
                      >
                        {n.tipo}
                      </span>
                      <span className="text-[10px] text-gray-400 uppercase">
                        {n.modulo}
                      </span>
                    </div>
                    <span className="text-xs text-gray-700 dark:text-slate-200">
                      {n.mensagem}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tema */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
            title="Alternar tema"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-slate-800" />
            )}
          </button>

          {/* Usuário */}
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-sm font-semibold text-gray-800 dark:text-slate-100">
              {usuario.nome}
            </p>
            <p className="text-[10px] text-gray-500">{usuario.nivel}</p>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-xs sm:text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};

// ==== Sidebar Responsiva ====

const Sidebar = ({
  usuario,
  paginaAtual,
  setPaginaAtual,
  chamados,
  estoque,
  preventivas,
  equipamentos,
  menuAberto,
  setMenuAberto,
}) => {
  const chamadosPendentes = chamados.filter(
    (c) => c.status === "pendente"
  ).length;
  const estoqueAlerta = estoque.filter(
    (e) => e.quantidade <= e.minimo
  ).length;
  const preventivasPendentes = preventivas.filter(
    (p) => p.status === "pendente"
  ).length;
  const equipamentosManutencao = equipamentos.filter(
    (e) => e.status === "Manutenção" || e.status === "Defeito"
  ).length;

  const menuItemsBase = [
    { id: "dashboard", nome: "Dashboard", icone: TrendingUp },
    { id: "estoque", nome: "Estoque", icone: Package, badge: estoqueAlerta },
    { id: "chamados", nome: "Chamados", icone: Wrench, badge: chamadosPendentes },
    {
      id: "preventivas",
      nome: "Preventivas",
      icone: CheckSquare,
      badge: preventivasPendentes,
    },
    {
      id: "equipamentos",
      nome: "Equipamentos",
      icone: BarChart3,
      badge: equipamentosManutencao,
    },
    { id: "calendario", nome: "Calendário", icone: CalendarIcon },
    { id: "relatorios", nome: "Relatórios", icone: FileText },
  ];

  const menuItems =
    usuario.nivel === "admin"
      ? [...menuItemsBase, { id: "configuracoes", nome: "Configurações", icone: Settings }]
      : menuItemsBase;

  const handleClick = (id) => {
    setPaginaAtual(id);
    setMenuAberto(false);
  };

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          menuAberto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="mt-20 px-4 pb-6 overflow-y-auto h-full">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleClick(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 mb-2 rounded-lg transition-colors ${
                paginaAtual === item.id
                  ? "bg-blue-600 text-white font-semibold"
                  : "text-gray-700 dark:text-slate-100 hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icone className="w-5 h-5" />
                <span>{item.nome}</span>
              </div>

              {item.badge > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>

      {menuAberto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-20 lg:hidden"
          onClick={() => setMenuAberto(false)}
        />
      )}
    </>
  );
};

// ==== Dashboard ====

const Dashboard = ({
  chamados,
  estoque,
  preventivas,
  historicoEstoque,
}) => {
  const chamadosPendentes = chamados.filter(
    (c) => c.status === "pendente"
  ).length;
  const chamadosAndamento = chamados.filter(
    (c) => c.status === "em_andamento"
  ).length;
  const chamadosConcluidos = chamados.filter(
    (c) => c.status === "concluido"
  ).length;
  const estoqueAlerta = estoque.filter(
    (e) => e.quantidade <= e.minimo
  ).length;
  const preventivasPendentes = preventivas.filter(
    (p) => p.status === "pendente"
  ).length;

  const ultimosChamados = [...chamados].slice(-5).reverse();
  const ultimosMovimentos = [...historicoEstoque].slice(-5).reverse();

  const problemasPorTipo = {};
  chamados.forEach((c) => {
    problemasPorTipo[c.tipo] = (problemasPorTipo[c.tipo] || 0) + 1;
  });

  const totalChamados = chamados.length || 1;
  const taxaConclusao = (
    (chamadosConcluidos / totalChamados) *
    100
  ).toFixed(1);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      {/* Cards principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <CardEstatistica
          titulo="Chamados Pendentes"
          valor={chamadosPendentes}
          icone={AlertCircle}
          cor="red"
        />
        <CardEstatistica
          titulo="Em Andamento"
          valor={chamadosAndamento}
          icone={Wrench}
          cor="yellow"
        />
        <CardEstatistica
          titulo="Estoque em Alerta"
          valor={estoqueAlerta}
          icone={Package}
          cor="orange"
        />
        <CardEstatistica
          titulo="Preventivas Pendentes"
          valor={preventivasPendentes}
          icone={CheckSquare}
          cor="blue"
        />
      </div>

      {/* Gráficos simples */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4">
          <h3 className="font-semibold mb-2 text-sm">Taxa de Conclusão</h3>
          <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 bg-green-500 rounded-full transition-all"
              style={{ width: `${taxaConclusao}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-gray-600 dark:text-slate-400">
            {taxaConclusao}% dos chamados concluídos.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 lg:col-span-2">
          <h3 className="font-semibold mb-2 text-sm">Chamados por Tipo</h3>

          {Object.keys(problemasPorTipo).length === 0 && (
            <p className="text-xs text-gray-500">
              Nenhum chamado cadastrado.
            </p>
          )}

          <div className="space-y-2">
            {Object.entries(problemasPorTipo).map(([tipo, qtd]) => {
              const pct = ((qtd / totalChamados) * 100).toFixed(1);

              return (
                <div
                  key={tipo}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="w-20 capitalize text-gray-700 dark:text-slate-300">
                    {tipo}
                  </span>
                  <div className="flex-1 bg-gray-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-3 bg-blue-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-gray-600 dark:text-slate-400">
                    {qtd}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Últimos Chamados / Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos Chamados */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold mb-4">Últimos Chamados</h3>
          <div className="space-y-3">
            {ultimosChamados.length === 0 && (
              <p className="text-sm text-gray-500">
                Nenhum chamado registrado ainda.
              </p>
            )}

            {ultimosChamados.map((chamado) => (
              <div
                key={chamado.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-semibold text-sm">
                    {chamado.titulo}
                  </p>
                  <p className="text-xs text-gray-500">
                    {chamado.sala}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 text-[10px] rounded-full ${
                    chamado.status === "pendente"
                      ? "bg-red-100 text-red-700"
                      : chamado.status === "em_andamento"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {chamado.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Movimentação de Estoque */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold mb-4">
            Movimentação de Estoque
          </h3>
          <div className="space-y-3">
            {ultimosMovimentos.length === 0 && (
              <p className="text-sm text-gray-500">
                Nenhuma movimentação registrada.
              </p>
            )}

            {ultimosMovimentos.map((mov) => (
              <div
                key={mov.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-semibold text-sm">{mov.item}</p>
                  <p className="text-xs text-gray-500">
                    {mov.motivo}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 text-[10px] rounded-full ${
                    mov.tipo === "entrada"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {mov.tipo === "entrada" ? "+" : "-"} {mov.quantidade}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const CardEstatistica = ({ titulo, valor, icone: Icone, cor }) => {
  const cores = {
    red: "bg-red-100 text-red-600",
    yellow: "bg-yellow-100 text-yellow-600",
    orange: "bg-orange-100 text-orange-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${cores[cor]}`}>
          <Icone className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold">{valor}</p>
      <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
        {titulo}
      </p>
    </div>
  );
};

// ==== Estoque ====

import {
  criarItemEstoque,
  atualizarItemEstoque,
  deletarItemEstoque,
  registrarMovimentacaoEstoque,
} from "./services/estoque";


const Estoque = ({
  estoque,
  setEstoque,
  usuario,
  historicoEstoque,
  setHistoricoEstoque,
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [modalMovimento, setModalMovimento] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState({
    nome: "",
    quantidade: 0,
    minimo: 0,
    localizacao: "",
    categoria: "",
  });
  const [movimento, setMovimento] = useState({
    tipo: "entrada",
    quantidade: 0,
    motivo: "",
  });

  const abrirModal = (item = null) => {
    if (item) {
      setItemSelecionado(item);
      setForm(item);
    } else {
      setItemSelecionado(null);
      setForm({
        nome: "",
        quantidade: 0,
        minimo: 0,
        localizacao: "",
        categoria: "",
      });
    }
    setModalAberto(true);
  };

  const salvarItem = async () => {
  if (!form.nome.trim()) {
    alert("Informe o nome do item.");
    return;
  }

  try {
    if (itemSelecionado) {
      // Atualizar no Supabase
      const atualizado = await atualizarItemEstoque(itemSelecionado.id, {
        nome: form.nome,
        quantidade: form.quantidade,
        minimo: form.minimo,
        localizacao: form.localizacao,
        categoria: form.categoria,
      });

      // Atualizar no estado
      setEstoque((prev) =>
        prev.map((i) =>
          i.id === itemSelecionado.id ? atualizado : i
        )
      );
    } else {
      // Criar no Supabase
      const criado = await criarItemEstoque({
        nome: form.nome,
        quantidade: form.quantidade,
        minimo: form.minimo,
        localizacao: form.localizacao,
        categoria: form.categoria,
      });

      // Adicionar no estado
      setEstoque((prev) => [...prev, criado]);
    }

    setModalAberto(false);
  } catch (error) {
    console.error("Erro ao salvar item de estoque:", error);
    alert("Erro ao salvar item no estoque.");
  }
};


  const excluirItem = async (id) => {
  if (!window.confirm("Tem certeza que deseja excluir este item?")) {
    return;
  }

  try {
    await deletarItemEstoque(id);
    setEstoque((prev) => prev.filter((i) => i.id !== id));
  } catch (error) {
    console.error("Erro ao excluir item:", error);
    alert("Erro ao excluir item do estoque.");
  }
};


  const abrirModalMovimento = (item) => {
    setItemSelecionado(item);
    setMovimento({ tipo: "entrada", quantidade: 0, motivo: "" });
    setModalMovimento(true);
  };

  const registrarMovimento = async () => {
  if (!movimento.quantidade || movimento.quantidade <= 0) {
    alert("Informe uma quantidade válida.");
    return;
  }

  const quantidade = parseInt(movimento.quantidade, 10);

  // Calcula nova quantidade
  const novaQtd =
    movimento.tipo === "entrada"
      ? itemSelecionado.quantidade + quantidade
      : itemSelecionado.quantidade - quantidade;

  const movimentoPayload = {
    item_id: itemSelecionado.id,
    item: itemSelecionado.nome,
    tipo: movimento.tipo,
    quantidade,
    data: new Date().toISOString().split("T")[0],
    responsavel: usuario.nome,
    motivo:
      movimento.motivo ||
      (movimento.tipo === "entrada"
        ? "Entrada manual"
        : "Saída manual"),
  };

  try {
    // 1) Registra histórico no Supabase
    const historicoCriado =
      await registrarMovimentacaoEstoque(movimentoPayload);

    // 2) Atualiza quantidade do item no Supabase
    const itemAtualizado = await atualizarItemEstoque(
      itemSelecionado.id,
      {
        ...itemSelecionado,
        quantidade: Math.max(0, novaQtd),
      }
    );

    // 3) Atualiza estados locais
    setEstoque((prev) =>
      prev.map((i) =>
        i.id === itemSelecionado.id ? itemAtualizado : i
      )
    );

    setHistoricoEstoque((prev) => [
      ...prev,
      historicoCriado,
    ]);

    setModalMovimento(false);
  } catch (error) {
    console.error("Erro ao registrar movimento:", error);
    alert("Erro ao registrar movimentação de estoque.");
  }
};


  const itensFiltrados = estoque.filter((item) => {
    const t = busca.toLowerCase();
    return (
      item.nome.toLowerCase().includes(t) ||
      (item.categoria || "").toLowerCase().includes(t) ||
      (item.localizacao || "").toLowerCase().includes(t)
    );
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Gestão de Estoque</h2>
        <button
          onClick={() => abrirModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Item
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome, categoria ou localização..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-3
            border rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            bg-white text-gray-900 placeholder-gray-400
            dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {itensFiltrados.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-sm">{item.nome}</h3>
                <span className="text-[11px] text-gray-500">
                  {item.categoria || "Sem categoria"}
                </span>
              </div>

              {item.quantidade <= item.minimo && (
                <span className="bg-red-100 text-red-700 text-[10px] px-2 py-1 rounded-full">
                  Alerta
                </span>
              )}
            </div>

            <div className="space-y-1 mb-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Quantidade:</span>
                <span className="font-semibold">
                  {item.quantidade}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mínimo:</span>
                <span className="font-semibold">{item.minimo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Localização:</span>
                <span className="font-semibold">
                  {item.localizacao || "Não informado"}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => abrirModalMovimento(item)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-xs"
              >
                <Package className="w-4 h-4" />
                Movimentar
              </button>
              <button
                onClick={() => abrirModal(item)}
                className="px-2.5 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => excluirItem(item.id)}
                className="px-2.5 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {itensFiltrados.length === 0 && (
          <p className="text-sm text-gray-500">
            Nenhum item encontrado.
          </p>
        )}
      </div>

      {modalAberto && (
        <Modal
          titulo={itemSelecionado ? "Editar Item" : "Novo Item"}
          onClose={() => setModalAberto(false)}
        >
          <div className="space-y-3 text-sm">
            <div>
              <label className="block mb-1 font-medium">
                Nome do Item
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) =>
                  setForm({ ...form, nome: e.target.value })
                }
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-medium">
                  Quantidade
                </label>
                <input
                  type="number"
                  value={form.quantidade}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      quantidade:
                        parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="
                  w-full px-3 py-2 border rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  bg-white text-gray-900 placeholder-gray-400
                  dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">
                  Estoque Mínimo
                </label>
                <input
                  type="number"
                  value={form.minimo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minimo:
                        parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="
                  w-full px-3 py-2 border rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  bg-white text-gray-900 placeholder-gray-400
                  dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Categoria
              </label>
              <input
                type="text"
                value={form.categoria}
                onChange={(e) =>
                  setForm({
                    ...form,
                    categoria: e.target.value,
                  })
                }
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
                placeholder="Periféricos, Hardware, Cabos..."
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Localização
              </label>
              <input
                type="text"
                value={form.localizacao}
                onChange={(e) =>
                  setForm({
                    ...form,
                    localizacao: e.target.value,
                  })
                }
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
                placeholder="Almoxarifado A, Sala 201..."
              />
            </div>

            <button
              onClick={salvarItem}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Salvar
            </button>
          </div>
        </Modal>
      )}

      {modalMovimento && (
        <Modal
          titulo="Movimentar Estoque"
          onClose={() => setModalMovimento(false)}
        >
          <div className="space-y-3 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg text-xs">
              <p className="font-semibold">
                {itemSelecionado?.nome}
              </p>
              <p className="text-gray-600">
                Quantidade atual: {itemSelecionado?.quantidade}
              </p>
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Tipo de Movimento
              </label>
              <select
                value={movimento.tipo}
                onChange={(e) =>
                  setMovimento({
                    ...movimento,
                    tipo: e.target.value,
                  })
                }
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Quantidade
              </label>
              <input
                type="number"
                value={movimento.quantidade}
                onChange={(e) =>
                  setMovimento({
                    ...movimento,
                    quantidade:
                      parseInt(e.target.value, 10) || 0,
                  })
                }
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Motivo
              </label>
              <input
                type="text"
                value={movimento.motivo}
                onChange={(e) =>
                  setMovimento({
                    ...movimento,
                    motivo: e.target.value,
                  })
                }
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
                placeholder="Instalação Lab 101, Compra, Defeito..."
              />
            </div>

            <button
              onClick={registrarMovimento}
              className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Confirmar Movimento
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ==== Chamados ====

const Chamados = ({ chamados, setChamados, usuario }) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [modalDetalhes, setModalDetalhes] = useState(false);
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);
  const [filtro, setFiltro] = useState("todos");
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState({
    titulo: "",
    sala: "",
    descricao: "",
    prioridade: "media",
    tipo: "hardware",
    foto: "",
  });

  const abrirModal = (chamado = null) => {
    if (chamado) {
      setChamadoSelecionado(chamado);
      setForm(chamado);
    } else {
      setChamadoSelecionado(null);
      setForm({
        titulo: "",
        sala: "",
        descricao: "",
        prioridade: "media",
        tipo: "hardware",
        foto: "",
      });
    }
    setModalAberto(true);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, foto: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const salvarChamado = async () => {
  if (!form.titulo.trim() || !form.sala.trim()) {
    alert("Preencha título e sala.");
    return;
  }

  try {
    if (chamadoSelecionado) {
      const atualizado = await atualizarChamado(chamadoSelecionado.id, {
        ...chamadoSelecionado,
        titulo: form.titulo,
        sala: form.sala,
        descricao: form.descricao,
        prioridade: form.prioridade,
        tipo: form.tipo,
        foto: form.foto || null,
      });

      setChamados((prev) =>
        prev.map((c) =>
          c.id === chamadoSelecionado.id ? atualizado : c
        )
      );
    } else {
      const novoChamado = await criarChamado({
        titulo: form.titulo,
        sala: form.sala,
        descricao: form.descricao,
        prioridade: form.prioridade,
        tipo: form.tipo,
        foto: form.foto || null,
        status: "pendente",
        tecnico: "Não atribuído",
        data: new Date().toISOString().split("T")[0],
      });

      setChamados((prev) => [...prev, novoChamado]);
    }

    setModalAberto(false);
  } catch (error) {
    console.error("Erro ao salvar chamado:", error);
    alert("Erro ao salvar chamado.");
  }
};


  const atualizarStatus = async (id, novoStatus) => {
  const chamado = chamados.find((c) => c.id === id);
  if (!chamado) return;

  const payload = {
    ...chamado,
    status: novoStatus,
  };

  if (
    novoStatus === "em_andamento" &&
    chamado.tecnico === "Não atribuído"
  ) {
    payload.tecnico = usuario.nome;
  }

  try {
    const atualizado = await atualizarChamado(id, payload);

    setChamados((prev) =>
      prev.map((c) => (c.id === id ? atualizado : c))
    );
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    alert("Erro ao atualizar status do chamado.");
  }
};


  const atribuirTecnico = async (id) => {
  const chamado = chamados.find((c) => c.id === id);
  if (!chamado) return;

  try {
    const atualizado = await atualizarChamado(id, {
      ...chamado,
      tecnico: usuario.nome,
      status: "em_andamento",
    });

    setChamados((prev) =>
      prev.map((c) => (c.id === id ? atualizado : c))
    );
  } catch (error) {
    console.error("Erro ao atribuir técnico:", error);
    alert("Erro ao atribuir técnico.");
  }
};


  const adicionarResolucao = async (id, resolucao) => {
  const chamado = chamados.find((c) => c.id === id);
  if (!chamado) return;

  try {
    const atualizado = await atualizarChamado(id, {
      ...chamado,
      resolucao,
      status: "concluido",
    });

    setChamados((prev) =>
      prev.map((c) => (c.id === id ? atualizado : c))
    );
    setModalDetalhes(false);
  } catch (error) {
    console.error("Erro ao concluir chamado:", error);
    alert("Erro ao concluir chamado.");
  }
};


  const excluirChamado = async (id) => {
  if (!window.confirm("Tem certeza que deseja excluir este chamado?")) {
    return;
  }

  try {
    await deletarChamado(id);
    setChamados((prev) => prev.filter((c) => c.id !== id));
  } catch (error) {
    console.error("Erro ao excluir chamado:", error);
    alert("Erro ao excluir chamado.");
  }
};


  const chamadosFiltrados = chamados.filter((chamado) => {
    const matchFiltro =
      filtro === "todos" || chamado.status === filtro;
    const t = busca.toLowerCase();
    const matchBusca =
      chamado.titulo.toLowerCase().includes(t) ||
      chamado.sala.toLowerCase().includes(t);
    return matchFiltro && matchBusca;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">Gestão de Chamados</h2>
        <button
          onClick={() => abrirModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Chamado
        </button>
      </div>

      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por título ou sala..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-3
            border rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            bg-white text-gray-900 placeholder-gray-400
            dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
          {["todos", "pendente", "em_andamento", "concluido"].map(
            (status) => (
              <button
                key={status}
                onClick={() => setFiltro(status)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                  filtro === status
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "todos"
                  ? "Todos"
                  : status
                      .replace("_", " ")
                      .replace(/^\w/, (s) => s.toUpperCase())}
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {chamadosFiltrados.map((chamado) => (
          <div
            key={chamado.id}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow text-xs"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-sm">
                {chamado.titulo}
              </h3>
              <span
                className={`px-2 py-1 text-[10px] rounded-full ${
                  chamado.prioridade === "alta"
                    ? "bg-red-100 text-red-700"
                    : chamado.prioridade === "media"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {chamado.prioridade}
              </span>
            </div>

            <div className="space-y-1 mb-2">
              <p className="text-gray-600">
                <strong>Sala:</strong> {chamado.sala}
              </p>
              <p className="text-gray-600">
                <strong>Tipo:</strong> {chamado.tipo}
              </p>
              <p className="text-gray-600">
                <strong>Técnico:</strong> {chamado.tecnico}
              </p>
              <p className="text-gray-600">
                <strong>Data:</strong> {chamado.data}
              </p>
            </div>

            {chamado.foto && (
              <div className="mb-2">
                <img
                  src={chamado.foto}
                  alt="Foto do problema"
                  className="w-full h-24 object-cover rounded-lg"
                />
              </div>
            )}

            <p className="text-gray-600 line-clamp-2 mb-2">
              {chamado.descricao}
            </p>

            <div className="flex items-center gap-2 mb-2">
              <span
                className={`flex-1 text-center px-3 py-1 rounded-full ${
                  chamado.status === "pendente"
                    ? "bg-red-100 text-red-700"
                    : chamado.status === "em_andamento"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {chamado.status.replace("_", " ")}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setChamadoSelecionado(chamado);
                  setModalDetalhes(true);
                }}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                <Eye className="w-4 h-4" />
                Detalhes
              </button>

              {chamado.tecnico === "Não atribuído" && (
                <button
                  onClick={() => atribuirTecnico(chamado.id)}
                  className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                >
                  Atribuir
                </button>
              )}

              <button
                onClick={() => excluirChamado(chamado.id)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {chamadosFiltrados.length === 0 && (
          <p className="text-sm text-gray-500">
            Nenhum chamado encontrado.
          </p>
        )}
      </div>

      {modalAberto && (
        <Modal
          titulo={
            chamadoSelecionado
              ? "Editar Chamado"
              : "Novo Chamado"
          }
          onClose={() => setModalAberto(false)}
        >
          <div className="space-y-3 text-sm">
            <div>
              <label className="block mb-1 font-medium">
                Título
              </label>
              <input
                type="text"
                value={form.titulo}
                onChange={(e) =>
                  setForm({ ...form, titulo: e.target.value })
                }
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
                placeholder="Ex: Computador não liga"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Sala/Local
              </label>
              <input
                type="text"
                value={form.sala}
                onChange={(e) =>
                  setForm({ ...form, sala: e.target.value })
                }
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
                placeholder="Lab 101, Sala 203..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-medium">
                  Prioridade
                </label>
                <select
                  value={form.prioridade}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      prioridade: e.target.value,
                    })
                  }
                  className="
                  w-full px-3 py-2 border rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  bg-white text-gray-900 placeholder-gray-400
                  dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Tipo
                </label>
                <select
                  value={form.tipo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tipo: e.target.value,
                    })
                  }
                  className="
                  w-full px-3 py-2 border rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  bg-white text-gray-900 placeholder-gray-400
                  dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
                >
                  <option value="hardware">Hardware</option>
                  <option value="software">Software</option>
                  <option value="rede">Rede</option>
                  <option value="periferico">
                    Periférico
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Descrição
              </label>
              <textarea
                value={form.descricao}
                onChange={(e) =>
                  setForm({
                    ...form,
                    descricao: e.target.value,
                  })
                }
                rows={3}
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
                placeholder="Descreva o problema..."
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Foto (opcional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="w-full text-xs"
              />
              {form.foto && (
                <img
                  src={form.foto}
                  alt="Preview"
                  className="mt-2 w-full h-32 object-cover rounded-lg"
                />
              )}
            </div>

            <button
              onClick={salvarChamado}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Salvar
            </button>
          </div>
        </Modal>
      )}

      {modalDetalhes && chamadoSelecionado && (
        <Modal
          titulo="Detalhes do Chamado"
          onClose={() => setModalDetalhes(false)}
        >
          <div className="space-y-3 text-sm">
            <div className="w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500">
              <h3 className="font-bold text-base">
                {chamadoSelecionado.titulo}
              </h3>
              <p>
                <strong>Sala:</strong>{" "}
                {chamadoSelecionado.sala}
              </p>
              <p>
                <strong>Tipo:</strong>{" "}
                {chamadoSelecionado.tipo}
              </p>
              <p>
                <strong>Prioridade:</strong>{" "}
                {chamadoSelecionado.prioridade}
              </p>
              <p>
                <strong>Técnico:</strong>{" "}
                {chamadoSelecionado.tecnico}
              </p>
              <p>
                <strong>Data:</strong>{" "}
                {chamadoSelecionado.data}
              </p>
              <p>
                <strong>Descrição:</strong>{" "}
                {chamadoSelecionado.descricao}
              </p>

              {chamadoSelecionado.foto && (
                <div className="mt-2">
                  <strong>Foto:</strong>
                  <img
                    src={chamadoSelecionado.foto}
                    alt="Foto do problema"
                    className="mt-1 w-full max-h-64 object-contain rounded-lg"
                  />
                </div>
              )}

              {chamadoSelecionado.resolucao && (
                <p>
                  <strong>Resolução:</strong>{" "}
                  {chamadoSelecionado.resolucao}
                </p>
              )}
            </div>

            {chamadoSelecionado.status !== "concluido" && (
              <>
                {chamadoSelecionado.status === "pendente" && (
                  <button
                    onClick={() =>
                      atualizarStatus(
                        chamadoSelecionado.id,
                        "em_andamento"
                      )
                    }
                    className="w-full py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Iniciar Atendimento
                  </button>
                )}

                {chamadoSelecionado.status ===
                  "em_andamento" && (
                  <div>
                    <label className="block mb-1 font-medium">
                      Resolução
                    </label>
                    <textarea
                      id="resolucao-input"
                      className="
                      w-full px-3 py-2 border rounded-lg
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      bg-white text-gray-900 placeholder-gray-400
                      dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
                      rows={3}
                      placeholder="Descreva o que foi feito..."
                    />
                    <button
                      onClick={() => {
                        const resolucao =
                          document.getElementById(
                            "resolucao-input"
                          ).value;
                        if (resolucao.trim()) {
                          adicionarResolucao(
                            chamadoSelecionado.id,
                            resolucao
                          );
                        } else {
                          alert(
                            "Por favor, descreva a resolução."
                          );
                        }
                      }}
                      className="w-full mt-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Concluir Chamado
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

// ==== Preventivas ====

const Preventivas = ({
  preventivas,
  setPreventivas,
  usuario,
}) => {
  const [modalAberto, setModalAberto] = useState(false);
  const [modalChecklist, setModalChecklist] = useState(false);
  const [preventivaSelecionada, setPreventivaSelecionada] =
    useState(null);
  const [form, setForm] = useState({
    sala: "",
    data: "",
    tecnico: usuario.nome,
  });
  const [checklist, setChecklist] = useState({
    computadores: false,
    monitores: false,
    teclados: false,
    mouses: false,
    rede: false,
    limpeza: false,
    observacoes: "",
  });

  const abrirModal = () => {
    setForm({
      sala: "",
      data: "",
      tecnico: usuario.nome,
    });
    setModalAberto(true);
  };

  const salvarPreventiva = async () => {
  if (!form.sala.trim() || !form.data) {
    alert("Informe sala e data.");
    return;
  }

  try {
    const criada = await criarPreventiva({
      sala: form.sala,
      data: form.data,
      tecnico: form.tecnico,
      status: "pendente",
      observacoes: "",
    });

    setPreventivas((prev) => [...prev, criada]);
    setModalAberto(false);
  } catch (error) {
    console.error("Erro ao agendar preventiva:", error);
    alert("Erro ao agendar preventiva.");
  }
};


  const abrirChecklist = (preventiva) => {
    setPreventivaSelecionada(preventiva);
    setChecklist({
      computadores: false,
      monitores: false,
      teclados: false,
      mouses: false,
      rede: false,
      limpeza: false,
      observacoes: "",
    });
    setModalChecklist(true);
  };

  const concluirPreventiva = async () => {
  const checados = Object.entries(checklist)
    .filter(([k, v]) => k !== "observacoes" && v)
    .map(([k]) => k)
    .join(", ");

  const observacoes = `Checklist: ${
    checados || "Nenhum item marcado"
  }. ${checklist.observacoes || ""}`;

  try {
    const atualizada = await atualizarPreventiva(
      preventivaSelecionada.id,
      {
        ...preventivaSelecionada,
        status: "concluido",
        observacoes,
      }
    );

    setPreventivas((prev) =>
      prev.map((p) =>
        p.id === preventivaSelecionada.id
          ? atualizada
          : p
      )
    );

    setModalChecklist(false);
  } catch (error) {
    console.error("Erro ao concluir preventiva:", error);
    alert("Erro ao concluir preventiva.");
  }
};


  const excluirPreventiva = async (id) => {
  if (
    !window.confirm(
      "Tem certeza que deseja excluir esta preventiva?"
    )
  ) {
    return;
  }

  try {
    await deletarPreventiva(id);
    setPreventivas((prev) => prev.filter((p) => p.id !== id));
  } catch (error) {
    console.error("Erro ao excluir preventiva:", error);
    alert("Erro ao excluir preventiva.");
  }
};


  const pendentes = preventivas.filter(
    (p) => p.status === "pendente"
  );
  const concluidas = preventivas.filter(
    (p) => p.status === "concluido"
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">
          Manutenções Preventivas
        </h2>
        <button
          onClick={abrirModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          Agendar Preventiva
        </button>
      </div>

      {/* Pendentes */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3">
          Pendentes
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pendentes.map((preventiva) => (
            <div
              key={preventiva.id}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-sm">
                    {preventiva.sala}
                  </h4>
                  <p className="text-xs text-gray-600">
                    Data: {preventiva.data}
                  </p>
                </div>
                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 text-[10px] rounded-full">
                  Pendente
                </span>
              </div>

              <p className="text-xs text-gray-600 mb-3">
                <strong>Técnico:</strong>{" "}
                {preventiva.tecnico}
              </p>

              <div className="flex gap-2 text-xs">
                <button
                  onClick={() =>
                    abrirChecklist(preventiva)
                  }
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                >
                  <CheckSquare className="w-4 h-4" />
                  Realizar
                </button>

                <button
                  onClick={() =>
                    excluirPreventiva(preventiva.id)
                  }
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {pendentes.length === 0 && (
            <p className="text-sm text-gray-500">
              Nenhuma preventiva pendente.
            </p>
          )}
        </div>
      </div>

      {/* Concluídas */}
      <div>
        <h3 className="text-lg font-bold mb-3">
          Concluídas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {concluidas.map((preventiva) => (
            <div
              key={preventiva.id}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 text-xs"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-sm">
                    {preventiva.sala}
                  </h4>
                  <p className="text-xs text-gray-600">
                    Data: {preventiva.data}
                  </p>
                </div>
                <span className="bg-green-100 text-green-700 px-3 py-1 text-[10px] rounded-full">
                  Concluída
                </span>
              </div>

              <p className="mb-1">
                <strong>Técnico:</strong>{" "}
                {preventiva.tecnico}
              </p>

              {preventiva.observacoes && (
                <p>
                  <strong>Observações:</strong>{" "}
                  {preventiva.observacoes}
                </p>
              )}
            </div>
          ))}

          {concluidas.length === 0 && (
            <p className="text-sm text-gray-500">
              Nenhuma preventiva concluída ainda.
            </p>
          )}
        </div>
      </div>

      {modalAberto && (
        <Modal
          titulo="Agendar Preventiva"
          onClose={() => setModalAberto(false)}
        >
          <div className="space-y-3 text-sm">
            <div>
              <label className="block mb-1 font-medium">
                Sala/Laboratório
              </label>
              <input
                type="text"
                value={form.sala}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sala: e.target.value,
                  })
                }
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
                placeholder="Lab 101, Sala 203..."
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Data
              </label>
              <input
                type="date"
                value={form.data}
                onChange={(e) =>
                  setForm({
                    ...form,
                    data: e.target.value,
                  })
                }
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Técnico Responsável
              </label>
              <input
                type="text"
                value={form.tecnico}
                onChange={(e) =>
                  setForm({
                    ...form,
                    tecnico: e.target.value,
                  })
                }
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
              />
            </div>

            <button
              onClick={salvarPreventiva}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Agendar
            </button>
          </div>
        </Modal>
      )}

      {modalChecklist && preventivaSelecionada && (
        <Modal
          titulo={`Checklist - ${preventivaSelecionada.sala}`}
          onClose={() => setModalChecklist(false)}
        >
          <div className="space-y-3 text-sm">
            <div className="space-y-2">
              {Object.entries(checklist)
                .filter(([k]) => k !== "observacoes")
                .map(([key, value]) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setChecklist({
                          ...checklist,
                          [key]: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    <span className="capitalize">
                      {key.replace("_", " ")}
                    </span>
                  </label>
                ))}
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Observações
              </label>
              <textarea
                value={checklist.observacoes}
                onChange={(e) =>
                  setChecklist({
                    ...checklist,
                    observacoes: e.target.value,
                  })
                }
                rows={3}
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
                placeholder="Observações sobre a manutenção..."
              />
            </div>

            <button
              onClick={concluirPreventiva}
              className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              Concluir Preventiva
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ==== Relatórios ====

const Relatorios = ({
  chamados,
  estoque,
  preventivas,
  historicoEstoque,
  onBackup,
}) => {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const filtrarPorPeriodo = (data) => {
    if (!data) return true;
    if (!dataInicio && !dataFim) return true;
    if (dataInicio && data < dataInicio) return false;
    if (dataFim && data > dataFim) return false;
    return true;
  };

  const chamadosFiltrados = chamados.filter((c) =>
    filtrarPorPeriodo(c.data)
  );
  const historicoFiltrado = historicoEstoque.filter((h) =>
    filtrarPorPeriodo(h.data)
  );
  const preventivasFiltradas = preventivas.filter((p) =>
    filtrarPorPeriodo(p.data)
  );

  const totalChamados = chamadosFiltrados.length;
  const chamadosConcluidos = chamadosFiltrados.filter(
    (c) => c.status === "concluido"
  ).length;
  const chamadosPendentes = chamadosFiltrados.filter(
    (c) => c.status === "pendente"
  ).length;
  const chamadosAndamento = chamadosFiltrados.filter(
    (c) => c.status === "em_andamento"
  ).length;

  const entradasEstoque = historicoFiltrado
    .filter((h) => h.tipo === "entrada")
    .reduce((sum, h) => sum + h.quantidade, 0);
  const saidasEstoque = historicoFiltrado
    .filter((h) => h.tipo === "saida")
    .reduce((sum, h) => sum + h.quantidade, 0);

  const preventivasConcluidas = preventivasFiltradas.filter(
    (p) => p.status === "concluido"
  ).length;
  const preventivasPendentes = preventivasFiltradas.filter(
    (p) => p.status === "pendente"
  ).length;

  const problemasFrequentes = {};
  chamadosFiltrados.forEach((c) => {
    problemasFrequentes[c.tipo] =
      (problemasFrequentes[c.tipo] || 0) + 1;
  });

  const estoqueAbaixoMinimo = estoque.filter(
    (e) => e.quantidade <= e.minimo
  );

  const gerarRelatorioPDF = () => {
    const relatorio = document.getElementById(
      "relatorio-conteudo"
    );
    if (!relatorio) return;

    const printWindow = window.open("", "_blank");

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Gestão TI</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
            h2 { color: #374151; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f3f4f6; }
            .secao { margin: 20px 0; page-break-inside: avoid; }
          </style>
        </head>
        <body>
          ${relatorio.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-2xl font-bold">Relatórios</h2>

        <div className="flex gap-2">
          <button
            onClick={onBackup}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-xs"
          >
            <Download className="w-4 h-4" />
            Backup (JSON)
          </button>

          <button
            onClick={gerarRelatorioPDF}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
          >
            <Download className="w-4 h-4" />
            Gerar PDF
          </button>
        </div>
      </div>

      {/* Filtro */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 mb-4 text-xs">
        <h3 className="font-bold mb-3">Filtrar Período</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) =>
                setDataInicio(e.target.value)
              }
              className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) =>
                setDataFim(e.target.value)
              }
              className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Conteúdo do relatório */}
      <div id="relatorio-conteudo" className="text-xs">
        {/* Resumo */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 mb-4">
          <h1 className="text-xl font-bold mb-1">
            Relatório de Gestão TI
          </h1>
          <p className="text-gray-600 mb-3">
            Período: {dataInicio || "Início"} até{" "}
            {dataFim || "Hoje"}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p>Total de Chamados</p>
              <p className="text-2xl font-bold text-blue-600">
                {totalChamados}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p>Concluídos</p>
              <p className="text-2xl font-bold text-green-600">
                {chamadosConcluidos}
              </p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p>Em Andamento</p>
              <p className="text-2xl font-bold text-yellow-600">
                {chamadosAndamento}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p>Pendentes</p>
              <p className="text-2xl font-bold text-red-600">
                {chamadosPendentes}
              </p>
            </div>
          </div>
        </div>

        {/* Chamados por Tipo */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-lg font-bold mb-2">
            Chamados por Tipo
          </h2>

          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Quantidade</th>
                <th>Percentual</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(problemasFrequentes).map(
                ([tipo, qtd]) => (
                  <tr key={tipo}>
                    <td>{tipo}</td>
                    <td>{qtd}</td>
                    <td>
                      {totalChamados
                        ? (
                            (qtd /
                              totalChamados) *
                            100
                          ).toFixed(1)
                        : 0}{" "}
                      %
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* Movimentação de Estoque */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-lg font-bold mb-2">
            Movimentação de Estoque
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <div className="bg-green-50 p-3 rounded-lg">
              <p>Entradas</p>
              <p className="text-2xl font-bold text-green-600">
                {entradasEstoque}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <p>Saídas</p>
              <p className="text-2xl font-bold text-red-600">
                {saidasEstoque}
              </p>
            </div>
          </div>

          {estoqueAbaixoMinimo.length > 0 && (
            <>
              <h3 className="font-bold mb-1">
                Itens Abaixo do Estoque Mínimo
              </h3>

              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Quantidade</th>
                    <th>Mínimo</th>
                  </tr>
                </thead>
                <tbody>
                  {estoqueAbaixoMinimo.map((item) => (
                    <tr key={item.id}>
                      <td>{item.nome}</td>
                      <td className="text-red-600 font-semibold">
                        {item.quantidade}
                      </td>
                      <td>{item.minimo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Preventivas */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-lg font-bold mb-2">
            Manutenções Preventivas
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <p>Concluídas</p>
              <p className="text-2xl font-bold text-green-600">
                {preventivasConcluidas}
              </p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <p>Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">
                {preventivasPendentes}
              </p>
            </div>
          </div>
        </div>

        {/* Detalhamento de Chamados */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 mb-4">
          <h2 className="text-lg font-bold mb-2">
            Detalhamento de Chamados
          </h2>

          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Sala</th>
                <th>Técnico</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {chamadosFiltrados
                .slice(0, 50)
                .map((c) => (
                  <tr key={c.id}>
                    <td>{c.titulo}</td>
                    <td>{c.sala}</td>
                    <td>{c.tecnico}</td>
                    <td>{c.status}</td>
                    <td>{c.data}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Histórico de Movimentações */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-bold mb-2">
            Histórico de Movimentações
          </h2>

          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Item</th>
                <th>Tipo</th>
                <th>Qtd</th>
                <th>Responsável</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {historicoFiltrado
                .slice(0, 100)
                .map((mov) => (
                  <tr key={mov.id}>
                    <td>{mov.data}</td>
                    <td>{mov.item}</td>
                    <td>{mov.tipo}</td>
                    <td>{mov.quantidade}</td>
                    <td>{mov.responsavel}</td>
                    <td>{mov.motivo}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==== Equipamentos + QR Code ====

const Equipamentos = ({
  equipamentos,
  setEquipamentos,
}) => {
  const [busca, setBusca] = useState("");
  const [modal, setModal] = useState(false);
  const [modalQR, setModalQR] = useState(false);
  const [equipSelecionado, setEquipSelecionado] =
    useState(null);
  const [form, setForm] = useState({
    patrimonio: "",
    nome: "",
    marca: "",
    modelo: "",
    localizacao: "",
    status: "Funcionando",
    observacoes: "",
  });

  const abrirModal = (equip = null) => {
    if (equip) {
      setEquipSelecionado(equip);
      setForm(equip);
    } else {
      setEquipSelecionado(null);
      setForm({
        patrimonio: "",
        nome: "",
        marca: "",
        modelo: "",
        localizacao: "",
        status: "Funcionando",
        observacoes: "",
      });
    }

    setModal(true);
  };

  const salvarEquipamento = async () => {
  if (!form.patrimonio.trim() || !form.nome.trim()) {
    alert("Informe patrimônio e nome.");
    return;
  }

  try {
    if (equipSelecionado) {
      const atualizado = await atualizarEquipamento(
        equipSelecionado.id,
        {
          patrimonio: form.patrimonio,
          nome: form.nome,
          marca: form.marca,
          modelo: form.modelo,
          localizacao: form.localizacao,
          status: form.status,
          observacoes: form.observacoes,
        }
      );

      setEquipamentos((prev) =>
        prev.map((e) =>
          e.id === equipSelecionado.id ? atualizado : e
        )
      );
    } else {
      const criado = await criarEquipamento({
        patrimonio: form.patrimonio,
        nome: form.nome,
        marca: form.marca,
        modelo: form.modelo,
        localizacao: form.localizacao,
        status: form.status,
        observacoes: form.observacoes,
      });

      setEquipamentos((prev) => [...prev, criado]);
    }

    setModal(false);
  } catch (error) {
    console.error("Erro ao salvar equipamento:", error);
    alert("Erro ao salvar equipamento.");
  }
};


  const excluirEquipamento = async (id) => {
  if (!window.confirm("Excluir este equipamento?")) {
    return;
  }

  try {
    await deletarEquipamento(id);
    setEquipamentos((prev) => prev.filter((e) => e.id !== id));
  } catch (error) {
    console.error("Erro ao excluir equipamento:", error);
    alert("Erro ao excluir equipamento.");
  }
};


  const abrirQR = (equip) => {
    setEquipSelecionado(equip);
    setModalQR(true);
  };

  const filtrados = equipamentos.filter((e) => {
    const t = busca.toLowerCase();
    return (
      e.patrimonio.toLowerCase().includes(t) ||
      e.nome.toLowerCase().includes(t) ||
      (e.marca || "").toLowerCase().includes(t) ||
      (e.modelo || "").toLowerCase().includes(t) ||
      (e.localizacao || "").toLowerCase().includes(t)
    );
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">
          Equipamentos
        </h2>
        <button
          onClick={() => abrirModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Equipamento
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por patrimônio, nome, marca, modelo, localização..."
            className="w-full pl-10 pr-4 py-3
            border rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            bg-white text-gray-900 placeholder-gray-400
            dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtrados.map((e) => (
          <div
            key={e.id}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 text-xs"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold text-sm">
                  {e.nome}
                </p>
                <p className="text-[11px] text-gray-500">
                  Patrimônio: {e.patrimonio}
                </p>
              </div>
              <span
                className={`px-2 py-1 text-[10px] rounded-full ${
                  e.status === "Funcionando"
                    ? "bg-green-100 text-green-700"
                    : e.status === "Manutenção"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {e.status}
              </span>
            </div>

            <p className="text-gray-600">
              <strong>Marca:</strong>{" "}
              {e.marca || "-"}
            </p>
            <p className="text-gray-600">
              <strong>Modelo:</strong>{" "}
              {e.modelo || "-"}
            </p>
            <p className="text-gray-600 mb-2">
              <strong>Local:</strong>{" "}
              {e.localizacao || "-"}
            </p>

            {e.observacoes && (
              <p className="text-gray-500 line-clamp-2 mb-2">
                {e.observacoes}
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => abrirQR(e)}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
              >
                <QrCode className="w-4 h-4" />
                QR Code
              </button>
              <button
                onClick={() => abrirModal(e)}
                className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => excluirEquipamento(e.id)}
                className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filtrados.length === 0 && (
          <p className="text-sm text-gray-500">
            Nenhum equipamento encontrado.
          </p>
        )}
      </div>

      {modal && (
        <Modal
          titulo={
            equipSelecionado
              ? "Editar Equipamento"
              : "Novo Equipamento"
          }
          onClose={() => setModal(false)}
        >
          <div className="space-y-3 text-sm">
            <div>
              <label className="block mb-1 font-medium">
                Patrimônio
              </label>
              <input
                type="text"
                value={form.patrimonio}
                onChange={(e) =>
                  setForm({
                    ...form,
                    patrimonio: e.target.value,
                  })
                }
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Nome
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) =>
                  setForm({
                    ...form,
                    nome: e.target.value,
                  })
                }
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-medium">
                  Marca
                </label>
                <input
                  type="text"
                  value={form.marca}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      marca: e.target.value,
                    })
                  }
                  className="
                  w-full px-3 py-2 border rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  bg-white text-gray-900 placeholder-gray-400
                  dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block mb-1 font-medium">
                  Modelo
                </label>
                <input
                  type="text"
                  value={form.modelo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      modelo: e.target.value,
                    })
                  }
                  className="
                  w-full px-3 py-2 border rounded-lg
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  bg-white text-gray-900 placeholder-gray-400
                  dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Localização
              </label>
              <input
                type="text"
                value={form.localizacao}
                onChange={(e) =>
                  setForm({
                    ...form,
                    localizacao: e.target.value,
                  })
                }
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value,
                  })
                }
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
              >
                <option value="Funcionando">
                  Funcionando
                </option>
                <option value="Manutenção">
                  Manutenção
                </option>
                <option value="Defeito">Defeito</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">
                Observações
              </label>
              <textarea
                value={form.observacoes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    observacoes: e.target.value,
                  })
                }
                rows={3}
                className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
              />
            </div>

            <button
              onClick={salvarEquipamento}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Salvar
            </button>
          </div>
        </Modal>
      )}

      {modalQR && equipSelecionado && (
        <Modal
          titulo={`QR Code - ${equipSelecionado.nome}`}
          onClose={() => setModalQR(false)}
        >
          <div className="flex flex-col items-center gap-3 text-xs">
            <QRCodeSVG
              value={JSON.stringify({
                patrimonio: equipSelecionado.patrimonio,
                nome: equipSelecionado.nome,
                marca: equipSelecionado.marca,
                modelo: equipSelecionado.modelo,
                localizacao:
                  equipSelecionado.localizacao,
                status: equipSelecionado.status,
              })}
              size={180}
            />
            <p className="text-gray-600 text-center">
              Escaneie para visualizar os dados do
              equipamento.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ==== Calendário ====

const Calendario = ({ preventivas }) => {
  const [current, setCurrent] = useState(() => {
    const d = new Date();
    return {
      year: d.getFullYear(),
      month: d.getMonth(), // 0-11
    };
  });

  const firstDay = new Date(
    current.year,
    current.month,
    1
  ).getDay();
  const daysInMonth = new Date(
    current.year,
    current.month + 1,
    0
  ).getDate();

  const eventosPorDia = {};
  preventivas.forEach((p) => {
    if (!p.data) return;
    const d = new Date(p.data);
    if (
      d.getFullYear() === current.year &&
      d.getMonth() === current.month
    ) {
      const dia = d.getDate();
      eventosPorDia[dia] = eventosPorDia[dia] || [];
      eventosPorDia[dia].push(p);
    }
  });

  const dias = [];
  for (let i = 0; i < firstDay; i++) dias.push(null);
  for (let d = 1; d <= daysInMonth; d++) dias.push(d);

  const mudarMes = (delta) => {
    let m = current.month + delta;
    let y = current.year;

    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }

    setCurrent({ year: y, month: m });
  };

  const nomeMes = (m) =>
    [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ][m];

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-2">
        <h2 className="text-2xl font-bold">
          Calendário de Preventivas
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => mudarMes(-1)}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-sm">
            {nomeMes(current.month)} / {current.year}
          </span>
          <button
            onClick={() => mudarMes(1)}
            className="p-2 rounded-lg bg-white dark:bg-slate-900 shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 text-xs">
        <div className="grid grid-cols-7 gap-1 mb-2 font-semibold text-center">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {dias.map((dia, idx) => {
            const eventos = dia
              ? eventosPorDia[dia] || []
              : [];

            return (
              <div
                key={idx}
                className={`min-h-[60px] border rounded-lg p-1 flex flex-col gap-1 ${
                  dia
                    ? "bg-gray-50 dark:bg-slate-900"
                    : "bg-transparent border-none"
                }`}
              >
                {dia && (
                  <div className="text-[10px] font-semibold text-right">
                    {dia}
                  </div>
                )}

                {eventos.map((p) => (
                  <div
                    key={p.id}
                    className={`px-1 py-0.5 rounded text-[9px] ${
                      p.status === "concluido"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {p.sala}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ==== Configurações ====

const Configuracoes = ({
  usuarioLogado,
  usuarios,
  setUsuarios,
  importarBackup,
}) => {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    nivel: "tecnico",
  });

  if (usuarioLogado.nivel !== "admin") {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4">
        <p className="text-sm text-red-500">
          Apenas administradores podem acessar esta área.
        </p>
      </div>
    );
  }

  const adicionarUsuario = async () => {
  if (
    !form.nome.trim() ||
    !form.email.trim() ||
    !form.senha.trim()
  ) {
    alert("Preencha todos os campos.");
    return;
  }

  try {
    const criado = await criarUsuario({
      nome: form.nome,
      email: form.email,
      senha: form.senha,
      nivel: form.nivel,
      ativo: true,
    });

    setUsuarios((prev) => [...prev, criado]);

    setForm({
      nome: "",
      email: "",
      senha: "",
      nivel: "tecnico",
    });
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    alert("Erro ao criar usuário.");
  }
};


  const toggleAtivo = async (id) => {
  const usuario = usuarios.find((u) => u.id === id);
  if (!usuario) return;

  try {
    const atualizado = await atualizarUsuario(id, {
      ...usuario,
      ativo: !usuario.ativo,
    });

    setUsuarios((prev) =>
      prev.map((u) => (u.id === id ? atualizado : u))
    );
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    alert("Erro ao atualizar usuário.");
  }
};


  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      importarBackup(reader.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Título + Import */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-2xl font-bold">
          Configurações
        </h2>

        <label className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-xs cursor-pointer">
          <Download className="w-4 h-4" />
          Importar Backup (JSON)
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImportFile}
          />
        </label>
      </div>

      {/* Usuários */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 text-xs">
        <h3 className="font-bold mb-2">Usuários</h3>

        <table className="w-full text-[10px]">
          <thead>
            <tr className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500">
              <th className="px-2 py-1 text-left">
                Nome
              </th>
              <th className="px-2 py-1 text-left">
                Email
              </th>
              <th className="px-2 py-1 text-left">
                Nível
              </th>
              <th className="px-2 py-1 text-left">
                Status
              </th>
              <th className="px-2 py-1" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr
                key={u.id}
                className="border-b"
              >
                <td className="px-2 py-1">
                  {u.nome}
                </td>
                <td className="px-2 py-1">
                  {u.email}
                </td>
                <td className="px-2 py-1">
                  {u.nivel}
                </td>
                <td className="px-2 py-1">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] ${
                      u.ativo
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {u.ativo
                      ? "Ativo"
                      : "Inativo"}
                  </span>
                </td>
                <td className="px-2 py-1 text-right">
                  {u.id !== usuarioLogado.id && (
                    <button
                      onClick={() =>
                        toggleAtivo(u.id)
                      }
                      className="px-2 py-1 bg-gray-100 rounded text-[9px] hover:bg-gray-200"
                    >
                      {u.ativo
                        ? "Desativar"
                        : "Ativar"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Adicionar Usuário */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-4 text-xs">
        <h3 className="font-bold mb-2">
          Adicionar Usuário
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
          <input
            type="text"
            placeholder="Nome"
            value={form.nome}
            onChange={(e) =>
              setForm({
                ...form,
                nome: e.target.value,
              })
            }
            className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
          />
          <input
            type="text"
            placeholder="Senha"
            value={form.senha}
            onChange={(e) =>
              setForm({
                ...form,
                senha: e.target.value,
              })
            }
            className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
          />
          <select
            value={form.nivel}
            onChange={(e) =>
              setForm({
                ...form,
                nivel: e.target.value,
              })
            }
            className="
                w-full px-3 py-2 border rounded-lg
                focus:ring-2 focus:ring-blue-500 focus:border-transparent
                bg-white text-gray-900 placeholder-gray-400
                dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 dark:placeholder-slate-500"
          >
            <option value="tecnico">
              Técnico
            </option>
            <option value="admin">
              Admin
            </option>
          </select>
        </div>

        <button
          onClick={adicionarUsuario}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs"
        >
          Adicionar
        </button>
      </div>
    </div>
  );
};

// ==== Modal Genérico ====

const Modal = ({ titulo, onClose, children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">
          {titulo}
        </h3>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-slate-200" />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

// ==== Busca Global ====

const GlobalSearchModal = ({
  open,
  term,
  setTerm,
  chamados,
  estoque,
  preventivas,
  equipamentos,
  onClose,
  onSelect,
}) => {
  if (!open) return null;

  const t = term.toLowerCase();
  const match = (v) =>
    v && v.toLowerCase().includes(t);

  const resultados =
    t.length > 1
      ? [
          // Chamados
          ...chamados
            .filter(
              (c) =>
                match(c.titulo) ||
                match(c.sala) ||
                match(c.descricao)
            )
            .slice(0, 10)
            .map((c) => ({
              id: c.id,
              modulo: "chamados",
              label: c.titulo,
              desc: `Sala ${c.sala} • ${c.status}`,
            })),

          // Estoque
          ...estoque
            .filter(
              (e) =>
                match(e.nome) ||
                match(e.categoria) ||
                match(e.localizacao)
            )
            .slice(0, 10)
            .map((e) => ({
              id: e.id,
              modulo: "estoque",
              label: e.nome,
              desc: `Qtd ${e.quantidade} • ${e.localizacao}`,
            })),

          // Preventivas
          ...preventivas
            .filter(
              (p) =>
                match(p.sala) ||
                match(p.tecnico)
            )
            .slice(0, 10)
            .map((p) => ({
              id: p.id,
              modulo: "preventivas",
              label: `Preventiva ${p.sala}`,
              desc: `${p.data} • ${p.status}`,
            })),

          // Equipamentos
          ...equipamentos
            .filter(
              (e) =>
                match(e.patrimonio) ||
                match(e.nome) ||
                match(e.marca) ||
                match(e.modelo)
            )
            .slice(0, 10)
            .map((e) => ({
              id: e.id,
              modulo: "equipamentos",
              label: `${e.nome} (${e.patrimonio})`,
              desc: `${e.marca} ${e.modelo} • ${e.localizacao}`,
            })),
        ]
      : [];

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center pt-20 px-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[70vh] flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            autoFocus
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Busque em chamados, estoque, preventivas e equipamentos..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 text-xs">
          {t.length <= 1 && (
            <p className="text-gray-500">
              Digite pelo menos 2 caracteres para buscar.
            </p>
          )}

          {t.length > 1 && resultados.length === 0 && (
            <p className="text-gray-500">
              Nenhum resultado encontrado.
            </p>
          )}

          {resultados.map((r) => (
            <button
              key={`${r.modulo}-${r.id}`}
              onClick={() => onSelect(r.modulo)}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 flex flex-col gap-0.5"
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[9px] rounded-full bg-blue-100 text-blue-700 uppercase">
                  {r.modulo}
                </span>
                <span className="font-semibold text-[11px]">
                  {r.label}
                </span>
              </div>
              <span className="text-[10px] text-gray-600">
                {r.desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
