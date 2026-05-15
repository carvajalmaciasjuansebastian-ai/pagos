const { Telegraf } = require('telegraf');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Sistema Activo 🚀'));
app.listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.BOT_TOKEN.trim());

bot.command('cobrar', async (ctx) => {
    const partes = ctx.message.text.split(/\s+/).filter(p => p.length > 0);
    const monto = partes[1]; // Ejemplo: 10
    const modelo = partes[2]; // Ejemplo: Maria

    if (!monto || isNaN(monto) || !modelo) {
        return ctx.reply('❌ Usa: /cobrar 10 Maria');
    }

    try {
        await ctx.replyWithInvoice({
            title: `Pago para ${modelo}`,
            description: `Puedes pagar con tarjeta o usando tu Billetera de Telegram (Wallet)`,
            payload: `pago_${modelo}_${Date.now()}`,
            provider_token: process.env.PROVIDER_TOKEN.trim(),
            currency: 'USD',
            prices: [{ label: 'Total', amount: Math.round(parseFloat(monto) * 100) }], // Convierte a centavos
            start_parameter: 'pago-seguro'
        });
        console.log(`✅ Factura generada para ${modelo}`);
    } catch (e) {
        console.error("Error al generar factura:", e.description);
        ctx.reply("❌ Error: No se pudo conectar con la pasarela de pagos.");
    }
});

// Aviso de pago exitoso
bot.on('successful_payment', async (ctx) => {
    const info = ctx.message.successful_payment;
    const modelo = info.invoice_payload.split('_')[1];
    const msg = `✅ **¡PAGO CONFIRMADO!**\n\n👤 Modelo: ${modelo}\n💰 Monto: ${info.total_amount / 100} USD\n💳 Método: Telegram Wallet / Ammer`;
    
    await bot.telegram.sendMessage(process.env.GRUPO_CONTROL_ID.trim(), msg, { parse_mode: 'Markdown' });
});

// Inicia el bot limpiando errores previos
bot.launch({ dropPendingUpdates: true }).then(() => {
    console.log("🚀 Bot de Pagos Wallet iniciado correctamente");
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
