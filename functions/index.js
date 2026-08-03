const admin = require('firebase-admin')
const nodemailer = require('nodemailer')
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onDocumentUpdated } = require('firebase-functions/v2/firestore')
const { defineJsonSecret } = require('firebase-functions/params')
const { logger } = require('firebase-functions')
const { calculateOrderTotals, esDiaDoble, nombreDiaDoble } = require('./calculos')
const { fechaVentaCR, semanaIdCR, diasDeSemanaCR } = require('./fechas')

const PROMO_LIMITE = 100
// 3 de agosto de 2026, 00:00 hora Costa Rica (UTC-6, sin horario de verano) = 06:00 UTC.
// Se usa tanto para bloquear pedidos antes del lanzamiento oficial como para el arranque de la promo.
const LANZAMIENTO_OFICIAL = new Date('2026-08-03T06:00:00.000Z')
const PROMO_INICIO = LANZAMIENTO_OFICIAL

const emailConfig = defineJsonSecret('FUNCTIONS_CONFIG_EXPORT')

admin.initializeApp()

const db = admin.firestore()

async function obtenerDescuentoGlobal() {
  const snap = await db.collection('descuento_global').doc('descuento_glbl').get()
  const data = snap.exists ? snap.data() : {}
  return { activo: !!data.estado, porcentaje: Number(data.descuento) || 0 }
}

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  try {
    const cfg = emailConfig.value()
    const emailUser = cfg.email?.user
    const emailPass = cfg.email?.pass
    if (emailUser && emailPass) {
      transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: { user: emailUser, pass: emailPass }
      })
    } else {
      logger.warn('Email config missing — email.user or email.pass not set')
    }
  } catch (e) {
    logger.warn('Email config error:', e.message)
  }
  return transporter
}

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000
const RATE_LIMIT_MAX = 3

