# Guía de Testing - eCloset Backend

## Estado actual

| Tipo | Tests | Estado |
|------|-------|--------|
| **Unitarios** | 28 | Todos pasan |
| **API (básicos)** | ~50 | Pasan con mocks actuales |
| **API (complejos)** | ~40 | Requieren DB de test o mocks más detallados |

Para correr solo los tests que funcionan:
```bash
npm run test:run -- test/unit/
```

## Introducción

Este documento explica la suite de tests implementada para el backend de eCloset, un sistema de gestión de armarios virtuales con marketplace integrado.

---

## ¿Qué es Vitest?

**Vitest** es un framework de testing ultrarrápido diseñado para proyectos modernos de JavaScript/TypeScript. Es la opción recomendada para proyectos que usan Vite, pero funciona perfectamente con Next.js.

### Características principales:

- **Velocidad**: Usa el mismo pipeline de transformación que Vite, lo que lo hace extremadamente rápido
- **Compatibilidad**: API compatible con Jest (si conocés Jest, ya sabés usar Vitest)
- **TypeScript nativo**: Soporta TypeScript sin configuración adicional
- **ESM nativo**: Soporta ES Modules sin problemas
- **Hot Module Replacement**: Los tests se re-ejecutan instantáneamente al guardar
- **Coverage incluido**: Reportes de cobertura de código con `@vitest/coverage-v8`

---

## Estructura del proyecto de tests

```
test/
├── setup.ts              # Configuración global y mocks
├── helpers/
│   ├── auth.ts           # Helpers para crear usuarios y tokens de test
│   └── fixtures.ts       # Datos de prueba (fixtures)
├── unit/
│   ├── auth.test.ts      # Tests unitarios de autenticación
│   └── utils.test.ts     # Tests de funciones utilitarias
└── api/
    ├── auth.test.ts      # Tests de API de autenticación
    ├── prendas.test.ts   # Tests de API de prendas
    ├── outfits.test.ts   # Tests de API de outfits
    ├── productos.test.ts # Tests de API de productos/marketplace
    ├── compras.test.ts   # Tests de flujo de compras
    ├── notificaciones.test.ts # Tests de notificaciones
    ├── calendario.test.ts # Tests de calendario
    ├── user.test.ts      # Tests de perfil de usuario
    └── admin.test.ts     # Tests del panel de administración
```

---

## Archivos de configuración

### `vitest.config.ts`

