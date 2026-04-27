# Auto Premium — Contexto Completo do Sistema

Sistema SaaS mobile-first de gestão de estoque para concessionárias de veículos. Permite cadastrar, acompanhar e vender veículos, com controle de equipe de vendas, clientes, importação via CSV e persistência em Firebase Firestore.

---

## 1. Visão Geral

| Item | Valor |
|---|---|
| Nome | Auto Premium |
| Stack | Next.js 16 (App Router), Zustand 5, Tailwind v4, Firebase/Firestore |
| Linguagem | TypeScript |
| Porta dev | 3008 (com `-H 0.0.0.0` para acesso mobile via Wi-Fi) |
| Build | `npm run build` |
| Start | `npm start` (`next start -p 3008 -H 0.0.0.0`) |
| Reiniciar | `npx kill-port 3008 && npm start` |
| GitHub | https://github.com/gustavomarx/car_system |
| Produção (Vercel) | https://car-system-six.vercel.app/ |

> O sistema roda com build de produção para testes mobile. O modo dev é lento em rede Wi-Fi — usar sempre `npm start`.

---

## 2. Estrutura de Pastas

```
src/
├── app/                          # Rotas (Next.js App Router)
│   ├── layout.tsx                # Layout raiz — ThemeProvider + DataProvider
│   ├── globals.css               # Design system: CSS vars, dark mode, classes utilitárias
│   ├── page.tsx                  # Dashboard (/)
│   ├── estoque/page.tsx          # Lista do estoque (/estoque)
│   ├── importar/page.tsx         # Importação via CSV (/importar)
│   ├── configuracoes/page.tsx    # Configurações (/configuracoes)
│   ├── veiculo/
│   │   ├── novo/page.tsx         # Cadastro multi-step (/veiculo/novo)
│   │   └── [id]/
│   │       ├── page.tsx          # Detalhe do veículo (/veiculo/[id])
│   │       └── editar/page.tsx   # Edição do veículo (/veiculo/[id]/editar)
│   ├── venda/
│   │   └── nova/page.tsx         # Registrar nova venda (/venda/nova)
│   ├── vendas/page.tsx           # Lista de vendas (/vendas)
│   └── vendedores/page.tsx       # Equipe de vendas (/vendedores)
├── components/
│   ├── ui/                       # Componentes de layout e UI genéricos
│   └── vehicle/                  # Componentes específicos de veículo
│   └── dashboard/                # Componentes do dashboard
├── store/
│   ├── useStore.ts               # Store de dados de negócio (Zustand + Firestore)
│   ├── useUIStore.ts             # Store de preferências de UI (Zustand + persist localStorage)
│   └── useDrawerStore.ts         # Store do drawer mobile (open/close)
├── lib/
│   ├── firebase.ts               # Inicialização do Firebase app + exports db e storage
│   ├── firestoreService.ts       # CRUD completo para todas as coleções Firestore
│   ├── storageService.ts         # Upload/delete de fotos no Firebase Storage
│   ├── migratePhotos.ts          # Migração one-time: base64 no Firestore → URLs do Storage
│   ├── seedFirestore.ts          # Seed inicial com dados mock (idempotente)
│   ├── csvUtils.ts               # Templates CSV, parser, validador por entidade
│   ├── vehicle-utils.ts          # Funções puras: qualidade, alertas, labels, formatação
│   └── useEnrichedVehicles.ts    # Hook que enriquece Vehicle[] com metadados calculados
├── data/
│   └── mock.ts                   # Dados de teste estruturais (usados no seed)
└── types/
    └── index.ts                  # Todos os tipos TypeScript do sistema
```

---

## 3. Fluxo de Dados

```
App Boot
  │
  ├─ ThemeScript (inline no <head>) → aplica classe dark antes do primeiro paint (anti-flash)
  │
  └─ layout.tsx: ThemeProvider → DataProvider → {children}
       │
       └─ DataProvider (useEffect no mount):
            ├─ loadAllData(dealershipId)
            │    ├─ seedFirestoreIfEmpty (verifica vehicles, popula se vazio)
            │    ├─ getVehicles + getSellers + getClients + getSales (paralelo)
            │    └─ useStore atualizado, isLoading = false
            └─ migrateBase64ToStorage() (assíncrono, não bloqueia UI)

UI renderizada
  │
  ├─ Páginas acessam useStore() → vehicles, sellers, clients, sales
  ├─ useEnrichedVehicles() → calcula daysInStock, alertLevel, label, qualityScore, profit, profitMargin
  └─ useUIStore() → theme, viewMode, stockView, dealershipName, defaultCommissionPercent

Ações do usuário (ex: addVehicle)
  ├─ 1. Atualiza Zustand imediatamente (UI responsiva — optimistic update)
  └─ 2. Chama Firestore em background (.catch(console.error))
```

