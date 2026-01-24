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

const CLOUDINARY_CLOUD_NAME = 'dbbdcvgbq';
const optimizeImageUrl = (url, width = 600) => {
    if (!url || !url.startsWith('http')) return url;
    if (url.includes('res.cloudinary.com')) return url;
    return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/fetch/f_auto,q_auto,w_${width}/${encodeURIComponent(url)}`;
};
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9' fill='%232a2a2a'%3E%3C/svg%3E";

const handleImageError = (e) => {
    if (e.currentTarget.src !== PLACEHOLDER_IMAGE) e.currentTarget.src = PLACEHOLDER_IMAGE;
};

// --- UI Components ---

const Header = () => React.createElement('header', { className: 'app-header' }, [
    React.createElement('h1', { key: 'h1' }, 'TheRamzes'),
    React.createElement('p', { key: 'p', className: 'welcome-text' }, 'Explora el universo creativo de la IA: Prompts, herramientas y tutoriales.')
]);

const Footer = () => React.createElement('footer', {}, [
    React.createElement('div', { key: 'c' }, `© ${new Date().getFullYear()} TheRamzes`),
    React.createElement('div', { key: 'l', style: { display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' } }, [
        React.createElement('a', { key: 'p', href: 'politicas.html', className: 'footer-link' }, 'Privacidad'),
        React.createElement('a', { key: 't', href: 'terminos.html', className: 'footer-link' }, 'Términos'),
        React.createElement('a', { key: 'co', href: 'contacto.html', className: 'footer-link' }, 'Contacto'),
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

const SearchBar = ({ onSearch }) => React.createElement('div', { className: 'search-container' }, [
    React.createElement('input', {
        key: 'input',
        type: 'text',
        className: 'search-input',
        placeholder: 'Busca prompts, herramientas o efectos...',
        onChange: (e) => onSearch(e.target.value)
    })
]);

// --- Page Components ---

const DetailModal = ({ item, onClose }) => {
    if (!item) return null;
    return React.createElement('div', { className: 'modal-backdrop', onClick: onClose }, [
        React.createElement('div', { className: 'modal-content', onClick: e => e.stopPropagation() }, [
            React.createElement('h2', null, item.title),
            item.imageUrl && React.createElement('img', { src: optimizeImageUrl(item.imageUrl, 800), style: {width:'100%', borderRadius:'8px', margin:'1rem 0'} }),
            item.prompt && React.createElement('div', { className: 'prompt-container visible' }, [
                React.createElement('p', null, item.prompt),
                React.createElement('button', { className: 'copy-button', onClick: () => navigator.clipboard.writeText(item.prompt).then(() => alert('Copiado')) }, 'Copiar')
            ]),
            item.details && React.createElement('p', { style: {marginTop:'1rem', whiteSpace:'pre-wrap'} }, item.details),
            (item.downloadUrl || item.linkUrl) && React.createElement('a', { href: item.downloadUrl || item.linkUrl, className: 'card-button', style: {marginTop:'1rem', display:'block'} }, 'Acceder')
        ])
    ]);
};

const PromptGalleryPage = ({ category }) => {
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        const fetch = async () => {
            const q = query(collection(db, 'content'), where('category', '==', category), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setItems(data);
            setFilteredItems(data);
            setLoading(false);
        };
        fetch();
    }, [category]);

    const handleSearch = (term) => {
        if (!term) { setFilteredItems(items); return; }
        const fuse = new Fuse(items, { keys: ['title', 'prompt', 'description'], threshold: 0.3 });
        setFilteredItems(fuse.search(term).map(r => r.item));
    };

    if (loading) return React.createElement('div', { className: 'loading-container' }, React.createElement('div', { className: 'loading-spinner' }));

    return React.createElement('div', null, [
        React.createElement(SearchBar, { key: 'sb', onSearch: handleSearch }),
        filteredItems.length === 0 ? React.createElement('div', { className: 'empty-state-container' }, 'No se encontraron resultados.') :
        React.createElement('div', { className: 'content-grid' }, filteredItems.map(i => React.createElement(ImagePromptCard, { key: i.id, item: i, onShowDetails: setSelected }))),
        selected && React.createElement(DetailModal, { item: selected, onClose: () => setSelected(null) })
    ]);
};

const ImagePromptCard = ({ item, onShowDetails }) => {
    const [isVisible, setIsVisible] = useState(false);
    return React.createElement('div', { className: 'card', onClick: () => onShowDetails(item) }, [
        React.createElement('img', { src: optimizeImageUrl(item.imageUrl), className: 'card-image', onError: handleImageError }),
        React.createElement('div', { className: 'card-content' }, [
            React.createElement('h3', { className: 'card-title' }, item.title),
            item.prompt && React.createElement('button', { className: 'card-button', onClick: (e) => { e.stopPropagation(); setIsVisible(!isVisible); } }, isVisible ? 'Ocultar' : 'Ver Prompt')
        ]),
        item.prompt && React.createElement('div', { className: `prompt-container ${isVisible ? 'visible' : ''}` }, item.prompt)
    ]);
};

const AboutMePage = () => React.createElement('div', { className: 'about-me-container' }, [
    React.createElement('img', { key: 'pic', src: 'https://yt3.googleusercontent.com/UsEE3B7HZCqYlFrE6zI601Pq-_moV7q1diFWggkrSM5yI7imCvZWnBAjnOy5gp6_xx1LAZTUHg=s160-c-k-c0x00ffffff-no-rj', className: 'profile-pic' }),
    React.createElement('h2', { key: 'name' }, 'TheRamzes'),
    React.createElement('p', { key: 'bio', className: 'bio' }, 'Apasionado por la tecnología, la inteligencia artificial y la creación de contenido. Mi objetivo es democratizar el uso de la IA compartiendo prompts, herramientas y conocimientos útiles para todos.'),
    React.createElement('div', { key: 'links', className: 'links-container' }, [
        React.createElement('a', { key: 'yt', href: 'https://youtube.com/@TheRamzes', className: 'social-link', target: '_blank' }, 'YouTube'),
        React.createElement('a', { key: 'tw', href: 'https://twitter.com/TheRamzes', className: 'social-link', target: '_blank' }, 'Twitter'),
        React.createElement('a', { key: 'ig', href: 'https://instagram.com/TheRamzes', className: 'social-link', target: '_blank' }, 'Instagram')
    ])
]);

const ContactPage = () => React.createElement('div', { className: 'contact-container' }, [
    React.createElement('h2', null, 'Contacto'),
    React.createElement('p', { style: {textAlign:'center', color:'var(--text-secondary)', marginBottom:'2rem'} }, '¿Tienes alguna duda o propuesta? Envíame un mensaje.'),
    React.createElement('form', { className: 'contact-form', onSubmit: (e) => { e.preventDefault(); alert('Mensaje enviado (Simulado)'); } }, [
        React.createElement('div', { className: 'form-group' }, [
            React.createElement('label', null, 'Nombre'),
            React.createElement('input', { type: 'text', required: true })
        ]),
        React.createElement('div', { className: 'form-group' }, [
            React.createElement('label', null, 'Correo Electrónico'),
            React.createElement('input', { type: 'email', required: true })
        ]),
        React.createElement('div', { className: 'form-group' }, [
            React.createElement('label', null, 'Mensaje'),
            React.createElement('textarea', { rows: 5, required: true })
        ]),
        React.createElement('button', { type: 'submit', className: 'submit-button' }, 'Enviar Mensaje')
    ])
]);

const ResourcesPage = () => {
    const [items, setItems] = useState([]);
    const [disclaimer, setDisclaimer] = useState('');
    useEffect(() => {
        const fetch = async () => {
            const snap = await getDocs(query(collection(db, 'content'), where('category', 'in', ['afiliados', 'recomendaciones'])));
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            const setDoc = await getDoc(doc(db, 'settings', 'disclaimers'));
            if (setDoc.exists()) setDisclaimer(setDoc.data().resourcesPageDisclaimer);
        };
        fetch();
    }, []);
    return React.createElement('div', { className: 'resources-container' }, [
        disclaimer && React.createElement('p', { className: 'resources-disclaimer' }, disclaimer),
        React.createElement('div', { className: 'recommendation-list' }, items.map(item => (
            React.createElement('a', { key: item.id, href: item.linkUrl, className: 'recommendation-card has-link', target: '_blank' }, [
                React.createElement('img', { src: optimizeImageUrl(item.imageUrl, 200), className: 'recommendation-card-image' }),
                React.createElement('div', null, [
                    React.createElement('h3', { className: 'recommendation-card-title' }, item.title),
                    React.createElement('p', { className: 'recommendation-card-description' }, item.description)
                ])
            ])
        )))
    ]);
};

const GeneratorPage = () => {
    const [text, setText] = useState('La IA es el pincel del futuro.');
    const genRef = useRef(null);
    return React.createElement('div', { className: 'contact-container' }, [
        React.createElement('div', { ref: genRef, style: { background:'#000', padding:'2rem', borderRadius:'12px', border:'1px solid #333', marginBottom:'1.5rem' } }, [
            React.createElement('p', { style: {fontSize:'1.4rem', fontWeight:'500'} }, text),
            React.createElement('p', { style: {color:'#666', marginTop:'1rem'} }, '@TheRamzes')
        ]),
        React.createElement('textarea', { className: 'search-input', style: {paddingLeft:'1rem', marginBottom:'1rem'}, value: text, onChange: (e) => setText(e.target.value) }),
        React.createElement('button', { className: 'btn-capture', style: {width:'100%'}, onClick: async () => {
            const data = await toPng(genRef.current);
            const link = document.createElement('a'); link.href = data; link.download = 'post.png'; link.click();
        } }, 'Descargar Post')
    ]);
};

const FrameCapturerPage = () => {
    const [vSrc, setVSrc] = useState(null);
    const [caps, setCaps] = useState([]);
    const [cur, setCur] = useState(0);
    const [dur, setDur] = useState(0);
    const vRef = useRef(null);
    const fRef = useRef(null);
    const format = (t) => `${Math.floor(t/60)}:${Math.floor(t%60).toString().padStart(2,'0')}.${Math.floor((t%1)*1000).toString().padStart(3,'0')}`;
    if (!vSrc) return React.createElement('div', { className: 'drop-zone', onClick: () => fRef.current.click() }, [
        React.createElement('input', { type: 'file', ref: fRef, hidden: true, onChange: (e) => setVSrc(URL.createObjectURL(e.target.files[0])) }),
        React.createElement('p', null, 'Carga un video para extraer frames')
    ]);
    return React.createElement('div', { className: 'video-editor-layout' }, [
        React.createElement('div', null, [
            React.createElement('video', { ref: vRef, src: vSrc, className: 'video-element', onLoadedMetadata: () => setDur(vRef.current.duration), onTimeUpdate: () => setCur(vRef.current.currentTime) }),
            React.createElement('div', { className: 'video-controls-panel' }, [
                React.createElement('input', { type:'range', className:'scrubbing-slider', min:0, max:dur, step:0.001, value:cur, onChange:(e) => vRef.current.currentTime = e.target.value }),
                React.createElement('p', { className:'time-display' }, format(cur)),
                React.createElement('button', { className:'btn-capture', style:{width:'100%'}, onClick:() => {
                    const canvas = document.createElement('canvas'); canvas.width = vRef.current.videoWidth; canvas.height = vRef.current.videoHeight;
                    canvas.getContext('2d').drawImage(vRef.current, 0, 0);
                    setCaps([{ id:Date.now(), url:canvas.toDataURL('image/png'), time:format(vRef.current.currentTime) }, ...caps]);
                } }, 'Capturar Frame')
            ])
        ]),
        React.createElement('div', { className: 'captures-sidebar' }, caps.map(c => React.createElement('div', { key: c.id, className: 'capture-item' }, [
            React.createElement('img', { src: c.url }),
            React.createElement('button', { className:'capture-overlay-btn', onClick:() => { const a = document.createElement('a'); a.href = c.url; a.download=`f_${c.time}.png`; a.click(); } }, 'Guardar')
        ])))
    ]);
};

// --- App Root ---
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
