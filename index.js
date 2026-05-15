const { Telegraf, Markup } = require('telegraf');
const express = require('express');

// Configuración de servidor para Render
const app = express();
app.get('/', (req, res) => res.send('Bot de Pagos Multi-Chat Activo 🚀'));
app.listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.BOT_TOKEN.trim());

// Tu dirección fija de Wallet (Red TON)
const MI_BILLETERA = "UQALq2ZN6CZo-V2L5RGA972GXIyTQrFPnxgajotHP2olu_t1";

// 1. COMANDO PARA MODELOS (Dentro de grupos o chats donde esté el bot)
bot.command('cobrar', async (ctx) => {
    const partes = ctx.message.text.split(/\s+/);
    const monto = partes[1];
    const modelo = partes[2] || "Servicio";

    if (!monto || isNaN(monto)) {
        return ctx.reply('❌ Uso: /cobrar 20 NombreModelo');
    }

    const mensaje = `💎 **ORDEN DE PAGO: ${modelo.toUpperCase()}** 💎\n\n` +
                    `💰 **Monto:** \`${monto}\` USDT\n` +
                    `🏦 **Red:** TON Network\n\n` +
                    `📌 **Billetera (Toca para copiar):**\n\`${MI_BILLETERA}\`\n\n` +
                    `🚀 **Pasos:**\n` +
                    `1. Copia la dirección.\n` +
                    `2. Paga desde tu Wallet.\n` +
                    `3. Toca el botón azul de abajo para enviar el comprobante.`;

    await ctx.replyWithMarkdown(mensaje, Markup.inlineKeyboard([
        [Markup.button.url('📱 ABRIR MI WALLET', 'https://t.me/wallet')],
        [Markup.button.url('📸 ENVIAR COMPROBANTE AQUÍ', `https://t.me/${ctx.botInfo.username}`)]
    ]));
});

// 2. MODO INLINE (Para que la modelo cobre en CUALQUIER chat privado)
bot.on('inline_query', async (ctx) => {
    const query = ctx.inlineQuery.query; // Ejemplo: "20 Maria"
    const partes = query.split(' ');
    const monto = partes[0];
    const modelo = partes[1] || "Modelo";

    if (!monto || isNaN(monto)) return;

    const resultado = [{
        type: 'article',
        id: 'pago_' + Date.now(),
        title: `Generar cobro de ${monto} USDT para ${modelo}`,
        description: `Presiona aquí para enviar la ficha de pago al cliente`,
        thumb_url: 'https://cdn-icons-png.flaticon.com/512/625/625599.png',
        input_message_content: {
            message_text: `💎 **ORDEN DE PAGO: ${modelo.toUpperCase()}** 💎\n\n` +
                          `💰 **Monto:** \`${monto}\` USDT (Red TON)\n` +
                          `📌 **Billetera:** \`${MI_BILLETERA}\`\n\n` +
                          `✅ **Al terminar, toca el botón de abajo para enviar el capture al administrador.**`,
            parse_mode: 'Markdown'
        },
        ...Markup.inlineKeyboard([
            [Markup.button.url('📱 ABRIR WALLET', 'https://t.me/wallet')],
            [Markup.button.url('📸 ENVIAR COMPROBANTE AQUÍ', `https://t.me/${ctx.botInfo.username}`)]
        ])
    }];

    return await ctx.answerInlineQuery(resultado);
});

// 3. RECEPCIÓN DE COMPROBANTES (El bot recibe la foto y la manda a tu grupo)
bot.on('photo', async (ctx) => {
    const usuario = ctx.from.first_name || "Usuario";
    const username = ctx.from.username ? `@${ctx.from.username}` : "Sin username";
    
    await ctx.reply("⏳ **Recibido.** El administrador está verificando el ingreso en la Wallet. Espera un momento...");

    // Notificación para Jorge en el Grupo de Control
    const reporte = `📸 **NUEVO COMPROBANTE DE PAGO**\n` +
                    `👤 Cliente: ${usuario} (${username})\n` +
                    `🆔 ID Cliente: \`${ctx.from.id}\``;

    try {
        await bot.telegram.sendMessage(process.env.GRUPO_CONTROL_ID, reporte);
        await ctx.forwardMessage(process.env.GRUPO_CONTROL_ID);
    } catch (err) {
        console.error("Error al reenviar al grupo de control:", err);
    }
});

// Mensaje de inicio para clientes que toquen el botón de comprobante
bot.start((ctx) => {
    ctx.reply("👋 ¡Hola! Si acabas de realizar un pago, **envía la captura de pantalla aquí mismo** para procesar tu orden.");
});

bot.launch({ dropPendingUpdates: true }).then(() => {
    console.log("🚀 Sistema de cobro para modelos iniciado con éxito");
});

// Manejo de errores para que el bot no se caiga
bot.catch((err, ctx) => {
    console.error(`Error para ${ctx.updateType}`, err);
});
