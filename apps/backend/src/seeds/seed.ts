/**
 * Seed de teste — motorista aprovado + riders + corridas via socket (fluxo real)
 *
 * PRÉ-REQUISITO: backend rodando (pnpm dev:backend)
 *
 * Uso:
 *   pnpm --filter backend seed              → cria motorista seed + corrida do Rider 1
 *   pnpm --filter backend seed -- --rider=2 → cria corrida do Rider 2 (segunda corrida)
 *
 * Fluxo de teste da segunda corrida:
 *   1. pnpm --filter backend seed
 *   2. Login no app do motorista: carlos.seed@test.com / senha123
 *   3. Ativar online → receber RIDE_REQUEST → aceitar
 *   4. Rider 1 app: ver OTP → motorista digita → corrida in_progress
 *   5. Motorista se aproxima do destino (< 3 km) → badge "2ª corrida disponível"
 *   6. pnpm --filter backend seed -- --rider=2
 *   7. App do motorista recebe nova corrida → botão "Enfileirar"
 *   8. Finalizar corrida 1 → corrida 2 inicia automaticamente
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { io as ioClient, Socket } from 'socket.io-client'
import { Ride } from '../modules/ride/ride.schema'
import { User } from '../modules/user/user.schema'

const API_URL = `http://localhost:${process.env.PORT ?? 3000}`
const MONGODB_URI = process.env.MONGODB_URI!

// ─── Motorista seed (criado/atualizado direto no MongoDB) ─────────────────────

const SEED_DRIVER = {
  name: 'Carlos Seed',
  email: 'carlos.seed@test.com',
  password: 'senha123',
  phone: '31900000000',
  role: 'driver' as const,
  isApproved: true,
  isActive: true,
  document: '12345678901',
  licensePlate: 'ABC1D234',
  vehicleModel: 'Honda Civic',
  vehicleYear: 2022,
  vehicleColor: 'Preto',
}

// ─── Riders seed ──────────────────────────────────────────────────────────────

const SEED_RIDERS = [
  {
    name: 'Ana Seed',
    email: 'ana.seed@test.com',
    password: 'senha123',
    phone: '31900000001',
    role: 'rider' as const,
  },
  {
    name: 'Bruno Seed',
    email: 'bruno.seed@test.com',
    password: 'senha123',
    phone: '31900000002',
    role: 'rider' as const,
  },
]

// ─── Corridas próximas à localização do motorista (BH/Pampulha) ───────────────

const SEED_RIDES = [
  {
    // Rider 1 — corrida principal; destino ~1.5km de distância
    origin:      { lat: -19.8720833, lng: -44.0175517, address: 'Rua Ipanema, Urca, Pampulha, Belo Horizonte - MG' },
    destination: { lat: -19.8650000, lng: -44.0120000, address: 'Av. Otacílio Negrão de Lima, Pampulha, Belo Horizonte - MG' },
  },
  {
    // Rider 2 — segunda corrida; origem próxima ao destino da corrida 1
    origin:      { lat: -19.8655000, lng: -44.0130000, address: 'Lagoa da Pampulha, Belo Horizonte - MG' },
    destination: { lat: -19.8580000, lng: -44.0090000, address: 'Mineirão, Pampulha, Belo Horizonte - MG' },
  },
]

// ─── Helpers HTTP ─────────────────────────────────────────────────────────────

async function httpPost(path: string, body: object): Promise<any> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function loginOrRegister(rider: typeof SEED_RIDERS[0]): Promise<{ token: string; userId: string }> {
  const login = await httpPost('/api/auth/login', { email: rider.email, password: rider.password })
  if (login.token) {
    console.log(`  ✔ Login: ${rider.name} (${login.user.id})`)
    return { token: login.token, userId: login.user.id }
  }
  const reg = await httpPost('/api/auth/register', { ...rider })
  if (!reg.token) throw new Error(`Falha ao registrar ${rider.email}: ${JSON.stringify(reg)}`)
  console.log(`  ✔ Registrado: ${rider.name} (${reg.user.id})`)
  return { token: reg.token, userId: reg.user.id }
}

// ─── Helper socket ────────────────────────────────────────────────────────────

function createRideViaSocket(
  token: string,
  userId: string,
  rideData: typeof SEED_RIDES[0],
): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket: Socket = ioClient(API_URL, { auth: { token } })

    const timeout = setTimeout(() => {
      socket.disconnect()
      reject(new Error('Timeout — verifique se o backend está rodando e o motorista está online'))
    }, 15_000)

    socket.on('connect', () => {
      console.log(`  Socket conectado (${socket.id})`)
      socket.emit('USER_ONLINE', { userId, role: 'rider' })
      socket.emit('ride:create', { riderId: userId, origin: rideData.origin, destination: rideData.destination })
    })

    socket.on('RIDE_CREATED', (data: any) => {
      clearTimeout(timeout)
      socket.disconnect()
      resolve(data.rideId)
    })

    socket.on('RIDE_ERROR', (data: any) => {
      clearTimeout(timeout)
      socket.disconnect()
      reject(new Error(`RIDE_ERROR: ${data.error}`))
    })

    socket.on('connect_error', (err: Error) => {
      clearTimeout(timeout)
      reject(new Error(`Falha na conexão socket: ${err.message}`))
    })
  })
}

// ─── Upsert do motorista seed no MongoDB ─────────────────────────────────────

async function upsertSeedDriver(): Promise<void> {
  const passwordHash = await bcrypt.hash(SEED_DRIVER.password, 10)
  const { password, ...driverData } = SEED_DRIVER

  await User.findOneAndUpdate(
    { email: driverData.email },
    { $set: { ...driverData, passwordHash } },
    { upsert: true, new: true },
  )
  console.log(`✔ Motorista seed pronto: ${driverData.name} (${driverData.email})\n`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  // Argumento --rider=N (padrão: 1)
  const riderArg = process.argv.find(a => a.startsWith('--rider='))
  const riderIndex = riderArg ? parseInt(riderArg.split('=')[1], 10) - 1 : 0

  if (riderIndex < 0 || riderIndex >= SEED_RIDERS.length) {
    throw new Error(`--rider deve ser 1 ou 2`)
  }

  console.log(`Backend: ${API_URL}\n`)

  if (!MONGODB_URI) throw new Error('MONGODB_URI não definido no .env')
  await mongoose.connect(MONGODB_URI)

  // Primeira execução (rider 1): garante motorista seed no banco
  if (riderIndex === 0) {
    await upsertSeedDriver()
  }

  // Limpa corrida ativa do rider que vai ser criado
  const seedEmails = [SEED_RIDERS[riderIndex].email]
  const seedUsers = await User.find({ email: { $in: seedEmails } })
  const seedIds = seedUsers.map(u => u._id.toString())
  if (seedIds.length > 0) {
    const deleted = await Ride.deleteMany({
      riderId: { $in: seedIds },
      status: { $in: ['searching_driver', 'driver_assigned', 'in_progress', 'payment_pending'] },
    })
    if (deleted.deletedCount > 0)
      console.log(`✔ ${deleted.deletedCount} corrida(s) ativa(s) antiga(s) removida(s)\n`)
  }

  await mongoose.disconnect()

  // Cria a corrida via socket
  const riderData = SEED_RIDERS[riderIndex]
  const rideData  = SEED_RIDES[riderIndex]

  console.log(`── Rider ${riderIndex + 1}: ${riderData.name}`)
  const { token, userId } = await loginOrRegister(riderData)

  console.log(`  Criando corrida via socket...`)
  const rideId = await createRideViaSocket(token, userId, rideData)
  console.log(`  ✔ Corrida criada: ${rideId}`)
  console.log(`     Origem : ${rideData.origin.address}`)
  console.log(`     Destino: ${rideData.destination.address}\n`)

  // Credenciais resumidas
  console.log('─── Credenciais seed ───────────────────────────────────────')
  if (riderIndex === 0) {
    console.log(`  Motorista : ${SEED_DRIVER.name}`)
    console.log(`              ${SEED_DRIVER.email} / ${SEED_DRIVER.password}`)
    console.log(`              Veículo: ${SEED_DRIVER.vehicleModel} ${SEED_DRIVER.vehicleColor} — ${SEED_DRIVER.licensePlate}`)
  }
  console.log(`  Rider ${riderIndex + 1}   : ${riderData.name}`)
  console.log(`              ${riderData.email} / ${riderData.password}`)

  if (riderIndex === 0) {
    console.log('\n─── Próximos passos ────────────────────────────────────────')
    console.log('  1. Login no app do motorista com carlos.seed@test.com / senha123')
    console.log('  2. Ativar online → receber RIDE_REQUEST → aceitar')
    console.log('  3. No app do Rider 1 (ana.seed@test.com): ver OTP → motorista digita')
    console.log('  4. Corrida in_progress → motorista se aproxima do destino')
    console.log('  5. Badge "2ª corrida disponível" aparece no app do motorista')
    console.log('  6. Rodar: pnpm --filter backend seed -- --rider=2')
  } else {
    console.log('\n─── Próximos passos ────────────────────────────────────────')
    console.log('  7. App do motorista recebe RIDE_REQUEST → botão "Enfileirar"')
    console.log('  8. Aceitar → badge "2ª corrida enfileirada ✓"')
    console.log('  9. Finalizar corrida 1 → corrida 2 inicia automaticamente')
    console.log(' 10. Rider 2 (bruno.seed@test.com) recebe motorista a caminho')
  }

  console.log('\n✔ Seed concluído')
  process.exit(0)
}

run().catch(err => {
  console.error('\n✖ Seed falhou:', err.message)
  process.exit(1)
})
