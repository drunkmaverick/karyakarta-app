import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    onAuthStateChanged
  } from 'firebase/auth';
  import { doc, setDoc, getDoc } from 'firebase/firestore';
  import { auth, db } from './firebase';
  
  // Sign up new user
  export const signUp = async (email, password, userData = {}) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Update user profile
      if (userData.name) {
        await updateProfile(user, { displayName: userData.name });
      }
  
      // Save additional user data to Firestore
      const userDoc = {
        uid: user.uid,
        email: user.email,
        name: userData.name || '',
        phone: userData.phone || '',
        address: userData.address || '',
        role: userData.role || 'user', // 'user', 'admin', or 'sweeper'
        createdAt: new Date().toISOString(),
        isActive: true
      };
  
      await setDoc(doc(db, 'users', user.uid), userDoc);
  
      return {
        success: true,
        user: user,
        userData: userDoc
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Sign in existing user
  export const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Get additional user data from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      let userData = null;
      if (userDocSnap.exists()) {
        userData = userDocSnap.data();
      }
  
      return {
        success: true,
        user: user,
        userData: userData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Sign out user
  export const logOut = async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Get current user data
  export const getCurrentUserData = async (uid) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        return {
          success: true,
          userData: userDocSnap.data()
        };
      } else {
        return {
          success: false,
          error: 'User data not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Auth state observer
  export const onAuthStateChange = (callback) => {
    return onAuthStateChanged(auth, callback);
  };