# Auto Premium — Contexto do Sistema

Sistema SaaS mobile-first de gestão de estoque para concessionárias de veículos.

---

## 1. Visão Geral

| Item | Valor |
|---|---|
| Nome | Auto Premium |
| Stack | Next.js 16 (App Router), Zustand 5, Tailwind v4, Firebase/Firestore |
| Linguagem | TypeScript |
| Porta | 3008 (produção) |
| Build | `npm run build` |
| Start | `npm start` (script fixado em `package.json` com `-p 3008`) |
| Reiniciar | `npx kill-port 3008 && npm start` |

O sistema roda em produção para testes mobile. O modo dev é lento em rede Wi-Fi — sempre usar o build de produção para testar no celular.

---

## 2. Arquitetura

### Estrutura de pastas

```
src/
├── app/                        # Rotas (Next.js App Router)
│   ├── layout.tsx              # Layout raiz — ThemeProvider + DataProvider
│   ├── globals.css             # CSS global + tokens + classes utilitárias
│   ├── page.tsx                # Dashboard (/)
│   ├── estoque/                # Lista do estoque (/estoque)
│   ├── importar/               # Importação via CSV (/importar)
│   ├── configuracoes/          # Configurações (/configuracoes)
│   ├── veiculo/
│   │   ├── novo/               # Cadastro multi-step (/veiculo/novo)
│   │   └── [id]/
│   │       ├── page.tsx        # Detalhe do veículo
│   │       └── editar/         # Edição do veículo
│   ├── venda/
│   │   └── nova/               # Registrar nova venda
│   ├── vendas/                 # Lista de vendas
│   └── vendedores/             # Equipe de vendas
├── components/
│   ├── ui/                     # Componentes de layout/UI genéricos
│   └── vehicle/                # Componentes específicos de veículo
│   └── dashboard/              # Componentes do dashboard
├── store/
│   ├── useStore.ts             # Store de dados de negócio (Zustand + Firestore)
│   └── useUIStore.ts           # Store de preferências de UI (Zustand + persist)
├── lib/
│   ├── firebase.ts             # Inicialização do Firebase app + export db e storage
│   ├── firestoreService.ts     # CRUD completo para todas as coleções
│   ├── storageService.ts       # Upload/delete de fotos no Firebase Storage
│   ├── migratePhotos.ts        # Migração one-time de base64 → Storage URLs
│   ├── seedFirestore.ts        # Popula Firestore com dados mock se estiver vazio
│   ├── csvUtils.ts             # Templates CSV + parser + validador por entidade
│   ├── vehicle-utils.ts        # Funções puras de cálculo e formatação
│   └── useEnrichedVehicles.ts  # Hook que enriquece Vehicle[] com metadados
├── data/
│   └── mock.ts                 # Dados estruturais (sem imagens) — usado apenas para referência
└── types/
    └── index.ts                # Todos os tipos TypeScript do sistema
```

### Fluxo de dados

```
Firestore  →  DataProvider (mount)  →  useStore (Zustand)  →  useEnrichedVehicles  →  UI
                                           ↕ (mutations otimistas: local + Firestore async)
                                      useUIStore (theme, viewMode, stockView, dealershipName, defaultCommissionPercent)
```

### Layout raiz (`app/layout.tsx`)

- Insere `<ThemeScript />` no `<head>` antes da hidratação para evitar flash de tema errado
- Envolve com `<ThemeProvider>` → `<DataProvider>` que carrega dados do Firestore no mount
- `suppressHydrationWarning` no `<html>` suprime o warning do React
- Viewport: `width=device-width`, `initialScale=1`, `maximumScale=1`

---

## 3. Firebase / Firestore

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

`firebase.ts` exporta `db` (Firestore) e `storage` (Firebase Storage).

### Estrutura de coleções (flat com `dealershipId`)

```
/vehicles/{id}   — Vehicle completo
/sellers/{id}    — Seller
/clients/{id}    — Client
/sales/{id}      — Sale
```

