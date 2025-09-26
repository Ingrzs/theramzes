import fs from 'fs';
import path from 'path';

const apiKey = process.env.PUBLIC_FIREBASE_API_KEY;

if (!apiKey) {
    console.error('Error: La variable de entorno PUBLIC_FIREBASE_API_KEY no está definida.');
    process.exit(1); // Salir con un código de error
}

console.log('Iniciando el proceso de build...');
const filesToUpdate = ['index.js', 'admin.html'];

filesToUpdate.forEach(fileName => {
    // Usamos process.cwd() para obtener la ruta base del proyecto en Vercel
    const filePath = path.join(process.cwd(), fileName);
    try {
        let fileContent = fs.readFileSync(filePath, 'utf8');
        console.log(`Leyendo archivo: ${fileName}`);
        
        if (fileContent.includes('__FIREBASE_API_KEY__')) {
            // Usamos una expresión regular con el flag 'g' para reemplazar todas las ocurrencias
            fileContent = fileContent.replace(/__FIREBASE_API_KEY__/g, apiKey);
            fs.writeFileSync(filePath, fileContent, 'utf8');
            console.log(`Clave API inyectada correctamente en ${fileName}.`);
        } else {
            // Esto no es un error fatal, solo una advertencia
            console.warn(`Advertencia: El placeholder __FIREBASE_API_KEY__ no se encontró en ${fileName}.`);
        }
    } catch (error) {
        console.error(`Error procesando el archivo ${fileName}:`, error);
        process.exit(1); // Salir con un código de error si algo falla
    }
});

console.log('Proceso de build completado exitosamente.');
