
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, getDocs, getDoc, doc, query, where, orderBy, limit, startAfter } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'https://esm.sh/react@18';
import ReactDOM from 'https://esm.sh/react-dom@18/client';
import Fuse from 'https://esm.sh/fuse.js@7.0.0';
import { toPng } from 'https://esm.sh/html-to-image@1.11.11';

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

const optimizeImageUrl = (url, width = 600) => {
    if (!url || !url.startsWith('http')) return url;
    if (url.includes('res.cloudinary.com')) return url;
    return `https://res.cloudinary.com/dbbdcvgbq/image/fetch/f_auto,q_auto,w_${width}/${encodeURIComponent(url)}`;
};

const DEFAULT_AVATAR = "https://yt3.googleusercontent.com/UsEE3B7HZCqYlFrE6zI601Pq-_moV7q1diFWggkrSM5yI7imCvZWnBAjnOy5gp6_xx1LAZTUHg=s160-c-k-c0x00ffffff-no-rj";

// --- COMPONENTES UI ---

const Header = () => React.createElement('header', { className: 'app-header' }, [
    React.createElement('h1', { key: 'h1' }, 'TheRamzes'),
    React.createElement('p', { key: 'p', className: 'welcome-text' }, 'Bienvenido a mi universo creativo. Descubre, aprende y crea con la ayuda de la inteligencia artificial.')
]);

const Navigation = ({ currentPage }) => {
    const tabs = [
        { id: 'imagenes', label: 'Imágenes', url: 'index.html' },
        { id: 'videos', label: 'Videos', url: 'videos.html' },
        { id: 'capturador', label: 'Frame Studio', url: 'capturador.html' },
        { id: 'generador', label: 'Generador', url: 'generador.html' },
        { id: 'descargas', label: 'Descargas', url: 'descargas.html' },
        { id: 'tutoriales', label: 'Tutoriales', url: 'tutoriales.html' },
        { id: 'recursos', label: 'Recursos', url: 'recursos.html' },
        { id: 'sobre-mi', label: 'Sobre Mí', url: 'sobre-mi.html' },
        { id: 'contacto', label: 'Contacto', url: 'contacto.html' }
    ];
    return React.createElement('nav', { className: 'tabs-nav', style: { marginBottom: '2rem' } },
        tabs.map(tab => React.createElement('a', {
            key: tab.id,
            href: tab.url,
            className: `tab-button ${currentPage === tab.id ? 'active' : ''}`
        }, tab.label))
    );
};

const Footer = () => React.createElement('footer', {}, [
    React.createElement('div', { key: 'copy' }, `© ${new Date().getFullYear()} TheRamzes`),
    React.createElement('div', { key: 'links', style: { display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '1rem' } }, [
        React.createElement('a', { key: 'p', href: 'politicas.html', className: 'footer-link' }, 'Políticas de Privacidad'),
        React.createElement('a', { key: 't', href: 'terminos.html', className: 'footer-link' }, 'Términos de Uso')
    ])
]);

// --- GALERÍA DE CONTENIDO ---

const PromptGalleryPage = ({ category }) => {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        const fetchItems = async () => {
            if (!db) return;
            const q = query(collection(db, 'content'), where('category', '==', category), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setItems(data);
            setFilteredItems(data);
            setLoading(false);
        };
        fetchItems();
    }, [category]);

    useEffect(() => {
        if (!searchTerm) { setFilteredItems(items); return; }
        const fuse = new Fuse(items, { keys: ['title', 'prompt', 'description'], threshold: 0.3 });
        setFilteredItems(fuse.search(searchTerm).map(r => r.item));
    }, [searchTerm, items]);

    if (loading) return React.createElement('div', { className: 'loading-container' }, React.createElement('div', { className: 'loading-spinner' }));

    return React.createElement('div', null, [
        React.createElement('div', { key: 'search', className: 'search-container' }, [
            React.createElement('input', {
                type: 'text',
                className: 'search-input',
                placeholder: 'Busca prompts...',
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value)
            })
        ]),
        React.createElement('div', { key: 'grid', className: 'content-grid' }, 
            filteredItems.map(item => React.createElement(ImagePromptCard, { key: item.id, item, onShowDetails: setSelected }))
        ),
        selected && React.createElement(DetailModal, { key: 'modal', item: selected, onClose: () => setSelected(null) })
    ]);
};

