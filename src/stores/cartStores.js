import { defineStore } from "pinia";
import { ref as vueRef, computed } from "vue";

export const useSucursales = defineStore("sucursales", () => {
    const sucursalesFoodMania = vueRef([])
    return {sucursalesFoodMania}
},{
    persist: {
        enabled: true,
        strategies: [
            {
                key: "sucursales",
                storage: localStorage,
            }
        ]
    }
})

export const useLocationStore = defineStore("location", () => {
    const distancia = vueRef()
    const sucursalCercana = vueRef()

    return { distancia, sucursalCercana }
}, {
    persist: {
        enabled: true,
        strategies: [
            {
                key: "location",
                storage: localStorage,
            },
        ],
    },
})

let uidCounter = 0
const genUid = () => `cart_${++uidCounter}_${Date.now()}`

export const useCartStore = defineStore(
    "cart",
    () => {
        const items = vueRef([]);

        const precioFinal = (item) => {
            return Number(item.precio) + Number(item.bebida?.precio || 0)
        }

        const addItem = (producto, extras = {}) => {
            const bebida = extras.bebida || producto.bebida || null
            const papasConSalsa = extras.papasConSalsa ?? producto.papasConSalsa ?? false
            const salsasAlitas = extras.salsasAlitas || producto.salsasAlitas || []
            const esCanje = extras.esCanje ?? producto.esCanje ?? false
            const esBebida = extras.esBebida ?? producto.esBebida ?? false
            const proteinaSel = extras.proteinaSel ?? producto.proteinaSel ?? null
            const gaseosaSel = extras.gaseosaSel ?? producto.gaseosaSel ?? null
            let variantKey = producto.id
            if (bebida) variantKey += `_beb_${bebida.id || bebida.nombre}`
            if (proteinaSel) variantKey += `_prot_${proteinaSel}`
            if (gaseosaSel) variantKey += `_gas_${gaseosaSel}`
            if (salsasAlitas.length) variantKey += `_sal_${salsasAlitas.join('_')}`
            const existing = items.value.find(
                item => item._variantKey === variantKey
            )
            if (existing) {
                existing.cantidad++
            } else {
                items.value.push({
                    ...producto,
                    cantidad: 1,
                    _uid: genUid(),
                    _variantKey: variantKey,
                    bebida,
                    papasConSalsa,
                    salsasAlitas,
                    esCanje,
                    esBebida,
                    proteinaSel,
                    gaseosaSel,
                })
            }
        };

        const removeItem = (uid) => {
            const existing = items.value.find((item) => item._uid === uid);
            if (existing?.cantidad > 1) {
                existing.cantidad--;
            } else {
                items.value = items.value.filter((item) => item._uid !== uid);
            }
        };

        const deleteItem = (uid) => {
            items.value = items.value.filter((item) => item._uid !== uid);
        };

        const total = computed(() => {
            return items.value.reduce(
                (acc, item) => acc + precioFinal(item) * item.cantidad,
                0,
            );
        });

        const cashTotal = computed(() => {
            return items.value.reduce((acc, item) => {
                if (item.esCanje) return acc
                return acc + precioFinal(item) * item.cantidad
            }, 0)
        })

        const totalItems = computed(() => {
            return items.value.reduce((acc, item) => acc + item.cantidad, 0);
        });

        return { items, addItem, removeItem, deleteItem, total, cashTotal, totalItems, precioFinal };
    },
    {
        persist: {
            enabled: true,
            strategies: [
                {
                    key: "cart",
                    storage: localStorage,
                },
            ],
        },
    },
);
