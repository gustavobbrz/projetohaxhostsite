# HaxHost - Hospedagem Haxball

Site minimalista e funcional para HaxHost com monitoramento em tempo real de salas PM2.

## 🚀 Tecnologias

- **Next.js 15** - Framework React
- **Tailwind CSS** - Estilização
- **TypeScript** - Tipagem
- **PM2** - Gerenciamento de processos (EC2)

## 📦 Instalação

```bash
npm install
```

## 🔧 Configuração

1. **Configure a chave secreta** em `.env.local`:
```env
API_SECRET_KEY=sua-chave-secreta-super-segura
```

2. **Configure o Discord Widget** em `app/page.tsx`:
   - Substitua `SEU_SERVER_ID` pelo ID do seu servidor Discord
   - Linha 329: `https://discord.com/widget?id=SEU_SERVER_ID&theme=dark`

## 🏃 Executar Localmente

```bash
npm run dev
```

Acesse: http://localhost:3000

## 📤 Deploy (Vercel)

1. Faça push para o GitHub
2. Conecte no Vercel
3. Configure a variável de ambiente:
   - `API_SECRET_KEY`: sua chave secreta

## 🖥️ Configurar Worker nas EC2s

1. **Copie o arquivo `worker.js` para suas EC2s**

2. **Instale as dependências** em cada EC2:
```bash
npm install pm2 axios
```

3. **Configure as variáveis** no `worker.js`:
```javascript
const API_URL = 'https://seu-site.vercel.app/api/update-status';
const API_SECRET_KEY = 'sua-chave-secreta-super-segura';
const SERVER_ID = 'EC2-1'; // Mude para cada servidor
```

4. **Execute o worker**:
```bash
# Teste primeiro
node worker.js

# Depois rode em background com PM2
pm2 start worker.js --name "haxhost-worker"
pm2 save
pm2 startup
```

## 📡 Como Funciona

### Fluxo de Dados:

1. **EC2 Worker** verifica PM2 a cada 1 minuto
2. Envia status via POST para `/api/update-status`
3. API salva em arquivo JSON (`data/rooms-status.json`)
4. Site busca dados via `/api/get-status`
5. Atualização automática a cada 30 segundos no frontend

### Estrutura da API:

**POST /api/update-status** (Protegido)
```json
{
  "rooms": [
    { "name": "sala1", "status": "online" },
    { "name": "sala2", "status": "offline" }
  ],
  "serverId": "EC2-1"
}
```

**GET /api/get-status** (Público)
```json
{
  "success": true,
  "rooms": [...],
  "total": 5
}
```

## 🎨 Seções do Site

1. **Status das Salas** - Monitoramento em tempo real
2. **Scripts** - Descrição dos scripts vendidos
3. **Planos** - Tabela de preços
4. **Comunidade** - Widget do Discord

## 🔒 Segurança

- API protegida por chave secreta
- Validação de dados
- CORS configurado
- Armazenamento local (sem banco de dados externo necessário)

## 📝 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build
npm start

# Lint
npm run lint
```

## 🐛 Troubleshooting

### Worker não conecta na API
- Verifique se a URL está correta
- Confirme que a chave secreta é a mesma
- Teste a API com curl:
```bash
curl -X POST https://seu-site.vercel.app/api/update-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sua-chave-secreta" \
  -d '{"rooms":[{"name":"teste","status":"online"}],"serverId":"TEST"}'
```

### Site não atualiza
- Verifique o console do navegador (F12)
- Confirme que o arquivo `data/rooms-status.json` existe
- Reinicie o servidor Next.js

## 📞 Suporte

Entre em contato pelo Discord (link no site)

---

**HaxHost** - Hospedagem profissional Haxball 🎮