const ImagePromptCard = ({ item, onShowDetails }) => {
    const [isVisible, setIsVisible] = useState(false);
    return React.createElement('div', { className: 'card', onClick: () => onShowDetails(item) }, [
        React.createElement('img', { src: optimizeImageUrl(item.imageUrl), className: 'card-image' }),
        React.createElement('div', { className: 'card-content' }, [
            React.createElement('h3', { className: 'card-title' }, item.title),
            item.prompt && React.createElement('button', { className: 'card-button', onClick: (e) => { e.stopPropagation(); setIsVisible(!isVisible); } }, isVisible ? 'Ocultar' : 'Ver Prompt')
        ]),
        item.prompt && React.createElement('div', { className: `prompt-container ${isVisible ? 'visible' : ''}` }, item.prompt)
    ]);
};

const DetailModal = ({ item, onClose }) => {
    return React.createElement('div', { className: 'modal-backdrop', onClick: onClose }, [
        React.createElement('div', { className: 'modal-content', onClick: e => e.stopPropagation() }, [
            React.createElement('h2', null, item.title),
            item.imageUrl && React.createElement('img', { src: optimizeImageUrl(item.imageUrl, 800), className: 'detail-modal-image' }),
            item.prompt && React.createElement('div', { className: 'prompt-container visible', style: {maxHeight: 'none'} }, item.prompt),
            item.details && React.createElement('div', { className: 'detail-modal-details' }, item.details),
            (item.downloadUrl || item.linkUrl) && React.createElement('a', { href: item.downloadUrl || item.linkUrl, className: 'card-button', style: {marginTop:'1rem', display:'block'}, target: '_blank' }, 'Acceder')
        ])
    ]);
};

// --- GENERADOR ORIGINAL ---

