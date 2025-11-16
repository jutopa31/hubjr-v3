# Análisis UI/UX - Pase de Sala (Ward Patient)

**Fecha**: 2025-11-16
**Branch**: `claude/review-ward-pass-ui-01W28Rm32L8L1TEsaYX1eyWA`
**Propósito**: Análisis de responsividad móvil y mejoras de UX para implementación

---

## Resumen Ejecutivo

La implementación actual de "Pase de Sala" tiene una arquitectura funcional pero **NO es responsive para móvil**. Existen problemas críticos que hacen la aplicación **inutilizable en dispositivos móviles** (score 2/10 en responsividad).

---

## Archivos Involucrados

| Archivo | Propósito | Líneas |
|---------|-----------|--------|
| `src/modules/WardRounds.tsx` | Componente principal de pase de sala | 157 |
| `src/modules/ward/PatientDrawer.tsx` | Drawer lateral de detalle de paciente | 126 |
| `src/modules/ward/PatientFilters.tsx` | Barra de filtros y búsqueda | 42 |
| `src/modules/ward/PatientFormModal.tsx` | Modal para crear nuevo paciente | 50 |
| `src/components/DeletePatientModal.tsx` | Modal de confirmación de borrado | ~60 |

---

## PROBLEMAS CRÍTICOS (Prioridad ALTA)

### 1. PatientDrawer - Ancho Fijo No Responsive

**Ubicación**: `src/modules/ward/PatientDrawer.tsx:17`

```tsx
// PROBLEMA:
className="fixed top-0 right-0 h-full w-[560px] editor shadow-2xl..."
```

**Impacto**:
- En móviles (< 640px), el drawer ocupa más espacio que la pantalla
- Contenido cortado e inaccesible
- Usuario no puede cerrar el drawer
- **Severidad: CRÍTICA**

**Solución Recomendada**:
```tsx
className="fixed top-0 right-0 h-full w-full sm:w-[400px] md:w-[560px] editor shadow-2xl..."
```

**Cambios adicionales necesarios**:
- Agregar overlay/backdrop para cerrar con click fuera
- Agregar botón de cerrar visible en header (ya existe pero mejorar accesibilidad)

---

### 2. Tabla No Optimizada para Móvil

**Ubicación**: `src/modules/WardRounds.tsx:95-138`

```tsx
// PROBLEMA:
<div className="overflow-x-auto">
  <table className="table">
    <th className="w-[380px]">Pendientes</th>  // Muy ancho
    // ... 8 columnas totales
  </table>
</div>
```

**Impacto**:
- Scroll horizontal excesivo en móvil
- Difícil navegación con 8 columnas
- Edición inline de textarea casi imposible en móvil
- **Severidad: CRÍTICA**

**Solución Recomendada**:
```tsx
// Vista de tarjetas para móvil, tabla para desktop
<div className="hidden md:block">
  {/* Tabla actual */}
  <table>...</table>
</div>
<div className="md:hidden space-y-3">
  {data.rows.map(p => (
    <PatientCard
      key={p.id}
      patient={p}
      onSelect={() => { setSelected(p); setDrawerOpen(true) }}
      onDelete={() => askDeleteOrArchive(p)}
    />
  ))}
</div>
```

**Crear nuevo componente**: `src/modules/ward/PatientCard.tsx`

---

### 3. PatientFormModal - Grid No Responsive

**Ubicación**: `src/modules/ward/PatientFormModal.tsx:24`

```tsx
// PROBLEMA:
<div className="p-4 grid grid-cols-2 gap-3">
```

**Impacto**:
- Campos muy estrechos en móvil (50% de ~320px = ~160px)
- Difícil escribir en inputs pequeños
- **Severidad: ALTA**

**Solución Recomendada**:
```tsx
<div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
```

---

### 4. PatientFilters - Input Ancho Mínimo Grande

**Ubicación**: `src/modules/ward/PatientFilters.tsx:13`

```tsx
// PROBLEMA:
<input className="px-3 py-2 border rounded min-w-[240px]" ...>
```

**Impacto**:
- El input ocupa 240px mínimo, dejando poco espacio para otros filtros
- En móvil, fuerza scroll o campos apilados desordenados
- **Severidad: MEDIA**

**Solución Recomendada**:
```tsx
<input className="px-3 py-2 border rounded w-full sm:min-w-[240px] sm:w-auto" ...>

// Y para el contenedor:
<div className="card-body flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
```

---

## PROBLEMAS DE UX (Prioridad MEDIA)

### 5. Falta de Overlay en Drawer

**Ubicación**: `src/modules/ward/PatientDrawer.tsx`

**Problema**: No hay backdrop que indique que hay un modal abierto

**Solución**:
```tsx
export default function PatientDrawer({ open, onClose, ... }: Props) {
  if (!open) return null
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] md:w-[560px] z-50 ...">
        ...
      </div>
    </>
  )
}
```

---

### 6. Áreas Táctiles Insuficientes

**Ubicación**: Múltiples archivos

```tsx
// PROBLEMA - Botones muy pequeños:
<button className="px-2 py-1 border rounded">  // ~32px altura
<button className="px-2 py-1 border rounded"><Trash2 className="h-4 w-4"/></button>
```

**Impacto**:
- Apple recomienda mínimo 44px para touch targets
- Botones actuales son ~32px
- Difícil tocar con precisión en móvil

**Solución**:
```tsx
// Aumentar área táctil mínima
<button className="px-3 py-2 min-h-[44px] border rounded">
<button className="p-2.5 min-w-[44px] min-h-[44px] border rounded">
  <Trash2 className="h-5 w-5"/>
</button>
```

---

### 7. Falta de Feedback de Guardado

**Ubicación**: `src/modules/WardRounds.tsx:116-128`

