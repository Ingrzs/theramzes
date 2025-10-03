// Ya no se usan 'import' porque las librerías se cargan en admin.html
// Las variables firebase, React, ReactDOM y firebaseConfig ahora existen globalmente.

const { useState, useEffect, Fragment } = React;

// --- INICIO: Lógica de Autenticación ---

// La contraseña se inyecta aquí desde el build script. NO la escribas directamente.
const ADMIN_PASSWORD = "__ADMIN_PASSWORD__";

const AdminAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Primero, revisamos si el usuario ya se autenticó en esta sesión.
        if (sessionStorage.getItem('adminAuthenticated') === 'true') {
            setIsAuthenticated(true);
            return;
        }

        // Si no, pedimos la contraseña.
        const enteredPassword = prompt('Por favor, introduce la contraseña de administrador:');
        
        if (enteredPassword === ADMIN_PASSWORD) {
            // Si la contraseña es correcta, lo guardamos en la sesión y mostramos el panel.
            sessionStorage.setItem('adminAuthenticated', 'true');
            setIsAuthenticated(true);
        } else {
            // Si es incorrecta, mostramos un mensaje de error.
            if (enteredPassword !== null) { // Evitar alerta si el usuario cancela
                 alert('Contraseña incorrecta. Acceso denegado.');
            }
        }
    }, []); // Se ejecuta solo una vez al cargar el componente.

    if (!isAuthenticated) {
        // Mientras no esté autenticado, mostramos una pantalla de bloqueo.
        return React.createElement('div', { 
            className: 'contact-container', 
            style: { textAlign: 'center', marginTop: '5rem', maxWidth: '500px' } 
        }, [
            React.createElement('h2', {key: 'title'}, 'Acceso Restringido'),
            React.createElement('p', {key: 'message', style: {color: 'var(--text-secondary)'}}, 'Necesitas la contraseña correcta para acceder al panel de administrador.')
        ]);
    }

    // Si la autenticación es exitosa, renderizamos el panel de admin.
    return React.createElement(AdminPanel);
};
// --- FIN: Lógica de Autenticación ---


// La configuración de Firebase ahora se carga desde config.js en admin.html
// Esto asegura que la configuración esté centralizada.

// Initialize Firebase
let db;
try {
    // La variable 'firebaseConfig' viene del archivo 'config.js'
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log('Firebase (compat) inicializado para el panel de Admin');
} catch (error) {
    console.error('Error inicializando Firebase:', error);
}

