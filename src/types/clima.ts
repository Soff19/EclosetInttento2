export type CondicionClima =
  | "soleado"
  | "nublado"
  | "lluvia"
  | "tormenta"
  | "nieve"
  | "niebla";

export type DatosClima = {
  ciudad: string;
  temperatura: number;
  sensacionTermica: number;
  humedad: number;
  vientoKmh: number;
  probabilidadLluvia: number;
  descripcion: string;
  condicion: CondicionClima;
};
