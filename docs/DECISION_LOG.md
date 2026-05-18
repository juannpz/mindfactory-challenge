# Registro de Decisiones — MindFactory Tech Challenge

## Decisiones de arquitectura y diseño

### 1. Estructura modular con separación por dominio
**Decisión:** Separar el código en módulos `automotores`, `sujetos`, `objetos-de-valor` y `vinculos` siguiendo las convenciones de NestJS.

**Por qué:**
- Mapea directamente las cuatro tablas definidas en el esquema SQL del challenge.
- Cada módulo encapsula su entidad, DTOs, servicio y controlador, facilitando la navegación y extensión del código.
- El módulo `automotores` orquesta operaciones cross-entity (crear o eliminar un automotor toca `Objeto_De_Valor` y `Vinculo_Sujeto_Objeto`), mientras que `sujetos` es autocontenido.

**Trade-offs:** Se consideró un único módulo monolítico, pero la separación permite testing independiente y sigue los principios SOLID. Los módulos `objetos-de-valor` y `vinculos` no tienen service ni controller propio — solo exponen la entidad — pero se mantienen separados por claridad semántica.

---

### 2. TypeORM con `migrationsRun: true` en lugar de `synchronize: true`
**Decisión:** Usar migraciones de TypeORM para la gestión del esquema, ejecutadas automáticamente al iniciar.

**Por qué:**
- `synchronize: true` es peligroso en producción; las migraciones permiten cambios de esquema versionados y auditables.
- El challenge pide explícitamente sincronización automática al levantar, y `migrationsRun: true` lo cumple sin sacrificar seguridad.
- La migración inicial reproduce exactamente el SQL del enunciado (líneas 68-113 del challenge).

**Trade-offs:** Agrega un paso de build para generar migraciones, pero el script de CLI (`npm run migration:generate`) lo simplifica. La migración usa SQL crudo en lugar del query builder de TypeORM para tener control total sobre constraints, FKs e índices parciales.

---

### 3. `class-validator` + `ValidationPipe` para validación de formato, `BusinessRuleViolationException` para reglas de dominio
**Decisión:** Validación en dos capas: formato/estructura via decoradores en DTOs (devuelve 400), reglas de negocio via excepción custom (devuelve 422).

**Por qué:**
- El `ValidationPipe` de NestJS con decoradores `class-validator` maneja automáticamente errores de formato (campos faltantes, tipos incorrectos).
- Las reglas de negocio (CUIT módulo 11, dueño único, fecha no futura) se validan en la capa de servicio y lanzan `BusinessRuleViolationException` → 422.
- La separación limpia entre "bad request" y "violación de regla de negocio" se alinea con lo especificado en el challenge.
- Los validadores son funciones puras exportadas desde `common/validators/`, sin dependencia de NestJS, lo que facilita el testing unitario.

---

### 4. Filtro global de excepciones
**Decisión:** Un `TypeOrmExceptionFilter` que normaliza las respuestas de error y mapea códigos de PostgreSQL a HTTP 422.

**Por qué:**
- Forma de respuesta JSON consistente: `{ statusCode, message, timestamp, path }`.
- Mapea `23505` (unique_violation) a 422 con mensaje descriptivo del campo duplicado.
- Mapea `23503` (foreign_key_violation) a 422 con detalle de la referencia faltante.
- Sin este filtro, los errores de constraint de PostgreSQL llegarían como 500 genéricos.

---

### 5. Índice parcial único para dueño activo
**Decisión:** Forzar la restricción de "un solo dueño activo por automotor" a nivel de base de datos mediante un índice parcial único.

**Por qué:**
- El SQL del challenge define `uq_vso_owner_actual`: índice único sobre `(vso_ovp_id)` WHERE `vso_responsable='S' AND vso_fecha_fin IS NULL AND vso_tipo_vinculo='DUENO'`.
- La restricción a nivel de base de datos previene condiciones de carrera que una validación a nivel aplicación podría omitir.
- Se implementa con el decorador `@Index` de TypeORM con la opción `where` para generar el índice parcial.
- Se complementa con el cierre del vínculo anterior en el servicio (`update` con `vso_fecha_fin = today()`) antes de insertar el nuevo, dentro de la misma transacción.

---

### 6. Docker multi-stage
**Decisión:** Usar un Dockerfile multi-stage (build → producción).