---

## 4. Firebase / Firestore

### Configuração

Variáveis em `.env.local` (ignorado pelo git via `.env*`):

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID=auto-premium-4f43e
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

`firebase.ts` exporta `db` (Firestore) e `storage` (Firebase Storage). Usa `getApps().length === 0` para evitar reinicialização.

### Estrutura de Coleções (flat com `dealershipId`)

Todas as coleções são planas (não aninhadas). Queries filtram por `where('dealershipId', '==', dealershipId)`:

```
/vehicles/{id}   — Vehicle completo
/sellers/{id}    — Seller
/clients/{id}    — Client
/sales/{id}      — Sale
```

### `firestoreService.ts` — CRUD por Entidade

| Função | Operação Firestore |
|---|---|
| `getVehicles(dealershipId)` | Query com where |
| `saveVehicle(v)` | `setDoc` (cria ou sobrescreve) |
| `patchVehicle(id, updates)` | `updateDoc` (merge parcial) |
| `removeVehicle(id)` | `deleteDoc` |
| `getSellers(dealershipId)` | Query com where |
| `saveSeller(s)` | `setDoc` |
| `patchSeller(id, updates)` | `updateDoc` |
| `getClients(dealershipId)` | Query com where |
| `saveClient(c)` | `setDoc` |
| `getSales(dealershipId)` | Query com where |
| `saveSale(s)` | `setDoc` |
| `patchSale(id, updates)` | `updateDoc` |

### `storageService.ts` — Firebase Storage

| Função | Descrição |
|---|---|
| `uploadVehiclePhoto(dealershipId, vehicleId, file, fileName)` | Converte base64 em Blob se necessário; path: `vehicles/{dealershipId}/{vehicleId}/{fileName}`; retorna downloadURL |
| `deleteVehiclePhoto(url)` | Remove arquivo pelo URL; erros capturados silenciosamente |

### `seedFirestore.ts`

- Verifica se a coleção `vehicles` está vazia
- Se vazia: usa `writeBatch` para inserir `mockVehicles`, `mockSellers`, `mockClients`, `mockSales`
- **Idempotente**: chamada múltipla é segura

### `migratePhotos.ts`

- Percorre TODOS os veículos da coleção (sem filtro de dealershipId)
- Detecta imagens com URL começando em `'data:image'`
- Faz upload para Storage e substitui a URL no Firestore
- **Safe para rodar múltiplas vezes**: só processa base64

### Regras Firestore (dev)

```
allow read, write: if true;  // Sem auth — regras abertas para desenvolvimento
```

---

## 5. Tipos TypeScript (`src/types/index.ts`)

### Usuário e Permissões

```ts
type UserRole = 'admin' | 'seller'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
}
```

### Veículo

```ts
type VehicleStatus = 'available' | 'sold' | 'reserved'

type VehicleOptional =
  | 'Ar-condicionado' | 'Direção hidráulica' | 'Direção elétrica'
  | 'Vidros elétricos' | 'Travas elétricas' | 'Central multimídia'
  | 'Bluetooth' | 'Câmera de ré' | 'Sensor de estacionamento'
  | 'Banco de couro' | 'Rodas de liga leve' | 'Airbag' | 'ABS'
  | 'Start/Stop' | 'Piloto automático' | 'Teto solar'

interface VehicleImage {
  id: string
  url: string         // URL do Firebase Storage ou base64 (legacy)
  label?: string
  order: number       // Inteiro para ordenação (drag-drop); menor = primeiro
}

type VehicleHistoryAction = 'created' | 'edited' | 'sold' | 'photo_added' | 'reserved' | 'unreserved'

interface VehicleHistoryEntry {
  id: string
  date: string        // ISO string
  action: VehicleHistoryAction
  description: string
  userId?: string
}

interface VehicleExternalIds {
  webmotors?: string
  olx?: string
  icarros?: string
}

interface Vehicle {
  id: string
  brand: string
  model: string
  year: number
  salePrice: number
  purchasePrice?: number      // Opcional — afeta cálculo de profit e label "Alta/Baixa margem"
  description: string
  optionals: VehicleOptional[]
  images: VehicleImage[]
  status: VehicleStatus
  dealershipId: string
  createdAt: string           // ISO string
  updatedAt: string           // ISO string
  history: VehicleHistoryEntry[]
  externalIds?: VehicleExternalIds  // Prep para integração com marketplaces
}
```

