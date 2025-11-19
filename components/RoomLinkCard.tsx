"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface RoomLinkCardProps {
  roomLink: string | null | undefined;
  serverName?: string;
}

export default function RoomLinkCard({ roomLink, serverName }: RoomLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const hasLink = roomLink && roomLink.trim() !== "";
  const displayLink = hasLink ? roomLink : "Sala não iniciada";

  const handleCopy = async () => {
    if (!hasLink) return;

    try {
      await navigator.clipboard.writeText(roomLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erro ao copiar link:", error);
    }
  };

  const handleOpen = () => {
    if (!hasLink) return;
    window.open(roomLink, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          🔗 Link da Sala
        </h3>
        {hasLink && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">Online</span>
          </div>
        )}
      </div>

      {/* Input do Link */}
      <div className="relative mb-4">
        <input
          type="text"
          value={displayLink}
          readOnly
          className={`w-full bg-gray-900/50 text-white px-4 py-3 pr-24 rounded-lg border ${
            hasLink
              ? "border-green-500/30 focus:border-green-500"
              : "border-gray-700"
          } outline-none font-mono text-sm`}
          placeholder="Aguardando início da sala..."
        />
        {hasLink && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <button
              onClick={handleCopy}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50"
              title="Copiar link"
            >
              {copied ? "✓ Copiado" : "📋 Copiar"}
            </button>
          </div>
        )}
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-2">
        <button
          onClick={handleOpen}
          disabled={!hasLink}
          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all hover:scale-105 disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          🚀 Abrir Sala
        </button>

        <button
          onClick={handleCopy}
          disabled={!hasLink}
          className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 disabled:hover:scale-100"
        >
          {copied ? "✓" : "📋"}
        </button>
      </div>

      {/* Mensagem de Status */}
      <div className="mt-4 text-center">
        {hasLink ? (
          <p className="text-sm text-gray-400">
            Compartilhe este link para os jogadores entrarem 🎮
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-yellow-400/80">
              ⏳ O link aparecerá aqui quando a sala for iniciada
            </p>
            
            {/* Alerta de Token */}
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-left">
              <p className="text-xs text-red-400 font-semibold mb-2">
                ⚠️ Sala não iniciou? Pode ser o token!
              </p>
              <p className="text-xs text-gray-400 mb-3">
                Se você já provisionou mas o link não aparece, o token pode estar inválido/expirado.
              </p>
              <a
                href="https://www.haxball.com/headlesstoken"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-all hover:scale-105"
              >
                <span>🔗</span>
                <span>Pegar Token Válido</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

