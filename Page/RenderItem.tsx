import estilos from "../Estilos/Style";
import { View, Text, TouchableOpacity } from 'react-native';

interface ItemProps {
    item: any;
    markDone: (task: any) => void;
    deleteFuntion: (task: any) => void;
}

export default function RenderItem({ item, markDone, deleteFuntion }: ItemProps) {
    const formatDate = (date: any) => {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <View style={estilos.itemcontainer}>
            <TouchableOpacity onPress={() => markDone(item)}>
                <Text style={item.done ? estilos.textDone : estilos.text}>{item.title}</Text>
                <Text>{formatDate(item.date)}</Text>
            </TouchableOpacity>
            {item.done && (
                <TouchableOpacity
                    style={[estilos.removeBotonBase, estilos.removeBotonNormal]}
                    onPress={() => deleteFuntion(item)}
                >
                    <Text style={estilos.removeBotonText}>Eliminar</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

// DateTimePicker 