### Metadados Computados

```ts
type StockAlertLevel = 'normal' | 'attention' | 'critical'

interface VehicleWithMeta extends Vehicle {
  daysInStock: number
  alertLevel: StockAlertLevel
  label: string               // String vazia se nenhum label se aplica
  qualityScore: number        // 0-100
  profit: number | null       // null se purchasePrice não informado
  profitMargin: number | null // null se purchasePrice não informado ou zero
}
```

### Venda

```ts
type CommissionType = 'percent' | 'fixed'

type SaleHistoryAction = 'created' | 'edited'

interface SaleHistoryEntry {
  id: string
  date: string
  action: SaleHistoryAction
  description: string
}

interface Sale {
  id: string
  vehicleId: string
  sellerId: string
  clientId?: string
  commissionType: CommissionType
  commissionValue: number     // Porcentagem OU valor fixo (dependendo de commissionType)
  finalPrice: number
  date: string                // ISO string
  dealershipId: string
  history: SaleHistoryEntry[]
}
```

### Entidades de Suporte

```ts
interface Seller {
  id: string
  name: string
  defaultCommissionPercent: number
  dealershipId: string
  phone?: string
  email?: string
  document?: string           // CPF ou RG
}

interface Client {
  id: string
  name: string
  phone: string
  dealershipId: string
}

interface Dealership {
  id: string
  name: string
  ownerId: string
}
```

---

## 6. Store (`src/store/`)

### `useStore.ts` — Dados de Negócio

Zustand **sem** persistência local. Dados carregados do Firestore via `DataProvider` no mount.

**Estado:**

| Campo | Tipo | Descrição |
|---|---|---|
| `vehicles` | `Vehicle[]` | Lista completa da concessionária |
| `sellers` | `Seller[]` | Equipe de vendas |
| `clients` | `Client[]` | Clientes cadastrados |
| `sales` | `Sale[]` | Histórico de vendas |
| `isLoading` | `boolean` | True enquanto carrega do Firestore |
| `currentDealershipId` | `string` | Tenant ativo (padrão: `'d1'`) |

**Ações:**

| Ação | Comportamento |
|---|---|
| `loadAllData(dealershipId)` | Executa seed se vazio, carrega as 4 coleções em paralelo do Firestore |
| `setCurrentDealershipId(id)` | Troca o tenant ativo |
| `addVehicle(v)` | Insere no início do array + `saveVehicle` Firestore |
| `updateVehicle(id, updates)` | Atualiza `updatedAt` + merge de updates + `patchVehicle` Firestore |
| `removeVehicle(id)` | Remove do array + `removeVehicle` Firestore |
| `reserveVehicle(id)` | Guard: só executa se `status === 'available'`; muda status para `reserved`; adiciona history entry; `patchVehicle` |
| `unreserveVehicle(id)` | Guard: só executa se `status === 'reserved'`; muda para `available`; history entry; `patchVehicle` |
| `addSale(s)` | Cria a venda + muda veículo para `sold` + adiciona entry `sold` no `vehicle.history` |
| `updateSale(id, updates)` | Merge de updates + `patchSale` Firestore |
| `addSeller(s)` | Adiciona + `saveSeller` Firestore |
| `updateSeller(id, updates)` | Merge + `patchSeller` Firestore |
| `addClient(c)` | Adiciona + `saveClient` Firestore |

> **Padrão optimistic:** toda mutation atualiza o Zustand imediatamente. O Firestore é chamado em background. Erros são apenas logados no console (`console.error`).

**Exportação especial:** `getLoadAllData()` — expõe `loadAllData` fora do hook para uso no `DataProvider`.

---

### `useUIStore.ts` — Preferências de UI

Zustand **com** `persist` → salva no `localStorage` com key `'ap-ui'`.

| Estado | Tipo | Padrão | Descrição |
|---|---|---|---|
| `theme` | `'light' \| 'dark'` | `'system'` | Tema visual |
| `viewMode` | `'auto' \| 'desktop'` | `'auto'` | Layout responsivo ou forçado desktop |
| `stockView` | `'card' \| 'list' \| 'detail'` | `'card'` | Modo de visualização do estoque |
| `dealershipName` | `string` | `'Auto Premium'` | Nome da loja (exibido no header/sidebar) |
| `defaultCommissionPercent` | `number` | `3` | Comissão padrão sugerida ao criar vendedor |

Ações: `setTheme`, `setViewMode`, `setStockView`, `setDealershipName`, `setDefaultCommissionPercent`.

---

### `useDrawerStore.ts` — Drawer Mobile

