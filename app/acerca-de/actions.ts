"use server";

import { Resend } from "resend";

export type ContactState =
  | { status: "idle" }
  | { status: "error"; reason: "validation" | "send"; message: string }
  | { status: "success"; name: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function sendContactMessage(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const msg = String(formData.get("msg") ?? "").trim();

  if (!name || !email || !msg) {
    return {
      status: "error",
      reason: "validation",
      message: "Completa nombre, correo y mensaje.",
    };
  }

  if (!EMAIL_RE.test(email)) {
    return {
      status: "error",
      reason: "validation",
      message: "El correo no tiene un formato válido.",
    };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM;
  const to = process.env.CONTACT_TO;

  if (!apiKey || !from || !to) {
    return {
      status: "error",
      reason: "send",
      message: "El servicio de correo no está configurado.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `[Arcade Vault] Mensaje de ${name}`,
      text: `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${msg}\n`,
    });

    if (error) {
      return {
        status: "error",
        reason: "send",
        message: error.message,
      };
    }

    return { status: "success", name };
  } catch (err) {
    return {
      status: "error",
      reason: "send",
      message: err instanceof Error ? err.message : "Error al enviar el correo.",
    };
  }
}
