# Design Specification: Moodle FCA PWA Redesign (Glassmorphism + Dynamic)
**Date**: 2026-03-18
**Theme**: Glassmorphism Dinámico

## 🎯 Objetivo
Transformar la interfaz funcional actual en una experiencia de usuario (UX) premium, dinámica y visualmente cautivadora para la aplicación de notificaciones Moodle de la FCA. Se solucionará la legibilidad de mensajes largos mediante un sistema de acordeones animados y se elevará la estética general con efectos de cristal y desenfoque.

---

## 🎨 Design Language (Glassmorphism)

### 1. Colores y Fondos
- **Fondo Base**: `#0D0D0D` (OLED Black).
- **Gradiente Dinámico**: Dos manchas radiales (`radial-gradient`) con `blur(120px)` y opacidad `0.15`. 
  - Superior Derecha: `fca-orange` (`#FF9F43`)
  - Inferior Izquierda: `fca-yellow` (`#FEDA12`)
- **Acento**: Gradiente lineal de Naranja a Amarillo para textos destacados e iconos clave.

### 2. Tarjetas de Cristal (`GlassCards`)
- **Cuerpo**: `bg-white/5` (Dark mode) con `will-change: backdrop-filter`.
- **Filtro**: `backdrop-blur-xl` (Optimizado para performance móvil).
- **Borde**: `1px solid rgba(255, 255, 255, 0.1)`.
- **Radio de Esquina**: `24px`.
- **Sombra**: `shadow-2xl shadow-black/40`.

### 3. Tipografía
- **Fuente**: `Outfit` (Sans-serif moderna).
- **H1/H2**: `font-black`, `tracking-tight`.
- **Body**: `font-medium`, `text-slate-200/90`.

---

## 🏗️ Navegación y Estructura

### Sección de Notificaciones (`Accordion List`)
- Cada notificación será un componente `<button>` o `<div>` con `role="button"`.
- **Accesibilidad**: `tabIndex={0}`, `aria-expanded={isOpen}`, `onKeyDown` para Enter/Space.
- **Componente**: `FramerMotion.AnimatePresence` + `motion.div`.
- **Comportamiento**:
  - Al tocar, la altura (`height`) se expande de `56px` a `auto`.
  - Icono de flecha rota `180deg`.
  - Animación: `transition={{ type: "spring", stiffness: 300, damping: 30 }}`.
  - El texto anteriormente truncado (`line-clamp-2`) fluye naturalmente con `whitespace-pre-wrap`.

### Iconografía y Micro-interacciones
- **Librería**: `lucide-react`.
- **Botones**: Efecto de presión física (`whileTap={{ scale: 0.96 }}`).
- **Scroll**: Suave con `overscroll-behavior-contain`.

---

## 🛠️ Stack Tecnológico
- **Frontend**: React 18.
- **Styling**: Tailwind CSS 3.4.
- **Library**: `framer-motion` (Animaciones core).
- **Icons**: `lucide-react`.

---

## ✅ Criterios de Éxito
1. El usuario puede leer el mensaje de notificación completo sin cortes.
2. La interfaz se siente "viva" y fluida en dispositivos móviles Android e iOS.
3. Se mantiene la consistencia con los colores institucionales (Naranja/Amarillo/Gris).
4. Score de Accesibilidad (Lighthouse) > 90.
5. Performance estable a 60fps durante animaciones de expansión.

---
*Diseño revisado y aprobado según feedback de auditoría el 2026-03-18.*