Estado simples: `open: boolean`. Ação: `setOpen(v: boolean)`. Usado por `TopBar` (hamburger) e `DrawerNav`.

---

## 7. `useEnrichedVehicles` (`src/lib/useEnrichedVehicles.ts`)

Hook client-side que transforma `Vehicle[]` em `VehicleWithMeta[]`.

**Campos calculados:**

| Campo | Cálculo |
|---|---|
| `daysInStock` | `(Date.now() - new Date(createdAt)) / 86400000` |
| `alertLevel` | `>30d` → `critical` \| `>15d` → `attention` \| `normal` |
| `profit` | `salePrice - purchasePrice` (null se sem `purchasePrice`) |
| `profitMargin` | `(profit / purchasePrice) * 100` (null se sem `purchasePrice` ou zero) |
| `label` | Ver tabela de labels automáticos |
| `qualityScore` | Ver pontuação de qualidade |

**`avgPrice`:** Média de `salePrice` apenas dos veículos `available` — usada para detectar o label "Oportunidade".

**Anti-hydration mismatch (SSR):** Antes do mount (`mounted === false`), retorna stub com `daysInStock: 0`, `alertLevel: 'normal'`, `profit: null`, `profitMargin: null`. Isso evita divergência entre SSR e cliente ao usar `new Date()`.

---

## 8. Regras de Negócio (`src/lib/vehicle-utils.ts`)

### Score de Qualidade (`calcQualityScore`)

| Critério | Pontos |
|---|---|
| Marca | 8 |
| Modelo | 8 |
| Ano | 8 |
| Preço de venda | 8 |
| Descrição ≥ 50 chars | 8 |
| 1ª foto | 15 |
| 2ª foto | 15 |
| 3ª foto | 15 |
| 4ª foto | 15 |
| **Total** | **100** |

Cores da barra: `≥80` → verde · `≥50` → âmbar · `<50` → azul.

### Alert Levels (`getAlertLevel`)

| Dias em estoque | Level | Borda no card |
|---|---|---|
| 0–15 | `normal` | Verde |
| 16–30 | `attention` | Âmbar |
| >30 | `critical` | Vermelho |

### Labels Automáticos (`getAutoLabel`)

Prioridade em ordem — apenas o primeiro match é aplicado:

| Condição | Label |
|---|---|
| `daysInStock <= 7` | "Recém chegado" |
| `daysInStock > 30` | "Parado há muito tempo" |
| `salePrice < avgPrice * 0.9` | "Oportunidade" |
| `profitMargin >= 20` | "Alta margem" |
| `profitMargin < 8` | "Margem baixa" |
| _(nenhum match)_ | `""` (string vazia) |

### Cálculo de Comissão

```ts
// Tipo 'percent'
commissionAmount = (finalPrice * commissionValue) / 100

// Tipo 'fixed'
commissionAmount = commissionValue
```

### Status Reserved

- `reserveVehicle` só executa se `status === 'available'` (guard no store)
- `unreserveVehicle` só executa se `status === 'reserved'` (guard no store)
- Veículo reservado: botão "Registrar Venda" bloqueado com aviso visual

### Efeito Cascata de `addSale`

1. Cria a venda no Zustand + Firestore
2. Muda `vehicle.status` → `'sold'` + `patchVehicle`
3. Adiciona entrada `{ action: 'sold' }` em `vehicle.history`

### Histórico de Edições em Vendas

Ao editar, compara campo a campo e gera diff legível salvo em `sale.history`:
```
"Preço: R$ 315.000,00 → R$ 310.000,00 | Vendedor: Carlos → Fernanda"
```

### Formatação de Moeda

```ts
formatCurrency(value)   // number → "R$ 128.000,00" (Intl.NumberFormat 'pt-BR')
formatBRL(rawInput)     // "12800000" → "128.000,00" (input centavo a centavo)
parseBRL(formatted)     // "128.000,00" → 128000
```

---

## 9. Módulos por Rota

### `/` — Dashboard

**KPIs exibidos (useMemo):**

| Métrica | Cálculo |
|---|---|
| Valor do Estoque | Soma `salePrice` de veículos `available` |
| Total em Estoque | Count de veículos `available` |
| Atenção/Parados | Count com `alertLevel !== 'normal'` e status `available` |
| Top Vendedor | Vendedor com maior count de vendas |
| Ticket Médio | `totalRevenue / sales.length` (guard: zero) |
| Taxa de Conversão | `(sales / total vehicles) * 100` (guard: zero) |
| Tempo Médio de Venda | Cruza `vehicle.createdAt` com `sale.date` dos vendidos |

**Estoque Recente:** últimos 3 veículos disponíveis com badge de alerta.

