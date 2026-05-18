# MindFactory — API de Registro de Automotores

API REST para gestionar el registro de automotores y sus dueños, construida con **NestJS + TypeORM + PostgreSQL**.

Las reglas de negocio (validación de dominio argentino, CUIT por módulo 11, dueño único activo y fecha de fabricación no futura) están implementadas tanto en el código como a nivel de base de datos.

---

## 🚀 Levantar con Docker

```bash
docker compose up -d --build
```

Eso levanta todo: base de datos, migraciones y API. En unos segundos tenés la API escuchando en `http://localhost:3000`.

| Servicio | Qué hace | Puerto |
|----------|----------|--------|
| `mf_db` | PostgreSQL 16, datos persistentes en volumen | `5432` |
| `mf_api` | API NestJS (build multi-stage, sin dependencias de desarrollo) | `3000` |

Las migraciones TypeORM se ejecutan automáticamente al arrancar la API. No necesitás correr nada más.

---

## ⚙️ Configuración

El proyecto maneja dos entornos distintos, por eso hay **dos archivos `.env.example`**:

### Para usar con Docker (recomendado)

```bash
cp .env.example .env
```

Docker Compose lee automáticamente el `.env` de la raíz. Solo necesitás tocar este archivo si querés cambiar puertos o credenciales. Variables disponibles:

| Variable | Default |
|----------|---------|
| `PORT` | `3000` |
| `DB_USERNAME` | `postgres` |
| `DB_PASSWORD` | `postgres` |
| `DB_NAME` | `mindfactory_challenge` |

### Para desarrollo local (sin Docker)

```bash
cp api/.env.example api/.env
```

Este `.env` lo lee NestJS cuando corrés `npm run start:dev`. Incluye variables adicionales que Docker no necesita (`DB_HOST`, `NODE_ENV`, etc.). Ajustá `DB_HOST=localhost` si usás PostgreSQL en tu máquina.

---

## 📡 Endpoints

| Método | Ruta | Qué hace |
|--------|------|----------|
| `GET` | `/api/automotores` | Lista todos los automotores con su dueño actual |
| `GET` | `/api/automotores/:dominio` | Detalle de un automotor con su dueño actual |
| `POST` | `/api/automotores` | Alta de automotor y asignación de dueño por CUIT |
| `PUT` | `/api/automotores/:dominio` | Actualiza datos del automotor y/o reasigna dueño |
| `DELETE` | `/api/automotores/:dominio` | Elimina el automotor y su objeto de valor en cascada |
| `GET` | `/api/sujetos/by-cuit?cuit=20123456786` | Busca un sujeto por CUIT |
| `POST` | `/api/sujetos` | Crea un sujeto (CUIT válido + denominación) |

### Ejemplos rápidos con curl

```bash
# Crear un dueño
curl -X POST http://localhost:3000/api/sujetos \
  -H "Content-Type: application/json" \
  -d '{"spo_cuit": "20123456786", "spo_denominacion": "Juan Pérez"}'

# Buscar dueño por CUIT
curl http://localhost:3000/api/sujetos/by-cuit?cuit=20123456786

# Dar de alta un automotor y asignarlo a Juan
curl -X POST http://localhost:3000/api/automotores \
  -H "Content-Type: application/json" \
  -d '{"atr_dominio": "ABC123", "atr_fecha_fabricacion": 202103, "cuit_dueno": "20123456786", "atr_color": "Rojo"}'

# Listar todos los automotores con su dueño actual
curl http://localhost:3000/api/automotores

# Ver detalle de un automotor puntual
curl http://localhost:3000/api/automotores/ABC123

# Reasignar dueño
curl -X PUT http://localhost:3000/api/automotores/ABC123 \
  -H "Content-Type: application/json" \
  -d '{"cuit_dueno": "30531471179"}'

# Eliminar un automotor
curl -X DELETE http://localhost:3000/api/automotores/ABC123
```

---

## 🌱 Seeds (datos de ejemplo)

El proyecto incluye seeds con 2 sujetos y 2 automotores para probar rápido:

```bash
cd api && npm run seed:run
```

Esto crea a **Juan Pérez** (`20123456786`) con un auto dominio `ABC123`, y a **Transportes S.A.** (`30531471179`) con `AB123CD`.

> Los seeds asumen que la base de datos ya está corriendo y las migraciones aplicadas.

---

## 📖 Swagger / OpenAPI