// --- Componente para añadir contenido ---
const AddContentForm = () => {
    const [formData, setFormData] = useState({
        title: '', category: 'imagenes', imageUrl: '', prompt: '',
        description: '', downloadUrl: '', linkUrl: '', disclaimer: '', details: ''
    });
    const [status, setStatus] = useState({ message: '', type: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!db) {
            setStatus({ message: 'Error: La base de datos no está conectada.', type: 'error' });
            return;
        }
        setStatus({ message: 'Guardando entrada...', type: 'loading' });

        try {
            const dataToSave = {
                title: formData.title,
                category: formData.category,
                imageUrl: formData.imageUrl,
                details: formData.details, // Guardar siempre los detalles
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (['imagenes', 'videos'].includes(formData.category)) dataToSave.prompt = formData.prompt;
            if (['descargas', 'tutoriales', 'recomendaciones', 'afiliados'].includes(formData.category)) dataToSave.description = formData.description;
            if (formData.category === 'descargas') dataToSave.downloadUrl = formData.downloadUrl;
            if (['tutoriales', 'recomendaciones', 'afiliados'].includes(formData.category)) dataToSave.linkUrl = formData.linkUrl;
            if (formData.category === 'afiliados') dataToSave.disclaimer = formData.disclaimer;
            
            await db.collection("content").add(dataToSave);
            setStatus({ message: '¡Entrada guardada con éxito!', type: 'success' });
            setFormData({
                title: '', category: 'imagenes', imageUrl: '', prompt: '',
                description: '', downloadUrl: '', linkUrl: '', disclaimer: '', details: ''
            });
            setTimeout(() => setStatus({ message: '', type: '' }), 3000);
        } catch (error) {
            setStatus({ message: `Error al guardar: ${error.message}`, type: 'error' });
        }
    };
    
    const renderConditionalFields = () => {
        const { category } = formData;
        const fields = [];
        if (['imagenes', 'videos'].includes(category)) {
            fields.push(React.createElement('div', { key: 'prompt-group', className: 'form-group' }, [
                React.createElement('label', { htmlFor: 'prompt' }, 'Prompt'),
                React.createElement('textarea', { id: 'prompt', name: 'prompt', value: formData.prompt, onChange: handleChange, rows: 4, required: true })
            ]));
        }
        if (['descargas', 'tutoriales', 'recomendaciones', 'afiliados'].includes(category)) {
             fields.push(React.createElement('div', { key: 'desc-group', className: 'form-group' }, [
                React.createElement('label', { htmlFor: 'description' }, 'Descripción Breve (para la tarjeta)'),
                React.createElement('textarea', { id: 'description', name: 'description', value: formData.description, onChange: handleChange, rows: 3, required: true })
            ]));
        }
        if (category === 'descargas') {
             fields.push(React.createElement('div', { key: 'download-group', className: 'form-group' }, [
                React.createElement('label', { htmlFor: 'downloadUrl' }, 'URL de Descarga'),
                React.createElement('input', { type: 'url', id: 'downloadUrl', name: 'downloadUrl', value: formData.downloadUrl, onChange: handleChange, required: true })
            ]));
        }
        if (['tutoriales', 'recomendaciones', 'afiliados'].includes(category)) {
             fields.push(React.createElement('div', { key: 'link-group', className: 'form-group' }, [
                React.createElement('label', { htmlFor: 'linkUrl' }, 'URL del Enlace (Sitio web)'),
                React.createElement('input', { type: 'url', id: 'linkUrl', name: 'linkUrl', value: formData.linkUrl, onChange: handleChange, required: true })
            ]));
        }
        if (category === 'afiliados') {
             fields.push(React.createElement('div', { key: 'disclaimer-group', className: 'form-group' }, [
                React.createElement('label', { htmlFor: 'disclaimer' }, 'Aviso Legal (Disclaimer) del Producto'),
                React.createElement('textarea', { id: 'disclaimer', name: 'disclaimer', value: formData.disclaimer, onChange: handleChange, rows: 2, placeholder: 'Ej: Como afiliado, gano por compras elegibles.' })
            ]));
        }
        return fields;
    };
    
    const renderStatusMessage = () => {
        if (!status.message) return null;
        const className = `status-message ${status.type}`;
        return React.createElement('div', { className }, status.message);
    };

    return React.createElement('div', { className: 'contact-container', style: { maxWidth: '800px' } }, [
        React.createElement('h2', { key: 'title', style: { textAlign: 'center' } }, 'Añadir Contenido a la Web'),
        React.createElement('form', { key: 'form', onSubmit: handleSubmit, className: 'contact-form' }, [
            React.createElement('div', { key: 'title-group', className: 'form-group' }, [
                React.createElement('label', { htmlFor: 'title' }, 'Título'),
                React.createElement('input', { type: 'text', id: 'title', name: 'title', value: formData.title, onChange: handleChange, required: true })
            ]),
            React.createElement('div', { key: 'category-group', className: 'form-group' }, [
                React.createElement('label', { htmlFor: 'category' }, 'Categoría'),
                React.createElement('select', { id: 'category', name: 'category', value: formData.category, onChange: handleChange, required: true }, [
                    React.createElement('option', { value: 'imagenes' }, 'Imágenes'),
                    React.createElement('option', { value: 'videos' }, 'Videos'),
                    React.createElement('option', { value: 'descargas' }, 'Descargas'),
                    React.createElement('option', { value: 'tutoriales' }, 'Tutoriales'),
                    React.createElement('option', { value: 'afiliados' }, 'Recursos - Producto Afiliado'),
                    React.createElement('option', { value: 'recomendaciones' }, 'Recursos - Software/Web')
                ])
            ]),
            React.createElement('div', { key: 'imageUrl-group', className: 'form-group' }, [
                React.createElement('label', { htmlFor: 'imageUrl' }, 'URL de la Imagen (Preview)'),
                React.createElement('input', { type: 'url', id: 'imageUrl', name: 'imageUrl', value: formData.imageUrl, onChange: handleChange, required: true, placeholder: 'https://ejemplo.com/imagen.jpg' })
            ]),
            ...renderConditionalFields(),
             React.createElement('div', { key: 'details-group', className: 'form-group' }, [
                React.createElement('label', { htmlFor: 'details' }, 'Detalles Adicionales (para la vista ampliada)'),
                React.createElement('textarea', { 
                    id: 'details', 
                    name: 'details', 
                    value: formData.details, 
                    onChange: handleChange, 
                    rows: 6,
                    placeholder: 'Explica cómo usar el prompt, en qué plataforma, da consejos, o añade cualquier información útil. Este texto aparecerá cuando el usuario haga clic en la tarjeta.' 
                })
            ]),
            renderStatusMessage(),
            React.createElement('button', {
                type: 'submit',
                className: 'submit-button',
                disabled: status.type === 'loading'
            }, status.type === 'loading' ? 'Guardando...' : 'Guardar Entrada')
        ])
    ]);
};

// --- Componente para gestionar avisos ---
const ManageDisclaimers = () => {
    const [disclaimerText, setDisclaimerText] = useState('');
    const [status, setStatus] = useState({ message: '', type: '' });
    
    useEffect(() => {
        const fetchDisclaimer = async () => {
            if (!db) return;
            try {
                const docRef = db.collection('settings').doc('disclaimers');
                const doc = await docRef.get();
                if (doc.exists) {
                    setDisclaimerText(doc.data().resourcesPageDisclaimer || '');
                }
            } catch (error) {
                console.error("Error fetching disclaimer:", error);
            }
        };
        fetchDisclaimer();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!db) {
            setStatus({ message: 'Error: La base de datos no está conectada.', type: 'error' });
            return;
        }
        setStatus({ message: 'Guardando aviso...', type: 'loading' });

        try {
            const docRef = db.collection('settings').doc('disclaimers');
            await docRef.set({ resourcesPageDisclaimer: disclaimerText }, { merge: true });
            setStatus({ message: '¡Aviso guardado con éxito!', type: 'success' });
             setTimeout(() => setStatus({ message: '', type: '' }), 3000);
        } catch (error) {
             setStatus({ message: `Error al guardar: ${error.message}`, type: 'error' });
        }
    };

    const renderStatusMessage = () => {
        if (!status.message) return null;
        const className = `status-message ${status.type}`;
        return React.createElement('div', { className }, status.message);
    };

    return React.createElement('div', { className: 'contact-container', style: { maxWidth: '800px', marginTop: '3rem' } }, [
        React.createElement('h2', { key: 'title', style: { textAlign: 'center' } }, 'Gestionar Avisos Legales'),
        React.createElement('form', { key: 'form', onSubmit: handleSave, className: 'contact-form' }, [
            React.createElement('div', { key: 'disclaimer-group', className: 'form-group' }, [
                React.createElement('label', { htmlFor: 'resourcesDisclaimer' }, 'Aviso General para la Página de "Recursos"'),
                React.createElement('textarea', {
                    id: 'resourcesDisclaimer',
                    name: 'resourcesDisclaimer',
                    value: disclaimerText,
                    onChange: (e) => setDisclaimerText(e.target.value),
                    rows: 4,
                    placeholder: 'Escribe aquí el aviso general que aparecerá en la página de Recursos...'
                })
            ]),
            renderStatusMessage(),
            React.createElement('button', {
                type: 'submit',
                className: 'submit-button',
                disabled: status.type === 'loading'
            }, status.type === 'loading' ? 'Guardando...' : 'Guardar Aviso')
        ])
    ]);
};


// --- Componente para gestionar (ver y borrar) contenido ---
const ManageContent = () => {
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchContent = async () => {
            if (!db) {
                setError('La base de datos no está disponible.');
                setLoading(false);
                return;
            }
            try {
                const snapshot = await db.collection('content').orderBy('createdAt', 'desc').get();
                const contentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setContent(contentList);
            } catch (err) {
                setError(`Error al cargar contenido: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, []);

    const handleDelete = async (docId) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta entrada? Esta acción no se puede deshacer.')) {
            try {
                await db.collection('content').doc(docId).delete();
                setContent(prevContent => prevContent.filter(item => item.id !== docId));
                alert('¡Entrada eliminada con éxito!');
            } catch (err) {
                alert(`Error al eliminar: ${err.message}`);
            }
        }
    };

    const renderContentList = () => {
        if (loading) return React.createElement('p', null, 'Cargando contenido...');
        if (error) return React.createElement('p', { style: { color: 'red' } }, error);
        if (content.length === 0) return React.createElement('p', null, 'No hay contenido para mostrar.');

        return React.createElement('ul', { style: { listStyle: 'none', padding: 0 } },
            content.map(item => React.createElement('li', {
                key: item.id,
                style: {
                    backgroundColor: 'var(--bg-primary)',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }
            }, [
                React.createElement('div', { key: 'info' }, [
                    React.createElement('strong', { key: 'title' }, item.title),
                    React.createElement('span', {
                        key: 'category',
                        style: {
                            marginLeft: '1rem',
                            backgroundColor: 'var(--bg-tertiary)',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)'
                        }
                    }, item.category)
                ]),
                React.createElement('button', {
                    key: 'delete',
                    onClick: () => handleDelete(item.id),
                    style: {
                        backgroundColor: '#a62626',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer'
                    }
                }, 'Eliminar')
            ]))
        );
    };

    return React.createElement('div', { className: 'contact-container', style: { maxWidth: '800px', marginTop: '3rem' } }, [
        React.createElement('h2', { key: 'title', style: { textAlign: 'center', marginBottom: '1.5rem' } }, 'Gestionar Contenido Existente'),
        renderContentList()
    ]);
};

// --- Componente Principal del Panel ---
const AdminPanel = () => {
    return React.createElement(Fragment, null, [
        React.createElement('header', { key: 'header', style: { textAlign: 'center', margin: '2rem 0' } }, [
            React.createElement('h1', { key: 'main-title' }, 'Panel de Administrador'),
            React.createElement('p', { key: 'subtitle', style: { color: 'var(--text-secondary)' } }, 'Añade y gestiona el contenido de la web.')
        ]),
        React.createElement(AddContentForm, { key: 'add-form' }),
        React.createElement(ManageDisclaimers, { key: 'manage-disclaimers' }),
        React.createElement(ManageContent, { key: 'manage-content' })
    ]);
};

// Renderizar la aplicación
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(React.createElement(AdminAuth));