exports.sendVerificationCode = onCall({ secrets: [emailConfig] }, async (request) => {
  const email = request.data.email
  if (!email) throw new HttpsError('invalid-argument', 'Email requerido')

  const code = generateCode()
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 10 * 60 * 1000)

  await db.collection('codigos_verificacion').doc(email).set({
    code,
    expiresAt,
    usado: false,
    creadoEn: admin.firestore.Timestamp.now()
  })

  const mailTransporter = getTransporter()
  if (!mailTransporter) {
    throw new HttpsError('unavailable', 'Servicio de correo no disponible')
  }

  const cfg = emailConfig.value()
  await mailTransporter.sendMail({
    from: `"Foodmania CR" <pedidos@foodmania.cr>`,
    to: email,
    subject: '🔐 Tu código de verificación — Foodmania CR',
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
        <div style="background:#642d81;color:white;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
          <h1 style="margin:0;">🍔 Foodmania CR</h1>
          <p style="margin:8px 0 0;opacity:0.9;">Verificá tu correo</p>
        </div>
        <div style="padding:24px;text-align:center;">
          <p style="font-size:16px;margin:0 0 16px;">Usá este código para verificar tu cuenta:</p>
          <div style="background:#f3e8ff;border:2px solid #642d81;border-radius:12px;padding:16px;display:inline-block;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#642d81;">${code}</span>
          </div>
          <p style="color:#888;font-size:13px;margin-top:16px;">Válido por 10 minutos.</p>
        </div>
        <div style="padding:16px;text-align:center;color:#888;font-size:12px;border-top:1px solid #ddd;">
          Foodmania CR — Tu antojo, nuestra especialidad
        </div>
      </div>
    `
  })

  logger.log('Verification code sent to:', email)
  return { success: true }
})

exports.verifyCode = onCall(async (request) => {
  const { email, code } = request.data
  if (!email || !code) throw new HttpsError('invalid-argument', 'Email y código requeridos')

  const docRef = db.collection('codigos_verificacion').doc(email)
  const docSnap = await docRef.get()

  if (!docSnap.exists) {
    throw new HttpsError('not-found', 'No se encontró un código para este correo. Solicita uno nuevo.')
  }

  const data = docSnap.data()
  if (data.usado) {
    throw new HttpsError('already-exists', 'Este código ya fue usado. Solicita uno nuevo.')
  }

  if (data.expiresAt.toMillis() < Date.now()) {
    throw new HttpsError('deadline-exceeded', 'El código expiró. Solicita uno nuevo.')
  }

  if (data.code !== code) {
    throw new HttpsError('unauthenticated', 'Código incorrecto.')
  }

  await docRef.update({ usado: true })

  try {
    const userRecord = await admin.auth().getUserByEmail(email)
    if (!userRecord.emailVerified) {
      await admin.auth().updateUser(userRecord.uid, { emailVerified: true })
    }
  } catch (e) {
    logger.warn('Could not update emailVerified in Auth:', e.message)
  }

  logger.log('Code verified for:', email)
  return { success: true }
})

exports.calculateOrderTotals = onCall(async (request) => {
  const { items, distanciaKm, withDrawType, agrandarMap, agrandarPuntosMap, bebidaPuntosMap } = request.data

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new HttpsError('invalid-argument', 'Carrito vacío')
  }

  const descuentoGlobal = await obtenerDescuentoGlobal()

  const totals = calculateOrderTotals(
    items,
    parseFloat(distanciaKm) || 0,
    withDrawType || 'sucursal',
    agrandarMap || {},
    agrandarPuntosMap || {},
    bebidaPuntosMap || {},
    descuentoGlobal
  )

  logger.log('Order totals calculated:', totals)
  return totals
})

exports.createOrder = onCall({ secrets: [emailConfig] }, async (request) => {
  if (Date.now() < LANZAMIENTO_OFICIAL.getTime()) {
    throw new HttpsError('failed-precondition', 'Las compras se habilitan a partir del 3 de agosto de 2026.')
  }

  const data = request.data
  const pedidoData = data.pedido
  const auth = request.auth
  const email = auth?.token?.email || null
  const uid = auth?.uid || null

  logger.log('Order request from:', auth?.token?.email || 'Anonymous', 'UID:', uid)

  const cincoMinAtras = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)
  const recent = await db.collection('pedidos')
    .where('creadoEn', '>', cincoMinAtras)
    .get()

  let count = 0
  recent.forEach(doc => {
    const d = doc.data()
    if (d.usuario === email || d.usuario === 'Anónimo') count++
  })

  if (count >= RATE_LIMIT_MAX) {
    throw new HttpsError('resource-exhausted',
      'Demasiados pedidos en poco tiempo. Esperá unos minutos e intentá de nuevo.')
  }

  const descuentoGlobal = await obtenerDescuentoGlobal()

  const totals = calculateOrderTotals(
    pedidoData.items || [],
    parseFloat(pedidoData.distanciaKm) || parseFloat(pedidoData.distanciaKm || 0),
    pedidoData.tipoRetiro || 'sucursal',
    pedidoData.agrandarMap || {},
    pedidoData.agrandarPuntosMap || {},
    pedidoData.bebidaPuntosMap || {},
    descuentoGlobal
  )

  let puntosGanados = totals.coinsGanados
  let esPrimeraCompra = false
  let esCumpleanos = false

  const fechaPedido = new Date()
  const esDiaDobleActivo = esDiaDoble(fechaPedido)
  const nombreDiaDobleActivo = nombreDiaDoble(fechaPedido)
  if (esDiaDobleActivo) {
    puntosGanados *= 2
    logger.log(`🔥 ${nombreDiaDobleActivo} — ManiaCoins x2`)
  }

  if (uid) {
    const clientRef = db.collection('clientes').doc(uid)
    const clientSnap = await clientRef.get()
    if (clientSnap.exists && clientSnap.data().primeraCompra === true) {
      esPrimeraCompra = true
      puntosGanados *= 2
      // No apagamos primeraCompra acá todavía: un pedido creado puede cancelarse o
      // quedarse en "pendiente" para siempre (pruebas, etc). Se consume recién cuando
      // el admin/cajero lo marca "finalizado" — ver otorgarPuntos() en AdminControl.vue.
      logger.log('🎉 Primera compra — ManiaCoins x2 para', email)
    }
    const cumpleanos = clientSnap.exists ? clientSnap.data().cumpleanos : null
    if (cumpleanos) {
      const [, mes, dia] = cumpleanos.split('-')
      if (fechaPedido.getMonth() + 1 === parseInt(mes) && fechaPedido.getDate() === parseInt(dia)) {
        esCumpleanos = true
        puntosGanados += 100
        logger.log('🎂 Cumpleaños — 100 ManiaCoins extra para', email)
      }
    }
    await clientRef.set({
      ultimaCompra: admin.firestore.Timestamp.now()
    }, { merge: true })
  }

  // Promo de lanzamiento: primeros 100 pedidos desde el 3 de agosto reciben papas pequeñas gratis.
  // Transacción atómica: la lectura-antes-de-escritura + reintento automático de Firestore
  // evita que dos pedidos concurrentes ambos se lleven el mismo cupo.
  let promoAplicada = false
  let promoNumero = null
  if (fechaPedido.getTime() >= PROMO_INICIO.getTime()) {
    const contadorRef = db.collection('contadores').doc('promoLanzamiento')
    const resultado = await db.runTransaction(async (tx) => {
      const snap = await tx.get(contadorRef)
      const actual = snap.exists ? (snap.data().pedidosConPromo || 0) : 0
      if (actual >= PROMO_LIMITE) return { aplica: false, numero: null }
      const nuevoValor = actual + 1
      tx.set(contadorRef, { pedidosConPromo: nuevoValor }, { merge: true })
      return { aplica: true, numero: nuevoValor }
    })
    promoAplicada = resultado.aplica
    promoNumero = resultado.numero
    if (promoAplicada) logger.log(`🎁 Promo papas gratis — pedido #${promoNumero}/${PROMO_LIMITE}`)
  }

  // Calculado en el servidor (no se confía en lo que mande el cliente) a partir del origen real de cada ítem.
  const esPedidoMerchandising = (pedidoData.items || []).some(item => item._coleccionOrigen === 'merchandising')

  const order = {
    ...pedidoData,
    subtotal: totals.baseCashTotal,
    costoBebidas: totals.totalBebidasCash,
    costoAgrandar: totals.totalAgrandarCash,
    costoEnvio: totals.costoEnvio,
    total: totals.totalConEnvio,
    puntosGanados,
    cashTotalSinEnvio: totals.cashTotalSinEnvio,
    usuario: email || 'Anónimo',
    promoPapasGratis: promoAplicada,
    promoPapasGratisNumero: promoNumero,
    esMerchandising: esPedidoMerchandising,
    esPrimeraCompra,
    creadoEn: admin.firestore.Timestamp.now()
  }

  delete order.agrandarMap
  delete order.agrandarPuntosMap
  delete order.bebidaPuntosMap

  const docRef = await db.collection('pedidos').add(order)

  if (uid && pedidoData.puntosCanjeados > 0) {
    const clientRef = db.collection('clientes').doc(uid)
    const clientSnap = await clientRef.get()

    if (clientSnap.exists) {
      const puntosActuales = clientSnap.data().puntos || 0
      if (puntosActuales >= pedidoData.puntosCanjeados) {
        await clientRef.update({
          puntos: admin.firestore.FieldValue.increment(-pedidoData.puntosCanjeados)
        })
      }
    }
  }

  const mailTransporter = getTransporter()
  if (mailTransporter && email) {
    try {
      const cfg = emailConfig.value()
      const itemsHtml = (pedidoData.items || []).map(item => {
        let nombreHtml = `${item.nombre} x${item.cantidad}`
        if (item.bebida) {
          const precioBebida = Number(item.bebida.precio) * Number(item.cantidad)
          const canjeada = item.bebida.canjeadoConPuntos
          nombreHtml += `<div style="font-size:12px;color:#555;padding-left:12px;margin-top:2px;">🥤 ${item.bebida.nombre} x${item.cantidad}${canjeada ? ' (🪙 canjeado)' : ` — ₡${precioBebida}`}</div>`
        }
        if (item.bebidaEspecifica) {
          nombreHtml += `<div style="font-size:12px;color:#555;padding-left:12px;margin-top:2px;">🥤 Incluye ${item.bebidaEspecifica.nombre} (cortesía)</div>`
        }
        if (item.gaseosaSel) {
          nombreHtml += `<div style="font-size:12px;color:#555;padding-left:12px;margin-top:2px;">🥤 Sabor gaseosa: ${item.gaseosaSel}</div>`
        }
        if (item.proteinaSel) {
          nombreHtml += `<div style="font-size:12px;color:#555;padding-left:12px;margin-top:2px;">🍗 Proteína: ${item.proteinaSel}</div>`
        }
        if (item.papasConSalsa) {
          nombreHtml += `<div style="font-size:12px;color:#555;padding-left:12px;margin-top:2px;">🍟 Papas con salsa</div>`
        }
        if (item.salsaSel) {
          nombreHtml += `<div style="font-size:12px;color:#555;padding-left:12px;margin-top:2px;">🌶️ ${item.salsaSel}</div>`
        }
        if (item.salsasAlitas?.length) {
          nombreHtml += `<div style="font-size:12px;color:#555;padding-left:12px;margin-top:2px;">🌶️ ${item.salsasAlitas.join(', ')}</div>`
        }
        if (item.agrandarPapas) {
          nombreHtml += `<div style="font-size:12px;color:#555;padding-left:12px;margin-top:2px;">⬆️ Papas agrandadas</div>`
        }
        if (item.papasFritasGratisSel) {
          nombreHtml += `<div style="font-size:12px;color:#555;padding-left:12px;margin-top:2px;">🍟 Papas fritas (cortesía)</div>`
        }
        if (item.tallaSel) {
          nombreHtml += `<div style="font-size:12px;color:#555;padding-left:12px;margin-top:2px;">👕 Talla: ${item.tallaSel}</div>`
        }
        const precioItem = item.esCanje ? `🪙 ${item.puntosCanje * item.cantidad}` : `₡${Number(item.precio) * Number(item.cantidad)}`
        return `<tr><td style="padding:6px 0;border-bottom:1px solid #eee;">${nombreHtml}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;">${precioItem}</td></tr>`
      }).join('')

      const envioHtml = pedidoData.tipoRetiro === 'domicilio' && totals.costoEnvio > 0
        ? `<tr><td style="padding:6px 0;border-bottom:1px solid #eee;">🛵 Envío a domicilio</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;">₡${totals.costoEnvio}</td></tr>`
        : ''

      const subtotalBebidas = totals.totalBebidasCash || 0
      const subtotalAgrandar = totals.totalAgrandarCash || 0
      const tieneExtras = subtotalBebidas > 0 || subtotalAgrandar > 0

      logger.log('Sending email to:', email)

      await mailTransporter.sendMail({
        from: `"Foodmania CR" <pedidos@foodmania.cr>`,
        to: email,
        subject: '✅ Pedido confirmado — Foodmania CR',
        html: `
          <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
            <div style="background:#642d81;color:white;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="margin:0;">🍔 Foodmania CR</h1>
              <p style="margin:8px 0 0;opacity:0.9;">¡Tu pedido fue confirmado!</p>
            </div>
            <div style="padding:24px;background:#f9f9f9;">
              ${esPedidoMerchandising ? `
              <div style="margin:0 0 20px;padding:16px;background:#fef3c7;border:3px solid #f59e0b;border-radius:12px;text-align:center;">
                <p style="margin:0;font-size:20px;font-weight:bold;color:#92400e;">⏳ TRES A CINCO DÍAS EN ENTREGAR</p>
                <p style="margin:8px 0 0;font-size:16px;font-weight:bold;color:#92400e;">RETIRAR EN LA SUCURSAL MÁS CERCANA</p>
                <p style="margin:8px 0 0;font-size:16px;color:#92400e;">📍 ${pedidoData.sucursal || '—'}</p>
              </div>` : ''}
              <p style="margin:0 0 16px;"><strong>👤 Cliente:</strong> ${pedidoData.nombre || '—'}</p>
              <p style="margin:0 0 16px;"><strong>📞 Teléfono:</strong> ${pedidoData.telefono || '—'}</p>
              <table style="width:100%;border-collapse:collapse;">
                <thead><tr style="background:#642d81;color:white;"><th style="padding:8px;text-align:left;">Producto</th><th style="padding:8px;text-align:right;">Subtotal</th></tr></thead>
                <tbody>${itemsHtml}${envioHtml}</tbody>
              </table>
              <hr style="margin:16px 0;border:none;border-top:2px solid #642d81;" />
              <div style="text-align:right;">
                ${tieneExtras ? `<p style="margin:0 0 4px;font-size:14px;color:#555;">Subtotal productos: ₡${totals.baseCashTotal || 0}</p>` : ''}
                ${subtotalBebidas > 0 ? `<p style="margin:0 0 4px;font-size:14px;color:#555;">🥤 Bebidas: ₡${subtotalBebidas}</p>` : ''}
                ${subtotalAgrandar > 0 ? `<p style="margin:0 0 4px;font-size:14px;color:#555;">⬆️ Agrandar papas: ₡${subtotalAgrandar}</p>` : ''}
                ${totals.costoEnvio > 0 ? `<p style="margin:0 0 4px;font-size:14px;color:#555;">🛵 Envío: ₡${totals.costoEnvio}</p>` : ''}
                <p style="margin:0;font-size:20px;font-weight:bold;">Total: ₡${totals.totalConEnvio || 0}</p>
              </div>
              <hr style="margin:16px 0;border:none;border-top:1px solid #ddd;" />
              <p style="margin:0 0 4px;"><strong>💳 Pago:</strong> ${pedidoData.metodoPago || '—'}</p>
              <p style="margin:0 0 4px;"><strong>🏪 Retiro:</strong> ${pedidoData.tipoRetiro === 'sucursal' ? pedidoData.sucursal : 'Domicilio'}</p>
              ${esPrimeraCompra ? '<p style="margin:0 0 4px;color:#642d81;font-weight:bold;">🎉 ¡Primera compra! ManiaCoins x2</p>' : ''}
              ${esDiaDobleActivo ? `<p style="margin:0 0 4px;background:linear-gradient(135deg,#642d81,#eab308);color:white;padding:8px 12px;border-radius:8px;font-weight:bold;text-align:center;">🔥 ${nombreDiaDobleActivo} — ManiaCoins x2</p>` : ''}
              ${esCumpleanos ? '<p style="margin:0 0 4px;background:linear-gradient(135deg,#e91e63,#ff6f00);color:white;padding:8px 12px;border-radius:8px;font-weight:bold;text-align:center;">🎂 ¡Feliz cumpleaños! Recibiste 100 ManiaCoins de regalo</p>' : ''}
              ${promoAplicada ? `<p style="margin:0 0 4px;background:linear-gradient(135deg,#16a34a,#22c55e);color:white;padding:8px 12px;border-radius:8px;font-weight:bold;text-align:center;">🎁 ¡Ganaste papas pequeñas GRATIS! (pedido #${promoNumero}/${PROMO_LIMITE})</p>` : ''}
              <p style="margin:0 0 4px;"><strong>🪙 ManiaCoins ganados:</strong> ${puntosGanados || 0}</p>
              ${order.puntosCanjeados ? `<p style="margin:0;"><strong>🔥 ManiaCoins canjeados:</strong> ${order.puntosCanjeados}</p>` : ''}
            </div>
            <div style="padding:16px;text-align:center;color:#888;font-size:12px;border-top:1px solid #ddd;">
              Foodmania CR — Tu antojo, nuestra especialidad
            </div>
          </div>
        `
      })
      logger.log('Email sent successfully to:', email)
    } catch (mailError) {
      logger.error('Error enviando correo:', mailError.message, mailError.stack)
    }
  } else {
    logger.log('Email skipped — transporter:', !!mailTransporter, 'email:', !!email)
  }

  return { id: docRef.id }
})

// ============================================================
// Ventas — registro agregado por día/sucursal, con cierre de caja
// ============================================================

// Un pedido de mostrador se atribuye a su "sucursal"; uno a domicilio se
// atribuye a la sucursal responsable del reparto ("sucursalCercana") — mismo
// criterio dual que ya usa AdminControl.vue para filtrar pedidos por sucursal.
function sucursalDelPedido(pedido) {
  return pedido.tipoRetiro === 'domicilio' ? pedido.sucursalCercana : pedido.sucursal
}

exports.onPedidoFinalizado = onDocumentUpdated('pedidos/{pedidoId}', async (event) => {
  const antes = event.data.before.data()
  const despues = event.data.after.data()

  if (despues.estado !== 'finalizado' || antes.estado === 'finalizado') return

  const sucursal = sucursalDelPedido(despues)
  if (!sucursal) return

  const fechaCreacion = despues.creadoEn?.toDate ? despues.creadoEn.toDate() : new Date()
  const fecha = fechaVentaCR(fechaCreacion)

  await db.collection('ventas').doc(fecha).set({
    fecha,
    actualizadoEn: admin.firestore.Timestamp.now(),
    sucursales: {
      [sucursal]: {
        montoProductos: admin.firestore.FieldValue.increment(Number(despues.cashTotalSinEnvio) || 0),
        montoEnvio: admin.firestore.FieldValue.increment(Number(despues.costoEnvio) || 0),
        montoTotal: admin.firestore.FieldValue.increment(Number(despues.total) || 0),
        cantidadPedidos: admin.firestore.FieldValue.increment(1),
        cantidadPedidosDomicilio: admin.firestore.FieldValue.increment(despues.tipoRetiro === 'domicilio' ? 1 : 0),
      }
    }
  }, { merge: true })

  logger.log(`Venta registrada — ${fecha} / ${sucursal} / pedido ${event.params.pedidoId}`)
})

// La Cloud Function nunca confía en una sucursal que mande el cliente: siempre
// la deriva del propio documento superUser del usuario autenticado.
async function obtenerSucursalAdmin(uid) {
  const snap = await db.collection('superUser').doc(uid).get()
  if (!snap.exists || snap.data().rol !== 'administrador') {
    throw new HttpsError('permission-denied', 'No tenés permisos de administrador.')
  }
  const sucursal = snap.data().sucursal
  if (!sucursal) throw new HttpsError('failed-precondition', 'Tu usuario no tiene una sucursal asignada.')
  return sucursal
}

exports.cerrarVentaDia = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Iniciá sesión.')
  const sucursal = await obtenerSucursalAdmin(uid)
  const fecha = request.data?.fecha || fechaVentaCR()

  const ref = db.collection('ventas').doc(fecha)
  const snap = await ref.get()
  const datosSucursal = snap.data()?.sucursales?.[sucursal]
  if (!datosSucursal) {
    throw new HttpsError('not-found', 'No hay ventas registradas ese día para tu sucursal.')
  }
  if (datosSucursal.cerrado) {
    throw new HttpsError('already-exists', 'Ese día ya fue cerrado.')
  }

  const cierre = {
    montoProductos: datosSucursal.montoProductos || 0,
    montoEnvio: datosSucursal.montoEnvio || 0,
    montoTotal: datosSucursal.montoTotal || 0,
    cantidadPedidos: datosSucursal.cantidadPedidos || 0,
    cantidadPedidosDomicilio: datosSucursal.cantidadPedidosDomicilio || 0,
    cerradoEn: admin.firestore.Timestamp.now(),
    cerradoPor: request.auth.token.email || uid,
  }

  await ref.set({
    sucursales: { [sucursal]: { cerrado: true, cierre } }
  }, { merge: true })

  logger.log(`Caja cerrada — ${fecha} / ${sucursal} / por ${cierre.cerradoPor}`)
  return cierre
})

exports.cerrarVentaSemana = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Iniciá sesión.')
  const sucursal = await obtenerSucursalAdmin(uid)
  const fechaReferencia = request.data?.fecha ? new Date(request.data.fecha) : new Date()
  const semanaId = semanaIdCR(fechaReferencia)
  const dias = diasDeSemanaCR(fechaReferencia)

  const semanaRef = db.collection('ventas_semanales').doc(semanaId)
  const semanaSnap = await semanaRef.get()
  if (semanaSnap.data()?.sucursales?.[sucursal]?.cerrado) {
    throw new HttpsError('already-exists', 'Esa semana ya fue cerrada.')
  }

  const diasSnaps = await Promise.all(dias.map(f => db.collection('ventas').doc(f).get()))
  const totales = diasSnaps.reduce((acc, diaSnap) => {
    const datosSucursal = diaSnap.data()?.sucursales?.[sucursal]
    if (!datosSucursal) return acc
    acc.montoProductos += datosSucursal.montoProductos || 0
    acc.montoEnvio += datosSucursal.montoEnvio || 0
    acc.montoTotal += datosSucursal.montoTotal || 0
    acc.cantidadPedidos += datosSucursal.cantidadPedidos || 0
    acc.cantidadPedidosDomicilio += datosSucursal.cantidadPedidosDomicilio || 0
    return acc
  }, { montoProductos: 0, montoEnvio: 0, montoTotal: 0, cantidadPedidos: 0, cantidadPedidosDomicilio: 0 })
  const diasCerrados = diasSnaps.filter(diaSnap => diaSnap.data()?.sucursales?.[sucursal]?.cerrado).length

  const cierre = {
    ...totales,
    diasCerrados,
    diasTotales: dias.length,
    cerradoEn: admin.firestore.Timestamp.now(),
    cerradoPor: request.auth.token.email || uid,
  }

  await semanaRef.set({
    semana: semanaId,
    dias,
    sucursales: { [sucursal]: { cerrado: true, cierre } }
  }, { merge: true })

  logger.log(`Semana cerrada — ${semanaId} / ${sucursal} / por ${cierre.cerradoPor}`)
  return cierre
})

exports.sendNotification = onCall(async (request) => {
  const { title, body, target, data } = request.data
  if (!title || !body) throw new HttpsError('invalid-argument', 'Faltan titulo o cuerpo')

  let tokens = []

  if (target === 'all') {
    const snapshot = await db.collection('clientes')
      .where('fcmToken', '!=', null)
      .get()
    snapshot.forEach(doc => {
      const t = doc.data().fcmToken
      if (t) tokens.push(t)
    })
  } else if (target?.type === 'nivel') {
    const coinsMin = target.coinsMin || 0
    const snapshot = await db.collection('clientes')
      .where('fcmToken', '!=', null)
      .where('puntos', '>=', coinsMin)
      .get()
    snapshot.forEach(doc => {
      const t = doc.data().fcmToken
      if (t) tokens.push(t)
    })
  } else if (target?.type === 'usuario' && target.uid) {
    const docSnap = await db.collection('clientes').doc(target.uid).get()
    if (docSnap.exists && docSnap.data().fcmToken) {
      tokens = [docSnap.data().fcmToken]
    }
  }

  if (tokens.length === 0) {
    logger.log('No tokens found for target:', target)
    return { successCount: 0, failureCount: 0 }
  }

  const message = {
    notification: { title, body },
    data: data || {},
    tokens
  }

  const response = await admin.messaging().sendEachForMulticast(message)
  logger.log('Notificacion enviada:', response.successCount, 'exitos,', response.failureCount, 'fallos')

  if (response.failureCount > 0) {
    response.responses.forEach((resp, idx) => {
      if (resp.error) {
        logger.warn('Error en token', idx, ':', resp.error.message)
      }
    })
  }

  return { successCount: response.successCount, failureCount: response.failureCount }
})

// Vista de clientes para Super Admin: email, si el correo está verificado (vive en Firebase Auth,
// no en Firestore), fecha de creación, si ya consumió su bono de primera compra (ManiaCoins x2) y si
// le tocó la regalía de lanzamiento (papas gratis primeros 100 pedidos). Solo expone estos campos,
// nada de teléfono/dirección/puntos.
exports.listarClientes = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Iniciá sesión.')

  const superAdminSnap = await db.collection('superAdmin').doc(uid).get()
  if (!superAdminSnap.exists) {
    throw new HttpsError('permission-denied', 'No tenés permisos de super admin.')
  }

  // Regalía de lanzamiento: se otorga por pedido (con o sin sesión iniciada), no por cliente.
  // Se cruza por email contra `usuario` del pedido para saber a qué cliente logueado le tocó.
  const promoPedidosSnap = await db.collection('pedidos').where('promoPapasGratis', '==', true).get()
  const regaliaPorEmail = {}
  promoPedidosSnap.forEach(doc => {
    const d = doc.data()
    if (!d.usuario || d.usuario === 'Anónimo') return
    regaliaPorEmail[d.usuario] = {
      numero: d.promoPapasGratisNumero || null,
      creadoEn: d.creadoEn?.toMillis ? d.creadoEn.toMillis() : null,
      estado: d.estado || null,
    }
  })

  const contadorSnap = await db.collection('contadores').doc('promoLanzamiento').get()
  const promoLanzamiento = {
    total: contadorSnap.exists ? (contadorSnap.data().pedidosConPromo || 0) : 0,
    limite: PROMO_LIMITE,
  }

  const clientesSnap = await db.collection('clientes').get()
  if (clientesSnap.empty) return { clientes: [], promoLanzamiento }

  const clientesData = clientesSnap.docs.map(d => ({
    uid: d.id,
    email: d.data().email || null,
    creadoEn: d.data().creadoEn || null,
    primeraCompra: d.data().primeraCompra === true,
  }))

  // admin.auth().getUsers() acepta hasta 100 identificadores por llamada.
  const emailVerificadoPorUid = {}
  for (let i = 0; i < clientesData.length; i += 100) {
    const lote = clientesData.slice(i, i + 100)
    try {
      const resultado = await admin.auth().getUsers(lote.map(c => ({ uid: c.uid })))
      resultado.users.forEach(u => { emailVerificadoPorUid[u.uid] = u.emailVerified })
    } catch (e) {
      logger.warn('Error obteniendo usuarios de Auth:', e.message)
    }
  }

  const clientes = clientesData.map(c => ({
    uid: c.uid,
    email: c.email,
    emailVerificado: emailVerificadoPorUid[c.uid] ?? false,
    creadoEn: c.creadoEn?.toMillis ? c.creadoEn.toMillis() : null,
    primeraCompra: c.primeraCompra,
    regalia: c.email ? (regaliaPorEmail[c.email] || null) : null,
  }))

  return { clientes, promoLanzamiento }
})
