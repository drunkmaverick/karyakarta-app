import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  updateDoc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// Create a new service booking request
export const createBookingRequest = async ({ userId, address, date, time }) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      throw new Error('User profile not found');
    }

    const userData = userSnap.data();

    const booking = {
      userId,
      userName: userData.name || 'Unknown',
      address,
      date,
      time,
      status: 'pending',
      createdAt: Timestamp.now()
    };

    await addDoc(collection(db, 'bookings'), booking);
    return { success: true };

  } catch (error) {
    console.error('🔥 Booking creation error:', error);
    return { success: false, error: error.message };
  }
};

// Fetch all bookings for a specific user
export const getUserBookings = async (userId) => {
  try {
    console.log("📡 Running query for userId:", userId);

    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const bookings = [];

    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log("📦 Bookings returned:", bookings.length);

    return {
      success: true,
      bookings
    };
  } catch (error) {
    console.error("🔥 Firestore error in getUserBookings:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get all pending bookings (for admin)
export const getPendingBookings = async () => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const bookings = [];

    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      bookings
    };
  } catch (error) {
    console.error("🔥 getPendingBookings error:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ✅ UPDATED: Get all bookings (for admin dashboard)
export const getAllBookings = async (statusFilter = null) => {
  try {
    let q;

    if (statusFilter) {
      console.log("📥 Fetching bookings with status filter:", statusFilter);
      q = query(
        collection(db, 'bookings'),
        where('status', '==', statusFilter),
        orderBy('createdAt', 'desc')
      );
    } else {
      console.log("📥 Fetching ALL bookings (no filter)");
      q = query(
        collection(db, 'bookings'),
        orderBy('createdAt', 'desc')
      );
    }

    const querySnapshot = await getDocs(q);
    const bookings = [];

    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log("📦 Admin view bookings fetched:", bookings.length);

    return {
      success: true,
      bookings
    };
  } catch (error) {
    console.error("🔥 Firestore error in getAllBookings:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Update booking status
export const updateBookingStatus = async (bookingId, status, additionalData = {}) => {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);

    const updateData = {
      status,
      updatedAt: Timestamp.now(),
      ...additionalData
    };

    if (status === 'completed') {
      updateData.completedAt = Timestamp.now();
    }

    await updateDoc(bookingRef, updateData);

    return {
      success: true,
      message: `Booking status updated to ${status}`
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};