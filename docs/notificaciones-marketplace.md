# Notificaciones del marketplace

> **Aclaración:** en este documento, “API” significa las rutas internas del servidor Next.js de Ecloset, por ejemplo `/api/productos/[id]/comprar`. No significa contratar o conectarse a una API externa. La interfaz necesita comunicarse con el servidor para guardar y consultar notificaciones; Ecloset ya realiza esa comunicación mediante sus propias rutas.

> **Estado de implementación:** el modelo, la migración SQL, las rutas internas y la bandeja de notificaciones descritos aquí ya están implementados en el código del proyecto. La migración debe aplicarse en la base de desarrollo antes de probar el flujo; no se debe apuntar a producción sin revisar primero `DATABASE_URL`.

## Objetivo

Este documento describe cómo incorporar notificaciones para que una persona que publica una prenda en el marketplace se entere cuando otra persona solicita comprarla. La notificación debe aparecer dentro de Ecloset y conservarse aunque el vendedor no esté conectado cuando se genera.

El alcance inicial es **avisar que se registró una solicitud de compra**. La conversación para coordinar pago y entrega puede continuar mediante el dato de contacto que el vendedor ya publica. Un chat dentro de Ecloset sería una funcionalidad distinta y no forma parte de esta primera versión.

## Estado actual del proyecto

El marketplace ya cuenta con los modelos `Producto` y `Compra` en `prisma/schema.prisma`. En `src/app/api/productos/[id]/comprar/route.ts`, la operación `POST`:

1. Verifica que la persona esté autenticada.
2. Busca la publicación y comprueba que esté disponible.
3. Impide que alguien solicite su propia publicación.
4. Crea o recupera una compra para ese comprador y producto.
5. Cambia el estado del producto a `RESERVADO`.

La ruta ahora crea una notificación persistente para quien publicó el producto dentro de la misma transacción que registra la compra y reserva la publicación. El endpoint devuelve si la solicitud fue nueva o ya existía. La confirmación se muestra al comprador en la interfaz; no se envían correos, SMS ni notificaciones push.

## Qué hace una notificación

Una notificación es un registro dirigido a una cuenta que informa de un evento relevante. Para esta función, el evento es `SOLICITUD_COMPRA`: un comprador inició una solicitud por una publicación.

La función completa se divide en responsabilidades:

- **Generación:** tras aceptar la solicitud de compra, guarda una notificación para el vendedor. Incluye una referencia a la publicación y al comprador para que la interfaz pueda mostrar el contexto.
- **Persistencia:** el registro se almacena en la base de datos. No depende de que la página esté abierta ni de que el vendedor esté conectado.
- **Consulta:** el vendedor autenticado obtiene solamente sus notificaciones, ordenadas de la más reciente a la más antigua.
- **Lectura:** el vendedor puede marcar una notificación como leída. Esto actualiza su estado y permite reducir el contador de pendientes.
- **Presentación:** la interfaz muestra un indicador con la cantidad no leída y una lista con el mensaje y un enlace a la publicación o al detalle de la solicitud.

La notificación **no realiza el pago**, no confirma que la venta se haya concretado y no crea un canal de chat. El estado `RESERVADO` representa la lógica existente de la publicación; no debe presentarse como prueba de una transacción completada.

## Flujo esperado

1. El comprador inicia sesión y pulsa **Comprar** en una publicación disponible.
2. La ruta interna de Ecloset valida la sesión, verifica que el producto exista, siga disponible y no pertenezca al usuario actual.
3. La API crea la compra y cambia el producto a `RESERVADO`.
4. La misma operación crea una notificación para `producto.usuarioId`, identificando al comprador y al producto.
5. La ruta interna responde con éxito al comprador. La interfaz confirma que la solicitud se registró y actualiza la publicación.
6. Cuando el vendedor abre Ecloset, consulta sus notificaciones y ve el nuevo aviso, incluso si se creó mientras estaba desconectado.
7. Al abrir o descartar el aviso, la interfaz solicita marcarlo como leído.
8. Para coordinar la entrega, las personas usan el contacto externo publicado por el vendedor, si existe. La aplicación debe indicar claramente cuando no haya un medio de contacto disponible.

Si una operación repetida corresponde a una compra ya registrada, no debería generar avisos repetidos. Es importante decidir también qué respuesta debe recibir el comprador en ese caso; la interfaz no debería afirmar que se creó una nueva solicitud si solo se recuperó una anterior.

## Datos que se deben guardar

Se recomienda agregar un modelo `Notificacion` relacionado con `Usuario`. Como mínimo, guardar:

