import {getDatabase} from "../database/db";

export type TipoMovimiento = 'ingreso' | 'egreso' | 'transferencia';

export interface Movimiento {
    id?: number;
    billetera_id: number;
    billetera_destino_id?: number | null;
    pago_id?: number | null;
    tipo: TipoMovimiento;
    titulo: string;
    descripcion?: string | null;
    monto: number;
    fecha_hora: string;
}

export const getMovimientosByBilletera = async (billeteraId: number): Promise<Movimiento[]> => {
    const db = await getDatabase();
    return db.getAllAsync<Movimiento>(
        `SELECT * FROM movimientos_finan
         WHERE billetera_id = ? OR billetera_destino_id = ?
         ORDER BY fecha_hora DESC, id DESC`,
        [billeteraId, billeteraId]
    );
};

export function signoMovimiento(m: Movimiento, cuentaId: number): number {
    if (m.tipo === 'ingreso') return 1;
    if (m.tipo === 'egreso') return -1;
    return m.billetera_destino_id === cuentaId ? 1 : -1;
}

export const registrarMovimiento = async (m: {
    billetera_id: number;
    tipo: 'ingreso' | 'egreso';
    titulo: string;
    descripcion?: string | null;
    monto: number;
}): Promise<void> => {
    const db = await getDatabase();
    await db.withExclusiveTransactionAsync(async (txn) => {
        const delta = m.tipo === 'ingreso' ? m.monto : -m.monto;
        await txn.runAsync(
            `UPDATE billetera SET monto = monto + ? WHERE id = ?`,
            [delta, m.billetera_id]
        );
        await txn.runAsync(
            `INSERT INTO movimientos_finan (billetera_id, tipo, titulo, descripcion, monto, fecha_hora)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [m.billetera_id, m.tipo, m.titulo, m.descripcion ?? null, m.monto, new Date().toISOString()]
        );
    });
};

export const transferir = async (m: {
    billetera_origen_id: number;
    billetera_destino_id: number;
    titulo: string;
    monto: number;
}): Promise<void> => {
    const db = await getDatabase();
    await db.withExclusiveTransactionAsync(async (txn) => {
        const origen = await txn.getFirstAsync<{ divisa: string; monto: number }>(
            `SELECT divisa, monto FROM billetera WHERE id = ?`,
            [m.billetera_origen_id]
        );
        const destino = await txn.getFirstAsync<{ divisa: string }>(
            `SELECT divisa FROM billetera WHERE id = ?`,
            [m.billetera_destino_id]
        );

        if (!origen || !destino) {
            throw new Error('Cuenta de origen o destino inexistente');
        }
        if (origen.divisa !== destino.divisa) {
            throw new Error('Las cuentas deben tener la misma divisa');
        }
        if (origen.monto < m.monto) {
            throw new Error('Saldo insuficiente en la cuenta de origen');
        }

        await txn.runAsync(
            `UPDATE billetera SET monto = monto - ? WHERE id = ?`,
            [m.monto, m.billetera_origen_id]
        );
        await txn.runAsync(
            `UPDATE billetera SET monto = monto + ? WHERE id = ?`,
            [m.monto, m.billetera_destino_id]
        );
        await txn.runAsync(
            `INSERT INTO movimientos_finan (billetera_id, billetera_destino_id, tipo, titulo, monto, fecha_hora)
             VALUES (?, ?, 'transferencia', ?, ?, ?)`,
            [m.billetera_origen_id, m.billetera_destino_id, m.titulo, m.monto, new Date().toISOString()]
        );
    });
};