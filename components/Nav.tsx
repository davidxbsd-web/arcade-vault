"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (name: "juegos" | "biblioteca" | "salon") => {
    if (name === "juegos") {
      return pathname === "/juegos";
    }
    if (name === "biblioteca") {
      return pathname.startsWith("/biblioteca") || pathname.startsWith("/jugar");
    }
    return pathname.startsWith("/salon");
  };

  const close = () => setOpen(false);

  return (
    <>
      <nav className="av-nav">
        <Link href="/juegos" className="logo">
          <div className="logo-mark"></div>
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>
        <div className="links">
          <Link href="/juegos" className={isActive("juegos") ? "active" : ""}>
            Inicio
          </Link>
          <Link href="/biblioteca" className={isActive("biblioteca") ? "active" : ""}>
            Biblioteca
          </Link>
          <Link href="/salon" className={isActive("salon") ? "active" : ""}>
            Salón de la Fama
          </Link>
        </div>
        <div className="spacer"></div>
        <div className="coin-counter">
          <span className="coin"></span>
          <span>CRÉDITOS · 03</span>
        </div>
        <Link href="/auth" className="btn auth-btn">
          Iniciar Sesión
        </Link>
        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={"av-mobile-backdrop" + (open ? " open" : "")}
        onClick={close}
      ></div>
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        <Link
          href="/juegos"
          className={isActive("juegos") ? "active" : ""}
          onClick={close}
        >
          Inicio
        </Link>
        <Link
          href="/biblioteca"
          className={isActive("biblioteca") ? "active" : ""}
          onClick={close}
        >
          Biblioteca
        </Link>
        <Link
          href="/salon"
          className={isActive("salon") ? "active" : ""}
          onClick={close}
        >
          Salón de la Fama
        </Link>
        <Link
          href="/auth"
          className={pathname.startsWith("/auth") ? "active" : ""}
          onClick={close}
        >
          Iniciar Sesión
        </Link>
        <div style={{ flex: 1 }}></div>
        <div
          className="pixel"
          style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
