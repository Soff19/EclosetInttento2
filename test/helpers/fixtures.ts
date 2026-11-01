export const fixtures = {
  prenda: {
    valid: {
      id: "prenda-id-123",
      urlImagen: "https://example.com/image.jpg",
      categoria: "REMERA",
      color: "AZUL",
      nombre: "Remera de prueba",
      descripcion: "Una remera para testing",
      etiquetas: '["casual","verano"]',
      talle: "M",
      usuarioId: "test-user-id-123",
      fechaCreacion: new Date(),
    },
    createInput: {
      categoria: "REMERA",
      color: "AZUL",
      nombre: "Nueva remera",
      talle: "M",
    },
  },

  outfit: {
    valid: {
      id: "outfit-id-123",
      nombre: "Outfit de prueba",
      usuarioId: "test-user-id-123",
      categoria: "CASUAL",
      descripcion: "Un outfit para testing",
      fechaCreacion: new Date(),
    },
    createInput: {
      nombre: "Nuevo outfit",
      categoria: "CASUAL",
      prendas: ["prenda-id-1", "prenda-id-2"],
    },
  },

  producto: {
    valid: {
      id: "producto-id-123",
      titulo: "Producto de prueba",
      descripcion: "Un producto para testing",
      precio: 1500.0,
      estado: "DISPONIBLE",
      imagen: "https://example.com/product.jpg",
      etiquetas: '["moda","mujer"]',
      contacto: "whatsapp:1234567890",
      usuarioId: "test-user-id-123",
      fechaInicio: new Date(),
    },
    createInput: {
      titulo: "Nuevo producto",
      descripcion: "Descripción del producto",
      precio: 2000,
      contacto: "email:test@example.com",
    },
  },

  compra: {
    valid: {
      id: "compra-id-123",
      compradorId: "buyer-user-id",
      productoId: "producto-id-123",
      estado: "PENDIENTE",
      creadoEn: new Date(),
    },
    concretada: {
      id: "compra-id-456",
      compradorId: "buyer-user-id",
      productoId: "producto-id-123",
      estado: "CONCRETADA",
      creadoEn: new Date(),
      fechaConcretada: new Date(),
    },
  },

  notificacion: {
    valid: {
      id: "notif-id-123",
      destinatarioId: "test-user-id-123",
      actorId: "actor-user-id",
      productoId: "producto-id-123",
      tipo: "COMPRA_SOLICITADA",
      mensaje: "Alguien quiere comprar tu producto",
      leidaEn: null,
      creadoEn: new Date(),
    },
  },

  eventoCalendario: {
    valid: {
      id: "evento-id-123",
      usuarioId: "test-user-id-123",
      fecha: new Date("2026-11-15"),
      tipo: "evento",
      titulo: "Evento de prueba",
      outfitId: null,
      urlImagen: null,
      creadoEn: new Date(),
    },
    outfit: {
      id: "evento-id-456",
      usuarioId: "test-user-id-123",
      fecha: new Date("2026-11-20"),
      tipo: "outfit",
      titulo: null,
      outfitId: "outfit-id-123",
      urlImagen: null,
      creadoEn: new Date(),
    },
  },

  resena: {
    producto: {
      id: "resena-prod-123",
      puntuacion: 5,
      comentario: "Excelente producto",
      usuarioId: "test-user-id-123",
      productoId: "producto-id-123",
      creadoEn: new Date(),
    },
    vendedor: {
      id: "resena-vend-123",
      compraId: "compra-id-456",
      compradorId: "buyer-user-id",
      vendedorId: "seller-user-id",
      puntuacion: 4,
      comentario: "Buen vendedor",
      creadoEn: new Date(),
    },
  },
};
