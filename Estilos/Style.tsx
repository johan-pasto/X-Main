import { StyleSheet, Dimensions } from 'react-native';

// Paleta de colores inspirada en la app X móvil
const COLOR_PALETTE = {
  BACKGROUND: '#000000',           // Fondo principal negro
  SURFACE: '#16181C',              // Superficie de tarjetas/campos (gris muy oscuro)
  PRIMARY: '#1D9BF0',              // Azul principal de X
  PRIMARY_HOVER: '#1A8CD8',        // Azul más oscuro para hover
  TEXT: '#E7E9EA',                 // Texto principal blanco/gris muy claro
  TEXT_SECONDARY: '#71767B',       // Texto secundario gris
  BORDER: '#2F3336',               // Color de bordes gris oscuro
  ERROR: '#F4212E',                // Rojo para acciones destructivas (like "Eliminar")
  ERROR_HOVER: '#D20F1C',          // Rojo más oscuro para hover
  WHITE: '#FFFFFF',
};

const estilos = StyleSheet.create({
    container:{
        width:'100%',
        padding: 20,
        backgroundColor: COLOR_PALETTE.BACKGROUND, // Fondo negro
        flex: 1,
    },
    title:{
        fontSize: 20,
        color: COLOR_PALETTE.TEXT, // Texto claro
        fontWeight: 'bold',
        marginBottom: 8,
    },
    text:{
        fontSize: 16,
        color: COLOR_PALETTE.TEXT, // Texto claro
    },
    textDone:{
        fontSize: 16,
        color: COLOR_PALETTE.TEXT_SECONDARY, // Texto tachado en gris
        textDecorationLine:'line-through'
    },
    textinput:{
        borderColor: COLOR_PALETTE.BORDER,
        backgroundColor: COLOR_PALETTE.SURFACE, // Fondo del input oscuro
        borderWidth: 1,
        borderRadius: 8, // Bordes ligeramente menos redondeados
        width:'100%', // Ocupa todo el ancho del contenedor
        padding: 12,
        color: COLOR_PALETTE.TEXT, // Texto claro dentro del input
        fontSize: 16,
    },
    inputcontainer:{
        marginTop: 20,
        flexDirection:'column',
        justifyContent:'space-between',
        alignItems:'stretch', // Cambiado para que los hijos se estiren
        rowGap: 16, // Espaciado ligeramente mayor
        width: '100%',
    },
    // Estilos base para botones. Se usarán con Pressable y lógica de estado.
    botonBase: {
        justifyContent:'center',
        alignItems:'center',
        borderRadius: 24, // Bordes muy redondeados, típico de X
        width: 'auto', // Ancho se ajusta al contenido
        paddingVertical: 10,
        paddingHorizontal: 20,
        alignSelf: 'flex-start', // Los botones no se estiran
    },
    botonNormal: {
        backgroundColor: COLOR_PALETTE.PRIMARY, // Azul X
    },
    botonHover: {
        // Este estilo se aplicará dinámicamente al estado "hover"
        backgroundColor: COLOR_PALETTE.PRIMARY_HOVER,
    },
    botonPressed: {
        // Este estilo se aplicará dinámicamente al estado "presionado"
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    botonText: {
        color: COLOR_PALETTE.WHITE,
        fontSize: 15,
        fontWeight: 'bold',
    },
    removeBotonBase: {
        justifyContent:'center',
        alignItems:'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8, // Menos redondeado que el botón principal
    },
    removeBotonNormal: {
        backgroundColor: COLOR_PALETTE.ERROR, // Rojo para eliminar
    },
    removeBotonHover: {
        backgroundColor: COLOR_PALETTE.ERROR_HOVER,
    },
    removeBotonText: {
        color: COLOR_PALETTE.WHITE,
        fontSize: 14,
        fontWeight: '600',
    },
    itemcontainer:{
        paddingVertical: 16,
        paddingHorizontal: 0,
        borderBottomColor: COLOR_PALETTE.BORDER,
        borderBottomWidth: 1,
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems: 'center',
    },
    ContenedorBoton:{
        display:'flex',
        flexDirection:'row',
        gap: 12, // Espaciado reducido
    },
    Fondo:{
        flex: 1,
        backgroundColor: COLOR_PALETTE.BACKGROUND,
    },
    PI:{
        height:'100%',
        display:'flex',
        justifyContent:'center',
        alignItems:'center',
        backgroundColor: COLOR_PALETTE.BACKGROUND,
    },
    // Agrega al final de tu archivo Style.js, dentro del StyleSheet.create:
    loginContainer: {
        backgroundColor: '#16181C',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: '#2F3336'
    },
    logoContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1D9BF0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
    },
    logoText: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: 'bold'
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 24,
        justifyContent: 'center'
    },
    footerText: {
        color: '#71767B',
        fontSize: 12,
        textAlign: 'center'
    }
})

export default estilos;