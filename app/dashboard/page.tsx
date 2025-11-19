"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import ServerConfigForm from "@/components/ServerConfigForm";
import RoomLinkCard from "@/components/RoomLinkCard";

// ===============================================================
// INTERFACES
// ===============================================================
interface Server {
  id: string;
  name: string;
  pm2ProcessName?: string;
  status: string;
  roomLink?: string;
  subscriptionStatus: string;
  nextBillingDate?: string;
  maxPlayers: number;
  playerCount: number;
  map?: string;
  password?: string;
  isPublic: boolean;
  token?: string;
  needsProvision: boolean;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  playerName: string;
  playerId: number;
  message: string;
  team?: string;
  createdAt: string;
}

interface Replay {
  id: string;
  fileName: string;
  fileData?: Buffer;
  fileUrl?: string;
  scores: { red: number; blue: number; time: number };
  redTeam: string[];
  blueTeam: string[];
  possession: { red: number; blue: number };
  duration: string;
  createdAt: string;
}

interface PlayerEntry {
  id: string;
  playerName: string;
  playerId: number;
  conn?: string;
  auth?: string;
  ipv4?: string;
  eventType: string;
  createdAt: string;
}

interface Report {
  id: string;
  reporterName: string;
  reportedName: string;
  reportedId: number;
  reason: string;
  type: string;
  status: string;
  createdAt: string;
}

interface Ban {
  id: string;
  bannedPlayerName: string;
  bannedPlayerId: number;
  bannedPlayerConn: string;
  bannedBy: string;
  reason: string;
  duration: number;
  isActive: boolean;
  createdAt: string;
}

interface AdminLog {
  id: string;
  action: string;
  adminName: string;
  details?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Estados principais
  const [servers, setServers] = useState<Server[]>([]);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [controlLoading, setControlLoading] = useState(false);
  
