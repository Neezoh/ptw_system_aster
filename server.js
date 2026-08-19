require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;
const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
const isProd = process.env.NODE_ENV === 'production';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ptw_system',
  waitForConnections: true,
  connectionLimit: 3,
  queueLimit: 0,
  multipleStatements: false,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
  charset: 'utf8mb4'
});

const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'change-me';
let dbAvailable = false;

const fallbackLocations = [
  'PCFS SAMUR - Area A',
  'PCFS SAMUR - Area B',
  'PCFS SAMUR - Area C',
  'ADMIN BUILDING',
  'SWITCH GEAR'
];

const fallbackPersonnel = [
  { name: 'Tayan', role: 'WL' },
  { name: 'Zulkifli', role: 'WL' },
  { name: 'Chu', role: 'WL' },
  { name: 'TAHA', role: 'AA' },
  { name: 'Ahmad Razali', role: 'AA' },
  { name: 'Kamal', role: 'AAR' },
  { name: 'Sinta', role: 'AAR' },
  { name: 'SINTAN', role: 'AAR' },
  { name: 'Eryan Fadlin', role: 'Applicant' },
  { name: 'Siti Amirah', role: 'Applicant' },
  { name: 'Mohd Hafiz', role: 'Applicant' },
  { name: 'Lee Nan Wee', role: 'Applicant' },
  { name: 'Nasuha', role: 'Applicant' }
];

const makeDemoRecords = () => {
  return [
    {
      id: 1,
      ptw_number: 'PTW-2026-001',
      jha_number: 'JHA-2026-0101',
      location: 'PCFS SAMUR - Area A',
      permit_applicant_name: 'Eryan Fadlin',
      permit_type: 'Hot',
      work_description: 'Welding & Cutting Noise Barrier Beam',
      work_leader: 'Tayan',
      authorised_authority: 'Ahmad Razali',
      authorised_authority_rep: 'Kamal',
      date_issued: '2026-08-01',
      date_closed: '2026-08-05',
      status: 'Closed',
      remark: 'Closed after completion of cutting and welding works.',
      created_at: '2026-08-01T00:00:00.000Z',
      updated_at: '2026-08-05T00:00:00.000Z'
    },
    {
      id: 2,
      ptw_number: 'PTW-2026-002',
      jha_number: 'JHA-2026-0102',
      location: 'PCFS SAMUR - Area B',
      permit_applicant_name: 'Siti Amirah',
      permit_type: 'Cold',
      work_description: 'Installation of Shear Wood Panels',
      work_leader: 'Tayan',
      authorised_authority: 'Ahmad Razali',
      authorised_authority_rep: 'Kamal',
      date_issued: '2026-08-02',
      date_closed: null,
      status: 'Open',
      remark: 'Cold work permit active for installation activity.',
      created_at: '2026-08-02T00:00:00.000Z',
      updated_at: '2026-08-02T00:00:00.000Z'
    },
    {
      id: 3,
      ptw_number: 'PTW-2026-003',
      jha_number: 'JHA-2026-0103',
      location: 'PCFS SAMUR - Area A',
      permit_applicant_name: 'Mohd Hafiz',
      permit_type: 'Hot',
      work_description: 'Grinding Works on Support Structure',
      work_leader: 'Zulkifli',
      authorised_authority: 'Ahmad Razali',
      authorised_authority_rep: 'Kamal',
      date_issued: '2026-08-03',
      date_closed: null,
      status: 'Suspended',
      remark: 'Hot work suspended pending safety review.',
      created_at: '2026-08-03T00:00:00.000Z',
      updated_at: '2026-08-03T00:00:00.000Z'
    },
    {
      id: 4,
      ptw_number: 'PTW-2026-004',
      jha_number: 'JHA-2026-0104',
      location: 'PCFS SAMUR - Area C',
      permit_applicant_name: 'Eryan Fadlin',
      permit_type: 'Cold',
      work_description: 'Scaffolding Erection for Barrier',
      work_leader: 'Tayan',
      authorised_authority: 'Ahmad Razali',
      authorised_authority_rep: 'Kamal',
      date_issued: '2026-08-04',
      date_closed: null,
      status: 'Extended',
      remark: 'Permit extended for continued barrier erection works.',
      created_at: '2026-08-04T00:00:00.000Z',
      updated_at: '2026-08-04T00:00:00.000Z'
    },
    {
      id: 5,
      ptw_number: 'PTW-2026-005',
      jha_number: 'JHA-2026-0105',
      location: 'PCFS SAMUR - Area B',
      permit_applicant_name: 'Lee Nan Wee',
      permit_type: 'Cold',
      work_description: 'Touch Up Painting & Inspection',
      work_leader: 'Zulkifli',
      authorised_authority: 'Ahmad Razali',
      authorised_authority_rep: 'Kamal',
      date_issued: '2026-08-05',
      date_closed: '2026-08-10',
      status: 'Closed',
      remark: 'Touch-up painting and inspection completed and signed off.',
      created_at: '2026-08-05T00:00:00.000Z',
      updated_at: '2026-08-10T00:00:00.000Z'
    },
    {
      id: 6,
      ptw_number: 'PTW-2026-006',
      jha_number: 'JHA-2026-0122',
      location: 'ADMIN BUILDING',
      permit_applicant_name: 'Nasuha',
      permit_type: 'Cold',
      work_description: 'Retaining Wall',
      work_leader: 'Chu',
      authorised_authority: 'Kamal',
      authorised_authority_rep: 'Sinta',
      date_issued: '2026-08-15',
      date_closed: '2026-08-17',
      status: 'Open',
      remark: 'Maintenance work ongoing under permit controls.',
      created_at: '2026-08-15T00:00:00.000Z',
      updated_at: '2026-08-17T00:00:00.000Z'
    },
    {
      id: 7,
      ptw_number: 'PTW-2026-007',
      jha_number: 'JHA-2026-0111',
      location: 'SWITCH GEAR',
      permit_applicant_name: 'Eryan Fadlin',
      permit_type: 'Cold',
      work_description: 'MODIFIED',
      work_leader: 'TAHA',
      authorised_authority: 'KAMAL',
      authorised_authority_rep: 'SINTAN',
      date_issued: '2026-08-17',
      date_closed: '2026-08-20',
      status: 'Extended',
      remark: 'Permit extended due to modification work beyond the original scope.',
      created_at: '2026-08-17T00:00:00.000Z',
      updated_at: '2026-08-20T00:00:00.000Z'
    }
  ];
};

