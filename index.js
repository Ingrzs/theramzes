




import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, getDocs, getDoc, doc, query, orderBy, limit, startAfter } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import React, { useState, useEffect, useMemo, useCallback } from 'https://esm.sh/react@18';
import ReactDOM from 'https://esm.sh/react-dom@18/client';
import Fuse from 'https://esm.sh/fuse.js@7.0.0';

// La configuración de Firebase se inyecta aquí durante el proceso de despliegue.
// El valor de apiKey proviene de las variables de entorno de Vercel para mayor seguridad.
const firebaseConfig = {
    apiKey: "__FIREBASE_API_KEY__", // Inyectado automáticamente durante el despliegue
    authDomain: "theramzes-creations.firebaseapp.com",
    projectId: "theramzes-creations",
    storageBucket: "theramzes-creations.appspot.com",
    messagingSenderId: "497450013723",
    appId: "1:497450013723:web:1d3019c9c0d7da82a754be",
    measurementId: "G-1B2TVSMM1Y"
};


// Initialize Firebase
let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('Firebase inicializado correctamente');
} catch (error)
{
    console.error('Error inicializando Firebase:', error);
}

// Components
const ImagePromptCard = ({ item }) => {
    const [isPromptVisible, setIsPromptVisible] = useState(false);
    const [copyStatus, setCopyStatus] = useState('Copiar');

    const handleCopy = () => {
        if (item.prompt) {
            navigator.clipboard.writeText(item.prompt).then(() => {
                setCopyStatus('¡Copiado!');
                setTimeout(() => setCopyStatus('Copiar'), 2000);
            }, () => {
                setCopyStatus('Error');
            });
        }
    };

    const promptId = `prompt-${item.id}`;

    return React.createElement('div', { className: 'card' }, [
        React.createElement('img', {
            key: 'image',
            src: item.imageUrl,
            alt: item.title,
            className: 'card-image',
            loading: 'lazy'
        }),
        React.createElement('div', { key: 'content', className: 'card-content' }, [
            React.createElement('h3', { key: 'title', className: 'card-title' }, item.title),
            React.createElement('div', { key: 'actions', className: 'card-actions' },
                React.createElement('button', {
                    className: 'card-button',
                    onClick: () => setIsPromptVisible(!isPromptVisible),
                    'aria-expanded': isPromptVisible,
                    'aria-controls': promptId
                }, isPromptVisible ? 'Ocultar Prompt' : 'Ver Prompt')
            )
        ]),
        React.createElement('div', {
            key: 'prompt',
            id: promptId,
            className: `prompt-container ${isPromptVisible ? 'visible' : ''}`
        }, [
            React.createElement('button', {
                key: 'copy',
                className: 'copy-button',
                onClick: handleCopy
            }, copyStatus),
            React.createElement('p', { key: 'text' }, item.prompt)
        ])
    ]);
};

const DownloadCard = ({ item }) => {
    return React.createElement('div', { className: 'card' }, [
        React.createElement('img', {
            key: 'image',
            src: item.imageUrl,
            alt: item.title,
            className: 'card-image',
            loading: 'lazy'
        }),
        React.createElement('div', { key: 'content', className: 'card-content' }, [
            React.createElement('h3', { key: 'title', className: 'card-title' }, item.title),
            React.createElement('p', { key: 'description', className: 'download-text' }, item.description),
            React.createElement('div', { key: 'actions', className: 'card-actions' },
                React.createElement('a', {
                    key: 'download',
                    href: item.downloadUrl,
                    className: 'card-button',
                    download: true
                }, 'Descargar')
            )
        ])
    ]);
};

