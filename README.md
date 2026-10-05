# 💈 BarberFlow AI & Gestão para Barbearias (SaaS)

Sistema completo de agendamento inteligente 24/7 com IA para barbearias em **Portugal (€ EUR / MB WAY)** e **Brasil (R$ BRL / PIX)**, gestão multi-barbeiro, política anti-no-show e painel administrativo em tempo real.

---

## 🚀 Como Subir no GitHub

1. Extraia o arquivo `barberflow-app.zip` no seu computador.
2. Abra o terminal na pasta extraída e execute:
```bash
git init
git add .
git commit -m "feat: BarberFlow AI inicial"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```

---

## ⚡ Como Publicar na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com sua conta GitHub.
2. Clique em **"Add New..."** > **"Project"**.
3. Importe o repositório que você acabou de enviar ao GitHub.
4. As configurações padrão do Vite serão detectadas automaticamente:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Clique em **"Deploy"**.
6. Pronto! Sua aplicação estará online com link HTTPS instantâneo.

---

## 💻 Rodando Localmente

1. Instale as dependências:
```bash
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

3. Acesse `http://localhost:3000` no navegador.

---

## 🛠️ Principais Recursos Implementados e Corrigidos

- **Motor de Agendamento Concorrente e Multi-Barbeiro**:
  - Resolução completa de colisões de horários sem falsos bloqueios entre profissionais.
  - Verificação dupla de disponibilidade instantânea em tempo real.
- **Suporte Internacional Completo (Portugal & Brasil)**:
  - Moeda Dinâmica: **€ (EUR)** e **R$ (BRL)**.
  - Pagamentos: **MB WAY** e **PIX** (com chave, QR Code e Copia e Cola dinâmico).
  - Fusos horários automáticos (`Europe/Lisbon` e `America/Sao_Paulo`).
- **Assistente IA de Agendamento 24/7**:
  - Apresentação organizada de serviços e profissionais sem duplicações de opções.
  - Reconhecimento inteligente de intenções (serviços, barbeiros, localização e horários).
- **Gestão de Equipe e Serviços**:
  - Adicionar, editar e remover barbeiros com sincronização imediata.
  - Controle de limites por plano de assinatura (Free, Intermédio, Pro).
- **Proteção Anti-No-Show (Sinal de 50%)**:
  - Bloqueio inteligente e cobrança de caução preventiva para clientes com histórico de faltas.
