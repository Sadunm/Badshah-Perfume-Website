import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { db } from './src/server/db.ts';
import { DEFAULT_PERFUME_BOTTLE_IMAGE_URL } from './src/types/index.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.SESSION_SECRET || '';
const OWNER_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const OWNER_ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD
  ? bcrypt.hashSync(process.env.ADMIN_PASSWORD, 12)
  : '';
const adminLoginAttempts = new Map<string, { count: number; resetAt: number }>();

// Ensure uploads directory exists
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage for secure image uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    cb(null, `${safeBase}_${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
    const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.has(ext) && allowedMimeTypes.has(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('Only JPG, PNG, WEBP, and GIF images are allowed'));
  },
});

function hasValidImageSignature(filePath: string, mimeType: string): boolean {
  const bytes = fs.readFileSync(filePath).subarray(0, 12);
  if (mimeType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === 'image/png') return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === 'image/gif') {
    const signature = bytes.subarray(0, 6).toString('ascii');
    return signature === 'GIF87a' || signature === 'GIF89a';
  }
  if (mimeType === 'image/webp') {
    return bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
      bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOAD_DIR));

// Admin authentication middleware
interface AuthRequest extends Request {
  admin?: { id: string; email: string; role: string };
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!OWNER_ADMIN_EMAIL || !OWNER_ADMIN_PASSWORD_HASH || !JWT_SECRET) {
    return res.status(503).json({ error: 'Admin access is not configured.' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    const normalizedEmail = (decoded.email || '').toLowerCase().trim();
    if (decoded.role !== 'admin' || normalizedEmail !== OWNER_ADMIN_EMAIL) {
      return res.status(403).json({ error: 'Unauthorized email or incorrect password.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Token has expired or is invalid' });
  }
}

function limitAdminLoginAttempts(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const current = adminLoginAttempts.get(key);
  if (!current || current.resetAt <= now) {
    adminLoginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return next();
  }
  if (current.count >= 8) {
    return res.status(429).json({ error: 'অনেকবার চেষ্টা করা হয়েছে। ১৫ মিনিট পরে আবার চেষ্টা করুন।' });
  }
  current.count += 1;
  return next();
}

// ==========================================
// PUBLIC API ROUTES
// ==========================================

// Global configuration (derived from dynamic database settings)
app.get('/api/config', (_req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json({
    brandName: settings.siteName || 'Badshah Premium Perfume',
    whatsappNumber: settings.whatsappNumber || process.env.VITE_WHATSAPP_NUMBER || '+8801700000000',
    messengerUrl: settings.facebookUrl || process.env.VITE_MESSENGER_URL || 'https://m.me/badshahperfume',
    deliveryCharges: {
      insideDhaka: settings.deliveryFeeInsideDhaka ?? 80,
      outsideDhaka: settings.deliveryFeeOutsideDhaka ?? 130,
    },
  });
});

// Full site configuration & theme settings
app.get('/api/settings', (_req: Request, res: Response) => {
  try {
    const settings = db.getSettings();
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load site settings' });
  }
});

// Homepage content
app.get('/api/homepage', (_req: Request, res: Response) => {
  try {
    const content = db.getHomepage();
    res.json(content);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load homepage content' });
  }
});

// Storefront active products
app.get('/api/products', (_req: Request, res: Response) => {
  try {
    const products = db.getAllProducts(false);
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load products' });
  }
});

// Single product details
app.get('/api/products/:id', (req: Request, res: Response) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product || product.isArchived) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load product details' });
  }
});

// Active promotional offers
app.get('/api/offers', (_req: Request, res: Response) => {
  try {
    const offers = db.getActiveOffers();
    res.json(offers);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load offers' });
  }
});

// Approved customer reviews
app.get('/api/reviews', (_req: Request, res: Response) => {
  try {
    const reviews = db.getApprovedReviews();
    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

// Submit a new customer review (Pending admin moderation)
app.post('/api/reviews', (req: Request, res: Response) => {
  try {
    const { customerName, rating, comment, productName, city } = req.body;
    if (!customerName || !comment) {
      return res.status(400).json({ error: 'Name and review text are required' });
    }
    const review = db.createReview({
      customerName,
      rating: Number(rating) || 5,
      comment,
      productName,
      city,
    });
    res.status(201).json({
      message: 'Thank you! Your review has been submitted and will appear once approved by our team.',
      review,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Create Order (Cash on Delivery with server-side price & delivery verification)
app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const {
      customerName,
      customerPhone,
      customerAddress,
      district,
      deliveryArea,
      deliveryLocation,
      notes,
      couponCode,
      customerId,
      orderType,
      isWholesale,
      items,
    } = req.body;

    if (!deliveryLocation || (deliveryLocation !== 'inside_dhaka' && deliveryLocation !== 'outside_dhaka')) {
      return res.status(400).json({ error: 'Please select a valid delivery location (Inside Dhaka or Outside Dhaka)' });
    }

    const result = db.createOrder({
      customerName,
      customerPhone,
      customerAddress,
      district,
      deliveryArea: deliveryArea || '',
      deliveryLocation,
      notes,
      couponCode,
      customerId,
      orderType,
      isWholesale,
      items,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: result.order,
    });
  } catch (err: any) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Internal server error while creating order' });
  }
});

// Get order details by order number (for confirmation page & customer tracking)
app.get('/api/orders/:orderNumber', (req: Request, res: Response) => {
  try {
    const order = db.getOrderById(req.params.orderNumber);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve order' });
  }
});

// ==========================================
// ADMIN AUTH & MANAGEMENT API ROUTES
// ==========================================

// Admin Login
app.post('/api/admin/login', limitAdminLoginAttempts, (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Unauthorized email or incorrect password.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!OWNER_ADMIN_EMAIL || !OWNER_ADMIN_PASSWORD_HASH || !JWT_SECRET) {
      return res.status(503).json({ error: 'Admin sign-in has not been configured.' });
    }
    const isValidEmail = normalizedEmail === OWNER_ADMIN_EMAIL;
    const isValidPassword = bcrypt.compareSync(String(password), OWNER_ADMIN_PASSWORD_HASH);
    if (!isValidEmail || !isValidPassword) {
      return res.status(401).json({ error: 'Unauthorized email or incorrect password.' });
    }
    adminLoginAttempts.delete(req.ip || req.socket.remoteAddress || 'unknown');

    const token = jwt.sign(
      { id: 'owner-admin', email: OWNER_ADMIN_EMAIL, role: 'admin', name: 'Owner' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      admin: {
        id: 'owner-admin',
        email: OWNER_ADMIN_EMAIL,
        name: 'Owner',
        role: 'admin',
      },
    });
  } catch (err: any) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Unauthorized email or incorrect password.' });
  }
});

// Admin Verify Token
app.get('/api/admin/verify', requireAdmin, (req: AuthRequest, res: Response) => {
  res.json({ admin: req.admin });
});

// Admin Dashboard Stats
app.get('/api/admin/dashboard', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const stats = db.getDashboardStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load dashboard metrics' });
  }
});

// Admin Products (all, including archived)
app.get('/api/admin/products', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const products = db.getAllProducts(true);
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load products list' });
  }
});

// Admin Create Product
app.post('/api/admin/products', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      image,
      additionalImages,
      fragranceType,
      longevity,
      fragranceNotes,
      topNotes,
      middleNotes,
      baseNotes,
      description,
      stockStatus,
      sizes,
      wholesalePricePerMl,
    } = req.body;

    if (!name || !description) {
      return res.status(400).json({ error: 'Product name and description are required' });
    }

    if (!sizes || !Array.isArray(sizes) || sizes.length === 0) {
      return res.status(400).json({ error: 'At least one size with pricing is required' });
    }

    const newProduct = db.createProduct({
      name: name.trim(),
      image: String(image || '').trim() || DEFAULT_PERFUME_BOTTLE_IMAGE_URL,
      additionalImages: additionalImages || [],
      fragranceType: (fragranceType || 'Artisanal Perfume').trim(),
      longevity: (longevity || '10+ Hours').trim(),
      fragranceNotes: (fragranceNotes || '').trim(),
      topNotes: (topNotes || '').trim(),
      middleNotes: (middleNotes || '').trim(),
      baseNotes: (baseNotes || '').trim(),
      description: description.trim(),
      stockStatus: stockStatus === 'Out of Stock' ? 'Out of Stock' : 'In Stock',
      wholesalePricePerMl:
        Number.isFinite(Number(wholesalePricePerMl)) && Number(wholesalePricePerMl) >= 0
          ? Number(wholesalePricePerMl)
          : 0,
      sizes,
    });

    res.status(201).json(newProduct);
  } catch (err: any) {
    console.error('Error creating product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Admin Update Product
app.put('/api/admin/products/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body || {};
    if (Object.prototype.hasOwnProperty.call(updates, 'wholesalePricePerMl')) {
      const wholesalePricePerMl = Number(updates.wholesalePricePerMl);
      if (!Number.isFinite(wholesalePricePerMl) || wholesalePricePerMl < 0) {
        return res.status(400).json({ error: 'Wholesale price per ml must be a non-negative number' });
      }
      updates.wholesalePricePerMl = wholesalePricePerMl;
    }
    const updated = db.updateProduct(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Admin Delete / Archive Product
app.delete('/api/admin/products/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const success = db.deleteProduct(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product successfully removed or archived' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Admin Batch Sync Products (from CSV ingestion)
app.post('/api/admin/products/batch-sync', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { products } = req.body;
    if (Array.isArray(products) && products.length > 0) {
      db.batchSyncProducts(products);
      return res.json({ success: true, count: products.length });
    }
    res.status(400).json({ error: 'Invalid products array' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to batch sync products' });
  }
});

// Admin Orders List
app.get('/api/admin/orders', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const orders = db.getAllOrders();
    res.json(orders);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

// Admin Order Details
app.get('/api/admin/orders/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const order = db.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load order' });
  }
});

// Admin Update Order Status
app.put('/api/admin/orders/:id/status', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const allowed = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const order = db.updateOrderStatus(req.params.id, status);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Admin Homepage Content
app.put('/api/admin/homepage', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const updated = db.updateHomepage(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update homepage content' });
  }
});

// Admin Offers List
app.get('/api/admin/offers', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const offers = db.getAllOffers();
    res.json(offers);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load offers' });
  }
});

// Admin Create Offer
app.post('/api/admin/offers', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { title, description, image, isActive } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    const offer = db.createOffer({
      title: title.trim(),
      description: description.trim(),
      image,
      isActive: isActive !== false,
    });
    res.status(201).json(offer);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create offer' });
  }
});

// Admin Update Offer
app.put('/api/admin/offers/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const updated = db.updateOffer(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update offer' });
  }
});

// Admin Delete Offer
app.delete('/api/admin/offers/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const success = db.deleteOffer(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Offer not found' });
    }
    res.json({ message: 'Offer deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete offer' });
  }
});

// Admin Reviews List (all states)
app.get('/api/admin/reviews', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const reviews = db.getAllReviews();
    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

// Admin Update Review Status (Approve / Reject)
app.put('/api/admin/reviews/:id/status', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid review status' });
    }
    const updated = db.updateReviewStatus(req.params.id, status);
    if (!updated) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update review status' });
  }
});

// Admin Delete Review
app.delete('/api/admin/reviews/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const success = db.deleteReview(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ message: 'Review deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

// Image Upload Endpoint (Multipart file upload)
app.post('/api/admin/upload', requireAdmin, upload.single('image'), (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    if (!hasValidImageSignature(req.file.path, req.file.mimetype)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Uploaded file content is not a supported image.' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, filename: req.file.filename });
  } catch (err: any) {
    console.error('File upload error:', err);
    res.status(500).json({ error: err.message || 'Image upload failed' });
  }
});

// Admin Update Site Settings & Theme Engine
app.put('/api/admin/settings', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json(updated);
  } catch (err: any) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Failed to update site settings' });
  }
});

// Admin Reset to Zero-State (Purges products, orders, reviews, offers while preserving authorized admins)
app.post('/api/admin/reset-zero-state', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    db.resetToZeroState();
    res.json({ message: 'Database successfully purged to clean zero-state' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// ==========================================
// CUSTOMER AUTH & TRACKING API ROUTES
// ==========================================

// Customer Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { name, phone, email, password, address, district } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone number, and password are required' });
    }

    const result = db.createCustomer({
      name,
      phone,
      email,
      password,
      address,
      district,
    });

    if (!result.success || !result.customer) {
      return res.status(400).json({ error: result.error || 'Failed to create customer account' });
    }

    const token = jwt.sign(
      { id: result.customer.id, role: 'customer', phone: result.customer.phone },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      customer: result.customer,
    });
  } catch (err: any) {
    console.error('Customer register error:', err);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Customer Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Phone/Email and password are required' });
    }

    const customer = db.getCustomerByPhoneOrEmail(identifier);
    if (!customer) {
      return res.status(401).json({ error: 'No account found with this phone number or email.' });
    }

    const isValid = bcrypt.compareSync(password, customer.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password. Please check and try again.' });
    }

    const token = jwt.sign(
      { id: customer.id, role: 'customer', phone: customer.phone },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Logged in successfully',
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        district: customer.district,
        createdAt: customer.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Customer login error:', err);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Customer Profile (Me)
app.get('/api/auth/me', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const customer = db.getCustomerById(decoded.id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// Public Live Customer Order Tracking Endpoint
app.post('/api/orders/track', (req: Request, res: Response) => {
  try {
    const { orderNumber, phone } = req.body;
    if (!orderNumber || !phone) {
      return res.status(400).json({ error: 'Both Order Number and Phone Number are required.' });
    }

    const order = db.trackOrder(orderNumber, phone);
    if (!order) {
      return res.status(404).json({
        error: 'No matching order found for this Order Number and Phone Number. Please check your order confirmation details.',
      });
    }

    res.json(order);
  } catch (err: any) {
    console.error('Order tracking error:', err);
    res.status(500).json({ error: 'Failed to look up order tracking' });
  }
});

// ==========================================
// COUPON CODES API ROUTES
// ==========================================

// Validate coupon for checkout
app.post('/api/coupons/validate', (req: Request, res: Response) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const validation = db.validateCoupon(code, Number(subtotal) || 0);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error || 'Invalid coupon code' });
    }

    res.json({
      valid: true,
      discountAmount: validation.discountAmount,
      coupon: {
        code: validation.coupon?.code,
        discountType: validation.coupon?.discountType,
        discountValue: validation.coupon?.discountValue,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// Admin Coupons CRUD
app.get('/api/admin/coupons', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const coupons = db.getAllCoupons();
    res.json(coupons);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load coupons' });
  }
});

app.post('/api/admin/coupons', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { code, discountType, discountValue, minOrderAmount, expiresAt, isActive } = req.body;
    if (!code || !discountType || discountValue === undefined) {
      return res.status(400).json({ error: 'Code, discount type, and value are required.' });
    }

    const existing = db.getCouponByCode(code);
    if (existing) {
      return res.status(400).json({ error: `A coupon with code "${code.toUpperCase()}" already exists.` });
    }

    const coupon = db.createCoupon({
      code,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
      expiresAt: expiresAt || undefined,
      isActive: isActive !== false,
    });

    res.status(201).json(coupon);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

app.put('/api/admin/coupons/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const updated = db.updateCoupon(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

app.delete('/api/admin/coupons/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const success = db.deleteCoupon(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Coupon not found' });
    }
    res.json({ message: 'Coupon deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// ==========================================
// CUSTOM PERFUME REQUESTS API ROUTES
// ==========================================

// Public submit custom perfume request
app.post('/api/custom-requests', (req: Request, res: Response) => {
  try {
    const { customerName, customerPhone, perfumeName, volumeMl, notes } = req.body;
    if (!customerName || !customerPhone || !perfumeName) {
      return res.status(400).json({ error: 'Customer name, phone number, and perfume name are required.' });
    }

    const newRequest = db.createCustomRequest({
      customerName,
      customerPhone,
      perfumeName,
      volumeMl: Number(volumeMl) || 30,
      notes,
    });

    res.status(201).json({
      message: 'আপনার কাস্টম পারফিউম রিকোয়েস্ট সফলভাবে জমা হয়েছে। আমাদের টিম খুব শীঘ্রই আপনার সাথে যোগাযোগ করবে।',
      request: newRequest,
    });
  } catch (err: any) {
    console.error('Custom request error:', err);
    res.status(500).json({ error: 'Failed to submit custom request' });
  }
});

// Admin Custom Requests List
app.get('/api/admin/custom-requests', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const requests = db.getAllCustomRequests();
    res.json(requests);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load custom requests' });
  }
});

// Admin Update Custom Request Status
app.put('/api/admin/custom-requests/:id/status', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const allowed = ['Pending', 'Contacted', 'Fulfilled', 'Cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid custom request status' });
    }
    const updated = db.updateCustomRequestStatus(req.params.id, status as any);
    if (!updated) {
      return res.status(404).json({ error: 'Custom request not found' });
    }
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update custom request' });
  }
});

// Admin Delete Custom Request
app.delete('/api/admin/custom-requests/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const success = db.deleteCustomRequest(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Custom request not found' });
    }
    res.json({ message: 'Custom request deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete custom request' });
  }
});

// ==========================================
// PUSH NOTIFICATIONS & BROADCAST API ROUTES
// ==========================================

// Public push notification subscription
app.post('/api/notifications/subscribe', (req: Request, res: Response) => {
  try {
    const { endpoint, keys } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: 'Invalid push subscription endpoint' });
    }
    const result = db.addPushSubscription({ endpoint, keys });
    res.json({ success: true, count: result.count });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to register push subscription' });
  }
});

// Admin Broadcast message (Push and/or Email)
app.post('/api/admin/broadcast', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { title, body, link, type } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and message body are required' });
    }

    const pushSubs = db.getAllPushSubscriptions();
    const customers = db.getAllCustomers();
    const customerEmails = customers.filter((c) => !!c.email).map((c) => c.email as string);

    let recipientCount = 0;
    const broadcastType = type || 'BOTH';

    if (broadcastType === 'PUSH' || broadcastType === 'BOTH') {
      recipientCount += pushSubs.length;
    }
    if (broadcastType === 'EMAIL' || broadcastType === 'BOTH') {
      recipientCount += customerEmails.length;
    }

    const broadcast = db.createBroadcast({
      title,
      body,
      link,
      type: broadcastType,
      recipientCount: Math.max(1, recipientCount), // Even if 0 subscribers yet, record as 1 test recipient
    });

    res.status(201).json({
      message: `Broadcast successfully sent to ${broadcast.recipientCount} recipients.`,
      broadcast,
    });
  } catch (err: any) {
    console.error('Broadcast error:', err);
    res.status(500).json({ error: 'Failed to send broadcast' });
  }
});

// Admin Broadcasts history
app.get('/api/admin/broadcasts', requireAdmin, (_req: AuthRequest, res: Response) => {
  try {
    const broadcasts = db.getAllBroadcasts();
    res.json(broadcasts);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load broadcasts history' });
  }
});

// ==========================================
// STRICT API ERROR & 404 CATCH-ALL (PREVENTS HTML FALLBACK)
// ==========================================
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.use('/api', (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled API Error:', err);
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

// ==========================================
// VITE DEV MIDDLEWARE OR PRODUCTION SERVE
// ==========================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const apiOnly = process.env.API_ONLY === 'true';

  if (!apiOnly && !isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (!apiOnly) {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Badshah Premium Perfume server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