const fallbackRecords = makeDemoRecords();
const demoUserHash = bcrypt.hashSync(adminPassword, 10);

const bootstrapAdmin = async () => {
  try {
    const [rows] = await pool.query('SELECT id, password_hash FROM users WHERE username = ? LIMIT 1', [adminUsername]);
    if (!rows.length) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await pool.query('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [adminUsername, hash, 'admin']);
      console.log(`Admin user created: ${adminUsername}`);
    } else if (!(await bcrypt.compare(adminPassword, rows[0].password_hash))) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await pool.query('UPDATE users SET password_hash = ?, role = ? WHERE id = ?', [hash, 'admin', rows[0].id]);
      console.log(`Admin password synchronized: ${adminUsername}`);
    }
    dbAvailable = true;
  } catch (error) {
    console.warn('Database unavailable, using embedded demo PTW dataset for local demo mode.');
    dbAvailable = false;
  }
};

const csrfProtection = csrf({ cookie: true });

const jsonResponse = (res, success, data = null, error = null, meta = {}) => {
  res.status(meta.status || 200).json({ success, data, error, meta });
};

const ensureAdmin = (req, res, next) => {
  if (!req.session || !req.session.user || req.session.user.role !== 'admin') {
    return jsonResponse(res, false, null, 'Admin access required', { status: 401 });
  }
  next();
};

const rateLimitSearch = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Too many requests', meta: { status: 429 } }
});

const rateLimitSuggest = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, data: null, error: 'Too many suggestion requests', meta: { status: 429 } }
});

