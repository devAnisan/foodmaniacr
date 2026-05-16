<template>
    <div class="flex justify-center pt-2 text-center">
        <section class="">
            <h1>Panel de control</h1>
            <section>
                <h2>Elige el estado de pedidos que deseas visualizar: </h2>
                <select name="estado" id="estado" v-model="estadosEn" @change="handleChange">
                    <option value="_">Elige una opción</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="en transcurso">En transcurso</option>
                    <option value="finalizado">Finalizado</option>
                </select>
            </section>
            <section v-if="estadosEn === 'pendiente'">
                <table class="table">
                    <tr class="*:p-2">
                        <th>Nombre del cliente</th>
                        <th>Dirección</th>
                        <th>Teléfono</th>
                        <th>Email</th>
                        <th>Fecha de pedido</th>
                        <th>Subtotal</th>
                        <th>Estado del pedido</th>
                        <th>Información</th>
                    </tr>
                </table>
            </section>    
        </section>
    </div>
</template>
<script setup>
import { collection, getFirestore, getDocs } from 'firebase/firestore';
import { onMounted, ref as vueRef } from 'vue';
const pedidos = vueRef([])
const estadosEn = vueRef("pendiente")
const handleChange = (event) => {
    console.log("Cambió a: ", estadosEn);
    console.log("Los datos son los siguientes: ", pedidos);
    
    
}
onMounted(async () => {
    const db = getFirestore();
    const docSnap = await getDocs(collection(db, "pedidos"));

    docSnap.forEach((val) => {
        pedidos.value.push(val.data())
    })
    console.log(pedidos.value);
}
)
</script>