# Teaching Assistant — Design System

## Overview

The design system is built on Tailwind CSS v4 with custom tokens defined in `globals.css`.
The primary brand color is blue (`#2563EB`) matching the existing mobile app identity.

---

## Color Tokens

All colors are available as Tailwind utility classes via `--color-*` CSS variables.

| Token           | Class                         | Hex       | Use When                                      |
| --------------- | ----------------------------- | --------- | --------------------------------------------- |
| `primary`       | `bg-primary` / `text-primary` | `#2563EB` | Primary actions, links, active states         |
| `primary-dark`  | `bg-primary-dark`             | `#1D4ED8` | Hover state for primary                       |
| `primary-light` | `bg-primary-light`            | `#EFF6FF` | Primary tinted backgrounds                    |
| `success`       | `bg-success` / `text-success` | `#16A34A` | Present, approved, positive states            |
| `success-light` | `bg-success-light`            | `#F0FDF4` | Success badge backgrounds                     |
| `warning`       | `bg-warning` / `text-warning` | `#D97706` | Amber attendance status, partial states       |
| `danger`        | `bg-danger` / `text-danger`   | `#DC2626` | Errors, absent, rejected, destructive actions |
| `muted`         | `text-muted`                  | `#6B7280` | Secondary text, placeholders                  |
| `border`        | `border-border`               | `#E5E7EB` | All element borders                           |
| `background`    | `bg-background`               | `#F9FAFB` | Page background                               |
| `surface`       | `bg-surface`                  | `#FFFFFF` | Card & panel backgrounds                      |

---

## Typography

Font: **Inter** (loaded via `next/font/google`, variable: `--font-inter`)

| Role            | Classes                 | Example                |
| --------------- | ----------------------- | ---------------------- |
| Page title      | `text-2xl font-bold`    | "My Subjects"          |
| Section heading | `text-xl font-semibold` | "Upcoming Sessions"    |
| Card title      | `text-lg font-semibold` | "Software Engineering" |
| Body text       | `text-base font-normal` | Paragraph content      |
| Secondary       | `text-sm text-muted`    | Timestamps, metadata   |
| Caption / Badge | `text-xs`               | Status badges, labels  |

---

## Spacing Philosophy

- Use multiples of 4px (Tailwind's default spacing scale)
- Component padding: `p-4` (16px) for cards, `p-3` (12px) for compact elements
- Gap between elements: `gap-4` (16px) standard, `gap-2` (8px) tight
- Page margins: `px-4 py-6` on mobile, `px-8 py-8` on desktop

---

## Border Radius

| Token          | Size   | Use                     |
| -------------- | ------ | ----------------------- |
| `rounded-sm`   | 4px    | Badges, chips           |
| `rounded-md`   | 6px    | Inputs, buttons         |
| `rounded-lg`   | 8px    | Cards, panels           |
| `rounded-xl`   | 12px   | Modals                  |
| `rounded-2xl`  | 16px   | Feature panels          |
| `rounded-full` | 9999px | Avatars, indicator dots |

---

## Shadows

| Token       | Use                       |
| ----------- | ------------------------- |
| `shadow-xs` | Subtle card border effect |
| `shadow-sm` | Standard card elevation   |
| `shadow-md` | Modals, popovers          |
| `shadow-lg` | Dropdowns                 |

---

## Component Composition Rules

1. **Cards** always use `bg-surface rounded-lg border border-border shadow-sm`
2. **Buttons** always use matching hover states (see button.tsx)
3. **Error states** always use `text-danger` for text and `border-danger` for inputs
4. **Loading states** use `Skeleton` components with consistent sizing
5. **Empty states** are centered, use `EmptyState` component
6. **Forms** use `FormField` wrapper for label + input + error message grouping

---

## Animations

| Class               | Duration   | Use                        |
| ------------------- | ---------- | -------------------------- |
| `animate-fade-in`   | 150ms      | Panel reveals, modal opens |
| `animate-slide-in`  | 200ms      | Sidebar, sheet panels      |
| `animate-slide-out` | 200ms      | Dismissal animations       |
| `animate-pulse`     | continuous | Skeleton loading           |
