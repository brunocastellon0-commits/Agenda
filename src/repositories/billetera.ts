import {getDatabase} from "../database/db";


export interface Billetera
{
    id?: number;
    nombre: string; 
    entidad: string;
    monto: number;
    divisa: string;
    ci_usuario?: string;
}

export const createBilletera = async (billetera: Billetera): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
        `INSERT INTO billetera (nombre, entidad, monto, divisa, ci_usuario) 
         VALUES (?, ?, ?, ?, ?)`,
        [
            billetera.nombre, 
            billetera.entidad, 
            billetera.monto, 
            billetera.divisa, 
            String(billetera.ci_usuario)
        ]
    );
};

export const getBilleteras = async (): Promise<Billetera[]> => {
    const db = await getDatabase();
    const result = await db.getAllAsync<Billetera>(
        `SELECT * FROM billetera order by id`
    );
    return result;
};