const RecommendationCard = ({ item }) => {
    const hasLink = item.linkUrl && typeof item.linkUrl === 'string' && item.linkUrl.trim() !== '';

    const cardContent = [
        React.createElement('img', {
            key: 'image',
            src: item.imageUrl,
            alt: item.title,
            className: 'recommendation-card-image',
            loading: 'lazy'
        }),
        React.createElement('div', { key: 'content', className: 'recommendation-card-content' }, [
            React.createElement('h3', { key: 'title', className: 'recommendation-card-title' }, item.title),
            React.createElement('p', { key: 'description', className: 'recommendation-card-description' }, item.description)
        ])
    ];

    if (hasLink) {
        return React.createElement('a', {
            href: item.linkUrl,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'recommendation-card has-link'
        }, cardContent);
    }

    return React.createElement('div', {
        className: 'recommendation-card'
    }, cardContent);
};


const TutorialCard = ({ item }) => {
    return React.createElement('div', { className: 'card' }, [
        React.createElement('img', {
            key: 'image',
            src: item.imageUrl,
            alt: item.title,
            className: 'card-image',
            loading: 'lazy'
        }),
        React.createElement('div', { key: 'content', className: 'card-content' }, [
            React.createElement('h3', { key: 'title', className: 'card-title' }, item.title),
            React.createElement('p', { key: 'description', className: 'download-text' }, item.description),
            React.createElement('div', { key: 'actions', className: 'card-actions' },
                React.createElement('a', {
                    key: 'link',
                    href: item.linkUrl,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    className: 'card-button'
                }, 'Ver Tutorial')
            )
        ])
    ]);
};

const AffiliateCard = ({ item }) => {
    return React.createElement('div', { className: 'card' }, [
        React.createElement('img', {
            key: 'image',
            src: item.imageUrl,
            alt: item.title,
            className: 'card-image',
            loading: 'lazy'
        }),
        React.createElement('div', { key: 'content', className: 'card-content' }, [
            React.createElement('h3', { key: 'title', className: 'card-title' }, item.title),
            React.createElement('p', { key: 'description', className: 'download-text' }, item.description),
            item.disclaimer && React.createElement('p', { key: 'disclaimer', className: 'affiliate-disclaimer' }, item.disclaimer),
            React.createElement('div', { key: 'actions', className: 'card-actions' },
                React.createElement('a', {
                    key: 'link',
                    href: item.linkUrl,
                    target: '_blank',
                    rel: 'noopener noreferrer sponsored',
                    className: 'card-button'
                }, 'Ver Producto')
            )
        ])
    ]);
};

const AboutMe = ({ setActiveTab }) => {
    return React.createElement('div', { className: 'about-me-container' }, [
        React.createElement('img', {
            key: 'profile',
            src: 'https://yt3.googleusercontent.com/UsEE3B7HZCqYlFrE6zI601Pq-_moV7q1diFWggkrSM5yI7imCvZWnBAjnOy5gp6_xx1LAZTUHg=s160-c-k-c0x00ffffff-no-rj',
            alt: 'Profile',
            className: 'profile-pic',
            loading: 'lazy'
        }),
        React.createElement('h2', { key: 'name' }, 'TheRamzes'),
        React.createElement('p', {
            key: 'bio',
            className: 'bio'
        }, 'Creador de contenido, explorador de IA y apasionado por la tecnología. Aquí comparto mis creaciones y recursos favoritos.'),
        React.createElement('div', { key: 'links', className: 'links-container' }, [
            React.createElement('a', {
                key: 'youtube',
                href: 'https://www.youtube.com/@TheRamzes',
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'social-link'
            }, 'YouTube'),
            React.createElement('a', {
                key: 'tiktok',
                href: 'https://www.tiktok.com/@theramzestech',
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'social-link'
            }, 'TikTok'),
            React.createElement('button', {
                key: 'creaciones',
                onClick: () => setActiveTab('imagenes'),
                className: 'social-link'
            }, 'Explorar Creaciones'),
            React.createElement('button', {
                key: 'recursos-fav',
                onClick: () => setActiveTab('recursos'),
                className: 'social-link'
            }, 'Explora mis recursos favoritos'),
            React.createElement('button', {
                key: 'contacto',
                onClick: () => setActiveTab('contacto'),
                className: 'social-link'
            }, 'Contacto por Email')
        ])
    ]);
};

