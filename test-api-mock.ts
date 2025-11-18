/**
 * Helper de testes para APIs sem rodar npm run dev
 * Simula requisições HTTP usando mocks
 */

import { NextRequest, NextResponse } from "next/server";

// Mock simplificado de auth() que retorna sessão válida
export const mockAuth = () => {
  return Promise.resolve({
    user: {
      id: "test-user-123",
      email: "test@haxhost.com",
      name: "Test User",
    },
  });
};

/**
 * Cria um mock de NextRequest
 */
export function mockRequest(
  method: string,
  url: string,
  body?: any,
  params?: Record<string, any>
): NextRequest {
  const requestInit: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  const request = new NextRequest(url, requestInit);

  // Adicionar params mockados se necessário
  if (params) {
    (request as any).params = params;
  }

  return request;
}

/**
 * Extrai JSON de uma NextResponse
 */
export async function extractJSON(response: NextResponse): Promise<any> {
  const text = await response.text();
  
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("❌ ERRO: Resposta não é JSON válido");
    console.error("Resposta recebida:", text.substring(0, 500));
    throw new Error(`Resposta inválida (não é JSON): ${text.substring(0, 100)}...`);
  }
}

/**
 * Formata resposta de teste
 */
export function formatTestResult(
  testName: string,
  status: number,
  data: any,
  success: boolean = true
) {
  const emoji = success ? "✅" : "❌";
  console.log(`\n${emoji} ${testName}`);
  console.log(`   Status: ${status}`);
  console.log(`   Data:`, JSON.stringify(data, null, 2).split("\n").map(line => `   ${line}`).join("\n"));
}

/**
 * Valida se resposta não contém HTML
 */
export function validateNotHTML(data: any, testName: string): boolean {
  const str = JSON.stringify(data);
  
  if (str.includes("<!DOCTYPE") || str.includes("<html")) {
    console.error(`❌ ${testName}: RETORNOU HTML EM VEZ DE JSON!`);
    return false;
  }
  
  return true;
}

/**
 * Mock de SSH Client que não executa comandos reais
 */
export class MockSSHClient {
  private hostName: string;

  constructor(hostName: string) {
    this.hostName = hostName;
  }

  async connect() {
    console.log(`[MOCK SSH] Conectado em ${this.hostName} (simulado)`);
  }

  async pm2Start(processName: string, script: string) {
    return `[MOCK] pm2 start ${script} --name ${processName}`;
  }

  async pm2Stop(processName: string) {
    return `[MOCK] pm2 stop ${processName}`;
  }

  async pm2Restart(processName: string, updateEnv: boolean = false) {
    const flag = updateEnv ? "--update-env" : "";
    return `[MOCK] pm2 restart ${processName} ${flag}`;
  }

  disconnect() {
    console.log(`[MOCK SSH] Desconectado de ${this.hostName}`);
  }
}

/**
 * Gera um pm2ProcessName válido
 */
export function generatePm2ProcessName(serverId: string): string {
  return `haxball-server-${serverId.substring(0, 8)}`;
}