Todas as queries filtram por `where('dealershipId', '==', dealershipId)`.

### `firestoreService.ts`

| Função | Operação |
|---|---|
| `getVehicles / getSellers / getClients / getSales` | Leitura por dealershipId |
| `saveVehicle / saveSeller / saveClient / saveSale` | `setDoc` (cria ou sobrescreve) |
| `patchVehicle / patchSeller / patchSale` | `updateDoc` (patch parcial) |
| `removeVehicle` | `deleteDoc` |

### `storageService.ts`

| Função | Operação |
|---|---|
| `uploadVehiclePhoto(dealershipId, vehicleId, file)` | Upload para `vehicles/{dealershipId}/{vehicleId}/{fileName}` → retorna URL pública |
| `deleteVehiclePhoto(url)` | Remove arquivo do Storage pelo URL |

### `seedFirestore.ts`

Popula Firestore com dados de `src/data/mock.ts` na primeira carga (se coleções estiverem vazias). Chamado pelo `DataProvider` no mount.

### `migratePhotos.ts`

Migração one-time que converte fotos em base64 armazenadas no Firestore para URLs do Firebase Storage. Chamado pelo `DataProvider` no mount.

### `DataProvider`

Client component em `layout.tsx` que chama `loadAllData(dealershipId)` no mount via `useEffect`. Popula o Zustand store com dados do Firestore.

### Mutations otimistas

Todas as mutations do `useStore` seguem o padrão:
1. Atualiza Zustand imediatamente (UI responsiva)
2. Chama função do `firestoreService` em background (`.catch(console.error)`)

---

## 4. Módulos por Rota

### `/` — Dashboard

**Métricas de estoque:**
- Valor total do estoque, total disponível, veículos parados (+15 dias), top vendedor

**Métricas de vendas:**
- **Ticket médio** — `totalRevenue / sales.length` (guard: zero)
- **Taxa de conversão** — `(sales / vehicles) * 100` (guard: zero)
- **Tempo médio de venda** — cruza `vehicle.createdAt` com `sale.date` dos vendidos

Todos com `useMemo`. Cards clicáveis via `href` no `KpiCard`.

**Estoque recente:** últimos 3 veículos disponíveis com badge de alerta.

---

### `/estoque` — Estoque

- Busca por texto com ícone lupa (padding corrigido via `style`)
- Filtro status (Disponíveis / Vendidos), ordenação
- Aba "Disponíveis" inclui `available` **e** `reserved`
- Toggle de visualização: Card / Lista / Detalhe (persiste em `useUIStore.stockView`)
- Sort param via URL (`?sort=mais-tempo`) lido no mount

---

### `/importar` — Importar CSV

**Fluxo em 3 passos:**
1. Baixar template CSV (separador `;`, padrão pt-BR)
2. Enviar CSV preenchido → parse e preview na tela
3. Editar/remover linhas individualmente → confirmar importação → salva no Firestore

**Abas:** Veículos | Vendedores | Clientes

**Templates:**
- **Veículos:** `marca;modelo;ano;preco_venda;preco_compra;descricao` (opcionais e fotos selecionados dentro do sistema)
- **Vendedores:** `nome;comissao_padrao;telefone;email`
- **Clientes:** `nome;telefone`

**Edição por linha:** botão lápis abre bottom sheet com campos editáveis; botão lixeira remove a linha.

**Validação:** erros por linha com campo e motivo antes de permitir importar.

**Navegação:** link na Sidebar (desktop) e no BottomNav mobile (substituiu "Config").

---

### `/veiculo/[id]` — Detalhe do Veículo

- Galeria de imagens ordenada por `order`
- Badge de status: `Vendido` (cinza), `Reservado` (violeta)
- Score de qualidade, opcionais, histórico em timeline visual
- **Fluxo por status:**
  - `available` → botão "Registrar Venda" + botão "Reservar Veículo"
  - `reserved` → aviso de bloqueio + botão "Remover Reserva" (sem venda)
  - `sold` → estado somente leitura
