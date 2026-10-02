import type { Units } from '@/domain/types'

export const KG_PER_LB = 0.45359237
export const CM_PER_IN = 2.54

export const lbToKg = (lb: number) => lb * KG_PER_LB
export const kgToLb = (kg: number) => kg / KG_PER_LB
export const inToCm = (inch: number) => inch * CM_PER_IN
export const cmToIn = (cm: number) => cm / CM_PER_IN
export const ozToMl = (oz: number) => oz * 29.5735
export const mlToOz = (ml: number) => ml / 29.5735

export function formatWeight(kg: number, units: Units, digits = 1): string {
  return units === 'imperial' ? `${kgToLb(kg).toFixed(digits)} lb` : `${kg.toFixed(digits)} kg`
}

export function formatHeight(cm: number, units: Units): string {
  if (units === 'metric') return `${Math.round(cm)} cm`
  const totalIn = Math.round(cmToIn(cm))
  return `${Math.floor(totalIn / 12)}′${totalIn % 12}″`
}
