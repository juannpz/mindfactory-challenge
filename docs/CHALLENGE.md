**⏰ Plazo:** 3 días (72 h) desde que recibís este enunciado.

**📤 Entrega:** enviá un mail a [**challenge@mindfactory.ar**](mailto:challenge@mindfactory.ar) con el **link al repo público**.

**🆘 Dudas:** podés escribirnos a [**lucas.kail@mindfactory.ar**](mailto:lucas.kail@mindfactory.ar)

**🧰 Stack objetivo:** NestJS + PostgreSQL (con TypeORM)

---

## 🎯 Objetivo

Construir una API REST en **NestJS + TypeORM + Postgres** para gestionar el registro de automotores y sus dueños, preservando el modelo de dominio y las reglas de negocio definidas abajo.

> Bonus de actitud: contanos tus decisiones, trade-offs y cómo validarías en producción.
> 

---

## 📦 Alcance obligatorio

### 🔧 Backend (NestJS)

**Modelo de datos:**

```
Automotores → Objeto_De_Valor → Vinculo_Sujeto_Objeto → Sujeto
```

**Validaciones (server-side):**

- **Dominio**: formato `AAA999` o `AA999AA` (regex estricto).
- **CUIT**: 11 dígitos, dígito verificador por módulo 11.
- **Fecha de fabricación (YYYYMM)**: exactamente 6 dígitos, mes entre 1 y 12, no puede ser futura.
- **Dueño único activo**: solo puede haber un vínculo `responsable='S'` y `fecha_fin IS NULL` por automotor; al reasignar, se debe cerrar el anterior.

**Endpoints (`/api`):**

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/automotores` | Lista todos los automotores con su dueño actual. |
| `GET` | `/automotores/:dominio` | Detalle de un automotor con su dueño actual. |
| `POST` | `/automotores` | Alta de automotor + asignación de dueño por CUIT (valida todo). |
| `PUT` | `/automotores/:dominio` | Actualiza datos y/o reasigna dueño. |
| `DELETE` | `/automotores/:dominio` | Elimina automotor y su objeto de valor en cascada. |
| `GET` | `/sujetos/by-cuit?cuit=` | Busca un sujeto por CUIT. |
| `POST` | `/sujetos` | Crea un sujeto (CUIT válido + denominación). |

**Entidades TypeORM:**

- Modelar las cuatro tablas (`Sujeto`, `Objeto_De_Valor`, `Automotores`, `Vinculo_Sujeto_Objeto`) como entidades TypeORM con sus decoradores, relaciones y constraints correspondientes.
- Las migraciones o sincronización del esquema deben ejecutarse automáticamente al levantar la API.

**Manejo de errores:**

- `422 Unprocessable Entity` para violaciones de reglas de negocio, con mensaje descriptivo.
- `404 Not Found` cuando el recurso no existe.

**Tests:**

- Tests unitarios para los validadores de CUIT, dominio y fecha YYYYMM.

---

## 🗄️ Esquema SQL

```sql
CREATE TABLE IF NOT EXISTS "Sujeto" (
  spo_id           BIGSERIAL PRIMARY KEY,
  spo_cuit         VARCHAR(11)  NOT NULL UNIQUE,
  spo_denominacion VARCHAR(160) NOT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Objeto_De_Valor" (
  ovp_id          BIGSERIAL PRIMARY KEY,
  ovp_tipo        VARCHAR(30)  NOT NULL DEFAULT 'AUTOMOTOR',
  ovp_codigo      VARCHAR(64)  NOT NULL UNIQUE,
  ovp_descripcion VARCHAR(240),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Automotores" (
  atr_id                  BIGSERIAL   PRIMARY KEY,
  atr_ovp_id              BIGINT      NOT NULL REFERENCES "Objeto_De_Valor"(ovp_id) ON DELETE CASCADE,
  atr_dominio             VARCHAR(8)  NOT NULL UNIQUE,
  atr_numero_chasis       VARCHAR(25),
  atr_numero_motor        VARCHAR(25),
  atr_color               VARCHAR(40),
  atr_fecha_fabricacion   INTEGER     NOT NULL,  -- YYYYMM
  atr_fecha_alta_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_atr_fecha_fabricacion CHECK (atr_fecha_fabricacion BETWEEN 190001 AND 299912)
);

