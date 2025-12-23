import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    lng: 'en', // Default language
    fallbackLng: 'en', // Fallback language
    debug: true, // Enable debug mode to see what's happening

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'showcore_language',
    },

    // Default namespace
    defaultNS: 'common',
    ns: ['common', 'settings'],

    // Inline resources instead of loading from files
    resources: {
      en: {
        common: {
          loading: 'Loading...',
          save: 'Save',
          cancel: 'Cancel',
          edit: 'Edit',
          delete: 'Delete',
          confirm: 'Confirm',
          back: 'Back',
          next: 'Next',
          previous: 'Previous',
          close: 'Close',
          search: 'Search',
          filter: 'Filter',
          sort: 'Sort',
          refresh: 'Refresh',
        },
        settings: {
          title: 'Settings',
          subtitle: 'Manage your account preferences',
          appearance: {
            title: 'Appearance Settings',
            subtitle: 'Customize how the app looks and feels to match your preferences.',
            theme: {
              title: 'Theme',
              subtitle: 'Choose your preferred color scheme.',
              light: 'Light',
              dark: 'Dark',
              system: 'System',
            },
            fontSize: {
              title: 'Font Size',
              subtitle: 'Adjust text size for better readability.',
              small: 'Small - Compact and space-efficient',
              medium: 'Medium - Default size (recommended)',
              large: 'Large - Easier to read',
            },
            language: {
              title: 'Language',
              subtitle: 'Select your preferred language.',
            },
          },
          saveChanges: 'Save Changes',
          saving: 'Saving...',
        },
      },
      es: {
        common: {
          loading: 'Cargando...',
          save: 'Guardar',
          cancel: 'Cancelar',
          edit: 'Editar',
          delete: 'Eliminar',
          confirm: 'Confirmar',
          back: 'Atrás',
          next: 'Siguiente',
          previous: 'Anterior',
          close: 'Cerrar',
          search: 'Buscar',
          filter: 'Filtrar',
          sort: 'Ordenar',
          refresh: 'Actualizar',
        },
        settings: {
          title: 'Configuración',
          subtitle: 'Gestiona las preferencias de tu cuenta',
          appearance: {
            title: 'Configuración de Apariencia',
            subtitle: 'Personaliza cómo se ve y se siente la aplicación según tus preferencias.',
            theme: {
              title: 'Tema',
              subtitle: 'Elige tu esquema de colores preferido.',
              light: 'Claro',
              dark: 'Oscuro',
              system: 'Sistema',
            },
            fontSize: {
              title: 'Tamaño de Fuente',
              subtitle: 'Ajusta el tamaño del texto para mejor legibilidad.',
              small: 'Pequeño - Compacto y eficiente en espacio',
              medium: 'Mediano - Tamaño predeterminado (recomendado)',
              large: 'Grande - Más fácil de leer',
            },
            language: {
              title: 'Idioma',
              subtitle: 'Selecciona tu idioma preferido.',
            },
          },
          saveChanges: 'Guardar Cambios',
          saving: 'Guardando...',
        },
      },
      fr: {
        common: {
          loading: 'Chargement...',
          save: 'Enregistrer',
          cancel: 'Annuler',
          edit: 'Modifier',
          delete: 'Supprimer',
          confirm: 'Confirmer',
          back: 'Retour',
          next: 'Suivant',
          previous: 'Précédent',
          close: 'Fermer',
          search: 'Rechercher',
          filter: 'Filtrer',
          sort: 'Trier',
          refresh: 'Actualiser',
        },
        settings: {
          title: 'Paramètres',
          subtitle: 'Gérez vos préférences de compte',
          appearance: {
            title: 'Paramètres d\'Apparence',
            subtitle: 'Personnalisez l\'apparence de l\'application selon vos préférences.',
            theme: {
              title: 'Thème',
              subtitle: 'Choisissez votre schéma de couleurs préféré.',
              light: 'Clair',
              dark: 'Sombre',
              system: 'Système',
            },
            fontSize: {
              title: 'Taille de Police',
              subtitle: 'Ajustez la taille du texte pour une meilleure lisibilité.',
              small: 'Petit - Compact et efficace en espace',
              medium: 'Moyen - Taille par défaut (recommandé)',
              large: 'Grand - Plus facile à lire',
            },
            language: {
              title: 'Langue',
              subtitle: 'Sélectionnez votre langue préférée.',
            },
          },
          saveChanges: 'Enregistrer les Modifications',
          saving: 'Enregistrement...',
        },
      },
    },
  })
  .then(() => {
    console.log('i18n: Initialization complete')
  })
  .catch((error) => {
    console.error('i18n: Initialization failed:', error)
  })

export default i18n