| Campo | Propósito |
| --- | --- |
| `id` | Identificador único de la notificación. |
| `destinatarioId` | Usuario que debe recibirla; para la compra, el vendedor. |
| `actorId` | Usuario que provocó el evento; para la compra, el comprador. |
| `tipo` | Tipo de evento, inicialmente `SOLICITUD_COMPRA`. |
| `mensaje` | Texto breve que se muestra en la interfaz. |
| `productoId` | Publicación relacionada, para poder navegar al detalle. |
| `leidaEn` | Fecha de lectura; `null` significa no leída. |
| `creadoEn` | Fecha en que se generó el aviso. |

Los datos del producto y de las cuentas deberían recuperarse mediante relaciones al consultar, en vez de duplicar nombres, precios o títulos en el mensaje persistido. Así se evita guardar más información personal de la necesaria y el aviso puede mostrar el estado actual de la publicación.

Como `actorId` y `productoId` pueden quedar obsoletos o eliminarse, hay que definir explícitamente el comportamiento de las relaciones en Prisma. Una opción habitual es borrar las notificaciones relacionadas cuando se elimina la cuenta destinataria y conservar la notificación con referencias opcionales cuando se elimina el actor o el producto. La decisión depende de las reglas de conservación de datos del proyecto.

También se recomienda un índice compuesto por destinatario y fecha descendente (o índice por destinatario y fecha, según el soporte del proveedor) para que consultar la bandeja no requiera recorrer notificaciones de otros usuarios.

## Cambios necesarios

### 1. Esquema Prisma y migración

- Agregar el modelo `Notificacion` y la relación inversa desde `Usuario`.
- Añadir los índices necesarios para consultar por destinatario y fecha.
- Crear una migración nueva; no editar una migración ya aplicada en otros entornos.
- Aplicar la migración en desarrollo y generar el cliente Prisma.
- Revisar que la base de datos de producción reciba la migración antes de desplegar código que consulte el nuevo modelo.

El comando definido actualmente en `package.json` para crear y aplicar la migración en desarrollo es:

```bash
npm run db:migrate
```

La migración SQL correspondiente ya está en `prisma/migrations/20261021090000_notificaciones_marketplace/`. Antes de ejecutar el comando, confirmar que `DATABASE_URL` apunta a una base local/de desarrollo. En el entorno de despliegue, aplicar migraciones revisadas con `npm run db:deploy`. No se debe usar `db:push` como sustituto de una migración revisable en un despliegue compartido.

### 2. Creación transaccional de la compra y el aviso

Ampliar `src/app/api/productos/[id]/comprar/route.ts` para crear la compra, reservar la publicación y generar la notificación como parte de una operación coherente.

La operación debe impedir resultados parciales, por ejemplo una prenda reservada sin su notificación. Usar una transacción de Prisma es una opción adecuada. Además, el control de disponibilidad debe resistir dos solicitudes concurrentes: ambas no deberían poder ganar la reserva sobre la misma publicación. La comprobación y actualización deben ejecutarse con una condición atómica o una transacción que vuelva a validar que el estado sigue siendo `DISPONIBLE`.

La unicidad existente de `Compra` para la combinación comprador-producto ayuda a evitar compras duplicadas de la misma persona, pero no impide por sí sola que dos compradores distintos intenten reservar simultáneamente. Hay que considerar esa diferencia al implementar el control de concurrencia.

Crear el aviso solo cuando se haya registrado una solicitud nueva. Si la API decide conservar `upsert`, debe detectar si creó una compra nueva antes de crear la notificación; en caso contrario, los reintentos podrían duplicar avisos. También se puede añadir una clave de idempotencia o una restricción única apropiada si las reglas de negocio lo requieren.

### 3. API para consultar y actualizar notificaciones

Crear rutas internas de Next.js protegidas por autenticación (no se requiere ningún proveedor externo):

- `GET /api/notificaciones`: devuelve las notificaciones del usuario autenticado, paginadas, con su estado de lectura y datos mínimos del actor y del producto.
- `PATCH /api/notificaciones/[id]`: marca como leída una notificación que pertenece al usuario autenticado.
- Opcional: `PATCH /api/notificaciones`: marca todas las notificaciones del usuario como leídas.

El servidor nunca debe confiar en un `destinatarioId` proporcionado por el navegador. Debe obtener el usuario de la sesión o token verificado y usar ese identificador en cada consulta y actualización. En el cambio por ID, filtrar tanto por el ID de la notificación como por el destinatario autenticado; responder `404` si no existe o no pertenece a esa persona para no revelar registros ajenos.

Conviene limitar el tamaño de página y devolver un contador de no leídas. Por ejemplo, la respuesta puede incluir `items`, `noLeidas` y un indicador de si existe una página siguiente. No hace falta cargar toda la bandeja en cada petición.

### 4. Interfaz de usuario

