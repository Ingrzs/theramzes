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

const handleImageError = (e) => {
    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9' fill='%232a2a2a'%3E%3C/svg%3E";
};

// --- COMPONENTES GLOBALES ---

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

// --- GALERÍAS ---

const PromptGalleryPage = ({ category }) => {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

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

    if (loading) return React.createElement('div', { className: 'loading-container' }, [React.createElement('div', { className: 'loading-spinner' }), React.createElement('p', null, 'Cargando...')]);

    return React.createElement('div', null, [
        React.createElement('div', { key: 'search', className: 'search-container' }, [
            React.createElement('input', {
                type: 'text',
                className: 'search-input',
                placeholder: 'Busca prompts o contenido...',
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value)
            })
        ]),
        filteredItems.length === 0 ? React.createElement('div', { key: 'empty', className: 'empty-state-container' }, 'No se encontraron resultados.') :
        React.createElement('div', { key: 'grid', className: 'content-grid' }, 
            filteredItems.map(item => React.createElement(ImagePromptCard, { key: item.id, item, onShowDetails: setSelectedItem }))
        ),
        selectedItem && React.createElement(DetailModal, { key: 'modal', item: selectedItem, onClose: () => setSelectedItem(null) })
    ]);
};

const ImagePromptCard = ({ item, onShowDetails }) => {
    const [isPromptVisible, setIsPromptVisible] = useState(false);
    return React.createElement('div', { className: 'card', onClick: () => onShowDetails(item) }, [
        React.createElement('img', { src: optimizeImageUrl(item.imageUrl), className: 'card-image', onError: handleImageError }),
        React.createElement('div', { className: 'card-content' }, [
            React.createElement('h3', { className: 'card-title' }, item.title),
            item.prompt && React.createElement('button', { 
                className: 'card-button', 
                onClick: (e) => { e.stopPropagation(); setIsPromptVisible(!isPromptVisible); } 
            }, isPromptVisible ? 'Ocultar Prompt' : 'Ver Prompt')
        ]),
        item.prompt && React.createElement('div', { className: `prompt-container ${isPromptVisible ? 'visible' : ''}` }, item.prompt)
    ]);
};

const DetailModal = ({ item, onClose }) => {
    return React.createElement('div', { className: 'modal-backdrop', onClick: onClose }, [
        React.createElement('div', { className: 'modal-content', onClick: e => e.stopPropagation() }, [
            React.createElement('h2', null, item.title),
            item.imageUrl && React.createElement('img', { src: optimizeImageUrl(item.imageUrl, 800), style: {width:'100%', borderRadius:'8px', margin:'1rem 0'} }),
            item.prompt && React.createElement('div', { className: 'prompt-container visible' }, item.prompt),
            item.details && React.createElement('p', { style: {marginTop:'1rem', whiteSpace:'pre-wrap'} }, item.details),
            (item.downloadUrl || item.linkUrl) && React.createElement('a', { 
                href: item.downloadUrl || item.linkUrl, 
                className: 'card-button', 
                style: {marginTop:'1rem', display:'block'},
                target: '_blank'
            }, 'Acceder al Recurso')
        ])
    ]);
};

// --- PÁGINAS ESPECIALES ---

const GeneratorPage = () => {
    const [text, setText] = useState('Tu frase o tweet aquí...');
    const generatorRef = useRef(null);

    return React.createElement('div', { className: 'contact-container' }, [
        React.createElement('div', { 
            ref: generatorRef, 
            key: 'tweet', 
            style: { background: '#000', padding: '2.5rem', borderRadius: '16px', border: '1px solid #333', marginBottom: '2rem' } 
        }, [
            React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' } }, [
                React.createElement('img', { src: 'https://yt3.googleusercontent.com/UsEE3B7HZCqYlFrE6zI601Pq-_moV7q1diFWggkrSM5yI7imCvZWnBAjnOy5gp6_xx1LAZTUHg=s160-c-k-c0x00ffffff-no-rj', style: { width: '48px', borderRadius: '50%' } }),
                React.createElement('div', null, [
                    React.createElement('p', { style: { fontWeight: 'bold', margin: 0, color: 'white' } }, 'TheRamzes'),
                    React.createElement('p', { style: { color: '#666', fontSize: '0.9rem', margin: 0 } }, '@theramzes')
                ])
            ]),
            React.createElement('p', { style: { fontSize: '1.5rem', lineHeight: '1.4', color: 'white', margin: 0 } }, text),
            React.createElement('p', { style: { color: '#666', fontSize: '0.8rem', marginTop: '1.5rem', marginBotto: 0 } }, `${new Date().toLocaleTimeString()} · ${new Date().toLocaleDateString()}`)
        ]),
        React.createElement('textarea', { 
            className: 'search-input', 
            style: {paddingLeft: '1rem', marginBottom: '1rem', height: '100px'}, 
            value: text, 
            onChange: (e) => setText(e.target.value) 
        }),
        React.createElement('button', { 
            className: 'btn-capture', 
            style: {width: '100%'},
            onClick: async () => {
                const dataUrl = await toPng(generatorRef.current);
                const link = document.createElement('a');
                link.download = `TheRamzes_Post_${Date.now()}.png`;
                link.href = dataUrl;
                link.click();
            } 
        }, 'Descargar Imagen')
    ]);
};

