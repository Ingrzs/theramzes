import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, getDocs, getDoc, doc, query, where, orderBy, limit, startAfter } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'https://esm.sh/react@18';
import ReactDOM from 'https://esm.sh/react-dom@18/client';
import Fuse from 'https://esm.sh/fuse.js@7.0.0';
import { toPng } from 'https://esm.sh/html-to-image@1.11.11';

// Configuración de Firebase
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

// --- Global Components ---
const Footer = () => React.createElement('footer', {}, [
    React.createElement('div', { key: 'copy', style: { marginBottom: '1rem' } }, `© ${new Date().getFullYear()} TheRamzes`),
    React.createElement('div', { key: 'links', style: { display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' } }, [
        React.createElement('a', { key: 'p', href: 'politicas.html', className: 'footer-link' }, 'Políticas de Privacidad'),
        React.createElement('a', { key: 't', href: 'terminos.html', className: 'footer-link' }, 'Términos de Uso'),
        React.createElement('a', { key: 'c', href: 'contacto.html', className: 'footer-link' }, 'Contacto'),
        React.createElement('a', { key: 's', href: 'sobre-mi.html', className: 'footer-link' }, 'Sobre Mí')
    ])
]);

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

// --- Page Components ---

const DetailModal = ({ item, onClose }) => {
    if (!item) return null;
    return React.createElement('div', { className: 'modal-backdrop', onClick: onClose }, [
        React.createElement('div', { className: 'modal-content', onClick: e => e.stopPropagation() }, [
            React.createElement('h2', null, item.title),
            item.imageUrl && React.createElement('img', { src: optimizeImageUrl(item.imageUrl, 800), className: 'detail-modal-image', style: {width:'100%', borderRadius:'8px', margin:'1rem 0'} }),
            item.prompt && React.createElement('div', { className: 'prompt-container visible' }, [
                React.createElement('p', null, item.prompt),
                React.createElement('button', { className: 'copy-button', onClick: () => navigator.clipboard.writeText(item.prompt).then(() => alert('Copiado')) }, 'Copiar Prompt')
            ]),
            item.details && React.createElement('p', { style: {marginTop: '1rem', whiteSpace: 'pre-wrap'} }, item.details),
            (item.downloadUrl || item.linkUrl) && React.createElement('a', { href: item.downloadUrl || item.linkUrl, className: 'card-button', style: {marginTop: '1rem', display: 'block'} }, 'Ir al Recurso')
        ])
    ]);
};

const ImagePromptCard = ({ item, onShowDetails }) => {
    const [isVisible, setIsVisible] = useState(false);
    return React.createElement('div', { className: 'card', onClick: () => onShowDetails(item) }, [
        React.createElement('img', { src: optimizeImageUrl(item.imageUrl), className: 'card-image', onError: handleImageError }),
        React.createElement('div', { className: 'card-content' }, [
            React.createElement('h3', { className: 'card-title' }, item.title),
            item.prompt && React.createElement('button', { 
                className: 'card-button', 
                onClick: (e) => { e.stopPropagation(); setIsVisible(!isVisible); } 
            }, isVisible ? 'Ocultar Prompt' : 'Ver Prompt')
        ]),
        item.prompt && React.createElement('div', { className: `prompt-container ${isVisible ? 'visible' : ''}` }, item.prompt)
    ]);
};

const PromptGalleryPage = ({ category }) => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            if (!db) return;
            const q = query(collection(db, 'content'), where('category', '==', category), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        };
        fetch();
    }, [category]);

    if (loading) return React.createElement('div', { className: 'loading-container' }, React.createElement('div', { className: 'loading-spinner' }));

    return React.createElement('div', null, [
        React.createElement(Navigation, { currentPage: category }),
        React.createElement('div', { className: 'content-grid' }, items.map(i => React.createElement(ImagePromptCard, { key: i.id, item: i, onShowDetails: setSelected }))),
        selected && React.createElement(DetailModal, { item: selected, onClose: () => setSelected(null) })
    ]);
};

