import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, getDocs, getDoc, doc, query, where, orderBy, limit, startAfter } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import React, { useState, useEffect, useCallback, useRef } from 'https://esm.sh/react@18';
import ReactDOM from 'https://esm.sh/react-dom@18/client';
import Fuse from 'https://esm.sh/fuse.js@7.0.0';
import { toPng } from 'https://esm.sh/html-to-image@1.11.11';

// La configuración de Firebase se inyecta aquí durante el proceso de despliegue.
const firebaseConfig = {
    apiKey: "__FIREBASE_API_KEY__", // Inyectado automáticamente
    authDomain: "theramzes-creations.firebaseapp.com",
    projectId: "theramzes-creations",
    storageBucket: "theramzes-creations.appspot.com",
    messagingSenderId: "497450013723",
    appId: "1:497450013723:web:1d3019c9c0d7da82a754be",
    measurementId: "G-1B2TVSMM1Y"
};

let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.error('Error inicializando Firebase:', error);
}

// --- Helpers ---
const CLOUDINARY_CLOUD_NAME = 'dbbdcvgbq';
const optimizeImageUrl = (url, width = 600) => {
    if (!url || !url.startsWith('http')) return url;
    if (url.includes('res.cloudinary.com')) return url;
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/fetch/f_auto,q_auto,w_${width}/${encodeURIComponent(url)}`;
};
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9' fill='%232a2a2a'%3E%3C/svg%3E";
// Icono de perfil gris por defecto (Base64 SVG) para evitar CORS y asegurar carga rápida
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23888888'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

const handleImageError = (e) => {
    if (e.currentTarget.src !== PLACEHOLDER_IMAGE) {
        e.currentTarget.src = PLACEHOLDER_IMAGE;
    }
};

// --- Components ---
const ImagePromptCard = ({ item, onShowDetails }) => {
    const [isPromptVisible, setIsPromptVisible] = useState(false);
    const [copyStatus, setCopyStatus] = useState('Copiar');
    const handleCopy = (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(item.prompt).then(() => {
            setCopyStatus('¡Copiado!');
            setTimeout(() => setCopyStatus('Copiar'), 2000);
        }, () => { setCopyStatus('Error'); });
    };
    const promptId = `prompt-${item.id}`;
    return React.createElement('div', { className: 'card', onClick: () => onShowDetails(item) }, [
        item.imageUrl && React.createElement('img', { key: 'image', src: optimizeImageUrl(item.imageUrl), alt: item.title, className: 'card-image', loading: 'lazy', onError: handleImageError }),
        React.createElement('div', { key: 'content', className: 'card-content' }, [
            React.createElement('h3', { key: 'title', className: 'card-title' }, item.title),
            React.createElement('div', { key: 'actions', className: 'card-actions' },
                React.createElement('button', { className: 'card-button', onClick: (e) => { e.stopPropagation(); setIsPromptVisible(!isPromptVisible); }, 'aria-expanded': isPromptVisible, 'aria-controls': promptId }, isPromptVisible ? 'Ocultar Prompt' : 'Ver Prompt'))
        ]),
        React.createElement('div', { key: 'prompt', id: promptId, className: `prompt-container ${isPromptVisible ? 'visible' : ''}`, onClick: (e) => e.stopPropagation() }, [
            React.createElement('button', { key: 'copy', className: 'copy-button', onClick: handleCopy }, copyStatus),
            React.createElement('p', { key: 'text' }, item.prompt)
        ])
    ]);
};

const DownloadCard = ({ item, onShowDetails }) => (
    React.createElement('div', { className: 'card', onClick: () => onShowDetails(item) }, [
        item.imageUrl && React.createElement('img', { key: 'image', src: optimizeImageUrl(item.imageUrl), alt: item.title, className: 'card-image', loading: 'lazy', onError: handleImageError }),
        React.createElement('div', { key: 'content', className: 'card-content' }, [
            React.createElement('h3', { key: 'title', className: 'card-title' }, item.title),
            React.createElement('p', { key: 'description', className: 'download-text' }, item.description),
            React.createElement('div', { key: 'actions', className: 'card-actions' },
                React.createElement('a', { key: 'download', href: item.downloadUrl, className: 'card-button', download: true, onClick: (e) => e.stopPropagation() }, 'Descargar'))
        ])
    ])
);

const RecommendationCard = ({ item, onShowDetails }) => {
    const hasLink = item.linkUrl && typeof item.linkUrl === 'string' && item.linkUrl.trim() !== '';
    const cardContent = [
        item.imageUrl && React.createElement('img', { key: 'image', src: optimizeImageUrl(item.imageUrl, 200), alt: item.title, className: 'recommendation-card-image', loading: 'lazy', onError: handleImageError }),
        React.createElement('div', { key: 'content', className: 'recommendation-card-content' }, [
            React.createElement('h3', { key: 'title', className: 'recommendation-card-title' }, item.title),
            React.createElement('p', { key: 'description', className: 'recommendation-card-description' }, item.description)
        ])
    ];
    if (hasLink) {
        return React.createElement('a', { href: item.linkUrl, target: '_blank', rel: 'noopener noreferrer', className: 'recommendation-card has-link', onClick: (e) => { e.stopPropagation(); if (item.details) { e.preventDefault(); onShowDetails(item); } } }, cardContent);
    }
    return React.createElement('div', { className: 'recommendation-card', onClick: () => onShowDetails(item) }, cardContent);
};

const TutorialCard = ({ item, onShowDetails }) => (
    React.createElement('div', { className: 'card', onClick: () => onShowDetails(item) }, [
        item.imageUrl && React.createElement('img', { key: 'image', src: optimizeImageUrl(item.imageUrl), alt: item.title, className: 'card-image', loading: 'lazy', onError: handleImageError }),
        React.createElement('div', { key: 'content', className: 'card-content' }, [
            React.createElement('h3', { key: 'title', className: 'card-title' }, item.title),
            React.createElement('p', { key: 'description', className: 'download-text' }, item.description),
            React.createElement('div', { key: 'actions', className: 'card-actions' },
                React.createElement('a', { key: 'link', href: item.linkUrl, target: '_blank', rel: 'noopener noreferrer', className: 'card-button', onClick: (e) => e.stopPropagation() }, 'Ver Tutorial'))
        ])
    ])
);

const AffiliateCard = ({ item, onShowDetails }) => (
    React.createElement('div', { className: 'card', onClick: () => onShowDetails(item) }, [
        item.imageUrl && React.createElement('img', { key: 'image', src: optimizeImageUrl(item.imageUrl), alt: item.title, className: 'card-image', loading: 'lazy', onError: handleImageError }),
        React.createElement('div', { key: 'content', className: 'card-content' }, [
            React.createElement('h3', { key: 'title', className: 'card-title' }, item.title),
            React.createElement('p', { key: 'description', className: 'download-text' }, item.description),
            item.disclaimer && React.createElement('p', { key: 'disclaimer', className: 'affiliate-disclaimer' }, item.disclaimer),
            React.createElement('div', { key: 'actions', className: 'card-actions' },
                React.createElement('a', { key: 'link', href: item.linkUrl, target: '_blank', rel: 'noopener noreferrer sponsored', className: 'card-button', onClick: (e) => e.stopPropagation() }, 'Ver Producto'))
        ])
    ])
);

const AboutMe = () => (
    React.createElement('div', { className: 'about-me-container' }, [
        React.createElement('img', { key: 'profile', src: optimizeImageUrl('https://yt3.googleusercontent.com/UsEE3B7HZCqYlFrE6zI601Pq-_moV7q1diFWggkrSM5yI7imCvZWnBAjnOy5gp6_xx1LAZTUHg=s160-c-k-c0x00ffffff-no-rj', 240), alt: 'Profile', className: 'profile-pic' }),
        React.createElement('h2', { key: 'name' }, 'TheRamzes'),
        React.createElement('p', { key: 'bio', className: 'bio' }, 'Creador de contenido, explorador de IA y apasionado por la tecnología. Aquí comparto mis creaciones y recursos favoritos.'),
        React.createElement('div', { key: 'links', className: 'links-container' }, [
            React.createElement('a', { key: 'youtube', href: 'https://www.youtube.com/@TheRamzes', target: '_blank', rel: 'noopener noreferrer', className: 'social-link' }, 'YouTube'),
            React.createElement('a', { key: 'tiktok', href: 'https://www.tiktok.com/@theramzestech', target: '_blank', rel: 'noopener noreferrer', className: 'social-link' }, 'TikTok'),
            React.createElement('a', { key: 'creaciones', href: './', className: 'social-link' }, 'Explorar Creaciones'),
            React.createElement('a', { key: 'recursos-fav', href: 'recursos.html', className: 'social-link' }, 'Explora mis recursos favoritos'),
            React.createElement('a', { key: 'contacto', href: 'contacto.html', className: 'social-link' }, 'Contacto por Email')
        ])
    ])
);

// --- Generator Page Component ---
const GeneratorPage = () => {
    // Default profile data with LocalStorage persistence
    const [name, setName] = useState(() => {
        try { return localStorage.getItem('theramzes_gen_name') || 'Nombre Usuario'; } catch (e) { return 'Nombre Usuario'; }
    });
    const [username, setUsername] = useState(() => {
        try { return localStorage.getItem('theramzes_gen_username') || '@usuario'; } catch (e) { return '@usuario'; }
    });
    const [avatarUrl, setAvatarUrl] = useState(() => {
        // Intentar cargar avatar local o usar el gris por defecto
        try { return localStorage.getItem('theramzes_gen_avatar') || DEFAULT_AVATAR; } catch (e) { return DEFAULT_AVATAR; }
    });
    
    // Save changes to LocalStorage
    useEffect(() => { try { localStorage.setItem('theramzes_gen_name', name); } catch (e) {} }, [name]);
    useEffect(() => { try { localStorage.setItem('theramzes_gen_username', username); } catch (e) {} }, [username]);
    useEffect(() => { 
        try { 
            localStorage.setItem('theramzes_gen_avatar', avatarUrl); 
        } catch (e) {
            console.warn("La imagen es demasiado grande para guardarla localmente.");
        } 
    }, [avatarUrl]);

    // Config settings
    const [font, setFont] = useState('font-inter'); 
    const [align, setAlign] = useState('text-left');
    
    // Input Text (multiline)
    const [inputText, setInputText] = useState('Haz clic en el nombre o foto para editar.\nEscribe aquí tu frase.\nUsa "Enter" para crear nuevas imágenes.');

    // State for generated images
    const [generatedImages, setGeneratedImages] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Ref for hidden file input and batch container
    const fileInputRef = useRef(null);
    const batchContainerRef = useRef(null);

    const handleAvatarClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        // Split text by newlines and filter empty lines
        const lines = inputText.split('\n').map(l => l.trim()).filter(l => l.length > 0).slice(0, 3); // Max 3
        
        if (lines.length === 0) {
            alert("Por favor escribe al menos una frase.");
            return;
        }

        setIsGenerating(true);
        setGeneratedImages([]);
        
        // Esperamos un momento para que el DOM oculto se renderice
        setTimeout(async () => {
            const newImages = [];
            if (batchContainerRef.current) {
                const nodes = batchContainerRef.current.querySelectorAll('.tweet-card-batch');
                
                for (let i = 0; i < nodes.length; i++) {
                    try {
                        // Usamos toPng importado de esm.sh
                        const dataUrl = await toPng(nodes[i], { 
                            quality: 1.0,
                            pixelRatio: 3, // High quality
                            backgroundColor: '#000000' 
                        });
                        newImages.push(dataUrl);
                    } catch (err) {
                        console.error("Error generating image:", err);
                    }
                }
            }
            if (newImages.length === 0) {
                 alert("Hubo un error generando las imágenes. Inténtalo de nuevo.");
            }
            setGeneratedImages(newImages);
            setIsGenerating(false);
        }, 800); 
    };

    const handleOpenImage = (dataUrl) => {
        const win = window.open();
        if (win) {
            win.document.write(`
                <html>
                    <body style="background:#121212; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0;">
                        <img src="${dataUrl}" style="max-width:90%; max-height:80vh; box-shadow:0 0 20px rgba(0,0,0,0.5); border-radius:10px;" />
                        <p style="color:#e0e0e0; font-family:sans-serif; margin-top:20px;">Mantén presionada la imagen para guardarla.</p>
                    </body>
                </html>
            `);
        } else {
            alert("Por favor permite las ventanas emergentes para ver la imagen.");
        }
    };

    // Helper component for the card UI
    const TweetCardUI = ({ txt, isEditable = false }) => (
        React.createElement('div', { 
            className: `tweet-card ${font} ${align} ${!isEditable ? 'tweet-card-batch' : ''}`,
            style: !isEditable ? { marginBottom: '20px' } : {} 
        }, [
            React.createElement('div', { key: 'header', className: 'tweet-header' }, [
                // Avatar
                React.createElement('img', { 
                    key: 'avatar', 
                    src: avatarUrl, 
                    className: 'tweet-avatar', 
                    alt: 'avatar', 
                    onClick: isEditable ? handleAvatarClick : undefined,
                    title: isEditable ? "Clic para cambiar foto" : ""
                }),
                // User Info
                React.createElement('div', { key: 'info', className: 'tweet-user-info text-left' }, [
                    // Editable Name
                    isEditable 
                    ? React.createElement('input', { 
                        key: 'name-input',
                        className: 'editable-input tweet-name', 
                        value: name, 
                        onChange: e => setName(e.target.value),
                        placeholder: "Nombre"
                      })
                    : React.createElement('div', { key: 'name', className: 'tweet-name' }, name),
                    
                    // Editable Username
                    isEditable
                    ? React.createElement('input', { 
                        key: 'user-input',
                        className: 'editable-input tweet-username', 
                        value: username, 
                        onChange: e => setUsername(e.target.value),
                        placeholder: "@usuario"
                      })
                    : React.createElement('div', { key: 'user', className: 'tweet-username' }, username)
                ])
            ]),
            React.createElement('div', { key: 'body', className: 'tweet-body' }, txt)
        ])
    );

    // Estilos explícitos para las opciones del select para asegurar legibilidad
    const optionStyle = { backgroundColor: '#1e1e1e', color: '#e0e0e0' };

    return React.createElement('div', { className: 'generator-container' }, [
        // Hidden File Input
        React.createElement('input', { 
            key: 'file-input',
            type: 'file', 
            ref: fileInputRef, 
            style: { display: 'none' }, 
            accept: 'image/*', 
            onChange: handleImageUpload 
        }),

        React.createElement('h2', { key: 'title', style: { textAlign: 'center' } }, 'Generador de Frases (Dark Mode)'),
        
        // Live Preview Title with instructions
        React.createElement('p', { key: 'instructions', style: { textAlign: 'center', color: '#a0a0a0', fontSize: '0.9rem', marginBottom: '1rem' } }, 'Haz clic en el texto o foto de la tarjeta para editarlos.'),

        // Live Preview Area
        React.createElement('div', { key: 'preview', className: 'preview-area' }, [
             React.createElement(TweetCardUI, { key: 'live-card', txt: inputText.split('\n')[0] || 'Escribe algo...', isEditable: true })
        ]),

        // Control Panel (Simplified)
        React.createElement('div', { key: 'controls', className: 'control-panel' }, [
            // Row 1: Style Settings
            React.createElement('div', { key: 'row3', className: 'control-row' }, [
                 React.createElement('div', { className: 'control-group' }, [
                    React.createElement('label', {}, 'Fuente'),
                    React.createElement('div', { className: 'control-select' }, 
                        React.createElement('select', { 
                            style: { background: 'transparent', border: 'none', color: 'inherit', width: '100%' },
                            value: font, 
                            onChange: e => setFont(e.target.value) 
                        }, [
                            React.createElement('option', { value: 'font-inter', style: optionStyle }, 'Inter (Moderna)'),
                            React.createElement('option', { value: 'font-montserrat', style: optionStyle }, 'Montserrat (Geométrica)'),
                            React.createElement('option', { value: 'font-bebas', style: optionStyle }, 'Bebas Neue (Impacto)'),
                            React.createElement('option', { value: 'font-merriweather', style: optionStyle }, 'Merriweather (Clásica)'),
                            React.createElement('option', { value: 'font-serif', style: optionStyle }, 'Playfair (Elegante)'),
                            React.createElement('option', { value: 'font-dancing', style: optionStyle }, 'Dancing Script (Cursiva)'),
                            React.createElement('option', { value: 'font-inconsolata', style: optionStyle }, 'Inconsolata (Tech)'),
                        ])
                    )
                ]),
                React.createElement('div', { className: 'control-group' }, [
                    React.createElement('label', {}, 'Alineación'),
                    React.createElement('div', { className: 'control-btn-group' }, [
                        React.createElement('button', { className: `control-btn ${align === 'text-left' ? 'active' : ''}`, onClick: () => setAlign('text-left') }, 'Izq'),
                        React.createElement('button', { className: `control-btn ${align === 'text-center' ? 'active' : ''}`, onClick: () => setAlign('text-center') }, 'Cen'),
                        React.createElement('button', { className: `control-btn ${align === 'text-right' ? 'active' : ''}`, onClick: () => setAlign('text-right') }, 'Der'),
                    ])
                ])
            ]),
            // Row 2: Text Area
            React.createElement('div', { key: 'row4', className: 'control-group' }, [
                React.createElement('label', {}, 'Contenido del Tweet (Separa con "Enter" para crear múltiples imágenes)'),
                React.createElement('textarea', { 
                    className: 'control-input', 
                    rows: 4, 
                    value: inputText, 
                    onChange: e => setInputText(e.target.value),
                    placeholder: "Escribe aquí..."
                })
            ]),
        ]),

        // Generate Button
        React.createElement('button', { 
            key: 'generate-btn', 
            className: 'action-btn', 
            onClick: handleGenerate,
            disabled: isGenerating
        }, isGenerating ? 'Generando...' : 'Generar Imágenes (Max 3)'),

        // Results Area
        generatedImages.length > 0 && React.createElement('div', { key: 'results', className: 'generated-results' }, [
            React.createElement('h3', { key: 'res-title', className: 'text-center' }, 'Resultados'),
            generatedImages.map((img, idx) => 
                React.createElement('div', { key: idx, className: 'result-item' }, [
                    React.createElement('img', { src: img, className: 'result-img' }),
                    React.createElement('button', { 
                        className: 'card-button', 
                        style: { width: '100%' },
                        onClick: () => handleOpenImage(img) 
                    }, 'Abrir Imagen (Guardar)')
                ])
            )
        ]),

        // Hidden Batch Rendering Area (off-screen but rendered)
        isGenerating && React.createElement('div', { 
            key: 'batch-render', 
            ref: batchContainerRef,
            // Usamos opacity 0 y zIndex negativo en lugar de posición muy lejana para asegurar que el navegador lo renderiza
            style: { 
                position: 'fixed', 
                left: '0', 
                top: '0', 
                width: '600px', 
                zIndex: -1000,
                opacity: 0,
                pointerEvents: 'none'
            } 
        }, 
            inputText.split('\n').map(l => l.trim()).filter(l => l.length > 0).slice(0, 3).map((line, idx) => 
                React.createElement(TweetCardUI, { key: idx, txt: line, isEditable: false })
            )
        )
    ]);
};


const ContactForm = () => {
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = `Nombre: ${formData.get('name')}\nCorreo: ${formData.get('email')}\n\nMensaje:\n${formData.get('message')}`;
        window.location.href = `mailto:theramzesyt@gmail.com?subject=${encodeURIComponent(formData.get('subject'))}&body=${encodeURIComponent(body)}`;
        alert('Se abrirá tu cliente de correo para enviar el mensaje. ¡Gracias!');
    };
    return React.createElement('div', { className: 'contact-container' }, [
        React.createElement('h2', { key: 'title' }, 'Contacto'),
        React.createElement('form', { key: 'form', onSubmit: handleSubmit, className: 'contact-form' }, [
            React.createElement('div', { key: 'name-group', className: 'form-group' }, [React.createElement('label', { htmlFor: 'name' }, 'Nombre'), React.createElement('input', { type: 'text', id: 'name', name: 'name', required: true })]),
            React.createElement('div', { key: 'email-group', className: 'form-group' }, [React.createElement('label', { htmlFor: 'email' }, 'Correo Electrónico'), React.createElement('input', { type: 'email', id: 'email', name: 'email', required: true })]),
            React.createElement('div', { key: 'subject-group', className: 'form-group' }, [
                React.createElement('label', { htmlFor: 'subject' }, 'Asunto'),
                React.createElement('select', { id: 'subject', name: 'subject', required: true, defaultValue: "" }, [
                    React.createElement('option', { value: '', disabled: true }, 'Selecciona un motivo...'),
                    React.createElement('option', { value: 'Consulta General' }, 'Consulta General'), React.createElement('option', { value: 'Propuesta de Colaboración' }, 'Propuesta de Colaboración'),
                    React.createElement('option', { value: 'Reportar un Error' }, 'Reportar un Error'), React.createElement('option', { value: 'Sugerencia' }, 'Sugerencia'), React.createElement('option', { value: 'Otro' }, 'Otro')
                ])
            ]),
            React.createElement('div', { key: 'message-group', className: 'form-group' }, [React.createElement('label', { htmlFor: 'message' }, 'Mensaje'), React.createElement('textarea', { id: 'message', name: 'message', rows: 5, required: true })]),
            React.createElement('button', { type: 'submit', className: 'submit-button' }, 'Enviar Mensaje')
        ])
    ]);
};

const DetailModal = ({ item, onClose }) => {
    const [copyStatus, setCopyStatus] = useState('Copiar');

    useEffect(() => {
        const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleCopy = () => {
        if (item.prompt) {
            navigator.clipboard.writeText(item.prompt).then(() => { setCopyStatus('¡Copiado!'); setTimeout(() => setCopyStatus('Copiar'), 2000); }, () => { setCopyStatus('Error'); });
        }
    };
    return React.createElement('div', { className: 'modal-backdrop', onClick: onClose }, React.createElement('div', { className: 'modal-content', onClick: (e) => e.stopPropagation() }, [
        React.createElement('div', { key: 'header', className: 'modal-header' }, [
            React.createElement('h2', { key: 'title' }, item.title),
            React.createElement('button', { key: 'close', className: 'modal-close-button', onClick: onClose, 'aria-label': 'Cerrar' }, '×')
        ]),
        React.createElement('div', { key: 'body', className: 'modal-body' }, [
            item.imageUrl && React.createElement('img', { key: 'image', src: optimizeImageUrl(item.imageUrl, 800), alt: item.title, className: 'detail-modal-image', loading: 'lazy', onError: handleImageError }),
            item.description && React.createElement('p', { key: 'description' }, item.description),
            item.details && React.createElement('div', { key: 'details-section' }, [React.createElement('h3', { key: 'details-title' }, 'Detalles Adicionales'), React.createElement('p', { key: 'details-content', className: 'detail-modal-details' }, item.details)]),
            item.prompt && React.createElement('div', { key: 'prompt-section', className: 'detail-modal-prompt' }, [
                 React.createElement('h3', { key: 'prompt-title' }, 'Prompt'),
                 React.createElement('div', { className: 'prompt-container visible' }, [
                    React.createElement('button', { key: 'copy', className: 'copy-button', onClick: handleCopy }, copyStatus),
                    React.createElement('p', { key: 'text' }, item.prompt)
                ])
            ]),
        ])
    ]));
};
const PrivacyPolicyModal = ({ isVisible, onClose }) => {
    useEffect(() => {
        if (!isVisible) return;
        const handleKeyDown = (event) => { if (event.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, onClose]);
    if (!isVisible) return null;
    return React.createElement('div', { className: 'modal-backdrop', onClick: (e) => { if (e.target === e.currentTarget) onClose(); } },
        React.createElement('div', { className: 'modal-content', onClick: (e) => e.stopPropagation() }, [
            React.createElement('div', { key: 'header', className: 'modal-header' }, [ React.createElement('h2', { key: 'title' }, 'Política de Privacidad y Términos de Uso'), React.createElement('button', { key: 'close', className: 'modal-close-button', onClick: onClose, 'aria-label': 'Cerrar' }, '×')]),
            React.createElement('div', { key: 'body', className: 'modal-body' }, [
                React.createElement('p', { key: 'date' }, `Última actualización: ${new Date().toLocaleDateString('es-ES')}`),
                
                React.createElement('h2', { key: 'h-privacy-title', style: { fontSize: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '0' } }, 'Política de Privacidad'),
                React.createElement('p', { key: 'intro' }, 'Bienvenido a TheRamzes - AI Prompts & Creations. Su privacidad es de suma importancia para nosotros. Esta Política de Privacidad describe qué datos recopilamos y cómo los usamos y protegemos.'),
                React.createElement('h3', { key: 'h-info' }, 'Información que Recopilamos'),
                React.createElement('p', { key: 'p-info1' }, [ React.createElement('strong', { key: 'bold1' }, 'Datos de Contacto: '), 'Si decide contactarnos a través de nuestro formulario, recopilaremos su nombre y dirección de correo electrónico para poder responder a su consulta. No utilizaremos esta información para ningún otro propósito sin su consentimiento explícito.' ]),
                React.createElement('p', { key: 'p-info2' }, [ React.createElement('strong', { key: 'bold2' }, 'Datos de Uso (Analytics): '), 'Utilizamos servicios como Firebase Analytics (un producto de Google) para recopilar información anónima sobre cómo los visitantes interactúan con nuestro sitio web. Esto incluye datos como las páginas que visita, el tiempo que pasa en el sitio y el tipo de dispositivo que utiliza. Esta información nos ayuda a mejorar la experiencia del usuario y el contenido que ofrecemos. No se recopila información de identificación personal.' ]),
                React.createElement('h3', { key: 'h-ai-content' }, 'Contenido Generado por IA y Propiedad Intelectual'),
                React.createElement('p', { key: 'p-ai1' }, 'La gran mayoría del contenido visual (imágenes, videos) y los textos ("prompts") presentados en este sitio son creados utilizando herramientas de inteligencia artificial generativa. Están destinados a servir como inspiración, entretenimiento y recurso educativo.'),
                React.createElement('p', { key: 'p-ai2' }, [
                    React.createElement('strong', { key: 'bold-ai' }, 'Aviso Legal Importante: '),
                    'Todas las imágenes son generadas por IA y sirven solo como ejemplo o inspiración. No están afiliadas, respaldadas ni conectadas de ninguna manera con ningún club, marca, organización o persona del mundo real.'
                ]),
                React.createElement('p', { key: 'p-ai3' }, 'Cualquier semejanza con equipaciones deportivas, logotipos, personajes, productos o cualquier otro material protegido por derechos de autor es una coincidencia o se presenta con un fin transformador y artístico. El objetivo no es replicar productos oficiales, sino explorar posibilidades creativas. TheRamzes no reclama la propiedad de ninguna marca registrada de terceros.'),
                React.createElement('p', { key: 'p-ai4' }, [
                    React.createElement('strong', { key: 'bold-user' }, 'Su Responsabilidad como Usuario: '),
                    'Usted es el único responsable del uso que le dé a los prompts e ideas obtenidos de este sitio. Es su deber asegurarse de que el contenido que usted genere a partir de estos prompts no infrinja las leyes de derechos de autor, marcas registradas u otros derechos de propiedad intelectual. Al utilizar este sitio, usted acepta eximir de toda responsabilidad a TheRamzes ante cualquier reclamación que pueda surgir por el uso que usted le dé al contenido.'
                ]),
                React.createElement('h3', { key: 'h-usage' }, 'Cómo Usamos su Información'), React.createElement('p', { key: 'p-usage' }, 'Utilizamos la información que recopilamos para: responder a sus consultas, mejorar y optimizar nuestro sitio web, y analizar tendencias de uso para crear contenido más relevante.'),
                React.createElement('h3', { key: 'h-cookies' }, 'Cookies'), React.createElement('p', { key: 'p-cookies' }, 'Nuestro sitio utiliza cookies necesarias para su funcionamiento y para los servicios de análisis proporcionados por Google (Firebase). Las cookies son pequeños archivos de texto que se almacenan en su dispositivo. Puede configurar su navegador para que rechace las cookies, pero esto podría afectar la funcionalidad del sitio.'),
                React.createElement('h3', { key: 'h-affiliates' }, 'Enlaces de Afiliados'), React.createElement('p', { key: 'p-affiliates' }, 'Este sitio puede contener enlaces de afiliados. Si realiza una compra a través de estos enlaces, podemos recibir una comisión sin costo adicional para usted. Estas son recomendaciones de productos y servicios que personalmente uso o considero de alta calidad, no patrocinios directos de las marcas. Indicamos claramente este tipo de contenido.'),
                React.createElement('h3', { key: 'h-third-party' }, 'Enlaces a Terceros'), React.createElement('p', { key: 'p-third-party' }, 'Este sitio puede contener enlaces a sitios web de terceros (por ejemplo, en las secciones de "Recomendaciones", "Tutoriales" o "Afiliados"). No somos responsables de las prácticas de privacidad ni del contenido de estos sitios externos. Le recomendamos leer sus políticas de privacidad.'),
                React.createElement('h3', { key: 'h-security' }, 'Seguridad de los Datos'), React.createElement('p', { key: 'p-security' }, 'Implementamos medidas de seguridad razonables para proteger la información contra el acceso, alteración o destrucción no autorizados. Sin embargo, ningún método de transmisión por Internet es 100% seguro.'),
                
                React.createElement('h2', { key: 'h-terms-title', style: { fontSize: '1.4rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2.5rem' } }, 'Términos de Uso y Limitación de Responsabilidad'),
                React.createElement('h3', { key: 'h-terms-ip' }, 'Propiedad Intelectual del Sitio'),
                React.createElement('p', { key: 'p-terms-ip' }, 'El diseño, la marca "TheRamzes", los textos originales y la estructura de este sitio web son propiedad de TheRamzes y están protegidos por las leyes de propiedad intelectual. No está permitida su copia o redistribución sin permiso explícito.'),
                React.createElement('h3', { key: 'h-terms-as-is' }, 'Exclusión de Garantías (Uso "Tal Cual")'),
                React.createElement('p', { key: 'p-terms-as-is' }, 'Este sitio web y todo su contenido (prompts, imágenes de ejemplo, tutoriales, etc.) se proporcionan "tal cual", sin garantías de ningún tipo, ya sean expresas o implícitas. No garantizamos que el contenido esté libre de errores, sea adecuado para un propósito particular o que los resultados obtenidos al usar los prompts sean los esperados.'),
                React.createElement('h3', { key: 'h-terms-liability' }, 'Limitación de Responsabilidad'),
                React.createElement('p', { key: 'p-terms-liability' }, 'En la máxima medida permitida por la ley, TheRamzes no será responsable de ningún daño directo, indirecto, incidental, especial o consecuente (incluyendo, entre otros, la pérdida de beneficios, datos o interrupción del negocio) que surja del uso o la imposibilidad de usar este sitio web o su contenido, incluso si hemos sido advertidos de la posibilidad de dichos daños.'),
                React.createElement('h3', { key: 'h-terms-age' }, 'Edad Mínima'),
                React.createElement('p', { key: 'p-terms-age' }, 'Este sitio web está destinado a usuarios mayores de 13 años (o la edad mínima legal para consentir el procesamiento de datos personales en su jurisdicción). No recopilamos intencionadamente información de menores de esta edad.'),
                React.createElement('h3', { key: 'h-terms-law' }, 'Ley Aplicable y Jurisdicción'),
                React.createElement('p', { key: 'p-terms-law' }, 'Estos términos se regirán e interpretarán de acuerdo con las leyes de la jurisdicción correspondiente, sin tener en cuenta sus conflictos de principios legales. Cualquier disputa que surja en relación con estos términos estará sujeta a la jurisdicción exclusiva de los tribunales de dicha ubicación.'),

                React.createElement('h3', { key: 'h-changes' }, 'Cambios a esta Política y Términos'), React.createElement('p', { key: 'p-changes' }, 'Nos reservamos el derecho de modificar esta política de privacidad y términos de uso en cualquier momento. Cualquier cambio será efectivo inmediatamente después de su publicación en esta página.'),
                React.createElement('h3', { key: 'h-contact' }, 'Contacto'), React.createElement('p', { key: 'p-contact' }, 'Si tiene alguna pregunta sobre esta Política de Privacidad o los Términos de Uso, puede contactarnos a través del formulario de contacto disponible en este sitio.')
            ])
        ])
    );
};
const EmptyState = ({ message }) => React.createElement('div', { className: 'empty-state-container' }, React.createElement('p', {}, message));
const LoadingState = ({ message }) => React.createElement('div', { className: 'loading-container' }, [React.createElement('div', { key: 'spinner', className: 'loading-spinner' }), React.createElement('p', { key: 'text' }, message)]);
const ErrorState = ({ error }) => React.createElement('div', { className: 'error-container' }, [React.createElement('h3', { key: 'title' }, 'Error de conexión'), React.createElement('p', { key: 'message' }, `No se pudieron cargar los datos: ${error.message}`), React.createElement('p', { key: 'help' }, 'Verifica tu conexión a internet.')]);

const ResourcesPage = ({
    recommendations,
    affiliates,
    resourcesDisclaimer,
    onShowDetails,
    onLoadMoreRecs,
    onLoadMoreAffs,
    hasMoreRecs,
    hasMoreAffs,
    loadingRecs,
    loadingAffs
}) => {
    return React.createElement('div', { className: 'resources-container' }, [
        React.createElement('h2', { key: 'header', className: 'resources-header' }, 'Recursos para Creadores'),
        resourcesDisclaimer && React.createElement('p', { key: 'disclaimer', className: 'resources-disclaimer' }, resourcesDisclaimer),
        React.createElement('h3', { key: 'rec-subheader', className: 'resources-subheader' }, 'Software y Plataformas Esenciales'),
        recommendations.length > 0 ? React.createElement('div', { key: 'rec-list', className: 'recommendation-list' }, recommendations.map(item => React.createElement(RecommendationCard, { key: item.id, item, onShowDetails }))) : React.createElement(EmptyState, { key: 'rec-empty', message: 'Próximamente encontrarás aquí software y webs recomendadas.' }),
        hasMoreRecs && !loadingRecs && React.createElement('div', { key: 'load-more-recs', className: 'load-more-container' }, React.createElement('button', { className: 'load-more-button', onClick: onLoadMoreRecs }, 'Cargar más software')),
        loadingRecs && React.createElement('div', { key: 'loading-recs', className: 'loading-spinner', style: { marginTop: '2rem' } }),
        React.createElement('h3', { key: 'aff-subheader', className: 'resources-subheader' }, 'Descubre gadgets y productos útiles'),
        affiliates.length > 0 ? React.createElement('div', { key: 'aff-grid', className: 'content-grid' }, affiliates.map(item => React.createElement(AffiliateCard, { key: item.id, item, onShowDetails }))) : React.createElement(EmptyState, { key: 'aff-empty', message: 'Próximamente encontrarás aquí los productos que uso y recomiendo.' }),
        hasMoreAffs && !loadingAffs && React.createElement('div', { key: 'load-more-affs', className: 'load-more-container' }, React.createElement('button', { className: 'load-more-button', onClick: onLoadMoreAffs }, 'Cargar más productos')),
        loadingAffs && React.createElement('div', { key: 'loading-affs', className: 'loading-spinner', style: { marginTop: '2rem' } })
    ]);
};


// Main App Component
const App = () => {
    const rootElement = document.getElementById('root');
    const currentPage = rootElement.dataset.page;

    const [data, setData] = useState([]);
    const [allSiteData, setAllSiteData] = useState([]);
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [isPolicyVisible, setIsPolicyVisible] = useState(false);
    const [modalItem, setModalItem] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [resourcesDisclaimer, setResourcesDisclaimer] = useState('');

    // State for Resources page
    const [recommendations, setRecommendations] = useState([]);
    const [affiliates, setAffiliates] = useState([]);
    const [lastRecDoc, setLastRecDoc] = useState(null);
    const [lastAffDoc, setLastAffDoc] = useState(null);
    const [hasMoreRecs, setHasMoreRecs] = useState(true);
    const [hasMoreAffs, setHasMoreAffs] = useState(true);
    const [loadingRecs, setLoadingRecs] = useState(false);
    const [loadingAffs, setLoadingAffs] = useState(false);

    const CONTENT_PER_PAGE = 12;

    const fetchAllDataForSearch = useCallback(async () => {
        if (allSiteData.length > 0) return allSiteData;
        if (!db) return [];
        try {
            const contentSnapshot = await getDocs(collection(db, 'content'));
            const contentList = contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllSiteData(contentList);
            return contentList;
        } catch (err) {
            console.error("Error fetching all data for search:", err);
            return [];
        }
    }, [allSiteData]);
    
    const fetchSettings = useCallback(async () => {
        if (!db) return;
        try {
            const docSnap = await getDoc(doc(db, 'settings', 'disclaimers'));
            if (docSnap.exists()) setResourcesDisclaimer(docSnap.data().resourcesPageDisclaimer || '');
        } catch (err) { console.error("Error fetching settings:", err); }
    }, []);

    const fetchData = useCallback(async (category, startAfterDoc = null) => {
        if (!db) { throw new Error('Firebase no se inicializó'); }
    
        const contentCollectionRef = collection(db, 'content');
        
        // Construir la consulta con ordenamiento. Esta es la única forma de asegurar el orden cronológico.
        // Si esta consulta falla, es porque falta un índice en Firestore.
        // El mensaje de error que se mostrará en la UI contendrá un enlace directo para crear dicho índice.
        let queryConstraints = [
            where('category', '==', category),
            orderBy('createdAt', 'desc'),
            limit(CONTENT_PER_PAGE)
        ];
        if (startAfterDoc) {
            queryConstraints.push(startAfter(startAfterDoc));
        }
    
        try {
            const q = query(contentCollectionRef, ...queryConstraints);
            const contentSnapshot = await getDocs(q);
            const contentList = contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const lastVisible = contentSnapshot.docs[contentSnapshot.docs.length - 1];
            
            return {
                newData: contentList,
                newLastDoc: lastVisible,
                newHasMore: contentList.length === CONTENT_PER_PAGE,
            };
        } catch (err) {
            // Relanzar el error para que sea capturado por el estado del componente y se muestre al usuario.
            // El mensaje de error de Firestore es crucial aquí.
            console.error(`Error al cargar datos para la categoría '${category}':`, err);
            throw err;
        }
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            // Si estamos en la página del generador, no necesitamos cargar datos de Firebase para la grilla
            if (currentPage === 'generador') {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            setData([]);
            setRecommendations([]);
            setAffiliates([]);
            try {
                if (['imagenes', 'videos', 'descargas', 'tutoriales'].includes(currentPage)) {
                    const { newData, newLastDoc, newHasMore } = await fetchData(currentPage);
                    setData(newData);
                    setLastDoc(newLastDoc);
                    setHasMore(newHasMore);
                } else if (currentPage === 'recursos') {
                    const [recResult, affResult] = await Promise.all([
                        fetchData('recomendaciones'),
                        fetchData('afiliados')
                    ]);
                    setRecommendations(recResult.newData);
                    setLastRecDoc(recResult.newLastDoc);
                    setHasMoreRecs(recResult.newHasMore);
                    setAffiliates(affResult.newData);
                    setLastAffDoc(affResult.newLastDoc);
                    setHasMoreAffs(affResult.newHasMore);
                }
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
        loadInitialData();
    }, [currentPage, fetchData, fetchSettings]);

     useEffect(() => {
        const performSearch = async () => {
             if (searchQuery) {
                setLoading(true);
                const allData = await fetchAllDataForSearch();
                const fuseInstance = new Fuse(allData, { keys: ['title', 'description', 'prompt', 'details'], threshold: 0.4 });
                setSearchResults(fuseInstance.search(searchQuery).map(r => r.item));
                setLoading(false);
            } else {
                setSearchResults([]);
            }
        };
        const searchTimeout = setTimeout(() => { performSearch(); }, 300);
        return () => clearTimeout(searchTimeout);
    }, [searchQuery, fetchAllDataForSearch]);

    const handleLoadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        try {
            const { newData, newLastDoc, newHasMore } = await fetchData(currentPage, lastDoc);
            setData(prev => [...prev, ...newData]);
            setLastDoc(newLastDoc);
            setHasMore(newHasMore);
        } catch (err) {
            setError(err);
        } finally {
            setLoadingMore(false);
        }
    }, [currentPage, fetchData, lastDoc, hasMore, loadingMore]);

    const handleLoadMoreRecs = useCallback(async () => {
        if (loadingRecs || !hasMoreRecs) return;
        setLoadingRecs(true);
        try {
            const { newData, newLastDoc, newHasMore } = await fetchData('recomendaciones', lastRecDoc);
            setRecommendations(prev => [...prev, ...newData]);
            setLastRecDoc(newLastDoc);
            setHasMoreRecs(newHasMore);
        } catch (err) {
            console.error("Error cargando más recomendaciones", err);
        } finally {
            setLoadingRecs(false);
        }
    }, [fetchData, lastRecDoc, hasMoreRecs, loadingRecs]);

    const handleLoadMoreAffs = useCallback(async () => {
        if (loadingAffs || !hasMoreAffs) return;
        setLoadingAffs(true);
        try {
            const { newData, newLastDoc, newHasMore } = await fetchData('afiliados', lastAffDoc);
            setAffiliates(prev => [...prev, ...newData]);
            setLastAffDoc(newLastDoc);
            setHasMoreAffs(newHasMore);
        } catch (err) {
            console.error("Error cargando más afiliados", err);
        } finally {
            setLoadingAffs(false);
        }
    }, [fetchData, lastAffDoc, hasMoreAffs, loadingAffs]);

    const getCardComponent = (category) => ({
        'imagenes': ImagePromptCard, 'videos': ImagePromptCard,
        'descargas': DownloadCard, 'tutoriales': TutorialCard,
        'afiliados': AffiliateCard, 'recomendaciones': RecommendationCard
    })[category] || ImagePromptCard;
    
    const renderContent = () => {
        if (loading) return React.createElement(LoadingState, { message: 'Cargando...' });
        if (error) return React.createElement(ErrorState, { error });
        
        const handleShowDetails = (item) => { if (item.details || item.prompt || item.description) setModalItem(item); };

        if (searchQuery) {
            if (searchResults.length === 0) return React.createElement(EmptyState, { message: `No se encontraron resultados para "${searchQuery}".` });
            return React.createElement('div', { className: 'content-grid' }, searchResults.map(item => React.createElement(getCardComponent(item.category), { key: item.id, item, onShowDetails: handleShowDetails })));
        }
        
        if (currentPage === 'generador') return React.createElement(GeneratorPage);
        if (currentPage === 'sobre-mi') return React.createElement(AboutMe);
        if (currentPage === 'contacto') return React.createElement(ContactForm);
        if (currentPage === 'recursos') return React.createElement(ResourcesPage, {
            recommendations,
            affiliates,
            resourcesDisclaimer,
            onShowDetails: handleShowDetails,
            onLoadMoreRecs: handleLoadMoreRecs,
            onLoadMoreAffs: handleLoadMoreAffs,
            hasMoreRecs,
            hasMoreAffs,
            loadingRecs,
            loadingAffs
        });
        
        if (data.length === 0 && !hasMore) return React.createElement(EmptyState, { message: `Aún no hay contenido aquí. ¡Vuelve pronto!` });

        return React.createElement(React.Fragment, null, [
            React.createElement('div', { key: 'grid', className: 'content-grid' }, data.map(item => React.createElement(getCardComponent(item.category), { key: item.id, item, onShowDetails: handleShowDetails }))),
            hasMore && !loadingMore && React.createElement('div', { key: 'load-more', className: 'load-more-container' },
                React.createElement('button', { className: 'load-more-button', onClick: handleLoadMore }, 'Cargar más')
            ),
            loadingMore && React.createElement('div', { key: 'loading-more-spinner', className: 'loading-spinner', style: { marginTop: '2rem' } })
        ]);
    };
    
    const pages = {
        'imagenes': { name: 'Imágenes', path: './' },
        'videos': { name: 'Videos', path: 'videos.html' },
        'descargas': { name: 'Descargas', path: 'descargas.html' },
        'generador': { name: 'Generador', path: 'generador.html' },
        'tutoriales': { name: 'Tutoriales', path: 'tutoriales.html' },
        'recursos': { name: 'Recursos', path: 'recursos.html' },
        'sobre-mi': { name: 'Sobre Mí', path: 'sobre-mi.html' },
        'contacto': { name: 'Contacto', path: 'contacto.html' },
    };

    return React.createElement('div', {}, [
        React.createElement('header', { key: 'header', className: 'app-header' }, [
            React.createElement('h1', { key: 'title' }, 'TheRamzes'),
            React.createElement('p', { key: 'welcome', className: 'welcome-text' }, 'Bienvenido a mi universo creativo. Descubre, aprende y crea con la ayuda de la inteligencia artificial.'),
            React.createElement('div', { key: 'search', className: 'search-container' }, [
                 React.createElement('svg', { key: 'icon', className: 'search-icon', xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor" }, React.createElement('path', { d: "M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z" })),
                 React.createElement('input', { key: 'input', type: 'search', className: 'search-input', placeholder: 'Buscar en todo el sitio...', value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })
            ]),
            !searchQuery && React.createElement('nav', { key: 'nav', className: 'tabs-nav' },
                Object.keys(pages).map(pageKey => React.createElement('a', {
                    key: pageKey,
                    href: pages[pageKey].path,
                    className: `tab-button ${currentPage === pageKey ? 'active' : ''}`
                }, pages[pageKey].name))
            )
        ]),
        React.createElement('main', { key: 'main' }, [
            searchQuery && React.createElement('h2', { key: 'search-title', className: 'search-results-header' }, `Resultados para: "${searchQuery}"`),
            renderContent()
        ]),
        React.createElement('footer', { key: 'footer' }, [
            React.createElement('p', { key: 'copyright' }, `© ${new Date().getFullYear()} TheRamzes. Todos los derechos reservados.`),
            React.createElement('button', { key: 'privacy', onClick: () => setIsPolicyVisible(true), className: 'footer-link' }, 'Política de Privacidad y Términos de Uso')
        ]),
        React.createElement(PrivacyPolicyModal, { key: 'privacy-modal', isVisible: isPolicyVisible, onClose: () => setIsPolicyVisible(false) }),
        modalItem && React.createElement(DetailModal, { key: 'detail-modal', item: modalItem, onClose: () => setModalItem(null) })
    ]);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
