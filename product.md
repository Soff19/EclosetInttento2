# ECLOSET --- Product Design System

> Documento de referencia visual para mantener una identidad coherente
> en todas las secciones de ECLOSET.\
> Actualizado: 28/10/2026.

## 1. Identidad visual

**Estilo:** Pastel Pop Editorial.

**Concepto:** plataforma de moda circular contemporánea, fresca, cercana
y profesional. Combina una paleta pastel y natural con una interfaz
editorial de moda, componentes funcionales y microinteracciones suaves.

**Principios** - La ropa y las fotografías son protagonistas. - Interfaz
limpia, fluida, accesible y fácil de usar. - Los pasteles diferencian
categorías y estados; no todos deben aparecer a la vez. - Usar espacios
en blanco y jerarquía clara para evitar una apariencia recargada o
infantil. - Mantener consistencia entre Login, Registro, Closet,
Outfits, Stylear, Calendario y Marketplace.

## 2. Paleta cromática

### Colores principales

  Nombre         HEX         Uso
  -------------- ----------- -------------------------------------------
  Verde salvia   `#A8BC99`   Botones principales, acciones y selección
  Verde menta    `#C6EFD6`   Fondos suaves y superficies secundarias
  Verde hoja     `#6CAF7B`   Acentos de marca y estados positivos
  Verde claro    `#D7E9A8`   Fondos de selección y detalles
  Verde agua     `#76D1C4`   Indicadores y acentos puntuales

### Colores secundarios

  Nombre        HEX         Uso
  ------------- ----------- -----------------------------------
  Coral         `#FF8F7E`   Etiquetas y avisos suaves
  Durazno       `#FFC9A6`   Etiquetas y fondos secundarios
  Amarillo      `#FFD66B`   Destacados informativos puntuales
  Azul cielo    `#A6D8F7`   Categorías y estados informativos
  Lavanda       `#D4C5F9`   Categorías, filtros y etiquetas
  Rosa pastel   `#F8C6D9`   Detalles de marca y etiquetas

### Neutros y complementarios

  -----------------------------------------------------------------------
  Nombre                  HEX                     Uso
  ----------------------- ----------------------- -----------------------
  Crema                   `#F7F1E7`               Fondo general cálido

  Beige claro             `#F2E6D5`               Superficies y tarjetas

  Gris claro              `#E5E1D9`               Bordes y divisores

  Gris medio              `#C7C2B8`               Elementos secundarios

  Gris oscuro             `#333333`               Texto principal e
                                                  iconos

  Verde profundo          `#0B493D`               Títulos destacados,
                                                  estados activos y
                                                  contraste
  -----------------------------------------------------------------------

### Distribución orientativa

-   60 % crema y fondos neutros claros.
-   25 % superficies claras, blanco roto y beige.
-   10 % verdes de marca.
-   5 % acentos pastel.

La distribución es orientativa. Priorizar contraste y legibilidad. No
usar todos los colores simultáneamente. Definir estados consistentes
para hover, focus, seleccionado, deshabilitado, error y éxito.

## 3. Tipografías

**Familias elegidas** - **Nunito Sans:** textos, inputs, botones,
filtros, navegación y datos funcionales. - **Cormorant Garamond:**
títulos principales y encabezados editoriales destacados.

  Elemento             Tipografía                         Tamaño orientativo
  -------------------- ---------------------------------- -------------------------
  Título principal     Cormorant Garamond                 32--40 px en escritorio
  Título de sección    Cormorant Garamond o Nunito Sans   22--28 px
  Subtítulo            Nunito Sans                        16--20 px
  Texto de interfaz    Nunito Sans                        14--16 px
  Etiquetas y ayudas   Nunito Sans                        12--14 px
  Botones              Nunito Sans                        14--16 px

Los tamaños son referencias y deben adaptarse al viewport. No reducir el
texto excesivamente. Reutilizar la configuración de fuentes existente en
Next.js y evitar cargar las mismas fuentes varias veces.

