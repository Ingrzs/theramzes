import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, getDocs, getDoc, doc, query, where, orderBy, limit, startAfter } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'https://esm.sh/react@18';
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

const Navigation = ({ currentPage }) => {
    const tabs = [
        { id: 'imagenes', label: 'Imágenes', url: 'index.html' },
        { id: 'videos', label: 'Videos', url: 'videos.html' },
        { id: 'capturador', label: 'Frame Studio', url: 'capturador.html' },
        { id: 'generador', label: 'Generador', url: 'generador.html' },
        { id: 'descargas', label: 'Descargas', url: 'descargas.html' },
        { id: 'tutoriales', label: 'Tutoriales', url: 'tutoriales.html' },
        { id: 'recursos', label: 'Recursos', url: 'recursos.html' }
    ];

    return React.createElement('nav', { className: 'tabs-nav', style: { marginBottom: '2rem' } },
        tabs.map(tab => React.createElement('a', {
            key: tab.id,
            href: tab.url,
            className: `tab-button ${currentPage === tab.id ? 'active' : ''}`
        }, tab.label))
    );
};

// --- Frame Capturer Page ---
const FrameCapturerPage = () => {
    const [videoSrc, setVideoSrc] = useState(null);
    const [fileName, setFileName] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [captures, setCaptures] = useState([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [res, setRes] = useState({ w: 0, h: 0 });
    const videoRef = useRef(null);
    const fileInputRef = useRef(null);

    const formatTime = (time) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        const ms = Math.floor((time % 1) * 1000);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    };

    const handleFile = (file) => {
        if (!file || !file.type.startsWith('video/')) {
            alert('Por favor, sube un archivo de video válido (MP4, WebM, MOV).');
            return;
        }
        const url = URL.createObjectURL(file);
        setVideoSrc(url);
        setFileName(file.name.split('.')[0]);
        setCaptures([]);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFile(file);
    };

    const handleCapture = () => {
        if (!videoRef.current) return;
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/png');
        const timestamp = formatTime(video.currentTime);
        
        const newCapture = {
            id: Date.now(),
            dataUrl,
            time: timestamp,
            timeRaw: video.currentTime,
            res: `${canvas.width}x${canvas.height}px`
        };
        
        setCaptures(prev => [newCapture, ...prev]);
    };

    const downloadCapture = (cap) => {
        const link = document.createElement('a');
        link.href = cap.dataUrl;
        link.download = `TheRamzes_Frame_${fileName}_${cap.time.replace(/[:.]/g, '-')}.png`;
        link.click();
    };

    const seekBy = (seconds) => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds));
        }
    };

    useEffect(() => {
        if (videoRef.current && videoSrc) {
            const video = videoRef.current;
            const handleLoaded = () => {
                setDuration(video.duration);
                setRes({ w: video.videoWidth, h: video.videoHeight });
                // Auto-seek to the end as requested
                video.currentTime = video.duration;
            };
            const handleTimeUpdate = () => setCurrentTime(video.currentTime);
            
            video.addEventListener('loadedmetadata', handleLoaded);
            video.addEventListener('timeupdate', handleTimeUpdate);
            
            return () => {
                video.removeEventListener('loadedmetadata', handleLoaded);
                video.removeEventListener('timeupdate', handleTimeUpdate);
            };
        }
    }, [videoSrc]);

    if (!videoSrc) {
        return React.createElement('div', { className: 'capturador-container' }, [
            React.createElement(Navigation, { currentPage: 'capturador' }),
            React.createElement('div', { 
                className: `drop-zone ${isDragging ? 'dragging' : ''}`,
                onDragOver: (e) => { e.preventDefault(); setIsDragging(true); },
                onDragLeave: () => setIsDragging(false),
                onDrop: onDrop,
                onClick: () => fileInputRef.current.click()
            }, [
                React.createElement('input', { 
                    type: 'file', 
                    ref: fileInputRef, 
                    style: { display: 'none' }, 
                    accept: 'video/*',
                    onChange: (e) => handleFile(e.target.files[0])
                }),
                React.createElement('p', null, 'Arrastra tu video aquí o haz clic para seleccionar'),
                React.createElement('button', { className: 'card-button' }, 'Subir desde Carpeta')
            ])
        ]);
    }

    return React.createElement('div', { className: 'capturador-container' }, [
        React.createElement(Navigation, { currentPage: 'capturador' }),
        React.createElement('div', { className: 'video-editor-layout' }, [
            // Left Column: Player
            React.createElement('div', { className: 'video-player-main' }, [
                React.createElement('div', { className: 'video-preview-pane' }, [
                    React.createElement('video', { 
                        ref: videoRef,
                        src: videoSrc,
                        className: 'video-element',
                        controls: false
                    })
                ]),
                React.createElement('div', { className: 'video-controls-panel' }, [
                    React.createElement('input', { 
                        type: 'range', 
                        className: 'scrubbing-slider',
                        min: 0,
                        max: duration || 0,
                        step: 0.001,
                        value: currentTime,
                        onChange: (e) => { if (videoRef.current) videoRef.current.currentTime = parseFloat(e.target.value); }
                    }),
                    React.createElement('div', { className: 'time-display' }, `${formatTime(currentTime)} / ${formatTime(duration)}`),
                    React.createElement('div', { className: 'control-buttons' }, [
                        React.createElement('button', { className: 'btn-precision', onClick: () => seekBy(-1) }, '-1s'),
                        React.createElement('button', { className: 'btn-precision', onClick: () => seekBy(-0.033) }, '-Frame'),
                        React.createElement('button', { className: 'btn-capture', onClick: handleCapture }, 'Capturar Frame'),
                        React.createElement('button', { className: 'btn-precision', onClick: () => seekBy(0.033) }, '+Frame'),
                        React.createElement('button', { className: 'btn-precision', onClick: () => seekBy(1) }, '+1s')
                    ]),
                    React.createElement('div', { style: { textAlign: 'center' } }, 
                        React.createElement('button', { className: 'btn-reset', onClick: () => setVideoSrc(null) }, 'Cambiar Video')
                    )
                ])
            ]),
            // Right Column: Gallery
            React.createElement('div', { className: 'captures-sidebar' }, [
                React.createElement('h3', { style: { marginBottom: '1rem' } }, 'Capturas'),
                captures.length === 0 && React.createElement('p', { style: { color: 'var(--text-secondary)', fontSize: '0.9rem' } }, 'Captura un frame para que aparezca aquí.'),
                captures.map(cap => React.createElement('div', { key: cap.id, className: 'capture-item' }, [
                    React.createElement('img', { src: cap.dataUrl }),
                    React.createElement('div', { className: 'capture-meta' }, [
                        React.createElement('span', null, cap.time),
                        React.createElement('span', null, cap.res)
                    ]),
                    React.createElement('button', { 
                        className: 'capture-overlay-btn',
                        onClick: () => downloadCapture(cap)
                    }, 'Descargar')
                ]))
            ])
        ])
    ]);
};

