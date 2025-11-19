-- Criar usuário Azzurashin
INSERT INTO "User" (id, name, email, password, "createdAt", "updatedAt")
VALUES (
  'azzurashin-user-id',
  'Azzurashin HC',
  'azzurashin@haxhost.com',
  '$2a$10$YourHashedPasswordHere', -- Você vai atualizar isso
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  name = 'Azzurashin HC',
  "updatedAt" = NOW();

-- Criar servidor da Azzurashin
INSERT INTO "Server" (
  id,
  "userId",
  name,
  status,
  "pm2ProcessName",
  "discordServerId",
  "roomLink",
  "maxPlayers",
  "isPublic",
  "subscriptionStatus",
  "planType",
  "nextBillingDate",
  "createdAt",
  "updatedAt"
)
VALUES (
  'azzurashin-server-id',
  'azzurashin-user-id',
  '🔵⚫ FUTSAL DA AZZURASHIN HC 🔵⚫',
  'active',
  'haxball-server',
  '1342815750641156140',
  'https://www.haxball.com/play?c=azzurashin',
  20,
  true,
  'active',
  'premium',
  NOW() + INTERVAL '30 days',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  status = 'active',
  "subscriptionStatus" = 'active',
  "updatedAt" = NOW();

