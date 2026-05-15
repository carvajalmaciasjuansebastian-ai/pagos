const { Telegraf } = require('telegraf');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Servidor de Pagos Activo 🚀'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Puerto ${PORT} abierto`));

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.command('cobrar', (ctx) => {
    // Esto limpia el comando y separa los datos correctamente
    const texto = ctx.message.text.split(/\s+/);
    const monto = texto[1]; // El primer dato después de /cobrar
    const modelo = texto[2]; // El segundo dato

    console.log(`Pedido recibido: Monto ${monto} para ${modelo}`);

    if (!monto || isNaN(monto) || !modelo) {
        return ctx.reply('❌ **Escribe así:**\n`/cobrar 10 Maria`', { parse_mode: 'Markdown' });
    }

    try {
        return ctx.replyWithInvoice({
            title: `Pago para: ${modelo}`,
            description: `Servicio de videollamada con ${modelo}`,
            payload: `pago_${modelo}_${Date.now()}`,
            provider_token: process.env.PROVIDER_TOKEN,
            currency: 'USD',
            prices: [{ label: 'Total a pagar', amount: Math.round(parseFloat(monto) * 100) }],
            start_parameter: 'pago'
        });
    } catch (error) {
        ctx.reply("❌ Error en la pasarela de pagos.");
    }
});

bot.on('successful_payment', (ctx) => {
    const info = ctx.message.successful_payment;
    const modelo = info.invoice_payload.split('_')[1];
    const msg = `✅ **¡NUEVO PAGO!**\n\n💰 Monto: ${info.total_amount / 100} USD\n👤 Modelo: ${modelo}`;
    bot.telegram.sendMessage(process.env.GRUPO_CONTROL_ID, msg, { parse_mode: 'Markdown' });
});

bot.launch().then(() => console.log("🚀 Bot funcionando"));
