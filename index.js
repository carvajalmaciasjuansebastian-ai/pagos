const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Bot de Pagos Directos Activo 🚀'));
app.listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.BOT_TOKEN.trim());

// REEMPLAZA ESTO CON TU PROPIA DIRECCIÓN DE WALLET (Red TON)
const MI_BILLETERA_USDT = "TU_DIRECCION_DE_WALLET_AQUI"; 

bot.command('cobrar', async (ctx) => {
    const partes = ctx.message.text.split(/\s+/).filter(p => p.length > 0);
    const monto = partes[1];
    const modelo = partes[2];

    if (!monto || isNaN(monto) || !modelo) {
        return ctx.reply('❌ Usa: /cobrar 10 Maria');
    }

    const mensaje = `✨ **PAGO PARA: ${modelo}** ✨\n\n` +
                    `💰 **Monto:** ${monto} USDT\n` +
                    `📱 **Método:** Billetera de Telegram (Wallet)\n\n` +
                    `1️⃣ Haz clic en el botón de abajo para pagar.\n` +
                    `2️⃣ Envía el capture del pago aquí mismo.`;

    // Este enlace abre la Wallet del cliente para enviarte a ti directamente
    const urlPago = `https://t.me/wallet?startattach=external_pay__${MI_BILLETERA_USDT}`;

    await ctx.replyWithMarkdown(mensaje, Markup.inlineKeyboard([
        [Markup.button.url('🚀 PAGAR CON WALLET', 'https://t.me/wallet')]
    ]));
});

// Escuchar cuando el cliente mande la foto del comprobante
bot.on('photo', async (ctx) => {
    await ctx.reply("✅ Gracias. Tu pago está siendo verificado por el equipo.");
    // Reenvía la foto a tu grupo de control
    await ctx.forwardMessage(process.env.GRUPO_CONTROL_ID);
});

bot.launch({ dropPendingUpdates: true });
