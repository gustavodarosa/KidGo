import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    TextInput,
    Platform,
    StatusBar,
    Dimensions, // Importar Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';
// import { MaterialIcons } from '@expo/vector-icons'; // Removido pois não estava sendo usado diretamente aqui

const COLORS = {
    backgroundLightGray: '#F9F9F9',
    primary: '#000000',
    secondary: '#888888',
    accent: '#FFFFFF',
    lightGray: '#EEEEEE',
    cardShadow: '#000', // Mantido de seu contexto original
    babyBlueLight: '#ADD8E6', // Azul bebê claro, como no seu exemplo
    babyBlueDark: '#87CEEB',  // Azul bebê um pouco mais escuro
};

const SUGGESTED_PLACES = [
    { id: 'school', name: 'Escola', icon: require('./assets/escola.png') },
    { id: 'home', name: 'Casa', icon: require('./assets/casa.png') },
    { id: 'swimming', name: 'Natação', icon: '🧸' }, // Alterado para emoji como no seu exemplo
    { id: 'tutoring', name: 'Reforço', icon: '🎨' },   // Adicionado como no seu exemplo
    { id: 'grandma', name: 'Casa da Vovó', icon: require('./assets/vovo.png') },
];

// Obtendo as dimensões da tela
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Definindo o tamanho dos cards de sugestão com base na largura da tela
// Por exemplo, 22% da largura da tela para cada card, permitindo uns 4 cards visíveis com margem
const suggestionCardWidth = screenWidth * 0.22;
const suggestionCardHeight = suggestionCardWidth; // Para cards quadrados

