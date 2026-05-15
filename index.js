const { Telegraf } = require('telegraf');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Servidor de Pagos Activo 🚀'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Puerto ${PORT} abierto`));

const bot = new Telegraf(process.env.BOT_TOKEN.trim());

bot.command('cobrar', (ctx) => {
    // Esto limpia el texto y separa el monto y el nombre correctamente
    const partes = ctx.message.text.split(/\s+/).filter(part => part.length > 0);
    const monto = partes[1]; 
    const modelo = partes[2];

    if (!monto || isNaN(monto) || !modelo) {
        return ctx.reply('❌ **Escribe exactamente así:**\n`/cobrar 10 Maria`', { parse_mode: 'Markdown' });
    }

    try {
        return ctx.replyWithInvoice({
            title: `Pago para: ${modelo}`,
            description: `Servicio de videollamada con ${modelo}`,
            payload: `pago_${modelo}_${Date.now()}`,
            provider_token: process.env.PROVIDER_TOKEN.trim(),
            currency: 'USD',
            prices: [{ label: 'Total', amount: Math.round(parseFloat(monto) * 100) }],
            start_parameter: 'pago'
        });
    } catch (error) {
        ctx.reply("❌ Error al generar el enlace de pago.");
    }
});

bot.on('successful_payment', (ctx) => {
    const info = ctx.message.successful_payment;
    const modelo = info.invoice_payload.split('_')[1];
    const msg = `✅ **¡PAGO CONFIRMADO!**\n\n💰 Monto: ${info.total_amount / 100} USD\n👤 Modelo: ${modelo}`;
    bot.telegram.sendMessage(process.env.GRUPO_CONTROL_ID, msg, { parse_mode: 'Markdown' });
});

bot.launch().then(() => console.log("🚀 Bot funcionando"));
