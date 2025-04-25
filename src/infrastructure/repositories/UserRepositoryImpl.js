class UserRepositoryImpl {
    constructor() {
        this.users = []; // This will hold user data temporarily
    }

    // Method to add a user
    addUser(user) {
        this.users.push(user);
    }

    // Method to get a user by ID
    getUserById(userId) {
        return this.users.find(user => user.id === userId);
    }

    // Method to get all users
    getAllUsers() {
        return this.users;
    }

    // Method to update a user
    updateUser(updatedUser) {
        const index = this.users.findIndex(user => user.id === updatedUser.id);
        if (index !== -1) {
            this.users[index] = updatedUser;
        }
    }

    // Method to delete a user
    deleteUser(userId) {
        this.users = this.users.filter(user => user.id !== userId);
    }
}

export default UserRepositoryImpl;