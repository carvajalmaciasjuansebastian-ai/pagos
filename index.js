const { Telegraf } = require('telegraf');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Bot de Pagos Activo 🚀'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));

const bot = new Telegraf(process.env.BOT_TOKEN);
const PROVIDER_TOKEN = process.env.PROVIDER_TOKEN;
const GRUPO_CONTROL_ID = process.env.GRUPO_CONTROL_ID;

bot.command('cobrar', (ctx) => {
    // 1. Limpiamos el texto para quitar el @nombre_del_bot si aparece
    const rawText = ctx.message.text.replace(/^\/cobrar(@\w+)?\s*/, '');
    
    // 2. Dividimos por espacios y filtramos elementos vacíos
    const args = rawText.split(/\s+/).filter(arg => arg.length > 0);
    
    const monto = args[0];
    const modelo = args[1];

    console.log(`Intento de cobro - Monto: ${monto}, Modelo: ${modelo}`);

    if (!monto || isNaN(monto) || !modelo) {
        return ctx.reply('❌ **Formato incorrecto**\n\nEscribe exactamente así:\n`/cobrar 10 Maria`', { parse_mode: 'Markdown' });
    }

    try {
        return ctx.replyWithInvoice({
            title: `Pago para: ${modelo}`,
            description: `Acceso a sesión con ${modelo}`,
            payload: `pago_${modelo}_${Date.now()}`,
            provider_token: PROVIDER_TOKEN,
            currency: 'USD',
            prices: [{ label: 'Servicio Premium', amount: parseInt(monto) * 100 }],
            start_parameter: 'pago'
        });
    } catch (e) {
        ctx.reply("❌ Error al conectar con la pasarela de pagos.");
    }
});

bot.on('successful_payment', (ctx) => {
    const info = ctx.message.successful_payment;
    const modelo = info.invoice_payload.split('_')[1];
    const msg = `✅ **¡PAGO RECIBIDO!**\n\n💰 Monto: ${info.total_amount / 100} USD\n👤 Modelo: ${modelo}`;
    
    bot.telegram.sendMessage(GRUPO_CONTROL_ID, msg, { parse_mode: 'Markdown' });
    ctx.reply(`¡Gracias! Tu pago para ${modelo} ha sido confirmado.`);
});

bot.launch().then(() => console.log("🚀 Bot listo para cobrar"));
