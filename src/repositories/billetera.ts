import {getDatabase} from "../database/db";

export const DIVISAS = ['BOB', 'USD', 'EUR', 'ARS', 'PEN', 'MXN', 'CLP', 'VES'] as const;

export type Divisa = (typeof DIVISAS)[number];

export interface Billetera
{
    id?: number;
    nombre: string; 
    entidad: string;
    monto: number;
    divisa: string;
    ci_usuario?: string | null;
}

export const createBilletera = async (billetera: Billetera): Promise<number> => {
    const db = await getDatabase();
    const result = await db.runAsync(
        `INSERT INTO billetera (nombre, entidad, monto, divisa, ci_usuario) 
         VALUES (?, ?, ?, ?, ?)`,
        [
            billetera.nombre, 
            billetera.entidad, 
            billetera.monto, 
            billetera.divisa, 
            billetera.ci_usuario ?? null
        ]
    );
    return result.lastInsertRowId;
};

export const getBilleteras = async (): Promise<Billetera[]> => {
    const db = await getDatabase();
    const result = await db.getAllAsync<Billetera>(
        `SELECT * FROM billetera order by id`
    );
    return result;
};

const UPDATEABLE: { col: string; field: keyof Pick<Billetera, 'nombre' | 'entidad' | 'divisa'> }[] = [
    { col: 'nombre', field: 'nombre' },
    { col: 'entidad', field: 'entidad' },
    { col: 'divisa', field: 'divisa' },
];

export const updateBilletera = async (
    id: number,
    changes: Partial<Pick<Billetera, 'nombre' | 'entidad' | 'divisa'>>,
): Promise<void> => {
    const db = await getDatabase();
    const set: { col: string; val: string | number | null }[] = [];
    for (const u of UPDATEABLE) {
        if (changes[u.field] !== undefined) {
            set.push({ col: u.col, val: changes[u.field] ?? null });
        }
    }
    if (set.length === 0) return;

    const clause = set.map((s) => `${s.col} = ?`).join(', ');
    await db.runAsync(
        `UPDATE billetera SET ${clause} WHERE id = ?`,
        [...set.map((s) => s.val), id]
    );
};