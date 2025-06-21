import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "deletePatientButton": {
        "ariaLabel": "Delete patient {{name}}",
        "label": "Delete",
        "confirmTitle": "Delete {{name}}?",
        "confirmMessage": "Are you sure you want to delete patient {{name}}? This action cannot be undone.",
        "error": "Failed to delete patient"
      },
      "deleteEntryButton": {
        "ariaLabel": "Delete entry {{description}}",
        "label": "Delete Entry",
        "confirmTitle": "Confirm Entry Deletion",
        "confirmMessage": "Are you sure you want to delete entry: {{description}}? This action cannot be undone.",
        "error": "Failed to delete entry",
        "reasonLabel": "Reason for deletion",
        "reasonRequired": "Please provide a reason for deletion"
      },
      "common": {
        "cancel": "Cancel",
        "delete": "Delete"
      },
      "deletionReason": {
        "default": "Deleted by admin"
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;