- Añadir un acceso reconocible a notificaciones en la navegación principal.
- Mostrar un contador o indicador cuando haya avisos sin leer.
- Presentar cada aviso con el mensaje, fecha, estado de lectura y enlace a la publicación.
- Marcar el aviso como leído al abrirlo o mediante una acción explícita.
- Mostrar estados de carga, lista vacía y error de red.
- Actualizar la interfaz tras una compra para reflejar el resultado devuelto por el servidor.
- Evitar usar texto o datos privados que la API no haya autorizado para el destinatario.

La interfaz puede consultar la API al cargar la aplicación y al abrir el panel de notificaciones. La actualización en tiempo real no es necesaria para la primera versión; el vendedor verá el aviso al volver a cargar o consultar la bandeja. WebSockets, Server-Sent Events o un servicio de push podrían añadirse después si se necesita entrega instantánea.

### 5. Contacto y mensajes

La publicación ya contiene un campo `contacto`, que puede guardar un enlace externo como WhatsApp o Instagram. El aviso permite que el vendedor sepa que hay interés, pero no sustituye ese medio de contacto.

Para una primera versión:

- Mostrar el contacto externo solo según las reglas de visibilidad definidas por el producto.
- Validar y normalizar los enlaces permitidos para evitar enlaces malformados o engañosos.
- Si no se publicó un contacto, indicarlo al comprador y al vendedor; no inventar un canal que la aplicación no tiene.

Para permitir conversaciones dentro de Ecloset habría que diseñar por separado entidades de conversación y mensaje, permisos de lectura y envío, estados de entrega/lectura, bloqueo o reporte, moderación y protección contra spam. No conviene guardar mensajes dentro del registro de notificación: son conceptos con ciclos de vida distintos.

## Seguridad y privacidad

- La identidad del destinatario se determina en el servidor a partir del dueño real del producto.
- El comprador no puede crear notificaciones arbitrarias ni indicar quién las recibe.
- Solo el destinatario puede listar, leer o marcar sus notificaciones.
- No incluir contraseñas, tokens, correos u otros datos sensibles en el texto del aviso.
- Validar que el usuario esté autenticado antes de crear una compra.
- No confiar en el estado del producto enviado por el cliente; leerlo y validarlo en el servidor.
- Aplicar límites de paginación y considerar controles contra solicitudes automatizadas si el marketplace lo necesita.

## Pruebas recomendadas

### Ruta interna de compra

- Usuario no autenticado: responde `401` y no crea compra ni notificación.
- Producto inexistente o no disponible: responde error y no crea registros.
- El dueño de la publicación intenta comprarla: responde `400` y no crea notificación.
- Solicitud válida: registra la compra, reserva el producto y crea exactamente un aviso para el dueño.
- Reintento del mismo comprador: no duplica compra ni notificación.
- Dos compradores concurrentes: solo uno consigue reservar el producto.
- Fallo al persistir el aviso: la operación no deja una reserva parcial sin notificación si se usa la transacción prevista.

### Bandeja de notificaciones

- El usuario ve sus avisos y no los de otras cuentas.
- Las notificaciones aparecen de más nuevas a más antiguas.
- Una notificación no leída cambia a leída al usar el endpoint correspondiente.
- Un usuario no puede marcar como leída una notificación de otra persona.
- El contador de pendientes coincide con la cantidad de avisos no leídos.
- La lista vacía y los errores de red se representan sin romper la navegación.

## Criterios de aceptación

La primera versión puede considerarse terminada cuando:

1. Una solicitud de compra válida deja una notificación persistida para el vendedor correcto.
2. La compra, la reserva y el aviso se mantienen coherentes ante fallos y solicitudes concurrentes.
3. El vendedor puede consultar su bandeja al iniciar sesión y abrir la publicación relacionada.
4. El vendedor puede marcar avisos como leídos y el contador se actualiza.
5. Un usuario no puede consultar ni modificar avisos ajenos.
6. Los reintentos no generan avisos duplicados.
7. La interfaz explica que la solicitud fue registrada, sin afirmar que el pago o la venta ya se completaron.

## Orden sugerido de implementación

1. Definir el modelo y las reglas de borrado de relaciones.
2. Crear y aplicar la migración de Prisma.
3. Implementar creación transaccional e idempotente del aviso en la ruta de compra.
4. Implementar los endpoints de consulta y marcado como leído.
5. Añadir el indicador y la bandeja en la interfaz.
6. Agregar pruebas para permisos, duplicados y concurrencia.
7. Probar el flujo con dos cuentas diferentes en el entorno de desarrollo.

## Resumen

La función de notificaciones convierte la acción actual de comprar en un flujo visible para ambas partes: el comprador recibe confirmación de que su solicitud fue registrada y el vendedor recibe un aviso persistente de quién se interesó por qué publicación. La notificación comunica un evento; la compra/reserva controla el estado del marketplace; el contacto o chat permite coordinar. Mantener esas responsabilidades separadas hace que el sistema sea más fácil de probar y ampliar.