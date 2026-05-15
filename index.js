const { Telegraf } = require('telegraf');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Servidor de Pagos Online Activo 🚀'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));

const bot = new Telegraf(process.env.BOT_TOKEN);
const PROVIDER_TOKEN = process.env.PROVIDER_TOKEN;
const GRUPO_CONTROL_ID = process.env.GRUPO_CONTROL_ID;

bot.command('cobrar', async (ctx) => {
    const text = ctx.message.text.split(/\s+/);
    const monto = text[1];
    const modelo = text[2];

    if (!monto || isNaN(monto) || !modelo) {
        return ctx.reply('❌ **Escribe así:**\n`/cobrar 10 Maria`', { parse_mode: 'Markdown' });
    }

    try {
        // USAMOS ctx.replyWithInvoice para que responda en el mismo chat
        await ctx.replyWithInvoice({
            title: `Pago para: ${modelo}`,
            description: `Servicio de videollamada con ${modelo}`,
            payload: `pago_${modelo}_${Date.now()}`,
            provider_token: PROVIDER_TOKEN,
            currency: 'USD',
            prices: [{ label: 'Total', amount: Math.round(parseFloat(monto) * 100) }],
            start_parameter: 'pago-unico'
        });
        console.log(`✅ Factura enviada para ${modelo} por ${monto} USD`);
    } catch (error) {
        console.error("❌ Error al enviar factura:", error.description);
        ctx.reply(`❌ Error de Telegram: ${error.description}`);
    }
});

bot.on('successful_payment', async (ctx) => {
    const info = ctx.message.successful_payment;
    const modelo = info.invoice_payload.split('_')[1];
    
    const mensajeVenta = `💰 **¡NUEVA VENTA!**\n\n👤 Modelo: ${modelo}\n💵 Monto: ${info.total_amount / 100} USD\n✅ Estado: Pagado`;
    
    // Esto envía la confirmación al grupo de control
    await bot.telegram.sendMessage(GRUPO_CONTROL_ID, mensajeVenta, { parse_mode: 'Markdown' });
    await ctx.reply(`¡Gracias! Tu pago para ${modelo} ha sido procesado.`);
});

bot.launch().then(() => console.log("🚀 BOT LISTO Y ESCUCHANDO"));