const ResourcesPage = () => {
    const [items, setItems] = useState([]);
    const [disclaimer, setDisclaimer] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            const q = query(collection(db, 'content'), where('category', 'in', ['afiliados', 'recomendaciones']));
            const snap = await getDocs(q);
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            
            const settings = await getDoc(doc(db, 'settings', 'disclaimers'));
            if (settings.exists()) setDisclaimer(settings.data().resourcesPageDisclaimer);
            setLoading(false);
        };
        fetch();
    }, []);

    if (loading) return React.createElement('div', { className: 'loading-container' }, React.createElement('div', { className: 'loading-spinner' }));

    return React.createElement('div', { className: 'resources-container' }, [
        React.createElement(Navigation, { currentPage: 'recursos' }),
        disclaimer && React.createElement('p', { className: 'resources-disclaimer' }, disclaimer),
        React.createElement('div', { className: 'recommendation-list' }, items.map(item => (
            React.createElement('a', { key: item.id, href: item.linkUrl, className: 'recommendation-card has-link', target: '_blank' }, [
                React.createElement('img', { src: optimizeImageUrl(item.imageUrl, 200), className: 'recommendation-card-image' }),
                React.createElement('div', null, [
                    React.createElement('h3', { className: 'recommendation-card-title' }, item.title),
                    React.createElement('p', { className: 'recommendation-card-description' }, item.description),
                    item.disclaimer && React.createElement('p', { className: 'affiliate-disclaimer' }, item.disclaimer)
                ])
            ])
        )))
    ]);
};

