class Address {
    constructor(street, city, zipCode) {
        this.street = street;
        this.city = city;
        this.zipCode = zipCode;
    }

    getFullAddress() {
        return `${this.street}, ${this.city}, ${this.zipCode}`;
    }
}

export default Address;