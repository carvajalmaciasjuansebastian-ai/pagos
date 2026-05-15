const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
app.get('/', (req, res) => res.send('Bot de Pagos Directos Wallet Activo 🚀'));
app.listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.BOT_TOKEN.trim());

// Tu dirección de Wallet (Red TON)
const MI_BILLETERA = "UQALq2ZN6CZo-V2L5RGA972GXIyTQrFPnxgajotHP2olu_t1"; 

bot.command('cobrar', async (ctx) => {
    const partes = ctx.message.text.split(/\s+/).filter(p => p.length > 0);
    const monto = partes[1];
    const modelo = partes[2];

    if (!monto || isNaN(monto) || !modelo) {
        return ctx.reply('❌ Usa: /cobrar 10 Maria');
    }

    const mensaje = `💎 **PAGO PARA: ${modelo.toUpperCase()}** 💎\n\n` +
                    `💰 **Monto a enviar:** \`${monto}\` USDT\n` +
                    `🏦 **Red:** TON Network\n\n` +
                    `📌 **Dirección de destino (Toca para copiar):**\n\`${MI_BILLETERA}\`\n\n` +
                    `1️⃣ Copia la dirección de arriba.\n` +
                    `2️⃣ Abre tu Wallet y selecciona "Enviar".\n` +
                    `3️⃣ Pega la dirección, el monto y **envía el comprobante** aquí.`;

    await ctx.replyWithMarkdown(mensaje, Markup.inlineKeyboard([
        [Markup.button.url('📱 ABRIR MI WALLET', 'https://t.me/wallet')]
    ]));
});

// Detectar cuando el cliente envía el comprobante (Foto)
bot.on('photo', async (ctx) => {
    const caption = ctx.message.caption || "Sin descripción";
    
    await ctx.reply("⏳ **Recibido.** Estamos verificando tu pago. En breve recibirás confirmación.");
    
    // Reenviar al grupo de control para que tú lo veas
    await bot.telegram.sendMessage(process.env.GRUPO_CONTROL_ID, "📸 **NUEVO COMPROBANTE RECIBIDO**");
    await ctx.forwardMessage(process.env.GRUPO_CONTROL_ID);
});

bot.launch({ dropPendingUpdates: true }).then(() => {
    console.log("🚀 Bot funcionando con Pago Directo a Wallet");
});
