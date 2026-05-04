import { defineStore } from "pinia";
import { ref as vueRef, computed } from "vue";

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
},
)


export const useCartStore = defineStore(
    "cart",
    () => {
        const items = vueRef([]);

        // Agregar producto
        const addItem = (producto) => {
            const existing = items.value.find((item) => item.id === producto.id);
            if (existing) {
                existing.cantidad++;
            } else {
                items.value.push({ ...producto, cantidad: 1 });
            }
        };

        // Quitar una unidad
        const removeItem = (id) => {
            const existing = items.value.find((item) => item.id === id);
            if (existing.cantidad > 1) {
                existing.cantidad--;
            } else {
                items.value = items.value.filter((item) => item.id !== id);
            }
        };

        // Eliminar producto completo
        const deleteItem = (id) => {
            items.value = items.value.filter((item) => item.id !== id);
        };

        // Total
        const total = computed(() => {
            return items.value.reduce(
                (acc, item) => acc + item.precio * item.cantidad,
                0,
            );
        });

        // Cantidad total de items
        const totalItems = computed(() => {
            return items.value.reduce((acc, item) => acc + item.cantidad, 0);
        });

        return { items, addItem, removeItem, deleteItem, total, totalItems };
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