**Alert Banner:** exibe se há veículos `available` com `alertLevel === 'critical'`. Link para `/estoque?sort=mais-tempo`.

---

### `/estoque` — Estoque

- **Tabs:** Disponíveis / Vendidos — aba "Disponíveis" inclui veículos `available` **e** `reserved`
- **Busca:** Filtra por texto em `brand + model + year` (case-insensitive)
- **Modos de visualização:** Card / Lista / Detalhe (persiste em `useUIStore.stockView`)
- **Ordenação (só disponíveis):** mais tempo em estoque · melhor qualidade · maior preço · menor preço
- **Sort via URL:** parâmetro `?sort=mais-tempo` lido no mount via `useSearchParams` (envolto em `<Suspense>`)

---

### `/veiculo/novo` — Cadastro Multi-step

**3 etapas com `StepBar` sticky:**

1. **Informações** — `brand`, `model`, `year`, `salePrice` (obrigatórios para avançar), `purchasePrice` (opcional)
2. **Fotos** — `PhotoUpload` + `ImageCropper` (crop 4:3 obrigatório, compressão automática ≤1200px, JPEG 85%)
3. **Detalhes** — `description` (textarea), `optionals` (multi-select chips)

**Score de qualidade:** atualizado em tempo real na `StepBar`. Botão "Salvar" só habilita se step 0 válido.

**ID gerado:** `v-${Date.now()}` no mount. Redireciona para `/estoque` após salvar.

---

### `/veiculo/[id]` — Detalhe do Veículo

**Seções:**
1. Galeria de imagens com scroll horizontal (ordenadas por `order`)
2. Header: nome do veículo, preços (venda e compra), badges de status
3. Alertas condicionais por status:
   - `sold`: badge "Vendido" (cinza)
   - `available`: timer com dias, badge de label, score de qualidade
   - `reserved`: badge "Reservado" (violeta)
4. Descrição e opcionais
5. Histórico em `HistoryTimeline`

**Ações por status:**

| Status | Ações disponíveis |
|---|---|
| `available` | "Registrar Venda" + "Reservar Veículo" + "Compartilhar no WhatsApp" |
| `reserved` | "Remover Reserva" + "Compartilhar no WhatsApp" |
| `sold` | Somente leitura — nenhum botão de ação |

**WhatsApp:** Mensagem pré-formatada com `brand`, `model`, `year`, `salePrice` e `description` truncada.

---

### `/veiculo/[id]/editar` — Edição

- Formulário único com mini quality bar sticky
- Todos os campos pré-preenchidos com valores atuais
- `router.replace` ao salvar (não empilha histórico — back button vai ao detalhe)
- Adiciona entry `{ action: 'edited' }` no `vehicle.history`

---

### `/venda/nova` — Nova Venda

**`SearchSelect` (componente local):** Input com autocomplete, dropdown filtrado por texto, opção de limpar (X). Cada opção tem `label` e `sub` (subtítulo).

**Campos:**
- **Veículo:** SearchSelect de `available` (subtítulo: preço de venda)
- **Vendedor:** SearchSelect de sellers (subtítulo: comissão padrão %)
- **Cliente:** SearchSelect de clients (subtítulo: telefone) **ou** cadastro inline (nome + telefone mascarado)
- **Preço Final:** pré-preenchido com `vehicle.salePrice` ao selecionar veículo
- **Comissão:** tipo Percentual/Fixo + valor; pré-preenchido com `seller.defaultCommissionPercent` ao selecionar vendedor; mostra valor calculado em tempo real

**Ao salvar:**
1. Cria cliente novo (se `showNewClient && newClientName`)
2. Cria `Sale` com `id: sale-${Date.now()}`
3. Chama `addSale` (cascata: cria venda + marca veículo `sold`)
4. Redireciona para `/vendas`

---

### `/vendas` — Lista de Vendas

- **KPIs:** Receita Total (soma `finalPrice`) + Comissões Pagas (soma calculada)
- **Lista:** ordenada por `date` DESC
- **Bottom sheet ao clicar:** alterna entre modo View e Edit
  - **View:** detalhes da venda, histórico em timeline, botão "Editar"
  - **Edit:** edita `finalPrice`, tipo e valor de comissão, `sellerId`, `clientId`; gera diff legível salvo em `sale.history`

---

### `/vendedores` — Equipe

- **Lista:** ordenada por count de vendas DESC; top vendedor ganha badge de troféu
- **Form de novo vendedor:** `name`, `phone` (mascarado), `email`, `document`, `commissionPercent`; comissão padrão do `useUIStore`
- **Bottom sheet:** View (telefone, email, documento, comissão, count vendas) + Edit

