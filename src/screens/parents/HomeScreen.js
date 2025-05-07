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
    cardShadow: '#000',
    babyBlueLight: '#A0D2EB', // Azul bebê um pouco mais escuro
    babyBlueDark: '#87CEEB',  // Azul bebê um pouco mais escuro
};

const SUGGESTED_PLACES = [
    { id: 'school', name: 'Escola', icon: '🏫' },
    { id: 'home', name: 'Casa', icon: '🏠' },
    { id: 'swimming', name: 'Natação', icon: '🧸' },
    { id: 'tutoring', name: 'Reforço', icon: '🎨' },
    { id: 'grandma', name: 'Casa da Vovó', icon: '👵' },
];

// Obtendo as dimensões da tela
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Definindo o tamanho dos cards de sugestão com base na largura da tela
// Por exemplo, 22% da largura da tela para cada card, permitindo uns 4 cards visíveis com margem
const suggestionCardWidth = screenWidth * 0.22;
const suggestionCardHeight = suggestionCardWidth; // Para cards quadrados

const FeatureCard = ({ iconName, iconType = FontAwesome, label, onPress }) => (
    <TouchableOpacity style={styles.featureCard} onPress={onPress}>
        {iconType === FontAwesome ? (
            <FontAwesome name={iconName} size={22} color={COLORS.primary} style={styles.featureCardIcon} />
        ) : (
            <Ionicons name={iconName} size={22} color={COLORS.primary} style={styles.featureCardIcon} />
        )}
        <Text style={styles.featureCardLabel}>{label}</Text>
    </TouchableOpacity>
);

const HomeScreen = () => {
    const [searchText, setSearchText] = useState('');
    const navigation = useNavigation();

    const handleNavigateToScheduleRide = () => {
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

    const handleNavigateToChildProfile = () => {
        console.log('Navegar para Perfil dos Filhos');
        alert('Funcionalidade "Perfil dos Filhos" em desenvolvimento!');
    };

    const scrollViewStyle = StyleSheet.compose(styles.container, {
        marginTop: Platform.OS === 'android' ? -StatusBar.currentHeight : -10,
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={scrollViewStyle}>
                {/* Barra de Pesquisa */}
                <View style={styles.searchBarContainer}>
                    <FontAwesome name="search" size={20} color={COLORS.secondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Pra onde vamos levar hoje?"
                        value={searchText}
                        onChangeText={setSearchText}
                        placeholderTextColor={COLORS.secondary}
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
                                <Text style={styles.suggestionIcon}>{place.icon}</Text>
                                <Text style={styles.suggestionText} numberOfLines={2} ellipsizeMode="tail">{place.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Mascote */}
                <Image
                    source={require('./assets/search.png')}
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
        elevation: 3,
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
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
        marginTop: 20,
        marginBottom: 20,
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
        marginRight: 15,                // Espaçamento entre os cards
        padding: 8,                     // Espaçamento interno
        alignItems: 'center',          // Centraliza conteúdo horizontalmente
        justifyContent: 'center',       // Centraliza conteúdo verticalmente
        borderWidth: 1,                 // Adiciona uma borda fina
        borderColor: COLORS.primary,    // Define a cor da borda como preta (primary é #000000)
        shadowColor: COLORS.cardShadow, // Sombra para iOS
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
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
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        height: 70,
        borderWidth: 1, // Adiciona uma borda
        // backgroundColor: COLORS.babyBlueLight, // Remove o fundo sólido
    },
    actionButtonIcon: {
        marginRight: 12,
    },
    actionButtonIconImage: {
        width: 100, // Ajustado para ser igual à altura para ícones quadrados, ou ajuste conforme a proporção
        height: 100, // Aumentamos a altura do ícone
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