const filterFallbackRecords = (req) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const status = String(req.query.status || '').trim();
  const location = String(req.query.location || '').trim();
  const type = String(req.query.type || '').trim();
  const from = String(req.query.from || '').trim();
  const to = String(req.query.to || '').trim();
  const workLeader = String(req.query.workLeader || '').trim();
  const authority = String(req.query.authority || '').trim();

  let filtered = [...fallbackRecords];
  if (q) {
    filtered = filtered.filter((record) => {
      const haystack = [record.ptw_number, record.location, record.permit_applicant_name, record.work_description].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }
  if (status) filtered = filtered.filter((record) => record.status === status);
  if (location) filtered = filtered.filter((record) => record.location === location);
  if (type) filtered = filtered.filter((record) => record.permit_type === type);
  if (from) filtered = filtered.filter((record) => record.date_issued >= from);
  if (to) filtered = filtered.filter((record) => record.date_issued <= to);
  if (workLeader) filtered = filtered.filter((record) => record.work_leader === workLeader);
  if (authority) filtered = filtered.filter((record) => record.authorised_authority === authority || record.authorised_authority_rep === authority);

  return filtered;
};

const summaryFallbackData = () => {
  const total = fallbackRecords.length;
  const summary = {
    total_ptw: total,
    open_ptw: fallbackRecords.filter((record) => record.status === 'Open').length,
    closed_ptw: fallbackRecords.filter((record) => record.status === 'Closed').length,
    suspended_ptw: fallbackRecords.filter((record) => record.status === 'Suspended').length,
    extended_ptw: fallbackRecords.filter((record) => record.status === 'Extended').length,
    hot_active: fallbackRecords.filter((record) => record.status === 'Open' && record.permit_type === 'Hot').length,
    cold_active: fallbackRecords.filter((record) => record.status === 'Open' && record.permit_type === 'Cold').length
  };

  return {
    summary,
    byStatus: ['Open', 'Closed', 'Suspended', 'Extended'].map((status) => ({ status, total: fallbackRecords.filter((record) => record.status === status).length })),
    byLocation: [...new Map(fallbackRecords.map((record) => [record.location, 0])).entries()].map(([location]) => ({ location, total: fallbackRecords.filter((record) => record.location === location).length })).sort((a, b) => b.total - a.total).slice(0, 10),
    byType: ['Hot', 'Cold'].map((permitType) => ({ permit_type: permitType, total: fallbackRecords.filter((record) => record.permit_type === permitType).length })),
    monthly: (() => {
      const entries = {};
      fallbackRecords.forEach((record) => {
        const month = record.date_issued.slice(0, 7);
        entries[month] = (entries[month] || 0) + 1;
      });
      return Object.entries(entries).map(([month, total]) => ({ month, total })).slice(-12);
    })(),
    recent: [...fallbackRecords].sort((a, b) => b.date_issued.localeCompare(a.date_issued)).slice(0, 6),
    longOpen: fallbackRecords.filter((record) => record.status === 'Open' && (Date.now() - new Date(record.date_issued).getTime()) / 86400000 > 7).slice(0, 10)
  };
};

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'ptw-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: isProd }
}));

const csrfMiddleware = csrf({ cookie: true });
app.use((req, res, next) => {
  if ((req.method === 'GET' && req.path !== '/api/csrf-token') || req.path === '/login' || req.path === '/logout') {
    return next();
  }
  return csrfMiddleware(req, res, next);
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"]
    }
  }
}));
app.use(morgan(isProd ? 'combined' : 'dev'));

app.get('/api/session', (req, res) => {
  if (!req.session || !req.session.user) {
    return jsonResponse(res, true, { isLoggedIn: false, user: null }, null, { status: 200 });
  }

  return jsonResponse(res, true, {
    isLoggedIn: true,
    user: {
      username: req.session.user.username,
      role: req.session.user.role
    }
  }, null, { status: 200 });
});

