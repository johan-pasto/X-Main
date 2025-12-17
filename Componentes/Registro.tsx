import React, { useState } from "react";
import {
  TextInput,
  Text,
  View,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import estilos from "../Estilos/Style";
import { StackNavigationProp } from "@react-navigation/stack";

type RegistroScreenNavigationProp = StackNavigationProp<any, "Registro">;

type Props = {
  navigation: RegistroScreenNavigationProp;
};

export default function Registro({ navigation }: Props) {
  const [nombre, setNombre] = useState("");
  const [usuario, setUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);

  // Estados para validación en tiempo real
  const [errors, setErrors] = useState({
    nombre: "",
    usuario: "",
    email: "",
    password: "",
    confirmPassword: "",
    telefono: "",
  });

  // Validación de email
  const validarEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Validación de contraseña
  const validarPassword = (password: string) => {
    return password.length >= 6;
  };

  // Validación de teléfono (opcional)
  const validarTelefono = (telefono: string) => {
    if (!telefono) return true; // Es opcional
    const regex = /^[0-9]{10}$/;
    return regex.test(telefono);
  };

  // Validar campo individual
  const validarCampo = (campo: string, valor: string) => {
    let error = "";

    switch (campo) {
      case "nombre":
        if (!valor.trim()) error = "El nombre es requerido";
        else if (valor.length < 3)
          error = "El nombre debe tener al menos 3 caracteres";
        break;
      case "usuario":
        if (!valor.trim()) error = "El usuario es requerido";
        else if (valor.length < 4)
          error = "El usuario debe tener al menos 4 caracteres";
        else if (!/^[a-zA-Z0-9_]+$/.test(valor))
          error = "Solo letras, números y guión bajo";
        break;
      case "email":
        if (!valor.trim()) error = "El email es requerido";
        else if (!validarEmail(valor)) error = "Email inválido";
        break;
      case "password":
        if (!valor) error = "La contraseña es requerida";
        else if (!validarPassword(valor))
          error = "Mínimo 6 caracteres";
        break;
      case "confirmPassword":
        if (!valor) error = "Confirma tu contraseña";
        else if (valor !== password) error = "Las contraseñas no coinciden";
        break;
      case "telefono":
        if (valor && !validarTelefono(valor))
          error = "Teléfono inválido (10 dígitos)";
        break;
    }

    setErrors((prev) => ({ ...prev, [campo]: error }));
    return error === "";
  };

  // Validar todos los campos
  const validarFormulario = () => {
    const nombreValido = validarCampo("nombre", nombre);
    const usuarioValido = validarCampo("usuario", usuario);
    const emailValido = validarCampo("email", email);
    const passwordValido = validarCampo("password", password);
    const confirmPasswordValido = validarCampo(
      "confirmPassword",
      confirmPassword
    );
    const telefonoValido = validarCampo("telefono", telefono);

    return (
      nombreValido &&
      usuarioValido &&
      emailValido &&
      passwordValido &&
      confirmPasswordValido &&
      telefonoValido
    );
  };

  const handleRegistro = async () => {
    // Validar formulario
    if (!validarFormulario()) {
      Alert.alert("Error", "Por favor corrige los errores en el formulario");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "https://apix-two.vercel.app/api/registro",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre,
            usuario,
            email,
            password,
            telefono: telefono || undefined,
          }),
        }
      );

      const data = await res.json();

      if (res.ok && data.ok) {
        Alert.alert(
          "Éxito",
          "Cuenta creada exitosamente. Ahora puedes iniciar sesión.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Inicio"),
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          data.message || "No se pudo crear la cuenta. Intenta de nuevo."
        );
      }
    } catch (e) {
      console.error("Error de conexión:", e);
      Alert.alert("Error", "No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#000" }}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 20,
          justifyContent: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ maxWidth: 600, width: "100%", alignSelf: "center" }}>
          {/* Header */}
          <View style={{ marginBottom: 40, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: "#fff",
                marginBottom: 10,
              }}
            >
              Únete hoy
            </Text>
            <Text style={{ fontSize: 15, color: "#71767B" }}>
              Crea tu cuenta
            </Text>
          </View>

          {/* Nombre completo */}
          <View style={{ marginBottom: 20 }}>
            <TextInput
              style={[
                estilos.textinput,
                {
                  backgroundColor: "#000",
                  borderWidth: 1,
                  borderColor: errors.nombre ? "#F4212E" : "#333",
                  color: "#fff",
                  borderRadius: 4,
                  fontSize: 17,
                },
              ]}
              placeholder="Nombre completo"
              placeholderTextColor="#71767B"
              value={nombre}
              onChangeText={(text) => {
                setNombre(text);
                validarCampo("nombre", text);
              }}
              autoCapitalize="words"
            />
            {errors.nombre ? (
              <Text style={{ color: "#F4212E", fontSize: 13, marginTop: 5 }}>
                {errors.nombre}
              </Text>
            ) : null}
          </View>

          {/* Usuario */}
          <View style={{ marginBottom: 20 }}>
            <TextInput
              style={[
                estilos.textinput,
                {
                  backgroundColor: "#000",
                  borderWidth: 1,
                  borderColor: errors.usuario ? "#F4212E" : "#333",
                  color: "#fff",
                  borderRadius: 4,
                  fontSize: 17,
                },
              ]}
              placeholder="Usuario"
              placeholderTextColor="#71767B"
              value={usuario}
              onChangeText={(text) => {
                setUsuario(text.toLowerCase());
                validarCampo("usuario", text);
              }}
              autoCapitalize="none"
            />
            {errors.usuario ? (
              <Text style={{ color: "#F4212E", fontSize: 13, marginTop: 5 }}>
                {errors.usuario}
              </Text>
            ) : null}
          </View>

          {/* Email */}
          <View style={{ marginBottom: 20 }}>
            <TextInput
              style={[
                estilos.textinput,
                {
                  backgroundColor: "#000",
                  borderWidth: 1,
                  borderColor: errors.email ? "#F4212E" : "#333",
                  color: "#fff",
                  borderRadius: 4,
                  fontSize: 17,
                },
              ]}
              placeholder="Email"
              placeholderTextColor="#71767B"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                validarCampo("email", text);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email ? (
              <Text style={{ color: "#F4212E", fontSize: 13, marginTop: 5 }}>
                {errors.email}
              </Text>
            ) : null}
          </View>

          {/* Teléfono (opcional) */}
          <View style={{ marginBottom: 20 }}>
            <TextInput
              style={[
                estilos.textinput,
                {
                  backgroundColor: "#000",
                  borderWidth: 1,
                  borderColor: errors.telefono ? "#F4212E" : "#333",
                  color: "#fff",
                  borderRadius: 4,
                  fontSize: 17,
                },
              ]}
              placeholder="Teléfono (opcional)"
              placeholderTextColor="#71767B"
              value={telefono}
              onChangeText={(text) => {
                setTelefono(text);
                validarCampo("telefono", text);
              }}
              keyboardType="phone-pad"
            />
            {errors.telefono ? (
              <Text style={{ color: "#F4212E", fontSize: 13, marginTop: 5 }}>
                {errors.telefono}
              </Text>
            ) : null}
          </View>

          {/* Contraseña */}
          <View style={{ marginBottom: 20 }}>
            <TextInput
              style={[
                estilos.textinput,
                {
                  backgroundColor: "#000",
                  borderWidth: 1,
                  borderColor: errors.password ? "#F4212E" : "#333",
                  color: "#fff",
                  borderRadius: 4,
                  fontSize: 17,
                },
              ]}
              placeholder="Contraseña"
              placeholderTextColor="#71767B"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                validarCampo("password", text);
                if (confirmPassword) {
                  validarCampo("confirmPassword", confirmPassword);
                }
              }}
              secureTextEntry
              autoCapitalize="none"
            />
            {errors.password ? (
              <Text style={{ color: "#F4212E", fontSize: 13, marginTop: 5 }}>
                {errors.password}
              </Text>
            ) : null}
          </View>

          {/* Confirmar contraseña */}
          <View style={{ marginBottom: 30 }}>
            <TextInput
              style={[
                estilos.textinput,
                {
                  backgroundColor: "#000",
                  borderWidth: 1,
                  borderColor: errors.confirmPassword ? "#F4212E" : "#333",
                  color: "#fff",
                  borderRadius: 4,
                  fontSize: 17,
                },
              ]}
              placeholder="Confirmar contraseña"
              placeholderTextColor="#71767B"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                validarCampo("confirmPassword", text);
              }}
              secureTextEntry
              autoCapitalize="none"
            />
            {errors.confirmPassword ? (
              <Text style={{ color: "#F4212E", fontSize: 13, marginTop: 5 }}>
                {errors.confirmPassword}
              </Text>
            ) : null}
          </View>

          {/* Botón de registro */}
          <TouchableOpacity
            style={[
              estilos.botonBase,
              {
                backgroundColor: "#1D9BF0",
                borderRadius: 9999,
                paddingVertical: 12,
                opacity: loading ? 0.7 : 1,
              },
            ]}
            onPress={handleRegistro}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={{
                  color: "#fff",
                  fontSize: 17,
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Crear cuenta
              </Text>
            )}
          </TouchableOpacity>

          {/* Link para ir a login */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: 30,
            }}
          >
            <Text style={{ color: "#71767B", fontSize: 15 }}>
              ¿Ya tienes cuenta?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Inicio")}>
              <Text
                style={{ color: "#1D9BF0", fontSize: 15, fontWeight: "500" }}
              >
                Inicia sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
