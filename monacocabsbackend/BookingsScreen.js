import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';

const BookingsScreen = ({ token, navigation }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!token) {
        Alert.alert('Error', 'No token found. Please log in again.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get('http://192.168.224.14:5000/bookings', {
          headers: {
            Authorization: `Bearer ${token}`, // Pass the token
          },
        });

        setBookings(response.data.bookings); // Save bookings
      } catch (error) {
        console.error('Error fetching bookings:', error.message);
        Alert.alert('Error', 'Failed to fetch bookings.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [token]);

  const calculateFare = (pickupLocation, dropoffLocation) => {
    // Use your logic to calculate fare based on the location
    // Placeholder logic based on location names
    if (pickupLocation === "Bangalore" && dropoffLocation === "Bangalore") {
      return 18; // Starting fare for Monaco Trips
    }
    return 25; // Default fare for outside Monaco
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Button
        title="Create Booking"
        onPress={() => navigation.navigate('CreateBooking')} // Navigate to CreateBookingScreen
      />
      {bookings.length > 0 ? (
        <FlatList
          data={bookings}
          keyExtractor={item => item._id.toString()}
          renderItem={({ item }) => {
            const fare = calculateFare(item.pickupLocation, item.dropoffLocation);
            return (
              <View style={styles.bookingCard}>
                <Text style={styles.location}>
                  Pickup: {item.pickupLocation} → Dropoff: {item.dropoffLocation}
                </Text>
                <Text style={styles.details}>Fare: ${fare}</Text>
                <Text style={styles.details}>Status: {item.status}</Text>
                <Text style={styles.details}>Date: {new Date(item.timestamp).toLocaleString()}</Text>
              </View>
            );
          }}
        />
      ) : (
        <Text style={styles.noBookings}>No bookings found.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookingCard: {
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  location: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  details: {
    fontSize: 14,
    color: '#555',
  },
  noBookings: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    color: '#555',
  },
});

export default BookingsScreen;
