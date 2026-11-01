import { vi, afterEach } from "vitest";

// Mock de Prisma Client
vi.mock("@/lib/prisma", () => ({
  default: mockPrisma,
}));

// Mock de ImageKit
vi.mock("@/lib/imagekit", () => ({
  getImageKit: () => ({
    upload: vi.fn().mockResolvedValue({
      url: "https://ik.imagekit.io/test/image.jpg",
      fileId: "test-file-id",
    }),
  }),
}));

// Mock de notifications
vi.mock("@/lib/notifications", () => ({
  createNotification: vi.fn().mockResolvedValue({}),
  notifyFavorite: vi.fn().mockResolvedValue({}),
  notifyPurchaseRequest: vi.fn().mockResolvedValue({}),
  notifyPurchaseAccepted: vi.fn().mockResolvedValue({}),
  notifyPurchaseRejected: vi.fn().mockResolvedValue({}),
  notifyPurchaseCompleted: vi.fn().mockResolvedValue({}),
  notifySellerReview: vi.fn().mockResolvedValue({}),
}));

// Mock de mailer
vi.mock("@/lib/mailer", () => ({
  sendEmail: vi.fn().mockResolvedValue({}),
  sendPasswordResetEmail: vi.fn().mockResolvedValue({}),
  sendWelcomeEmail: vi.fn().mockResolvedValue({}),
}));

// Mock del cliente Prisma con métodos básicos
export const mockPrisma = {
  usuario: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  prenda: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  outfit: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  outfitPrenda: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  producto: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  favoritoProducto: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  compra: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  resenaProducto: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn(),
  },
  resenaVendedor: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    aggregate: vi.fn(),
  },
  notificacion: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
  },
  eventoCalendario: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrisma)),
};

// Limpia todos los mocks después de cada test
afterEach(() => {
  vi.clearAllMocks();
});

// Variables de entorno para tests
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";
process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";
