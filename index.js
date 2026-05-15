const { Telegraf } = require('telegraf');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Bot de Pagos Online Activo 🚀'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('cobrar', (ctx) => {
    // Esta línea limpia el comando para que no importe si hay espacios extras
    const fullText = ctx.message.text.trim();
    const args = fullText.split(/\s+/).filter(part => part.toLowerCase() !== '/cobrar');

    const monto = args[0];
    const modelo = args[1];

    console.log(`Intento de cobro: Monto=${monto}, Modelo=${modelo}`);

    if (!monto || isNaN(monto) || !modelo) {
        return ctx.reply('❌ **Formato incorrecto**\n\nEscribe así: `/cobrar 10 Maria`', { parse_mode: 'Markdown' });
    }

    try {
        return ctx.replyWithInvoice({
            title: `Sesión con ${modelo}`,
            description: `Pago por servicio de videollamada`,
            payload: `pago_${modelo}_${Date.now()}`,
            provider_token: process.env.PROVIDER_TOKEN,
            currency: 'USD',
            prices: [{ label: 'Servicio', amount: Math.round(parseFloat(monto) * 100) }],
            start_parameter: 'pago'
        });
    } catch (error) {
        console.error("Error factura:", error);
        ctx.reply("❌ Error al generar el botón de pago.");
    }
});

bot.on('successful_payment', (ctx) => {
    const info = ctx.message.successful_payment;
    const modelo = info.invoice_payload.split('_')[1];
    const msg = `✅ **¡PAGO CONFIRMADO!**\n\n💰 Monto: ${info.total_amount / 100} USD\n👤 Modelo: ${modelo}`;
    bot.telegram.sendMessage(process.env.GRUPO_CONTROL_ID, msg, { parse_mode: 'Markdown' });
});

bot.launch().then(() => console.log("🚀 Bot de Pagos en línea"));