app.get('/api/health', async (req, res) => {
  const started = Date.now();
  if (!dbAvailable) {
    return jsonResponse(res, true, {
      status: 'demo-mode',
      db: 'fallback-demo',
      latencyMs: Date.now() - started,
      appUrl
    }, null, { status: 200 });
  }

  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    const latency = Date.now() - started;
    jsonResponse(res, true, {
      status: 'ok',
      db: rows[0]?.ok === 1 ? 'connected' : 'unknown',
      latencyMs: latency,
      appUrl
    }, null, { status: 200 });
  } catch (error) {
    jsonResponse(res, false, null, 'Database unavailable', { status: 503, latencyMs: Date.now() - started });
  }
});

app.get('/api/lookups', async (req, res) => {
  if (!dbAvailable) {
    return jsonResponse(res, true, {
      locations: fallbackLocations,
      personnel: fallbackPersonnel
    }, null, { status: 200 });
  }

  try {
    const [locations] = await pool.query('SELECT name FROM locations ORDER BY name ASC');
    const [personnel] = await pool.query('SELECT name, role FROM personnel ORDER BY role, name ASC');
    jsonResponse(res, true, { locations: locations.map((r) => r.name), personnel }, null, { status: 200 });
  } catch (error) {
    jsonResponse(res, false, null, 'Unable to load lookups', { status: 500 });
  }
});

app.get('/api/ptw/suggest', rateLimitSuggest, async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) {
    return jsonResponse(res, true, [], null, { status: 200, limit: 10 });
  }

  if (!dbAvailable) {
    const matches = fallbackRecords.filter((record) => record.ptw_number.toLowerCase().includes(q.toLowerCase())).slice(0, 10);
    return jsonResponse(res, true, matches.map((record) => ({ ptw_number: record.ptw_number, location: record.location, permit_type: record.permit_type, permit_applicant_name: record.permit_applicant_name })), null, { status: 200, count: matches.length });
  }

  try {
    const [rows] = await pool.query(
      `SELECT ptw_number, location, permit_type, permit_applicant_name
       FROM ptw_records
       WHERE ptw_number LIKE ?
       ORDER BY ptw_number ASC
       LIMIT 10`,
      [`%${q}%`]
    );
    jsonResponse(res, true, rows, null, { status: 200, count: rows.length });
  } catch (error) {
    jsonResponse(res, false, null, 'Suggestion lookup failed', { status: 500 });
  }
});

app.get('/api/ptw', rateLimitSearch, async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));

  if (!dbAvailable) {
    const filtered = filterFallbackRecords(req);
    const start = (page - 1) * limit;
    const result = filtered.slice(start, start + limit);
    return jsonResponse(res, true, result, null, {
      status: 200,
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit) || 1
    });
  }

  const q = String(req.query.q || '').trim();
  const status = String(req.query.status || '').trim();
  const location = String(req.query.location || '').trim();
  const type = String(req.query.type || '').trim();
  const from = String(req.query.from || '').trim();
  const to = String(req.query.to || '').trim();
  const workLeader = String(req.query.workLeader || '').trim();
  const authority = String(req.query.authority || '').trim();

  const conditions = [];
  const params = [];

  if (q) {
    conditions.push('(ptw_number LIKE ? OR work_description LIKE ? OR permit_applicant_name LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (location) {
    conditions.push('location = ?');
    params.push(location);
  }
  if (type) {
    conditions.push('permit_type = ?');
    params.push(type);
  }
  if (from) {
    conditions.push('date_issued >= ?');
    params.push(from);
  }
  if (to) {
    conditions.push('date_issued <= ?');
    params.push(to);
  }
  if (workLeader) {
    conditions.push('work_leader = ?');
    params.push(workLeader);
  }
  if (authority) {
    conditions.push('(authorised_authority = ? OR authorised_authority_rep = ?)');
    params.push(authority, authority);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;

  try {
    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM ptw_records ${whereClause}`, params);
    const total = countRows[0]?.total || 0;
    const [rows] = await pool.query(
      `SELECT * FROM ptw_records ${whereClause} ORDER BY date_issued DESC, id DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    jsonResponse(res, true, rows, null, {
      status: 200,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    });
  } catch (error) {
    jsonResponse(res, false, null, 'Unable to fetch PTW records', { status: 500 });
  }
});

