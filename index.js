const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const app = express();
app.use(express.json());

// Verificación de salud del contenedor en Render
app.get('/', (req, res) => res.send('Bot Pagocliente_bot (V10 - Estable) Activo 🚀'));
app.listen(process.env.PORT || 3000);

const bot = new Telegraf(process.env.BOT_TOKEN.trim());

// =========================================================================
// CONFIGURACIÓN CENTRAL DE TU BILLETERA (Todos los pagos van aquí)
// =========================================================================
const MI_BILLETERA = "UQALq2ZN6CZo-V2L5RGA972GXIyTQrFPnxgajotHP2olu_t1";
const NOMBRE_BOT = "Pagocliente_bot";

// ID del grupo para control de operaciones e ingresos
const GRUPO_PAGOS = parseInt(process.env.GRUPO_CONTROL_ID);

// 🚨 REGISTRO OFICIAL DE MODELOS LATIN CONNECT
const REGISTRO_MODELOS = {
    "CATALINA": 8860149047,
    "CATALINALATINCONNECT": 8860149047,
    
    "NATY": 8842392864,
    "NATYQUEEN": 8842392864,
    "NATYQUEENLATINCONNECT": 8842392864,
    
    "VICTORIA": 8794256442,
    "VICTORIALATINCONNECT": 8794256442,
    
    "KIARA": 8643531437,
    "KIARALATINCONNECT": 8643531437,
    
    "GABRIELA": 8934690346,
    "GABY": 8934690346,
    "GABYLATINCONNECTION": 8934690346,
    
    "MEGAN": 8838802906,
    "MEGGAN": 8838802906,
    "MEGGANDOLLSLATINCONNECT": 8838802906,
    
    "SOFIA": 8737222053,
    "SOFIALATINCONNECT": 8737222053
};

// =========================================================================

// 1. MODO INLINE (Escribiendo @Pagocliente_bot [monto] [modelo] en chats privados)
bot.on('inline_query', async (ctx) => {
    const query = ctx.inlineQuery.query;
    const partes = query.split(' ');
    const monto = partes[0];
    const modelo = partes[1] || ctx.inlineQuery.from.first_name || "Modelo";

    if (!monto || isNaN(monto)) return;

    // --- NOTIFICACIÓN INTERNA AL GRUPO DE CONTROL ---
    const nombreModelo = modelo.toUpperCase();
    const avisoOrden = `🔔 **ÓRDEN GENERADA EN CHAT**\n👩‍🦰 Modelo: ${nombreModelo}\n💰 Monto: \`${monto}\` USDT\n📌 _Enviada al cliente en chat privado_`;
    
    try {
        await bot.telegram.sendMessage(GRUPO_PAGOS, avisoOrden);
    } catch (err) {
        console.error("Error enviando alerta al grupo en modo inline:", err);
    }
    // ------------------------------------------------

    const resultado = [{
        type: 'article',
        id: `pago_${monto}_${modelo}_${Date.now()}`,
        title: `💎 ORDEN DE PAGO / PAYMENT ORDER 💎`,
        description: `Enviar orden de ${monto} USDT para ${modelo}`,
        input_message_content: {
            message_text: `💎 **ORDEN DE PAGO: ${modelo.toUpperCase()}** 💎\n\n` +
                          `💰 **Monto a pagar / Amount:** \`${monto}\` USDT\n` +
                          `🏦 **Red / Network:** TON Network\n\n` +
                          `🇪🇸 **Instrucciones:**\n` +
                          `1. Toca el botón **PAGAR AHORA**.\n` +
                          `2. Confirma el envío desde tu Wallet.\n` +
                          `3. Envía el capture aquí mismo.\n\n` +
                          `🇺🇸 **Instructions:**\n` +
                          `1. Tap the **PAY NOW** button.\n` +
                          `2. Confirm the transaction in your Wallet.\n` +
                          `3. Send the screenshot right here.\n\n` +
                          `🔥 **¡Prepárate para la diversión! / Get ready for fun!** 🔥`,
            parse_mode: 'Markdown'
        },
        ...Markup.inlineKeyboard([
            [Markup.button.url(`🚀 PAGAR / PAY ${monto} USDT AHORA`, `https://t.me/wallet?startattach=external_pay_${MI_BILLETERA}_${monto}`)],
            [Markup.button.url(`🏦 PAGAR CON ZELLE`, `https://t.me/${NOMBRE_BOT}?start=zelle`)],
            [Markup.button.url('📸 ENVIAR COMPROBANTE / SEND RECEIPT', `https://t.me/${NOMBRE_BOT}`)]
        ])
    }];

    return await ctx.answerInlineQuery(resultado);
});

