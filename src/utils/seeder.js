const bcrypt = require('bcryptjs');
const { ObjectId } = require('mongodb');
require('dotenv').config();
const { connectDB, getCollections, client } = require('../config/db');

const seedData = async () => {
  try {
    console.log('--- Starting EquipHub Data Seeding ---');
    await connectDB();

    const {
      usersCollection,
      equipmentCollection,
      bookingsCollection,
      paymentsCollection,
      reviewsCollection
    } = getCollections();

    // 1. Seed Users (Admin, Owner, Customer)
    console.log('Seeding users...');
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('Password123', salt);

    const usersToSeed = [
      {
        name: 'EquipHub Admin',
        email: 'admin@equiphub.com',
        password: defaultPassword,
        role: 'Admin',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        phone: '+8801711000001',
        address: 'Banani, Dhaka',
        createdAt: new Date()
      },
      {
        name: 'Prime Machinery Owner',
        email: 'owner@equiphub.com',
        password: defaultPassword,
        role: 'Owner',
        photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        phone: '+8801711000002',
        address: 'Gulshan 2, Dhaka',
        createdAt: new Date()
      },
      {
        name: 'Sadia Rahman',
        email: 'customer@equiphub.com',
        password: defaultPassword,
        role: 'Customer',
        photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        phone: '+8801711000003',
        address: 'Dhanmondi, Dhaka',
        createdAt: new Date()
      }
    ];

    for (const user of usersToSeed) {
      await usersCollection.updateOne(
        { email: user.email },
        { $set: user },
        { upsert: true }
      );
    }

    const ownerUser = await usersCollection.findOne({ email: 'owner@equiphub.com' });
    const customerUser = await usersCollection.findOne({ email: 'customer@equiphub.com' });

    // 2. Seed Equipment across all 6 required categories
    console.log('Seeding equipment...');
    const equipmentItems = [
      {
        name: 'CAT 320 Hydraulic Excavator',
        description: 'Heavy duty 20-ton tracked excavator suitable for large scale earthmoving, foundation digging, and demolition projects.',
        category: 'Construction Equipment',
        rentalPrice: 350,
        rentalType: 'Daily',
        availableQuantity: 3,
        condition: 'Excellent',
        brand: 'Caterpillar',
        model: 'CAT 320 GC',
        image: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800',
        location: 'Mirpur, Dhaka',
        terms: 'Operator charges excluded. 100% fuel refill on return.',
        status: 'Approved',
        owner: {
          id: ownerUser._id,
          name: ownerUser.name,
          email: ownerUser.email
        },
        averageRating: 4.9,
        reviewCount: 3,
        createdAt: new Date(Date.now() - 15 * 86400000)
      },
      {
        name: 'Concrete Mixer Truck 500L',
        description: 'Portable high-speed diesel concrete batch mixer with hydraulic tipping hopper and pneumatic wheels.',
        category: 'Construction Equipment',
        rentalPrice: 85,
        rentalType: 'Daily',
        availableQuantity: 4,
        condition: 'Good',
        brand: 'Universal',
        model: 'CM-500D',
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
        location: 'Tejgaon, Dhaka',
        terms: 'Cleaning required after operation before return.',
        status: 'Approved',
        owner: {
          id: ownerUser._id,
          name: ownerUser.name,
          email: ownerUser.email
        },
        averageRating: 4.7,
        reviewCount: 2,
        createdAt: new Date(Date.now() - 12 * 86400000)
      },
      {
        name: 'Sony Alpha A7 IV Cinema Kit',
        description: 'Full-frame 33MP hybrid camera kit including 24-70mm GM II lens, 2x 128GB V90 SD cards, 3 batteries, and a dual charger.',
        category: 'Photography Equipment',
        rentalPrice: 65,
        rentalType: 'Daily',
        availableQuantity: 5,
        condition: 'Mint',
        brand: 'Sony',
        model: 'ILCE-7M4',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
        location: 'Gulshan, Dhaka',
        terms: 'Must provide National ID copy. Lens filter must remain on at all times.',
        status: 'Approved',
        owner: {
          id: ownerUser._id,
          name: ownerUser.name,
          email: ownerUser.email
        },
        averageRating: 5.0,
        reviewCount: 4,
        createdAt: new Date(Date.now() - 10 * 86400000)
      },
      {
        name: 'Canon EOS R5 C 8K Cinema Camera',
        description: 'True hybrid cinema camera recording internal 8K 60p RAW video with active cooling for uninterrupted documentary shoots.',
        category: 'Photography Equipment',
        rentalPrice: 110,
        rentalType: 'Daily',
        availableQuantity: 2,
        condition: 'Excellent',
        brand: 'Canon',
        model: 'EOS R5 C',
        image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800',
        location: 'Banani, Dhaka',
        terms: 'Security deposit required for unverified accounts.',
        status: 'Approved',
        owner: {
          id: ownerUser._id,
          name: ownerUser.name,
          email: ownerUser.email
        },
        averageRating: 4.8,
        reviewCount: 2,
        createdAt: new Date(Date.now() - 8 * 86400000)
      },
      {
        name: 'John Deere 5075E 4WD Utility Tractor',
        description: 'Powerful 75HP 4-wheel drive agricultural tractor with rear PTO and 3-point hitch, ideal for plowing and heavy haulage.',
        category: 'Agriculture Equipment',
        rentalPrice: 180,
        rentalType: 'Daily',
        availableQuantity: 2,
        condition: 'Excellent',
        brand: 'John Deere',
        model: '5075E',
        image: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0c5c1c?w=800',
        location: 'Savar, Dhaka',
        terms: 'Delivered to farmland within Dhaka division.',
        status: 'Approved',
        owner: {
          id: ownerUser._id,
          name: ownerUser.name,
          email: ownerUser.email
        },
        averageRating: 4.9,
        reviewCount: 1,
        createdAt: new Date(Date.now() - 7 * 86400000)
      },
      {
        name: 'Heavy Duty Rotary Power Tiller',
        description: '12HP diesel direct-injection walk-behind power cultivator for seedbed preparation, soil aeration, and inter-row weeding.',
        category: 'Agriculture Equipment',
        rentalPrice: 45,
        rentalType: 'Daily',
        availableQuantity: 6,
        condition: 'Good',
        brand: 'Sifang',
        model: 'GN-121',
        image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800',
        location: 'Gazipur, Dhaka',
        terms: 'Tines check before and after rental.',
        status: 'Approved',
        owner: {
          id: ownerUser._id,
          name: ownerUser.name,
          email: ownerUser.email
        },
        averageRating: 4.6,
        reviewCount: 1,
        createdAt: new Date(Date.now() - 6 * 86400000)
      },
      {
        name: 'Isuzu NPR 4-Ton Cargo Box Truck',
        description: 'Reliable 14-foot closed refrigerated/dry box truck with hydraulic liftgate, perfect for event transport and commercial shifting.',
        category: 'Vehicles & Transportation',
        rentalPrice: 140,
        rentalType: 'Daily',
        availableQuantity: 3,
        condition: 'Excellent',
        brand: 'Isuzu',
        model: 'NPR 75',
        image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=800',
        location: 'Uttara, Dhaka',
        terms: 'Commercial driving license required.',
        status: 'Approved',
        owner: {
          id: ownerUser._id,
          name: ownerUser.name,
          email: ownerUser.email
        },
        averageRating: 4.8,
        reviewCount: 3,
        createdAt: new Date(Date.now() - 5 * 86400000)
      },
      {
        name: 'Honda EU3000i Super Quiet Inverter Generator',
        description: 'Whisper-quiet 3000W portable inverter generator providing clean electricity safe for sensitive electronics, audio, and outdoor shoots.',
        category: 'Electronics',
        rentalPrice: 55,
        rentalType: 'Daily',
        availableQuantity: 8,
        condition: 'Mint',
        brand: 'Honda',
        model: 'EU3000iS',
        image: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800',
        location: 'Mohakhali, Dhaka',
        terms: 'Operate strictly outdoors.',
        status: 'Approved',
        owner: {
          id: ownerUser._id,
          name: ownerUser.name,
          email: ownerUser.email
        },
        averageRating: 5.0,
        reviewCount: 2,
        createdAt: new Date(Date.now() - 4 * 86400000)
      },
      {
        name: 'JBL PRX ONE All-In-One Line Array PA System',
        description: '2000W column PA sound system with built-in 7-channel digital mixer, Bluetooth 5.0, DSP effects, and dual carry bags for events.',
        category: 'Event Equipment',
        rentalPrice: 95,
        rentalType: 'Daily',
        availableQuantity: 4,
        condition: 'Mint',
        brand: 'JBL Professional',
        model: 'PRX ONE',
        image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
        location: 'Dhanmondi, Dhaka',
        terms: 'Includes two wireless microphones and stands.',
        status: 'Approved',
        owner: {
          id: ownerUser._id,
          name: ownerUser.name,
          email: ownerUser.email
        },
        averageRating: 4.9,
        reviewCount: 4,
        createdAt: new Date(Date.now() - 3 * 86400000)
      },
      {
        name: 'DJI Inspire 3 8K Cinema Drone',
        description: 'Full-frame 8K ProRes RAW cinema drone with RTK precision positioning, dual-control support, and obstacle sensing system.',
        category: 'Photography Equipment',
        rentalPrice: 220,
        rentalType: 'Daily',
        availableQuantity: 2,
        condition: 'Mint',
        brand: 'DJI',
        model: 'Inspire 3',
        image: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800',
        location: 'Gulshan, Dhaka',
        terms: 'Pilot must follow local civil aviation drone regulations.',
        status: 'Approved',
        owner: {
          id: ownerUser._id,
          name: ownerUser.name,
          email: ownerUser.email
        },
        averageRating: 5.0,
        reviewCount: 2,
        createdAt: new Date(Date.now() - 2 * 86400000)
      }
    ];

    for (const item of equipmentItems) {
      await equipmentCollection.updateOne(
        { name: item.name },
        { $set: item },
        { upsert: true }
      );
    }

    const cameraItem = await equipmentCollection.findOne({ name: 'Sony Alpha A7 IV Cinema Kit' });
    const excavatorItem = await equipmentCollection.findOne({ name: 'CAT 320 Hydraulic Excavator' });
    const soundItem = await equipmentCollection.findOne({ name: 'JBL PRX ONE All-In-One Line Array PA System' });
    const canonCamera = await equipmentCollection.findOne({ name: 'Canon EOS R5 C 8K Cinema Camera' });
    const djiDrone = await equipmentCollection.findOne({ name: 'DJI Inspire 3 8K Cinema Drone' });
    const mixerTruck = await equipmentCollection.findOne({ name: 'Concrete Mixer Truck 500L' });
    const adminEquip = (await equipmentCollection.findOne({ name: 'Admin Caterpillar Excavator' })) || excavatorItem;

    // 3. Seed Sample Bookings & Payments for Owner & Admin (Pending, Approved, Active, Completed, Cancelled)
    console.log('Seeding sample bookings and payments for Owner and Admin...');
    const bookingsToSeed = [
      // --- OWNER BOOKINGS ---
      // 1. Owner: Pending
      {
        customerInfo: {
          id: customerUser._id,
          name: customerUser.name,
          email: customerUser.email,
          phone: customerUser.phone
        },
        equipmentId: canonCamera._id,
        equipmentName: canonCamera.name,
        equipmentImage: canonCamera.image,
        equipmentCategory: canonCamera.category,
        ownerId: ownerUser._id,
        ownerName: ownerUser.name,
        ownerEmail: ownerUser.email,
        rentalStartDate: new Date(Date.now() + 2 * 86400000),
        rentalEndDate: new Date(Date.now() + 4 * 86400000),
        bookingDate: new Date(),
        quantity: 1,
        totalAmount: 220,
        paymentStatus: 'Paid',
        bookingStatus: 'Pending',
        transactionId: 'txn_owner_pending_001',
        deliveryAddress: 'House 45, Road 11, Banani, Dhaka',
        contactNumber: customerUser.phone,
        notes: 'Need camera with 2 extra batteries for documentary shoot.',
        createdAt: new Date()
      },
      // 2. Owner: Approved
      {
        customerInfo: {
          id: new ObjectId(),
          name: 'Tanvir Ahmed',
          email: 'tanvir.event@gmail.com',
          phone: '+880 1819-334455'
        },
        equipmentId: djiDrone._id,
        equipmentName: djiDrone.name,
        equipmentImage: djiDrone.image,
        equipmentCategory: djiDrone.category,
        ownerId: ownerUser._id,
        ownerName: ownerUser.name,
        ownerEmail: ownerUser.email,
        rentalStartDate: new Date(Date.now() + 1 * 86400000),
        rentalEndDate: new Date(Date.now() + 3 * 86400000),
        bookingDate: new Date(Date.now() - 12 * 3600000),
        quantity: 1,
        totalAmount: 440,
        paymentStatus: 'Paid',
        bookingStatus: 'Approved',
        transactionId: 'txn_owner_approved_002',
        deliveryAddress: 'Gulshan 2 Circle, Dhaka',
        contactNumber: '+880 1819-334455',
        notes: 'Drone operator will pick up from warehouse.',
        createdAt: new Date(Date.now() - 12 * 3600000)
      },
      // 3. Owner: Active
      {
        customerInfo: {
          id: customerUser._id,
          name: customerUser.name,
          email: customerUser.email,
          phone: customerUser.phone
        },
        equipmentId: soundItem._id,
        equipmentName: soundItem.name,
        equipmentImage: soundItem.image,
        equipmentCategory: soundItem.category,
        ownerId: ownerUser._id,
        ownerName: ownerUser.name,
        ownerEmail: ownerUser.email,
        rentalStartDate: new Date(Date.now() - 1 * 86400000),
        rentalEndDate: new Date(Date.now() + 2 * 86400000),
        bookingDate: new Date(Date.now() - 2 * 86400000),
        quantity: 2,
        totalAmount: 380,
        paymentStatus: 'Paid',
        bookingStatus: 'Active',
        transactionId: 'txn_owner_active_003',
        deliveryAddress: 'Dhanmondi Club, Road 27, Dhaka',
        contactNumber: customerUser.phone,
        notes: 'Currently in active lease for weekend musical evening.',
        createdAt: new Date(Date.now() - 2 * 86400000)
      },
      // 4. Owner: Completed
      {
        customerInfo: {
          id: customerUser._id,
          name: customerUser.name,
          email: customerUser.email,
          phone: customerUser.phone
        },
        equipmentId: cameraItem._id,
        equipmentName: cameraItem.name,
        equipmentImage: cameraItem.image,
        equipmentCategory: cameraItem.category,
        ownerId: ownerUser._id,
        ownerName: ownerUser.name,
        ownerEmail: ownerUser.email,
        rentalStartDate: new Date(Date.now() - 6 * 86400000),
        rentalEndDate: new Date(Date.now() - 3 * 86400000),
        bookingDate: new Date(Date.now() - 7 * 86400000),
        quantity: 1,
        totalAmount: 195,
        paymentStatus: 'Paid',
        bookingStatus: 'Completed',
        transactionId: 'txn_owner_completed_004',
        deliveryAddress: 'Dhanmondi 27, Dhaka',
        contactNumber: customerUser.phone,
        notes: 'Lease concluded successfully, equipment returned in mint condition.',
        createdAt: new Date(Date.now() - 7 * 86400000)
      },
      // 5. Owner: Cancelled (Refund Processing)
      {
        customerInfo: {
          id: new ObjectId(),
          name: 'Kamal Hossain',
          email: 'kamal.constructions@yahoo.com',
          phone: '+880 1912-778899'
        },
        equipmentId: mixerTruck._id,
        equipmentName: mixerTruck.name,
        equipmentImage: mixerTruck.image,
        equipmentCategory: mixerTruck.category,
        ownerId: ownerUser._id,
        ownerName: ownerUser.name,
        ownerEmail: ownerUser.email,
        rentalStartDate: new Date(Date.now() + 3 * 86400000),
        rentalEndDate: new Date(Date.now() + 5 * 86400000),
        bookingDate: new Date(Date.now() - 2 * 86400000),
        quantity: 1,
        totalAmount: 280,
        paymentStatus: 'Refund Processing',
        bookingStatus: 'Cancelled',
        transactionId: 'txn_owner_cancelled_005',
        deliveryAddress: 'Plot 12, Sector 10, Uttara, Dhaka',
        contactNumber: '+880 1912-778899',
        notes: 'Site work postponed due to heavy rainfall.',
        refundDetails: {
          initiatedAt: new Date(Date.now() - 1 * 86400000),
          amount: 280,
          reason: 'Customer cancelled reservation due to site delay',
          refundTxnId: 'ref_owner_mixer_005'
        },
        createdAt: new Date(Date.now() - 2 * 86400000)
      },

      // --- ADMIN BOOKINGS ---
      // 6. Admin: Pending
      {
        customerInfo: {
          id: new ObjectId(),
          name: 'ali',
          email: 'ali@gmail.com',
          phone: '+880 1700-000000'
        },
        equipmentId: adminEquip._id,
        equipmentName: adminEquip.name,
        equipmentImage: adminEquip.image,
        equipmentCategory: adminEquip.category,
        ownerId: adminUser._id,
        ownerName: adminUser.name,
        ownerEmail: adminUser.email,
        rentalStartDate: new Date(Date.now() + 3 * 86400000),
        rentalEndDate: new Date(Date.now() + 6 * 86400000),
        bookingDate: new Date(),
        quantity: 1,
        totalAmount: 1050,
        paymentStatus: 'Paid',
        bookingStatus: 'Pending',
        transactionId: 'txn_admin_pending_001',
        deliveryAddress: 'Mirpur DOHS, Dhaka',
        contactNumber: '+880 1700-000000',
        notes: 'Awaiting admin lease approval for site excavation.',
        createdAt: new Date()
      },
      // 7. Admin: Approved
      {
        customerInfo: {
          id: new ObjectId(),
          name: 'Rafiqul Islam',
          email: 'rafiqul.agri@gmail.com',
          phone: '+880 1611-889900'
        },
        equipmentId: adminEquip._id,
        equipmentName: adminEquip.name,
        equipmentImage: adminEquip.image,
        equipmentCategory: adminEquip.category,
        ownerId: adminUser._id,
        ownerName: adminUser.name,
        ownerEmail: adminUser.email,
        rentalStartDate: new Date(Date.now() + 1 * 86400000),
        rentalEndDate: new Date(Date.now() + 3 * 86400000),
        bookingDate: new Date(Date.now() - 18 * 3600000),
        quantity: 1,
        totalAmount: 700,
        paymentStatus: 'Paid',
        bookingStatus: 'Approved',
        transactionId: 'txn_admin_approved_002',
        deliveryAddress: 'Savar EPZ Area, Dhaka',
        contactNumber: '+880 1611-889900',
        notes: 'Approved reservation ready for physical dispatch.',
        createdAt: new Date(Date.now() - 18 * 3600000)
      },
      // 8. Admin: Active
      {
        customerInfo: {
          id: new ObjectId(),
          name: 'Asaduzzaman',
          email: 'asad.logistics@gmail.com',
          phone: '+880 1722-445566'
        },
        equipmentId: adminEquip._id,
        equipmentName: adminEquip.name,
        equipmentImage: adminEquip.image,
        equipmentCategory: adminEquip.category,
        ownerId: adminUser._id,
        ownerName: adminUser.name,
        ownerEmail: adminUser.email,
        rentalStartDate: new Date(Date.now() - 1 * 86400000),
        rentalEndDate: new Date(Date.now() + 3 * 86400000),
        bookingDate: new Date(Date.now() - 3 * 86400000),
        quantity: 1,
        totalAmount: 1400,
        paymentStatus: 'Paid',
        bookingStatus: 'Active',
        transactionId: 'txn_admin_active_003',
        deliveryAddress: 'Purbachal Sector 4, Dhaka',
        contactNumber: '+880 1722-445566',
        notes: 'Currently in active lease on highway development project.',
        createdAt: new Date(Date.now() - 3 * 86400000)
      },
      // 9. Admin: Completed
      {
        customerInfo: {
          id: new ObjectId(),
          name: 'Belal Uddin',
          email: 'belal.builders@gmail.com',
          phone: '+880 1833-556677'
        },
        equipmentId: adminEquip._id,
        equipmentName: adminEquip.name,
        equipmentImage: adminEquip.image,
        equipmentCategory: adminEquip.category,
        ownerId: adminUser._id,
        ownerName: adminUser.name,
        ownerEmail: adminUser.email,
        rentalStartDate: new Date(Date.now() - 8 * 86400000),
        rentalEndDate: new Date(Date.now() - 3 * 86400000),
        bookingDate: new Date(Date.now() - 9 * 86400000),
        quantity: 1,
        totalAmount: 1750,
        paymentStatus: 'Paid',
        bookingStatus: 'Completed',
        transactionId: 'txn_admin_completed_004',
        deliveryAddress: 'Tejgaon Industrial Area, Dhaka',
        contactNumber: '+880 1833-556677',
        notes: '5-day commercial lease completed. Machine inspected & cleared.',
        createdAt: new Date(Date.now() - 9 * 86400000)
      },
      // 10. Admin: Cancelled (Refund Processing)
      {
        customerInfo: {
          id: new ObjectId(),
          name: 'ali',
          email: 'ali@gmail.com',
          phone: '+880 1700-000000'
        },
        equipmentId: adminEquip._id,
        equipmentName: adminEquip.name,
        equipmentImage: adminEquip.image,
        equipmentCategory: adminEquip.category,
        ownerId: adminUser._id,
        ownerName: adminUser.name,
        ownerEmail: adminUser.email,
        rentalStartDate: new Date(Date.now() - 1 * 86400000),
        rentalEndDate: new Date(Date.now() + 1 * 86400000),
        bookingDate: new Date(Date.now() - 2 * 86400000),
        quantity: 1,
        totalAmount: 700,
        paymentStatus: 'Refund Processing',
        bookingStatus: 'Cancelled',
        transactionId: 'txn_admin_cancelled_005',
        deliveryAddress: 'Bashundhara R/A, Block C, Dhaka',
        contactNumber: '+880 1700-000000',
        notes: 'Customer cancelled before lease activation.',
        refundDetails: {
          initiatedAt: new Date(Date.now() - 1 * 86400000),
          amount: 700,
          reason: 'Customer initiated reservation cancellation',
          refundTxnId: 'ref_admin_excavator_005'
        },
        createdAt: new Date(Date.now() - 2 * 86400000)
      }
    ];

    for (const b of bookingsToSeed) {
      const existing = await bookingsCollection.findOne({ transactionId: b.transactionId });
      let bId;
      if (!existing) {
        const res = await bookingsCollection.insertOne(b);
        bId = res.insertedId;
      } else {
        bId = existing._id;
        await bookingsCollection.updateOne({ _id: bId }, { $set: b });
      }
      await paymentsCollection.updateOne(
        { transactionId: b.transactionId },
        {
          $set: {
            bookingId: bId,
            transactionId: b.transactionId,
            amount: b.totalAmount,
            customerEmail: b.customerInfo.email,
            paymentDate: b.bookingDate,
            paymentMethod: 'Stripe',
            status: b.bookingStatus === 'Cancelled' ? 'Refund Processing' : 'Completed'
          }
        },
        { upsert: true }
      );
    }

    // 4. Seed Reviews (for home page Customer Reviews section)
    console.log('Seeding reviews...');
    const reviewsToSeed = [
      {
        equipmentId: cameraItem._id,
        equipmentName: cameraItem.name,
        equipmentImage: cameraItem.image,
        customerId: customerUser._id,
        customerName: 'Sadia Rahman',
        customerEmail: customerUser.email,
        customerPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        rating: 5,
        comment: 'Rented the Sony A7 IV kit for a 3-day commercial shoot. Equipment was in brand new condition, clean lenses, and battery backups were fantastic!',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 2 * 86400000)
      },
      {
        equipmentId: soundItem._id,
        equipmentName: soundItem.name,
        equipmentImage: soundItem.image,
        customerId: customerUser._id,
        customerName: 'Tanvir Ahmed',
        customerEmail: 'tanvir.event@gmail.com',
        customerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        rating: 5,
        comment: 'The JBL sound setup was super punchy and clear for our annual corporate meetup. Quick delivery and pickup service by the owner!',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 4 * 86400000)
      },
      {
        equipmentId: excavatorItem._id,
        equipmentName: excavatorItem.name,
        equipmentImage: excavatorItem.image,
        customerId: customerUser._id,
        customerName: 'Kamal Hossain',
        customerEmail: 'kamal.constructions@yahoo.com',
        customerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        rating: 5,
        comment: 'High performance CAT 320 excavator. It saved us nearly a week on basement excavation. Smooth deal and transparent paperwork.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 5 * 86400000)
      },
      {
        equipmentId: cameraItem._id,
        equipmentName: cameraItem.name,
        equipmentImage: cameraItem.image,
        customerId: customerUser._id,
        customerName: 'Farhana Kabir',
        customerEmail: 'farhana.photography@gmail.com',
        customerPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        rating: 5,
        comment: 'EquipHub made renting reliable gear effortless. Stripe checkout was seamless, and the owner was very polite and helpful.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 7 * 86400000)
      },
      {
        equipmentName: 'Canon EOS R5 C 8K Cinema Camera',
        customerName: 'Sadia Rahman',
        customerEmail: 'sadia.rahman@gmail.com',
        customerPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        rating: 5,
        comment: 'Unbelievable 8K RAW video clarity and the active cooling fan was a lifesaver during our full-day outdoor shoot in Banani. Complete cinema beast!',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 3 * 86400000)
      },
      {
        equipmentName: 'Canon EOS R5 C 8K Cinema Camera',
        customerName: 'Tanvir Ahmed',
        customerEmail: 'tanvir.event@gmail.com',
        customerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        rating: 5,
        comment: 'Superb hybrid camera. Auto-focus is lightning fast and switching between photo and cinema OS is seamless. Everything came safely packed.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 1 * 86400000)
      },
      {
        equipmentName: 'DJI Inspire 3 8K Cinema Drone',
        customerName: 'Farhana Kabir',
        customerEmail: 'farhana.photography@gmail.com',
        customerPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
        rating: 5,
        comment: 'The full-frame 8K ProRes footage is cinema grade. RTK positioning provided rock-solid stability even in windy rooftop conditions.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 2 * 86400000)
      },
      {
        equipmentName: 'DJI Inspire 3 8K Cinema Drone',
        customerName: 'Kamal Hossain',
        customerEmail: 'kamal.constructions@yahoo.com',
        customerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        rating: 5,
        comment: 'Top tier aerial platform. Dual control mode worked flawlessly for our commercial shoot in Gulshan.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 4 * 86400000)
      },
      {
        equipmentName: 'John Deere 5075E 4WD Utility Tractor',
        customerName: 'Rafiqul Islam',
        customerEmail: 'rafiqul.agri@gmail.com',
        customerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        rating: 5,
        comment: 'Heavy duty performance with excellent diesel efficiency. Handled 10 acres of field plowing effortlessly.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 5 * 86400000)
      },
      {
        equipmentName: 'Concrete Mixer Truck 500L',
        customerName: 'Belal Uddin',
        customerEmail: 'belal.builders@gmail.com',
        customerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        rating: 5,
        comment: 'Solid drum mixer, easy hydraulic tilt and very reliable engine. Delivered on time.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 6 * 86400000)
      },
      {
        equipmentName: 'Heavy Duty Rotary Power Tiller',
        customerName: 'Mokbul Hossain',
        customerEmail: 'mokbul.farms@yahoo.com',
        customerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        rating: 4,
        comment: 'Powerful rotary blades, cultivated the soil to fine depth. Good fuel economy and easy operation.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 4 * 86400000)
      },
      {
        equipmentName: 'Isuzu NPR 4-Ton Cargo Box Truck',
        customerName: 'Asaduzzaman',
        customerEmail: 'asad.logistics@gmail.com',
        customerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        rating: 5,
        comment: 'Clean cargo bed and hydraulic lift worked smoothly. Great for moving heavy event equipment across Dhaka.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 3 * 86400000)
      },
      {
        equipmentName: 'Honda EU3000i Super Quiet Inverter Generator',
        customerName: 'Shamim Reza',
        customerEmail: 'shamim.sound@gmail.com',
        customerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        rating: 5,
        comment: 'Extremely quiet as advertised. Provided clean, steady power for our audio recording consoles without a glitch.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 2 * 86400000)
      },
      {
        equipmentName: 'CAT 320 Hydraulic Excavator',
        customerName: 'Belal Uddin',
        customerEmail: 'belal.builders@gmail.com',
        customerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        rating: 5,
        comment: 'Excavator hydraulic controls were buttery smooth and fuel consumption was surprisingly economical.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 3 * 86400000)
      },
      {
        equipmentName: 'Concrete Mixer Truck 500L',
        customerName: 'Rafiqul Islam',
        customerEmail: 'rafiqul.agri@gmail.com',
        customerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        rating: 5,
        comment: 'Mixed 8 batches of foundation concrete without a single stall. Excellent maintenance.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 2 * 86400000)
      },
      {
        equipmentName: 'John Deere 5075E 4WD Utility Tractor',
        customerName: 'Mokbul Hossain',
        customerEmail: 'mokbul.farms@yahoo.com',
        customerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        rating: 5,
        comment: 'Strong 4WD traction in muddy soil. 3-point hitch made attaching our cultivator effortless.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 3 * 86400000)
      },
      {
        equipmentName: 'Heavy Duty Rotary Power Tiller',
        customerName: 'Rafiqul Islam',
        customerEmail: 'rafiqul.agri@gmail.com',
        customerPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        rating: 5,
        comment: 'Starts on the first pull and tilled our vegetable plots in record time. Very satisfied.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 2 * 86400000)
      },
      {
        equipmentName: 'Isuzu NPR 4-Ton Cargo Box Truck',
        customerName: 'Tanvir Ahmed',
        customerEmail: 'tanvir.event@gmail.com',
        customerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        rating: 5,
        comment: 'Spacious 4-ton capacity and very smooth highway drive. Owner was punctual with key handover.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 2 * 86400000)
      },
      {
        equipmentName: 'Honda EU3000i Super Quiet Inverter Generator',
        customerName: 'Sadia Rahman',
        customerEmail: 'customer@equiphub.com',
        customerPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        rating: 5,
        comment: 'Ran non-stop for 10 hours on our outdoor fashion film set. Low fuel consumption and zero noise interference.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 1 * 86400000)
      },
      {
        equipmentName: 'JBL PRX ONE All-In-One Line Array PA System',
        customerName: 'Shamim Reza',
        customerEmail: 'shamim.sound@gmail.com',
        customerPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        rating: 5,
        comment: '7-channel mixer with built-in DSP made live acoustic tuning quick and hassle-free. Crisp highs and deep bass.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 3 * 86400000)
      },
      {
        equipmentName: 'DJI Inspire 3 8K Cinema Drone',
        customerName: 'Kamal Hossain',
        customerEmail: 'kamal.constructions@yahoo.com',
        customerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        rating: 5,
        comment: 'Top tier aerial platform. Dual control mode worked flawlessly for our commercial shoot in Gulshan.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 4 * 86400000)
      },
      {
        equipmentName: 'Admin Caterpillar Excavator',
        customerName: 'ali',
        customerEmail: 'ali@gmail.com',
        customerPhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400',
        rating: 5,
        comment: 'Heavy duty excavator operated perfectly for our site grading work. Quick support from the admin.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 5 * 86400000)
      },
      {
        equipmentName: 'Admin Caterpillar Excavator',
        customerName: 'Kamal Hossain',
        customerEmail: 'kamal.constructions@yahoo.com',
        customerPhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
        rating: 5,
        comment: 'Super clean machine and powerful hydraulics. Fast approval from admin and on-site delivery was spot on.',
        status: 'Approved',
        isActive: true,
        createdAt: new Date(Date.now() - 2 * 86400000)
      }
    ];

    for (const r of reviewsToSeed) {
      if (!r.equipmentId) {
        const matchingEquip = await equipmentCollection.findOne({ name: r.equipmentName });
        if (matchingEquip) {
          r.equipmentId = matchingEquip._id;
          r.equipmentImage = matchingEquip.image || (matchingEquip.images && matchingEquip.images[0]) || '';
          r.customerId = customerUser._id;
        }
      }
      await reviewsCollection.updateOne(
        { customerName: r.customerName, equipmentName: r.equipmentName },
        { $set: r },
        { upsert: true }
      );
    }

    // Synchronize review counts and average ratings across all equipment
    const allSeededEquips = await equipmentCollection.find({}).toArray();
    for (const eq of allSeededEquips) {
      const stats = await reviewsCollection.aggregate([
        {
          $match: {
            equipmentId: eq._id,
            status: 'Approved',
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ]).toArray();

      const avg = stats[0] ? Math.round(stats[0].avgRating * 10) / 10 : 0;
      const count = stats[0] ? stats[0].totalReviews : 0;

      await equipmentCollection.updateOne(
        { _id: eq._id },
        { $set: { averageRating: avg, rating: avg, reviewCount: count, totalReviews: count } }
      );
    }

    console.log('\n=============================================');
    console.log('✅ DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log('=============================================');
    console.log('Credentials for submission & testing:');
    console.log('👑 Admin:    admin@equiphub.com    | Password123');
    console.log('🚜 Owner:    owner@equiphub.com    | Password123');
    console.log('👤 Customer: customer@equiphub.com | Password123');
    console.log('=============================================\n');

  } catch (error) {
    console.error('Seeding error:', error.message);
  } finally {
    await client.close();
    process.exit(0);
  }
};

seedData();