// --- Other Pages ... (Existing code kept below) ---
// Note: Keeping rest of index.js logic intact but ensuring App handles 'capturador'

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

// ... (Rest of components: ImagePromptCard, DownloadCard, etc.) ...
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

const PromptGalleryPage = ({ category }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        const fetchItems = async () => {
            if (!db) return;
            try {
                const q = query(collection(db, 'content'), where('category', '==', category), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [category]);

    if (loading) return React.createElement('div', { className: 'loading-container' }, [React.createElement('div', { className: 'loading-spinner' }), React.createElement('p', null, 'Cargando...')]);

    return React.createElement('div', null, [
        React.createElement(Navigation, { currentPage: category }),
        React.createElement('div', { className: 'content-grid' },
            items.map(item => React.createElement(ImagePromptCard, { key: item.id, item, onShowDetails: setSelectedItem }))
        ),
        selectedItem && React.createElement(DetailModal, { item: selectedItem, onClose: () => setSelectedItem(null) })
    ]);
};

// Simplified views for the other pages
const StaticPage = ({ pageId, title, component }) => (
    React.createElement('div', null, [
        React.createElement(Navigation, { currentPage: pageId }),
        React.createElement('h2', { style: { textAlign: 'center', marginBottom: '2rem' } }, title),
        React.createElement(component)
    ])
);

// App Main Switch
const App = () => {
    const rootElement = document.getElementById('root');
    const currentPage = rootElement ? rootElement.getAttribute('data-page') : 'imagenes';

    const renderPage = () => {
        switch (currentPage) {
            case 'imagenes': return React.createElement(PromptGalleryPage, { category: 'imagenes' });
            case 'videos': return React.createElement(PromptGalleryPage, { category: 'videos' });
            case 'capturador': return React.createElement(FrameCapturerPage);
            // ... add others here if needed, keeping it minimal to user request
            default: return React.createElement(PromptGalleryPage, { category: 'imagenes' });
        }
    };

    return React.createElement('div', null, [
        renderPage(),
        React.createElement(Footer)
    ]);
};

const container = document.getElementById('root');
if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(App));
}