**Por qué:**
- Imagen de producción más chica (sin `devDependencies`, sin código TypeScript fuente).
- Builds más rápidos por cacheo de capas (`npm ci` solo se re-ejecuta si cambia `package-lock.json`).
- El stage de producción corre como usuario no-root (`appuser`) por seguridad.
- `docker-compose.yml` incluye healthchecks en ambos servicios (`pg_isready` para la DB, `wget /api/automotores` para la API) y `depends_on` con `condition: service_healthy`.

**Trade-offs:** Se usa `CMD` en lugar de `ENTRYPOINT` para permitir `docker run ... sh` durante debugging. `node:24-alpine` como imagen base — es la LTS más reciente al momento del desarrollo.

---

### 7. Inyección directa de repositorios en `AutomotoresService`
**Decisión:** `AutomotoresService` inyecta directamente `Repository<Sujeto>` en lugar de delegar en `SujetosService`.

**Por qué:**
- `AutomotoresService` es un orquestador cross-entity que legítimamente necesita acceso a las 4 tablas para sus transacciones.
- Las operaciones de búsqueda de sujeto por CUIT dentro de `create()` y `update()` ocurren dentro del contexto transaccional del `queryRunner`; delegar en `SujetosService` usaría un repositorio externo a la transacción.
- La búsqueda es trivial (`findOne({ where: { spo_cuit } })`) — no se está duplicando lógica compleja.

**Trade-offs:** Genera acoplamiento directo entre módulos a nivel TypeORM (`AutomotoresModule` importa `TypeOrmModule.forFeature([Sujeto])`). Se consideró usar `SujetosModule` y su `SujetosService` exportado, pero se descartó porque introducía una capa de indirección innecesaria para una operación trivial y rompía la consistencia transaccional.

---

### 8. `IsNull()` en `findActiveOwner` para filtrar dueño activo a nivel DB
**Decisión:** Usar `IsNull()` de TypeORM en el `where` de `findActiveOwner()` en lugar de filtrar `vso_fecha_fin` en JavaScript.

**Por qué:**
- Sin `IsNull()`, `findOne()` puede devolver un vínculo cerrado si existe historial de dueños (varios registros con el mismo `vso_ovp_id`). TypeORM sin `order` devuelve el primer registro que PostgreSQL encuentre.
- El filtro en JavaScript (`vinculo && !vinculo.vso_fecha_fin`) descartaba el registro incorrecto pero retornaba `null`, mostrando el automotor sin dueño cuando sí tenía uno activo.
- Con `vso_fecha_fin: IsNull()` en el WHERE, la base de datos garantiza que solo se evalúan vínculos activos, haciendo redundante (y eliminando) el filtro en JavaScript.

---

### 9. Decorador `@Check` en `Automotor` para reflejar el constraint de la migración

**Decisión:** Agregar el decorador `@Check('chk_atr_fecha_fabricacion', 'atr_fecha_fabricacion BETWEEN 190001 AND 299912')` en la entidad `Automotor` sobre la columna `atr_fecha_fabricacion`.

**Por qué:**
- La migración inicial (`1747340000000-InitialMigration`) crea este constraint a nivel SQL, pero la entidad no lo declaraba explícitamente.
- Sin el decorador, futuras generaciones con `migration:generate` pueden detectar el constraint como "huérfano" (existente en la BD pero no en la entidad) y generar una migración que lo dropee.
- Mantener la entidad sincronizada con el esquema real es una buena práctica de TypeORM: la entidad es la fuente de verdad del modelo.
- El overhead es nulo — solo un decorador — y previene un bug sutil en el futuro.

---

## Validación en producción

- **Validador de CUIT:** tests unitarios cubren CUITs válidos, prefijos inválidos, dígito verificador incorrecto y caso especial R=1 → DV=9. Smoke tests contra CUITs de prueba de AFIP.
- **Validador de dominio:** suite de tests con regex cubriendo `AAA999`, `AA999AA`, minúsculas, formatos incorrectos y casos borde.
- **Dueño único:** el índice parcial único en PostgreSQL previene dueños activos duplicados ante requests concurrentes. Tests de integración verifican que el constraint rechaza correctamente un segundo vínculo activo.
- **Healthchecks:** el healthcheck de Docker sobre la API permite que el orquestador detecte instancias no saludables y las reinicie.
