import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Security } from '../API'
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const getIdFromSecurity = (sec: Security | undefined) => (sec?.ticker_symbol ?? '') + ' ' + (sec?.name ?? '')