La documentación interactiva está disponible en:

```
http://localhost:3000/api/docs
```

Ahí podés probar todos los endpoints desde el navegador, sin necesidad de curl ni Postman.

---

## 🧪 Tests

```bash
cd api

# Tests unitarios (validadores de CUIT, dominio y fecha)
npm run test

# Tests con reporte de cobertura
npm run test:cov
```

Los tests cubren:
- **CUIT:** 11 dígitos con módulo 11, prefijos válidos (20, 23, 24, 27, 30, 33, 34), caso especial R=1 → DV=9
- **Dominio:** formatos `AAA999` (viejo) y `AA999AA` (Mercosur), rechazo de minúsculas y patrones inválidos
- **Fecha de fabricación:** 6 dígitos YYYYMM, mes 1 a 12, no puede ser futura

---

## 🗄️ Migraciones

```bash
cd api

# Aplicar migraciones manualmente
npm run migration:run

# Revertir la última migración
npm run migration:revert

# Generar una nueva migración por cambios en entidades
npm run migration:generate -- src/database/migrations/NombreDescriptivo
```

---

## 📐 Modelo de datos

```
Sujeto ──< Vinculo_Sujeto_Objeto >── Objeto_De_Valor ──< Automotores
```

| Tabla | Rol |
|-------|-----|
| `Sujeto` | Persona física o jurídica dueña de vehículos |
| `Objeto_De_Valor` | Representación genérica de un bien (en este dominio, un vehículo) |
| `Automotores` | Datos específicos del vehículo (dominio, chasis, motor, color, fecha) |
| `Vinculo_Sujeto_Objeto` | Relaciona un sujeto con un objeto de valor (dueño activo, fechas, responsable) |

La restricción de **dueño único activo** se garantiza en dos capas: un índice parcial único en PostgreSQL (`uq_vso_owner_actual`) y el cierre del vínculo anterior en el servicio antes de insertar uno nuevo.

---

## 📁 Estructura del proyecto

```
.
├── docker-compose.yml
├── .env.example              # Variables para Docker Compose
├── README.md
├── docs/
│   └── DECISION_LOG.md       # Decisiones de diseño, trade-offs y validación
└── api/
    ├── Dockerfile             # Build multi-stage (builder → producción)
    ├── .env.example           # Variables para desarrollo local sin Docker
    ├── package.json
    └── src/
        ├── main.ts            # Bootstrap: pipes, filters, Swagger, CORS
        ├── app.module.ts      # Módulo raíz: ConfigModule + TypeORM + módulos
        ├── config/            # Configuración de app, TypeORM y validación de env
        ├── common/
        │   ├── validators/    # CUIT, dominio y fecha (funciones puras + tests)
        │   ├── filters/       # TypeOrmExceptionFilter (23505 → 422)
        │   └── exceptions/    # BusinessRuleViolationException (422)
        ├── database/
        │   ├── migrations/    # Migración inicial con el SQL exacto del challenge
        │   └── seeds/         # Datos de ejemplo (bonus)
        └── modules/
            ├── automotores/   # Controller, service, DTOs y entity
            ├── sujetos/       # Controller, service, DTOs y entity
            ├── objetos-de-valor/
            └── vinculos/
```

---

## 🎯 Reglas de negocio implementadas

- **Dominio:** solo `AAA999` o `AA999AA`, validado con regex estricto
- **CUIT:** 11 dígitos con verificación por módulo 11, incluye caso especial R=1 → DV=9 y validación de prefijos AFIP
- **Fecha de fabricación:** formato YYYYMM, mes válido, no puede ser futura
- **Dueño único activo:** índice parcial en DB + cierre de vínculo anterior en transacción
- **Alta de automotor:** crea `Objeto_De_Valor` automáticamente si no existe; asigna dueño cerrando cualquier vínculo previo
- **Actualización:** si cambia el CUIT, cierra el vínculo actual y crea uno nuevo en la misma transacción
- **Eliminación:** borrado en cascada (`Vinculo_Sujeto_Objeto` → `Automotores` → `Objeto_De_Valor`)
- **Manejo de errores:** 422 para violaciones de reglas de negocio y constraints de DB, 404 para recursos inexistentes

---

## 📄 Decisiones de diseño

El registro completo de decisiones arquitectónicas, trade-offs y estrategia de validación en producción está en [`docs/DECISION_LOG.md`](docs/DECISION_LOG.md).
