interface TaxBracket {
    rate: number
    threshold: number
}

const federalBrackets: TaxBracket[] = [
    { rate: 0.15, threshold: 53359 },
    { rate: 0.205, threshold: 106717 },
    { rate: 0.26, threshold: 165430 },
    { rate: 0.29, threshold: 235675 },
    { rate: 0.33, threshold: Infinity },
]

const provincialBrackets: Record<string, TaxBracket[]> = {
    Ontario: [
        { rate: 0.0505, threshold: 47630 },
        { rate: 0.0915, threshold: 95259 },
        { rate: 0.1116, threshold: 150000 },
        { rate: 0.1216, threshold: 220000 },
        { rate: 0.1316, threshold: Infinity },
    ],
    'British Columbia': [
        { rate: 0.0506, threshold: 45142 },
        { rate: 0.077, threshold: 90287 },
        { rate: 0.105, threshold: 104835 },
        { rate: 0.1229, threshold: 127299 },
        { rate: 0.147, threshold: 172602 },
        { rate: 0.168, threshold: Infinity },
    ],
    Alberta: [
        { rate: 0.1, threshold: 131220 },
        { rate: 0.12, threshold: 157464 },
        { rate: 0.13, threshold: 209952 },
        { rate: 0.14, threshold: 314928 },
        { rate: 0.15, threshold: Infinity },
    ],
    Quebec: [
        { rate: 0.15, threshold: 49275 },
        { rate: 0.2, threshold: 98540 },
        { rate: 0.24, threshold: 119910 },
        { rate: 0.2575, threshold: Infinity },
    ],
    'Nova Scotia': [
        { rate: 0.0879, threshold: 29590 },
        { rate: 0.1495, threshold: 59180 },
        { rate: 0.1667, threshold: 93000 },
        { rate: 0.175, threshold: 150000 },
        { rate: 0.21, threshold: Infinity },
    ],
    'New Brunswick': [
        { rate: 0.094, threshold: 46778 },
        { rate: 0.1482, threshold: 93556 },
        { rate: 0.1652, threshold: 115865 },
        { rate: 0.1784, threshold: 157693 },
        { rate: 0.203, threshold: Infinity },
    ],
    Manitoba: [
        { rate: 0.108, threshold: 36142 },
        { rate: 0.1275, threshold: 77899 },
        { rate: 0.174, threshold: Infinity },
    ],
    Saskatchewan: [
        { rate: 0.105, threshold: 47630 },
        { rate: 0.125, threshold: 136270 },
        { rate: 0.145, threshold: Infinity },
    ],
    'Prince Edward Island': [
        { rate: 0.098, threshold: 31984 },
        { rate: 0.138, threshold: 63969 },
        { rate: 0.167, threshold: Infinity },
    ],
    'Newfoundland and Labrador': [
        { rate: 0.087, threshold: 41457 },
        { rate: 0.145, threshold: 82913 },
        { rate: 0.158, threshold: 148027 },
        { rate: 0.173, threshold: 207239 },
        { rate: 0.183, threshold: Infinity },
    ],
    'Northwest Territories': [
        { rate: 0.059, threshold: 46226 },
        { rate: 0.086, threshold: 92454 },
        { rate: 0.122, threshold: 150000 },
        { rate: 0.1405, threshold: Infinity },
    ],
    Yukon: [
        { rate: 0.064, threshold: 53359 },
        { rate: 0.09, threshold: 106717 },
        { rate: 0.109, threshold: 165430 },
        { rate: 0.128, threshold: 500000 },
        { rate: 0.15, threshold: Infinity },
    ],
    Nunavut: [
        { rate: 0.04, threshold: 50000 },
        { rate: 0.07, threshold: 100000 },
        { rate: 0.09, threshold: 155625 },
        { rate: 0.115, threshold: Infinity },
    ],
}

function calculateTax(income: number, brackets: TaxBracket[]): number {
    let tax = 0
    let previousThreshold = 0

    for (const { rate, threshold } of brackets) {
        if (income <= threshold) {
            tax += (income - previousThreshold) * rate
            break
        } else {
            tax += (threshold - previousThreshold) * rate
            previousThreshold = threshold
        }
    }

    return tax
}

export function calculateAverageTaxRate(income: number, province: keyof typeof provincialBrackets): number {
    // Calculate federal and provincial taxes
    const federalTax = calculateTax(income, federalBrackets)
    const provincialTax = calculateTax(income, provincialBrackets[province])

    // Total tax paid
    const totalTax = federalTax + provincialTax

    // Calculate the average tax rate
    return income ? (totalTax / income) * 100 : 0
}

export type AccountType = 'TFSA' | 'RRSP' | 'FHSA' | 'Unknown'

export function identifyAccountType(accountName: string): AccountType {
    const name = accountName.toLowerCase() // Convert to lowercase for case-insensitive matching

    if (name.includes('tfsa')) {
        return 'TFSA'
    } else if (name.includes('rrsp') || name.includes('rsp')) {
        return 'RRSP'
    } else if (name.includes('fhsa') || name.includes('hsa')) {
        return 'FHSA'
    } else {
        return 'Unknown'
    }
}
