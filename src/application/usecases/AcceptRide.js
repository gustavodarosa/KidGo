export default class AcceptRide {
    constructor(rideRepository) {
        this.rideRepository = rideRepository;
    }

    async execute(rideId, driverId) {
        const ride = await this.rideRepository.findRideById(rideId);
        if (!ride) {
            throw new Error('Ride not found');
        }

        if (ride.status !== 'available') {
            throw new Error('Ride is not available for acceptance');
        }

        ride.driverId = driverId;
        ride.status = 'accepted';

        await this.rideRepository.updateRide(ride);
        return ride;
    }
}