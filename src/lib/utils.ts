import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export function isSameMonth(date1: Date, date2: Date) {
  return date1.getFullYear() === date2.getFullYear() && date1.getMonth() === date2.getMonth();
}

export function isSameDay(date1: Date, date2: Date) {
  return date1.getFullYear() === date2.getFullYear() && 
         date1.getMonth() === date2.getMonth() && 
         date1.getDate() === date2.getDate();
}

export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