// 2. COMANDO TRADICIONAL (Uso en el chat directo del bot: /cobrar 30 Maria)
bot.command('cobrar', async (ctx) => {
    const partes = ctx.message.text.split(/\s+/);
    const monto = partes[1];
    const modelo = partes[2] || "Servicio";

    if (!monto || isNaN(monto)) {
        return ctx.reply('❌ Uso: /cobrar 20 Maria');
    }

    const avisoOrdenCmd = `🔔 **ÓRDEN GENERADA (COMANDO)**\n👩‍🦰 Modelo: ${modelo.toUpperCase()}\n💰 Monto: \`${monto}\` USDT`;
    try {
        await bot.telegram.sendMessage(GRUPO_PAGOS, avisoOrdenCmd);
    } catch (e) { 
        console.error("Error enviando alerta al grupo en comando:", e); 
    }

    const texto = `💎 **ORDEN DE PAGO: ${modelo.toUpperCase()}** 💎\n\n` +
                  `💰 **Monto a pagar / Amount:** \`${monto}\` USDT\n` +
                  `🏦 **Red / Network:** TON Network\n\n` +
                  `🇪🇸 **Instrucciones:**\n` +
                  `1. Toca el botón **PAGAR AHORA**.\n` +
                  `2. Confirma el envío desde tu Wallet.\n` +
                  `3. Envía el capture aquí mismo.\n\n` +
                  `🇺🇸 **Instructions:**\n` +
                  `1. Tap the **PAY NOW** button.\n` +
                  `2. Confirm the transaction in your Wallet.\n` +
                  `3. Send the screenshot right here.\n\n` +
                  `🔥 **¡Prepárate para la diversión! / Get ready for fun!** 🔥`;

    await ctx.replyWithMarkdown(texto, Markup.inlineKeyboard([
        [Markup.button.url(`🚀 PAGAR / PAY ${monto} USDT AHORA`, `https://t.me/wallet?startattach=external_pay_${MI_BILLETERA}_${monto}`)],
        [Markup.button.url(`🏦 PAGAR CON ZELLE`, `https://t.me/${NOMBRE_BOT}?start=zelle`)],
        [Markup.button.url('📸 ENVIAR COMPROBANTE / SEND RECEIPT', `https://t.me/${NOMBRE_BOT}`)]
    ]));
});

// 3. RECEPCIÓN DE COMPROBANTES (Reenvía las capturas de pantalla de los clientes)
bot.on('photo', async (ctx) => {
    const user = ctx.from.first_name || "Usuario";
    const username = ctx.from.username ? `@${ctx.from.username}` : "Sin @";
    const userId = ctx.from.id;

    await ctx.reply("⏳ **Comprobante recibido.** El administrador está verificando la transacción en la Wallet, espera un momento.");

    // Analizar el texto descriptivo de la foto
    const captionTexto = ctx.message.caption || "";
    const palabras = captionTexto.split(/[\s@_]+/); // Separa por espacios, arrobas o guiones bajos
    let modeloDetectada = "DESCONOCIDA";

    for (const palabra of palabras) {
        const limpia = palabra.toUpperCase().trim();
        if (REGISTRO_MODELOS[limpia]) {
            modeloDetectada = limpia;
            break;
        }
    }

    const report = `📸 **NUEVO COMPROBANTE RECIBIDO**\n` +
                   `👤 Cliente: ${user} (${username})\n` +
                   `🆔 ID Telegram: \`${userId}\`\n` +
                   `👩‍🦰 Modelo Tentativa: **${modeloDetectada}**\n` +
                   `⏳ Estado: Esperando revisión en Wallet`;
    
    try {
        await bot.telegram.sendMessage(GRUPO_PAGOS, report, Markup.inlineKeyboard([
            [Markup.button.callback('✅ Confirmar Pago', `confirmar_${userId}_${modeloDetectada}`)]
        ]));
        await ctx.forwardMessage(GRUPO_PAGOS);
    } catch (err) {
        console.error("Error reenviando el comprobante al grupo de control:", err);
    }
});

