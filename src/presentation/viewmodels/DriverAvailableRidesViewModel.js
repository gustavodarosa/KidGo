import { observable, action } from 'mobx';

class DriverAvailableRidesViewModel {
    @observable availableRides = [];
    @observable isLoading = false;

    constructor(rideRepository) {
        this.rideRepository = rideRepository;
    }

    @action
    async fetchAvailableRides() {
        this.isLoading = true;
        try {
            this.availableRides = await this.rideRepository.getAvailableRides();
        } catch (error) {
            console.error("Failed to fetch available rides:", error);
        } finally {
            this.isLoading = false;
        }
    }

    @action
    acceptRide(rideId) {
        // Logic to accept a ride
        console.log(`Ride ${rideId} accepted`);
    }
}

export default DriverAvailableRidesViewModel;