app.get('/api/ptw/:ptwNumber', async (req, res) => {
  const ptwNumber = String(req.params.ptwNumber || '').trim();
  if (!ptwNumber) {
    return jsonResponse(res, false, null, 'PTW number is required', { status: 400 });
  }

  if (!dbAvailable) {
    const record = fallbackRecords.find((entry) => entry.ptw_number === ptwNumber);
    if (!record) {
      return jsonResponse(res, false, null, 'PTW record not found', { status: 404 });
    }
    return jsonResponse(res, true, record, null, { status: 200 });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM ptw_records WHERE ptw_number = ? LIMIT 1', [ptwNumber]);
    if (!rows.length) {
      return jsonResponse(res, false, null, 'PTW record not found', { status: 404 });
    }
    jsonResponse(res, true, rows[0], null, { status: 200 });
  } catch (error) {
    jsonResponse(res, false, null, 'Unable to fetch PTW record', { status: 500 });
  }
});

app.get('/api/stats', async (req, res) => {
  if (!dbAvailable) {
    return jsonResponse(res, true, summaryFallbackData(), null, { status: 200 });
  }

  try {
    const [rows] = await pool.query(`
      SELECT
        COUNT(*) AS total_ptw,
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) AS open_ptw,
        SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) AS closed_ptw,
        SUM(CASE WHEN status = 'Suspended' THEN 1 ELSE 0 END) AS suspended_ptw,
        SUM(CASE WHEN status = 'Extended' THEN 1 ELSE 0 END) AS extended_ptw,
        SUM(CASE WHEN status = 'Open' AND permit_type = 'Hot' THEN 1 ELSE 0 END) AS hot_active,
        SUM(CASE WHEN status = 'Open' AND permit_type = 'Cold' THEN 1 ELSE 0 END) AS cold_active
      FROM ptw_records
    `);

    const [byStatus] = await pool.query(`
      SELECT status, COUNT(*) AS total FROM ptw_records GROUP BY status ORDER BY status ASC
    `);

    const [byLocation] = await pool.query(`
      SELECT location, COUNT(*) AS total FROM ptw_records GROUP BY location ORDER BY total DESC LIMIT 10
    `);

    const [byType] = await pool.query(`
      SELECT permit_type, COUNT(*) AS total FROM ptw_records GROUP BY permit_type ORDER BY permit_type ASC
    `);

    const [monthly] = await pool.query(`
      SELECT DATE_FORMAT(date_issued, '%Y-%m') AS month, COUNT(*) AS total
      FROM ptw_records
      WHERE date_issued >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(date_issued, '%Y-%m')
      ORDER BY month ASC
    `);

    const [recent] = await pool.query(`
      SELECT ptw_number, location, permit_type, permit_applicant_name, date_issued, status
      FROM ptw_records
      ORDER BY date_issued DESC
      LIMIT 6
    `);

    const [longOpen] = await pool.query(`
      SELECT ptw_number, location, permit_type, work_leader, date_issued, status
      FROM ptw_records
      WHERE status = 'Open' AND DATEDIFF(CURDATE(), date_issued) > 7
      ORDER BY date_issued ASC
      LIMIT 10
    `);

    jsonResponse(res, true, {
      summary: rows[0],
      byStatus,
      byLocation,
      byType,
      monthly,
      recent,
      longOpen
    }, null, { status: 200 });
  } catch (error) {
    jsonResponse(res, false, null, 'Unable to load dashboard stats', { status: 500 });
  }
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/qr/:ptwNumber', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'qr.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/ptw/:ptwNumber', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ptw.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/login', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (!username || !password) {
    return jsonResponse(res, false, null, 'Username and password are required', { status: 400 });
  }

  if (!dbAvailable) {
    const validUser = username === adminUsername && password === adminPassword;
    if (!validUser) {
      return jsonResponse(res, false, null, 'Invalid login', { status: 401 });
    }
    req.session.user = { id: 1, username: adminUsername, role: 'admin' };
    return jsonResponse(res, true, { username: adminUsername }, null, { status: 200 });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return jsonResponse(res, false, null, 'Invalid login', { status: 401 });
    }

    req.session.user = { id: user.id, username: user.username, role: user.role };
    jsonResponse(res, true, { username: user.username }, null, { status: 200 });
  } catch (error) {
    jsonResponse(res, false, null, 'Login failed', { status: 500 });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    jsonResponse(res, true, null, null, { status: 200 });
  });
});

