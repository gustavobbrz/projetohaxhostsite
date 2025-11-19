"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ===============================================================
// TYPES & INTERFACES
// ===============================================================

interface Server {
  id: string;
  name: string;
  map: string;
  maxPlayers: number;
  password?: string;
  isPublic: boolean;
  token?: string;
  pm2ProcessName?: string;
  needsProvision: boolean;
  status: string;
  subscriptionStatus: string;
}

interface ServerAdmin {
  id: string;
  label: string;
  createdAt: string;
}

interface ServerConfigFormProps {
  server?: Server | null;
  onServerCreated?: (server: Server) => void;
  onServerUpdated?: (server: Server) => void;
}

type LoadingState = "idle" | "saving" | "provisioning" | "restarting" | "loading_admins" | "adding_admin" | "removing_admin";

// ===============================================================
// COMPONENT
// ===============================================================

export default function ServerConfigForm({ server, onServerCreated, onServerUpdated }: ServerConfigFormProps) {
  // Estados do formulário
  const [formData, setFormData] = useState({
    name: "",
    map: "bazinga (futsal)" as "bazinga (futsal)" | "big" | "realsoccer",
    maxPlayers: 16,
    password: "",
    isPublic: true,
    token: "",
  });

  // Estados de UI
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showToken, setShowToken] = useState(false);

  // Estados de Admins
  const [admins, setAdmins] = useState<ServerAdmin[]>([]);
  const [newAdmin, setNewAdmin] = useState({ label: "", password: "" });
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);

  // Preencher formulário se houver servidor
  useEffect(() => {
    if (server) {
      setFormData({
        name: server.name || "",
        map: (server.map || "bazinga (futsal)") as any,
        maxPlayers: server.maxPlayers || 16,
        password: "", // Não preencher senha por segurança
        isPublic: server.isPublic !== false,
        token: "", // Não preencher token por segurança
      });

      // Carregar admins
      if (server.id) {
        fetchAdmins(server.id);
      }
    }
  }, [server]);

  // ===============================================================
  // API CALLS
  // ===============================================================

  const fetchAdmins = async (serverId: string) => {
    try {
      setLoadingState("loading_admins");
      const response = await fetch(`/api/servers/${serverId}/admins`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins || []);
      }
    } catch (error) {
      console.error("[ServerConfigForm] Erro ao buscar admins:", error);
    } finally {
      setLoadingState("idle");
    }
  };

  const handleSave = async () => {
    setLoadingState("saving");
    setMessage(null);

    try {
      const endpoint = server ? `/api/servers/${server.id}` : "/api/servers";
      const method = server ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message || "✅ Servidor salvo com sucesso!" });
        
        if (onServerCreated && !server) {
          onServerCreated(data.server);
        } else if (onServerUpdated && server) {
          onServerUpdated(data.server);
        }
      } else {
        setMessage({ type: "error", text: `❌ ${data.error || "Erro ao salvar"}` });
      }
    } catch (error: any) {
      console.error("[ServerConfigForm] Erro ao salvar:", error);
      setMessage({ type: "error", text: `❌ Erro: ${error.message}` });
    } finally {
      setLoadingState("idle");
    }
  };

  const handleProvision = async () => {
    if (!server?.id) {
      setMessage({ type: "error", text: "❌ Salve o servidor antes de provisionar" });
      return;
    }

    // Verificar se tem token (no formulário ou já salvo no servidor)
    const hasToken = formData.token || server?.token || server?.tokenEncrypted;
    
    if (!hasToken) {
      setMessage({ 
        type: "error", 
        text: "❌ Token obrigatório! Clique em 'Pegar Token' e cole aqui antes de provisionar." 
      });
      return;
    }

    if (!confirm("🚀 Provisionar servidor? Isso criará e iniciará o processo PM2 na EC2.")) {
      return;
    }

    setLoadingState("provisioning");
    setMessage({ type: "info", text: "⏳ Provisionando servidor... Aguarde até 30 segundos." });

    try {
      const body: any = {};
      // Se tem token novo no formulário, enviar
      if (formData.token) {
        body.token = formData.token;
        console.log('[PROVISION] Enviando token novo do formulário');
      } else {
        console.log('[PROVISION] Usando token já salvo no banco de dados');
      }

      const response = await fetch(`/api/servers/${server.id}/provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ 
          type: "success", 
          text: `✅ ${data.message}\nProcesso: ${data.processName || "N/A"}\nLink: ${data.roomLink || "Aguardando..."}` 
        });
        
        // Limpar token do formulário por segurança
        setFormData({ ...formData, token: "" });
        
        if (onServerUpdated) {
          onServerUpdated({ ...server, needsProvision: false, status: "active" });
        }
      } else {
        setMessage({ type: "error", text: `❌ ${data.message || data.error}` });
      }
    } catch (error: any) {
      console.error("[ServerConfigForm] Erro ao provisionar:", error);
      setMessage({ type: "error", text: `❌ Erro: ${error.message}` });
    } finally {
      setLoadingState("idle");
    }
  };

  const handleSaveAndRestart = async () => {
    if (!server?.id) {
      setMessage({ type: "error", text: "❌ Servidor não existe ainda. Use 'Salvar' primeiro." });
      return;
    }

    if (!confirm("🔄 Salvar configurações e reiniciar servidor?")) {
      return;
    }

    setLoadingState("restarting");
    setMessage({ type: "info", text: "⏳ Salvando e reiniciando..." });

    try {
      // Opção 1: Usar endpoint de config com restart=true
      const response = await fetch(`/api/servers/${server.id}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...formData, restart: true }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: `✅ ${data.message || "Configuração salva e servidor reiniciado!"}` });
        
        // Limpar token
        setFormData({ ...formData, token: "" });
        
        if (onServerUpdated) {
          onServerUpdated(data.server || server);
        }
      } else {
        setMessage({ type: "error", text: `❌ ${data.error || data.message}` });
      }
    } catch (error: any) {
      console.error("[ServerConfigForm] Erro ao reiniciar:", error);
      setMessage({ type: "error", text: `❌ Erro: ${error.message}` });
    } finally {
      setLoadingState("idle");
    }
  };

  const handleAddAdmin = async () => {
    if (!server?.id) {
      setMessage({ type: "error", text: "❌ Salve o servidor primeiro" });
      return;
    }

    if (!newAdmin.password || newAdmin.password.length < 6) {
      setMessage({ type: "error", text: "❌ Senha do admin deve ter no mínimo 6 caracteres" });
      return;
    }

    setLoadingState("adding_admin");
    setMessage(null);

    try {
      const response = await fetch(`/api/servers/${server.id}/admins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newAdmin),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: `✅ Admin "${newAdmin.label || "Novo Admin"}" adicionado!` });
        setNewAdmin({ label: "", password: "" });
        await fetchAdmins(server.id);
      } else {
        setMessage({ type: "error", text: `❌ ${data.error}` });
      }
    } catch (error: any) {
      console.error("[ServerConfigForm] Erro ao adicionar admin:", error);
      setMessage({ type: "error", text: `❌ Erro: ${error.message}` });
    } finally {
      setLoadingState("idle");
    }
  };

  const handleRemoveAdmin = async (adminId: string, adminLabel: string) => {
    if (!server?.id) return;

    if (!confirm(`Remover admin "${adminLabel}"?`)) return;

    setLoadingState("removing_admin");

    try {
      const response = await fetch(`/api/servers/${server.id}/admins/${adminId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: `✅ Admin removido!` });
        await fetchAdmins(server.id);
      } else {
        setMessage({ type: "error", text: `❌ ${data.error}` });
      }
    } catch (error: any) {
      console.error("[ServerConfigForm] Erro ao remover admin:", error);
      setMessage({ type: "error", text: `❌ Erro: ${error.message}` });
    } finally {
      setLoadingState("idle");
    }
  };

  // ===============================================================
  // RENDER
  // ===============================================================

  const isLoading = loadingState !== "idle";
  const isEditMode = !!server;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
          {isEditMode ? "⚙️ Configuração do Servidor" : "🆕 Criar Novo Servidor"}
        </h2>
        <p className="text-gray-400">
          {isEditMode
            ? "Edite as configurações e reinicie para aplicar as mudanças"
            : "Preencha os dados para criar seu servidor Haxball"}
        </p>
      </div>

      {/* Message Banner */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`mb-6 p-4 rounded-lg border ${
              message.type === "success"
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : message.type === "error"
                ? "bg-red-500/10 border-red-500/30 text-red-400"
                : "bg-blue-500/10 border-blue-500/30 text-blue-400"
            }`}
          >
            <pre className="whitespace-pre-wrap font-sans text-sm">{message.text}</pre>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Nome da Sala */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Nome da Sala <span className="text-gray-500">(com emoji 🎮)</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value.slice(0, 64) })}
            maxLength={64}
            placeholder="⚽ Minha Sala Incrível"
            className="w-full bg-gray-900/50 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">{formData.name.length}/64 caracteres</p>
        </div>

        {/* Mapa */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Mapa
          </label>
          <select
            value={formData.map}
            onChange={(e) => setFormData({ ...formData, map: e.target.value as any })}
            className="w-full bg-gray-900/50 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            disabled={isLoading}
          >
            <option value="bazinga (futsal)">⚽ Bazinga (Futsal)</option>
            <option value="big">🏟️ Big (Padrão)</option>
            <option value="realsoccer">⚽ Real Soccer</option>
          </select>
        </div>

        {/* Max Players */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Máximo de Jogadores
          </label>
          <input
            type="number"
            min={2}
            max={50}
            value={formData.maxPlayers}
            onChange={(e) => setFormData({ ...formData, maxPlayers: parseInt(e.target.value) || 16 })}
            className="w-full bg-gray-900/50 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">Entre 2 e 50 jogadores</p>
        </div>

        {/* Senha (Opcional) */}
        <div>
          <label className="block text-gray-300 text-sm font-medium mb-2">
            Senha da Sala <span className="text-gray-500">(opcional)</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Deixe vazio para sala sem senha"
              className="w-full bg-gray-900/50 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all pr-12"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>

        {/* Sala Privada */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={!formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: !e.target.checked })}
              className="w-5 h-5 rounded border-gray-700 bg-gray-900/50 text-purple-600 focus:ring-2 focus:ring-purple-500/20"
              disabled={isLoading}
            />
            <span className="text-gray-300">
              🔒 Sala Privada <span className="text-gray-500">(não aparece na lista pública)</span>
            </span>
          </label>
        </div>

        {/* Token (Opcional - só em edição) */}
        {isEditMode && (
          <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-yellow-400 text-sm font-medium">
                🔑 Token Haxball <span className="text-gray-400">(opcional - deixe vazio para manter atual)</span>
              </label>
              <a
                href="https://www.haxball.com/headlesstoken"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-all hover:scale-105"
              >
                <span>🔗</span>
                <span>Pegar Token</span>
              </a>
            </div>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={formData.token}
                onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                placeholder="thr1.XXXXXXXXXXXXXX.YYYYYYYYYYYYYY"
                className="w-full bg-gray-900/50 text-white px-4 py-3 rounded-lg border border-yellow-500/30 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 outline-none transition-all pr-12"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showToken ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-400">
                ⚠️ Alterar o token requer reiniciar o servidor
              </p>
              <p className="text-xs text-blue-400">
                💡 Clique em "Pegar Token" para abrir o site oficial do Haxball e obter um token válido
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={isLoading || !formData.name}
          className="flex-1 min-w-[200px] bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-all hover:scale-105 disabled:hover:scale-100"
        >
          {loadingState === "saving" ? "⏳ Salvando..." : "💾 Salvar"}
        </button>

        {isEditMode && server?.needsProvision && (
          <button
            onClick={handleProvision}
            disabled={isLoading}
            className="flex-1 min-w-[200px] bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-all hover:scale-105"
          >
            {loadingState === "provisioning" ? "⏳ Provisionando..." : "🚀 Provisionar"}
          </button>
        )}

        {isEditMode && server && !server.needsProvision && (
          <button
            onClick={handleSaveAndRestart}
            disabled={isLoading || !formData.name}
            className="flex-1 min-w-[200px] bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg font-semibold transition-all hover:scale-105"
          >
            {loadingState === "restarting" ? "⏳ Reiniciando..." : "💾🔄 Salvar e Reiniciar"}
          </button>
        )}
      </div>

      {/* Seção de Admins (só em edição) */}
      {isEditMode && server && (
        <div className="mt-10 pt-8 border-t border-gray-700">
          <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            👑 Gerenciar Admins
            {loadingState === "loading_admins" && <span className="text-sm text-gray-400">(Carregando...)</span>}
          </h3>

          {/* Lista de Admins */}
          {admins.length > 0 && (
            <div className="space-y-2 mb-6">
              {admins.map((admin) => (
                <motion.div
                  key={admin.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30 flex items-center justify-between hover:border-purple-500/30 transition-all"
                >
                  <div>
                    <span className="text-white font-semibold">{admin.label || "Admin"}</span>
                    <span className="text-gray-500 text-sm ml-3">
                      Criado em {new Date(admin.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveAdmin(admin.id, admin.label)}
                    disabled={isLoading}
                    className="bg-red-500/20 hover:bg-red-500/30 disabled:bg-gray-700 text-red-400 px-4 py-2 rounded-lg transition-all hover:scale-105"
                  >
                    🗑️ Remover
                  </button>
                </motion.div>
              ))}
            </div>
          )}

          {/* Adicionar Admin */}
          <div className="bg-green-500/10 rounded-lg p-5 border border-green-500/30">
            <label className="block text-green-400 text-sm font-medium mb-3">
              ➕ Adicionar Novo Admin
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Nome/Label (ex: Admin Principal)"
                value={newAdmin.label}
                onChange={(e) => setNewAdmin({ ...newAdmin, label: e.target.value })}
                className="flex-1 bg-gray-900/50 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                disabled={isLoading}
              />
              <div className="flex-1 relative">
                <input
                  type={showNewAdminPassword ? "text" : "password"}
                  placeholder="Senha (mín. 6 caracteres)"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="w-full bg-gray-900/50 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all pr-12"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewAdminPassword(!showNewAdminPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showNewAdminPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              <button
                onClick={handleAddAdmin}
                disabled={isLoading || !newAdmin.password || newAdmin.password.length < 6}
                className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 whitespace-nowrap"
              >
                {loadingState === "adding_admin" ? "⏳" : "➕ Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status do Servidor (só em edição) */}
      {isEditMode && server && (
        <div className="mt-8 pt-6 border-t border-gray-700">
          <h4 className="text-lg font-semibold text-gray-300 mb-3">📊 Status Atual</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
              <div className="text-xs text-gray-400 mb-1">Status</div>
              <div className={`text-lg font-bold ${
                server.status === "active" ? "text-green-400" :
                server.status === "inactive" ? "text-yellow-400" :
                "text-gray-400"
              }`}>
                {server.status === "active" ? "🟢 Ativo" :
                 server.status === "inactive" ? "🟡 Inativo" :
                 "⚪ Pendente"}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
              <div className="text-xs text-gray-400 mb-1">Provisionamento</div>
              <div className="text-lg font-bold text-white">
                {server.needsProvision ? "❌ Necessário" : "✅ OK"}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/30">
              <div className="text-xs text-gray-400 mb-1">Processo PM2</div>
              <div className="text-sm font-mono text-white truncate">
                {server.pm2ProcessName || "N/A"}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

