const { Telegraf } = require('telegraf');
const express = require('express');

// Configuración de Express para que Render mantenga el servicio activo
const app = express();
app.get('/', (req, res) => res.send('Bot de Pagos Online Activo 🚀'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor web en puerto ${PORT}`));

// Verificación de Variables de Entorno
const BOT_TOKEN = process.env.BOT_TOKEN;
const PROVIDER_TOKEN = process.env.PROVIDER_TOKEN;
const GRUPO_CONTROL_ID = process.env.GRUPO_CONTROL_ID;

if (!BOT_TOKEN || !PROVIDER_TOKEN || !GRUPO_CONTROL_ID) {
    console.error("❌ ERROR: Faltan variables de entorno en Render.");
    process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// COMANDO COBRAR
bot.command('cobrar', (ctx) => {
    // Dividimos el mensaje por espacios, quitando los vacíos
    const args = ctx.message.text.split(/\s+/);
    
    // args[0] = /cobrar
    // args[1] = monto
    // args[2] = nombre de la modelo
    const monto = args[1];
    const modelo = args[2];

    // Validación: si no pone el monto o el nombre, le enseñamos cómo
    if (!monto || isNaN(monto) || !modelo) {
        return ctx.reply('❌ Formato incorrecto.\n\nUsa: /cobrar [monto] [Nombre]\nEjemplo: /cobrar 10 Maria');
    }

    try {
        return ctx.replyWithInvoice({
            title: `Pago para: ${modelo}`,
            description: `Servicio contratado con ${modelo}`,
            payload: `pago_${modelo}_${Date.now()}`,
            provider_token: PROVIDER_TOKEN,
            currency: 'USD',
            prices: [
                { label: `Servicio ${modelo}`, amount: parseInt(monto) * 100 } // Telegram usa centavos (100 = 1 USD)
            ],
            start_parameter: 'pago-modelo'
        });
    } catch (error) {
        console.error("Error al generar factura:", error);
        ctx.reply("❌ Hubo un error al generar el botón de pago.");
    }
});

// NOTIFICACIÓN DE PAGO EXITOSO
bot.on('successful_payment', async (ctx) => {
    const paymentInfo = ctx.message.successful_payment;
    const modelo = paymentInfo.invoice_payload.split('_')[1];
    const montoFinal = paymentInfo.total_amount / 100;

    const mensajeExito = `✅ **¡PAGO CONFIRMADO!**\n\n` +
                         `💰 Monto: ${montoFinal} USD\n` +
                         `👤 Modelo: ${modelo}\n` +
                         `🆔 ID Transacción: ${paymentInfo.provider_payment_charge_id}`;

    // Avisa al grupo de control (el de los -5066...)
    await ctx.telegram.sendMessage(GRUPO_CONTROL_ID, mensajeExito, { parse_mode: 'Markdown' });
    
    // Avisa al cliente en el chat actual
    await ctx.reply(`¡Gracias! Tu pago para ${modelo} ha sido procesado con éxito.`);
});

// LANZAMIENTO
bot.launch().then(() => {
    console.log('🚀 Bot de Pagos Encuentros Deluxe en línea...');
}).catch((err) => {
    console.error('❌ Error al iniciar el bot:', err);
});

// Manejo de cierre limpio
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
