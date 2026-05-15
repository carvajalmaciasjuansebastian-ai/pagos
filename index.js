const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
app.listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.BOT_TOKEN.trim());

// Tu billetera fija (Donde recibes la plata)
const MI_BILLETERA = "UQALq2ZN6CZo-V2L5RGA972GXIyTQrFPnxgajotHP2olu_t1"; 

bot.command('cobrar', async (ctx) => {
    // Solo permitimos el comando en grupos o si tú/la modelo lo activan
    const partes = ctx.message.text.split(/\s+/);
    const monto = partes[1];
    const modelo = partes[2] || "Servicio"; // Si la modelo no pone nombre, sale "Servicio"

    if (!monto || isNaN(monto)) {
        return ctx.reply('❌ Forma correcta: /cobrar 20 NombreModelo');
    }

    const mensaje = `💎 **ORDEN DE PAGO GENERADA** 💎\n\n` +
                    `👤 **Modelo:** ${modelo.toUpperCase()}\n` +
                    `💰 **Monto a enviar:** \`${monto}\` USDT\n` +
                    `🏦 **Red:** TON Network\n\n` +
                    `📌 **Dirección (Toca para copiar):**\n\`${MI_BILLETERA}\`\n\n` +
                    `🚀 **Instrucciones:**\n` +
                    `1. Copia la dirección.\n` +
                    `2. Paga desde tu Wallet.\n` +
                    `3. **Envía el capture aquí mismo.**`;

    await ctx.replyWithMarkdown(mensaje, Markup.inlineKeyboard([
        [Markup.button.url('📱 ABRIR MI WALLET', 'https://t.me/wallet')]
    ]));
});

// El bot escucha las fotos (comprobantes) en cualquier chat donde esté
bot.on('photo', async (ctx) => {
    const usuario = ctx.from.first_name || "Usuario";
    
    // Avisa al cliente/modelo que el bot vio la foto
    await ctx.reply("✅ **Comprobante recibido.** El administrador verificará el saldo en la Wallet ahora mismo.");

    // Te avisa a TI en tu grupo privado de control
    const avisoAdmin = `📸 **NUEVO PAGO POR VERIFICAR**\n` +
                       `👤 Enviado por: ${usuario}\n` +
                       `📍 Chat: ${ctx.chat.title || "Privado"}`;
                       
    await bot.telegram.sendMessage(process.env.GRUPO_CONTROL_ID, avisoAdmin);
    await ctx.forwardMessage(process.env.GRUPO_CONTROL_ID);
});

bot.launch({ dropPendingUpdates: true });
