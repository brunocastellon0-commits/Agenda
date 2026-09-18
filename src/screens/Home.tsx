import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Button } from 'react-native';
import { saveOrUpdateUsuario, getUsuarios, Usuario } from '../repositories/usuario';
import { Link } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  UserTestScreen: undefined;
  Billetera: undefined;
};

export default function UserTestScreen({ navigation }: { navigation: NativeStackNavigationProp<RootStackParamList> }) {
  const [ci, setCi] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [cintura, setCintura] = useState('');
  const [cuello, setCuello] = useState('');
  const [edad, setEdad] = useState('');

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  // Función para cargar los usuarios de la BD
  const cargarUsuarios = async () => {
    const data = await getUsuarios();
    setUsuarios(data);
  };

  // Cargar al abrir la pantalla
  useEffect(() => {
    cargarUsuarios();
  }, []);

  // Rellena el formulario con los datos de un usuario tocado
  const rellenarFormulario = (usuario: Usuario) => {
    setCi(usuario.ci ?? '');
    setNombre(usuario.nombre);
    setApellido(usuario.apellido);
    setPeso(usuario.peso.toString());
    setAltura(usuario.altura.toString());
    setCintura(usuario.cintura.toString());
    setCuello(usuario.cuello.toString());
    setEdad(usuario.edad.toString());
  };

  const handleGuardar = async () => {
    try {
      await saveOrUpdateUsuario({
        ci: ci,
        nombre: nombre,
        apellido: apellido,
        peso: Number(peso),
        altura: Number(altura),
        cintura: Number(cintura),
        cuello: Number(cuello),
        edad: Number(edad),
      });
      alert('¡Usuario guardado con éxito!');
      cargarUsuarios(); // Recargar la vista para verificar
    } catch (error) {
      console.error(error);
      alert('Hubo un error al guardar');
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text>--- FORMULARIO DE PRUEBA USUARIO ---</Text>

      <TextInput placeholder="CI" value={ci} onChangeText={setCi} />
      <TextInput placeholder="Nombre" value={nombre} onChangeText={setNombre} />
      <TextInput placeholder="Apellido" value={apellido} onChangeText={setApellido} />
      <TextInput placeholder="Peso" value={peso} onChangeText={setPeso} keyboardType="numeric" />
      <TextInput placeholder="Altura" value={altura} onChangeText={setAltura} keyboardType="numeric" />
      <TextInput placeholder="Cintura" value={cintura} onChangeText={setCintura} keyboardType="numeric" />
      <TextInput placeholder="Cuello" value={cuello} onChangeText={setCuello} keyboardType="numeric" />
      <TextInput placeholder="Edad" value={edad} onChangeText={setEdad} keyboardType="numeric" />

      <Button title="Guardar en SQLite" onPress={handleGuardar} />

      <Button
        title="Ir a Billetera"
        onPress={() => navigation.navigate('Billetera')}
      />
 
    </ScrollView>
  );
}