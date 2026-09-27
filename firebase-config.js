// Preencha com os dados do seu projeto Firebase (Configurações do projeto > Seus apps > Web).
// Não coloque senhas aqui. A segurança é garantida por Firebase Authentication + regras Firestore.
window.CTB_FIREBASE_CONFIG = {
  apiKey: "COLE_API_KEY",
  authDomain: "COLE_AUTH_DOMAIN",
  projectId: "COLE_PROJECT_ID",
  appId: "COLE_APP_ID"
};
window.ctbFirebaseReady = function () {
  const c = window.CTB_FIREBASE_CONFIG;
  if (!c || !c.apiKey || c.apiKey.startsWith('COLE_')) return false;
  if (!firebase.apps.length) firebase.initializeApp(c);
  return true;
};
