class RideRepositoryImpl {
    constructor() {
        this.rides = []; // This will hold the ride data
    }

    // Method to create a new ride
    createRide(ride) {
        this.rides.push(ride);
        return ride;
    }

    // Method to get all rides
    getAllRides() {
        return this.rides;
    }

    // Method to get a ride by ID
    getRideById(rideId) {
        return this.rides.find(ride => ride.id === rideId);
    }

    // Method to update a ride
    updateRide(updatedRide) {
        const index = this.rides.findIndex(ride => ride.id === updatedRide.id);
        if (index !== -1) {
            this.rides[index] = updatedRide;
            return updatedRide;
        }
        return null;
    }

    // Method to delete a ride
    deleteRide(rideId) {
        const index = this.rides.findIndex(ride => ride.id === rideId);
        if (index !== -1) {
            return this.rides.splice(index, 1)[0];
        }
        return null;
    }
}

export default RideRepositoryImpl;