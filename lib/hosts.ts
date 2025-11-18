/**
 * Gerenciador de Hosts Multi-EC2
 * 
 * Coordena a distribuição de servidores Haxball entre múltiplas EC2s
 */

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface HostConfig {
  name: string;
  ip: string;
  ssh_user: string;
  ssh_private_key_path: string;
  base_path: string;
  ssh_port: number;
}

export interface HostsConfig {
  hosts: HostConfig[];
  pm2_process_template_name: string;
  max_rooms_per_host: number;
}

let cachedConfig: HostsConfig | null = null;

/**
 * Carrega configuração de hosts do arquivo hosts.json
 */
export function loadHostsConfig(): HostsConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const configPath = path.join(process.cwd(), "config", "hosts.json");

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Arquivo de configuração não encontrado: ${configPath}\n` +
      `Crie o arquivo config/hosts.json com as configurações das EC2s.`
    );
  }

  try {
    const fileContent = fs.readFileSync(configPath, "utf8");
    cachedConfig = JSON.parse(fileContent);

    if (!cachedConfig || !cachedConfig.hosts || cachedConfig.hosts.length === 0) {
      throw new Error("Configuração de hosts inválida ou vazia");
    }

    console.log(`[HOSTS] Carregadas ${cachedConfig.hosts.length} EC2(s)`);
    return cachedConfig;
  } catch (error: any) {
    throw new Error(`Erro ao ler config/hosts.json: ${error.message}`);
  }
}

/**
 * Retorna todos os hosts configurados
 */
export function getAllHosts(): HostConfig[] {
  const config = loadHostsConfig();
  return config.hosts;
}

/**
 * Retorna um host específico por nome
 */
export function getHostByName(name: string): HostConfig | null {
  const hosts = getAllHosts();
  return hosts.find((h) => h.name === name) || null;
}

/**
 * Retorna o host de um servidor específico
 * Busca no banco de dados o campo `hostName` do servidor
 */
export async function getHostForServer(serverId: string): Promise<HostConfig | null> {
  try {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { hostName: true },
    });

    if (!server || !server.hostName) {
      return null;
    }

    return getHostByName(server.hostName);
  } catch (error: any) {
    console.error(`[HOSTS] Erro ao buscar host do servidor ${serverId}:`, error);
    return null;
  }
}

/**
 * Encontra um host disponível para criar novo servidor
 * 
 * Estratégia: 
 * 1. Conta quantos servidores ativos cada host tem
 * 2. Retorna o host com MENOS servidores (load balancing simples)
 * 3. Se todos estiverem no limite, retorna null
 */
export async function getAvailableHost(): Promise<HostConfig | null> {
  const config = loadHostsConfig();
  const hosts = config.hosts;
  const maxRoomsPerHost = config.max_rooms_per_host;

  try {
    // Buscar contagem de servidores ativos por host
    const hostCounts: Record<string, number> = {};

    for (const host of hosts) {
      const count = await prisma.server.count({
        where: {
          hostName: host.name,
          status: { in: ["active", "pending"] },
        },
      });
      hostCounts[host.name] = count;
    }

    console.log("[HOSTS] Distribuição atual:", hostCounts);

    // Encontrar host com menos servidores
    let selectedHost: HostConfig | null = null;
    let minCount = Infinity;

    for (const host of hosts) {
      const count = hostCounts[host.name] || 0;

      if (count < maxRoomsPerHost && count < minCount) {
        minCount = count;
        selectedHost = host;
      }
    }

    if (selectedHost) {
      console.log(
        `[HOSTS] Host selecionado: ${selectedHost.name} (${minCount}/${maxRoomsPerHost} salas)`
      );
    } else {
      console.warn(
        `[HOSTS] ⚠️ Todos os hosts atingiram o limite de ${maxRoomsPerHost} salas!`
      );
    }

    return selectedHost;
  } catch (error: any) {
    console.error("[HOSTS] Erro ao buscar host disponível:", error);
    return null;
  }
}

/**
 * Expande o caminho da chave SSH (resolve ~ para home dir)
 */
export function expandKeyPath(keyPath: string): string {
  if (keyPath.startsWith("~")) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || "/root";
    return keyPath.replace("~", homeDir);
  }
  return keyPath;
}

/**
 * Lê o conteúdo da chave privada SSH de um host
 */
export function readSSHKey(host: HostConfig): string {
  const keyPath = expandKeyPath(host.ssh_private_key_path);

  if (!fs.existsSync(keyPath)) {
    throw new Error(
      `Chave SSH não encontrada: ${keyPath}\n` +
      `Host: ${host.name} (${host.ip})\n` +
      `Certifique-se de que a chave existe e o caminho está correto em config/hosts.json`
    );
  }

  try {
    return fs.readFileSync(keyPath, "utf8");
  } catch (error: any) {
    throw new Error(
      `Erro ao ler chave SSH ${keyPath}: ${error.message}\n` +
      `Verifique as permissões do arquivo (deve ser 400 ou 600)`
    );
  }
}

/**
 * Valida se todas as chaves SSH existem e são legíveis
 */
export function validateHosts(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    const hosts = getAllHosts();

    for (const host of hosts) {
      try {
        readSSHKey(host);
        console.log(`[HOSTS] ✅ ${host.name}: chave SSH válida`);
      } catch (error: any) {
        errors.push(`Host "${host.name}": ${error.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error: any) {
    errors.push(`Erro ao validar hosts: ${error.message}`);
    return {
      valid: false,
      errors,
    };
  }
}

/**
 * Retorna estatísticas de uso dos hosts
 */
export async function getHostsStats(): Promise<
  Array<{
    name: string;
    ip: string;
    activeServers: number;
    maxServers: number;
    usage: number; // porcentagem
  }>
> {
  const config = loadHostsConfig();
  const stats = [];

  for (const host of config.hosts) {
    const activeServers = await prisma.server.count({
      where: {
        hostName: host.name,
        status: { in: ["active", "pending"] },
      },
    });

    stats.push({
      name: host.name,
      ip: host.ip,
      activeServers,
      maxServers: config.max_rooms_per_host,
      usage: (activeServers / config.max_rooms_per_host) * 100,
    });
  }

  return stats;
}

