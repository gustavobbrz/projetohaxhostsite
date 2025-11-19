/**
 * Cliente SSH para operações remotas na EC2
 *
 * Usa node-ssh para conexões seguras
 * ATUALIZADO: Agora suporta múltiplos hosts via config/hosts.json
 */

import { NodeSSH } from "node-ssh";
import path from "path";
import fs from "fs/promises";
import { HostConfig, getHostByName, readSSHKey } from "@/lib/hosts";

export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  privateKey: string; // Conteúdo da chave privada
}

export interface PM2ProcessInfo {
  name: string;
  pm_id: number;
  status: string;
  cpu: number;
  memory: number;
  uptime: number;
}

/**
 * Classe para gerenciar conexões SSH e operações PM2
 */
export class SSHClient {
  private ssh: NodeSSH;
  private config: SSHConfig;
  private hostConfig?: HostConfig; // Host do config/hosts.json

  constructor(config?: SSHConfig, hostName?: string) {
    this.ssh = new NodeSSH();

    // NOVO: Se hostName for fornecido, usar hosts.json
    if (hostName) {
      this.config = this.getConfigFromHostsJson(hostName);
    } else if (config) {
      this.config = config;
    } else {
      // Fallback: usar env vars (compatibilidade reversa)
      this.config = this.getDefaultConfig();
    }
  }

  /**
   * NOVO: Carrega config de um host específico do hosts.json
   */
  private getConfigFromHostsJson(hostName: string): SSHConfig {
    const host = getHostByName(hostName);

    if (!host) {
      throw new Error(
        `Host "${hostName}" não encontrado em config/hosts.json.\n` +
        `Verifique se o nome está correto e se o arquivo de configuração existe.`
      );
    }

    this.hostConfig = host;

    const privateKey = readSSHKey(host);

    console.log(`[SSH] Usando host "${host.name}" (${host.ip})`);

    return {
      host: host.ip,
      port: host.ssh_port,
      username: host.ssh_user,
      privateKey,
    };
  }

  /**
   * LEGADO: Config via env vars (compatibilidade reversa)
   */
  private getDefaultConfig(): SSHConfig {
    const host = process.env.SSH_HOST;
    const port = parseInt(process.env.SSH_PORT || "22");
    const username = process.env.SSH_USER || "ubuntu";
    const privateKey = process.env.SSH_PRIVATE_KEY;

    if (!host || !privateKey) {
      throw new Error(
        "SSH_HOST e SSH_PRIVATE_KEY devem estar configurados no .env OU use createSSHClient(hostName)"
      );
    }

    return {
      host,
      port,
      username,
      privateKey,
    };
  }

  /**
   * NOVO: Retorna o HostConfig usado (se disponível)
   */
  getHostConfig(): HostConfig | undefined {
    return this.hostConfig;
  }

  /**
   * Conecta ao servidor SSH
   */
  async connect(): Promise<void> {
    try {
      await this.ssh.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        privateKey: this.config.privateKey,
      });

