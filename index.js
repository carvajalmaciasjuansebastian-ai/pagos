const { Telegraf } = require('telegraf');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Sistema de Pagos Ammer Online 🚀'));
app.listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.BOT_TOKEN.trim());

bot.command('cobrar', async (ctx) => {
    // Filtra espacios vacíos para evitar el error de "Formato incorrecto"
    const partes = ctx.message.text.split(/\s+/).filter(p => p.length > 0);
    const monto = partes[1];
    const modelo = partes[2];

    if (!monto || isNaN(monto) || !modelo) {
        return ctx.reply('❌ **Escribe así:**\n`/cobrar 10 Maria`', { parse_mode: 'Markdown' });
    }

    try {
        await ctx.replyWithInvoice({
            title: `Pago para: ${modelo}`,
            description: `Servicio contratado con ${modelo}`,
            payload: `pago_${modelo}_${Date.now()}`,
            provider_token: process.env.PROVIDER_TOKEN.trim(),
            currency: 'USD',
            prices: [{ label: 'Total', amount: Math.round(parseFloat(monto) * 100) }],
            start_parameter: 'pago'
        });
        console.log(`✅ Factura generada para ${modelo}`);
    } catch (error) {
        console.error("Error Telegram:", error.description);
        ctx.reply(`❌ Error de pasarela: ${error.description}`);
    }
});

bot.on('successful_payment', async (ctx) => {
    const info = ctx.message.successful_payment;
    const modelo = info.invoice_payload.split('_')[1];
    const msg = `💰 **¡VENTA EXITOSA!**\n\n👤 Modelo: ${modelo}\n💵 Monto: ${info.total_amount / 100} USD`;
    
    // Envía confirmación al grupo de control
    await bot.telegram.sendMessage(process.env.GRUPO_CONTROL_ID, msg, { parse_mode: 'Markdown' });
});

bot.launch();
