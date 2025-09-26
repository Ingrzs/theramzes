import fs from 'fs';
import path from 'path';

// --- PASO 1: GENERAR EL ARCHIVO DE CONFIGURACIÓN ---

console.log('Iniciando el script de construcción...');
console.log('Paso 1: Generando el archivo de configuración de Firebase...');

const firebaseConfig = {
  apiKey: process.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const missingVars = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Error: Faltan las siguientes variables de entorno de Firebase:', missingVars.join(', '));
  process.exit(1);
}

const configContent = `// Este archivo es generado automáticamente durante el build.
export const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 4)};
`;

console.log('✅ Configuración de Firebase generada en memoria.');

// --- PASO 2: PREPARAR EL DIRECTORIO DE SALIDA 'public' ---

try {
    console.log("Paso 2: Creando el directorio de salida 'public'...");

    // Define la ruta del directorio 'public'
    const publicDir = path.join(process.cwd(), 'public');
    // Define la ruta para el config.js DENTRO de 'public'
    const configPath = path.join(publicDir, 'config.js');
    
    // Crea la carpeta 'public' si no existe
    if (!fs.existsSync(publicDir)){
        fs.mkdirSync(publicDir);
        console.log("✅ Directorio 'public' creado.");
    } else {
        console.log("ℹ️ El directorio 'public' ya existe.");
    }

    // Escribe el archivo config.js dentro de 'public'
    fs.writeFileSync(configPath, configContent);
    console.log(`✅ Archivo config.js escrito en ${configPath}`);

    // Lista de archivos que deben estar en la carpeta 'public'
    const filesToCopy = ['index.html', 'index.css', 'index.js', 'package.json', 'metadata.json'];

    console.log('Copiando archivos al directorio public...');
    filesToCopy.forEach(fileName => {
        const sourcePath = path.join(process.cwd(), fileName);
        const destPath = path.join(publicDir, fileName);
        if (fs.existsSync(sourcePath)) {
            fs.copyFileSync(sourcePath, destPath);
            console.log(`  - Copiado: ${fileName}`);
        } else {
            console.warn(`  - Advertencia: El archivo ${fileName} no se encontró y no fue copiado.`);
        }
    });

    console.log('✅ Todos los archivos necesarios han sido copiados a public.');
    console.log('🚀 Proceso de construcción finalizado con éxito.');

} catch (error) {
    console.error('Error durante la preparación del directorio de salida:', error);
    process.exit(1);
}
