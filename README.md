# SafeApp

Aplicativo de segurança pessoal para mulheres, disfarçado de calculadora.

> **Você nunca estará só.**

Trabalho de Conclusão de Curso (TCC) de Ciência da Computação, UNITRI, Uberlândia (MG), 2026.

**Equipe:** Heloisa, Isaac Silva, Igor Filipi Teixeira e Amanda Lima.

---

## Sobre o projeto

Em uma situação de risco, pegar o celular e abrir um aplicativo de emergência pode chamar a atenção de quem está por perto. O SafeApp resolve isso de um jeito simples: por fora ele é uma calculadora comum. Para abrir o app de verdade, a pessoa digita o **código secreto** e toca em **=**. Com um toque no botão principal, os contatos de confiança recebem um aviso com a localização dela.

## Funcionalidades

| Função | O que faz |
|---|---|
| **Calculadora camuflada** | Uma calculadora que funciona normalmente. O código secreto (padrão `1234`, pode ser trocado) seguido de `=` abre o app. |
| **Dois botões de ajuda** | **CONTATOS** avisa as pessoas cadastradas. **POLÍCIA** abre um menu para ligar para o 190, para o 180 (Central de Atendimento à Mulher) ou para a Delegacia da Mulher. |
| **Aviso com localização** | Com internet, abre o WhatsApp com a mensagem e o link do Google Maps. Sem internet, usa SMS. |
| **Rede de proteção** | Cadastro de contatos de confiança, com nível de prioridade. |
| **Histórico de alarmes** | Guarda os últimos 50 alarmes (data, canal usado, contatos e localização). Fica em **Configurações > Histórico de alarmes**. |
| **Assistente de ajuda** | Botão redondo com o escudo, no topo da tela principal. Responde dúvidas sobre o app, orienta em situações de medo ou risco, explica direitos (Lei Maria da Penha, Lei 11.340/2006) e mostra os telefones de emergência. Funciona **sem internet** e **sem inteligência artificial**: as respostas são baseadas em palavras-chave. |
| **Biometria** | Opcional. Depois do código secreto, pede a digital ou o Face ID. Ativa em **Configurações**. |
| **Palavra-código** | Palavra cadastrada para uso futuro no acionamento por voz. |
| **Rastreamento no navegador** | Página web que mostra a localização de quem acionou o alarme (Firebase Hosting). |
| **Envio de SMS pela nuvem** | Uma Cloud Function do Firebase envia SMS (via Twilio) para os contatos quando um alarme é criado. |

### Limites importantes

- Celulares **não permitem** que um app envie WhatsApp ou SMS, nem faça ligações, sem o usuário confirmar. O SafeApp deixa tudo pronto (mensagem escrita, número discado) e a pessoa confirma com um toque.
- A biometria por **Face ID não funciona dentro do Expo Go no iPhone** (cai para a senha do aparelho). Funciona em app compilado e, no Android, também no Expo Go.
- O assistente **não é uma IA**. Conectar uma IA é um trabalho futuro.
- Não existe um número único nacional para as Delegacias da Mulher. Por isso o app mostra o 190 e o 180 e abre a busca no Google Maps por delegacias próximas.

## Tecnologias

