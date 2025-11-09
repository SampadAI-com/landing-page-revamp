require('dotenv').config();

const express = require('express');
const axios = require('axios');
const path = require('path');
const { google } = require('googleapis');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const CONFIG = {
  GOOGLE_SHEETS: {
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Waitlist!A:D',
    credentials: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || null,
  },
  GEO_API: {
    url: 'https://ipapi.co',
    timeout: 3000,
    userAgent: 'SampadAI-Landing-Page/1.0',
  },
  LANGUAGES: {
    DE: 'de',
    PL: 'pl',
    DEFAULT: 'en',
  },
};

// Middleware setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Utility functions
const isPrivateIP = ip => {
  const privateRanges = ['127.0.0.1', '::1', '192.168.', '10.'];
  return privateRanges.some(range => ip === range || ip.startsWith(range));
};

const getCountryFromIP = async ip => {
  if (isPrivateIP(ip)) return null;

  try {
    const response = await axios.get(`${CONFIG.GEO_API.url}/${ip}/country/`, {
      timeout: CONFIG.GEO_API.timeout,
      headers: { 'User-Agent': CONFIG.GEO_API.userAgent },
    });
    return response.data?.trim() || null;
  } catch (error) {
    if (error.response?.status !== 429) {
      console.warn('Geolocation API failed:', error.message);
    }
    return null;
  }
};

const detectLanguage = country => {
  const languageMap = {
    DE: CONFIG.LANGUAGES.DE,
    PL: CONFIG.LANGUAGES.PL,
  };
  return languageMap[country] || CONFIG.LANGUAGES.DEFAULT;
};

const saveToGoogleSheets = async (email, country) => {
  if (
    !CONFIG.GOOGLE_SHEETS.spreadsheetId ||
    !CONFIG.GOOGLE_SHEETS.credentials
  ) {
    throw new Error('Google Sheets not configured');
  }

  const creds = JSON.parse(CONFIG.GOOGLE_SHEETS.credentials);
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const values = [[email, new Date().toISOString(), 'Active', country]];

  return await sheets.spreadsheets.values.append({
    spreadsheetId: CONFIG.GOOGLE_SHEETS.spreadsheetId,
    range: 'Waitlist!A:D',
    valueInputOption: 'RAW',
    resource: { values },
  });
};

// Language detection middleware
app.use(async (req, res, next) => {
  try {
    const clientIP =
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress ||
      req.ip;

    const cleanIP = clientIP ? clientIP.split(',')[0].trim() : '127.0.0.1';
    const country = await getCountryFromIP(cleanIP);
    req.country = country;
    req.language = detectLanguage(country);
  } catch (error) {
    console.error('Language detection error:', error);
    req.country = null;
    req.language = CONFIG.LANGUAGES.DEFAULT;
  }
  next();
});