// 3.5 MANEJO DEL BOTÓN ACCIONADO EN EL GRUPO DE CONTROL
bot.action(/^confirmar_(\d+)_(.+)$/, async (ctx) => {
    const targetUserId = ctx.match[1];
    const nombreModelo = ctx.match[2];
    const adminName = ctx.from.first_name || "Administrador";

    const exitoTexto = `✅ **¡PAGO RECIBIDO CON ÉXITO!** 💎\n\n` +
                       `🇪🇸 Tu transacción ha sido validada correctamente por nuestro equipo.\n` +
                       `🔥 **¡Prepárate para la diversión!** Ponte en contacto en el chat privado para iniciar tu servicio de inmediato.\n\n` +
                       `🇺🇸 Your transaction has been successfully validated.\n` +
                       `🔥 **Get ready for fun!** Connect back to start your service right now.`;

    const avisoModeloTexto = `💰 **¡PAGO CONFIRMADO!** 💰\n\n` +
                             `👑 Hola, el administrador ha validado un pago para ti.\n` +
                             `🚀 **¡Procede a tu show de inmediato!** Dale la mejor atención a tu cliente. 🔥`;

    let infoModeloAdicional = "";

    try {
        // 1. Enviar notificación al cliente
        await bot.telegram.sendMessage(targetUserId, exitoTexto, { parse_mode: 'Markdown' });
        
        // 2. Enviar notificación directa a la modelo registrada
        if (nombreModelo !== "DESCONOCIDA" && REGISTRO_MODELOS[nombreModelo]) {
            const modeloChatId = REGISTRO_MODELOS[nombreModelo];
            try {
                await bot.telegram.sendMessage(modeloChatId, avisoModeloTexto, { parse_mode: 'Markdown' });
                infoModeloAdicional = `\n📱 **Notificación enviada a:** ${nombreModelo} (Privado)`;
            } catch (errModelo) {
                console.error(`No se pudo enviar privado a la modelo ${nombreModelo}:`, errModelo);
                infoModeloAdicional = `\n⚠️ **Alerta:** No se pudo enviar privado a ${nombreModelo} (¿Le dio /start al bot?)`;
            }
        } else {
            infoModeloAdicional = `\n⚠️ **Aviso:** No se detectó modelo asignada automáticamente para esta orden en el texto.`;
        }
        
        await ctx.answerCbQuery("¡Pago confirmado y alertas enviadas! 🔥");

        const originalText = ctx.callbackQuery.message.text;
        const updatedText = `${originalText}\n\n🟢 **APROBADO POR:** ${adminName} ✅${infoModeloAdicional}`;
        
        await ctx.editMessageText(updatedText, Markup.inlineKeyboard([])); 
    } catch (err) {
        console.error("Error al procesar la confirmación de pago:", err);
        await ctx.answerCbQuery("❌ Error general al procesar la confirmación.", { show_alert: true });
    }
});

// 4. ARRANQUE DEL BOT LIMPIANDO CONFLICTOS 409
bot.start((ctx) => {
    const payload = ctx.startPayload;
    if (payload === 'zelle') {
        return ctx.replyWithMarkdown(`🏦 **INFORMACIÓN DE CORREO ZELLE**\n\n` +
                                    `• Por favor realiza tu transferencia al siguiente correo:\n` +
                                    `👉 \`jcompany444@gmail.com\`\n\n` +
                                    `📸 Una vez realizado el pago, envía la captura de pantalla por este mismo chat.`);
    }
    ctx.reply("👋 ¡Bienvenido! Envía la captura de tu pago aquí para habilitar tu servicio de inmediato.");
});

// Asegura limpiar conexiones colgadas en Telegram antes de encender el bot de nuevo
bot.telegram.deleteWebhook()
    .then(() => {
        return bot.launch({ dropPendingUpdates: true });
    })
    .then(() => console.log('Bot Pagocliente_bot inicializado correctamente 🚀'))
    .catch((err) => console.error('Error crítico al lanzar el bot:', err));

// Manejo seguro del apagado
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