const GeneratorPage = () => {
    const [text, setText] = useState('La IA no reemplaza al creativo, lo potencia.');
    const [name, setName] = useState('TheRamzes');
    const [user, setUser] = useState('@theramzes');
    const [theme, setTheme] = useState('dark');
    const [font, setFont] = useState('font-inter');
    const [align, setAlign] = useState('text-left');
    const cardRef = useRef(null);

    return React.createElement('div', { className: 'generator-container' }, [
        React.createElement('div', { key: 'controls', className: 'control-panel' }, [
            React.createElement('div', { className: 'control-row' }, [
                React.createElement('div', { className: 'control-group' }, [
                    React.createElement('label', null, 'Texto'),
                    React.createElement('textarea', { className: 'control-input', value: text, onChange: e => setText(e.target.value), rows: 3 })
                ])
            ]),
            React.createElement('div', { className: 'control-row' }, [
                React.createElement('div', { className: 'control-group' }, [
                    React.createElement('label', null, 'Nombre'),
                    React.createElement('input', { className: 'control-input', value: name, onChange: e => setName(e.target.value) })
                ]),
                React.createElement('div', { className: 'control-group' }, [
                    React.createElement('label', null, 'Usuario'),
                    React.createElement('input', { className: 'control-input', value: user, onChange: e => setUser(e.target.value) })
                ])
            ]),
            React.createElement('div', { className: 'control-row' }, [
                React.createElement('div', { className: 'control-group' }, [
                    React.createElement('label', null, 'Fuente'),
                    React.createElement('select', { className: 'control-select', value: font, onChange: e => setFont(e.target.value) }, [
                        React.createElement('option', { value: 'font-inter' }, 'Inter'),
                        React.createElement('option', { value: 'font-serif' }, 'Serif'),
                        React.createElement('option', { value: 'font-mono' }, 'Mono'),
                        React.createElement('option', { value: 'font-pacifico' }, 'Cursive')
                    ])
                ]),
                React.createElement('div', { className: 'control-group' }, [
                    React.createElement('label', null, 'Alineación'),
                    React.createElement('div', { className: 'control-btn-group' }, [
                        ['text-left', 'L'], ['text-center', 'C'], ['text-right', 'R']
                    ].map(([v, l]) => React.createElement('button', { key: v, className: `control-btn ${align === v ? 'active' : ''}`, onClick: () => setAlign(v) }, l)))
                ])
            ]),
            React.createElement('div', { className: 'control-row' }, [
                React.createElement('button', { className: `control-btn ${theme === 'dark' ? 'active' : ''}`, style: {width: '50%'}, onClick: () => setTheme('dark') }, 'Dark'),
                React.createElement('button', { className: `control-btn ${theme === 'light' ? 'active' : ''}`, style: {width: '50%'}, onClick: () => setTheme('light') }, 'Light')
            ]),
            React.createElement('button', { className: 'action-btn', onClick: async () => {
                const url = await toPng(cardRef.current);
                const a = document.createElement('a'); a.download = 'tweet.png'; a.href = url; a.click();
            } }, 'Descargar Imagen')
        ]),
        React.createElement('div', { key: 'preview', className: 'preview-area' }, [
            React.createElement('div', { ref: cardRef, className: `tweet-card ${theme} ${font} ${align}` }, [
                React.createElement('div', { className: 'tweet-header' }, [
                    React.createElement('img', { src: DEFAULT_AVATAR, className: 'tweet-avatar' }),
                    React.createElement('div', { className: 'tweet-user-info' }, [
                        React.createElement('div', { className: 'tweet-name' }, name),
                        React.createElement('div', { className: 'tweet-username' }, user)
                    ])
                ]),
                React.createElement('div', { className: 'tweet-body' }, text)
            ])
        ])
    ]);
};

// --- SOBRE MÍ ORIGINAL (LINKTREE STYLE) ---

const AboutMePage = () => React.createElement('div', { className: 'about-me-container' }, [
    React.createElement('img', { key: 'img', src: DEFAULT_AVATAR, className: 'profile-pic' }),
    React.createElement('h2', { key: 'name' }, 'TheRamzes'),
    React.createElement('p', { key: 'bio', className: 'bio' }, 'Explorador de la IA, creador de contenido y apasionado por compartir herramientas creativas.'),
    React.createElement('div', { key: 'links', className: 'links-container' }, [
        { label: 'YouTube', url: 'https://youtube.com/@TheRamzes' },
        { label: 'Twitter / X', url: 'https://twitter.com/TheRamzes' },
        { label: 'Instagram', url: 'https://instagram.com/TheRamzes' },
        { label: 'Contacto Directo', url: 'mailto:contacto@theramzes.com' }
    ].map(link => React.createElement('a', { key: link.label, href: link.url, className: 'social-link', target: '_blank' }, link.label)))
]);

// --- FRAME STUDIO (CAPTURA DE FRAMES) ---

