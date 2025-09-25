import fs from 'fs';
import path from 'path';

// Este script se ejecuta durante el proceso de build en Vercel
console.log('Generating Firebase config file...');

// Construye el objeto de configuración de Firebase desde las variables de entorno
const firebaseConfig = {
  apiKey: process.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Verifica si todas las variables requeridas están presentes
const missingVars = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error('Error: Faltan las siguientes variables de entorno de Firebase:', missingVars.join(', '));
  // Sale con un código de error para fallar el build
  process.exit(1);
}

// Crea el contenido del archivo config.js
const configContent = `// Este archivo es generado automáticamente por generate-config.mjs durante el build.
// No lo edites manualmente, tus cambios serán sobreescritos.
export const firebaseConfig = ${JSON.stringify(firebaseConfig, null, 4)};
`;

// Define la ruta donde se creará el archivo config.js
const configPath = path.join(process.cwd(), 'config.js');

// Escribe el contenido en config.js
try {
  fs.writeFileSync(configPath, configContent);
  console.log('✅ El archivo config.js se ha generado correctamente.');
} catch (error) {
  console.error('Error al escribir el archivo config.js:', error);
  process.exit(1);
}