- Botão compartilhar WhatsApp sempre visível (exceto vendido)
- Navegação: `router.replace` ao salvar edição

---

### `/veiculo/novo` — Cadastro Multi-step

**3 etapas:**
1. Informações (marca, modelo, ano, preços) — obrigatórios para avançar
2. Fotos — `PhotoUpload` + `ImageCropper` (crop 4:3, compressão automática ≤1200px)
3. Detalhes — descrição, opcionais

`StepBar` sticky com score de qualidade em tempo real. Usa `currentDealershipId` do store.

---

### `/veiculo/[id]/editar` — Edição

- Formulário único com mini quality bar sticky
- `router.replace` ao salvar (não empilha histórico do browser)
- Adiciona entrada `edited` no histórico do veículo

---

### `/vendas` — Lista de Vendas

- KPIs: receita total + comissões totais
- Bottom sheet ao clicar: detalhe + histórico em timeline
- Edição com diff automático salvo no `sale.history`

---

### `/venda/nova` — Nova Venda

- **SearchSelect** para veículo, vendedor e cliente: input com busca em tempo real + dropdown filtrado
  - Veículo: mostra preço como subtítulo; só lista `available`
  - Vendedor: mostra comissão padrão como subtítulo
  - Cliente: mostra telefone como subtítulo
  - Botão X para limpar seleção
- Comissão pré-preenchida com `defaultCommissionPercent` do vendedor selecionado
- Preço final pré-preenchido com `salePrice` do veículo selecionado
- Cliente: seleção via SearchSelect ou cadastro inline (nome + telefone)
- `addSale` marca veículo como `sold` automaticamente

---

### `/vendedores` — Equipe

- Lista ordenada por vendas; 1º com vendas ganha badge troféu
- Comissão do formulário de novo vendedor pré-preenchida com `defaultCommissionPercent` do `useUIStore`
- Bottom sheet: detalhe + edição via `updateSeller`

---

### `/configuracoes` — Configurações

**Dados da Loja** (persistidos em localStorage):
- Nome da loja (`dealershipName`) — exibido no cabeçalho da Sidebar
- Comissão padrão (`defaultCommissionPercent`) — sugerida ao criar vendedor
- Campos com estado local (`localName`, `localCommission`) — salvos ao clicar em "Salvar"
- Botão Salvar exibe "Salvo!" + ícone Check por 2 segundos após persistir

**Aparência:**
- Tema: Claro / Escuro (opção "Sistema" removida)
- Layout: Automático / Desktop

---

## 5. Store

### `useStore` — Dados de Negócio

Zustand sem persistência local. Dados carregados do Firestore via `DataProvider` no mount.

| Estado | Tipo |
|---|---|
| `vehicles` | `Vehicle[]` |
| `sellers` | `Seller[]` |
| `clients` | `Client[]` |
| `sales` | `Sale[]` |
| `isLoading` | `boolean` |
| `currentDealershipId` | `string` (`'d1'`) |

| Ação | Efeito colateral |
|---|---|
| `loadAllData(dealershipId)` | Busca todas as coleções do Firestore em paralelo |
| `addVehicle` | Zustand + `saveVehicle` Firestore |
| `updateVehicle` | Zustand + `patchVehicle` Firestore |
| `removeVehicle` | Zustand + `removeVehicle` Firestore |
| `reserveVehicle(id)` | Status → `reserved` + histórico (guard: `available`) + `patchVehicle` |
| `unreserveVehicle(id)` | Status → `available` + histórico (guard: `reserved`) + `patchVehicle` |
| `addSale` | Cria venda + marca veículo `sold` + histórico + Firestore |
| `updateSale` | Zustand + `patchSale` Firestore |
| `addSeller` | Zustand + `saveSeller` Firestore |
| `updateSeller` | Zustand + `patchSeller` Firestore |
| `addClient` | Zustand + `saveClient` Firestore |
| `setCurrentDealershipId` | Troca tenant ativo |

### `useUIStore` — Preferências de UI

Zustand com `persist` → `localStorage['ap-ui']`.

| Estado | Tipo | Padrão |
|---|---|---|
| `theme` | `'light' \| 'dark'` | `'system'` |
| `viewMode` | `'auto' \| 'desktop'` | `'auto'` |
| `stockView` | `'card' \| 'list' \| 'detail'` | `'card'` |
| `dealershipName` | `string` | `'Auto Premium'` |
| `defaultCommissionPercent` | `number` | `3` |

---

## 6. Hook `useEnrichedVehicles`

Transforma `Vehicle[]` em `VehicleWithMeta[]`:

| Campo | Cálculo |
|---|---|
| `daysInStock` | `(now - createdAt) / 86400000` |
| `alertLevel` | `>30d` → critical \| `>15d` → attention \| normal |
| `profit` | `salePrice - purchasePrice` (null se sem `purchasePrice`) |
| `profitMargin` | `(profit / purchasePrice) * 100` (null se sem `purchasePrice` ou zero) |
| `label` | Ver labels automáticos abaixo |
| `qualityScore` | Ver regras de negócio |

**SSR:** Retorna `daysInStock: 0`, `alertLevel: 'normal'`, `profit: null`, `profitMargin: null` antes do mount para evitar hydration mismatch.

**`avgPrice`:** Média de `salePrice` apenas dos `available`, usado para detectar "Oportunidade".

---

## 7. Sistema de Tema

### CSS Custom Properties (`globals.css`)

```
--ap-bg, --ap-surface, --ap-surface-2   fundos
--ap-border                              bordas
--ap-text, --ap-text-2, --ap-text-3     textos
--ap-primary, --ap-primary-2            violeta-600
--ap-primary-sub                        fundo sutil do primary
--ap-price                              azul para preços
--ap-nav-*                              navegação
```

`.dark {}` sobrescreve todas as vars. `@theme inline {}` mapeia para utilities Tailwind.

### Anti-flash (`ThemeScript`)

Script bloqueante no `<head>` aplica classe `dark` antes do primeiro paint — zero flash.

### Como aplicar dark mode em novos componentes

```tsx
// Correto — tokens semânticos
<div className="bg-ap-surface text-ap-text border-ap-border">

// Errado — cores hardcoded
<div className="bg-white text-slate-700">

// Inline styles
style={{ backgroundColor: 'var(--ap-surface)' }}
```

---

## 8. Layout & Navegação

### `AppShell`

| Condição | Sidebar | BottomNav | Conteúdo |
|---|---|---|---|
| `viewMode: 'auto'` + tela pequena | Oculta | Visível | `max-w-lg mx-auto` |
| `viewMode: 'auto'` + tela `lg+` | Visível | Oculto | Full width |
| `viewMode: 'desktop'` | Sempre | Nunca | Full width |

`pb-20` no `<main>` apenas quando BottomNav visível. `<Footer>` renderizado após `<main>`.

### Sidebar (desktop)

Links principais + bloco inferior com "Importar CSV" e "Configurações". Exibe `dealershipName` no brand.

### BottomNav (mobile)

6 itens: Dashboard, Estoque, Novo, Equipe, Vendas, **Importar**. Bottom sheets usam `pb-24` para não ficarem atrás do nav.

---

## 9. Componentes Principais

### UI Genéricos

| Componente | Função |
|---|---|
| `AppShell` | Layout responsivo — inclui `<Footer>` após o `<main>` |
| `Footer` | Rodapé: "© 2026 Auto Premium · por Gustavo Peixoto" |
| `Sidebar` | Navegação desktop — exibe `dealershipName` do `useUIStore` no brand |
| `BottomNav` | Navegação mobile |
| `DataProvider` | Client component que carrega dados do Firestore no mount |
| `TopBar` | Header com título e ações |
| `Button` | Primário/secundário com variantes |
| `Badge` | Chips: `default`, `success`, `warning`, `danger`, `blue`, `reserved` (violeta) |
| `HistoryTimeline` | Timeline visual com ícones por tipo de ação |
| `ThemeProvider` | Aplica classe `dark` reativamente |
| `ThemeScript` | Script anti-flash no `<head>` |