const FrameCapturerPage = () => {
    const [videoSrc, setVideoSrc] = useState(null);
    const [caps, setCaps] = useState([]);
    const vRef = useRef(null);
    const fRef = useRef(null);

    if (!videoSrc) return React.createElement('div', { className: 'drop-zone', onClick: () => fRef.current.click() }, [
        React.createElement('input', { type: 'file', ref: fRef, hidden: true, accept: 'video/*', onChange: e => setVideoSrc(URL.createObjectURL(e.target.files[0])) }),
        React.createElement('p', null, 'Carga un video para extraer frames en alta resolución.')
    ]);

    return React.createElement('div', { className: 'video-editor-layout', style: {display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem'} }, [
        React.createElement('div', null, [
            React.createElement('video', { ref: vRef, src: videoSrc, controls: true, style: {width:'100%', borderRadius:'12px'} }),
            React.createElement('div', { style: {marginTop:'1rem', display:'flex', gap:'1rem'} }, [
                React.createElement('button', { className: 'card-button', onClick: () => {
                    const c = document.createElement('canvas'); c.width = vRef.current.videoWidth; c.height = vRef.current.videoHeight;
                    c.getContext('2d').drawImage(vRef.current, 0, 0);
                    setCaps([{ id: Date.now(), url: c.toDataURL('image/png') }, ...caps]);
                } }, 'Capturar Frame Actual'),
                React.createElement('button', { className: 'card-button', style: {background:'#444'}, onClick: () => setVideoSrc(null) }, 'Cerrar Video')
            ])
        ]),
        React.createElement('div', { style: {maxHeight:'70vh', overflowY:'auto'} }, caps.map(c => React.createElement('div', { key: c.id, style: {position:'relative', marginBottom:'1rem'} }, [
            React.createElement('img', { src: c.url, style: {width:'100%', borderRadius:'8px'} }),
            React.createElement('button', { className: 'copy-button', onClick: () => { const a = document.createElement('a'); a.href = c.url; a.download='frame.png'; a.click(); } }, '💾')
        ])))
    ]);
};

// --- OTROS ---

const ContactPage = () => React.createElement('div', { className: 'contact-container' }, [
    React.createElement('h2', null, 'Contacto'),
    React.createElement('form', { className: 'contact-form', onSubmit: e => e.preventDefault() }, [
        React.createElement('div', { className: 'form-group' }, [React.createElement('label', null, 'Nombre'), React.createElement('input', {type:'text'})]),
        React.createElement('div', { className: 'form-group' }, [React.createElement('label', null, 'Email'), React.createElement('input', {type:'email'})]),
        React.createElement('div', { className: 'form-group' }, [React.createElement('label', null, 'Mensaje'), React.createElement('textarea', {rows:5})]),
        React.createElement('button', { className: 'submit-button' }, 'Enviar Mensaje')
    ])
]);

const ResourcesPage = () => {
    const [items, setItems] = useState([]);
    useEffect(() => {
        const fetch = async () => {
            const snap = await getDocs(query(collection(db, 'content'), where('category', 'in', ['afiliados', 'recomendaciones'])));
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        fetch();
    }, []);
    return React.createElement('div', { className: 'resources-container' }, items.map(item => (
        React.createElement('a', { key: item.id, href: item.linkUrl, className: 'recommendation-card has-link', target: '_blank' }, [
            React.createElement('img', { src: optimizeImageUrl(item.imageUrl, 150), className: 'recommendation-card-image' }),
            React.createElement('div', null, [
                React.createElement('h3', { className: 'recommendation-card-title' }, item.title),
                React.createElement('p', { className: 'recommendation-card-description' }, item.description)
            ])
        ])
    )));
};

// --- APP ROOT ---

const App = () => {
    const page = document.getElementById('root')?.getAttribute('data-page') || 'imagenes';
    const renderContent = () => {
        switch (page) {
            case 'imagenes': case 'videos': case 'descargas': case 'tutoriales': return React.createElement(PromptGalleryPage, { category: page });
            case 'recursos': return React.createElement(ResourcesPage);
            case 'generador': return React.createElement(GeneratorPage);
            case 'capturador': return React.createElement(FrameCapturerPage);
            case 'sobre-mi': return React.createElement(AboutMePage);
            case 'contacto': return React.createElement(ContactPage);
            default: return React.createElement(PromptGalleryPage, { category: 'imagenes' });
        }
    };

    return React.createElement('div', null, [
        React.createElement(Header, { key: 'h' }),
        React.createElement(Navigation, { key: 'n', currentPage: page }),
        React.createElement('main', { key: 'm' }, renderContent()),
        React.createElement(Footer, { key: 'f' })
    ]);
};

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
