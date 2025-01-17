import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';

const CreateBookingScreen = ({ token, navigation }) => {
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [fare, setFare] = useState('');
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Using default location (Bangalore).');
          setUserLocation({ latitude: 12.9716, longitude: 77.5946 });
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
        console.log('User Location:', location.coords);
      } catch (error) {
        console.error('Error fetching location:', error.message);
        Alert.alert('Error', 'Using default location (Bangalore).');
        setUserLocation({ latitude: 12.9716, longitude: 77.5946 });
      }
    };

    fetchLocation();
  }, []);

  const handleCreateBooking = async () => {
    if (!pickupLocation.trim() || !dropoffLocation.trim() || !fare.trim()) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    if (!userLocation) {
      Alert.alert('Error', 'Unable to determine your location.');
      return;
    }

    try {
      const validationResponse = await axios.post(
        'http://192.168.224.14:5000/validate-location',
        {
          pickupLocation,
          userCoords: userLocation,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!validationResponse.data.isValid) {
        Alert.alert('Error', validationResponse.data.message);
        return;
      }

      const bookingResponse = await axios.post(
        'http://192.168.224.14:5000/book',
        {
          pickupLocation,
          dropoffLocation,
          fare: parseFloat(fare),
          userCoords: userLocation,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert('Success', 'Booking created successfully!');
      navigation.navigate('Bookings');
    } catch (error) {
      console.error('Error creating booking:', error.message);
      Alert.alert('Error', 'Failed to create booking.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create a New Booking</Text>

      <TextInput
        style={styles.input}
        placeholder="Pickup Location"
        value={pickupLocation}
        onChangeText={setPickupLocation}
      />

      <TextInput
        style={styles.input}
        placeholder="Dropoff Location"
        value={dropoffLocation}
        onChangeText={setDropoffLocation}
      />

      <TextInput
        style={styles.input}
        placeholder="Fare"
        value={fare}
        onChangeText={setFare}
        keyboardType="numeric"
      />

      <Button title="Create Booking" onPress={handleCreateBooking} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
});

export default CreateBookingScreen;