const ContactForm = () => {
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const subject = formData.get('subject');
        const message = formData.get('message');
        const name = formData.get('name');
        const email = formData.get('email');

        const body = `Nombre: ${name}\nCorreo: ${email}\n\nMensaje:\n${message}`;
        
        const mailtoLink = `mailto:theramzesyt@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        window.location.href = mailtoLink;
        alert('Se abrirá tu cliente de correo para enviar el mensaje. ¡Gracias!');
    };

    return React.createElement('div', { className: 'contact-container' }, [
        React.createElement('h2', { key: 'title' }, 'Contacto'),
        React.createElement('form', { key: 'form', onSubmit: handleSubmit, className: 'contact-form' }, [
            React.createElement('div', { key: 'name-group', className: 'form-group' }, [
                React.createElement('label', { key: 'name-label', htmlFor: 'name' }, 'Nombre'),
                React.createElement('input', {
                    key: 'name-input',
                    type: 'text',
                    id: 'name',
                    name: 'name',
                    required: true
                })
            ]),
            React.createElement('div', { key: 'email-group', className: 'form-group' }, [
                React.createElement('label', { key: 'email-label', htmlFor: 'email' }, 'Correo Electrónico'),
                React.createElement('input', {
                    key: 'email-input',
                    type: 'email',
                    id: 'email',
                    name: 'email',
                    required: true
                })
            ]),
            React.createElement('div', { key: 'subject-group', className: 'form-group' }, [
                React.createElement('label', { key: 'subject-label', htmlFor: 'subject' }, 'Asunto'),
                React.createElement('select', {
                    key: 'subject-select',
                    id: 'subject',
                    name: 'subject',
                    required: true,
                    defaultValue: ""
                }, [
                    React.createElement('option', { key: 'empty', value: '', disabled: true }, 'Selecciona un motivo...'),
                    React.createElement('option', { key: 'consulta', value: 'Consulta General' }, 'Consulta General'),
                    React.createElement('option', { key: 'colaboracion', value: 'Propuesta de Colaboración' }, 'Propuesta de Colaboración'),
                    React.createElement('option', { key: 'reporte', value: 'Reportar un Error' }, 'Reportar un Error'),
                    React.createElement('option', { key: 'sugerencia', value: 'Sugerencia' }, 'Sugerencia'),
                    React.createElement('option', { key: 'otro', value: 'Otro' }, 'Otro')
                ])
            ]),
            React.createElement('div', { key: 'message-group', className: 'form-group' }, [
                React.createElement('label', { key: 'message-label', htmlFor: 'message' }, 'Mensaje'),
                React.createElement('textarea', {
                    key: 'message-textarea',
                    id: 'message',
                    name: 'message',
                    rows: 5,
                    required: true
                })
            ]),
            React.createElement('button', {
                key: 'submit',
                type: 'submit',
                className: 'submit-button'
            }, 'Enviar Mensaje')
        ])
    ]);
};

const PrivacyPolicyModal = ({ isVisible, onClose }) => {
    useEffect(() => {
        if (!isVisible) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return React.createElement('div', {
        className: 'modal-backdrop',
        onClick: (e) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        }
    },
        React.createElement('div', {
            className: 'modal-content',
            onClick: (e) => e.stopPropagation()
        }, [
            React.createElement('div', { key: 'header', className: 'modal-header' }, [
                React.createElement('h2', { key: 'title' }, 'Política de Privacidad'),
                React.createElement('button', {
                    key: 'close',
                    className: 'modal-close-button',
                    onClick: onClose,
                    'aria-label': 'Cerrar',
                    type: 'button'
                }, '×')
            ]),
            React.createElement('div', { key: 'body', className: 'modal-body' }, [
                React.createElement('p', { key: 'date' }, `Última actualización: ${new Date().toLocaleDateString('es-ES')}`),
                React.createElement('p', { key: 'intro' }, 'Bienvenido a TheRamzes - AI Prompts & Creations. Su privacidad es de suma importancia para nosotros. Esta Política de Privacidad describe qué datos recopilamos y cómo los usamos y protegemos.'),

                React.createElement('h3', { key: 'h-info' }, 'Información que Recopilamos'),
                React.createElement('p', { key: 'p-info1' }, [
                    React.createElement('strong', { key: 'bold1' }, 'Datos de Contacto: '),
                    'Si decide contactarnos a través de nuestro formulario, recopilaremos su nombre y dirección de correo electrónico para poder responder a su consulta. No utilizaremos esta información para ningún otro propósito sin su consentimiento explícito.'
                ]),
                React.createElement('p', { key: 'p-info2' }, [
                    React.createElement('strong', { key: 'bold2' }, 'Datos de Uso (Analytics): '),
                    'Utilizamos servicios como Firebase Analytics (un producto de Google) para recopilar información anónima sobre cómo los visitantes interactúan con nuestro sitio web. Esto incluye datos como las páginas que visita, el tiempo que pasa en el sitio y el tipo de dispositivo que utiliza. Esta información nos ayuda a mejorar la experiencia del usuario y el contenido que ofrecemos. No se recopila información de identificación personal.'
                ]),

                React.createElement('h3', { key: 'h-usage' }, 'Cómo Usamos su Información'),
                React.createElement('p', { key: 'p-usage' }, 'Utilizamos la información que recopilamos para: responder a sus consultas, mejorar y optimizar nuestro sitio web, y analizar tendencias de uso para crear contenido más relevante.'),

                React.createElement('h3', { key: 'h-cookies' }, 'Cookies'),
                React.createElement('p', { key: 'p-cookies' }, 'Nuestro sitio utiliza cookies necesarias para su funcionamiento y para los servicios de análisis proporcionados por Google (Firebase). Las cookies son pequeños archivos de texto que se almacenan en su dispositivo. Puede configurar su navegador para que rechace las cookies, pero esto podría afectar la funcionalidad del sitio.'),
                
                React.createElement('h3', { key: 'h-affiliates' }, 'Enlaces de Afiliados'),
                React.createElement('p', { key: 'p-affiliates' }, 'Este sitio puede contener enlaces de afiliados. Si realiza una compra a través de estos enlaces, podemos recibir una comisión sin costo adicional para usted. Indicamos claramente este tipo de contenido.'),

                React.createElement('h3', { key: 'h-third-party' }, 'Enlaces a Terceros'),
                React.createElement('p', { key: 'p-third-party' }, 'Este sitio puede contener enlaces a sitios web de terceros (por ejemplo, en las secciones de "Recomendaciones", "Tutoriales" o "Afiliados"). No somos responsables de las prácticas de privacidad ni del contenido de estos sitios externos. Le recomendamos leer sus políticas de privacidad.'),

                React.createElement('h3', { key: 'h-security' }, 'Seguridad de los Datos'),
                React.createElement('p', { key: 'p-security' }, 'Implementamos medidas de seguridad razonables para proteger la información contra el acceso, alteración o destrucción no autorizados. Sin embargo, ningún método de transmisión por Internet es 100% seguro.'),

                React.createElement('h3', { key: 'h-changes' }, 'Cambios a esta Política'),
                React.createElement('p', { key: 'p-changes' }, 'Nos reservamos el derecho de modificar esta política de privacidad en cualquier momento. Cualquier cambio será efectivo inmediatamente después de su publicación en esta página.'),

                React.createElement('h3', { key: 'h-contact' }, 'Contacto'),
                React.createElement('p', { key: 'p-contact' }, 'Si tiene alguna pregunta sobre esta Política de Privacidad, puede contactarnos a través del formulario de contacto disponible en este sitio.')
            ])
        ])
    );
};

const EmptyState = ({ message }) => {
    return React.createElement('div', { className: 'empty-state-container' },
        React.createElement('p', {}, message)
    );
};

const LoadingState = () => {
    return React.createElement('div', { className: 'loading-container' }, [
        React.createElement('div', { key: 'spinner', className: 'loading-spinner' }),
        React.createElement('p', { key: 'text' }, 'Cargando datos...')
    ]);
};

const ErrorState = ({ error }) => {
    return React.createElement('div', { className: 'error-container' }, [
        React.createElement('h3', { key: 'title' }, 'Error de conexión'),
        React.createElement('p', { key: 'message' }, `No se pudieron cargar los datos: ${error.message}`),
        React.createElement('p', { key: 'help' }, 'Verifica tu conexión a internet y las reglas de Firestore.')
    ]);
};

const ResourcesPage = ({ allData, resourcesDisclaimer }) => {
    const recommendations = allData.filter(item => item.category === 'recomendaciones');
    const affiliates = allData.filter(item => item.category === 'afiliados');

    return React.createElement('div', { className: 'resources-container' }, [
        React.createElement('h2', { key: 'header', className: 'resources-header' }, 'Recursos para Creadores'),
        resourcesDisclaimer && React.createElement('p', { key: 'disclaimer', className: 'resources-disclaimer' }, resourcesDisclaimer),
        
        React.createElement('h3', { key: 'rec-subheader', className: 'resources-subheader' }, 'Software y Plataformas Esenciales'),
        recommendations.length > 0
            ? React.createElement('div', { key: 'rec-list', className: 'recommendation-list' },
                recommendations.map(item => React.createElement(RecommendationCard, { key: item.id, item }))
              )
            : React.createElement(EmptyState, { key: 'rec-empty', message: 'Próximamente encontrarás aquí software y webs recomendadas.' }),

        React.createElement('h3', { key: 'aff-subheader', className: 'resources-subheader' }, 'Descubre gadgets y productos útiles'),
        affiliates.length > 0
            ? React.createElement('div', { key: 'aff-grid', className: 'content-grid' },
                affiliates.map(item => React.createElement(AffiliateCard, { key: item.id, item }))
              )
            : React.createElement(EmptyState, { key: 'aff-empty', message: 'Próximamente encontrarás aquí los productos que uso y recomiendo.' })
    ]);
};


// Main App Component
const App = () => {
    const [activeTab, setActiveTab] = useState('imagenes');
    const [data, setData] = useState([]);
    const [lastDoc, setLastDoc] = useState(null); // Para paginación
    const [hasMore, setHasMore] = useState(true); // Para saber si hay más datos
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [isPolicyVisible, setIsPolicyVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [resourcesDisclaimer, setResourcesDisclaimer] = useState('');

    const tabs = ['imagenes', 'videos', 'descargas', 'tutoriales', 'recursos', 'sobre mi', 'contacto'];
    const CONTENT_PER_PAGE = 12;

    const fuse = useMemo(() => {
        if (data.length > 0) {
            return new Fuse(data, {
                keys: ['title', 'description', 'prompt'],
                includeScore: true,
                threshold: 0.4,
                minMatchCharLength: 2,
            });
        }
        return null;
    }, [data]);
    
    const fetchAllDataForSearch = useCallback(async () => {
        try {
            const contentCollectionRef = collection(db, 'content');
            const contentSnapshot = await getDocs(contentCollectionRef);
            const contentList = contentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return contentList;
        } catch (err) {
            console.error("Error fetching all data for search:", err);
            return [];
        }
    }, []);

    const fetchSettings = useCallback(async () => {
        if (!db) return;
        try {
            const settingsDocRef = doc(db, 'settings', 'disclaimers');
            const docSnap = await getDoc(settingsDocRef);
            if (docSnap.exists()) {
                setResourcesDisclaimer(docSnap.data().resourcesPageDisclaimer || '');
            }
        } catch (err) {
            console.error("Error fetching settings:", err);
        }
    }, []);

    const fetchData = useCallback(async (startAfterDoc = null) => {
        if (!db) {
            setError(new Error('Firebase no se inicializó correctamente'));
            setLoading(false);
            return;
        }

        const isInitialLoad = !startAfterDoc;
        if (isInitialLoad) {
            setLoading(true);
            fetchSettings(); // Cargar la configuración al inicio
        } else {
            setLoadingMore(true);
        }
        setError(null);

        try {
            const contentCollectionRef = collection(db, 'content');
            let q;
            if (startAfterDoc) {
                q = query(contentCollectionRef, orderBy('createdAt', 'desc'), startAfter(startAfterDoc), limit(CONTENT_PER_PAGE));
            } else {
                q = query(contentCollectionRef, orderBy('createdAt', 'desc'), limit(CONTENT_PER_PAGE));
            }
            
            const contentSnapshot = await getDocs(q);

            const contentList = contentSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            const lastVisible = contentSnapshot.docs[contentSnapshot.docs.length - 1];
            setLastDoc(lastVisible);
            
            if (contentList.length < CONTENT_PER_PAGE) {
                setHasMore(false);
            }

            setData(prevData => isInitialLoad ? contentList : [...prevData, ...contentList]);
        } catch (err) {
            console.error("Error al cargar datos:", err);
            setError(err);
        } finally {
            if (isInitialLoad) {
                setLoading(false);
            } else {
                setLoadingMore(false);
            }
        }
    }, [fetchSettings]);


    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const performSearch = async () => {
             if (searchQuery) {
                const allData = await fetchAllDataForSearch();
                const fuseInstance = new Fuse(allData, {
                    keys: ['title', 'description', 'prompt'],
                    includeScore: true,
                    threshold: 0.4,
                    minMatchCharLength: 2,
                });
                const results = fuseInstance.search(searchQuery).map(result => result.item);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        };
        performSearch();
    }, [searchQuery, fetchAllDataForSearch]);


    const formatTabName = (tab) => {
        const names = {
            'imagenes': 'Imágenes',
            'videos': 'Videos',
            'descargas': 'Descargas',
            'tutoriales': 'Tutoriales',
            'recursos': 'Recursos',
            'sobre mi': 'Sobre Mí',
            'contacto': 'Contacto'
        };
        return names[tab] || tab.charAt(0).toUpperCase() + tab.slice(1);
    };

    const getCardComponent = (category) => {
        switch (category) {
            case 'imagenes':
            case 'videos':
                return ImagePromptCard;
            case 'descargas':
                return DownloadCard;
            case 'tutoriales':
                return TutorialCard;
             case 'afiliados':
                return AffiliateCard;
            case 'recomendaciones':
                return RecommendationCard;
            default:
                return ImagePromptCard; // Fallback
        }
    };
    
    const renderContent = () => {
        if (loading) return React.createElement(LoadingState);
        if (error) return React.createElement(ErrorState, { error });

        if (searchQuery) {
            if (searchResults.length === 0) {
                return React.createElement(EmptyState, {
                    message: `No se encontraron resultados para "${searchQuery}".`
                });
            }
            const recommendationResults = searchResults.filter(item => item.category === 'recomendaciones');
            const gridResults = searchResults.filter(item => item.category !== 'recomendaciones');

            return React.createElement(React.Fragment, null, [
                gridResults.length > 0 && React.createElement('div', { key: 'grid', className: 'content-grid' },
                    gridResults.map(item => {
                        const CardComponent = getCardComponent(item.category);
                        return React.createElement(CardComponent, { key: item.id, item });
                    })
                ),
                recommendationResults.length > 0 && React.createElement('div', { key: 'list', className: 'recommendation-list', style: {marginTop: '1.5rem'} },
                    recommendationResults.map(item => {
                         const CardComponent = getCardComponent(item.category);
                        return React.createElement(CardComponent, { key: item.id, item });
                    })
                )
            ]);
        }
        
        if (activeTab === 'sobre mi') return React.createElement(AboutMe, { setActiveTab });
        if (activeTab === 'contacto') return React.createElement(ContactForm);
        if (activeTab === 'recursos') return React.createElement(ResourcesPage, { allData: data, resourcesDisclaimer: resourcesDisclaimer });

        const filteredData = data.filter(item => item.category === activeTab);

        if (filteredData.length === 0 && !hasMore) {
            return React.createElement(EmptyState, {
                message: `Aún no hay contenido en "${formatTabName(activeTab)}". ¡Vuelve pronto!`
            });
        }
        
        const CardComponent = getCardComponent(activeTab);
        const containerClassName = activeTab === 'recomendaciones' ? 'recommendation-list' : 'content-grid';

        return React.createElement(React.Fragment, null, [
            React.createElement('div', { key: 'content-container', className: containerClassName },
                filteredData.map(item =>
                    React.createElement(CardComponent, { key: item.id, item })
                )
            ),
             hasMore && !loadingMore && ['imagenes', 'videos', 'descargas', 'tutoriales'].includes(activeTab) && React.createElement('div', { key: 'load-more-container', className: 'load-more-container' },
                React.createElement('button', {
                    className: 'load-more-button',
                    onClick: () => fetchData(lastDoc)
                }, 'Cargar más')
            ),
            loadingMore && React.createElement('div', { key: 'loading-more-spinner', className: 'loading-spinner', style: { marginTop: '2rem' } })
        ]);
    };
    
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    return React.createElement('div', {}, [
        React.createElement('header', { key: 'header', className: 'app-header' }, [
            React.createElement('h1', { key: 'title' }, 'TheRamzes'),
            React.createElement('p', {
                key: 'welcome',
                className: 'welcome-text'
            }, 'Bienvenido a mi universo creativo. Descubre, aprende y crea con la ayuda de la inteligencia artificial.'),
            
            React.createElement('div', { key: 'search', className: 'search-container' }, [
                 React.createElement('svg', { 
                    key: 'icon', 
                    className: 'search-icon', 
                    xmlns: "http://www.w3.org/2000/svg", 
                    viewBox: "0 0 24 24", 
                    fill: "currentColor" 
                }, React.createElement('path', { d: "M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z" })),
                 React.createElement('input', {
                    key: 'input',
                    type: 'search',
                    className: 'search-input',
                    placeholder: 'Buscar en todo el sitio...',
                    value: searchQuery,
                    onChange: handleSearchChange,
                    'aria-label': 'Buscar contenido'
                })
            ]),

            !searchQuery && React.createElement('nav', {
                key: 'nav',
                className: 'tabs-nav',
                role: 'tablist',
                'aria-label': 'Navegación de contenido'
            },
                tabs.map(tab =>
                    React.createElement('button', {
                        key: tab,
                        role: 'tab',
                        'aria-selected': activeTab === tab,
                        className: `tab-button ${activeTab === tab ? 'active' : ''}`,
                        onClick: () => {
                            setActiveTab(tab);
                            // Reset data for pagination when changing tabs
                            setData([]);
                            setLastDoc(null);
                            setHasMore(true);
                            // Fetch data for the new tab
                            if (!['sobre mi', 'contacto', 'recursos'].includes(tab)) {
                                fetchData();
                            }
                        }
                    }, formatTabName(tab))
                )
            )
        ]),
        
        React.createElement('main', { key: 'main' }, [
            searchQuery && React.createElement('h2', { key: 'search-title', className: 'search-results-header' }, `Resultados para: "${searchQuery}"`),
            React.createElement('div', { role: 'tabpanel' }, renderContent())
        ]),

        React.createElement('footer', { key: 'footer' }, [
            React.createElement('p', { key: 'copyright' }, `© ${new Date().getFullYear()} TheRamzes. Todos los derechos reservados.`),
            React.createElement('a', {
                key: 'privacy',
                href: '#',
                onClick: (e) => {
                    e.preventDefault();
                    setIsPolicyVisible(true);
                },
                className: 'footer-link'
            }, 'Política de Privacidad')
        ]),
        React.createElement(PrivacyPolicyModal, {
            key: 'modal',
            isVisible: isPolicyVisible,
            onClose: () => setIsPolicyVisible(false)
        })
    ]);
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
