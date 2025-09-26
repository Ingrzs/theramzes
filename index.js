

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import React, { useState, useEffect } from 'https://esm.sh/react@18';
import ReactDOM from 'https://esm.sh/react-dom@18/client';
import { firebaseConfig } from './config.js';

// Initialize Firebase
let app, db;
try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('Firebase inicializado correctamente');
} catch (error) {
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
    const Component = hasLink ? 'a' : 'div';
    const props = {
        className: 'recommendation-card',
    };
    if (hasLink) {
        props.href = item.linkUrl;
        props.target = '_blank';
        props.rel = 'noopener noreferrer';
    }

    return React.createElement(Component, props, [
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
    ]);
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

const AboutMe = ({ setActiveTab }) => {
    return React.createElement('div', { className: 'about-me-container' }, [
        React.createElement('img', {
            key: 'profile',
            src: 'https://storage.googleapis.com/maker-suite-guides/codelab-react-app/profile_pic.png',
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
            React.createElement('button', {
                key: 'blog',
                onClick: () => setActiveTab('imagenes'),
                className: 'social-link'
            }, 'Mi Blog'),
            React.createElement('a', {
                key: 'youtube',
                href: 'https://youtube.com',
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'social-link'
            }, 'YouTube'),
            React.createElement('a', {
                key: 'tiktok',
                href: 'https://tiktok.com',
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'social-link'
            }, 'TikTok'),
            React.createElement('a', {
                key: 'productos',
                href: '#',
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'social-link'
            }, 'Productos Afiliados'),
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
        alert('¡Formulario enviado! (Funcionalidad simulada)');
    };

    return React.createElement('div', { className: 'contact-container' }, [
        React.createElement('h2', { key: 'title' }, 'Contacto'),
        React.createElement('form', { key: 'form', onSubmit: handleSubmit }, [
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
                    required: true
                }, [
                    React.createElement('option', { key: 'empty', value: '' }, 'Selecciona un motivo...'),
                    React.createElement('option', { key: 'consulta', value: 'consulta' }, 'Consulta General'),
                    React.createElement('option', { key: 'colaboracion', value: 'colaboracion' }, 'Propuesta de Colaboración'),
                    React.createElement('option', { key: 'reporte', value: 'reporte' }, 'Reportar un Error'),
                    React.createElement('option', { key: 'sugerencia', value: 'sugerencia' }, 'Sugerencia'),
                    React.createElement('option', { key: 'otro', value: 'otro' }, 'Otro')
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

const PrivacyPolicyModal = ({ onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return React.createElement('div', { className: 'modal-backdrop', onClick: onClose },
        React.createElement('div', { className: 'modal-content', onClick: e => e.stopPropagation() }, [
            React.createElement('div', { key: 'header', className: 'modal-header' }, [
                React.createElement('h2', { key: 'title' }, 'Política de Privacidad'),
                React.createElement('button', { key: 'close', className: 'modal-close-button', onClick: onClose, 'aria-label': 'Cerrar' }, '×')
            ]),
            React.createElement('div', { key: 'body', className: 'modal-body' }, [
                React.createElement('p', { key: 'date' }, `Última actualización: ${new Date().toLocaleDateString('es-ES')}`),
                React.createElement('p', { key: 'intro' }, 'Bienvenido a TheRamzes - AI Prompts & Creations. Su privacidad es de suma importancia para nosotros. Esta Política de Privacidad describe qué datos recopilamos y cómo los usamos y protegemos.'),

                React.createElement('h3', { key: 'h-info' }, 'Información que Recopilamos'),
                React.createElement('p', { key: 'p-info1' }, React.createElement('strong', null, 'Datos de Contacto: '), 'Si decide contactarnos a través de nuestro formulario, recopilaremos su nombre y dirección de correo electrónico para poder responder a su consulta. No utilizaremos esta información para ningún otro propósito sin su consentimiento explícito.'),
                React.createElement('p', { key: 'p-info2' }, React.createElement('strong', null, 'Datos de Uso (Analytics): '), 'Utilizamos servicios como Firebase Analytics (un producto de Google) para recopilar información anónima sobre cómo los visitantes interactúan con nuestro sitio web. Esto incluye datos como las páginas que visita, el tiempo que pasa en el sitio y el tipo de dispositivo que utiliza. Esta información nos ayuda a mejorar la experiencia del usuario y el contenido que ofrecemos. No se recopila información de identificación personal.'),
                
                React.createElement('h3', { key: 'h-usage' }, 'Cómo Usamos su Información'),
                React.createElement('p', { key: 'p-usage' }, 'Utilizamos la información que recopilamos para: responder a sus consultas, mejorar y optimizar nuestro sitio web, y analizar tendencias de uso para crear contenido más relevante.'),

                React.createElement('h3', { key: 'h-cookies' }, 'Cookies'),
                React.createElement('p', { key: 'p-cookies' }, 'Nuestro sitio utiliza cookies necesarias para su funcionamiento y para los servicios de análisis proporcionados por Google (Firebase). Las cookies son pequeños archivos de texto que se almacenan en su dispositivo. Puede configurar su navegador para que rechace las cookies, pero esto podría afectar la funcionalidad del sitio.'),

                React.createElement('h3', { key: 'h-third-party' }, 'Enlaces a Terceros'),
                React.createElement('p', { key: 'p-third-party' }, 'Este sitio puede contener enlaces a sitios web de terceros (por ejemplo, en las secciones de "Recomendaciones" o "Tutoriales"). No somos responsables de las prácticas de privacidad ni del contenido de estos sitios externos. Le recomendamos leer sus políticas de privacidad.'),

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

// Main App Component
const App = () => {
    const [activeTab, setActiveTab] = useState('imagenes');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPolicyVisible, setIsPolicyVisible] = useState(false);

    const tabs = ['imagenes', 'videos', 'descargas', 'recomendaciones', 'tutoriales', 'sobre mi', 'contacto'];

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            
            try {
                console.log('Cargando datos desde Firebase...');
                const contentCollectionRef = collection(db, 'content');
                const contentSnapshot = await getDocs(contentCollectionRef);
                
                const contentList = contentSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                setData(contentList);
                console.log(`Datos cargados: ${contentList.length} elementos`);
            } catch (err) {
                console.error("Error al cargar datos:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        if (db) {
            fetchData();
        } else {
            setError(new Error('Firebase no se inicializó correctamente'));
            setLoading(false);
        }
    }, []);

    const formatTabName = (tab) => {
        const names = {
            'imagenes': 'Imágenes',
            'videos': 'Videos',
            'descargas': 'Descargas',
            'recomendaciones': 'Recomendaciones',
            'tutoriales': 'Tutoriales',
            'sobre mi': 'Sobre Mí',
            'contacto': 'Contacto'
        };
        return names[tab] || tab.charAt(0).toUpperCase() + tab.slice(1);
    };

    const renderContent = () => {
        // Handle static pages first
        if (activeTab === 'sobre mi') return React.createElement(AboutMe, { setActiveTab });
        if (activeTab === 'contacto') return React.createElement(ContactForm);

        // Handle loading state for dynamic content
        if (loading) {
            return React.createElement(LoadingState);
        }

        // Handle error state
        if (error) {
            return React.createElement(ErrorState, { error });
        }

        // Filter data by category
        const filteredData = data.filter(item => item.category === activeTab);

        // Handle empty state
        if (filteredData.length === 0) {
            return React.createElement(EmptyState, {
                message: `Aún no hay contenido en "${formatTabName(activeTab)}". ¡Vuelve pronto!`
            });
        }

        // Render content based on tab
        let CardComponent;
        let containerClassName = 'content-grid';

        switch (activeTab) {
            case 'imagenes':
            case 'videos':
                CardComponent = ImagePromptCard;
                break;
            case 'descargas':
                CardComponent = DownloadCard;
                break;
            case 'tutoriales':
                CardComponent = TutorialCard;
                break;
            case 'recomendaciones':
                CardComponent = RecommendationCard;
                containerClassName = 'recommendation-list';
                break;

            default:
                CardComponent = ImagePromptCard;
        }

        return React.createElement('div', { className: containerClassName },
            filteredData.map(item => 
                React.createElement(CardComponent, { key: item.id, item })
            )
        );
    };

    return React.createElement('div', {}, [
        React.createElement('header', { key: 'header', className: 'app-header' }, [
            React.createElement('h1', { key: 'title' }, 'TheRamzes'),
            React.createElement('p', { 
                key: 'welcome', 
                className: 'welcome-text' 
            }, 'Bienvenido a mi universo creativo. Descubre, aprende y crea con la ayuda de la inteligencia artificial.'),
            React.createElement('nav', { 
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
                        onClick: () => setActiveTab(tab)
                    }, formatTabName(tab))
                )
            )
        ]),
        React.createElement('main', { key: 'main', role: 'tabpanel' }, renderContent()),
        React.createElement('footer', { key: 'footer' }, [
            React.createElement('p', { key: 'copyright' }, `© ${new Date().getFullYear()} TheRamzes. Todos los derechos reservados.`),
            React.createElement('button', {
                key: 'privacy',
                onClick: () => setIsPolicyVisible(true),
                className: 'footer-link'
            }, 'Política de Privacidad')
        ]),
        isPolicyVisible && React.createElement(PrivacyPolicyModal, { onClose: () => setIsPolicyVisible(false) })
    ]);
};

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
