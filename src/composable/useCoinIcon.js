import { ref as storageRef, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase.js'
import { useAssets } from '../stores/cartStores.js'

export async function cargarCoinIcon() {
  const assets = useAssets()
  if (assets.coinIconUrl) return assets.coinIconUrl
  try {
    const url = await getDownloadURL(storageRef(storage, 'FoodMania/maniacoins.png'))
    assets.coinIconUrl = url
    return url
  } catch (error) {
    console.error('Error cargando ícono de ManiaCoins:', error)
    return ''
  }
}
