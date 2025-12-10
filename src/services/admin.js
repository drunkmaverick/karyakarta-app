import { 
    collection, 
    query, 
    where, 
    getDocs,
    doc,
    updateDoc,
    getDoc,
    Timestamp
  } from 'firebase/firestore';
  import { db } from './firebase';
  
  // Get all available sweepers
  export const getAvailableSweepers = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'sweeper'),
        where('isActive', '==', true)
      );
  
      const querySnapshot = await getDocs(q);
      const sweepers = [];
  
      querySnapshot.forEach((doc) => {
        sweepers.push({
          id: doc.id,
          ...doc.data()
        });
      });
  
      return {
        success: true,
        sweepers: sweepers
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Assign a sweeper to a booking request
  export const assignSweeperToBooking = async (bookingId, sweeperId) => {
    try {
      // First, get sweeper details
      const sweeperRef = doc(db, 'users', sweeperId);
      const sweeperSnap = await getDoc(sweeperRef);
  
      if (!sweeperSnap.exists()) {
        return {
          success: false,
          error: 'Sweeper not found'
        };
      }
  
      const sweeperData = sweeperSnap.data();
  
      // Update booking with assigned sweeper
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'assigned',
        assignedSweeper: sweeperId,
        sweeperName: sweeperData.name,
        sweeperPhone: sweeperData.phone || '',
        updatedAt: Timestamp.now()
      });
  
      return {
        success: true,
        message: `Booking assigned to ${sweeperData.name}`,
        sweeperData: sweeperData
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Get bookings assigned to a specific sweeper
  export const getSweeperBookings = async (sweeperId) => {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('assignedSweeper', '==', sweeperId),
        orderBy('scheduledTime', 'asc')
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
        bookings: bookings
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Mark booking as completed (for sweepers)
  export const markBookingCompleted = async (bookingId, completionNotes = '') => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      
      await updateDoc(bookingRef, {
        status: 'completed',
        completedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        completionNotes: completionNotes
      });
  
      return {
        success: true,
        message: 'Booking marked as completed'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };
  
  // Start work on a booking (for sweepers)
  export const startBookingWork = async (bookingId) => {
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      
      await updateDoc(bookingRef, {
        status: 'in-progress',
        startedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
  
      return {
        success: true,
        message: 'Work started on booking'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };