# 🍽️ Alegra Restaurant — Sistema de Donación Automatizado

> **Sistema de Microservicios Asíncronos para Jornadas de Donación Masiva de Comida**  
> Desarrollado como solución a la prueba técnica de arquitectura y desarrollo de software para **Alegra**.

---

## 📑 Tabla de Contenidos

1. [¿Qué Cubre Esta Prueba?](#-qué-cubre-esta-prueba)
   - [Alcance del Negocio](#alcance-del-negocio)
   - [Cumplimiento del Plan de Ejecución (Fases)](#cumplimiento-del-plan-de-ejecución-fases)
   - [Matriz de Cumplimiento de Requerimientos](#matriz-de-cumplimiento-de-requerimientos)
   - [Verificación del Flujo Asíncrono End-to-End](#verificación-del-flujo-asíncrono-end-to-end)
2. [Arquitectura del Sistema](#-arquitectura-del-sistema)
   - [Diagrama de Microservicios](#diagrama-de-microservicios)
   - [Flujo de Eventos (Event-Driven Architecture)](#flujo-de-eventos-event-driven-architecture)
   - [Descripción de los Microservicios](#descripción-de-los-microservicios)
3. [Estructura del Proyecto](#-estructura-del-proyecto)
4. [Stack Tecnológico](#-stack-tecnológico)
5. [Prerrequisitos](#-prerrequisitos)
6. [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
   - [Opción A: Ejecución con Docker Compose (Recomendada)](#opción-a-ejecución-con-docker-compose-recomendada)
     - [En Windows (PowerShell)](#en-windows-powershell)
     - [En Linux / macOS (Bash)](#en-linux--macos-bash)
   - [Opción B: Desarrollo Local (Híbrido)](#opción-b-desarrollo-local-híbrido)
     - [En Windows (PowerShell)](#en-windows-powershell-1)
     - [En Linux / macOS (Bash)](#en-linux--macos-bash-1)
7. [Mantenimiento y Comandos Útiles](#-mantenimiento-y-comandos-útiles)
8. [API Endpoints y WebSockets](#-api-endpoints-y-websockets)
9. [Catálogo de Recetas e Ingredientes](#-catálogo-de-recetas-e-ingredientes)
10. [Resiliencia y Manejo de Concurrencia](#-resiliencia-y-manejo-de-concurrencia)

---

## 🎯 ¿Qué Cubre Esta Prueba?

### Alcance del Negocio
La aplicación simula y automatiza la operación integral de **Alegra Restaurant** durante jornadas de donación de comida. A través de un tablero interactivo y en tiempo real, el gerente del restaurante puede solicitar lotes de platos de comida (por ejemplo, 1, 3, 5, 10 o cantidades personalizadas). El sistema se encarga de:
- Distribuir y orquestar la preparación individual de cada plato de forma desacoplada y asíncrona.
- Seleccionar aleatoriamente una de las 6 recetas disponibles para cada plato.
- Verificar la disponibilidad en bodega de los ingredientes requeridos.
- Comprar ingredientes automáticamente en la **Plaza de Mercado de Alegra** cuando el inventario no es suficiente, manejando desabastecimientos y reintentos.
- Descontar el stock atómicamente asegurando integridad transaccional bajo alta concurrencia.
- Notificar cada etapa del ciclo de vida en tiempo real al panel visual del gerente.

---

### Cumplimiento del Plan de Ejecución (Fases)

Todos los pasos y fases definidos en el documento de planificación ([PLANNING.md](file:///c:/Users/Perso/Desktop/Prueba%20tecnica%20Alegra/PLANNING.md)) han sido completados en su totalidad:

| Fase | Estado | Descripción de lo Implementado |
|:---|:---:|:---|
| **Fase 1: Infraestructura Base** | ✅ **Completada** | Entorno contenerizado con `docker-compose.yml`, clúster de **PostgreSQL 16** con script de inicio `init.sql` (esquema DDL relacional, datos seed e índices) y broker de mensajería **NATS 2.10**. Configuración de variables de entorno compartidas (`.env`). |
| **Fase 2: Microservicios Core** | ✅ **Completada** | Desarrollo de los 4 microservicios en **TypeScript**: `gateway` (HTTP nativo sin frameworks + WebSocket), `orders` (gestor del ciclo de vida y despacho secuenciado), `kitchen` (lógica de recetas y cocción), y `warehouse` (control atómico de inventario y cliente HTTP para la Plaza de Mercado). |
| **Fase 3: Frontend y Dashboard** | ✅ **Completada** | Dashboard moderno en **React 18 + Vite + TypeScript**. Conexión reactiva vía WebSocket (`/ws`) con reconexión automática, sistema de tarjetas de métricas, controles rápidos de pedidos, panel de inventario con barras de estado, monitor de órdenes y feed de eventos en vivo con diseño profesional Zinc y componentes modulares. |
| **Fase 4: Integración, Resiliencia y Pulido** | ✅ **Completada** | Manejo de condiciones de carrera mediante bloqueos pesimistas (`SELECT ... FOR UPDATE`) y actualización atómica en PostgreSQL. Reintentos con backoff al consumir el API externo de Alegra. Eliminación de logs redundantes, tipado estricto y documentación técnica integral. |

---

### Matriz de Cumplimiento de Requerimientos

A continuación se detalla cómo se satisface cada uno de los requerimientos técnicos y de negocio establecidos:

| # | Requerimiento Oficial | Cumplimiento | Evidencia / Justificación Técnica |
|:-:|:---|:---:|:---|
| **1** | **TypeScript + JavaScript** | ✅ **100%** | Tanto los 4 microservicios del backend como el frontend están construidos estrictamente en **TypeScript** con compilación estricta (`strict: true`). |
| **2** | **Node.js puro (sin Express / Nest)** | ✅ **100%** | El microservicio `gateway` implementa un enrutador HTTP utilizando exclusivamente el módulo nativo `node:http` de Node.js, cumpliendo a cabalidad con la restricción de no usar frameworks HTTP de terceros. |
| **3** | **Arquitectura de Microservicios** | ✅ **100%** | Sistema dividido en 4 microservicios autónomos y desacoplados (`gateway`, `orders`, `kitchen`, `warehouse`), cada uno enfocado en un único contexto de negocio. |
| **4** | **Dockerfile independiente por servicio** | ✅ **100%** | Cada servicio cuenta con su propio `Dockerfile` optimizado con builds de múltiples etapas (multi-stage) sobre imágenes ligeras `node:20-alpine`. |
| **5** | **Comunicación Asíncrona** | ✅ **100%** | La comunicación interservicios es completamente orientada a eventos (Event-Driven) utilizando **NATS** como broker de alta velocidad y baja latencia, sin acoplamientos síncronos entre servicios de dominio. |
| **6** | **Frontend Moderno** | ✅ **100%** | Interfaz desarrollada en **React 18 + Vite**, con diseño responsivo, tokens de color oscuros (Zinc), iconos SVG de Lucide y actualización reactiva. |
| **7** | **Base de Datos PostgreSQL** | ✅ **100%** | Base de datos relacional PostgreSQL 16 con soporte ACID, transacciones explícitas, llaves foráneas e integridad referencial. |
| **8** | **6 Recetas con ingredientes de la lista** | ✅ **100%** | Seed data precargado con 6 recetas completas (Hamburguesa Clásica, Pollo a la Plancha, Ensalada Fresca, Patatas con Queso, Tacos de Carne, Arroz con Pollo), combinando los ingredientes oficiales. |
| **9** | **Bodega inicia con 5 de cada ingrediente** | ✅ **100%** | El script `init.sql` inicializa los 10 ingredientes reglamentarios con exactamente `stock = 5` unidades cada uno. |
| **10** | **Compra en Plaza de Mercado si falta stock** | ✅ **100%** | Cuando un ingrediente tiene existencias menores a las requeridas, `warehouse` realiza peticiones HTTP a `https://recruitment.alegra.com/api/farmers-market/buy?ingredient={name}` hasta completar la cantidad necesaria. |
| **11** | **Selección de Receta Aleatoria** | ✅ **100%** | Por cada plato ordenado, el servicio `kitchen` selecciona una receta aleatoria (`ORDER BY RANDOM() LIMIT 1`) de forma no determinista. |
| **12** | **Descuento de Inventario atómico** | ✅ **100%** | El consumo de inventario se ejecuta dentro de transacciones SQL con `SELECT ... FOR UPDATE` y `UPDATE ... WHERE stock >= quantity RETURNING stock`, impidiendo condiciones de carrera o stock negativo bajo alta concurrencia. |
| **13** | **Interfaz en Tiempo Real** | ✅ **100%** | Conexión dúplex persistente mediante **WebSockets** (`/ws`) entre el Gateway y el Frontend, reflejando cambios de estado y compras al instante sin recargar la página. |
| **14** | **Interfaz intuitiva para no-técnicos** | ✅ **100%** | Visualización limpia pensada para el gerente: botones rápidos de 1, 3, 5 y 10 pedidos, barras de nivel de stock con alertas por color, desglose de recetas activas e historial de compras. |
| **15** | **Propuestas de Despliegue en la Nube** | ✅ **100%** | En [PLANNING.md](file:///c:/Users/Perso/Desktop/Prueba%20tecnica%20Alegra/PLANNING.md) se documentan 4 estrategias de despliegue en capas gratuitas (Railway + Vercel, Render, Fly.io + Supabase, Oracle Cloud Always Free) con soporte para dominio propio. |

---

### Verificación del Flujo Asíncrono End-to-End

El flujo operacional se ejecuta con total sincronía asíncrona:

```
[ Gerente en Dashboard ]
       │  (1) Clic: "Pedir 3 Platos"
       ▼
[ Gateway Service ] ──▶ (2) Publica NATS: 'order.requested'
                              │
                              ▼
                      [ Orders Service ]
                              │
                              ├─▶ Inserta orden en BD (estado: IN_PROGRESS)
                              ├─▶ Genera 3 platos (estado: PENDING)
                              │
                              ▼ (3) Despacha secuencialmente NATS: 'order.cook'
                      [ Kitchen Service ]
                              │
                              ├─▶ Elige receta al azar (ej. Hamburguesa)
                              ├─▶ Actualiza plato a WAITING_INGREDIENTS
                              │
                              ▼ (4) Publica NATS: 'ingredients.request'
                      [ Warehouse Service ]
                              │
                              ├─▶ Inicia Transacción SQL con FOR UPDATE
                              ├─▶ ¿Hay stock suficiente?
                              │      ├── SÍ  ──▶ Reserva y descuenta
                              │      └── NO  ──▶ Consume API Alegra Farmers Market
                              │                   Reintenta con backoff si retorna 0
                              │                   Registra en purchase_history
                              │                   Suma a inventario y descuenta
                              │
                              ▼ (5) Publica NATS: 'ingredients.ready'
                      [ Kitchen Service ]
                              │
                              ├─▶ Actualiza plato a PREPARING (Simula cocción 1-3s)
                              │
                              ▼ (6) Publica NATS: 'plate.completed'
                      [ Orders Service ]
                              │
                              ├─▶ Actualiza plato a COMPLETED
                              ├─▶ Incrementa platos listos de la orden
                              ├─▶ ¿Orden terminada? ──▶ Marca orden COMPLETED
                              │
                              ▼ (7) Publica NATS: 'order.status.updated'
                      [ Gateway Service ]
                              │
                              ▼ (8) WebSocket broadcast
                      [ Dashboard Frontend ] ──▶ Actualiza métricas, stock y órdenes en vivo
```

---

## 🏗️ Arquitectura del Sistema

El sistema implementa una arquitectura basada en eventos (**EDA — Event-Driven Architecture**) donde los microservicios están completamente desacoplados.

### Diagrama de Microservicios

```
                            ┌────────────────────────┐
                            │  Frontend (React+TS)   │
                            │  Dashboard del Gerente │
                            └───────────┬────────────┘
                                        │ HTTP / WebSocket
                                        ▼
                            ┌────────────────────────┐
                            │    Gateway Service     │
                            │ (Node.js nativo / ws)  │
                            └───────────┬────────────┘
                                        │
                         Pub / Sub      │ Event Stream
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
       ┌───────────────────┐                         ┌───────────────────┐
       │     NATS Bus      │                         │    PostgreSQL     │
       │  (Message Broker) │                         │  (Base de Datos)  │
       └─┬───────┬───────┬─┘                         └─▲───────▲───────▲─┘
         │       │       │                             │       │       │
         ▼       │       ▼                             │       │       │
    ┌──────────┐ │ ┌───────────┐                       │       │       │
    │  Orders  │ │ │  Kitchen  │───────────────────────┤       │       │
    │ Service  │ │ │  Service  │                               │       │
    └────┬─────┘ │ └─────┬─────┘                               │       │
         │       │       │                                     │       │
         └───────┼───────┘                                     │       │
                 │                                             │       │
                 ▼                                             │       │
           ┌───────────┐                                       │       │
           │ Warehouse │───────────────────────────────────────┘       │
           │  Service  │───────────────────────────────────────────────┘
           └─────┬─────┘
                 │ HTTP GET
                 ▼
       ┌───────────────────┐
       │  Plaza de Mercado │
       │  (API de Alegra)  │
       └───────────────────┘
```

### Flujo de Eventos (Event-Driven Architecture)

Los tópicos NATS configurados en el bus de mensajería son:

| Tópico NATS | Emisor | Receptor | Descripción del Evento |
|:---|:---|:---|:---|
| `order.requested` | `gateway` | `orders` | Nueva solicitud de orden con número de platos. |
| `order.cook` | `orders` | `kitchen` | Instrucción para iniciar la preparación de un plato específico. |
| `ingredients.request` | `kitchen` | `warehouse` | Requerimiento de lista de ingredientes para una receta. |
| `ingredients.ready` | `warehouse` | `kitchen` | Confirmación de que los ingredientes fueron reservados. |
| `plate.completed` | `kitchen` | `orders` | Notificación de plato finalizado y cocinado. |
| `order.created` | `orders` | `gateway` | Confirmación de orden persistida en base de datos. |
| `order.status.updated` | `orders` | `gateway` | Progreso de la orden (platos completados / estado final). |
| `inventory.updated` | `warehouse` | `gateway` | Cambio en el stock de algún ingrediente tras su consumo. |
| `ingredients.purchased`| `warehouse` | `gateway` | Notificación de compra exitosa en la plaza de mercado. |

---

### Descripción de los Microservicios

1. **`gateway` (Puerto 3000)**:  
   Punto de entrada único al ecosistema. Construido con `node:http` nativo sin Express ni NestJS. Expone la API REST para consultas del frontend, recibe órdenes de comida y sostiene el servidor WebSocket para emitir eventos de NATS hacia el dashboard.
2. **`orders`**:  
   Encargado de la persistencia del pedido general y de cada plato individual. Aplica un mecanismo de despacho escalonado (*staggering*) para no congestionar la cocina.
3. **`kitchen`**:  
   Selecciona aleatoriamente la receta para cada plato, solicita los ingredientes a bodega y simula el tiempo de preparación física del plato (1 a 3 segundos).
4. **`warehouse`**:  
   Custodio del inventario. Utiliza transacciones seguras con `FOR UPDATE` para garantizar consistencia. Consume el API de Alegra Farmers Market ante cualquier faltante con reintentos y tolerancia a fallos.

---

## 📁 Estructura del Proyecto

La estructura del repositorio refleja con exactitud la separación de responsabilidades implementada:

```
Prueba tecnica Alegra/
├── .env                              # Variables de entorno compartidas
├── .gitignore                        # Archivos y carpetas ignoradas por git
├── AI Disclosure.md                  # Declaración de uso transparente de IA
├── docker-compose.yml                # Orquestación de contenedores Docker
├── PLANNING.md                       # Documento de arquitectura y planificación inicial
├── README.md                         # Guía técnica principal (este documento)
│
├── database/
│   └── init.sql                      # DDL de PostgreSQL, recetas y stock seed (5 c/u)
│
├── services/
│   ├── gateway/                      # API Gateway (Node.js nativo + WebSocket)
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── database.ts           # Pool de conexiones a PostgreSQL
│   │       ├── index.ts              # Entrypoint del servidor HTTP y WebSocket
│   │       ├── nats-client.ts        # Conexión y suscripciones a NATS
│   │       ├── router.ts             # Enrutador HTTP puro sin frameworks
│   │       ├── types.ts              # Interfaces y contratos de datos
│   │       └── websocket.ts          # Gestión de clientes y broadcast WS
│   │
│   ├── orders/                       # Servicio de Pedidos
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── database.ts           # Consultas a base de datos
│   │       ├── handlers.ts           # Suscriptores a order.requested y plate.completed
│   │       ├── index.ts              # Inicialización del servicio
│   │       └── nats-client.ts        # Conector NATS
│   │
│   ├── kitchen/                      # Servicio de Cocina
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── database.ts           # Consultas de recetas e ingredientes
│   │       ├── handlers.ts           # Suscriptores de cocción y recetas aleatorias
│   │       ├── index.ts              # Inicialización del servicio
│   │       └── nats-client.ts        # Conector NATS
│   │
│   └── warehouse/                    # Servicio de Bodega e Inventario
│       ├── Dockerfile
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── database.ts           # Pool de base de datos
│           ├── handlers.ts           # Bloqueo transaccional FOR UPDATE y consumo
│           ├── index.ts              # Inicialización del servicio
│           ├── market-client.ts      # Cliente HTTP para API de Alegra con reintentos
│           └── nats-client.ts        # Conector NATS
│
└── frontend/                         # Dashboard React del Gerente
    ├── Dockerfile                    # Contenedor para servir en desarrollo/producción
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx                   # Componente orquestador de vistas
        ├── index.css                 # Sistema de diseño Zinc, variables y animaciones
        ├── main.tsx                  # Punto de montaje de React
        ├── vite-env.d.ts
        ├── components/
        │   ├── EventsFeed.tsx        # Monitor de eventos en vivo
        │   ├── InventoryPanel.tsx    # Tarjetas de stock con barras visuales
        │   ├── KitchenView.tsx       # Estado de platos en preparación
        │   ├── OrderForm.tsx         # Botones rápidos y solicitud de pedidos
        │   ├── OrdersList.tsx        # Historial de pedidos y progreso
        │   └── StatsGrid.tsx         # KPIs ejecutivos en tiempo real
        ├── hooks/
        │   └── useRestaurant.ts      # Hook con WebSocket y sincronización de estado
        └── services/
            └── api.ts                # Cliente REST para interactuar con el Gateway
```

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Justificación |
|:---|:---|:---|
| **Backend Core** | Node.js 20 LTS + TypeScript | Ejecución moderna, tipado estricto y alto rendimiento asíncrono. |
| **Enrutador HTTP** | `node:http` nativo | Cumplimiento del requerimiento de no usar Express ni NestJS. |
| **Tiempo Real** | `ws` (WebSockets nativo) | Comunicación bidireccional ligera entre Gateway y Frontend. |
| **Message Broker** | NATS 2.10 | Ultraligero (~15MB RAM), latencia sub-milisegundo y pub/sub nativo. |
| **Base de Datos** | PostgreSQL 16 | Motor relacional robusto con transacciones ACID y `SELECT ... FOR UPDATE`. |
| **Frontend** | React 18 + Vite + TypeScript | Renderizado reactivo rápido, bundle optimizado y arquitectura de componentes. |
| **Iconografía y Estilos**| Lucide React + Vanilla CSS | Iconos vectoriales limpios y variables CSS modernas inspiradas en tokens Zinc. |
| **Contenerización** | Docker + Docker Compose | Aislamiento garantizado, portabilidad y arranque con un solo comando. |

---

## 📋 Prerrequisitos

Para ejecutar la aplicación se requiere tener instalado en el sistema:

1. **Docker Desktop** (en Windows/macOS) o **Docker Engine + Docker Compose v2** (en Linux).
   - Comprueba con: `docker --version` y `docker compose version`.
2. **Puertos libres en el equipo**:
   - `3000` (API Gateway)
   - `5173` (Frontend Dashboard)
   - `5432` (PostgreSQL)
   - `4222` (NATS Broker)
   - `8222` (Monitor Web de NATS)
3. **Conexión a Internet activa**: Necesaria para que el servicio de bodega pueda consultar la API externa de la Plaza de Mercado de Alegra (`https://recruitment.alegra.com`).
4. *(Opcional)*: **Node.js 20+** y **npm** únicamente si deseas ejecutar los microservicios fuera de Docker en modo desarrollo local.

---

## 🚀 Instalación y Puesta en Marcha

### Opción A: Ejecución con Docker Compose (Recomendada)

Esta opción levanta automáticamente la base de datos, el broker de mensajería NATS, los 4 microservicios y el frontend sin necesidad de configurar Node.js localmente.

#### En Windows (PowerShell)

Abre **PowerShell** como administrador o usuario normal y ejecuta:

```powershell
# 1. Navegar a la carpeta del proyecto
cd "c:\Users\Perso\Desktop\Prueba tecnica Alegra"

# 2. Levantar y compilar todos los contenedores
docker compose up --build
```

*(Si deseas ejecutarlo en segundo plano sin ocupar la terminal, añade la bandera `-d`):*
```powershell
docker compose up --build -d
```

Para ver los logs de todos los servicios en tiempo real:
```powershell
docker compose logs -f
```

---

#### En Linux / macOS (Bash)

Abre tu terminal **Bash** o **Zsh** y ejecuta:

```bash
# 1. Navegar a la carpeta del proyecto
cd "Prueba tecnica Alegra"

# 2. Levantar y compilar todos los contenedores
docker compose up --build
```

*(En segundo plano):*
```bash
docker compose up --build -d
```

Para inspeccionar los logs en vivo:
```bash
docker compose logs -f
```

---

### Verificación de la Aplicación en Ejecución

Una vez levantados los contenedores, accede a los siguientes enlaces en tu navegador:

- 🖥️ **Dashboard del Gerente (Frontend):** [http://localhost:5173](http://localhost:5173)
- 🌐 **API Gateway Health Check:** [http://localhost:3000/health](http://localhost:3000/health)
- 📊 **Monitor de NATS:** [http://localhost:8222](http://localhost:8222)

---

### Opción B: Desarrollo Local (Híbrido)

Si deseas modificar el código en caliente sin reconstruir contenedores Docker, puedes ejecutar la infraestructura (PostgreSQL y NATS) en Docker y los servicios de Node.js directamente en tu máquina host.

#### En Windows (PowerShell)

```powershell
# 1. Levantar únicamente PostgreSQL y NATS
cd "c:\Users\Perso\Desktop\Prueba tecnica Alegra"
docker compose up -d postgres nats

# 2. Terminal 1 — Gateway Service
cd services\gateway
npm install
$env:DATABASE_URL="postgresql://alegra:alegra_secret@localhost:5432/alegra_restaurant"
$env:NATS_URL="nats://localhost:4222"
$env:PORT="3000"
npm run build
npm start

# 3. Terminal 2 — Orders Service
cd services\orders
npm install
$env:DATABASE_URL="postgresql://alegra:alegra_secret@localhost:5432/alegra_restaurant"
$env:NATS_URL="nats://localhost:4222"
npm run build
npm start

# 4. Terminal 3 — Kitchen Service
cd services\kitchen
npm install
$env:DATABASE_URL="postgresql://alegra:alegra_secret@localhost:5432/alegra_restaurant"
$env:NATS_URL="nats://localhost:4222"
npm run build
npm start

# 5. Terminal 4 — Warehouse Service
cd services\warehouse
npm install
$env:DATABASE_URL="postgresql://alegra:alegra_secret@localhost:5432/alegra_restaurant"
$env:NATS_URL="nats://localhost:4222"
$env:MARKET_API_URL="https://recruitment.alegra.com/api/farmers-market/buy"
npm run build
npm start

# 6. Terminal 5 — Frontend
cd frontend
npm install
npm run dev
```

---

#### En Linux / macOS (Bash)

```bash
# 1. Levantar únicamente PostgreSQL y NATS
docker compose up -d postgres nats

# 2. Terminal 1 — Gateway Service
cd services/gateway && npm install
export DATABASE_URL="postgresql://alegra:alegra_secret@localhost:5432/alegra_restaurant"
export NATS_URL="nats://localhost:4222"
export PORT="3000"
npm run build && npm start

# 3. Terminal 2 — Orders Service
cd services/orders && npm install
export DATABASE_URL="postgresql://alegra:alegra_secret@localhost:5432/alegra_restaurant"
export NATS_URL="nats://localhost:4222"
npm run build && npm start

# 4. Terminal 3 — Kitchen Service
cd services/kitchen && npm install
export DATABASE_URL="postgresql://alegra:alegra_secret@localhost:5432/alegra_restaurant"
export NATS_URL="nats://localhost:4222"
npm run build && npm start

# 5. Terminal 4 — Warehouse Service
cd services/warehouse && npm install
export DATABASE_URL="postgresql://alegra:alegra_secret@localhost:5432/alegra_restaurant"
export NATS_URL="nats://localhost:4222"
export MARKET_API_URL="https://recruitment.alegra.com/api/farmers-market/buy"
npm run build && npm start

# 6. Terminal 5 — Frontend
cd frontend && npm install && npm run dev
```

---

## 🛑 Mantenimiento y Comandos Útiles

### Detener los servicios
```bash
# Detener sin borrar datos
docker compose down
```

### Reiniciar el sistema a su estado inicial (Restablecer inventario a 5 unidades)
Si deseas borrar todas las órdenes creadas, vaciar el historial de compras y restablecer el stock de los 10 ingredientes a sus 5 unidades iniciales, elimina el volumen de base de datos:

**En Windows (PowerShell):**
```powershell
docker compose down -v
docker compose up --build
```

**En Linux / macOS (Bash):**
```bash
docker compose down -v
docker compose up --build
```

### Ver logs de un servicio específico
```bash
docker compose logs -f gateway
docker compose logs -f warehouse
docker compose logs -f kitchen
docker compose logs -f orders
```

---

## 🌐 API Endpoints y WebSockets

El `gateway-service` expone los siguientes endpoints REST y el canal WebSocket:

| Método | Endpoint | Descripción | Ejemplo de Entrada / Salida |
|:---|:---|:---|:---|
| `GET` | `/health` | Chequeo de salud del Gateway | `{"status":"ok","timestamp":"..."}` |
| `POST` | `/api/orders` | Crear nueva orden de N platos | **Body:** `{"quantity": 3}`<br>**Respuesta:** `{"orderId":"uuid","status":"IN_PROGRESS","totalPlates":3}` |
| `GET` | `/api/orders` | Listar todas las órdenes registradas | Array de órdenes con su estado y avance |
| `GET` | `/api/orders/:id` | Detalle de una orden y sus platos | Incluye desglose por cada plato individual |
| `GET` | `/api/warehouse/inventory` | Consulta del stock actual de bodega | Lista de los 10 ingredientes con stock en tiempo real |
| `GET` | `/api/kitchen/recipes` | Listado de las 6 recetas disponibles | Array con nombres e ingredientes por receta |
| `GET` | `/api/stats` | Métricas de operación para KPIs | Totales de platos cocinados, compras y órdenes |
| `GET` | `/api/purchases` | Historial de compras en la plaza | Registro cronológico de compras a Alegra Farmers Market |
| `WS` | `/ws` | Conexión WebSocket para eventos en vivo | Emite eventos JSON de NATS en tiempo real al frontend |

---

## 🥗 Catálogo de Recetas e Ingredientes

### 10 Ingredientes Reglamentarios (Stock inicial = 5)
1. **Tomate** (`tomato`)
2. **Limón** (`lemon`)
3. **Patatas** (`potato`)
4. **Arroz** (`rice`)
5. **Ketchup** (`ketchup`)
6. **Lechuga** (`lettuce`)
7. **Cebolla** (`onion`)
8. **Queso** (`cheese`)
9. **Carne** (`meat`)
10. **Pollo** (`chicken`)

### 6 Recetas Configuradas

| # | Receta | Ingredientes Requeridos |
|:-:|:---|:---|
| **1** | 🍔 **Hamburguesa Clásica** | 1 Carne, 1 Lechuga, 1 Tomate, 1 Queso, 1 Cebolla, 1 Ketchup |
| **2** | 🍗 **Pollo a la Plancha** | 1 Pollo, 2 Arroz, 1 Limón |
| **3** | 🥗 **Ensalada Fresca** | 2 Lechuga, 1 Tomate, 1 Cebolla, 1 Limón |
| **4** | 🍟 **Patatas con Queso** | 2 Patatas, 1 Queso, 1 Ketchup |
| **5** | 🌮 **Tacos de Carne** | 1 Carne, 1 Tomate, 1 Cebolla, 1 Lechuga, 1 Queso |
| **6** | 🍚 **Arroz con Pollo** | 2 Arroz, 1 Pollo, 1 Tomate, 1 Cebolla |

---

## 🛡️ Resiliencia y Manejo de Concurrencia

1. **Prevención de Condiciones de Carrera (Race Conditions) en Stock:**  
   Cuando varios platos demandan el mismo ingrediente de forma concurrente, el servicio de bodega previene lecturas sucias y bloqueos incompatibles abriendo una transacción explícita (`BEGIN ... COMMIT`) y ejecutando:
   ```sql
   SELECT id, name, name_en, stock FROM ingredients WHERE id = $1 FOR UPDATE;
   ```
   Posteriormente, el descuento de stock se protege mediante un predicado atómico:
   ```sql
   UPDATE ingredients SET stock = stock - $1, updated_at = NOW()
   WHERE id = $2 AND stock >= $1
   RETURNING stock;
   ```
   Si el stock no es suficiente, la transacción adquiere los faltantes antes de liberar la fila.

2. **Tolerancia a Desabastecimiento en la Plaza de Mercado:**  
   La API de Alegra puede responder con `quantitySold: 0` si no hay disponibilidad inmediata. El cliente HTTP de `warehouse` aplica un bucle con límite de intentos y retardo controlado (`backoff` de 500ms) reintentando hasta satisfacer la demanda.

3. **Despacho Escalonado (*Staggering*):**  
   Al crear una orden masiva (ej. 10 platos), `orders-service` no satura la cocina de golpe; despacha los eventos `order.cook` con un intervalo de 200ms entre platos, permitiendo que la cocina y la bodega procesen la carga de manera fluida y predecible.
