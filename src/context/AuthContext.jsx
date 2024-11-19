import { createContext, useContext, useEffect, useState } from 'react';
import {
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup,
    signOut,
} from 'firebase/auth';
import { auth } from '../firebase';
import Loading from '../pages/Loading';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const AuthContext = createContext();

function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null); // Current authenticated user
    const [loading, setLoading] = useState(true); // Loading state

    const storage = getStorage(); // Firebase Storage instance

    // Sign in with Google
    async function signInWithGoogle() {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            return result.user;
        } catch (error) {
            console.error('Error signing in with Google:', error);
            throw error;
        }
    }

    // Sign up with email, password, and profile picture
    // async function signUpWithEmail(email, password, profilePic, displayName) {
    //     try {
    //         const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    //         const user = userCredential.user;
    
    //         // Update user's display name
    //         await updateProfile(user, { displayName });
    
    //         // Handle profile picture upload
    //         if (profilePic) {
    //             const storageRef = ref(storage, `profile-pictures/${user.uid}/${profilePic.name}`);
    //             await uploadBytes(storageRef, profilePic);
    //             const downloadURL = await getDownloadURL(storageRef);
    
    //             // Update user's profile with the downloadURL
    //             await updateProfile(user, { photoURL: downloadURL });
    //             console.log('Profile picture uploaded, URL:', downloadURL);
    //         }
    
    //         console.log('User registered:', user);
    //         setCurrentUser({ ...user, displayName }); // Update the currentUser with displayName
    //     } catch (error) {
    //         console.error('Error signing up:', error);
    //         throw error;
    //     }
    // }

    // Sign in with email and password
    // async function signInWithEmail(email, password) {
    //     try {
    //         const userCredential = await signInWithEmailAndPassword(auth, email, password);
    //         return userCredential.user;
    //     } catch (error) {
    //         console.error('Error signing in:', error);
    //         throw error;
    //     }
    // }

    // Log out
    function logOut() {
        return signOut(auth).catch((error) => console.error('Error signing out:', error));
    }

    
    // Upload profile picture to Firebase Storage
    async function uploadProfilePicture(file) {
        try {
            if (!file) throw new Error('No file provided');

            const storageRef = ref(storage, `profile-pictures/${currentUser.uid}/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Optionally, update user's profile with the downloadURL if needed
            console.log('Profile picture uploaded, URL:', downloadURL);
            return downloadURL;
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            throw error;
        }
    }

    // Provide context values
    const value = {
        currentUser,
        signInWithGoogle,
        logOut,
        uploadProfilePicture,
    };

    // Check user authentication state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe; // Cleanup subscription on unmount
    }, []);

    return (
        <AuthContext.Provider value={value}>
            {loading ? <Loading /> : children} {/* Show loading spinner until authentication state is resolved */}
        </AuthContext.Provider>
    );
}

// Access the AuthContext then throw an error if used outside the AuthProvider
function UserAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('UserAuth must be used within an AuthProvider');
    }
    return context;
}

export { AuthProvider, UserAuth };
