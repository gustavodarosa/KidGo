export default class ScheduleRide {
    constructor(rideRepository) {
        this.rideRepository = rideRepository;
    }

    async execute(rideDetails) {
        // Validate ride details
        this.validateRideDetails(rideDetails);

        // Schedule the ride
        const scheduledRide = await this.rideRepository.scheduleRide(rideDetails);

        return scheduledRide;
    }

    validateRideDetails(rideDetails) {
        if (!rideDetails.driverId) {
            throw new Error("Driver ID is required to schedule a ride.");
        }
        if (!rideDetails.childId) {
            throw new Error("Child ID is required to schedule a ride.");
        }
        if (!rideDetails.pickupLocation) {
            throw new Error("Pickup location is required.");
        }
        if (!rideDetails.dropoffLocation) {
            throw new Error("Dropoff location is required.");
        }
        // Additional validation logic can be added here
    }
}