### `HistoryTimeline`

| Ação | Ícone | Cor |
|---|---|---|
| `created` | `PlusCircle` | Verde |
| `edited` | `Pencil` | Azul |
| `sold` | `DollarSign` | Verde |
| `photo_added` | `Camera` | Violeta |
| `reserved` | `BookmarkCheck` | Violeta |
| `unreserved` | `BookmarkX` | Âmbar |

Prop `newestFirst` (padrão: `true`). Usado em `/veiculo/[id]` e bottom sheet de `/vendas`.

### Veículo

| Componente | Função |
|---|---|
| `VehicleCard` | Card compacto. Borda: verde/âmbar/vermelho/violeta/cinza por status e alert |
| `VehicleListRow` | Linha compacta (modo lista) |
| `VehicleDetailCard` | Card expandido com imagem grande |
| `QualityScore` | Barra de qualidade com breakdown |
| `PhotoUpload` | Upload drag-and-drop, badge CAPA na 1ª foto, dark mode completo |
| `ImageCropper` | Crop 4:3 + compressão: resize ≤1200px, JPEG 85% |
| `OptionalsSelector` | Multi-select em chips |

### Dashboard

| Componente | Função |
|---|---|
| `KpiCard` | Card de métrica clicável com `href` |
| `AlertBanner` | Banner de veículos parados >30 dias |

---

## 10. Importação CSV (`src/lib/csvUtils.ts`)

- Separador: `;` (padrão pt-BR — abre corretamente no Excel/LibreOffice)
- Parser suporta campos com aspas
- Templates com linhas de exemplo embutidas
- Validação por campo com mensagem de erro por linha
- Opcionais e fotos **não** fazem parte do CSV — selecionados dentro do sistema após importar

---

## 11. Tipos Principais (`src/types/index.ts`)

```ts
UserRole             // 'admin' | 'seller'
User                 // { id, name, email, role } — prep para auth

Vehicle              // Entidade principal
  └── externalIds?: { webmotors?, olx?, icarros? }  // prep integração marketplace

VehicleWithMeta      // Vehicle + metadados computados
  ├── daysInStock, alertLevel, label, qualityScore
  ├── profit: number | null
  └── profitMargin: number | null

VehicleHistoryEntry
  └── action: 'created'|'edited'|'sold'|'photo_added'|'reserved'|'unreserved'

VehicleStatus        // 'available' | 'sold' | 'reserved'
VehicleOptional      // union literal dos 15 opcionais (VEHICLE_OPTIONALS)

Sale
SaleHistoryEntry     // action: 'created' | 'edited'
CommissionType       // 'percent' | 'fixed'

Seller               // com phone?, email?, document? opcionais
Client
Dealership
StockAlertLevel      // 'normal' | 'attention' | 'critical'
```

---

## 12. Regras de Negócio

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

Cores: `≥80%` verde · `≥50%` âmbar · `<50%` azul.

### Alert Levels

| Dias | Level | Borda no card |
|---|---|---|
| 0–15 | `normal` | Verde |
| 16–30 | `attention` | Âmbar |
| >30 | `critical` | Vermelho |

### Labels Automáticos (`getAutoLabel`)

| Condição | Label | Prioridade |
|---|---|---|
| ≤7 dias | "Recém chegado" | 1ª |
| >30 dias | "Parado há muito tempo" | 2ª |
| Preço < 90% da média | "Oportunidade" | 3ª |
| Margem ≥ 20% | "Alta margem" | 4ª |
| Margem < 8% | "Margem baixa" | 5ª |

### Comissão

