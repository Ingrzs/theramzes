import fs from 'fs';
import path from 'path';

// --- Contenido del archivo de configuración de Firebase ---
// Este contenido se generará usando las variables de entorno de Vercel.
const firebaseConfigContent = `
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
    apiKey: "${process.env.VITE_API_KEY}",
    authDomain: "${process.env.VITE_AUTH_DOMAIN}",
    projectId: "${process.env.VITE_PROJECT_ID}",
    storageBucket: "${process.env.VITE_STORAGE_BUCKET}",
    messagingSenderId: "${process.env.VITE_MESSAGING_SENDER_ID}",
    appId: "${process.env.VITE_APP_ID}",
    measurementId: "${process.env.VITE_MEASUREMENT_ID}"
};
`;

// --- Lógica del script de construcción ---

const publicDir = 'public';

// 1. Crear el directorio 'public' si no existe.
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
    console.log(`Directorio '${publicDir}' creado.`);
}

// 2. Escribir el archivo config.js dentro de 'public'.
fs.writeFileSync(path.join(publicDir, 'config.js'), firebaseConfigContent.trim());
console.log(`Archivo 'config.js' generado en '${publicDir}'.`);

// 3. Lista de archivos PÚBLICOS que se copiarán a la carpeta 'public'.
// IMPORTANTE: 'admin.html' y 'admin.js' NO están en esta lista para mantenerlos privados.
const publicFiles = [
    'index.html',
    'index.css',
    'index.js'
];

// 4. Copiar cada archivo público al directorio 'public'.
publicFiles.forEach(file => {
    const sourcePath = file;
    const destPath = path.join(publicDir, file);
    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copiado '${sourcePath}' a '${destPath}'.`);
    } else {
        console.warn(`ADVERTENCIA: El archivo '${sourcePath}' no fue encontrado y no se copió.`);
    }
});

console.log('¡Construcción completada! Los archivos públicos están listos en la carpeta \'public\'.');