Archivo de configuración principal de Vitest.

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,           // Permite usar describe, it, expect sin importar
    environment: "node",     // Entorno de ejecución (node para backend)
    setupFiles: ["./test/setup.ts"], // Archivo de setup
    include: ["test/**/*.test.ts"],  // Patrón de archivos de test
    coverage: {
      provider: "v8",        // Proveedor de coverage
      reporter: ["text", "json", "html"], // Formatos de reporte
      include: ["src/lib/**/*.ts", "src/app/api/**/*.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Alias para imports
    },
  },
});
```

### `test/setup.ts`

Configuración global que se ejecuta antes de cada archivo de test.

**¿Qué hace?**
- Mockea Prisma Client para no tocar la base de datos real
- Mockea ImageKit para no hacer uploads reales
- Configura variables de entorno de test
- Limpia los mocks después de cada test

---

## Archivos de helpers

### `test/helpers/auth.ts`

Funciones auxiliares para autenticación en tests:

| Función | Descripción |
|---------|-------------|
| `createTestUser()` | Crea un objeto de usuario de prueba |
| `createAdminUser()` | Crea un usuario admin de prueba |
| `generateTestToken()` | Genera un JWT válido para un usuario |
| `generateExpiredToken()` | Genera un JWT expirado (para tests de error) |
| `createAuthHeaders()` | Crea headers HTTP con el token Bearer |

### `test/helpers/fixtures.ts`

Datos de prueba predefinidos para:
- Prendas
- Outfits
- Productos
- Compras
- Notificaciones
- Eventos de calendario
- Reseñas

---

## Tests Unitarios (`test/unit/`)

### `auth.test.ts`

Tests de las funciones de autenticación puras:

| Test | Descripción |
|------|-------------|
| `generateToken` | Verifica que genera JWT válidos con datos del usuario |
| `verifyToken` | Verifica tokens válidos, inválidos y expirados |
| `extractToken` | Extrae tokens del header Authorization |
| Password Hashing | Tests de bcrypt para hasheo y comparación |

### `utils.test.ts`

Tests de funciones utilitarias:

| Test | Descripción |
|------|-------------|
| `parseEtiquetas` | Parsea etiquetas de texto o JSON, normaliza a minúsculas |
| Validación de precio | Rechaza precios negativos o no numéricos |
| Validación de email | Valida formato de email |
| Validación de puntuación | Verifica rango 1-5 para reseñas |

---

## Tests de API (`test/api/`)

### `auth.test.ts`

| Endpoint | Tests |
|----------|-------|
| `POST /api/auth/register` | Registro exitoso, email duplicado, campos faltantes |
| `POST /api/auth/login` | Login exitoso, credenciales inválidas, cuenta Google, redirección a onboarding |
| `GET /api/auth/me` | Usuario autenticado, sin token, token inválido |
| `POST /api/auth/logout` | Limpieza de cookie |

### `prendas.test.ts`

| Endpoint | Tests |
|----------|-------|
| `GET /api/prendas` | Listar prendas del usuario, sin auth |
| `POST /api/prendas` | Crear con URL/imagen, validación de campos obligatorios |
| `GET /api/prendas/[id]` | Obtener prenda, 404, acceso denegado a prenda ajena |
| `DELETE /api/prendas/[id]` | Eliminar propia, rechazar ajena |

### `outfits.test.ts`

| Endpoint | Tests |
|----------|-------|
| `GET /api/outfits` | Listar outfits con prendas incluidas |
| `POST /api/outfits` | Crear con prendas, validaciones |
| `DELETE /api/outfits/[id]` | Eliminar propio, rechazar ajeno |

### `productos.test.ts`

| Endpoint | Tests |
|----------|-------|
| `GET /api/productos` | Listar disponibles, filtrar propios |
| `POST /api/productos` | Crear producto, validaciones |
| `POST /api/productos/[id]/favorito` | Toggle favorito |
| `POST /api/productos/[id]/comprar` | Solicitar compra, rechazar producto propio/duplicado |
| `POST /api/productos/[id]/resena` | Crear reseña, validar puntuación |

### `compras.test.ts`

| Endpoint | Tests |
|----------|-------|
| `POST /api/compras/[id]/decision` | Aceptar/rechazar compra, autorización de vendedor |
| `POST /api/compras/[id]/concretar` | Concretar compra aceptada, autorización de comprador |
| `POST /api/compras/[id]/resena` | Reseña de vendedor post-compra |

### `notificaciones.test.ts`

| Endpoint | Tests |
|----------|-------|
| `GET /api/notificaciones` | Listar notificaciones, contador de no leídas |
| `POST /api/notificaciones` | Marcar todas como leídas |
| `PATCH /api/notificaciones/[id]` | Marcar una como leída, autorización |

### `calendario.test.ts`

| Endpoint | Tests |
|----------|-------|
| `GET /api/calendario/mes` | Obtener eventos del mes |
| `POST /api/calendario/evento` | Crear evento, validaciones |
| `POST /api/calendario/outfit` | Asignar outfit a fecha |
| `DELETE /api/calendario/[id]` | Eliminar evento propio |

### `admin.test.ts`

| Endpoint | Tests |
|----------|-------|
| `GET /api/admin/dashboard` | Autorización admin, estadísticas |
| `GET /api/admin/usuarios` | Listar usuarios |
| `PATCH /api/admin/usuarios/[id]` | Cambiar estado/rol |
| `GET /api/admin/productos` | Listar para moderación |
| `DELETE /api/admin/productos/[id]` | Eliminar con motivo |
| `GET /api/admin/reportes` | Obtener reportes de actividad |

### `user.test.ts`

| Endpoint | Tests |
|----------|-------|
| `PUT /api/user/preferences` | Guardar preferencias onboarding |
| `GET /api/usuarios/[id]` | Perfil público de usuario |
| `PUT /api/auth/profile` | Actualizar nombre/foto |

---

## Comandos disponibles

```bash
# Ejecutar todos los tests una vez
npm run test:run

# Ejecutar tests en modo watch (re-ejecuta al guardar)
npm run test:watch
# o simplemente:
npm test

# Ejecutar tests con reporte de cobertura
npm run test:coverage

