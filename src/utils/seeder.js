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

    // 3. Seed Sample Bookings & Payments (so analytics show real data)
    console.log('Seeding sample bookings and payments...');
    const bookingsToSeed = [
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
        rentalStartDate: new Date(Date.now() - 5 * 86400000),
        rentalEndDate: new Date(Date.now() - 2 * 86400000),
        bookingDate: new Date(Date.now() - 6 * 86400000),
        quantity: 1,
        totalAmount: 195,
        paymentStatus: 'Paid',
        bookingStatus: 'Completed',
        transactionId: 'txn_stripe_sample_001',
        deliveryAddress: 'Dhanmondi 27, Dhaka',
        contactNumber: customerUser.phone,
        createdAt: new Date(Date.now() - 6 * 86400000)
      },
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
        rentalStartDate: new Date(Date.now() + 1 * 86400000),
        rentalEndDate: new Date(Date.now() + 3 * 86400000),
        bookingDate: new Date(),
        quantity: 2,
        totalAmount: 380,
        paymentStatus: 'Paid',
        bookingStatus: 'Active',
        transactionId: 'txn_stripe_sample_002',
        deliveryAddress: 'Gulshan Club, Dhaka',
        contactNumber: customerUser.phone,
        createdAt: new Date()
      }
    ];

    for (const b of bookingsToSeed) {
      const existing = await bookingsCollection.findOne({ transactionId: b.transactionId });
      if (!existing) {
        const res = await bookingsCollection.insertOne(b);
        await paymentsCollection.insertOne({
          bookingId: res.insertedId,
          transactionId: b.transactionId,
          amount: b.totalAmount,
          customerEmail: b.customerInfo.email,
          paymentDate: b.bookingDate,
          paymentMethod: 'Stripe',
          status: 'Completed'
        });
      }
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
      }
    ];

    for (const r of reviewsToSeed) {
      await reviewsCollection.updateOne(
        { customerName: r.customerName, equipmentName: r.equipmentName },
        { $set: r },
        { upsert: true }
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