```ts
percent: (finalPrice * commissionValue) / 100
fixed:   commissionValue
```

### Status Reserved

- `reserveVehicle` só executa se status for `available`
- `unreserveVehicle` só executa se status for `reserved`
- Veículo reservado: botão "Registrar Venda" bloqueado com aviso

### Histórico de Edições em Vendas

Ao editar, compara campo a campo e gera diff legível:
```
Preço: R$ 315.000,00 → R$ 310.000,00 | Vendedor: Carlos → Fernanda
```

### `addSale` — Efeito Cascata

1. Cria a venda no Firestore
2. Muda `vehicle.status` → `'sold'` no Firestore
3. Adiciona entrada `sold` no `vehicle.history`

---

## 13. Configuração Next.js (`next.config.ts`)

```ts
allowedDevOrigins: ["192.168.0.15"]  // acesso mobile via Wi-Fi
devIndicators: false                  // toolbar dev desabilitada (performance)
```

---

## 14. Convenções de Código

### Classes CSS utilitárias (`globals.css`)

| Classe | Aplica |
|---|---|
| `.ap-card` | `bg-ap-surface rounded-2xl border border-ap-border shadow-sm` |
| `.ap-input` | Input com bg/border/text via CSS vars + focus ring |
| `.ap-textarea` | Igual ao input com `resize-none` |
| `.ap-select` | Select estilizado consistente |

### Padding em inputs com prefixo/sufixo

`.ap-input` tem especificidade maior que classes Tailwind (`pl-9`, `pr-8`). **Sempre usar inline style:**

```tsx
// Correto
<input className="ap-input" style={{ paddingLeft: '2.5rem' }} />
<span className="absolute left-3 ... pointer-events-none">R$</span>

// Errado — pl-9 é ignorado
<input className="ap-input pl-9" />
```

### Padrão de Bottom Sheet

```tsx
<div className="fixed inset-0 z-50 flex flex-col justify-end">
  <div className="absolute inset-0 bg-black/40" onClick={fechar} />
  <div className="relative rounded-t-2xl p-5 pb-24 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
    style={{ backgroundColor: 'var(--ap-surface)' }}>
    {/* conteúdo */}
  </div>
</div>
```

`pb-24` garante visibilidade do botão de ação acima do BottomNav.

### SearchSelect (busca com dropdown)

Componente local em `/venda/nova/page.tsx`. Para reutilizar em outros locais, extrair para `src/components/ui/SearchSelect.tsx`.

```tsx
<SearchSelect
  options={[{ id, label, sub? }]}
  value={selectedId}
  onChange={(id) => setSelectedId(id)}
  placeholder="Buscar..."
/>
```

### Formatação de Moeda BRL

```ts
formatCurrency(value)  // → "R$ 128.000,00"
formatBRL(rawInput)    // "12800000" → "128.000,00"  (input centavo a centavo)
parseBRL(formatted)    // "128.000,00" → 128000
```

### Navegação pós-edição

`router.replace` (não `router.push`) ao salvar edições — back button vai ao detalhe, não à edição.

### Criação de entidades

Sempre usar `currentDealershipId` do `useStore()`. Nunca hardcodar `'d1'`.

---

## 15. Preparação para Evolução Futura

| Item | Estado |
|---|---|
| Firebase/Firestore | ✅ Integrado — dados reais, mutations otimistas |
| Firebase Storage | ✅ Implementado — `storageService.ts` + migração base64 → URLs |
| Multi-tenant | `currentDealershipId` no store + `setCurrentDealershipId` pronto |
| Auth | Não implementado — `dealershipId: 'd1'` hardcoded; `User` e `UserRole` prep |
| Dados da loja | `dealershipName` e `defaultCommissionPercent` em `useUIStore` (localStorage) |
| Integração marketplace | `Vehicle.externalIds?: { webmotors?, olx?, icarros? }` |
| Importação em massa | ✅ CSV por Veículos, Vendedores, Clientes com preview e edição |