## 4. Componentes y estilo visual

### Fondos, tarjetas y bordes

-   Fondos cálidos y superficies claras.
-   Bordes finos en gris claro `#E5E1D9`.
-   Radios moderados y consistentes; no convertir todo en píldoras.
-   Sombras discretas solo cuando aporten profundidad.
-   Espacios en blanco suficientes.
-   Evitar encerrar todo en tarjetas innecesarias.

### Botones

-   Principal: verde salvia con texto de buen contraste.
-   Hover: oscurecimiento leve del color principal.
-   Secundario: superficie clara y borde suave.
-   Seleccionado: borde verde y fondo pastel.
-   Mantener tamaños, radios y estados consistentes.

### Inputs y formularios

-   Labels visibles y asociados a los campos; no depender solo de
    placeholders.
-   Altura y padding uniformes.
-   Borde gris suave en estado normal y borde verde visible al recibir
    foco.
-   Mensajes de validación claros y accesibles.
-   Conservar validaciones y lógica funcional existentes.

### Iconografía

-   Usar una familia de iconos consistente.
-   Preferir iconos lineales y sencillos.
-   No usar emojis ni iconos decorativos sin función clara.

## 5. Transparencias y opacidades

-   Usar superficies translúcidas en paneles flotantes, filtros o
    controles superpuestos cuando sea útil.
-   Como punto de partida, probar opacidades de 70--85 % según el fondo.
-   Aplicar desenfoque solo cuando ayude a separar capas.
-   No comprometer legibilidad ni contraste.
-   Evitar efectos de vidrio excesivos, brillos, degradados intensos y
    sombras pesadas.
-   No reducir la opacidad de textos o controles importantes.

## 6. Microinteracciones

  -----------------------------------------------------------------------
  Interacción                         Comportamiento
  ----------------------------------- -----------------------------------
  Hover de tarjeta interactiva        Escala aproximada `1.02`, borde
                                      verde y sombra suave

  Hover de botón                      Oscurecimiento leve del color
                                      principal

  Clic de botón                       Compresión breve aproximada a
                                      `0.98`

  Foco de input                       Borde verde y foco accesible
                                      visible

  Elemento seleccionado               Borde verde y fondo pastel

  Apertura de panel/modal             Aparición gradual y desplazamiento
                                      corto
  -----------------------------------------------------------------------

-   Duración habitual: 150--250 ms; paneles y modales pueden usar
    200--300 ms.
-   Evitar saltos de layout, movimientos excesivos y animaciones
    permanentes.
-   Respetar `prefers-reduced-motion`.
-   Garantizar funcionamiento con teclado y pantallas táctiles.

## 7. Fotografías y prendas

-   Priorizar fotografías reales de prendas y outfits.
-   Mantener una presentación consistente de imágenes.
-   No deformar imágenes ni recortar detalles relevantes de las prendas.
-   Usar iluminación natural y fondos neutros en banners editoriales.
-   En el marketplace, la fotografía debe ser protagonista.
-   No reemplazar productos reales por imágenes estáticas o datos
    inventados.

## 8. Reglas por sección

### Login y Registro

-   Fondo crema y superficies claras.
-   Formularios de ancho controlado y márgenes equilibrados.
-   Nunito Sans para campos y botones; Cormorant Garamond para títulos.
-   Conservar campos, pasos, validaciones y flujos existentes.
-   Diseño responsive.

### Closet

-   Grilla compacta para mostrar más prendas por fila.
-   Referencia: 4--6 columnas en escritorio, 3--4 en tablet y 2 en móvil
    cuando sea viable.
-   Tarjetas pequeñas, imagen protagonista y datos esenciales.
-   Etiquetas pastel discretas.
-   Conservar acciones existentes de las prendas.

### Outfits

-   Grilla compacta coherente con Closet.
-   Priorizar la composición completa del outfit.
-   Evitar tarjetas demasiado altas o anchas.
-   Conservar las acciones existentes para crear, consultar, editar o
    eliminar.