---

### `/configuracoes` — Configurações

**Dados da Loja** (persistidos no `useUIStore` → `localStorage`):
- Nome da loja (`dealershipName`) — exibido no header e sidebar
- Comissão padrão (`defaultCommissionPercent`) — sugerida ao criar vendedor
- Campos com estado local (`localName`, `localCommission`) — salvos ao clicar "Salvar"
- Botão exibe "Salvo!" + ícone Check por 2s após salvar

**Aparência:**
- Tema: Claro / Escuro (botões toggle)
- Layout: Automático / Desktop

---

### `/importar` — Importação CSV

**3 tabs:** Veículos | Vendedores | Clientes

**Fluxo em 3 passos:**
1. **Download template:** CSV com separador `;` (abre corretamente no Excel/LibreOffice)
2. **Upload:** área drag-drop ou clique → parse e preview na tela
3. **Edição + Confirmação:** editar linha (bottom sheet), remover linha, importar → salva no Firestore

**Templates:**
- Veículos: `marca;modelo;ano;preco_venda;preco_compra;descricao`
- Vendedores: `nome;comissao_padrao;telefone;email`
- Clientes: `nome;telefone`

**Validações (`csvUtils.ts`):**
- Veículos: `marca`, `modelo` obrigatórios; `ano` entre 1900 e ano atual+1; `preco_venda > 0`
- Vendedores: `nome` obrigatório; `comissao_padrao` entre 0 e 100
- Clientes: `nome` obrigatório

Erros retornados: `{ row: number, field: string, message: string }[]` — exibidos por linha antes de permitir importar.

> Opcionais e fotos **não** fazem parte do CSV — selecionados dentro do sistema após importar.

---

## 10. Design System

### CSS Custom Properties (`globals.css`)

**Light Mode:**
```css
--ap-bg: #fafafa                /* Fundo da página */
--ap-surface: #ffffff           /* Superfície de cards */
--ap-surface-2: #f4f4f5         /* Superfície secundária (hover, inputs) */
--ap-border: #e4e4e7            /* Bordas */
--ap-text: #09090b              /* Texto principal */
--ap-text-2: #71717a            /* Texto secundário */
--ap-text-3: #a1a1aa            /* Texto terciário/placeholder */
--ap-primary: #7c3aed           /* Violeta 600 — cor principal */
--ap-primary-2: #6d28d9         /* Violeta 700 — hover do primary */
--ap-primary-sub: #ede9fe       /* Fundo sutil para elementos primary */
--ap-primary-text: #7c3aed      /* Texto em cor primary */
--ap-price: #2563eb             /* Azul para preços */
--ap-nav-bg: #ffffff
--ap-nav-border: #e4e4e7
--ap-nav-active: #7c3aed
--ap-nav-idle: #a1a1aa
```

**Dark Mode** (`.dark {}`): backgrounds escuros, purples mais brilhantes (`#8b5cf6`). `@theme inline {}` mapeia vars para utilities Tailwind.

### Anti-flash de Tema (`ThemeScript`)

Script bloqueante inserido no `<head>` antes da hidratação do React. Lê o tema do `localStorage['ap-ui']` e aplica a classe `dark` imediatamente — zero flash de tema errado.

### Como aplicar dark mode em novos componentes

```tsx
// ✅ Correto — tokens semânticos
<div className="bg-ap-surface text-ap-text border-ap-border">

// ❌ Errado — cores hardcoded não respondem ao dark mode
<div className="bg-white text-slate-700">

// ✅ Inline style quando necessário
style={{ backgroundColor: 'var(--ap-surface)' }}
```

### Classes Utilitárias

| Classe | O que aplica |
|---|---|
| `.ap-card` | `bg-ap-surface rounded-2xl border border-ap-border shadow-sm` |
| `.ap-input` | Input com bg/border/text via CSS vars, focus ring violeta, altura 2.75rem |
| `.ap-textarea` | Igual ao `.ap-input` com `resize-none` |
| `.ap-select` | Select estilizado consistente |
| `.no-scrollbar` | Remove scrollbars em mobile (webkit + ms) |

### Inputs com Prefixo ou Sufixo

`.ap-input` tem especificidade maior que utilities Tailwind. Classes como `pl-9` são ignoradas. **Sempre usar `style` inline:**

```tsx
// ✅ Correto
<input className="ap-input" style={{ paddingLeft: '2.5rem' }} />
<span className="absolute left-3 pointer-events-none">R$</span>

// ❌ Errado — pl-9 é ignorado pela especificidade do .ap-input
<input className="ap-input pl-9" />
```