```tsx
// PROBLEMA - Sin indicador visual:
onBlur={() => onSave(p.id!, { cama: p.cama })}
```

**Solución**:
```tsx
// Agregar estado de guardado
const [savingField, setSavingField] = useState<string | null>(null)

onBlur={async () => {
  setSavingField(`cama-${p.id}`)
  await onSave(p.id!, { cama: p.cama })
  setSavingField(null)
}}

// Mostrar indicador
{savingField === `cama-${p.id}` && (
  <span className="text-xs text-gray-500 animate-pulse">Guardando...</span>
)}
```

---

### 8. Diagnóstico Truncado Sin Tooltip

**Ubicación**: `src/modules/WardRounds.tsx:123`

```tsx
// PROBLEMA:
<td className="max-w-[280px] whitespace-nowrap overflow-hidden text-ellipsis">
  {p.diagnostico || '—'}
</td>
```

**Solución**:
```tsx
<td
  className="max-w-[280px] whitespace-nowrap overflow-hidden text-ellipsis"
  title={p.diagnostico || ''}
>
  {p.diagnostico || '—'}
</td>
```

---

## NUEVO COMPONENTE REQUERIDO

### PatientCard.tsx

```tsx
// src/modules/ward/PatientCard.tsx
import React from 'react'
import { Trash2 } from 'lucide-react'
import type { WardPatient } from '../../types/ward'

type Props = {
  patient: WardPatient
  onSelect: () => void
  onDelete: () => void
}

export default function PatientCard({ patient, onSelect, onDelete }: Props) {
  const severityClass = patient.severidad === 'IV'
    ? 'badge-red'
    : patient.severidad === 'III'
    ? 'badge-amber'
    : 'badge-gray'

  return (
    <div className="card">
      <div className="card-body p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1" onClick={onSelect}>
            <h4 className="font-semibold text-lg">{patient.nombre}</h4>
            <div className="text-sm text-gray-600 mt-1">
              DNI: {patient.dni} | Cama: {patient.cama} | Edad: {patient.edad}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${severityClass}`}>{patient.severidad}</span>
            <button
              className="p-2.5 min-w-[44px] min-h-[44px] border rounded"
              onClick={(e) => { e.stopPropagation(); onDelete() }}
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {patient.diagnostico && (
          <div className="mt-3">
            <div className="text-xs font-medium text-gray-500 uppercase">Diagnóstico</div>
            <div className="text-sm mt-1">{patient.diagnostico}</div>
          </div>
        )}

        {patient.pendientes && (
          <div className="mt-3">
            <div className="text-xs font-medium text-gray-500 uppercase">Pendientes</div>
            <div className="text-sm mt-1 whitespace-pre-line">{patient.pendientes}</div>
          </div>
        )}

        <button
          className="mt-4 w-full py-2 text-center border rounded btn-soft"
          onClick={onSelect}
        >
          Ver detalles
        </button>
      </div>
    </div>
  )
}
```

---

## CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Crítico (Bloquea uso móvil)
- [ ] **PatientDrawer**: Cambiar `w-[560px]` a `w-full sm:w-[400px] md:w-[560px]`
- [ ] **PatientDrawer**: Agregar overlay/backdrop
- [ ] **PatientFormModal**: Cambiar `grid-cols-2` a `grid-cols-1 sm:grid-cols-2`
- [ ] **Crear** `PatientCard.tsx` componente
- [ ] **WardRounds**: Implementar vista condicional tabla/cards

### Fase 2: Importante (Mejora UX significativa)
- [ ] **PatientFilters**: Hacer input de búsqueda full-width en móvil
- [ ] **Todos los botones**: Aumentar área táctil a mínimo 44px
- [ ] **Tabla**: Agregar `title` attribute para contenido truncado
- [ ] **Inline edit**: Agregar indicador de "Guardando..."

### Fase 3: Polish (Nice to have)
- [ ] Agregar transiciones suaves al drawer
- [ ] Implementar swipe-to-close en drawer móvil
- [ ] Agregar skeleton loading states
- [ ] Mejorar contraste y focus states para accesibilidad

---

## MÉTRICAS ACTUALES vs OBJETIVO

| Aspecto | Actual | Objetivo | Delta |
|---------|--------|----------|-------|
| Responsividad Móvil | 2/10 | 8/10 | +6 |
| Usabilidad Desktop | 7/10 | 9/10 | +2 |
| Accesibilidad | 4/10 | 7/10 | +3 |
| Feedback al Usuario | 5/10 | 8/10 | +3 |

---

## ESTIMACIÓN DE ESFUERZO

- **Fase 1 (Crítico)**: 4-6 horas de desarrollo
- **Fase 2 (Importante)**: 2-3 horas de desarrollo
- **Fase 3 (Polish)**: 2-4 horas de desarrollo
- **Testing en dispositivos reales**: 2 horas
- **Total estimado**: 10-15 horas

---

## NOTAS PARA EL IMPLEMENTADOR

1. **Priorizar Fase 1** - Sin estos cambios, la app es inutilizable en móvil
2. **Testear en Chrome DevTools** con diferentes viewports (375px, 414px, 768px)
3. **Mantener compatibilidad** con desktop - no romper funcionalidad existente
4. **Usar Tailwind breakpoints estándar**: sm:640px, md:768px, lg:1024px
5. **El drawer debe cubrir toda la pantalla en móvil** (w-full), no parcialmente

---

## REFERENCIAS

- Componente base: `src/modules/WardRounds.tsx`
- Tipos: `src/types/ward.ts`
- Servicios: `src/services/wardRounds.ts`
- Estilos globales: `src/index.css`

---

*Generado automáticamente por análisis de código. Para dudas contactar al equipo de desarrollo.*