### Stylear

-   Separar claramente selección de prendas y composición del outfit.
-   Usar miniaturas compactas y estados seleccionados visibles.
-   Evitar paneles demasiado anchos y espacios vacíos innecesarios.
-   Conservar la lógica de creación, edición y guardado.

### Calendario

-   Mantener navegación entre fechas/meses y selección de días.
-   Diferenciar tipos de eventos mediante colores pastel con criterio.
-   Mantener celdas legibles y compactas; evitar saturación.
-   Conservar creación y consulta de eventos, asociación de outfits y
    fotografías cuando existan.
-   Mantener formularios y modales coherentes con el resto del sistema.

### Marketplace

-   Grilla compacta, filtros ordenados y etiquetas discretas.
-   Fondos claros y fotografías protagonistas.
-   Mantener coherencia con paleta y tipografías generales.

## 9. Responsive y tamaños

Diseñar mobile-first con Tailwind CSS y los breakpoints de la versión
instalada.

Probar: - Móviles pequeños: 320--375 px. - Móviles estándar: 390--430
px. - Tablets: 768--1024 px. - Escritorios: 1280--1440 px o superiores.

Verificar ausencia de scroll horizontal, proporciones de tarjetas e
imágenes, grillas adaptables, títulos sin cortes, márgenes fluidos,
controles táctiles cómodos, modales utilizables, calendario funcional en
móvil y legibilidad con zoom. No reducir indiscriminadamente tipografías
ni áreas táctiles para compactar el diseño.

## 10. Restricciones de marca y desarrollo

-   No usar emojis.
-   No usar logos ni referencias a inteligencia artificial.
-   No agregar brillos, estrellas, varitas mágicas ni recursos
    tecnológicos decorativos genéricos.
-   No abusar de degradados, sombras intensas, transparencias ni bordes
    en forma de píldora.
-   No inventar testimonios, estadísticas, funcionalidades ni contenido
    promocional.
-   No agregar dependencias innecesarias.
-   No modificar rutas, APIs, autenticación, base de datos, Prisma ni
    contratos de datos durante un rediseño visual.
-   No eliminar campos, acciones o pasos existentes.
-   No introducir cambios globales que afecten páginas fuera del
    alcance.

### Regla especial: barra de navegación

**La barra de navegación existente debe permanecer completamente
intacta.** No modificar colores, tipografías, dimensiones, espaciados,
iconos, textos, posición, animaciones, rutas, comportamiento responsive
ni lógica. Aislar los cambios en el área de contenido y evitar estilos
compartidos que puedan afectarla.

## 11. Verificación final

-   Revisar páginas en móvil, tablet y escritorio.
-   Probar las funciones existentes después de los cambios.
-   Revisar errores de consola y ejecutar lint, typecheck y build si
    están disponibles.
-   Verificar contraste, foco de teclado y reducción de movimiento.
-   Confirmar que no haya desbordamientos ni regresiones.
-   Confirmar que la barra de navegación no cambió.
-   Informar archivos modificados y pruebas ejecutadas; no declarar
    pruebas exitosas si no se ejecutaron.

## 12. Resumen de identidad

**ECLOSET = Pastel Pop Editorial.**

-   **Paleta:** verdes naturales, crema, neutros cálidos y acentos
    pastel.
-   **Tipografías:** Nunito Sans + Cormorant Garamond.
-   **Componentes:** limpios, bordes suaves y sombras discretas.
-   **Transparencias:** puntuales y legibles.
-   **Animaciones:** microinteracciones fluidas de 150--250 ms.
-   **Productos:** tarjetas compactas y fotografías protagonistas.
-   **Responsive:** mobile-first con tamaños cuidadosamente revisados.
-   **Personalidad:** moda circular, cercana, moderna y profesional.
-   **Restricciones:** sin emojis, sin referencias a IA y sin alterar
    funcionalidades existentes.
-   **Navegación:** conservar exactamente la barra actual.
