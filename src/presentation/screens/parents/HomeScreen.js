import React from 'react';
import { View, Text, Button } from 'react-native';
import ParentHomeViewModel from '../../viewmodels/ParentHomeViewModel';

const HomeScreen = ({ navigation }) => {
    const viewModel = new ParentHomeViewModel();

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Welcome to the Parent Home Screen!</Text>
            <Button
                title="Schedule a Ride"
                onPress={() => navigation.navigate('ScheduleRide')}
            />
            {/* Additional UI elements can be added here */}
        </View>
    );
};

export default HomeScreen;