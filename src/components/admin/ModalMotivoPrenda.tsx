"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import type { PublicacionMarketplace } from "@/app/admin/prendas/datosEjemplo";
import { motivosDecisionPrenda } from "@/app/admin/prendas/motivos";

type ModalMotivoPrendaProps = {
  publicacion: PublicacionMarketplace;
  onClose: () => void;
  onConfirm: (motivo: string, explicacion: string) => void;
};

export default function ModalMotivoPrenda({
  publicacion,
  onClose,
  onConfirm,
}: ModalMotivoPrendaProps) {
  const [motivo, setMotivo] = useState("");
  const [explicacion, setExplicacion] = useState("");
  const campoMotivoRef = useRef<HTMLSelectElement>(null);
  const cantidadExplicacion = explicacion.trim().length;
  const motivoValido = motivo.length > 0;
  const explicacionValida = cantidadExplicacion >= 15 && cantidadExplicacion <= 300;
  const formularioValido = motivoValido && explicacionValida;

  useEffect(() => {
    campoMotivoRef.current?.focus();
  }, []);

  function manejarTeclado(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== "Tab") return;

    const dialogo = event.currentTarget;
    const elementosEnfocables = dialogo.querySelectorAll<HTMLElement>(
      'button:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
    );
    const primero = elementosEnfocables[0];
    const ultimo = elementosEnfocables[elementosEnfocables.length - 1];

    if (!primero || !ultimo) {
      event.preventDefault();
    } else if (event.shiftKey && document.activeElement === primero) {
      event.preventDefault();
      ultimo.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
      event.preventDefault();
      primero.focus();
    }
  }

  function confirmar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formularioValido) return;
    onConfirm(motivo, explicacion.trim());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      onKeyDown={manejarTeclado}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-motivo-publicacion-titulo"
        className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto rounded-[24px] p-5 shadow-2xl sm:p-7"
        style={{ background: "#F9F5F0" }}
      >
        <h2
          id="modal-motivo-publicacion-titulo"
          className="text-xl font-medium"
          style={{ color: "#2C3E2D" }}
        >
          Eliminar publicación
        </h2>
        <p className="mt-1 text-sm" style={{ color: "#6b6b60" }}>
          Completá el motivo y una explicación antes de confirmar.
        </p>

        <div
          className="mt-5 flex items-center gap-4 rounded-2xl border p-3"
          style={{ borderColor: "#e8e4de", background: "#fff" }}
        >
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl"
            style={{ background: "linear-gradient(135deg,#eaf4eb,#f4ede2)" }}
          >
            {publicacion.imagen ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={publicacion.imagen} alt="" className="h-full w-full object-contain p-1" />
            ) : (
              <span className="text-xs" style={{ color: "#6b6b60" }}>Sin imagen</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs" style={{ color: "#6b6b60" }}>Acción: eliminar</p>
            <p className="mt-1 truncate font-medium" style={{ color: "#2C3E2D" }}>
              {publicacion.titulo}
            </p>
          </div>
        </div>

        <p
          role="alert"
          className="mt-4 rounded-xl px-3 py-2 text-sm font-medium"
          style={{ background: "#fff1d6", color: "#6e410b" }}
        >
          Esta acción no se puede deshacer.
        </p>

        <form onSubmit={confirmar} className="mt-5">
          <div>
            <label
              htmlFor="motivo-decision-publicacion"
              className="block text-sm font-medium"
              style={{ color: "#2C3E2D" }}
            >
              Motivo
            </label>
            <select
              ref={campoMotivoRef}
              id="motivo-decision-publicacion"
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              aria-invalid={!motivoValido}
              aria-describedby="error-motivo-publicacion"
              className="mt-2 min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2C3E2D]"
              style={{ borderColor: !motivoValido ? "#b85555" : "#e8e4de", background: "#fff", color: "#2C3E2D" }}
            >
              <option value="">Seleccioná un motivo</option>
              {motivosDecisionPrenda.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion}
                </option>
              ))}
            </select>
            <p
              id="error-motivo-publicacion"
              aria-live="polite"
              className="mt-1 text-xs"
              style={{ color: motivoValido ? "#6b6b60" : "#9b4141" }}
            >
              {motivoValido ? "Podés usar el motivo como referencia para tu explicación." : "Seleccioná un motivo."}
            </p>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="explicacion-decision-publicacion"
                className="block text-sm font-medium"
                style={{ color: "#2C3E2D" }}
              >
                Explicación
              </label>
              <span className="text-xs" style={{ color: "#6b6b60" }}>
                {explicacion.length}/300
              </span>
            </div>
            <textarea
              id="explicacion-decision-publicacion"
              value={explicacion}
              onChange={(event) => setExplicacion(event.target.value)}
              maxLength={300}
              rows={4}
              aria-invalid={!explicacionValida}
              aria-describedby="error-explicacion-publicacion"
              placeholder="Escribí una explicación propia (mínimo 15 caracteres)."
              className="mt-2 w-full resize-y rounded-xl border px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#2C3E2D]"
              style={{ borderColor: !explicacionValida ? "#b85555" : "#e8e4de", background: "#fff", color: "#2C3E2D" }}
            />
            <p
              id="error-explicacion-publicacion"
              aria-live="polite"
              className="mt-1 text-xs"
              style={{ color: explicacionValida ? "#6b6b60" : "#9b4141" }}
            >
              {cantidadExplicacion === 0
                ? "La explicación es obligatoria."
                : cantidadExplicacion < 15
                  ? `La explicación debe tener al menos 15 caracteres sin contar espacios al inicio y al final. Faltan ${15 - cantidadExplicacion}.`
                  : ""}
            </p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-xl border px-4 text-sm font-medium transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D]"
              style={{ borderColor: "#d8d3ca", color: "#2C3E2D" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!formularioValido}
              className="min-h-11 rounded-xl px-4 text-sm font-medium text-white transition enabled:hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2C3E2D]"
              style={{ background: "#9b4141" }}
            >
              Confirmar eliminación
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
