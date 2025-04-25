import React, { useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';
import { ScheduleRide } from '../../../application/usecases/ScheduleRide';

const ScheduleRideScreen = () => {
    const [childId, setChildId] = useState('');
    const [pickupLocation, setPickupLocation] = useState('');
    const [dropoffLocation, setDropoffLocation] = useState('');
    const [scheduled, setScheduled] = useState(false);

    const handleScheduleRide = async () => {
        const scheduleRide = new ScheduleRide();
        const result = await scheduleRide.execute(childId, pickupLocation, dropoffLocation);
        if (result.success) {
            setScheduled(true);
        } else {
            // Handle error (e.g., show a message)
        }
    };

    return (
        <View>
            <Text>Schedule a Ride</Text>
            <TextInput
                placeholder="Child ID"
                value={childId}
                onChangeText={setChildId}
            />
            <TextInput
                placeholder="Pickup Location"
                value={pickupLocation}
                onChangeText={setPickupLocation}
            />
            <TextInput
                placeholder="Dropoff Location"
                value={dropoffLocation}
                onChangeText={setDropoffLocation}
            />
            <Button title="Schedule Ride" onPress={handleScheduleRide} />
            {scheduled && <Text>Ride Scheduled Successfully!</Text>}
        </View>
    );
};

export default ScheduleRideScreen;