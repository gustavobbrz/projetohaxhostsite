/**
 * Utilitário de provisionamento de servidores Haxball
 * 
 * Coordena a criação de arquivos, envio via SSH e start do PM2
 * ATUALIZADO: Agora suporta múltiplos hosts via config/hosts.json
 */

import { createSSHClient, SSHClient } from "../ssh/client";
import { PrismaClient, Server, ServerAdmin } from "@prisma/client";
import { encrypt } from "../crypto/encryption";
import { getHostForServer } from "../hosts";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

export interface ProvisionOptions {
  serverId: string;
  token?: string; // Se não fornecido, usa o do DB
  forceRestart?: boolean;
}

export interface ProvisionResult {
  success: boolean;
  message: string;
  processName?: string;
  roomLink?: string;
  error?: string;
}

/**
 * Gera o conteúdo do ecosystem.config.js substituindo placeholders
 */
async function generateEcosystemConfig(
  server: Server & { ServerAdmin: ServerAdmin[] }
): Promise<string> {
  // Ler template
  const templatePath = path.join(
    process.cwd(),
    "templates",
    "ecosystem.config.template.js"
  );
  let template = await fs.readFile(templatePath, "utf8");

  // Token: usar criptografado se disponível
  let token = server.token || "";
  if (server.tokenEncrypted) {
    try {
      const { decrypt } = await import("../crypto/encryption");
      token = decrypt(server.tokenEncrypted);
    } catch (e) {
      console.error("[PROVISION] Erro ao descriptografar token:", e);
    }
  }

  // Preparar lista de admins (JSON com hashes)
  const adminsJson = JSON.stringify(
    server.ServerAdmin.filter((a) => a.isActive).map((a) => ({
      hash: a.adminHash,
      label: a.label || "Admin",
    }))
  );

  // Substituir placeholders
  const replacements: Record<string, string> = {
    "<SERVER_ID>": server.id,
    "<TOKEN>": token,
    "<ROOM_NAME>": server.name,
    "<MAP>": server.map || "Big",
    "<MAX_PLAYERS>": server.maxPlayers.toString(),
    "<PASSWORD>": server.password || "",
    "<IS_PUBLIC>": server.isPublic ? "true" : "false",
    "<ADMINS_JSON>": adminsJson.replace(/"/g, '\\"'), // Escape quotes
    "<HAXHOST_API_URL>": process.env.HAXHOST_API_URL || "http://localhost:3000",
    "<HAXHOST_WEBHOOK_SECRET>": process.env.HAXBALL_WEBHOOK_SECRET || "",
    "<PM2_PROCESS_NAME>": server.pm2ProcessName || `haxball-server-${server.id}`,
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    template = template.replaceAll(placeholder, value);
  }

  return template;
}

/**
 * Gera o package.json para o servidor
 */
function generatePackageJson(serverId: string): string {
  return JSON.stringify(
    {
      name: `haxhost-server-${serverId}`,
      version: "1.0.0",
      description: "HaxHost Haxball Server",
      main: "index.js",
      scripts: {
        start: "node index.js",
      },
      dependencies: {
        "haxball.js": "^3.0.0",
        "node-fetch": "^2.7.0",
      },
    },
    null,
    2
  );
}

/**
 * Gera o arquivo index.js (copia do template)
 */
async function generateIndexJs(): Promise<string> {
  const templatePath = path.join(
    process.cwd(),
    "templates",
    "haxball-server.template.js"
  );
  return await fs.readFile(templatePath, "utf8");
}

/**
 * Provisiona um servidor Haxball na EC2
 */
export async function provisionServer(
  options: ProvisionOptions
): Promise<ProvisionResult> {
  let sshClient: SSHClient | null = null;

  try {
    console.log(`[PROVISION] Iniciando provisionamento do servidor ${options.serverId}`);

    // 1. Buscar dados do servidor
    const server = await prisma.server.findUnique({
      where: { id: options.serverId },
      include: { ServerAdmin: true },
    });

    if (!server) {
      return {
        success: false,
        message: "Servidor não encontrado",
        error: "SERVER_NOT_FOUND",
      };
    }

    // 2. Verificar se já tem pm2ProcessName
    if (!server.pm2ProcessName) {
      const processName = `haxball-server-${server.id.substring(0, 8)}`;
      await prisma.server.update({
        where: { id: server.id },
        data: { pm2ProcessName: processName },
      });
      server.pm2ProcessName = processName;
    }

    // 3. Se token fornecido, atualizar
    if (options.token) {
      const tokenEncrypted = encrypt(options.token);
      await prisma.server.update({
        where: { id: server.id },
        data: {
          token: options.token,
          tokenEncrypted: tokenEncrypted,
        },
      });
      server.token = options.token;
      server.tokenEncrypted = tokenEncrypted;
    }

    // 4. Buscar host do servidor e conectar via SSH
    console.log("[PROVISION] Conectando via SSH...");
    
    if (!server.hostName) {
      return {
        success: false,
        message: "Servidor não tem host atribuído. Configure o hostName antes de provisionar.",
        error: "NO_HOST_ASSIGNED",
      };
    }

    const host = await getHostForServer(server.id);
    
    if (!host) {
      return {
        success: false,
        message: `Host "${server.hostName}" não encontrado em config/hosts.json`,
        error: "HOST_NOT_FOUND",
      };
    }

    console.log(`[PROVISION] Usando host: ${host.name} (${host.ip})`);
    sshClient = await createSSHClient(undefined, host.name);

    // 5. Gerar arquivos
    console.log("[PROVISION] Gerando arquivos de configuração...");
    const ecosystemConfig = await generateEcosystemConfig(server);
    const packageJson = generatePackageJson(server.id);
    const indexJs = await generateIndexJs();

    const files = [
      { content: ecosystemConfig, filename: "ecosystem.config.js" },
      { content: packageJson, filename: "package.json" },
      { content: indexJs, filename: "index.js" },
    ];

    // 6. Provisionar via SSH
    console.log("[PROVISION] Enviando arquivos e iniciando PM2...");
    const result = await sshClient.provisionServer(
      server.id,
      files,
      server.pm2ProcessName
    );

    if (!result.success) {
      // Marcar como precisa provisionamento
      await prisma.server.update({
        where: { id: server.id },
        data: { needsProvision: true, status: "error" },
      });

      return {
        success: false,
        message: result.message,
        error: "PROVISION_FAILED",
      };
    }

    // 7. Atualizar banco de dados
    await prisma.server.update({
      where: { id: server.id },
      data: {
        needsProvision: false,
        status: "active",
        lastStatusUpdate: new Date(),
      },
    });

    // 8. Registrar log de admin
    await prisma.adminLog.create({
      data: {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        serverId: server.id,
        action: "SERVER_PROVISIONED",
        adminName: "System",
        targetPlayer: server.pm2ProcessName,
        reason: "Provisionamento automático",
      },
    });

    console.log(`[PROVISION] ✅ Servidor ${server.pm2ProcessName} provisionado com sucesso!`);

    return {
      success: true,
      message: `Servidor ${server.name} provisionado e iniciado!`,
      processName: server.pm2ProcessName,
      roomLink: server.roomLink,
    };
  } catch (error: any) {
    console.error("[PROVISION] Erro fatal:", error);

    // Marcar como precisa provisionamento
    try {
      await prisma.server.update({
        where: { id: options.serverId },
        data: { needsProvision: true, status: "error" },
      });
    } catch (e) {
      // Ignore
    }

    return {
      success: false,
      message: `Erro no provisionamento: ${error.message}`,
      error: "FATAL_ERROR",
    };
  } finally {
    // Desconectar SSH
    if (sshClient) {
      sshClient.disconnect();
    }
    await prisma.$disconnect();
  }
}

/**
 * Reinicia um servidor com novas configurações
 */
export async function restartServerWithConfig(
  serverId: string,
  updates: Partial<Server>
): Promise<ProvisionResult> {
  let sshClient: SSHClient | null = null;

  try {
    console.log(`[RESTART] Reiniciando servidor ${serverId} com novas configurações`);

    // 1. Atualizar banco de dados
    const server = await prisma.server.update({
      where: { id: serverId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: { ServerAdmin: true },
    });

    // 2. Se não tem PM2 ou precisa provision, provisionar do zero
    if (!server.pm2ProcessName || server.needsProvision) {
      return await provisionServer({ serverId });
    }

    // 3. Verificar host e conectar via SSH
    if (!server.hostName) {
      throw new Error("Servidor não tem host atribuído");
    }

    const host = await getHostForServer(server.id);
    
    if (!host) {
      throw new Error(`Host "${server.hostName}" não encontrado`);
    }

    console.log(`[RESTART] Conectando em ${host.name} (${host.ip})`);
    sshClient = await createSSHClient(undefined, host.name);

    // 4. Regenerar ecosystem.config.js
    const ecosystemConfig = await generateEcosystemConfig(server);
    const serverDir = `/home/ubuntu/haxball-servers/${server.id}`;
    await sshClient.putContent(
      ecosystemConfig,
      `${serverDir}/ecosystem.config.js`
    );

    // 5. Reiniciar com --update-env
    await sshClient.pm2Restart(server.pm2ProcessName, true);

    // 6. Verificar status
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const processInfo = await sshClient.pm2Show(server.pm2ProcessName);

    if (!processInfo || processInfo.status !== "online") {
      throw new Error(`Processo não reiniciou corretamente: ${processInfo?.status}`);
    }

    // 7. Registrar log
    await prisma.adminLog.create({
      data: {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        serverId: server.id,
        action: "SERVER_RESTARTED",
        adminName: "System",
        reason: "Configuração atualizada",
      },
    });

    console.log(`[RESTART] ✅ Servidor ${server.pm2ProcessName} reiniciado!`);

    return {
      success: true,
      message: `Servidor reiniciado com sucesso!`,
      processName: server.pm2ProcessName,
    };
  } catch (error: any) {
    console.error("[RESTART] Erro:", error);

    return {
      success: false,
      message: `Erro ao reiniciar: ${error.message}`,
      error: "RESTART_FAILED",
    };
  } finally {
    if (sshClient) {
      sshClient.disconnect();
    }
    await prisma.$disconnect();
  }
}

