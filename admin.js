import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import React, { useState } from 'https://esm.sh/react@18';
import ReactDOM from 'https://esm.sh/react-dom@18/client';
import { firebaseConfig } from './config.js';

// Initialize Firebase
let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('Firebase inicializado para el panel de Admin');
} catch (error) {
    console.error('Error inicializando Firebase:', error);
}

const AdminPanel = () => {
    const [formData, setFormData] = useState({
        title: '',
        category: 'imagenes',
        imageUrl: '',
        prompt: '',
        description: '',
        downloadUrl: '',
        linkUrl: ''
    });
    const [status, setStatus] = useState({ message: '', type: '' }); // type: 'success', 'error', 'loading'
    
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
                createdAt: serverTimestamp()
            };

            // Add conditional fields based on category
            if (['imagenes', 'videos'].includes(formData.category)) {
                dataToSave.prompt = formData.prompt;
            }
            if (['descargas', 'tutoriales', 'recomendaciones'].includes(formData.category)) {
                dataToSave.description = formData.description;
            }
            if (formData.category === 'descargas') {
                dataToSave.downloadUrl = formData.downloadUrl;
            }
            if (formData.category === 'tutoriales') {
                dataToSave.linkUrl = formData.linkUrl;
            }

            const docRef = await addDoc(collection(db, "content"), dataToSave);
            console.log("Documento escrito con ID: ", docRef.id);
            
            setStatus({ message: '¡Entrada guardada con éxito!', type: 'success' });
            // Reset form
            setFormData({
                title: '', category: 'imagenes', imageUrl: '', prompt: '',
                description: '', downloadUrl: '', linkUrl: ''
            });

            setTimeout(() => setStatus({ message: '', type: '' }), 3000);

        } catch (error) {
            console.error("Error al agregar documento: ", error);
            setStatus({ message: `Error al guardar: ${error.message}`, type: 'error' });
        }
    };
    
    const renderConditionalFields = () => {
        const { category } = formData;
        const fields = [];

        if (['imagenes', 'videos'].includes(category)) {
            fields.push(React.createElement('div', { key: 'prompt-group', className: 'form-group' }, [
                React.createElement('label', { key: 'prompt-label', htmlFor: 'prompt' }, 'Prompt'),
                React.createElement('textarea', { key: 'prompt-input', id: 'prompt', name: 'prompt', value: formData.prompt, onChange: handleChange, rows: 4, required: true })
            ]));
        }

        if (['descargas', 'tutoriales', 'recomendaciones'].includes(category)) {
             fields.push(React.createElement('div', { key: 'desc-group', className: 'form-group' }, [
                React.createElement('label', { key: 'desc-label', htmlFor: 'description' }, 'Descripción'),
                React.createElement('textarea', { key: 'desc-input', id: 'description', name: 'description', value: formData.description, onChange: handleChange, rows: 3, required: true })
            ]));
        }

        if (category === 'descargas') {
             fields.push(React.createElement('div', { key: 'download-group', className: 'form-group' }, [
                React.createElement('label', { key: 'download-label', htmlFor: 'downloadUrl' }, 'URL de Descarga'),
                React.createElement('input', { key: 'download-input', type: 'url', id: 'downloadUrl', name: 'downloadUrl', value: formData.downloadUrl, onChange: handleChange, required: true })
            ]));
        }
        
        if (category === 'tutoriales') {
             fields.push(React.createElement('div', { key: 'link-group', className: 'form-group' }, [
                React.createElement('label', { key: 'link-label', htmlFor: 'linkUrl' }, 'URL del Tutorial'),
                React.createElement('input', { key: 'link-input', type: 'url', id: 'linkUrl', name: 'linkUrl', value: formData.linkUrl, onChange: handleChange, required: true })
            ]));
        }

        return fields;
    };
    
    const renderStatusMessage = () => {
        if (!status.message) return null;
        let className = 'status-message';
        if (status.type === 'success') className += ' success';
        if (status.type === 'error') className += ' error';
        if (status.type === 'loading') className += ' loading';
        
        return React.createElement('div', { className }, status.message);
    };

    return React.createElement('div', { className: 'contact-container', style: { maxWidth: '800px', margin: '2rem auto' } }, [
        React.createElement('h1', { key: 'main-title', style: { textAlign: 'center', marginBottom: '0.5rem' } }, 'Panel de Administrador'),
        React.createElement('p', { key: 'subtitle', style: { textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' } }, 'Añade nuevo contenido a la web. Esta página es solo para uso local.'),
        React.createElement('form', { key: 'form', onSubmit: handleSubmit, className: 'contact-form' }, [
            React.createElement('div', { key: 'title-group', className: 'form-group' }, [
                React.createElement('label', { key: 'title-label', htmlFor: 'title' }, 'Título'),
                React.createElement('input', { key: 'title-input', type: 'text', id: 'title', name: 'title', value: formData.title, onChange: handleChange, required: true })
            ]),
            React.createElement('div', { key: 'category-group', className: 'form-group' }, [
                React.createElement('label', { key: 'category-label', htmlFor: 'category' }, 'Categoría'),
                React.createElement('select', { key: 'category-select', id: 'category', name: 'category', value: formData.category, onChange: handleChange, required: true }, [
                    React.createElement('option', { key: 'img', value: 'imagenes' }, 'Imágenes'),
                    React.createElement('option', { key: 'vid', value: 'videos' }, 'Videos'),
                    React.createElement('option', { key: 'down', value: 'descargas' }, 'Descargas'),
                    React.createElement('option', { key: 'rec', value: 'recomendaciones' }, 'Recomendaciones'),
                    React.createElement('option', { key: 'tut', value: 'tutoriales' }, 'Tutoriales')
                ])
            ]),
            React.createElement('div', { key: 'imageUrl-group', className: 'form-group' }, [
                React.createElement('label', { key: 'imageUrl-label', htmlFor: 'imageUrl' }, 'URL de la Imagen (Preview)'),
                React.createElement('input', { key: 'imageUrl-input', type: 'url', id: 'imageUrl', name: 'imageUrl', value: formData.imageUrl, onChange: handleChange, required: true, placeholder: 'https://ejemplo.com/imagen.jpg' })
            ]),
            ...renderConditionalFields(),
            renderStatusMessage(),
            React.createElement('button', {
                key: 'submit',
                type: 'submit',
                className: 'submit-button',
                disabled: status.type === 'loading'
            }, status.type === 'loading' ? 'Guardando...' : 'Guardar Entrada')
        ])
    ]);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(AdminPanel));