// Content data
const getMessages = () => ({
  en: {
    title: 'SampadAI',
    tagline: 'Because Your Money Deserves an A+ AI',
    comingSoon: 'Coming Soon',
    description:
      'We are building something amazing. Join our waitlist to be the first to know when we launch.',
    emailPlaceholder: 'Enter your email address',
    joinWaitlist: 'Join Waitlist',
    successMessage:
      "Thank you! You've been added to our waitlist. We'll notify you when we launch.",
    tryBetaNow: 'Try Beta App Now',
    seo: {
      title:
        'SampadAI - AI-Powered Financial Technology Platform | Fintech Innovation',
      description:
        'Advanced AI financial technology platform. Join our waitlist for early access to intelligent financial solutions.',
      keywords:
        'fintech, AI finance, artificial intelligence financial services, personal finance AI, investment management, financial technology, fintech startup, AI-powered banking, financial innovation, digital banking, smart finance, automated investing, financial AI platform, fintech solutions, banking technology, financial services AI, wealth management AI, fintech Germany, fintech Poland, fintech Berlin, European fintech, financial technology startup, AI financial advisor, robo-advisor, financial planning AI, money management AI, fintech innovation, next-generation banking, financial AI tools, intelligent financial services',
      canonicalUrl: '/en',
      locale: 'en_US',
      geoRegion: 'DE-PL',
      geoPlacename: 'Berlin, Germany',
      geoPosition: '52.5200;13.4050',
      addressCountry: 'DE',
      addressLocality: 'Berlin',
    },
  },
  de: {
    title: 'SampadAI',
    tagline: 'Weil Ihr Geld eine A+ KI verdient',
    comingSoon: 'Demnächst verfügbar',
    description:
      'Wir entwickeln etwas Großartiges. Treten Sie unserer Warteliste bei, um als Erster zu erfahren, wann wir starten.',
    emailPlaceholder: 'E-Mail-Adresse eingeben',
    joinWaitlist: 'Warteliste beitreten',
    successMessage:
      'Vielen Dank! Sie wurden zu unserer Warteliste hinzugefügt. Wir benachrichtigen Sie, wenn wir starten.',
    tryBetaNow: 'Beta-App jetzt testen',
    seo: {
      title:
        'SampadAI - KI-gestützte Finanztechnologie-Plattform | Fintech Innovation Deutschland',
      description:
        'Fortschrittliche KI-Finanztechnologie-Plattform. Treten Sie unserer Warteliste bei für frühen Zugang zu intelligenten Finanzlösungen.',
      keywords:
        'fintech Deutschland, KI Finanzen, künstliche Intelligenz Finanzdienstleistungen, persönliche Finanzen KI, Investitionsmanagement, Finanztechnologie, fintech startup Deutschland, KI-gestützte Banken, Finanzinnovation, digitales Banking, intelligente Finanzen, automatisierte Investitionen, Finanz-KI-Plattform, fintech Lösungen Deutschland, Banking-Technologie, Finanzdienstleistungen KI, Vermögensverwaltung KI, fintech Berlin, deutsche fintech, europäische fintech, Finanztechnologie startup Deutschland, KI Finanzberater, Robo-Advisor Deutschland, Finanzplanung KI, Geldmanagement KI, fintech Innovation Deutschland, Banking der nächsten Generation, Finanz-KI-Tools, intelligente Finanzdienstleistungen Deutschland',
      canonicalUrl: '/de',
      locale: 'de_DE',
      geoRegion: 'DE',
      geoPlacename: 'Berlin, Deutschland',
      geoPosition: '52.5200;13.4050',
      addressCountry: 'DE',
      addressLocality: 'Berlin',
    },
  },
  pl: {
    title: 'SampadAI',
    tagline: 'Ponieważ Twoje pieniądze zasługują na AI klasy A+',
    comingSoon: 'Wkrótce',
    description:
      'Tworzymy coś niesamowitego. Dołącz do naszej listy oczekujących, aby jako pierwszy dowiedzieć się o naszym uruchomieniu.',
    emailPlaceholder: 'Wprowadź swój adres e-mail',
    joinWaitlist: 'Dołącz do listy',
    successMessage:
      'Dziękujemy! Zostałeś dodany do naszej listy oczekujących. Powiadomimy Cię, gdy uruchomimy serwis.',
    tryBetaNow: 'Wypróbuj aplikację beta',
    seo: {
      title:
        'SampadAI - Platforma Fintech z Sztuczną Inteligencją | Innowacje Fintech Polska',
      description:
        'Zaawansowana platforma AI technologii finansowej. Dołącz do naszej listy oczekujących dla wczesnego dostępu do inteligentnych rozwiązań finansowych.',
      keywords:
        'fintech Polska, AI finanse, sztuczna inteligencja usługi finansowe, finanse osobiste AI, zarządzanie inwestycjami, technologia finansowa, fintech startup Polska, bankowość wspierana przez AI, innowacje finansowe, bankowość cyfrowa, inteligentne finanse, automatyczne inwestowanie, platforma finansowa AI, rozwiązania fintech Polska, technologia bankowa, usługi finansowe AI, zarządzanie majątkiem AI, fintech Warszawa, polski fintech, europejski fintech, startup technologii finansowej Polska, doradca finansowy AI, robo-doradca Polska, planowanie finansowe AI, zarządzanie pieniędzmi AI, innowacje fintech Polska, bankowość nowej generacji, narzędzia finansowe AI, inteligentne usługi finansowe Polska',
      canonicalUrl: '/pl',
      locale: 'pl_PL',
      geoRegion: 'PL',
      geoPlacename: 'Warszawa, Polska',
      geoPosition: '52.2297;21.0122',
      addressCountry: 'PL',
      addressLocality: 'Warszawa',
    },
  },
});

// Routes
const renderPage = (req, res, language) => {
  res.render('index', { language, messages: getMessages() });
};

// SEO routes
app.get('/sitemap.xml', (req, res) => {
  res.set('Content-Type', 'application/xml');
  res.sendFile(path.join(__dirname, 'public', 'seo', 'sitemap.xml'));
});

app.get('/robots.txt', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.sendFile(path.join(__dirname, 'public', 'seo', 'robots.txt'));
});

app.get('/site.webmanifest', (req, res) => {
  res.set('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(__dirname, 'public', 'seo', 'site.webmanifest'));
});

// Main routes
app.get('/', (req, res) => renderPage(req, res, req.language));
app.get('/en', (req, res) => renderPage(req, res, 'en'));
app.get('/de', (req, res) => renderPage(req, res, 'de'));
app.get('/pl', (req, res) => renderPage(req, res, 'pl'));

// Waitlist route
app.post('/waitlist', async (req, res) => {
  const { email } = req.body;
  const { country } = req;

  if (!email || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address',
    });
  }

  try {
    await saveToGoogleSheets(email, country);
    console.log(`✅ Waitlist signup saved: ${email}${country ? ` from ${country}` : ''}`);
  } catch (error) {
    console.log(`📝 Waitlist signup (fallback): ${email}`);
  }

  res.json({
    success: true,
    message: 'Successfully added to waitlist!',
  });
});

app.get('/rsvp', (req, res) => {
  res.render('rsvp', {
    title: 'Boxed with love',
    date: '17.02.24',
    eventTime: '14 Feb | 6:00PM',
  });
});

// RSVP submission route
app.post('/rsvp', async (req, res) => {
  const { name, guests } = req.body;

  if (!name || !guests) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your name and number of attendees',
    });
  }

  try {
    // Here you could save to a database or send notifications
    console.log(`✅ RSVP received: ${name} with ${guests} guest(s)`);

    res.json({
      success: true,
      message: 'Thank you! Your RSVP has been received.',
    });
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process RSVP. Please try again.',
    });
  }
});

// Export for Vercel
module.exports = app;

// Start server if not in production
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT}`);
  });
}
