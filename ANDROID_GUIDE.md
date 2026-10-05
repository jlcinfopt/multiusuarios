# Guia Oficial: Versão Android do BarberFlow 📱

O seu aplicativo BarberFlow já está 100% preparado para rodar no **Android com o mesmo layout, mesma base de dados e sem alterar em nada o app Web**.

Existem duas formas simples de disponibilizar o app para Android:

---

### Opção 1: Instalação Direta no Android via PWA / WebAPK (Recomendada e Imediata)
O Android (via Google Chrome ou Samsung Internet) transforma automaticamente este aplicativo num **WebAPK nativo**:

1. Abra o link do BarberFlow no navegador do celular Android (Google Chrome).
2. O navegador mostrará o botão de instalação, ou toque no botão dourado **"Instalar App"** / **"Adicionar à Tela Inicial"** no próprio aplicativo.
3. Toque em **Instalar**.
4. **Resultado**:
   - O ícone do app aparecerá na tela inicial e na gaveta de aplicativos do Android.
   - Abre em **ecrã completo (standalone)** sem barra de navegação de navegador.
   - Status bar e tema escuro com dourado integrados nativamente.
   - Atualizações em tempo real sem precisar de reinstalação.

---

### Opção 2: Gerar APK Nativo para Google Play com Capacitor
Se pretender gerar um ficheiro `.apk` instalável ou publicar na Google Play Store:

1. O ficheiro `capacitor.config.json` já foi gerado na raiz do projeto.
2. No terminal do seu computador com Node.js e Android Studio instalado:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap add android
   npm run build
   npx cap copy android
   npx cap open android
   ```
3. O Android Studio abrirá o projeto nativo compilável em APK (`Build > Build Bundle(s) / APK(s) > Build APK(s)`).
4. O app web permanece 100% intacto e idêntico em todas as plataformas.