CREATE TABLE IF NOT EXISTS "Vinculo_Sujeto_Objeto" (
  vso_id           BIGSERIAL    PRIMARY KEY,
  vso_ovp_id       BIGINT       NOT NULL REFERENCES "Objeto_De_Valor"(ovp_id) ON DELETE CASCADE,
  vso_spo_id       BIGINT       NOT NULL REFERENCES "Sujeto"(spo_id) ON DELETE RESTRICT,
  vso_tipo_vinculo VARCHAR(30)  NOT NULL DEFAULT 'DUENO',
  vso_porcentaje   NUMERIC(5,2) NOT NULL DEFAULT 100,
  vso_responsable  CHAR(1)      NOT NULL DEFAULT 'S',
  vso_fecha_inicio DATE         NOT NULL DEFAULT CURRENT_DATE,
  vso_fecha_fin    DATE         NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- índice único: solo un dueño activo por automotor
CREATE UNIQUE INDEX uq_vso_owner_actual
  ON "Vinculo_Sujeto_Objeto"(vso_ovp_id)
  WHERE vso_responsable = 'S' AND vso_fecha_fin IS NULL AND vso_tipo_vinculo = 'DUENO';
```

---

## 🔁 Reglas de negocio clave

1. **Alta de automotor**: si el `Objeto_De_Valor` con ese dominio no existe, crearlo. Asignar el dueño cerrando cualquier vínculo activo previo.
2. **Actualización**: misma lógica que el alta; si cambia el CUIT, cerrar el vínculo anterior e insertar uno nuevo.
3. **Eliminación**: eliminar en cascada `Vinculo_Sujeto_Objeto`, `Automotores` y `Objeto_De_Valor`.
4. **Listado**: incluir dominio, CUIT del dueño actual, denominación del dueño, datos del automotor.

---

## 🐳 Docker

- `docker-compose.yml` con dos servicios:
    - **db**: Postgres 16 con volumen de datos.
    - **api**: NestJS con build multi-stage, `depends_on: db`, healthcheck.
- `.env.example` con puertos y credenciales de ejemplo.
- **README** con one-liner: `docker compose up -d --build` (+ migraciones/seed si aplican).
- Debe levantar con un solo comando y quedar accesible en `localhost`.

---

## 🔀 Flujo de trabajo con Git

- Trabajar en **ramas separadas** (una por feature/módulo).
- **Commits en Conventional Commits**: `feat(api): validar dominio`, `fix(tests): corregir cálculo mod11`, etc.
- **Mínimo 2 Pull Requests** (por ejemplo: `feat/dominio-automotores` y `feat/docker-config`):
    - Descripción con **qué / por qué / cómo**, pruebas realizadas y trade-offs considerados.

---

## 🧪 Criterios de evaluación (100 pts)

| Criterio | Puntos |
| --- | --- |
| Fidelidad de reglas de negocio en el backend | 30 |
| Calidad de diseño (módulos, servicios, DTOs, errores) | 15 |
| Modelo & SQL (constraints, relaciones, índices, dueño único) | 15 |
| Tests unitarios (validadores) | 15 |
| Docker (1 comando + README claro) | 10 |
| Git Workflow (ramas, PRs, commits) | 10 |
| Documentación de decisiones (`docs/DECISION_LOG.md`) | 5 |

**Bonus (hasta +5 pts):** seeds mínimas con datos de ejemplo, Swagger/OpenAPI.

---

## 📬 Entrega

- Enviá un mail a [**challenge@mindfactory.ar**](mailto:challenge@mindfactory.ar) con el **link al repo público**.
- El README debe incluir:
    - Cómo levantar con Docker.
    - Cómo correr los tests.
    - Endpoints principales y credenciales de ejemplo.

---

## ✅ Checklist de aceptación

- [ ]  `docker compose up -d --build` levanta **db** y **api** con healthchecks.
- [ ]  `GET /api/automotores` lista automotores con dueño actual.
- [ ]  `POST /api/automotores` crea automotor y asigna dueño (CUIT válido + existente).
- [ ]  `PUT /api/automotores/:dominio` actualiza datos y puede reasignar dueño.
- [ ]  `DELETE /api/automotores/:dominio` elimina en cascada.
- [ ]  Validaciones de dominio, CUIT y fecha devuelven `422` con mensaje claro.
- [ ]  Tests unitarios de los tres validadores pasan (`npm run test`).
- [ ]  `≥2 PRs` con descripción y decisiones; commits en Conventional Commits.
- [ ]  `docs/DECISION_LOG.md` con decisiones relevantes del diseño.