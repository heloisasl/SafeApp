const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');

admin.initializeApp();

// As credenciais do Twilio NÃO ficam no código. Elas são lidas do arquivo
// web/functions/.env (que não vai para o GitHub). Veja .env.example.
const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_TOKEN = process.env.TWILIO_TOKEN;
const TWILIO_NUMBER = process.env.TWILIO_NUMBER;

const client = twilio(TWILIO_SID, TWILIO_TOKEN);

exports.enviarSMS = functions.database
  .ref('/alarmes/{sessaoId}')
  .onCreate(async (snapshot, context) => {
    const dados = snapshot.val();
    if (!dados) return null;

    const { latitude, longitude } = dados;
    const sessaoId = context.params.sessaoId;
    const linkMapa = `https://safeapp-c925b.web.app?id=${sessaoId}`;

    const mensagem = `🚨 ALERTA SAFEAPP\nUma pessoa da sua rede de proteção acionou o alarme de emergência.\n\nLocalização em tempo real:\n${linkMapa}\n\nAcesse o link para ver onde ela está agora.`;

    const numeros = dados.contatos || [];

    if (numeros.length === 0) {
      console.log('Nenhum contato para enviar SMS');
      return null;
    }

    const promises = numeros.map(numero => {
      const numeroFormatado = '+55' + numero.replace(/\D/g, '');
      return client.messages.create({
        body: mensagem,
        from: TWILIO_NUMBER,
        to: numeroFormatado,
      });
    });

    await Promise.all(promises);
    console.log(`SMS enviado para ${numeros.length} contatos`);
    return null;
  });