  // Estados de dados
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [replays, setReplays] = useState<Replay[]>([]);
  const [entries, setEntries] = useState<PlayerEntry[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [bans, setBans] = useState<Ban[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);

  // Redirect se não autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Buscar servidores ao autenticar
  useEffect(() => {
    if (status === "authenticated") {
      fetchServers();
    }
  }, [status]);

  // Buscar dados do servidor selecionado
  useEffect(() => {
    if (selectedServer) {
      fetchServerData();
      
      // Auto-refresh a cada 30 segundos
      const interval = setInterval(fetchServerData, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedServer]);

  // ===============================================================
  // FUNÇÕES DE FETCH
  // ===============================================================
  
  async function fetchServers() {
    try {
      const response = await fetch("/api/servers");
      if (response.ok) {
        const data = await response.json();
        setServers(data.servers);
        if (data.servers.length > 0) {
          setSelectedServer(data.servers[0]);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar servidores:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchServerData() {
    if (!selectedServer) return;
    
    try {
      // Buscar chat
      const chatRes = await fetch(`/api/servers/${selectedServer.id}/chat?limit=50`);
      if (chatRes.ok) {
        const chatData = await chatRes.json();
        setChatMessages(chatData.messages || []);
      }

      // Buscar replays
      const replaysRes = await fetch(`/api/servers/${selectedServer.id}/replays?limit=10`);
      if (replaysRes.ok) {
        const replaysData = await replaysRes.json();
        setReplays(replaysData.replays || []);
      }

      // Buscar entradas
      const entriesRes = await fetch(`/api/servers/${selectedServer.id}/entries?limit=20`);
      if (entriesRes.ok) {
        const entriesData = await entriesRes.json();
        setEntries(entriesData.entries || []);
      }

      // Buscar denúncias
      const reportsRes = await fetch(`/api/servers/${selectedServer.id}/reports`);
      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.reports || []);
      }

      // Buscar bans
      const bansRes = await fetch(`/api/servers/${selectedServer.id}/bans`);
      if (bansRes.ok) {
        const bansData = await bansRes.json();
        setBans(bansData.bans || []);
      }

      // Buscar admin logs
      const logsRes = await fetch(`/api/servers/${selectedServer.id}/admin-logs?limit=20`);
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAdminLogs(logsData.logs || []);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  }

  // ===============================================================
  // FUNÇÕES DE CONTROLE
  // ===============================================================

  async function handleServerControl(action: "start" | "stop" | "restart") {
    if (!selectedServer || controlLoading) return;
    
    const confirmMessage = {
      start: "Tem certeza que deseja INICIAR o servidor?",
      stop: "Tem certeza que deseja PARAR o servidor?",
      restart: "Tem certeza que deseja REINICIAR o servidor?",
    };

    if (!confirm(confirmMessage[action])) return;

    setControlLoading(true);
    
    try {
      const response = await fetch(`/api/servers/${selectedServer.id}/control`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${data.message}`);
        fetchServerData();
      } else {
        alert(`❌ Erro: ${data.error}\n${data.details || ""}`);
      }
    } catch (error: any) {
      alert(`❌ Erro fatal: ${error.message}`);
    } finally {
      setControlLoading(false);
    }
  }

  async function handleClearAllBans() {
    if (!selectedServer) return;

    if (!confirm("⚠️ Tem certeza que deseja limpar TODOS os bans?")) return;

    try {
      const response = await fetch(`/api/servers/${selectedServer.id}/bans/clear`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${data.message}`);
        fetchServerData();
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Erro: ${error.message}`);
    }
  }

  async function handleUnban(ban: Ban) {
    if (!selectedServer) return;

    if (!confirm(`Desbanir ${ban.bannedPlayerName}?`)) return;

    try {
      const response = await fetch(`/api/servers/${selectedServer.id}/bans/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banId: ban.id }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${data.message}`);
        fetchServerData();
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Erro: ${error.message}`);
    }
  }

  async function handleReportAction(report: Report, newStatus: string) {
    if (!selectedServer) return;

    try {
      const response = await fetch(
        `/api/servers/${selectedServer.id}/reports/${report.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${data.message}`);
        fetchServerData();
      } else {
        alert(`❌ Erro: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Erro: ${error.message}`);
    }
  }

  async function downloadReplay(replay: Replay) {
    try {
      // Se houver fileUrl, abra direto
      if (replay.fileUrl) {
        window.open(replay.fileUrl, "_blank");
        return;
      }

      // Se houver fileData, baixe como Blob
      if (replay.fileData) {
        // fileData vem como Buffer do Prisma, mas no JSON vira objeto
        // Precisamos converter para Uint8Array
        const uint8Array = new Uint8Array(Object.values(replay.fileData as any));
        const blob = new Blob([uint8Array], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = replay.fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert("❌ Arquivo de replay não disponível");
      }
    } catch (error: any) {
      alert(`❌ Erro ao baixar replay: ${error.message}`);
    }
  }

  // ===============================================================
  // LOADING E SEM SESSÃO
  // ===============================================================

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mb-4"></div>
          <p className="text-gray-400 text-xl">Carregando seu painel...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // ===============================================================
  // FUNÇÕES AUXILIARES
  // ===============================================================

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "inactive": return "bg-yellow-500";
      case "offline": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active": return "🟢 Online";
      case "inactive": return "🟡 Inativo";
      case "offline": return "🔴 Offline";
      default: return "⚪ Desconhecido";
    }
  };

  const getTeamBadge = (team?: string) => {
    switch (team) {
      case "RED": return <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded">🔴 Red</span>;
      case "BLUE": return <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded">🔵 Blue</span>;
      case "SPEC": return <span className="bg-gray-500/20 text-gray-400 text-xs px-2 py-0.5 rounded">⚪ Spec</span>;
      default: return null;
    }
  };

  // ===============================================================
  // RENDER
  // ===============================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
      {/* Fixed Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 via-transparent to-blue-900/5"></div>
      </div>

      {/* Header */}
      <header className="bg-gray-900/90 border-b border-purple-500/20 sticky top-0 z-50 backdrop-blur-lg shadow-xl">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="transition-transform hover:scale-105 duration-300">
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  HAXHOST
                </div>
              </Link>
              <div className="h-8 w-px bg-gray-700"></div>
              <h1 className="text-xl font-bold text-white">Painel de Controle</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm text-gray-400">Bem-vindo,</p>
                <p className="text-white font-semibold">{session.user?.name || "Usuário"}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                {(session.user?.name || "U").substring(0, 2).toUpperCase()}
              </div>
              <button
                onClick={() => signOut()}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition-all duration-300 border border-red-500/20 hover:scale-105"
              >
                Sair
              </button>
            </div>
          </div>
        </nav>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Seleção de Servidor */}
        {servers.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <label className="block text-gray-400 mb-2 text-sm font-medium">
              Selecione o Servidor
            </label>
            <select
              value={selectedServer?.id || ""}
              onChange={(e) => {
                const server = servers.find((s) => s.id === e.target.value);
                setSelectedServer(server || null);
              }}
              className="w-full md:w-auto bg-gray-800/50 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            >
              {servers.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.name}
                </option>
              ))}
            </select>
          </motion.div>
        )}

        {!selectedServer ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <ServerConfigForm
              server={null}
              onServerCreated={(server) => {
                setServers([server]);
                setSelectedServer(server);
              }}
            />
          </motion.div>
        ) : (
          <>
            {/* Cards de Status */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-4xl">🎮</div>
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(selectedServer.subscriptionStatus)} animate-pulse`}></div>
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Status do Servidor</h3>
                <p className="text-2xl font-bold text-white">{getStatusText(selectedServer.subscriptionStatus)}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 hover:scale-105"
              >
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Jogadores Online</h3>
                <p className="text-2xl font-bold text-white">
                  {selectedServer.playerCount || 0} / {selectedServer.maxPlayers}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-green-500/30 transition-all duration-300 hover:scale-105"
              >
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Mensagens</h3>
                <p className="text-2xl font-bold text-white">{chatMessages.length}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 hover:border-red-500/30 transition-all duration-300 hover:scale-105"
              >
                <div className="text-4xl mb-4">🚨</div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">Denúncias Pendentes</h3>
                <p className="text-2xl font-bold text-white">
                  {reports.filter(r => r.status === "pending").length}
                </p>
              </motion.div>
            </div>

            {/* Informações do Servidor + Controles */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 mb-8"
            >
              <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                    {selectedServer.name}
                  </h2>
                  <p className="text-gray-400">
                    Criado em {new Date(selectedServer.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    PM2: {selectedServer.pm2ProcessName}
          </p>
        </div>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => handleServerControl("start")}
                    disabled={controlLoading}
                    className="bg-green-500/10 hover:bg-green-500/20 text-green-400 px-6 py-3 rounded-lg font-semibold transition-all border border-green-500/20 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {controlLoading ? "..." : "▶️ Iniciar"}
                  </button>
                  <button
                    onClick={() => handleServerControl("stop")}
                    disabled={controlLoading}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-6 py-3 rounded-lg font-semibold transition-all border border-red-500/20 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {controlLoading ? "..." : "⏹️ Parar"}
                  </button>
                  <button
                    onClick={() => handleServerControl("restart")}
                    disabled={controlLoading}
                    className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-6 py-3 rounded-lg font-semibold transition-all border border-blue-500/20 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {controlLoading ? "..." : "🔄 Reiniciar"}
                  </button>
                </div>
              </div>

              <RoomLinkCard
                roomLink={selectedServer.roomLink}
                serverName={selectedServer.name}
              />
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { id: "overview", label: "📊 Visão Geral" },
                { id: "config", label: "⚙️ Configuração" },
                { id: "chat", label: "💬 Chat" },
                { id: "replays", label: "🎬 Replays" },
                { id: "players", label: "👥 Jogadores" },
                { id: "moderation", label: "🛡️ Moderação" },
                { id: "logs", label: "📜 Logs Admin" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white scale-105"
                      : "bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Conteúdo das Tabs */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* ==================== VISÃO GERAL ==================== */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Últimas Mensagens */}
                      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          💬 Últimas Mensagens
                        </h3>
                        {chatMessages.slice(-5).length === 0 ? (
                          <div className="text-center py-8 text-gray-400">Nenhuma mensagem</div>
                        ) : (
                          <div className="space-y-2">
                            {chatMessages.slice(-5).map((msg) => (
                              <div key={msg.id} className="bg-gray-900/50 rounded-lg p-3 text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-white">{msg.playerName}</span>
                                  {getTeamBadge(msg.team)}
                                </div>
                                <p className="text-gray-300 truncate">{msg.message}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Denúncias Pendentes */}
                      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          🚨 Denúncias Pendentes
                        </h3>
                        {reports.filter(r => r.status === "pending").length === 0 ? (
                          <div className="text-center py-8 text-gray-400">✅ Nenhuma denúncia</div>
                        ) : (
                          <div className="space-y-2">
                            {reports.filter(r => r.status === "pending").slice(0, 3).map((report) => (
                              <div key={report.id} className="bg-red-500/10 rounded-lg p-3 text-sm border border-red-500/20">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-red-400 font-semibold">{report.reportedName}</span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(report.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-gray-300 text-xs truncate">{report.reason}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Últimos Replays */}
                    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        🎬 Últimos Replays
                      </h3>
                      {replays.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">Nenhum replay</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {replays.slice(0, 3).map((replay) => (
                            <div key={replay.id} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
                              <div className="text-center mb-3">
                                <div className="text-2xl font-bold">
                                  <span className="text-red-400">{replay.scores.red}</span>
                                  {" x "}
                                  <span className="text-blue-400">{replay.scores.blue}</span>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">{replay.duration}</div>
                              </div>
                              <button
                                onClick={() => downloadReplay(replay)}
                                className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg text-sm font-semibold transition-all"
                              >
                                📥 Baixar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ==================== CONFIGURAÇÃO ==================== */}
                {activeTab === "config" && (
                  <ServerConfigForm
                    server={selectedServer}
                    onServerUpdated={(updatedServer) => {
                      setSelectedServer(updatedServer);
                      setServers(servers.map(s => s.id === updatedServer.id ? updatedServer : s));
                      fetchServerData(); // Recarregar dados após atualização
                    }}
                  />
                )}

                {/* ==================== CHAT ==================== */}
                {activeTab === "chat" && (
                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      💬 Chat Global <span className="text-sm text-gray-400 font-normal">({chatMessages.length} mensagens)</span>
                    </h3>
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        Nenhuma mensagem ainda
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30 hover:border-purple-500/30 transition-all"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                                {msg.playerName.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-semibold text-white">{msg.playerName}</span>
                                  {getTeamBadge(msg.team)}
                                  <span className="text-gray-500 text-xs">
                                    ID: {msg.playerId}
                                  </span>
                                  <span className="text-gray-500 text-xs ml-auto">
                                    {new Date(msg.createdAt).toLocaleString("pt-BR")}
                                  </span>
                                </div>
                                <p className="text-gray-300">{msg.message}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ==================== REPLAYS ==================== */}
                {activeTab === "replays" && (
                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      🎬 Replays das Partidas
                    </h3>
                    {replays.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        Nenhum replay gravado ainda
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {replays.map((replay) => (
                          <div
                            key={replay.id}
                            className="bg-gray-900/50 rounded-lg p-6 border border-gray-700/30 hover:border-purple-500/30 transition-all hover:scale-105"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-white font-semibold text-sm truncate">
                                {replay.fileName}
                              </h4>
                            </div>
                            
                            <div className="text-center mb-4">
                              <div className="text-3xl font-bold">
                                <span className="text-red-400">{replay.scores.red}</span>
                                {" x "}
                                <span className="text-blue-400">{replay.scores.blue}</span>
                              </div>
                              <div className="text-gray-400 text-sm mt-1">{replay.duration}</div>
                            </div>

                            {/* Times */}
                            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                              <div className="bg-red-500/10 rounded p-2">
                                <div className="text-red-400 font-semibold mb-1">🔴 Time Red</div>
                                {replay.redTeam.map((p, i) => (
                                  <div key={i} className="text-gray-300 truncate">{p}</div>
                                ))}
                              </div>
                              <div className="bg-blue-500/10 rounded p-2">
                                <div className="text-blue-400 font-semibold mb-1">🔵 Time Blue</div>
                                {replay.blueTeam.map((p, i) => (
                                  <div key={i} className="text-gray-300 truncate">{p}</div>
                                ))}
                              </div>
                            </div>

                            {/* Posse */}
                            <div className="mb-4">
                              <div className="text-gray-400 text-xs mb-2">Posse de Bola</div>
                              <div className="flex h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-red-500"
                                  style={{ width: `${replay.possession.red}%` }}
                                />
                                <div
                                  className="bg-blue-500"
                                  style={{ width: `${replay.possession.blue}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-xs mt-1">
                                <span className="text-red-400">{replay.possession.red.toFixed(1)}%</span>
                                <span className="text-blue-400">{replay.possession.blue.toFixed(1)}%</span>
                              </div>
                            </div>

                            <div className="text-gray-500 text-xs mb-3 text-center">
                              {new Date(replay.createdAt).toLocaleString("pt-BR")}
                            </div>

                            <button
                              onClick={() => downloadReplay(replay)}
                              className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg font-semibold transition-all hover:scale-105"
                            >
                              📥 Baixar Replay (.hbr2)
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ==================== JOGADORES ==================== */}
                {activeTab === "players" && (
                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      👥 Logs de Entrada/Saída
                    </h3>
                    {entries.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        Nenhuma atividade registrada
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {entries.map((entry) => (
                          <div
                            key={entry.id}
                            className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30 hover:border-purple-500/30 transition-all"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-3">
                                <div className="text-2xl">
                                  {entry.eventType === "PLAYER_JOIN" ? "➡️" : "⬅️"}
                                </div>
                                <div>
                                  <p className="text-white font-semibold">{entry.playerName}</p>
                                  <div className="flex gap-2 text-xs text-gray-400 flex-wrap">
                                    <span>ID: {entry.playerId}</span>
                                    {entry.conn && <span>Conn: {entry.conn}</span>}
                                    {entry.auth && <span>Auth: {entry.auth}</span>}
                                    {entry.ipv4 && <span>IP: {entry.ipv4}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-semibold ${entry.eventType === "PLAYER_JOIN" ? "text-green-400" : "text-red-400"}`}>
                                  {entry.eventType === "PLAYER_JOIN" ? "Entrou" : "Saiu"}
                                </p>
                                <span className="text-gray-500 text-xs">
                                  {new Date(entry.createdAt).toLocaleString("pt-BR")}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ==================== MODERAÇÃO ==================== */}
                {activeTab === "moderation" && (
                  <div className="space-y-6">
                    {/* Denúncias */}
                    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                      <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        🚨 Denúncias
                      </h3>
                      {reports.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                          ✅ Nenhuma denúncia registrada
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {reports.map((report) => (
                            <div
                              key={report.id}
                              className={`bg-gray-900/50 rounded-lg p-6 border transition-all ${
                                report.status === "pending"
                                  ? "border-red-500/30 hover:border-red-500/50"
                                  : "border-gray-700/30 opacity-60"
                              }`}
                            >
                              <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className="text-yellow-400 font-semibold">{report.reporterName}</span>
                                    <span className="text-gray-500">denunciou</span>
                                    <span className="text-red-400 font-semibold">{report.reportedName}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      report.type === "TROLL"
                                        ? "bg-orange-500/20 text-orange-400"
                                        : "bg-red-500/20 text-red-400"
                                    }`}>
                                      {report.type}
                                    </span>
                                  </div>
                                  <p className="text-gray-300">{report.reason}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    report.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : report.status === "resolved"
                                      ? "bg-green-500/20 text-green-400"
                                      : "bg-gray-500/20 text-gray-400"
                                  }`}>
                                    {report.status.toUpperCase()}
                                  </span>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(report.createdAt).toLocaleString("pt-BR")}
                                  </div>
                                </div>
                              </div>
                              {report.status === "pending" && (
                                <div className="flex gap-2 flex-wrap">
                                  <button
                                    onClick={() => handleReportAction(report, "resolved")}
                                    className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-semibold transition-all"
                                  >
                                    ✅ Resolver
                                  </button>
                                  <button
                                    onClick={() => handleReportAction(report, "ignored")}
                                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg font-semibold transition-all"
                                  >
                                    🚫 Ignorar
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bans */}
                    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                          ⛔ Jogadores Banidos ({bans.filter(b => b.isActive).length})
                        </h3>
                        {bans.filter(b => b.isActive).length > 0 && (
                          <button
                            onClick={handleClearAllBans}
                            className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-semibold transition-all hover:scale-105"
                          >
                            🧹 Limpar Todos os Bans
                          </button>
                        )}
                      </div>
                      {bans.filter(b => b.isActive).length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                          ✅ Nenhum jogador banido
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {bans.filter(b => b.isActive).map((ban) => (
                            <div
                              key={ban.id}
                              className="bg-red-500/10 rounded-lg p-4 border border-red-500/30 hover:border-red-500/50 transition-all"
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="text-red-400 font-semibold text-lg">{ban.bannedPlayerName}</span>
                                    <span className="text-xs text-gray-500">ID: {ban.bannedPlayerId}</span>
                                  </div>
                                  <div className="text-sm text-gray-300 mb-1">
                                    <span className="text-gray-400">Motivo:</span> {ban.reason}
                                  </div>
                                  <div className="text-xs text-gray-400 flex gap-3 flex-wrap">
                                    <span>Banido por: {ban.bannedBy}</span>
                                    <span>Duração: {ban.duration} min</span>
                                    <span>Conn: {ban.bannedPlayerConn}</span>
                                    <span>{new Date(ban.createdAt).toLocaleString("pt-BR")}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleUnban(ban)}
                                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-semibold transition-all hover:scale-105"
                                >
                                  ✅ Desbanir
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ==================== LOGS ADMIN ==================== */}
                {activeTab === "logs" && (
                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                      📜 Logs de Administração
                    </h3>
                    {adminLogs.length === 0 ? (
                      <div className="text-center py-12 text-gray-400">
                        Nenhum log de admin registrado
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {adminLogs.map((log) => (
                          <div
                            key={log.id}
                            className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30 hover:border-purple-500/30 transition-all"
                          >
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                                    log.action.includes("LOGIN")
                                      ? "bg-blue-500/20 text-blue-400"
                                      : log.action.includes("BAN")
                                      ? "bg-red-500/20 text-red-400"
                                      : log.action.includes("CLEAR")
                                      ? "bg-yellow-500/20 text-yellow-400"
                                      : "bg-purple-500/20 text-purple-400"
                                  }`}>
                                    {log.action}
                                  </span>
                                  <span className="text-white font-semibold">{log.adminName}</span>
                                </div>
                                {log.details && <p className="text-gray-300 text-sm">{log.details}</p>}
                              </div>
                              <span className="text-gray-500 text-xs whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString("pt-BR")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
