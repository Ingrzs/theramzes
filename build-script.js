import fs from 'fs';
import path from 'path';

// --- Configuración ---
const outputDir = 'public';
// Lista de todos los archivos que deben formar parte del despliegue final.
const filesToDeploy = [
    'index.html',
    'index.css',
    'index.js',
    'admin.html',
    'admin.js'
];
// Archivos que necesitan que se les inyecte la clave de API.
const filesToUpdate = ['index.js', 'admin.html'];

// --- Script Principal ---
const apiKey = process.env.PUBLIC_FIREBASE_API_KEY;

if (!apiKey) {
    console.error('Error: La variable de entorno PUBLIC_FIREBASE_API_KEY no está definida.');
    process.exit(1);
}

console.log('Iniciando el proceso de build...');

try {
    const outputDirPath = path.join(process.cwd(), outputDir);
    
    // 1. Crear el directorio de salida si no existe.
    if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath);
        console.log(`Directorio de salida '${outputDir}' creado.`);
    }

    // 2. Procesar y copiar los archivos al directorio de salida.
    filesToDeploy.forEach(fileName => {
        const sourcePath = path.join(process.cwd(), fileName);
        const destPath = path.join(outputDirPath, fileName);

        console.log(`Procesando: ${fileName}...`);
        
        let fileContent = fs.readFileSync(sourcePath, 'utf8');

        // Verificar si este archivo necesita el reemplazo de la clave de API.
        if (filesToUpdate.includes(fileName)) {
            if (fileContent.includes('__FIREBASE_API_KEY__')) {
                fileContent = fileContent.replace(/__FIREBASE_API_KEY__/g, apiKey);
                console.log(`  -> Clave API inyectada en ${fileName}.`);
            } else {
                console.warn(`  -> Advertencia: El placeholder __FIREBASE_API_KEY__ no se encontró en ${fileName}.`);
            }
        }
        
        fs.writeFileSync(destPath, fileContent, 'utf8');
        console.log(`  -> Archivo copiado a ${destPath}`);
    });

    console.log('Proceso de build completado exitosamente.');

} catch (error) {
    console.error('Ha ocurrido un error durante el proceso de build:', error);
    process.exit(1);
}