---

## 11. Layout & Navegação

### `AppShell`

| Condição | Sidebar | BottomNav | Largura do conteúdo |
|---|---|---|---|
| `viewMode: 'auto'` + tela pequena | Oculta | Visível | `max-w-lg mx-auto` |
| `viewMode: 'auto'` + tela `lg+` | Visível | Oculta | Full width |
| `viewMode: 'desktop'` | Sempre | Nunca | Full width |

`<main>` recebe `pb-20` apenas quando BottomNav está visível. `<Footer>` é renderizado após `<main>`.

### Sidebar (desktop)

- Largura: `w-64` (256px), sticky
- Header: logo + `dealershipName` do `useUIStore`
- Links principais + bloco inferior com "Importar CSV" e "Configurações"

### BottomNav (mobile)

6 itens: Dashboard · Estoque · **Novo** (prominente) · Equipe · Vendas · Importar

### DrawerNav (mobile)

- Slide-out da direita, fecha ao navegar
- Mesmo layout lógico da Sidebar
- Bloqueia scroll do body quando aberto
- Acionado pelo hamburger no `TopBar`

### Padrão de Bottom Sheet

```tsx
<div className="fixed inset-0 z-50 flex flex-col justify-end">
  <div className="absolute inset-0 bg-black/40" onClick={fechar} />
  <div
    className="relative rounded-t-2xl p-5 pb-24 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
    style={{ backgroundColor: 'var(--ap-surface)' }}
  >
    {/* conteúdo */}
  </div>
</div>
```

> `pb-24` garante que o botão de ação fique visível acima do BottomNav.

---

## 12. Componentes

### UI Genéricos (`src/components/ui/`)

| Componente | Props / Comportamento |
|---|---|
| `AppShell` | Layout responsivo. Inclui `<Footer>` após o `<main>` |
| `Footer` | "© 2026 Auto Premium · por Gustavo Peixoto" |
| `Sidebar` | Navegação desktop, exibe `dealershipName` do `useUIStore` |
| `BottomNav` | Navegação mobile, 6 itens |
| `DrawerNav` | Slide-out mobile acionado pelo `useDrawerStore` |
| `DataProvider` | Client component; chama `loadAllData` + `migrateBase64ToStorage` no mount; mostra spinner enquanto `isLoading === true` |
| `TopBar` | `title`, `showBack?`, `right?`; sticky top-0 z-40; back via `router.back()` |
| `Button` | `variant`: primary / secondary / ghost / danger; `size`: sm / md / lg; `fullWidth` |
| `Badge` | `variant`: default / success / warning / danger / blue / reserved (violeta) |
| `ThemeProvider` | Aplica classe `dark` ao `<html>` reativamente via `useEffect` |
| `ThemeScript` | Script anti-flash no `<head>` (bloqueante, antes da hidratação) |
| `HistoryTimeline` | `entries[]`, `newestFirst?` (padrão: true); ícones por tipo de ação |

**`HistoryTimeline` — configuração de ícones:**

| Ação | Ícone | Cor |
|---|---|---|
| `created` | PlusCircle | Verde |
| `edited` | Pencil | Azul |
| `sold` | DollarSign | Verde |
| `photo_added` | Camera | Violeta |
| `reserved` | BookmarkCheck | Violeta |
| `unreserved` | BookmarkX | Âmbar |

### Veículo (`src/components/vehicle/`)

**`PhotoUpload`**
- 4 slots recomendados: Frontal, Diagonal, Interior, Traseira
- 2 botões: "Tirar Foto" (camera) e "Galeria"
- Drag-drop vertical com `@hello-pangea/dnd` para reordenar
- Abre `ImageCropper` após selecionar
- Fallback: salva base64 se upload no Storage falhar
- Badge "CAPA" na primeira foto
- Botão remove (X vermelho) por foto

**`ImageCropper`**
- `react-easy-crop` com aspect ratio fixo 4:3
- Zoom slider com botões -/+
- Compressão: resize ≤1200px (MAX_DIMENSION), JPEG quality 0.85
- Retorna `canvas.toDataURL('image/jpeg', 0.85)`
- Layout: header (Cancel | título | zoom) + crop area + botão Salvar no footer

**`QualityScore`**
- Props: `score` (0-100)
- Barra com cor dinâmica: verde ≥80 · âmbar ≥50 · azul <50
- Emoji scale visual (🚗 a 💰)
- Label e dicas dinâmicas para melhorar score

**`OptionalsSelector`**
- Grid de chips toggle
- Ativo: bg blue, texto branco, checkmark
- Inativo: bg branco, texto slate, borda

