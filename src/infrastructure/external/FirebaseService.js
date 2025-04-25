import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

class FirebaseService {
    constructor() {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        this.db = firebase.firestore();
        this.auth = firebase.auth();
    }

    // Authentication methods
    async signIn(email, password) {
        return await this.auth.signInWithEmailAndPassword(email, password);
    }

    async signOut() {
        return await this.auth.signOut();
    }

    async register(email, password) {
        return await this.auth.createUserWithEmailAndPassword(email, password);
    }

    // Firestore methods
    async getUserData(userId) {
        const userDoc = await this.db.collection('users').doc(userId).get();
        return userDoc.exists ? userDoc.data() : null;
    }

    async saveUserData(userId, data) {
        return await this.db.collection('users').doc(userId).set(data);
    }

    async getRides() {
        const ridesSnapshot = await this.db.collection('rides').get();
        return ridesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async saveRide(rideData) {
        return await this.db.collection('rides').add(rideData);
    }
}

export default new FirebaseService();