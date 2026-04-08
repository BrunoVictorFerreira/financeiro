export function parseAmountToWidth(value: number, totalValue: number): number | null {
    const valor = value / 100;
    const tValue = totalValue / 100;
    const base = 310;
    const porcentageValues = (valor / tValue) * 100;
    const percWithBase = (porcentageValues * base) / 100;
    console.log('percWithBase', percWithBase);
    return percWithBase;
}

export function parseAmountToPerc(value: number, totalValue: number): number | null {
    const valor = value / 100;
    const tValue = totalValue / 100;
    const porcentageValues = (valor / tValue) * 100;
    const round = Math.round(porcentageValues);
    console.log('round', round);
    return round;
}