- [React Native](https://reactnative.dev/) com [Expo](https://expo.dev/) (SDK 58)
- [React Navigation](https://reactnavigation.org/) (pilha nativa)
- [Firebase](https://firebase.google.com/): Authentication, Realtime Database, Hosting e Cloud Functions
- [Twilio](https://www.twilio.com/): envio de SMS pela Cloud Function
- `expo-location`, `expo-local-authentication`, `@react-native-community/netinfo`, `@react-native-async-storage/async-storage`

## Estrutura do projeto

```
SafeApp/
├── App.js                      Navegação entre as telas
├── app.json                    Configuração do Expo
├── assets/                     Ícones, escudo, distintivo
├── src/
│   ├── firebase.js             Configuração do Firebase
│   ├── historico.js            Salva e lê o histórico de alarmes
│   ├── biometria.js            Digital / Face ID
│   ├── components/
│   │   └── BotaoAssistente.js  Botão flutuante do assistente
│   └── screens/
│       ├── LoginScreen.js
│       ├── CadastroScreen.js
│       ├── CalculadoraScreen.js
│       ├── BiometriaScreen.js
│       ├── PanicoScreen.js     Tela principal (CONTATOS e POLÍCIA)
│       ├── ContatosScreen.js
│       ├── ConfiguracoesScreen.js
│       ├── HistoricoScreen.js
│       ├── AlarmeDetalheScreen.js
│       └── RoboScreen.js       Assistente de ajuda
└── web/                        Firebase (Hosting e Functions)
    ├── public/index.html       Página de rastreamento
    └── functions/              Envio de SMS (Twilio)
```

## Como rodar o app

### O que você precisa

- [Node.js](https://nodejs.org/) (versão LTS)
- [Git](https://git-scm.com/)
- O aplicativo **Expo Go** no celular (Android ou iPhone), baixado na loja de aplicativos
- Celular e computador na **mesma rede Wi-Fi**

### Passo a passo

```bash
# 1. Baixar o projeto
git clone https://github.com/heloisasl/SafeApp.git
cd SafeApp

# 2. Instalar as dependências
npm install

# 3. Iniciar
npx expo start --clear
```

Aparece um QR Code no terminal. Abra o Expo Go no celular e leia o código (no iPhone, use a câmera do aparelho).

### Usando o app

1. Crie uma conta (ou entre com a sua).
2. Na calculadora, digite o código secreto (`1234` por padrão) e toque em `=`.
3. Em **Contatos**, cadastre quem deve ser avisado.
4. Na tela principal, toque em **CONTATOS** para disparar o alarme ou em **POLÍCIA** para ver as opções de ajuda oficial.
5. Em **Configurações**, troque o código secreto, ative a biometria e veja o **Histórico de alarmes**.

## Configurando o seu próprio Firebase

O arquivo `src/firebase.js` aponta para o projeto Firebase da equipe. Para usar o seu próprio:

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com/).
2. Ative **Authentication** (e-mail e senha) e **Realtime Database**.
3. Em *Configurações do projeto*, registre um app Web e copie o `firebaseConfig` para `src/firebase.js`.
4. Em **Realtime Database > Regras**, restrinja o acesso. Não deixe o banco aberto para leitura e escrita de qualquer pessoa.

## Envio de SMS (Cloud Function)

A pasta `web/functions` tem a função `enviarSMS`, que dispara quando um novo alarme é criado no Realtime Database e manda um SMS com o link de rastreamento para cada contato.

As credenciais do Twilio **não ficam no código**. Para configurar:

```bash
cd web/functions
cp .env.example .env      # no Windows: copy .env.example .env
```

Abra o `.env` e preencha `TWILIO_SID`, `TWILIO_TOKEN` e `TWILIO_NUMBER` com os dados da sua conta Twilio. Depois, publique:

```bash
npm install
firebase deploy --only functions
```

> O arquivo `.env` está no `.gitignore` e nunca deve ser enviado ao GitHub.

## Roteiro para demonstrar na banca

1. Abrir o app: aparece a **calculadora**. Fazer uma conta simples para mostrar que ela funciona.
2. Digitar o código secreto e `=`. O app abre na tela principal.
3. Mostrar os dois botões. Tocar em **POLÍCIA** e mostrar as opções (190, 180, Delegacia da Mulher).
4. Tocar em **CONTATOS** e mostrar o aviso saindo com o link do Google Maps.
5. Ir em **Configurações > Histórico de alarmes** e abrir o alarme que acabou de ser registrado.
6. Tocar no **botão redondo com o escudo** e conversar com o assistente.
7. Ativar a **biometria** em Configurações e mostrar o pedido de digital depois do código.
8. Se possível, desligar a internet do celular e mostrar que o aviso passa a ir por SMS.

## Protótipo

Um protótipo clicável, que roda direto no navegador e não precisa instalar nada, acompanha o trabalho. Todos os dados dele são de exemplo.

## Trabalhos futuros

- Conectar uma inteligência artificial ao assistente de ajuda.
- Acionamento por voz com a palavra-código.
- Gravação de áudio durante o alarme.
- Publicação nas lojas de aplicativos.

## Aviso

O SafeApp é um projeto acadêmico e **não substitui os serviços oficiais de emergência**. Em caso de perigo, ligue **190** (Polícia Militar) ou **180** (Central de Atendimento à Mulher).

## Licença

Projeto acadêmico, sem licença de uso definida até o momento.
