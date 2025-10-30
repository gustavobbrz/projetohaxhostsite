"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

interface RoomStatus {
  name: string;
  status: "online" | "offline";
  playerCount?: number;
  maxPlayers?: number;
  roomLink?: string;
  lastUpdate?: string;
  serverId?: string;
}

export default function Home() {
  // Mapa de nomes bonitos para as salas
  const roomNameMap: Record<string, string> = {
    dd: "⚫️🟣 FUTSAL DO DD 24HRS 🟣⚫️",
    "haxball-server": "🔵⚫ FUTSAL DA AZZURASHIN HC 🔵⚫",
  };

  const [rooms, setRooms] = useState<RoomStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  useEffect(() => {
    fetchStatus();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchStatus() {
    try {
      const response = await fetch("/api/get-status");
      const data = await response.json();
      if (data.success) {
        setRooms(data.rooms);
        setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
      }
    } catch (error) {
      console.error("Erro ao buscar status:", error);
    } finally {
      setLoading(false);
    }
  }

  const onlineCount = rooms.filter((r) => r.status === "online").length;
  const offlineCount = rooms.filter((r) => r.status === "offline").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/5 via-transparent to-blue-900/5"></div>
      </div>
      {/* Header - Navbar */}
      <header className="bg-gray-900/90 border-b border-purple-500/20 sticky top-0 z-50 backdrop-blur-lg shadow-xl">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo e Subtítulo - Esquerda */}
            <div className="flex flex-col items-center transition-transform hover:scale-105 duration-300">
              <Image
                src="/logos/haxhost-logo.png"
                alt="HaxHost Logo"
                width={160}
                height={53}
                className="h-14 w-auto"
                priority
              />
              <p className="text-gray-400 text-sm font-light mt-1 tracking-wider">
                HaxHost
              </p>
            </div>

            {/* Links de Navegação - Direita */}
            <div className="hidden md:flex items-center gap-2">
              <a
                href="#salas-online"
                className="text-white hover:text-purple-400 font-semibold px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-blue-600/20 hover:scale-105"
              >
                Salas Online
              </a>
              <a
                href="#planos"
                className="text-white hover:text-purple-400 font-semibold px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-blue-600/20 hover:scale-105"
              >
                Planos
              </a>
              <a
                href="#comunidade"
                className="text-white hover:text-purple-400 font-semibold px-4 py-2 rounded-lg transition-all duration-300 hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-blue-600/20 hover:scale-105"
              >
                Comunidade
              </a>
            </div>

            {/* Menu Mobile (Placeholder) */}
            <button className="md:hidden text-white p-2 hover:bg-gray-800 rounded-lg transition-all">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Enhanced Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-blue-900/10 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-transparent to-gray-900"></div>
        </div>

        <div className="container mx-auto px-4 py-16 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-6xl md:text-7xl font-extrabold mb-6 game-font tracking-tight"
          >
            <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Hospedagem Descomplicada
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Tenha sua sala 24/7 com integração ao Discord e sistema
            personalizado. Suporte para seu time ou campeonato.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap gap-6 justify-center"
          >
            <a
              href="#planos"
              className="btn-primary text-lg px-10 py-5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300"
            >
              Ver Planos 🚀
            </a>
            <a
              href="#comunidade"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-lg px-10 py-5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-bold border border-gray-700 hover:border-purple-500/50 shadow-lg hover:shadow-purple-500/20 hover:scale-105 transition-all duration-300"
            >
              Discord Community 💬
            </a>
          </motion.div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-16 space-y-24">
        {/* Seção 1: Status das Salas */}
        <section id="salas-online" className="space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-3 tracking-tight"
              >
                Status das Salas
              </motion.h2>
              <p className="text-gray-300 text-lg">
                Monitoramento em tempo real
              </p>
            </div>
            {lastUpdate && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="text-sm text-gray-300 bg-gray-800/70 px-4 py-2 rounded-full border border-gray-700/50 backdrop-blur-sm shadow-inner"
              >
                🕒 Última atualização: {lastUpdate}
              </motion.div>
            )}
          </div>

          {/* Estatísticas */}
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <motion.div
              variants={item}
              className="card glow-effect hover:scale-[1.02] hover:shadow-purple-500/10 transition-all duration-300"
            >
              <div className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">
                Total de Salas
              </div>
              <div className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {rooms.length}
              </div>
            </motion.div>
            <motion.div
              variants={item}
              className="card glow-effect hover:scale-[1.02] hover:shadow-green-500/10 transition-all duration-300"
            >
              <div className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">
                Online
              </div>
              <div className="text-5xl font-extrabold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                {onlineCount}
              </div>
            </motion.div>
            <motion.div
              variants={item}
              className="card glow-effect hover:scale-[1.02] hover:shadow-red-500/10 transition-all duration-300"
            >
              <div className="text-gray-400 text-sm font-semibold mb-3 uppercase tracking-wider">
                Offline
              </div>
              <div className="text-5xl font-extrabold bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">
                {offlineCount}
              </div>
            </motion.div>
          </motion.div>

          {/* Lista de Salas */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="glass-card border border-gray-700/30 rounded-2xl p-6 shadow-2xl glow-effect"
          >
            {loading ? (
              <div className="text-center text-gray-400 py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
                <p className="text-lg game-font">Carregando status...</p>
              </div>
            ) : rooms.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <p className="text-lg game-font">Nenhuma sala encontrada</p>
              </div>
            ) : (
              <div
                className="grid gap-6"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                }}
              >
                {rooms.map((room, index) => (
                  <motion.div
                    key={index}
                    variants={item}
                    className="glass-card flex flex-col gap-3 p-6 hover:scale-[1.02] transition-all duration-300 group"
                  >
                    {/* Header com status */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          room.status === "online"
                            ? "bg-green-500 animate-pulse-glow"
                            : "bg-red-500"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate game-font">
                          {roomNameMap[room.name] || room.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {room.serverId || "N/A"}
                        </div>
                      </div>
                      <div
                        className={`text-sm font-medium flex-shrink-0 ${
                          room.status === "online"
                            ? "text-green-400"
                            : "text-red-400"
                        } game-font`}
                      >
                        {room.status}
                      </div>
                    </div>

                    {/* Contagem de jogadores com barra de progresso */}
                    {room.playerCount !== undefined &&
                      room.maxPlayers !== undefined && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-400">Jogadores:</span>
                            <span className="text-white font-medium">
                              {room.playerCount} / {room.maxPlayers}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                              style={{
                                width: `${
                                  (room.playerCount / room.maxPlayers) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      )}

                    {/* Botão Jogar Agora com efeito de hover melhorado */}
                    {room.status === "online" && room.roomLink && (
                      <a
                        href={room.roomLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary w-full text-center text-sm group-hover:shadow-lg group-hover:shadow-purple-500/30"
                      >
                        <span className="inline-flex items-center justify-center gap-2">
                          <span className="group-hover:animate-pulse">🎮</span>
                          <span className="game-font">Jogar Agora</span>
                        </span>
                      </a>
                    )}

                    {/* Botão desabilitado quando offline com visual melhorado */}
                    {(room.status === "offline" || !room.roomLink) && (
                      <button
                        disabled
                        className="w-full bg-gray-800/50 text-gray-500 font-medium py-3 px-4 rounded-lg cursor-not-allowed text-sm border border-gray-700/50 transition-all duration-300 game-font"
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                          <span>Sala Offline</span>
                        </span>
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </section>

        {/* Seção 2: Nossos Planos e Scripts Premium */}
        <section id="planos" className="space-y-10">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
              ⭐ Nossos Planos e Scripts Premium
            </h2>
            <p className="text-gray-300 text-xl leading-relaxed">
              Cansado de salas comuns? Eleve o nível do seu clube/servidor com
              uma{" "}
              <span className="text-purple-400 font-bold">Sala Premium</span>{" "}
              turbinada com um{" "}
              <span className="text-blue-400 font-bold">Script Exclusivo</span>,
              desenvolvido 100% do zero por mim!
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-10 lg:items-stretch">
            {/* Plano Completo */}
            <div className="flex-1 bg-gradient-to-br from-purple-600/30 to-blue-600/30 backdrop-blur-sm border-2 border-purple-500 rounded-2xl p-10 hover:scale-[1.03] hover:shadow-2xl hover:shadow-purple-500/30 transition-all duration-300 relative flex flex-col">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold px-8 py-2 rounded-full shadow-xl animate-pulse">
                ⭐ RECOMENDADO
              </div>

              <h3 className="text-3xl font-extrabold text-white mb-4 flex items-center gap-2">
                🚀 Plano Completo: Sala Premium Haxball
              </h3>

              <div className="mb-8">
                <div className="text-6xl font-extrabold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  R$ 40<span className="text-3xl text-gray-400">/mês</span>
                </div>
              </div>

              <p className="text-gray-300 mb-6 leading-relaxed">
                Integração total com o Discord para uma experiência de
                gerenciamento e comunicação inigualável.
              </p>

              <div className="space-y-4 mb-8">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Recursos Inclusos:
                </h4>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 bg-gray-900/50 p-3 rounded-lg">
                    <span className="text-green-400 text-xl flex-shrink-0">
                      💬
                    </span>
                    <div>
                      <div className="text-white font-semibold mb-1">
                        Chat Global Bidirecional (API Discord)
                      </div>
                      <div className="text-gray-400 text-sm">
                        Converse diretamente com os jogadores que estão na sala
                        através do canal #chat-global. Nunca perca a
                        comunicação!
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-900/50 p-3 rounded-lg">
                    <span className="text-green-400 text-xl flex-shrink-0">
                      🎬
                    </span>
                    <div>
                      <div className="text-white font-semibold mb-1">
                        Sistema de Replay Automático
                      </div>
                      <div className="text-gray-400 text-sm">
                        Toda partida é gravada e o arquivo .hbr2 é enviado
                        automaticamente para #replay com estatísticas (Placar,
                        Jogadores, Posse de Bola).
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-900/50 p-3 rounded-lg">
                    <span className="text-green-400 text-xl flex-shrink-0">
                      📊
                    </span>
                    <div>
                      <div className="text-white font-semibold mb-1">
                        Canais de Administração e Logs Completos
                      </div>
                      <div className="text-gray-400 text-sm space-y-1">
                        <div>
                          • <strong>#entrada</strong>: Registra quem entra
                          (IP/Auth e con)
                        </div>
                        <div>
                          • <strong>#log-admin</strong>: Monitora logins de
                          admin, kicks e bans
                        </div>
                        <div>
                          • <strong>#denúncias</strong>: Receba denúncias de
                          abuso/troll em tempo real
                        </div>
                        <div>
                          • <strong>#clear-bans</strong>: Limpe bans facilmente
                          por comandos no Discord
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-gray-900/50 p-3 rounded-lg">
                    <span className="text-green-400 text-xl flex-shrink-0">
                      🏆
                    </span>
                    <div>
                      <div className="text-white font-semibold mb-1">
                        Ranking e Atualizações
                      </div>
                      <div className="text-gray-400 text-sm">
                        Canais opcionais para organizar seu campeonato e manter
                        os membros informados.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <a
                href="https://discord.gg/tVWmwXjjWx"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-extrabold py-5 rounded-xl transition-all duration-300 text-center text-lg shadow-lg hover:shadow-purple-500/50 hover:scale-105"
              >
                🎯 Quero Contratar Agora
              </a>
            </div>

            {/* Apenas o Script */}
            <div className="flex-1 bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur-sm border-2 border-blue-500/30 rounded-2xl p-10 hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 flex flex-col">
              <h3 className="text-3xl font-extrabold text-white mb-4 flex items-center gap-2">
                📝 Apenas o Script Personalizado
              </h3>

              <div className="mb-8">
                <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                  Preço a combinar
                </div>
              </div>

              <p className="text-gray-300 mb-6 leading-relaxed">
                Se você já tem sua infraestrutura, pode adquirir apenas o script
                personalizado, desenvolvido para atender suas necessidades
                específicas de comandos e automações.
              </p>

              <div className="space-y-3 mb-8">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Vantagens:
                </h4>

                <div className="flex items-start gap-3">
                  <span className="text-green-400 flex-shrink-0">✓</span>
                  <div className="text-gray-300">
                    <strong className="text-white">
                      Desenvolvimento 100% do zero
                    </strong>
                    <div className="text-sm text-gray-400">
                      Código exclusivo para suas necessidades
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-400 flex-shrink-0">✓</span>
                  <div className="text-gray-300">
                    <strong className="text-white">
                      Autenticação de Admins
                    </strong>
                    <div className="text-sm text-gray-400">
                      Sistema seguro com senhas
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-400 flex-shrink-0">✓</span>
                  <div className="text-gray-300">
                    <strong className="text-white">
                      Comandos de moderação
                    </strong>
                    <div className="text-sm text-gray-400">
                      Kick, ban, mute e mais
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-400 flex-shrink-0">✓</span>
                  <div className="text-gray-300">
                    <strong className="text-white">
                      Anti-flood e anti-spam
                    </strong>
                    <div className="text-sm text-gray-400">
                      Proteção automática do chat
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-green-400 flex-shrink-0">✓</span>
                  <div className="text-gray-300">
                    <strong className="text-white">
                      Suporte técnico inicial
                    </strong>
                    <div className="text-sm text-gray-400">
                      Ajuda na instalação e configuração
                    </div>
                  </div>
                </div>
              </div>

              <a
                href="https://discord.gg/tVWmwXjjWx"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold py-5 rounded-xl transition-all duration-300 text-center text-lg shadow-lg hover:shadow-blue-500/50 hover:scale-105"
              >
                💬 Fale Conosco
              </a>
            </div>
          </div>
        </section>

        {/* Seção Combinada: Sobre Nós & Comunidade */}
        <section
          id="comunidade"
          className="py-16 bg-gradient-to-b from-gray-900 to-gray-950"
        >
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-16 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Sobre Nós & Comunidade
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
              {/* Coluna Esquerda: Missão e Parceiro */}
              <div className="space-y-12">
                {/* Nossa Missão */}
                <div className="space-y-8">
                  <h3 className="text-3xl font-bold text-white mb-8">
                    Nossa Missão
                  </h3>

                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="text-3xl flex-shrink-0">🎯</div>
                      <div>
                        <h4 className="text-xl font-semibold text-purple-400 mb-2">
                          Propósito
                        </h4>
                        <p className="text-gray-300 text-lg leading-relaxed">
                          A{" "}
                          <span className="text-purple-400 font-semibold">
                            HaxHost
                          </span>{" "}
                          foi criada para alcançar jogadores, times, comunidades
                          e campeonatos de Haxball que buscam uma solução
                          simples e confiável para ter sua própria sala 24
                          horas.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="text-3xl flex-shrink-0">⚡</div>
                      <div>
                        <h4 className="text-xl font-semibold text-blue-400 mb-2">
                          Solução
                        </h4>
                        <p className="text-gray-300 text-lg leading-relaxed">
                          Sabemos que nem todos têm o conhecimento técnico
                          necessário. Com a HaxHost, você consegue sua sala de
                          forma prática, sem complicações, e com suporte
                          dedicado via Discord ou WhatsApp para te ajudar em
                          cada passo.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-6 rounded-lg border border-purple-500/10">
                      <div className="text-3xl flex-shrink-0">👨‍💻</div>
                      <div>
                        <h4 className="text-xl font-semibold text-yellow-400 mb-2">
                          Fundador
                        </h4>
                        <p className="text-gray-300 text-lg leading-relaxed">
                          Fundada por{" "}
                          <strong className="text-white bg-gradient-to-r from-purple-600 to-blue-600 px-2 py-1 rounded">
                            Billy
                          </strong>
                          , jogador conhecido no cenário e referência quando o
                          assunto é hospedagem de servidores Haxball.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parceiro Destaque */}
                <div>
                  <h4 className="text-3xl font-bold text-white mb-8">
                    Parceiro Destaque
                  </h4>

                  <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
                    <div className="flex justify-center mb-8">
                      <div className="w-40 h-40 p-4 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl border border-blue-500/20 flex items-center justify-center hover:scale-105 transition-all duration-300">
                        <img
                          src="/logos/azzurashin-hc.png"
                          alt="AZZURASHIN HC"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    <h5 className="text-2xl font-bold text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-6">
                      AZZURASHIN HC
                    </h5>

                    <blockquote className="text-gray-300 text-lg italic mb-8 text-center">
                      "Fora dos gramados virtuais, a equipe também mostra força:
                      com patrocínio oficial do Billy, a Azzurashin agora conta
                      com uma sala exclusiva, reforçando sua identidade e
                      profissionalismo no cenário."
                    </blockquote>

                    <div className="flex justify-center">
                      <a
                        href="https://discord.gg/k5xGWhpwV3"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 text-base"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                        </svg>
                        Visite o Discord da AZZURASHIN HC
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna Direita: Widget Discord e Comunidade */}
              <div className="md:sticky md:top-24">
                <h3 className="text-3xl font-bold text-white mb-8">
                  Junte-se à Comunidade
                </h3>

                <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 border border-purple-500/20">
                  <div className="space-y-6 mb-8">
                    <p className="text-gray-300 text-lg leading-relaxed">
                      Entre na nossa comunidade, Haxhost since 2022. Aqui você
                      encontra:
                    </p>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">💬</div>
                        <div>
                          <h4 className="text-white font-semibold mb-1">
                            Suporte Rápido
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Tire suas dúvidas e receba ajuda da equipe e
                            comunidade
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🎮</div>
                        <div>
                          <h4 className="text-white font-semibold mb-1">
                            Novidades
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Fique por dentro de atualizações de scripts e novos
                            recursos
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="text-2xl">🏆</div>
                        <div>
                          <h4 className="text-white font-semibold mb-1">
                            Eventos
                          </h4>
                          <p className="text-gray-400 text-sm">
                            Participe de campeonatos e eventos especiais
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-[500px] rounded-lg overflow-hidden shadow-2xl border border-gray-700/50">
                    <iframe
                      src="https://discord.com/widget?id=1342815750641156140&theme=dark"
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
                      className="bg-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Grid Container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Column 1 - Logo and Description */}
            <div className="space-y-4">
              <Image
                src="/logos/haxhost-logo.png"
                alt="HaxHost Logo"
                width={160}
                height={53}
                className="h-14 w-auto"
              />
              <p className="text-gray-400 text-sm">
                Hospedagem Profissional Haxball
              </p>
            </div>

            {/* Column 2 - Navigation Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Navegação</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#salas-online"
                    className="text-gray-400 hover:text-purple-400 transition-colors duration-300"
                  >
                    Salas Online
                  </a>
                </li>
                <li>
                  <a
                    href="#planos"
                    className="text-gray-400 hover:text-purple-400 transition-colors duration-300"
                  >
                    Planos
                  </a>
                </li>
                <li>
                  <a
                    href="#comunidade"
                    className="text-gray-400 hover:text-purple-400 transition-colors duration-300"
                  >
                    Comunidade
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3 - Social Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Social</h3>
              <div>
                <a
                  href="https://discord.gg/tVWmwXjjWx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-[#5865F2] transition-colors duration-300"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Discord
                </a>
              </div>
            </div>
          </div>

          {/* Copyright Line */}
          <div className="pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            © 2022 HaxHost - Todos os direitos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}
