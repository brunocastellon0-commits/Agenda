import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ScrollView, TouchableOpacity } from 'react-native';
import { saveOrUpdateUsuario, getUsuarios, Usuario } from '../repositories/usuario';
import { Billetera, createBilletera,getBilleteras } from '../repositories/billetera';

export default function BilleteraTestScreen() {
    const [id, setId] = useState('');
    const [nombre, setNombre] = useState('');
    const [entidad, setEntidad] = useState('');
    const [monto, setMonto] = useState('');
    const [divisa, setDivisa] = useState('');
    const [ciUsuario, setCiUsuario] = useState('');


const [billeteras, setBilleteras] = useState<Billetera[]>([]);

const cargarBilleteras = async () => {
    const data = await getBilleteras();
    setBilleteras(data);
};

useEffect(() => {
    cargarBilleteras();
  }, []);

const rellenarFormulario = (billetera: Billetera) => {
    setId(billetera.id?.toString() ?? '');
    setNombre(billetera.nombre);
    setEntidad(billetera.entidad);
    setMonto(billetera.monto.toString());
    setDivisa(billetera.divisa);
    setCiUsuario(billetera.ci_usuario?.toString() ?? '');
};  

const handleGuardar = async () => {
    try {
        await createBilletera({
            nombre,
            entidad,
            monto: parseFloat(monto),
            divisa,
            ci_usuario: ciUsuario
        });
        // Limpiar el formulario
        setId('');
        setNombre('');
        setEntidad('');
        setMonto('');
        setDivisa('');
        setCiUsuario('');
        // Recargar la lista de billeteras
        await cargarBilleteras();
    } catch (error) {
        console.error('Error al guardar la billetera:', error);
    }
};
return (
    <ScrollView style={{ padding: 20 }}>
      <Text>--- FORMULARIO DE PRUEBA BILLETERA ---</Text>

      <TextInput placeholder="Nombre" value={id} onChangeText={setId} />
      <TextInput placeholder="Entidad" value={nombre} onChangeText={setNombre} />
      <TextInput placeholder="Divisa" value={divisa} onChangeText={setDivisa} />
      <TextInput placeholder="Monto" value={monto} onChangeText={setMonto} keyboardType="numeric" />

      <Button title="Guardar en SQLite" onPress={handleGuardar} />

      <Text style={{ marginTop: 30 }}>--- DATOS EN LA BASE DE DATOS ---</Text>
      {billeteras.length > 0 ? (
        billeteras.map((billetera, index) => (
          <TouchableOpacity
            key={`${billetera.id}-${index}`}
            onPress={() => rellenarFormulario(billetera)}
          >
            <View style={{ marginTop: 10, padding: 10, borderWidth: 1 }}>
              <Text>Nombre: {billetera.nombre}</Text>
              <Text>Entidad: {billetera.entidad}</Text>
              <Text>Divisa: {billetera.divisa}</Text>
              <Text>Monto: {billetera.monto}</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <Text>No hay ninguna billetera registrada todavía.</Text>
      )}


    </ScrollView>
  );

}