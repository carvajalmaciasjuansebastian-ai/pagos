const { Telegraf } = require('telegraf');

// Usamos variables de entorno para Render
const bot = new Telegraf(process.env.BOT_TOKEN);
const PROVIDER_TOKEN = process.env.PROVIDER_TOKEN;
const GRUPO_CONTROL_ID = process.env.GRUPO_CONTROL_ID;

bot.command('cobrar', (ctx) => {
    // Solo responde en el grupo de control
    if (ctx.chat.id.toString() !== GRUPO_CONTROL_ID) return;

    const args = ctx.message.text.split(' ');
    const monto = args[1];
    const modelo = args[2];

    if (!monto || !modelo) {
        return ctx.reply('❌ Usa: /cobrar [monto] [NombreModelo]');
    }

    return ctx.replyWithInvoice({
        title: `Sesión Privada - ${modelo}`,
        description: `Pago por videollamada de 10 min ($2 USD/min). Pago seguro vía Telegram Wallet.`,
        payload: `pago_${modelo}_${Date.now()}`,
        provider_token: PROVIDER_TOKEN,
        currency: 'USD',
        prices: [{ label: 'Servicio Premium', amount: parseInt(monto) * 100 }],
        start_parameter: 'pago-seguro'
    });
});

bot.on('successful_payment', (ctx) => {
    const payment = ctx.message.successful_payment;
    const modeloName = payment.invoice_payload.split('_')[1];

    bot.telegram.sendMessage(GRUPO_CONTROL_ID, 
        `✅ **¡PAGO CONFIRMADO!**\n` +
        `--------------------------\n` +
        `💰 Monto: ${payment.total_amount / 100} USD\n` +
        `💃 Modelo: ${modeloName}\n` +
        `👤 Cliente: ${ctx.from.first_name}\n\n` +
        `🚀 Inicien la sesión de inmediato.`
    );
});

// Para que Render no mate el proceso, escuchamos un puerto
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Bot Activo'));
app.listen(process.env.PORT || 3000);

bot.launch();