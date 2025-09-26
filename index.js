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

// Prevent default hash behavior
window.addEventListener('hashchange', (e) => {
    e.preventDefault();
    history.replaceState(null, null, window.location.pathname);
});

// Components
const ImagePromptCard = ({ item }) => {
    const [isPromptVisible, setIsPromptVisible] = useState(false);
    const [copyStatus, setCopyStatus] = useState('Copiar');

    const handleCopy = (e) => {
        e.stopPropagation();
        if (item.prompt) {
            navigator.clipboard.writeText(item.prompt).then(() => {
                setCopyStatus('¡Copiado!');
                setTimeout(() => setCopyStatus('Copiar'), 2000);
            }, () => {
                setCopyStatus('Error');
            });
        }
    };

    const handleTogglePrompt = (e) => {
        e.stopPropagation();
        setIsPromptVisible(!isPromptVisible);
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
                    onClick: handleTogglePrompt,
                    'aria-expanded': isPromptVisible,
                    'aria-controls': promptId,
                    type: 'button'
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
                onClick: handleCopy,
                type: 'button'
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
    const hasLink = item.linkUrl && typeof item.linkUrl === 'string' && item.linkUrl.trim() !== '' && item.linkUrl !== '#';
    
    const handleCardClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🔥 RECOMMENDATION CARD CLICKED!');
        console.log('Item:', item);
        console.log('Has link:', hasLink);
        console.log('Link URL:', item.linkUrl);
        
        if (hasLink) {
            try {
                console.log('🚀 Opening link:', item.linkUrl);
                window.open(item.linkUrl, '_blank', 'noopener,noreferrer');
            } catch (error) {
                console.error('Error opening link:', error);
                alert(`Error al abrir el enlace: ${error.message}`);
            }
        } else {
            console.log('❌ No valid link available');
            alert(`No hay enlace válido para "${item.title}"`);
        }
    };

    const cardProps = {
        className: `recommendation-card ${hasLink ? 'clickable' : 'no-link'}`,
        style: { 
            cursor: hasLink ? 'pointer' : 'default',
            border: hasLink ? '2px solid #6a0dad' : '1px solid #3a3a3a'
        }
    };

    // Always add click handler for debugging
    cardProps.onClick = handleCardClick;

    return React.createElement('div', cardProps, [
        React.createElement('img', {
            key: 'image',
            src: item.imageUrl,
            alt: item.title,
            className: 'recommendation-card-image',
            loading: 'lazy'
        }),
        React.createElement('div', { key: 'content', className: 'recommendation-card-content' }, [
            React.createElement('h3', { key: 'title', className: 'recommendation-card-title' }, item.title),
            React.createElement('p', { key: 'description', className: 'recommendation-card-description' }, item.description),
            React.createElement('div', { 
                key: 'status', 
                style: { 
                    fontSize: '0.8em', 
                    marginTop: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    backgroundColor: hasLink ? '#1a5a1a' : '#5a1a1a',
                    color: hasLink ? '#90EE90' : '#FF6B6B',
                    fontWeight: 'bold'
                } 
            }, hasLink ? '🔗 CLIC PARA ABRIR' : '❌ SIN ENLACE')
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
    const handleTabClick = (tab) => {
        console.log('Changing tab to:', tab);
        setActiveTab(tab);
    };

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
                onClick: () => handleTabClick('imagenes'),
                className: 'social-link',
                type: 'button'
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
                className: 'social-link',
                onClick: (e) => {
                    e.preventDefault();
                    alert('Productos afiliados próximamente');
                }
            }, 'Productos Afiliados'),
            React.createElement('button', {
                key: 'contacto',
                onClick: () => handleTabClick('contacto'),
                className: 'social-link',
                type: 'button'
            }, 'Contacto por Email')
        ])
    ]);
};