app.post('/api/ptw', ensureAdmin, async (req, res) => {
  const payload = req.body || {};
  const errors = {};

  if (!/^PTW-\d{4}-\d{5}$/.test(String(payload.ptw_number || ''))) {
    errors.ptw_number = 'PTW number must match PTW-YYYY-XXXXX';
  }
  if (!/^JHA-\d{4}-\d{5}$/.test(String(payload.jha_number || ''))) {
    errors.jha_number = 'JHA number must match JHA-YYYY-XXXXX';
  }
  if (!payload.location) errors.location = 'Location is required';
  if (!payload.permit_applicant_name) errors.permit_applicant_name = 'Applicant name is required';
  if (!payload.permit_type) errors.permit_type = 'Permit type is required';
  if (!payload.work_description || !String(payload.work_description).trim()) errors.work_description = 'Description is required';
  if (!payload.work_leader) errors.work_leader = 'Work leader is required';
  if (!payload.authorised_authority) errors.authorised_authority = 'Authorised authority is required';
  if (!payload.date_issued) errors.date_issued = 'Date issued is required';
  if (payload.status === 'Closed' && !payload.date_closed) errors.date_closed = 'Date closed is required when status is Closed';
  if (payload.status !== 'Closed' && payload.date_closed) errors.date_closed = 'Date closed must be null unless permit is Closed';
  if (payload.date_issued && payload.date_closed && new Date(payload.date_closed) < new Date(payload.date_issued)) {
    errors.date_closed = 'Date closed must be on or after date issued';
  }
  if (payload.permit_type === 'Hot' && (!payload.remark || !String(payload.remark).trim())) {
    errors.remark = 'Hot permits require a remark';
  }

  if (Object.keys(errors).length) {
    return jsonResponse(res, false, { fieldErrors: errors }, 'Validation failed', { status: 400 });
  }

  if (!dbAvailable) {
    const duplicate = fallbackRecords.find((record) => record.ptw_number === payload.ptw_number);
    if (duplicate) {
      return jsonResponse(res, false, { fieldErrors: { ptw_number: 'PTW number already exists' } }, 'Validation failed', { status: 409 });
    }

    const newRecord = {
      id: fallbackRecords.length + 1,
      ptw_number: payload.ptw_number,
      jha_number: payload.jha_number,
      location: payload.location,
      permit_applicant_name: payload.permit_applicant_name,
      permit_type: payload.permit_type,
      work_description: payload.work_description,
      work_leader: payload.work_leader,
      authorised_authority: payload.authorised_authority,
      authorised_authority_rep: payload.authorised_authority_rep || null,
      date_issued: payload.date_issued,
      date_closed: payload.status === 'Closed' ? payload.date_closed : null,
      status: payload.status,
      remark: payload.remark || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    fallbackRecords.unshift(newRecord);
    return jsonResponse(res, true, newRecord, null, { status: 201, createdId: newRecord.id });
  }

  try {
    const [duplicate] = await pool.query('SELECT id FROM ptw_records WHERE ptw_number = ? LIMIT 1', [payload.ptw_number]);
    if (duplicate.length) {
      return jsonResponse(res, false, { fieldErrors: { ptw_number: 'PTW number already exists' } }, 'Validation failed', { status: 409 });
    }

    const [result] = await pool.query(
      `INSERT INTO ptw_records (
        ptw_number, jha_number, location, permit_applicant_name, permit_type,
        work_description, work_leader, authorised_authority, authorised_authority_rep,
        date_issued, date_closed, status, remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.ptw_number,
        payload.jha_number,
        payload.location,
        payload.permit_applicant_name,
        payload.permit_type,
        payload.work_description,
        payload.work_leader,
        payload.authorised_authority,
        payload.authorised_authority_rep || null,
        payload.date_issued,
        payload.status === 'Closed' ? payload.date_closed : null,
        payload.status,
        payload.remark || null
      ]
    );

    const [rows] = await pool.query('SELECT * FROM ptw_records WHERE id = ?', [result.insertId]);
    jsonResponse(res, true, rows[0], null, { status: 201, createdId: result.insertId });
  } catch (error) {
    jsonResponse(res, false, null, 'Unable to create PTW record', { status: 500 });
  }
});

app.put('/api/ptw/:id', ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body || {};
  if (!Number.isInteger(id)) {
    return jsonResponse(res, false, null, 'Invalid PTW ID', { status: 400 });
  }

  if (!dbAvailable) {
    const recordIndex = fallbackRecords.findIndex((entry) => entry.id === id);
    if (recordIndex === -1) {
      return jsonResponse(res, false, null, 'PTW record not found', { status: 404 });
    }

    fallbackRecords[recordIndex] = { ...fallbackRecords[recordIndex], ...payload, updated_at: new Date().toISOString() };
    return jsonResponse(res, true, fallbackRecords[recordIndex], null, { status: 200 });
  }

  const [existing] = await pool.query('SELECT * FROM ptw_records WHERE id = ? LIMIT 1', [id]);
  if (!existing.length) {
    return jsonResponse(res, false, null, 'PTW record not found', { status: 404 });
  }

  const [result] = await pool.query(
    `UPDATE ptw_records SET
      ptw_number = ?, jha_number = ?, location = ?, permit_applicant_name = ?, permit_type = ?,
      work_description = ?, work_leader = ?, authorised_authority = ?, authorised_authority_rep = ?,
      date_issued = ?, date_closed = ?, status = ?, remark = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
    [
      payload.ptw_number || existing[0].ptw_number,
      payload.jha_number || existing[0].jha_number,
      payload.location || existing[0].location,
      payload.permit_applicant_name || existing[0].permit_applicant_name,
      payload.permit_type || existing[0].permit_type,
      payload.work_description || existing[0].work_description,
      payload.work_leader || existing[0].work_leader,
      payload.authorised_authority || existing[0].authorised_authority,
      payload.authorised_authority_rep ?? existing[0].authorised_authority_rep,
      payload.date_issued || existing[0].date_issued,
      payload.status === 'Closed' ? (payload.date_closed || existing[0].date_closed) : null,
      payload.status || existing[0].status,
      payload.remark ?? existing[0].remark,
      id
    ]
  );

  if (result.affectedRows === 0) {
    return jsonResponse(res, false, null, 'No record updated', { status: 400 });
  }

  const [rows] = await pool.query('SELECT * FROM ptw_records WHERE id = ?', [id]);
  jsonResponse(res, true, rows[0], null, { status: 200 });
});

app.delete('/api/ptw/:id', ensureAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return jsonResponse(res, false, null, 'Invalid PTW ID', { status: 400 });
  }

  if (!dbAvailable) {
    const recordIndex = fallbackRecords.findIndex((entry) => entry.id === id);
    if (recordIndex === -1) {
      return jsonResponse(res, false, null, 'PTW record not found', { status: 404 });
    }

    const [deletedRecord] = fallbackRecords.splice(recordIndex, 1);
    return jsonResponse(res, true, deletedRecord, null, { status: 200 });
  }

  try {
    const [result] = await pool.query('DELETE FROM ptw_records WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return jsonResponse(res, false, null, 'PTW record not found', { status: 404 });
    }

    jsonResponse(res, true, { id }, null, { status: 200 });
  } catch (error) {
    jsonResponse(res, false, null, 'Unable to delete PTW record', { status: 500 });
  }
});

app.get('/api/csrf-token', (req, res) => {
  const token = req.csrfToken ? req.csrfToken() : 'demo-csrf-token';
  res.json({ success: true, data: { csrfToken: token }, meta: { status: 200 } });
});

if (require.main === module) {
  app.listen(PORT, async () => {
    console.log(`PTW app running on http://localhost:${PORT}`);
    await bootstrapAdmin();
  });
}

module.exports = { app, pool, dbAvailable: () => dbAvailable };
