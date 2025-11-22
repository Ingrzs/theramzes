import fs from 'fs';
import path from 'path';

// --- Configuración ---
const outputDir = 'public';
// Lista de todos los archivos que deben formar parte del despliegue final.
const filesToDeploy = [
    'index.html',
    'videos.html',
    'descargas.html',
    'generador.html',
    'tutoriales.html',
    'recursos.html',
    'sobre-mi.html',
    'contacto.html',
    'politicas.html',
    'terminos.html',
    'index.css',
    'index.js',
    'admin.html',
    'admin.js',
    'sitemap.xml',
    'ads.txt'
];
// Archivos que necesitan que se les inyecte claves o contraseñas.
const filesToUpdate = ['index.js', 'admin.html', 'admin.js'];

// --- Script Principal ---
const apiKey = process.env.PUBLIC_FIREBASE_API_KEY;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!apiKey || !adminPassword) {
    console.error('Error: Faltan las variables de entorno PUBLIC_FIREBASE_API_KEY y/o ADMIN_PASSWORD.');
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

        if (!fs.existsSync(sourcePath)) {
            console.warn(`  -> Advertencia: El archivo fuente ${sourcePath} no existe. Se omitirá.`);
            return;
        }

        console.log(`Procesando: ${fileName}...`);
        
        let fileContent = fs.readFileSync(sourcePath, 'utf8');

        // Verificar si este archivo necesita el reemplazo de placeholders.
        if (filesToUpdate.includes(fileName)) {
            // Inyectar clave de API de Firebase
            if (fileContent.includes('__FIREBASE_API_KEY__')) {
                fileContent = fileContent.replace(/__FIREBASE_API_KEY__/g, apiKey);
                console.log(`  -> Clave API inyectada en ${fileName}.`);
            }
            
            // Inyectar contraseña del panel de admin
            if (fileContent.includes('__ADMIN_PASSWORD__')) {
                fileContent = fileContent.replace(/__ADMIN_PASSWORD__/g, adminPassword);
                console.log(`  -> Contraseña de admin inyectada en ${fileName}.`);
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