# Ejecutar tests con interfaz visual
npm run test:ui
```

---

## Cómo correr los tests

### 1. Instalar dependencias

```bash
npm install
```

### 2. Ejecutar tests

```bash
npm run test:run
```

### 3. Ver cobertura

```bash
npm run test:coverage
```

El reporte HTML se genera en `coverage/index.html`.

---

## Anatomía de un test

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma } from "../setup";

describe("Nombre del módulo", () => {
  // Se ejecuta antes de cada test
  beforeEach(() => {
    vi.clearAllMocks(); // Limpia los mocks
  });

  it("debe hacer algo específico", async () => {
    // 1. Arrange - Configurar el escenario
    mockPrisma.usuario.findUnique.mockResolvedValue({
      id: "123",
      email: "test@example.com",
    });

    // 2. Act - Ejecutar la acción
    const response = await GET(request);
    const data = await response.json();

    // 3. Assert - Verificar el resultado
    expect(response.status).toBe(200);
    expect(data.user).toBeDefined();
  });
});
```

---

## Mocking

### ¿Qué es un mock?

Un **mock** es una versión falsa de una dependencia que simula su comportamiento. Se usa para:
- No depender de servicios externos (DB, APIs, etc.)
- Controlar exactamente qué devuelve cada función
- Testear escenarios de error
- Hacer los tests rápidos y predecibles

### Ejemplo de mock de Prisma

```typescript
// Simula que findUnique retorna un usuario
mockPrisma.usuario.findUnique.mockResolvedValue({
  id: "123",
  email: "test@example.com",
});

// Simula que findUnique no encuentra nada
mockPrisma.usuario.findUnique.mockResolvedValue(null);

// Simula un error de base de datos
mockPrisma.usuario.findUnique.mockRejectedValue(new Error("DB Error"));
```

---

## Mejores prácticas

1. **Un test, una cosa**: Cada test debe verificar un solo comportamiento
2. **Nombres descriptivos**: El nombre del test debe explicar qué verifica
3. **AAA Pattern**: Arrange (preparar), Act (ejecutar), Assert (verificar)
4. **Tests independientes**: Un test no debe depender de otro
5. **Limpiar mocks**: Usar `beforeEach` para resetear el estado
6. **Testear casos de error**: No solo el happy path, también los errores

---

## Cobertura de código

La cobertura indica qué porcentaje del código se ejecuta durante los tests:

- **Statements**: Líneas de código ejecutadas
- **Branches**: Caminos condicionales (if/else)
- **Functions**: Funciones llamadas
- **Lines**: Líneas cubiertas

**Meta recomendada**: 80%+ de cobertura en el código crítico (auth, lógica de negocio).

---

## Troubleshooting

### Error: "Cannot find module '@/lib/prisma'"

Verificar que el alias `@` esté configurado en `vitest.config.ts`.

### Error: "TypeError: Cannot read property 'mockResolvedValue'"

El mock no está configurado correctamente en `setup.ts`.

### Tests lentos

- Asegurarse de que Prisma y servicios externos estén mockeados
- Usar `test:run` en lugar de `test:watch` para CI

### Tests pasan localmente pero fallan en CI

- Verificar variables de entorno en CI
- Asegurarse de que no hay dependencias de orden de ejecución

---

## Próximos pasos

1. **Base de datos de test**: Configurar una DB MySQL de test para tests de integración reales
2. **CI/CD**: Configurar GitHub Actions para correr tests en cada PR
3. **Tests E2E**: Agregar tests de flujos completos (registro → onboarding → crear prenda → etc.)
4. **Completar mocks**: Algunos API routes tienen lógica compleja que requiere mocks más detallados

### Para tests de integración reales

Crear `prisma/.env.test`:
```
DATABASE_URL="mysql://user:pass@localhost:3306/ecloset_test"
```

Y modificar el setup para usar una DB real en ambiente de test:
```typescript
// setup.ts para tests de integración
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

beforeEach(async () => {
  // Limpiar tablas antes de cada test
  await prisma.$transaction([
    prisma.resenaVendedor.deleteMany(),
    prisma.resenaProducto.deleteMany(),
    prisma.notificacion.deleteMany(),
    prisma.compra.deleteMany(),
    prisma.favoritoProducto.deleteMany(),
    prisma.eventoCalendario.deleteMany(),
    prisma.outfitPrenda.deleteMany(),
    prisma.outfit.deleteMany(),
    prisma.prenda.deleteMany(),
    prisma.producto.deleteMany(),
    prisma.usuario.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
```
