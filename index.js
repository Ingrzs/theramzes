
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, getDocs, getDoc, doc, query, where, orderBy, limit, startAfter } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import React, { useState, useEffect, useCallback, useRef } from 'https://esm.sh/react@18';
import ReactDOM from 'https://esm.sh/react-dom@18/client';
import Fuse from 'https://esm.sh/fuse.js@7.0.0';
import { toPng } from 'https://esm.sh/html-to-image@1.11.11';

// La configuración de Firebase se inyecta aquí durante el proceso de despliegue.
const firebaseConfig = {
    apiKey: "__FIREBASE_API_KEY__", 
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
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23888888'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

const handleImageError = (e) => {
    if (e.currentTarget.src !== PLACEHOLDER_IMAGE) {
        e.currentTarget.src = PLACEHOLDER_IMAGE;
    }
};

// --- Components ---

const Footer = () => (
    React.createElement('footer', {}, [
        React.createElement('div', { style: { marginBottom: '1rem' } }, `© ${new Date().getFullYear()} TheRamzes`),
        React.createElement('div', { style: { display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' } }, [
            React.createElement('a', { href: 'politicas.html', className: 'footer-link' }, 'Políticas de Privacidad'),
            React.createElement('a', { href: 'terminos.html', className: 'footer-link' }, 'Términos de Uso'),
            React.createElement('a', { href: 'contacto.html', className: 'footer-link' }, 'Contacto')
        ])
    ])
);

const DetailModal = ({ item, onClose }) => {
    if (!item) return null;
    
    useEffect(() => {
        const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return React.createElement('div', { className: 'modal-backdrop', onClick: onClose }, [
        React.createElement('div', { key: 'content', className: 'modal-content', onClick: e => e.stopPropagation() }, [
            React.createElement('div', { key: 'header', className: 'modal-header' }, [
                React.createElement('h2', { key: 'title' }, item.title),
                React.createElement('button', { key: 'close', className: 'modal-close-button', onClick: onClose }, '×')
            ]),
            React.createElement('div', { key: 'body', className: 'modal-body' }, [
                item.imageUrl && React.createElement('img', { key: 'img', src: optimizeImageUrl(item.imageUrl, 800), className: 'detail-modal-image', alt: item.title }),
                item.description && React.createElement('p', { key: 'desc' }, item.description),
                
                item.details && React.createElement('div', { key: 'details-block' }, [
                    React.createElement('h3', { key: 't-det' }, 'Detalles e Instrucciones'),
                    React.createElement('div', { key: 'det', className: 'detail-modal-details' }, item.details)
                ]),

                item.prompt && React.createElement('div', { key: 'prompt-block', className: 'detail-modal-prompt' }, [
                    React.createElement('h3', { key: 't-p' }, 'Prompt'),
                    React.createElement('div', { key: 'p-cont', className: 'prompt-container visible', style: { maxHeight: 'none' } }, [
                         React.createElement('p', { key: 'p-text' }, item.prompt),
                         React.createElement('button', { 
                            key: 'copy', 
                            className: 'copy-button',
                            onClick: () => navigator.clipboard.writeText(item.prompt).then(() => alert('Copiado')) 
                         }, 'Copiar')
                    ])
                ]),

                (item.downloadUrl || item.linkUrl) && React.createElement('div', { key: 'action', style: { marginTop: '2rem', textAlign: 'center' } }, 
                    React.createElement('a', { 
                        href: item.downloadUrl || item.linkUrl, 
                        target: '_blank', 
                        rel: 'noopener noreferrer',
                        className: 'card-button',
                        style: { display: 'inline-block', minWidth: '200px', padding: '1rem' }
                    }, item.downloadUrl ? 'Descargar Recurso' : 'Ir al Sitio / Ver Tutorial')
                )
            ])
        ])
    ]);
};

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

const ContactForm = () => {
    return React.createElement('div', { className: 'contact-container' }, [
        React.createElement('h2', { key: 't' }, 'Contacto'),
        React.createElement('p', { key: 'sub', style: { textAlign: 'center', marginBottom: '2rem', color: 'var(--text-secondary)' } }, '¿Tienes alguna pregunta o propuesta? Envíame un mensaje.'),
        React.createElement('form', { 
            key: 'form', 
            className: 'contact-form',
            action: 'mailto:contacto@theramzes.com', 
            method: 'POST',
            enctype: 'text/plain'
        }, [
             React.createElement('div', { className: 'form-group' }, [
                React.createElement('label', {}, 'Asunto'),
                React.createElement('input', { type: 'text', name: 'subject', required: true })
             ]),
             React.createElement('div', { className: 'form-group' }, [
                React.createElement('label', {}, 'Mensaje'),
                React.createElement('textarea', { name: 'body', rows: 5, required: true })
             ]),
             React.createElement('button', { type: 'submit', className: 'submit-button' }, 'Enviar Email')
        ])
    ]);
};

// --- Extract TweetCardUI Component to fix Focus Issues ---
// Updated to support Verification Badges and Platform-specific layouts
const TweetCardUI = ({ 
    txt, 
    isEditable = false, 
    theme, 
    font, 
    align, 
    avatarUrl, 
    name, 
    setName, 
    username, 
    setUsername, 
    onAvatarClick,
    verificationType = 'none' // 'none', 'tw', 'fb'
}) => {
    const isDark = theme === 'dark';
    const twBadge = "https://i.ibb.co/Gv7hRLfZ/twitter.jpg";
    const fbBadge = "https://i.ibb.co/Xx8B1kBg/Gemini-Generated-Image-hzflazhzflazhzfl.png";

    const badgeStyle = {
        width: '18px',
        height: '18px',
        marginLeft: '4px',
        verticalAlign: 'middle',
        borderRadius: '50%',
        display: 'inline-block'
    };

    const fbMetaStyle = {
        fontSize: '0.8rem',
        color: isDark ? '#a0a0a0' : '#65676b',
        marginTop: '2px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
    };

    return React.createElement('div', { 
        className: `tweet-card ${theme} ${font} ${align} ${!isEditable ? 'tweet-card-batch' : ''}`,
        style: !isEditable ? { marginBottom: '20px' } : {} 
    }, [
        React.createElement('div', { key: 'header', className: 'tweet-header' }, [
            React.createElement('img', { 
                key: 'avatar', 
                src: avatarUrl, 
                className: 'tweet-avatar', 
                onClick: isEditable ? onAvatarClick : undefined 
            }),
            React.createElement('div', { key: 'info', className: 'tweet-user-info text-left' }, [
                // Fila de Nombre + Badge
                React.createElement('div', { key: 'name-row', style: { display: 'flex', alignItems: 'center', flexWrap: 'nowrap' } }, [
                    isEditable 
                    ? React.createElement('input', { 
                        key: 'name-in', 
                        className: 'editable-input tweet-name', 
                        style: { width: 'auto', flexShrink: 1 },
                        value: name, 
                        onChange: e => setName(e.target.value), 
                        placeholder: "Nombre" 
                    })
                    : React.createElement('div', { key: 'name', className: 'tweet-name' }, name),
                    
                    // Mostrar badge si es TW o FB
                    verificationType !== 'none' && React.createElement('img', { 
                        key: 'badge', 
                        src: verificationType === 'tw' ? twBadge : fbBadge,
                        style: badgeStyle,
                        alt: 'verificado'
                    }),

                    // TW Layout: @usuario va en la misma fila para TW si se desea, pero el usuario pidió: 
                    // TW: Nombre de usuario -> Ícono de verificación -> @usuario (todo en línea o estilo twitter)
                    // Para que se vea como la imagen 2 de TW:
                    verificationType === 'tw' && React.createElement('div', { 
                        key: 'tw-at', 
                        className: 'tweet-username', 
                        style: { marginLeft: '6px', fontSize: '0.9rem', whiteSpace: 'nowrap' } 
                    }, [
                        isEditable 
                        ? React.createElement('input', { 
                            key: 'at-in', 
                            className: 'editable-input', 
                            style: { width: '80px' },
                            value: username, 
                            onChange: e => setUsername(e.target.value), 
                            placeholder: "@usuario" 
                        })
                        : username,
                        React.createElement('span', { key: 'dot', style: { margin: '0 4px' } }, '·'),
                        React.createElement('span', { key: 'time' }, '5h')
                    ])
                ]),
                
                // FB Meta Layout: 21 min · Globe
                verificationType === 'fb' && React.createElement('div', { key: 'fb-meta', style: fbMetaStyle }, [
                    React.createElement('span', { key: 't' }, '21 min'),
                    React.createElement('span', { key: 'd' }, '·'),
                    React.createElement('svg', { 
                        key: 'g', 
                        viewBox: '0 0 16 16', 
                        width: '12', 
                        height: '12', 
                        fill: 'currentColor' 
                    }, React.createElement('path', { d: 'M8 0a8 8 0 100 16A8 8 0 008 0zM2.04 4.326c.325 1.329 2.532 2.54 3.71 2.54.147 0 .294-.012.44-.025a1.549 1.549 0 011.05-.14 1.499 1.499 0 01.95.703c.163.288.161.597.019.892-.037.078-.08.153-.125.225-.147.231-.342.39-.582.458l-.05.013c-.168.037-.333.051-.493.039a4.106 4.106 0 01-.827-.13l-.064-.019c-.421-.125-.75-.382-.954-.772a.499.499 0 00-.469-.257.5.5 0 00-.45.316c-.338.869-.66 1.595-.909 1.929-.143.194-.485.373-.72.373-.584 0-1.109-.313-1.404-.783-.277-.447-.439-1.125-.439-1.89 0-1.457.746-2.738 1.867-3.483zM8 15c-1.454 0-2.798-.412-3.93-1.121.267-.482.699-.956 1.246-.956.143 0 .293.01.443.024.58.051 1.038-.096 1.388-.441.327-.322.512-.749.546-1.245l.007-.068c.032-.338.01-.683-.07-1.03l-.013-.056a1.991 1.991 0 01.125-1.488c.282-.542.721-.971 1.235-1.207.14-.065.29-.12.44-.165.772-.243 1.537-.088 2.126.37.159.121.324.227.494.316.542.283 1.157.34 1.767.14.069-.022.14-.048.206-.078.298-.135.547-.354.74-.635.161-.233.301-.512.42-.835A6.957 6.957 0 0115 8c0 3.86-3.14 7-7 7z' }))
                ]),

                // Si no es FB ni TW verificado, mostrar el username normal abajo (estilo original)
                verificationType === 'none' && (
                    isEditable 
                    ? React.createElement('input', { 
                        key: 'user-in', 
                        className: 'editable-input tweet-username', 
                        value: username, 
                        onChange: e => setUsername(e.target.value), 
                        placeholder: "@usuario" 
                    })
                    : React.createElement('div', { key: 'user', className: 'tweet-username' }, username)
                )
            ])
        ]),
        React.createElement('div', { key: 'body', className: 'tweet-body' }, txt)
    ])
};

// --- Generator Page Component ---
const GeneratorPage = () => {
    const [name, setName] = useState(() => {
        try { return localStorage.getItem('theramzes_gen_name') || 'Nombre Usuario'; } catch (e) { return 'Nombre Usuario'; }
    });
    const [username, setUsername] = useState(() => {
        try { return localStorage.getItem('theramzes_gen_username') || '@usuario'; } catch (e) { return '@usuario'; }
    });
    const [avatarUrl, setAvatarUrl] = useState(() => {
        try { return localStorage.getItem('theramzes_gen_avatar') || DEFAULT_AVATAR; } catch (e) { return DEFAULT_AVATAR; }
    });
    
    useEffect(() => { try { localStorage.setItem('theramzes_gen_name', name); } catch (e) {} }, [name]);
    useEffect(() => { try { localStorage.setItem('theramzes_gen_username', username); } catch (e) {} }, [username]);
    useEffect(() => { try { localStorage.setItem('theramzes_gen_avatar', avatarUrl); } catch (e) {} }, [avatarUrl]);

    const [font, setFont] = useState('font-inter'); 
    const [align, setAlign] = useState('text-left');
    const [theme, setTheme] = useState('dark'); 
    const [verificationType, setVerificationType] = useState('none'); // 'none', 'tw', 'fb'
    
    const [inputText, setInputText] = useState('Haz clic en el nombre o foto para editar.\nEscribe aquí tu frase.\nUsa "Enter" para crear nuevas imágenes.');

    const [generatedImages, setGeneratedImages] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const fileInputRef = useRef(null);
    const batchContainerRef = useRef(null);

    // --- Smart Text Cleaning Helper ---
    const cleanLineText = (text) => {
        let cleaned = text.trim();
        cleaned = cleaned.replace(/^\d+\s*[\.\-\)]+\s*/, '');
        if (cleaned.length > 1 && cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.substring(1, cleaned.length - 1);
        }
        return cleaned.trim();
    };

    const handleAvatarClick = () => { if (fileInputRef.current) fileInputRef.current.click(); };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setAvatarUrl(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleClearText = () => {
        if (window.confirm("¿Borrar todo el texto y los resultados?")) {
            setInputText("");
            setGeneratedImages([]);
        }
    };

    const handleGenerate = async () => {
        const lines = inputText.split('\n')
            .map(l => cleanLineText(l))
            .filter(l => l.length > 0)
            .slice(0, 5); 
        
        if (lines.length === 0) {
            alert("Por favor escribe al menos una frase.");
            return;
        }

        setIsGenerating(true);
        setGeneratedImages([]);
        const bgColor = theme === 'dark' ? '#000000' : '#ffffff';

        setTimeout(async () => {
            const newImages = [];
            if (batchContainerRef.current) {
                const nodes = batchContainerRef.current.querySelectorAll('.tweet-card-batch');
                for (let i = 0; i < nodes.length; i++) {
                    try {
                        const dataUrl = await toPng(nodes[i], { quality: 1.0, pixelRatio: 3, backgroundColor: bgColor });
                        newImages.push(dataUrl);
                    } catch (err) { console.error("Error", err); }
                }
            }
            setGeneratedImages(newImages);
            setIsGenerating(false);
        }, 800); 
    };

    const handleOpenImage = (dataUrl) => {
        const win = window.open();
        if (win) {
            const viewerBg = theme === 'light' ? '#e0e0e0' : '#121212';
            const textColor = theme === 'light' ? '#000000' : '#e0e0e0';
            win.document.write(`<html><body style="background:${viewerBg}; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0;"><img src="${dataUrl}" style="max-width:90%; max-height:80vh; box-shadow:0 0 20px rgba(0,0,0,0.5); border-radius:10px;" /><p style="color:${textColor}; font-family:sans-serif; margin-top:20px;">Mantén presionada la imagen para guardarla.</p></body></html>`);
        } else { alert("Permite las ventanas emergentes."); }
    };

    const handleVerificationChange = (type) => {
        if (verificationType === type) {
            setVerificationType('none');
        } else {
            setVerificationType(type);
        }
    };

    const optionStyle = { backgroundColor: '#1e1e1e', color: '#e0e0e0' };

    return React.createElement('div', { className: 'generator-container' }, [
        React.createElement('input', { key: 'file', type: 'file', ref: fileInputRef, style: { display: 'none' }, accept: 'image/*', onChange: handleImageUpload }),
        React.createElement('h2', { key: 'title', className: 'text-center' }, 'Generador de Frases'),
        React.createElement('p', { key: 'instr', style: { textAlign: 'center', color: '#a0a0a0', fontSize: '0.9rem', marginBottom: '1rem' } }, 'Haz clic en el texto o foto de la tarjeta para editarlos.'),

        React.createElement('div', { key: 'preview', className: 'preview-area' }, [
             React.createElement(TweetCardUI, { 
                 key: 'live', 
                 txt: inputText.split('\n')[0] || 'Escribe algo...', 
                 isEditable: true,
                 theme, font, align, avatarUrl, name, setName, username, setUsername, onAvatarClick: handleAvatarClick,
                 verificationType
             })
        ]),

        React.createElement('div', { key: 'controls', className: 'control-panel' }, [
            React.createElement('div', { key: 'row1', className: 'control-row' }, [
                 React.createElement('div', { className: 'control-group' }, [
                    React.createElement('label', {}, 'Fuente'),
                    React.createElement('div', { className: 'control-select' }, 
                        React.createElement('select', { style: { background: 'transparent', border: 'none', color: 'inherit', width: '100%' }, value: font, onChange: e => setFont(e.target.value) }, [
                            React.createElement('option', { value: 'font-inter', style: optionStyle }, 'Inter'),
                            React.createElement('option', { value: 'font-poppins', style: optionStyle }, 'Poppins'),
                            React.createElement('option', { value: 'font-lato', style: optionStyle }, 'Lato'),
                            React.createElement('option', { value: 'font-montserrat', style: optionStyle }, 'Montserrat'),
                            React.createElement('option', { value: 'font-bebas', style: optionStyle }, 'Bebas Neue'),
                            React.createElement('option', { value: 'font-oswald', style: optionStyle }, 'Oswald'),
                            React.createElement('option', { value: 'font-merriweather', style: optionStyle }, 'Merriweather'),
                            React.createElement('option', { value: 'font-abril', style: optionStyle }, 'Abril'),
                            React.createElement('option', { value: 'font-serif', style: optionStyle }, 'Playfair'),
                            React.createElement('option', { value: 'font-caveat', style: optionStyle }, 'Caveat'),
                            React.createElement('option', { value: 'font-shadows', style: optionStyle }, 'Shadows'),
                            React.createElement('option', { value: 'font-pacifico', style: optionStyle }, 'Pacifico'),
                            React.createElement('option', { value: 'font-dancing', style: optionStyle }, 'Dancing'),
                            React.createElement('option', { value: 'font-inconsolata', style: optionStyle }, 'Inconsolata'),
                        ])
                    )
                ]),
                React.createElement('div', { className: 'control-group' }, [
                    React.createElement('label', {}, 'Alineación'),
                    React.createElement('div', { className: 'control-btn-group' }, [
                        React.createElement('button', { className: `control-btn ${align === 'text-left' ? 'active' : ''}`, onClick: () => setAlign('text-left') }, 'Izq'),
                        React.createElement('button', { className: `control-btn ${align === 'text-center' ? 'active' : ''}`, onClick: () => setAlign('text-center') }, 'Cen'),
                        React.createElement('button', { className: `control-btn ${align === 'text-right' ? 'active' : ''}`, onClick: () => setAlign('text-right') }, 'Der'),
                        React.createElement('button', { className: `control-btn ${align === 'text-justify' ? 'active' : ''}`, onClick: () => setAlign('text-justify') }, 'Just'),
                    ])
                ]),
                React.createElement('div', { className: 'control-group' }, [
                    React.createElement('label', {}, 'Tema'),
                    React.createElement('div', { className: 'control-btn-group' }, [
                        React.createElement('button', { className: `control-btn ${theme === 'dark' ? 'active' : ''}`, onClick: () => setTheme('dark') }, 'Oscuro'),
                        React.createElement('button', { className: `control-btn ${theme === 'light' ? 'active' : ''}`, onClick: () => setTheme('light') }, 'Claro'),
                    ])
                ]),
                // NUEVA SECCIÓN: Verificación FB / TW
                React.createElement('div', { className: 'control-group' }, [
                    React.createElement('label', {}, 'Verificación'),
                    React.createElement('div', { className: 'control-btn-group' }, [
                        React.createElement('button', { 
                            className: `control-btn ${verificationType === 'fb' ? 'active' : ''}`, 
                            onClick: () => handleVerificationChange('fb'),
                            title: 'Facebook Verification'
                        }, 'FB'),
                        React.createElement('button', { 
                            className: `control-btn ${verificationType === 'tw' ? 'active' : ''}`, 
                            onClick: () => handleVerificationChange('tw'),
                            title: 'Twitter Verification'
                        }, 'TW'),
                    ])
                ])
            ]),
            React.createElement('div', { key: 'row2', className: 'control-group' }, [
                React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' } }, [
                    React.createElement('label', {}, 'Contenido (Separa con "Enter")'),
                    React.createElement('button', { onClick: handleClearText, className: 'control-action-btn' }, 'Limpiar')
                ]),
                React.createElement('textarea', { className: 'control-input', rows: 4, value: inputText, onChange: e => setInputText(e.target.value), placeholder: "Escribe aquí..." })
            ]),
        ]),

        React.createElement('button', { key: 'gen-btn', className: 'action-btn', onClick: handleGenerate, disabled: isGenerating }, isGenerating ? 'Generando...' : 'Generar Imágenes (Max 5)'),

        generatedImages.length > 0 && React.createElement('div', { key: 'results', className: 'generated-results' }, [
            React.createElement('h3', { key: 'rt', className: 'text-center' }, 'Resultados'),
            generatedImages.map((img, idx) => 
                React.createElement('div', { key: idx, className: 'result-item' }, [
                    React.createElement('img', { src: img, className: 'result-img' }),
                    React.createElement('button', { className: 'card-button', style: { width: '100%' }, onClick: () => handleOpenImage(img) }, 'Abrir Imagen')
                ])
            )
        ]),

        React.createElement('div', { key: 'feedback', className: 'feedback-container' }, [
            React.createElement('h4', { className: 'feedback-title' }, '💡 Sugerencias y Pedidos'),
            React.createElement('p', { className: 'feedback-text' }, '¿Tienes ideas para mejorar el generador o necesitas generar más de 100 imágenes?'),
            React.createElement('a', { href: 'contacto.html?subject=Feedback/Lotes', className: 'feedback-link' }, '📩 Contáctame')
        ]),

        isGenerating && React.createElement('div', { 
            key: 'batch', ref: batchContainerRef,
            style: { position: 'fixed', left: '0', top: '0', width: '600px', zIndex: -1000, opacity: 0, pointerEvents: 'none' } 
        }, inputText.split('\n').map(l => cleanLineText(l)).filter(l => l.length > 0).slice(0, 5).map((line, idx) => 
            React.createElement(TweetCardUI, { 
                key: idx, 
                txt: line, 
                isEditable: false,
                theme, font, align, avatarUrl, name, username,
                verificationType
            })
        ))
    ]);
};

// --- App Component (Logic restored for Pagination) ---
const App = () => {
    const [page, setPage] = useState('imagenes');
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Pagination State
    const [lastDoc, setLastDoc] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const ITEMS_PER_PAGE = 12;
    const loaderRef = useRef(null);

    useEffect(() => {
        const rootEl = document.getElementById('root');
        const pageAttr = rootEl ? rootEl.getAttribute('data-page') : 'imagenes';
        setPage(pageAttr);
    }, []);

    // Initial Load Logic with Pagination Support
    useEffect(() => {
        if (['generador', 'sobre-mi', 'contacto'].includes(page)) {
            setLoading(false);
            return;
        }

        const fetchInitialContent = async () => {
            setLoading(true);
            setItems([]);
            setLastDoc(null);
            setHasMore(true);

            if (!db) { setLoading(false); return; }
            
            try {
                let queries = [];
                if (page === 'recursos') {
                    const q1 = query(collection(db, "content"), where("category", "==", "recomendaciones"), orderBy("createdAt", "desc"), limit(20));
                    const q2 = query(collection(db, "content"), where("category", "==", "afiliados"), orderBy("createdAt", "desc"), limit(20));
                    const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
                    const docs = [...s1.docs, ...s2.docs].map(d => ({ id: d.id, ...d.data() }));
                    docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                    setItems(docs);
                    setHasMore(false);
                } else {
                    const q = query(
                        collection(db, "content"), 
                        where("category", "==", page), 
                        orderBy("createdAt", "desc"), 
                        limit(ITEMS_PER_PAGE)
                    );
                    const snapshot = await getDocs(q);
                    const newItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
                    
                    setItems(newItems);
                    setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
                    setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
                }
            } catch (e) {
                console.error("Error fetching:", e);
            } finally {
                setLoading(false);
            }
        };
        
        fetchInitialContent();
    }, [page]);

    const handleLoadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !lastDoc || ['generador', 'sobre-mi', 'contacto', 'recursos'].includes(page)) return;
        
        setLoadingMore(true);
        try {
            const q = query(
                collection(db, "content"), 
                where("category", "==", page), 
                orderBy("createdAt", "desc"), 
                startAfter(lastDoc),
                limit(ITEMS_PER_PAGE)
            );
            
            const snapshot = await getDocs(q);
            const newItems = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            
            if (newItems.length > 0) {
                setItems(prev => [...prev, ...newItems]);
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
                setHasMore(newItems.length === ITEMS_PER_PAGE);
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Error loading more:", error);
        } finally {
            setLoadingMore(false);
        }
    }, [hasMore, loadingMore, lastDoc, page]);

    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const target = entries[0];
            if (target.isIntersecting && hasMore && !loadingMore && !loading) {
                handleLoadMore();
            }
        }, { rootMargin: '200px' });

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => {
            if (loaderRef.current) {
                observer.unobserve(loaderRef.current);
            }
            observer.disconnect();
        };
    }, [hasMore, loadingMore, loading, handleLoadMore]);

    const filteredItems = items.filter(item => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return item.title.toLowerCase().includes(term) || 
               (item.prompt && item.prompt.toLowerCase().includes(term)) ||
               (item.description && item.description.toLowerCase().includes(term));
    });

    const renderContent = () => {
        if (loading) return React.createElement('div', {className: 'loading-container'}, React.createElement('div', {className: 'loading-spinner'}), React.createElement('p', {}, 'Cargando contenido...'));
        
        if (page === 'generador') return React.createElement(GeneratorPage);
        if (page === 'sobre-mi') return React.createElement(AboutMe);
        if (page === 'contacto') return React.createElement(ContactForm);

        if (filteredItems.length === 0) return React.createElement('div', {className: 'empty-state-container'}, 'No se encontró contenido.');

        return React.createElement('div', {}, [
            React.createElement('div', {className: 'content-grid'}, filteredItems.map(item => {
                if (page === 'imagenes' || page === 'videos') return React.createElement(ImagePromptCard, {key: item.id, item, onShowDetails: setSelectedItem});
                if (page === 'descargas') return React.createElement(DownloadCard, {key: item.id, item, onShowDetails: setSelectedItem});
                if (page === 'tutoriales') return React.createElement(TutorialCard, {key: item.id, item, onShowDetails: setSelectedItem});
                if (page === 'recursos') {
                    if (item.category === 'afiliados') return React.createElement(AffiliateCard, {key: item.id, item, onShowDetails: setSelectedItem});
                    return React.createElement(RecommendationCard, {key: item.id, item, onShowDetails: setSelectedItem});
                }
                return null;
            })),
            hasMore && !searchTerm && React.createElement('div', { 
                ref: loaderRef, 
                className: 'loading-sentinel',
                style: { textAlign: 'center', padding: '2rem', opacity: 0.7, width: '100%' }
            }, loadingMore ? React.createElement('div', {className: 'loading-spinner'}) : '')
        ]);
    };

    const navLinks = [
        {id: 'imagenes', label: 'Imágenes', link: './'},
        {id: 'videos', label: 'Videos', link: 'videos.html'},
        {id: 'generador', label: 'Generador', link: 'generador.html'},
        {id: 'descargas', label: 'Descargas', link: 'descargas.html'},
        {id: 'tutoriales', label: 'Tutoriales', link: 'tutoriales.html'},
        {id: 'recursos', label: 'Recursos', link: 'recursos.html'},
        {id: 'sobre-mi', label: 'Sobre Mí', link: 'sobre-mi.html'},
    ];

    return React.createElement('div', {}, [
        !['generador', 'sobre-mi', 'contacto'].includes(page) && React.createElement('div', { key: 'search', className: 'search-container' }, [
            React.createElement('input', {
                className: 'search-input',
                placeholder: 'Buscar...',
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value)
            })
        ]),

        React.createElement('nav', { key: 'nav', className: 'tabs-nav' }, 
            navLinks.map(tab => React.createElement('a', {
                key: tab.id,
                href: tab.link,
                className: `tab-button ${page === tab.id ? 'active' : ''}`
            }, tab.label))
        ),

        React.createElement('div', { key: 'main', style: { marginTop: '2rem' } }, renderContent()),

        React.createElement(Footer, { key: 'footer' }),

        selectedItem && React.createElement(DetailModal, { item: selectedItem, onClose: () => setSelectedItem(null) })
    ]);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