const HomeScreen = () => {
    const [searchText, setSearchText] = useState('');
    const navigation = useNavigation();

    const handleNavigateToScheduleRide = () => {
        // Mantido como no seu exemplo, navegando para ScheduleRide
        navigation.navigate('ScheduleRide');
    };

    const handleNavigateToDrivers = () => {
        console.log('Navegar para Ver Motoristas');
        alert('Funcionalidade "Ver Motoristas" em desenvolvimento!');
    };

    const handleNavigateToHistory = () => {
        console.log('Navegar para Histórico');
        alert('Funcionalidade "Histórico" em desenvolvimento!');
    };

    const handleNavigateToSearch = () => {
        navigation.navigate('SearchScreen'); // Navega para a SearchScreen
    };

    const scrollViewStyle = StyleSheet.compose(styles.container, {
        marginTop: Platform.OS === 'android' ? -StatusBar.currentHeight : -10,
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={scrollViewStyle}>
                {/* Barra de Pesquisa - como no seu exemplo */}
                <View style={styles.searchBarContainer}>
                    <FontAwesome name="search" size={20} color={COLORS.secondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Pra onde vamos levar hoje?"
                        value={searchText}
                        onChangeText={setSearchText} // Habilitado como no seu exemplo
                        placeholderTextColor={COLORS.secondary}
                        // editable={true} // Por padrão é true
                    />
                    <TouchableOpacity style={styles.nowButton}>
                        <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                        <Text style={styles.nowButtonText}>Agora</Text>
                    </TouchableOpacity>
                </View>

                {/* Sugestões */}
                <View style={styles.suggestionsSection}>
                    <Text style={styles.sectionTitle}>Sugestões</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
                        {SUGGESTED_PLACES.map(place => (
                            <TouchableOpacity key={place.id} style={styles.suggestionCard}>
                                <View style={styles.suggestionIconContainer}> 
                                    {/* Modificado para renderizar emoji ou imagem */}
                                    {typeof place.icon === 'string' && place.icon.length < 5 ? ( // Assumindo que emojis são curtos
                                        <Text style={styles.suggestionIcon}>{place.icon}</Text>
                                    ) : typeof place.icon === 'number' ? ( // Para require()
                                        <Image source={place.icon} style={styles.suggestionImage} resizeMode="contain" />
                                    ) : (
                                        <FontAwesome name="question-circle" size={suggestionCardWidth * 0.3} color={COLORS.secondary} /> // Fallback
                                    )}
                                </View>
                                <Text style={styles.suggestionText} numberOfLines={2} ellipsizeMode="tail">{place.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Mascote */}
                <Image
                    source={require('./assets/mascot_placeholder.png')} // Como no seu exemplo
                    style={styles.mascot}
                    resizeMode="contain"
                />

                {/* Título e Subtítulo */}
                <Text style={styles.title}>Olá, Gustavo!</Text>
                <Text style={styles.subtitle}>O que deseja fazer hoje?</Text>

                {/* Cards de Ações */}
                <View style={styles.cardsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: COLORS.babyBlueLight }]}
                        onPress={handleNavigateToScheduleRide} // Mantém a navegação original
                    >
                        <Image
                            source={require('./assets/agendar.png')} // Ícone atualizado
                            style={styles.actionButtonIconImage}
                        />
                        <Text style={styles.actionButtonLabel}>Agendar Corrida</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: COLORS.babyBlueLight }]}
                        onPress={handleNavigateToChildProfile} // Nova função para Perfil dos Filhos
                    >
                        <Image
                            source={require('./assets/filho.png')} // Ícone atualizado
                            style={styles.actionButtonIconImage}
                        />
                        <Text style={styles.actionButtonLabel}>Perfil dos Filhos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: COLORS.babyBlueLight }]}
                        onPress={() => alert('Funcionalidade "Configurações" em desenvolvimento!')} // Placeholder
                    >
                        <Image
                            source={require('./assets/configs.png')} // Ícone atualizado
                            style={styles.actionButtonIconImage}
                        />
                        <Text style={styles.actionButtonLabel}>Configurações</Text>
                    </TouchableOpacity>
                    {/* Novo Botão Suporte */}
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: COLORS.babyBlueLight }]}
                        onPress={() => alert('Funcionalidade "Suporte" em desenvolvimento!')} // Placeholder
                    >
                        <Image
                            source={require('./assets/suporte.png')}
                            style={styles.actionButtonIconImage}
                        />
                        <Text style={styles.actionButtonLabel}>Suporte</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Barra de Navegação Inferior */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.bottomNavItem}>
                    <FontAwesome name="home" size={24} color={COLORS.primary} />
                    <Text style={styles.bottomNavItemText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomNavItem}>
                    <Ionicons name="calendar-outline" size={24} color={COLORS.primary} />
                    <Text style={styles.bottomNavItemText}>Schedule</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bottomNavItem}>
                    <FontAwesome name="user" size={24} color={COLORS.primary} />
                    <Text style={styles.bottomNavItemText}>Profile</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.backgroundLightGray,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.accent, // Mudado para accent para combinar com o fundo da safeArea
        paddingHorizontal: 16,
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.accent,
        borderRadius: 25,
        paddingHorizontal: 15,
        marginTop: 10,
        marginBottom: 20,
        height: 50,
        // elevation: 3, // Pode remover ou ajustar se a borda for suficiente
        // shadowColor: COLORS.cardShadow,
        // shadowOffset: { width: 0, height: 2 },
        // shadowOpacity: 0.1,
        // shadowRadius: 3,
        borderWidth: 1, // Adiciona uma borda fina
        borderColor: COLORS.primary, // Define a cor da borda como preta
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: COLORS.secondary, // Mantido secondary para o placeholder, mas o texto digitado será primary
    },
    nowButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
    },
    nowButtonText: {
        marginLeft: 5,
        color: COLORS.primary,
        fontWeight: '600',
    },
    suggestionsSection: {
        marginTop: 30, // Aumentada a margem superior da seção de sugestões
        marginBottom: 20,
        overflow: 'visible', // Permite que o conteúdo interno transborde visualmente
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 10,
    },
    suggestionsScroll: {
        paddingVertical: 10,
    },
    suggestionCard: {
        width: suggestionCardWidth,    // Largura dinâmica
        height: suggestionCardHeight,   // Altura dinâmica (para ser quadrado)
        backgroundColor: COLORS.accent, // Mantém o fundo branco (accent é #FFFFFF)
        borderRadius: 8,                // Bordas arredondadas
        marginRight: 15,                // Espaçamento horizontal entre os cards
        paddingBottom: 2,               // Adiciona uma margem inferior interna ao card
        padding: 8,                     // Espaçamento interno
        alignItems: 'center',          // Centraliza conteúdo horizontalmente
        // justifyContent: 'center',    // Removido para permitir que o texto fique mais abaixo
        borderWidth: 1.2,                 // Aumenta a espessura da borda
        borderColor: COLORS.primary,    // Define a cor da borda como preta (primary é #000000)
        shadowColor: COLORS.cardShadow, // Sombra para iOS
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    suggestionIconContainer: { // Novo container para o ícone/imagem
        flex: 1, // Faz este container ocupar o espaço vertical disponível
        justifyContent: 'center', // Centraliza o ícone/imagem dentro deste container
        alignItems: 'center',
        width: '100%', // Garante que o container do ícone ocupe toda a largura do card
    },
    suggestionIcon: {
        fontSize: suggestionCardWidth * 0.3, // Tamanho do ícone proporcional ao card
        marginBottom: 5,
    },
    suggestionText: {
        color: COLORS.primary,
        fontSize: suggestionCardWidth * 0.14, // Tamanho da fonte proporcional
        textAlign: 'center', // Centraliza o texto se ele quebrar linha
    },
    suggestionImage: { // Novo estilo para imagens nos cards de sugestão
        width: suggestionCardWidth *0.8, // Reduzir um pouco para melhor controle dentro do card
        height: suggestionCardWidth * 0.8, // Reduzir um pouco para melhor controle dentro do card
        marginBottom: 8, // Aumentar a margem para separar mais do texto
    },
    mascot: {
        width: 100,
        height: 100,
        alignSelf: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.secondary,
        textAlign: 'center',
        marginBottom: 25,
    },
    cardsContainer: {
        marginTop: 20,
        marginBottom: 20,
    },
    actionButton: {
        borderRadius: 8,
        paddingVertical: 16, // Mantém o padding vertical
        paddingHorizontal: 16, // Mantém o padding horizontal
        marginBottom: 20, // Aumenta o espaçamento inferior entre os botões
        flexDirection: 'row',
        alignItems: 'center',
        height: 70,
        borderWidth: 1.2, // Adiciona uma borda
        // backgroundColor: COLORS.babyBlueLight, // Remove o fundo sólido
    },
    actionButtonIcon: {
        marginRight: 12,
    },
    actionButtonIconImage: {
        width: 90, // Ajuste para um tamanho visualmente maior dentro do botão
        height: 90, // Ajuste para um tamanho visualmente maior dentro do botão
        marginRight: 12,
        resizeMode: 'contain', // Garante que a imagem caiba sem cortar, mantendo a proporção
    },
    actionButtonLabel: {
        fontSize: 16,
        color: COLORS.primary,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: COLORS.accent,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.lightGray,
    },
    bottomNavItem: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    bottomNavItemText: {
        fontSize: 12,
        color: COLORS.primary,
    },
});

export default HomeScreen;