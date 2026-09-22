import { getDatabase } from "../database/db";

export type TipoPago = 'individual' | 'mensual';

export interface Pago {
    id?: number;
    billetera_id: number;
    nombre: string;
    monto: number;
    tipo: TipoPago;
    pagado?: number;
}

function mesActualClave(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export const getPagosByBilletera = async (billeteraId: number): Promise<Pago[]> => {
    const db = await getDatabase();
    const mesActual = `${mesActualClave()}%`;
    return db.getAllAsync<Pago>(
        `SELECT p.*, COALESCE(SUM(m.monto), 0) AS pagado
         FROM pago p
         LEFT JOIN movimientos_finan m
           ON m.pago_id = p.id
           AND (p.tipo != 'mensual' OR m.fecha_hora LIKE ?)
         WHERE p.billetera_id = ?
         GROUP BY p.id
         ORDER BY p.id`,
        [mesActual, billeteraId]
    );
};

export const createPago = async (pago: Pago): Promise<number> => {
    const db = await getDatabase();
    const result = await db.runAsync(
        `INSERT INTO pago (billetera_id, nombre, monto, tipo)
         VALUES (?, ?, ?, ?)`,
        [pago.billetera_id, pago.nombre, pago.monto, pago.tipo]
    );
    return result.lastInsertRowId;
};

export const deletePago = async (pagoId: number): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(`DELETE FROM pago WHERE id = ?`, [pagoId]);
};

export const pagarPago = async (pagoId: number, monto: number): Promise<void> => {
    const db = await getDatabase();
    await db.withExclusiveTransactionAsync(async (txn) => {
        const pago = await txn.getFirstAsync<{ billetera_id: number; nombre: string; monto: number; tipo: string }>(
            `SELECT billetera_id, nombre, monto, tipo FROM pago WHERE id = ?`,
            [pagoId]
        );
        if (!pago) {
            throw new Error('Pago inexistente');
        }
        if (pago.billetera_id === null || pago.billetera_id === undefined) {
            throw new Error('Pago sin cuenta vinculada');
        }

        const cuenta = await txn.getFirstAsync<{ id: number; monto: number }>(
            `SELECT id, monto FROM billetera WHERE id = ?`,
            [pago.billetera_id]
        );
        if (!cuenta) {
            throw new Error('Cuenta inexistente');
        }

        const mesActual = mesActualClave();
        const esMensual = pago.tipo === 'mensual';
        const params = esMensual ? [pagoId, `${mesActual}%`] : [pagoId];
        const suma = await txn.getFirstAsync<{ total: number }>(
            esMensual
                ? `SELECT COALESCE(SUM(m.monto), 0) AS total
                   FROM movimientos_finan m
                   WHERE m.pago_id = ? AND m.fecha_hora LIKE ?`
                : `SELECT COALESCE(SUM(m.monto), 0) AS total
                   FROM movimientos_finan m
                   WHERE m.pago_id = ?`,
            params
        );
        const pagado = suma?.total ?? 0;

        const restante = pago.monto - pagado;
        if (restante <= 0) {
            throw new Error('El pago ya está completo');
        }
        if (monto <= 0 || monto > restante) {
            throw new Error('El monto supera lo pendiente del pago');
        }
        if (cuenta.monto < monto) {
            throw new Error('Saldo insuficiente en la cuenta');
        }

        await txn.runAsync(
            `UPDATE billetera SET monto = monto - ? WHERE id = ?`,
            [monto, pago.billetera_id]
        );
        await txn.runAsync(
            `INSERT INTO movimientos_finan (billetera_id, pago_id, tipo, titulo, descripcion, monto, fecha_hora)
             VALUES (?, ?, 'egreso', ?, ?, ?, ?)`,
            [
                pago.billetera_id,
                pagoId,
                pago.nombre,
                pago.tipo === 'mensual' ? `Pago mensual vinculado: ${pago.nombre}` : `Pago único vinculado: ${pago.nombre}`,
                monto,
                new Date().toISOString(),
            ]
        );
    });
};