const FrameCapturerPage = () => {
    const [videoSrc, setVideoSrc] = useState(null);
    const [captures, setCaptures] = useState([]);
    const [curr, setCurr] = useState(0);
    const [dur, setDur] = useState(0);
    const vRef = useRef(null);
    const fRef = useRef(null);
    const format = (t) => `${Math.floor(t/60)}:${Math.floor(t%60).toString().padStart(2,'0')}.${Math.floor((t%1)*1000).toString().padStart(3,'0')}`;

    if (!videoSrc) return React.createElement('div', { className: 'drop-zone', onClick: () => fRef.current.click() }, [
        React.createElement('input', { type: 'file', ref: fRef, hidden: true, accept: 'video/*', onChange: (e) => setVideoSrc(URL.createObjectURL(e.target.files[0])) }),
        React.createElement('p', null, 'Carga un video para extraer frames en alta resolución.')
    ]);

    return React.createElement('div', { className: 'video-editor-layout' }, [
        React.createElement('div', { key: 'player' }, [
            React.createElement('video', { 
                ref: vRef, src: videoSrc, className: 'video-element', 
                onLoadedMetadata: () => setDur(vRef.current.duration), 
                onTimeUpdate: () => setCurr(vRef.current.currentTime) 
            }),
            React.createElement('div', { className: 'video-controls-panel' }, [
                React.createElement('input', { type: 'range', className: 'scrubbing-slider', min: 0, max: dur, step: 0.001, value: curr, onChange: (e) => vRef.current.currentTime = e.target.value }),
                React.createElement('p', { className: 'time-display' }, format(curr)),
                React.createElement('div', { className: 'control-buttons' }, [
                    React.createElement('button', { className: 'btn-precision', onClick: () => vRef.current.currentTime -= 0.033 }, '-F'),
                    React.createElement('button', { className: 'btn-capture', onClick: () => {
                        const c = document.createElement('canvas'); c.width = vRef.current.videoWidth; c.height = vRef.current.videoHeight;
                        c.getContext('2d').drawImage(vRef.current, 0, 0);
                        setCaptures([{ id: Date.now(), url: c.toDataURL('image/png'), t: format(vRef.current.currentTime) }, ...captures]);
                    } }, 'Capturar'),
                    React.createElement('button', { className: 'btn-precision', onClick: () => vRef.current.currentTime += 0.033 }, '+F')
                ]),
                React.createElement('button', { className: 'btn-reset', style: {width:'100%', marginTop:'1rem'}, onClick: () => setVideoSrc(null) }, 'Cerrar Video')
            ])
        ]),
        React.createElement('div', { className: 'captures-sidebar' }, captures.map(c => React.createElement('div', { key: c.id, className: 'capture-item' }, [
            React.createElement('img', { src: c.url }),
            React.createElement('button', { className: 'capture-overlay-btn', onClick: () => { const a = document.createElement('a'); a.href = c.url; a.download=`f_${c.t}.png`; a.click(); } }, 'Guardar')
        ])))
    ]);
};

const AboutMePage = () => React.createElement('div', { className: 'about-me-container' }, [
    React.createElement('img', { key: 'img', src: 'https://yt3.googleusercontent.com/UsEE3B7HZCqYlFrE6zI601Pq-_moV7q1diFWggkrSM5yI7imCvZWnBAjnOy5gp6_xx1LAZTUHg=s160-c-k-c0x00ffffff-no-rj', className: 'profile-pic' }),
    React.createElement('h2', { key: 'h2' }, 'TheRamzes'),
    React.createElement('p', { key: 'p', className: 'bio' }, 'Explorador de la IA, creador de contenido y apasionado por compartir herramientas que faciliten el proceso creativo.'),
    React.createElement('div', { key: 'links', className: 'recommendation-list', style: {marginTop: '2rem'} }, [
        { label: 'Canal de YouTube', url: 'https://youtube.com/@TheRamzes' },
        { label: 'Sígueme en Twitter / X', url: 'https://twitter.com/TheRamzes' },
        { label: 'Instagram Oficial', url: 'https://instagram.com/TheRamzes' }
    ].map(link => React.createElement('a', { 
        key: link.label, href: link.url, className: 'recommendation-card has-link', target: '_blank', 
        style: {justifyContent: 'center', fontWeight: '600', padding: '1.2rem'} 
    }, link.label)))
]);

const ContactPage = () => React.createElement('div', { className: 'contact-container' }, [
    React.createElement('h2', null, 'Contacto'),
    React.createElement('form', { className: 'contact-form', onSubmit: e => e.preventDefault() }, [
        React.createElement('div', { className: 'form-group' }, [React.createElement('label', null, 'Nombre'), React.createElement('input', { type: 'text' })]),
        React.createElement('div', { className: 'form-group' }, [React.createElement('label', null, 'Correo'), React.createElement('input', { type: 'email' })]),
        React.createElement('div', { className: 'form-group' }, [React.createElement('label', null, 'Mensaje'), React.createElement('textarea', { rows: 5 })]),
        React.createElement('button', { className: 'submit-button' }, 'Enviar Mensaje')
    ])
]);

const ResourcesPage = () => {
    const [items, setItems] = useState([]);
    useEffect(() => {
        const f = async () => {
            const snap = await getDocs(query(collection(db, 'content'), where('category', 'in', ['afiliados', 'recomendaciones'])));
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        };
        f();
    }, []);
    return React.createElement('div', { className: 'resources-container' }, items.map(item => (
        React.createElement('a', { key: item.id, href: item.linkUrl, className: 'recommendation-card has-link', target: '_blank' }, [
            React.createElement('img', { src: optimizeImageUrl(item.imageUrl, 200), className: 'recommendation-card-image' }),
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
    const content = () => {
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
        React.createElement('main', { key: 'm' }, content()),
        React.createElement(Footer, { key: 'f' })
    ]);
};

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