**`VehicleCard`**
- Borda esquerda 4px colorida por `alertLevel`
- Imagem 96×72px
- Label overlay (se não vendido)
- Badges de status (Vendido cinza, Reservado violeta)
- Preço em `--ap-price` (azul)
- Dias em estoque com ícone Clock
- Barra de qualidade

**`VehicleListRow`**
- Linha compacta; imagem 48×40px
- Dias em estoque (se não vendido); preço à direita
- Hover: `bg-ap-surface-2`

**`VehicleDetailCard`**
- Imagem full width 176px height
- Borda superior 4px colorida por `alertLevel`
- Dias e quality score em row

### Dashboard (`src/components/dashboard/`)

**`KpiCard`**
- Props: `label`, `value`, `sub?`, `icon`, `accent?` (blue/green/amber/red/violet), `href?`
- Se `href`: é um `<Link>` com hover shadow; mostra "Ver detalhes →" em `--ap-primary`

**`AlertBanner`**
- Filtra veículos `available` com `alertLevel === 'critical'`
- Retorna `null` se não houver críticos
- Card vermelho com ícone AlertTriangle + link para `/estoque?sort=mais-tempo`

---

## 13. Dados Mock (`src/data/mock.ts`)

Usados apenas pelo `seedFirestore.ts` para popular o Firestore na primeira carga.

| Entidade | Quantidade | Destaques |
|---|---|---|
| `mockDealership` | 1 | `{ id: 'd1', name: 'Auto Premium', ownerId: 'u1' }` |
| `mockSellers` | 3 | Carlos, Fernanda, Rafael — comissões diferentes |
| `mockClients` | 3 | João, Maria, Pedro |
| `mockVehicles` | 5 | v1 Corolla (5d), v2 Civic (22d), v3 Compass (3d), v4 T-Cross (38d — parado!), v5 Mustang (vendido) |
| `mockSales` | 1 | Mustang → Pedro via Carlos, 10 dias atrás |

---

## 14. Convenções de Código

### Criação de Entidades

Sempre usar `currentDealershipId` do `useStore()`. **Nunca hardcodar `'d1'`**.

### Navegação pós-edição

Usar `router.replace` (não `router.push`) ao salvar edições — o back button vai ao detalhe, não à tela de edição.

### `SearchSelect` (busca com dropdown)

Componente local em `/venda/nova/page.tsx`. Para reutilizar: extrair para `src/components/ui/SearchSelect.tsx`.

```tsx
<SearchSelect
  options={[{ id: string, label: string, sub?: string }]}
  value={selectedId}
  onChange={(id) => setSelectedId(id)}
  placeholder="Buscar..."
/>
```

### `next.config.ts`

```ts
const nextConfig = {
  allowedDevOrigins: ["192.168.0.15"],  // Acesso mobile via Wi-Fi LAN
  devIndicators: false,                  // Toolbar dev desabilitada (performance)
}
```

---

## 15. Dependências Principais (`package.json`)

| Pacote | Versão | Função |
|---|---|---|
| `next` | 16.2.4 | Framework (App Router, Turbopack) |
| `react` / `react-dom` | 19.2.4 | UI |
| `firebase` | 12.12.1 | Firestore + Storage |
| `zustand` | 5.0.12 | State management |
| `lucide-react` | 1.8.0 | Ícones |
| `react-easy-crop` | 5.5.7 | Crop de imagens 4:3 |
| `@hello-pangea/dnd` | 18.0.1 | Drag-drop de fotos |
| `tailwindcss` | 4 | Estilos (com `@tailwindcss/postcss`) |
| `typescript` | 5 | Tipagem estática |

**Scripts:**
```json
"dev":   "next dev -p 3008 -H 0.0.0.0"
"build": "next build"
"start": "next start -p 3008 -H 0.0.0.0"
"lint":  "eslint"
```

---

## 16. Estado de Implementação

| Funcionalidade | Status |
|---|---|
| Firebase/Firestore — CRUD completo | ✅ |
| Firebase Storage — upload/delete de fotos | ✅ |
| Migração base64 → Storage URLs | ✅ |
| Seed automático com dados mock | ✅ |
| Multi-tenant (`dealershipId`) | ✅ Estrutura pronta; `'d1'` hardcoded |
| Autenticação de usuários | ❌ Não implementado |
| Firestore rules por auth | ❌ Abertas para dev |
| Integração marketplace (webmotors, olx) | ❌ Tipos preparados (`externalIds`) |
| Importação CSV | ✅ |
| `SearchSelect` reutilizável | ❌ Só em `/venda/nova` |
