import {getDatabase} from "../database/db";

export interface Usuario{
    ci?: string;
    nombre: string;
    apellido: string;
    peso: number;
    altura: number;
    cintura: number;
    cuello: number;
    edad: number;
    fecha_nacimiento?: string;
    avatarUrl: string;
}

export const saveOrUpdateUsuario = async (usuario: Usuario): Promise<void> => {
    const db = await getDatabase();
    await db.runAsync(
        `INSERT OR REPLACE INTO usuario (ci, nombre, apellido, peso, altura, cintura, cuello, edad, fecha_nacimiento, avatarUrl) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            String(usuario.ci), 
            usuario.nombre, 
            usuario.apellido, 
            usuario.peso, 
            usuario.altura, 
            usuario.cintura, 
            usuario.cuello, 
            usuario.edad,
            usuario.fecha_nacimiento || null,
            usuario.avatarUrl
        ]
    );
};

export const getUsuarios = async (): Promise<Usuario[]> => {
    const db = await getDatabase();
    const result = await db.getAllAsync<Usuario>(
        `SELECT * FROM usuario ORDER BY ci`
    );
    return result;
};