      console.log(`[SSH] Conectado a ${this.config.host}`);
    } catch (error: any) {
      console.error("[SSH] Erro ao conectar:", error.message);
      throw new Error(`Falha ao conectar via SSH: ${error.message}`);
    }
  }

  /**
   * Desconecta do servidor
   */
  disconnect(): void {
    this.ssh.dispose();
    console.log("[SSH] Desconectado");
  }

  /**
   * Executa um comando remoto
   */
  async exec(command: string, cwd?: string): Promise<string> {
    try {
      const result = await this.ssh.execCommand(command, { cwd });

      if (result.code !== 0) {
        throw new Error(
          `Comando falhou (exit ${result.code}): ${result.stderr}`
        );
      }

      return result.stdout;
    } catch (error: any) {
      console.error(`[SSH] Erro ao executar '${command}':`, error.message);
      throw error;
    }
  }

  /**
   * Cria um diretório remoto (mkdir -p)
   */
  async mkdir(remotePath: string): Promise<void> {
    await this.ssh.mkdir(remotePath);
    console.log(`[SSH] Diretório criado: ${remotePath}`);
  }

  /**
   * Faz upload de um arquivo
   */
  async putFile(localPath: string, remotePath: string): Promise<void> {
    try {
      await this.ssh.putFile(localPath, remotePath);
      console.log(`[SSH] Arquivo copiado: ${localPath} -> ${remotePath}`);
    } catch (error: any) {
      console.error("[SSH] Erro no upload:", error.message);
      throw new Error(`Falha no upload: ${error.message}`);
    }
  }

  /**
   * Faz upload de múltiplos arquivos
   */
  async putFiles(
    files: Array<{ local: string; remote: string }>
  ): Promise<void> {
    await this.ssh.putFiles(files);
    console.log(`[SSH] ${files.length} arquivo(s) copiado(s)`);
  }

  /**
   * Faz upload de conteúdo de string como arquivo
   */
  async putContent(content: string, remotePath: string): Promise<void> {
    // Criar arquivo temporário local
    const tempFile = `/tmp/haxhost-temp-${Date.now()}.txt`;

    try {
      await fs.writeFile(tempFile, content, "utf8");
      await this.putFile(tempFile, remotePath);
      await fs.unlink(tempFile);
    } catch (error: any) {
      console.error("[SSH] Erro ao enviar conteúdo:", error.message);
      throw error;
    }
  }

  /**
   * Baixa um arquivo remoto
   */
  async getFile(remotePath: string, localPath: string): Promise<void> {
    try {
      await this.ssh.getFile(localPath, remotePath);
      console.log(`[SSH] Arquivo baixado: ${remotePath} -> ${localPath}`);
    } catch (error: any) {
      console.error("[SSH] Erro no download:", error.message);
      throw new Error(`Falha no download: ${error.message}`);
    }
  }

  /**
   * Lê conteúdo de arquivo remoto
   */
  async getContent(remotePath: string): Promise<string> {
    const tempFile = `/tmp/haxhost-download-${Date.now()}.txt`;

    try {
      await this.getFile(remotePath, tempFile);
      const content = await fs.readFile(tempFile, "utf8");
      await fs.unlink(tempFile);
      return content;
    } catch (error: any) {
      console.error("[SSH] Erro ao ler conteúdo:", error.message);
      throw error;
    }
  }

  /**
   * Lista processos PM2
   */
  async pm2List(): Promise<PM2ProcessInfo[]> {
    const output = await this.exec("pm2 jlist");

    if (!output || output.trim() === "[]") {
      return [];
    }

    try {
      const processes = JSON.parse(output);
      return processes.map((p: any) => ({
        name: p.name,
        pm_id: p.pm_id,
        status: p.pm2_env?.status || "unknown",
        cpu: p.monit?.cpu || 0,
        memory: p.monit?.memory || 0,
        uptime: p.pm2_env?.pm_uptime || 0,
      }));
    } catch (error) {
      console.error("[SSH] Erro ao parsear PM2 list:", error);
      return [];
    }
  }

  /**
   * Obtém informações de um processo PM2 específico
   */
  async pm2Show(processName: string): Promise<PM2ProcessInfo | null> {
    const processes = await this.pm2List();
    return processes.find((p) => p.name === processName) || null;
  }

  /**
   * Inicia um processo PM2
   */
  async pm2Start(
    processName: string,
    scriptPath: string,
    cwd?: string
  ): Promise<string> {
    const cwdArg = cwd ? `--cwd ${cwd}` : "";
    const command = `pm2 start ${scriptPath} --name ${processName} ${cwdArg}`;
    return await this.exec(command);
  }

  /**
   * Para um processo PM2
   */
  async pm2Stop(processName: string): Promise<string> {
    return await this.exec(`pm2 stop ${processName}`);
  }

  /**
   * Reinicia um processo PM2
   */
  async pm2Restart(
    processName: string,
    updateEnv: boolean = false
  ): Promise<string> {
    const updateEnvFlag = updateEnv ? "--update-env" : "";
    return await this.exec(`pm2 restart ${processName} ${updateEnvFlag}`);
  }

  /**
   * Deleta um processo PM2
   */
  async pm2Delete(processName: string): Promise<string> {
    return await this.exec(`pm2 delete ${processName}`);
  }

  /**
   * Salva lista de processos PM2
   */
  async pm2Save(): Promise<string> {
    return await this.exec("pm2 save");
  }

  /**
   * Inicia processo usando ecosystem.config.js
   */
  async pm2StartEcosystem(
    ecosystemPath: string,
    processName?: string
  ): Promise<string> {
    const onlyFlag = processName ? `--only ${processName}` : "";
    return await this.exec(`pm2 start ${ecosystemPath} ${onlyFlag}`);
  }

  /**
   * Provisionamento completo: cria pasta, envia arquivos, inicia PM2
   */
  async provisionServer(
    serverId: string,
    files: Array<{ content: string; filename: string }>,
    processName: string
  ): Promise<{
    success: boolean;
    message: string;
    processInfo?: PM2ProcessInfo;
  }> {
    try {
      // 1. Criar diretório
      const serverDir = `/home/ubuntu/haxball-servers/${serverId}`;
      await this.mkdir(serverDir);

      // 2. Enviar arquivos
      for (const file of files) {
        const remotePath = `${serverDir}/${file.filename}`;
        await this.putContent(file.content, remotePath);
      }

      // 3. Dar permissão de execução
      await this.exec(`chmod +x ${serverDir}/*.js`, serverDir);

      // 4. Instalar dependências se houver package.json
      const hasPackageJson = files.some((f) => f.filename === "package.json");
      if (hasPackageJson) {
        console.log("[SSH] Instalando dependências...");
        await this.exec("npm install --production", serverDir);
      }

      // 5. Iniciar com PM2
      const ecosystemPath = `${serverDir}/ecosystem.config.js`;
      await this.pm2StartEcosystem(ecosystemPath, processName);

      // 6. Salvar configuração PM2
      await this.pm2Save();

      // 7. Verificar status
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Aguardar 2s
      const processInfo = await this.pm2Show(processName);

      if (!processInfo || processInfo.status !== "online") {
        throw new Error(
          `Processo ${processName} não iniciou corretamente. Status: ${
            processInfo?.status || "não encontrado"
          }`
        );
      }

      return {
        success: true,
        message: `Servidor ${processName} provisionado e iniciado com sucesso!`,
        processInfo,
      };
    } catch (error: any) {
      console.error("[SSH] Erro no provisionamento:", error.message);

      // Rollback: tentar deletar processo se foi criado
      try {
        await this.pm2Delete(processName);
      } catch (e) {
        // Ignore
      }

      return {
        success: false,
        message: `Erro no provisionamento: ${error.message}`,
      };
    }
  }
}

/**
 * Cria uma instância do cliente SSH e conecta
 * 
 * @param config - Configuração SSH manual (opcional)
 * @param hostName - Nome do host em config/hosts.json (opcional, recomendado)
 * 
 * Exemplos:
 * - createSSHClient(undefined, "azzura") → conecta na EC2 azzura
 * - createSSHClient(undefined, "sv1") → conecta na EC2 sv1
 * - createSSHClient(customConfig) → usa config manual (legado)
 */
export async function createSSHClient(
  config?: SSHConfig,
  hostName?: string
): Promise<SSHClient> {
  const client = new SSHClient(config, hostName);
  await client.connect();
  return client;
}
