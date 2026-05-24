import { readFileSync } from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

// ── Configuración ─────────────────────────────────────────────────────────
// 1. Ve a Firebase Console → Project Settings → Service Accounts
// 2. "Generate new private key" → descarga el JSON
// 3. Coloca el archivo en la raiz del proyecto como serviceAccountKey.json
// 4. Ejecuta: node scripts/migrate-superuser.mjs

const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json'

async function main() {
  const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'))
  const app = initializeApp({ credential: cert(serviceAccount) })
  const db = getFirestore(app)
  const auth = getAuth(app)

  const snapshot = await db.collection('superUser').get()

  if (snapshot.empty) {
    console.log('No hay documentos en superUser.')
    return
  }

  console.log(`Migrando ${snapshot.size} documento(s)...`)

  for (const doc of snapshot.docs) {
    const data = doc.data()
    const email = data.Correo

    if (!email) {
      console.log(`  ⏭  Doc ${doc.id} sin Correo, ignorando`)
      continue
    }

    try {
      const user = await auth.getUserByEmail(email)
      const uid = user.uid

      // Crear nuevo doc con ID = uid
      await db.collection('superUser').doc(uid).set(data)
      // Eliminar doc antiguo
      await doc.ref.delete()

      console.log(`  ✅ ${email} → superUser/${uid}`)
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        console.log(`  ⏭  ${email} no existe en Authentication, ignorando`)
      } else {
        console.error(`  ❌ ${email}:`, err.message)
      }
    }
  }

  console.log('Migración completada.')
}

main().catch(console.error)
