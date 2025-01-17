const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 }, // 5MB per file, max 5 files
});

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose
  .connect('mongodb://127.0.0.1:27017/monaco_cabs', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';

// Models
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const BookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickupLocation: { type: String, required: true },
  dropoffLocation: { type: String, required: true },
  fare: { type: Number, required: true },
  userCoords: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  status: { type: String, default: 'Pending' },
  timestamp: { type: Date, default: Date.now },
});

const DriverSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  contactNumber: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  vehicleInfo: { type: String, required: true, trim: true },
  documents: [{ type: String }],
  isApproved: { type: Boolean, default: false },
  driverCode: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);
const Booking = mongoose.model('Booking', BookingSchema);
const Driver = mongoose.model('Driver', DriverSchema);

// Middleware to Verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Routes

// Test Route
app.get('/', (req, res) => {
  res.send('Bangalore Cabs Backend Running');
});

// User Registration
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error.message);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// User Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Driver Registration
app.post('/driver/register', upload.array('documents', 5), async (req, res) => {
  const { name, email, password, contactNumber, address, vehicleInfo } = req.body;

  if (!name || !email || !password || !contactNumber || !address || !vehicleInfo) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'Please upload required documents.' });
  }

  try {
    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      req.files.forEach((file) => fs.unlinkSync(file.path));
      return res.status(400).json({ message: 'Driver with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const documentPaths = req.files.map((file) => `/uploads/${file.filename}`);

    const newDriver = new Driver({
      name,
      email,
      password: hashedPassword,
      contactNumber,
      address,
      vehicleInfo,
      documents: documentPaths,
    });

    await newDriver.save();
    res.status(201).json({ message: 'Driver registered successfully. Await admin approval.' });
  } catch (error) {
    req.files.forEach((file) => fs.unlinkSync(file.path));
    console.error('Error registering driver:', error.message);
    res.status(500).json({ message: 'Error registering driver.', error: error.message });
  }
});

// Get All Drivers
app.get('/drivers', async (req, res) => {
  try {
    const drivers = await Driver.find();
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching drivers:', error.message);
    res.status(500).json({ message: 'Error fetching drivers.', error: error.message });
  }
});

// Approve Driver
app.post('/driver/approve/:id', async (req, res) => {
  const { id } = req.params;
  const { driverCode } = req.body;

  try {
    const driver = await Driver.findById(id);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found.' });
    }

    driver.isApproved = true;
    driver.driverCode = driverCode;
    await driver.save();

    res.json({ message: 'Driver approved successfully.' });
  } catch (error) {
    console.error('Error approving driver:', error.message);
    res.status(500).json({ message: 'Error approving driver.', error: error.message });
  }
});

// Validate Location
app.post('/validate-location', (req, res) => {
  const { userCoords } = req.body;

  if (!userCoords || typeof userCoords.latitude !== 'number' || typeof userCoords.longitude !== 'number') {
    return res.status(400).json({ isValid: false, message: 'Invalid coordinates provided.' });
  }

  const isValid = isWithinBangalore(userCoords);
  res.json({ isValid, message: isValid ? 'Location is within Bangalore.' : 'Pickup location is not within Bangalore.' });
});

// Create Booking
app.post('/book', authenticateToken, async (req, res) => {
  const { pickupLocation, dropoffLocation, userCoords } = req.body;

  if (!pickupLocation || !dropoffLocation || !userCoords) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const fare = calculateFare(pickupLocation, dropoffLocation, userCoords);

    const newBooking = new Booking({
      userId: req.user.id,
      pickupLocation,
      dropoffLocation,
      fare,
      userCoords,
    });

    await newBooking.save();
    res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
  } catch (error) {
    console.error('Error creating booking:', error.message);
    res.status(500).json({ message: 'Error creating booking.', error: error.message });
  }
});

// Get User Bookings
app.get('/bookings', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id }).sort({ timestamp: -1 });
    res.json({ message: 'User bookings retrieved successfully.', bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error.message);
    res.status(500).json({ message: 'Error fetching bookings.', error: error.message });
  }
});

// Helper Functions
const isWithinBangalore = (coords) => {
  const BANGALORE_BOUNDS = {
    minLat: 12.876,
    maxLat: 13.035,
    minLng: 77.515,
    maxLng: 77.685,
  };

  return (
    coords.latitude >= BANGALORE_BOUNDS.minLat &&
    coords.latitude <= BANGALORE_BOUNDS.maxLat &&
    coords.longitude >= BANGALORE_BOUNDS.minLng &&
    coords.longitude <= BANGALORE_BOUNDS.maxLng
  );
};

const calculateFare = (pickupLocation, dropoffLocation, userCoords) => {
  const distance = calculateDistance(pickupLocation, dropoffLocation);
  const isInBangalore = isWithinBangalore(userCoords);

  let fare;
  if (isInBangalore) {
    fare = 18 + Math.ceil(distance / 2) * 0.5;
  } else {
    if (distance <= 6) {
      fare = 25 + distance;
    } else {
      fare = 25 + 6 + Math.ceil((distance - 6) / 2) * 1;
    }
  }

  return fare;
};

const calculateDistance = (pickupLocation, dropoffLocation) => {
  // Dummy calculation for now
  return 10; // Example distance in km
};

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
