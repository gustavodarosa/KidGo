import React, { useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useViewModel } from '../../viewmodels/DriverAvailableRidesViewModel';
import Button from '../../components/Button';

const AvailableRidesScreen = () => {
    const viewModel = useViewModel();

    useEffect(() => {
        viewModel.fetchAvailableRides();
    }, []);

    const renderRideItem = ({ item }) => (
        <View>
            <Text>{item.childName}</Text>
            <Text>{item.pickupLocation}</Text>
            <Button title="Accept Ride" onPress={() => viewModel.acceptRide(item.id)} />
        </View>
    );

    return (
        <View>
            {viewModel.loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <FlatList
                    data={viewModel.availableRides}
                    renderItem={renderRideItem}
                    keyExtractor={(item) => item.id.toString()}
                />
            )}
        </View>
    );
};

export default AvailableRidesScreen;