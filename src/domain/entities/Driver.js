class User {
    constructor(id, name, role) {
        this.id = id;
        this.name = name;
        this.role = role;
    }
}

class Driver extends User {
    constructor(id, name, licenseNumber, vehicleDetails) {
        super(id, name, 'driver');
        this.licenseNumber = licenseNumber;
        this.vehicleDetails = vehicleDetails;
    }
}

export default Driver;