const GeneratorPage = () => {
    const [text, setText] = useState('Tu frase inspiradora aquí...');
    const [author, setAuthor] = useState('TheRamzes');
    const generatorRef = useRef(null);

    const download = async () => {
        if (!generatorRef.current) return;
        const dataUrl = await toPng(generatorRef.current, { cacheBust: true });
        const link = document.createElement('a');
        link.download = `TheRamzes_Post_${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
    };

    return React.createElement('div', { className: 'contact-container' }, [
        React.createElement(Navigation, { currentPage: 'generador' }),
        React.createElement('div', { ref: generatorRef, style: { 
            background: '#000', padding: '3rem', borderRadius: '16px', border: '1px solid #333', marginBottom: '2rem' 
        }}, [
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' } }, [
                React.createElement('img', { src: 'https://yt3.googleusercontent.com/UsEE3B7HZCqYlFrE6zI601Pq-_moV7q1diFWggkrSM5yI7imCvZWnBAjnOy5gp6_xx1LAZTUHg=s160-c-k-c0x00ffffff-no-rj', style: { width: '50px', borderRadius: '50%' } }),
                React.createElement('div', null, [
                    React.createElement('p', { style: { fontWeight: 'bold', margin: 0 } }, author),
                    React.createElement('p', { style: { color: '#666', margin: 0, fontSize: '0.9rem' } }, `@${author.toLowerCase().replace(/\s/g, '')}`)
                ])
            ]),
            React.createElement('p', { style: { fontSize: '1.5rem', lineHeight: '1.4', marginBottom: '1.5rem' } }, text),
            React.createElement('p', { style: { color: '#666', fontSize: '0.8rem' } }, `${new Date().toLocaleTimeString()} · ${new Date().toLocaleDateString()}`)
        ]),
        React.createElement('div', { className: 'contact-form' }, [
            React.createElement('textarea', { value: text, onChange: (e) => setText(e.target.value), className: 'search-input', style: {paddingLeft: '1rem'} }),
            React.createElement('input', { value: author, onChange: (e) => setAuthor(e.target.value), className: 'search-input', style: {paddingLeft: '1rem', marginTop: '1rem'} }),
            React.createElement('button', { onClick: download, className: 'btn-capture', style: { marginTop: '1rem', width: '100%' } }, 'Descargar Imagen')
        ])
    ]);
};

const FrameCapturerPage = () => {
    const [videoSrc, setVideoSrc] = useState(null);
    const [captures, setCaptures] = useState([]);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const videoRef = useRef(null);
    const fileRef = useRef(null);

    const formatTime = (t) => {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        const ms = Math.floor((t % 1) * 1000);
        return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    };

    const handleFile = (f) => {
        if (f && f.type.startsWith('video/')) {
            setVideoSrc(URL.createObjectURL(f));
            setCaptures([]);
        }
    };

    const capture = () => {
        const v = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = v.videoWidth; canvas.height = v.videoHeight;
        canvas.getContext('2d').drawImage(v, 0, 0);
        setCaptures([{ id: Date.now(), url: canvas.toDataURL('image/png'), time: formatTime(v.currentTime) }, ...captures]);
    };

    useEffect(() => {
        if (videoRef.current && videoSrc) {
            const v = videoRef.current;
            v.onloadedmetadata = () => { setDuration(v.duration); v.currentTime = v.duration; };
            v.ontimeupdate = () => setCurrentTime(v.currentTime);
        }
    }, [videoSrc]);

    if (!videoSrc) return React.createElement('div', null, [
        React.createElement(Navigation, { currentPage: 'capturador' }),
        React.createElement('div', { className: 'drop-zone', onClick: () => fileRef.current.click() }, [
            React.createElement('input', { type: 'file', ref: fileRef, hidden: true, onChange: (e) => handleFile(e.target.files[0]) }),
            React.createElement('p', null, 'Haz clic o arrastra un video aquí')
        ])
    ]);

    return React.createElement('div', null, [
        React.createElement(Navigation, { currentPage: 'capturador' }),
        React.createElement('div', { className: 'video-editor-layout' }, [
            React.createElement('div', null, [
                React.createElement('video', { ref: videoRef, src: videoSrc, className: 'video-element' }),
                React.createElement('div', { className: 'video-controls-panel' }, [
                    React.createElement('input', { type: 'range', className: 'scrubbing-slider', min: 0, max: duration, step: 0.001, value: currentTime, onChange: (e) => videoRef.current.currentTime = e.target.value }),
                    React.createElement('p', { className: 'time-display' }, `${formatTime(currentTime)} / ${formatTime(duration)}`),
                    React.createElement('div', { className: 'control-buttons' }, [
                        React.createElement('button', { className: 'btn-precision', onClick: () => videoRef.current.currentTime -= 0.033 }, '-Frame'),
                        React.createElement('button', { className: 'btn-capture', onClick: capture }, 'Capturar'),
                        React.createElement('button', { className: 'btn-precision', onClick: () => videoRef.current.currentTime += 0.033 }, '+Frame')
                    ]),
                    React.createElement('button', { className: 'btn-reset', onClick: () => setVideoSrc(null), style: {width:'100%', marginTop:'1rem'} }, 'Cambiar Video')
                ])
            ]),
            React.createElement('div', { className: 'captures-sidebar' }, captures.map(c => React.createElement('div', { key: c.id, className: 'capture-item' }, [
                React.createElement('img', { src: c.url }),
                React.createElement('p', { className: 'capture-meta' }, c.time),
                React.createElement('button', { className: 'capture-overlay-btn', onClick: () => { const a = document.createElement('a'); a.href = c.url; a.download = `frame_${c.time}.png`; a.click(); } }, 'Guardar')
            ])))
        ])
    ]);
};

// --- Main App ---
const App = () => {
    const page = document.getElementById('root')?.getAttribute('data-page') || 'imagenes';

    const render = () => {
        switch (page) {
            case 'imagenes': return React.createElement(PromptGalleryPage, { category: 'imagenes' });
            case 'videos': return React.createElement(PromptGalleryPage, { category: 'videos' });
            case 'descargas': return React.createElement(PromptGalleryPage, { category: 'descargas' });
            case 'tutoriales': return React.createElement(PromptGalleryPage, { category: 'tutoriales' });
            case 'recursos': return React.createElement(ResourcesPage);
            case 'generador': return React.createElement(GeneratorPage);
            case 'capturador': return React.createElement(FrameCapturerPage);
            case 'sobre-mi': return React.createElement('div', null, [React.createElement(Navigation, { currentPage: 'sobre-mi' }), React.createElement('div', { className: 'about-me-container' }, 'TheRamzes: Creador de contenido y apasionado de la IA.')]);
            case 'contacto': return React.createElement('div', null, [React.createElement(Navigation, { currentPage: 'contacto' }), React.createElement('div', { className: 'contact-container' }, 'Escríbeme a través de mis redes sociales.')]);
            default: return React.createElement(PromptGalleryPage, { category: 'imagenes' });
        }
    };

    return React.createElement('div', null, [render(), React.createElement(Footer)]);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