const ContactForm = () => {
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Form submitted');
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

const PrivacyPolicyModal = ({ isVisible, onClose }) => {
    useEffect(() => {
        if (!isVisible) return;
        
        console.log('Modal is now visible');
        
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                console.log('Escape key pressed, closing modal');
                onClose();
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, onClose]);

    if (!isVisible) {
        return null;
    }

    const handleBackdropClick = (e) => {
        console.log('Backdrop clicked');
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleCloseClick = (e) => {
        console.log('🔥 CLOSE BUTTON CLICKED!');
        e.preventDefault();
        e.stopPropagation();
        onClose();
    };

    return React.createElement('div', { 
        className: 'modal-backdrop', 
        onClick: handleBackdropClick,
        style: { zIndex: 10000 }
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
                    onClick: handleCloseClick,
                    'aria-label': 'Cerrar',
                    type: 'button',
                    style: { 
                        background: 'red', 
                        color: 'white', 
                        border: 'none',
                        fontSize: '2rem',
                        cursor: 'pointer',
                        padding: '0.5rem'
                    }
                }, '×')
            ]),
            React.createElement('div', { key: 'body', className: 'modal-body' }, [
                React.createElement('p', { key: 'date' }, `Última actualización: ${new Date().toLocaleDateString('es-ES')}`),
                React.createElement('p', { key: 'intro' }, 'Bienvenido a TheRamzes - AI Prompts & Creations. Su privacidad es de suma importancia para nosotros. Esta Política de Privacidad describe qué datos recopilamos y cómo los usamos y protegemos.'),

                React.createElement('h3', { key: 'h-info' }, 'Información que Recopilamos'),
                React.createElement('p', { key: 'p-info1' }, 'Datos de Contacto: Si decide contactarnos a través de nuestro formulario, recopilaremos su nombre y dirección de correo electrónico para poder responder a su consulta. No utilizaremos esta información para ningún otro propósito sin su consentimiento explícito.'),
                React.createElement('p', { key: 'p-info2' }, 'Datos de Uso (Analytics): Utilizamos servicios como Firebase Analytics (un producto de Google) para recopilar información anónima sobre cómo los visitantes interactúan con nuestro sitio web.'),
                
                React.createElement('h3', { key: 'h-usage' }, 'Cómo Usamos su Información'),
                React.createElement('p', { key: 'p-usage' }, 'Utilizamos la información que recopilamos para: responder a sus consultas, mejorar y optimizar nuestro sitio web, y analizar tendencias de uso para crear contenido más relevante.'),

                React.createElement('button', {
                    key: 'test-close',
                    onClick: handleCloseClick,
                    style: {
                        background: 'blue',
                        color: 'white',
                        padding: '1rem',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginTop: '1rem'
                    }
                }, 'CERRAR MODAL (PRUEBA)')
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

    // Prevent hash changes
    useEffect(() => {
        const preventHashChange = (e) => {
            if (window.location.hash) {
                history.replaceState(null, null, window.location.pathname);
            }
        };
        
        window.addEventListener('hashchange', preventHashChange);
        return () => window.removeEventListener('hashchange', preventHashChange);
    }, []);

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
                console.log('📊 TODOS LOS DATOS:', contentList);
                
                // Log específico para recomendaciones
                const recommendations = contentList.filter(item => item.category === 'recomendaciones');
                console.log('🎯 RECOMENDACIONES ENCONTRADAS:', recommendations);
                
                // Log detallado de cada recomendación
                recommendations.forEach((rec, index) => {
                    console.log(`📝 Recomendación ${index + 1}:`, {
                        id: rec.id,
                        title: rec.title,
                        category: rec.category,
                        linkUrl: rec.linkUrl,
                        hasValidLink: rec.linkUrl && rec.linkUrl.trim() !== '' && rec.linkUrl !== '#'
                    });
                });
                
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

    const handlePrivacyClick = (e) => {
        console.log('🔥 PRIVACY POLICY BUTTON CLICKED!');
        e.preventDefault();
        e.stopPropagation();
        setIsPolicyVisible(true);
        console.log('Modal should be visible now:', true);
    };

    const handleCloseModal = () => {
        console.log('🔥 CLOSING MODAL!');
        setIsPolicyVisible(false);
    };

    const renderContent = () => {
        console.log(`🎨 Rendering content for tab: ${activeTab}`);
        
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
        console.log(`🔍 Filtered data for ${activeTab}:`, filteredData);

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
                console.log('🎯 Using RecommendationCard component');
                break;
            default:
                CardComponent = ImagePromptCard;
        }

        console.log(`🏗️ Creating ${filteredData.length} cards with ${CardComponent.name || 'Unknown'} component`);

        return React.createElement('div', { className: containerClassName },
            filteredData.map((item, index) => {
                console.log(`🃏 Creating card ${index + 1}:`, item);
                return React.createElement(CardComponent, { key: item.id, item });
            })
        );
    };

    console.log('🔄 App rendering, isPolicyVisible:', isPolicyVisible);

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
                        onClick: () => {
                            console.log('Tab clicked:', tab);
                            setActiveTab(tab);
                        },
                        type: 'button'
                    }, formatTabName(tab))
                )
            )
        ]),
        React.createElement('main', { key: 'main', role: 'tabpanel' }, renderContent()),
        React.createElement('footer', { key: 'footer' }, [
            React.createElement('p', { key: 'copyright' }, `© ${new Date().getFullYear()} TheRamzes. Todos los derechos reservados.`),
            React.createElement('button', {
                key: 'privacy',
                onClick: handlePrivacyClick,
                className: 'footer-link',
                type: 'button',
                style: {
                    background: 'orange',
                    color: 'black',
                    padding: '0.5rem 1rem',
                    border: '2px solid red',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }
            }, '🔥 POLÍTICA DE PRIVACIDAD (PRUEBA)')
        ]),
        React.createElement(PrivacyPolicyModal, { 
            key: 'modal',
            isVisible: isPolicyVisible, 
            onClose: handleCloseModal
        })
    ]);
};

// Debug: Add test button
setTimeout(() => {
    const testDiv = document.createElement('div');
    testDiv.style.position = 'fixed';
    testDiv.style.top = '10px';
    testDiv.style.right = '10px';
    testDiv.style.zIndex = '99999';
    testDiv.style.background = 'lime';
    testDiv.style.padding = '10px';
    testDiv.style.borderRadius = '5px';
    testDiv.innerHTML = '<button onclick="alert(\'TEST WORKS!\'); console.log(\'Direct test works!\')">🧪 TEST CLICK</button>';
    document.body.appendChild(testDiv);
    console.log('🧪 Test button added');
}, 2000);

// Render the app
console.log('🚀 Initializing React app...');
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
console.log('✅ React app initialized');
