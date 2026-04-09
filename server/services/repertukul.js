const axios = require('axios');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

const BASE_URL = 'https://www.repertukul.com';

// repertukul.com HTML'inden türkü listesi parse et
function parseTurkuList(html) {
  const results = [];
  // Pattern: class='turkulistesi(A)?' id='ID' onClick=window.open('SLUG','_blank')><font ...> NUM * NAME </font>
  const regex = /class='turkulistesi[A]?'\s+id='(\d+)'\s+onClick=window\.open\('([^']+)','_blank'\)><font[^>]*>([\s\S]*?)<\/font>/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const id = match[1];
    const slug = match[2];
    // Name: " &nbsp; 1 *  A BENİM BAŞI ŞALLIM " -> clean it
    let name = match[3]
      .replace(/&nbsp;/g, ' ')
      .replace(/^\s*\d+\s*\*\s*/, '')
      .trim();
    if (name.length > 1) {
      results.push({ id, slug, name });
    }
  }
  return results;
}

// repertukul.com üzerinden türkü arama
async function searchTurku(query, category = '1') {
  try {
    const response = await axios.post(
      `${BASE_URL}/Aramawef5654Y.jpg/`,
      `arama=${category}&ara=${encodeURIComponent(query)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': BASE_URL,
        },
        responseType: 'arraybuffer',
        timeout: 15000,
      }
    );

    const html = iconv.decode(Buffer.from(response.data), 'utf-8');
    const results = parseTurkuList(html);
    return { results, rawHtml: html };
  } catch (error) {
    console.error('Repertukul arama hatası:', error.message);
    return { results: [], error: error.message };
  }
}

// Türkü detay bilgilerini çek
async function getTurkuDetail(turkuId) {
  try {
    const response = await axios.post(
      `${BASE_URL}/hkssSFCSDfnjdffvXXefcbfddfcvdvFFDV5lkjffgtyuftr55SEY.jpg/`,
      `kod=${turkuId}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': BASE_URL,
        },
        responseType: 'arraybuffer',
        timeout: 15000,
      }
    );

    const html = iconv.decode(Buffer.from(response.data), 'utf-8');
    const $ = cheerio.load(html);

    const detail = {
      repertukul_id: turkuId,
      name: '',
      trt_no: '',
      region: '',
      city: '',
      source_person: '',
      compiler: '',
      notator: '',
      musical_type: '',
      modal_scale: '',
      lyrics: '',
      raw_html: html,
    };

    // Parse field-value pairs from the detail HTML
    const textContent = $.text();
    const lines = textContent.split('\n').map(l => l.trim()).filter(Boolean);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const next = lines[i + 1] || '';

      if (/Eser\s*Ad/i.test(line) || /Türkü\s*Ad/i.test(line)) detail.name = next;
      if (/TRT.*No/i.test(line) || /Repertuvar.*No/i.test(line)) detail.trt_no = next;
      if (/Yöre/i.test(line) || /Bölge/i.test(line)) detail.region = next;
      if (/Kaynak.*Kişi/i.test(line)) detail.source_person = next;
      if (/Derleyen/i.test(line)) detail.compiler = next;
      if (/Notaya.*Alan/i.test(line)) detail.notator = next;
      if (/Makam/i.test(line) || /Dizi/i.test(line)) detail.modal_scale = next;
    }

    // Try to extract name from title or header
    if (!detail.name) {
      const titleEl = $('b, strong, h1, h2, h3, .baslik, .turkuAd').first();
      if (titleEl.length) detail.name = titleEl.text().trim();
    }

    // Extract lyrics
    const lyricsSelectors = ['.turkuSoz', '.sozler', '#sozler', '.lyrics'];
    for (const sel of lyricsSelectors) {
      const el = $(sel);
      if (el.length) {
        detail.lyrics = el.text().trim();
        break;
      }
    }

    // If no lyrics found, try to find text blocks that look like lyrics
    if (!detail.lyrics) {
      $('div, p, td').each((_, el) => {
        const text = $(el).text().trim();
        if (text.length > 50 && text.includes('\n') && !text.includes('http')) {
          if (!detail.lyrics || text.length > detail.lyrics.length) {
            detail.lyrics = text;
          }
        }
      });
    }

    return detail;
  } catch (error) {
    console.error('Repertukul detay hatası:', error.message);
    return null;
  }
}

// Kırık havalar, uzun havalar, oyun havaları listesini çek
async function getCategory(categoryPath) {
  try {
    const response = await axios.post(
      `${BASE_URL}/hkSFCSDfnjdffvXXefcbfddfcvdvFFDV5lkjffgtyuftr55SEY.jpg/`,
      `kod=&siralamainput=1`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': `${BASE_URL}/${categoryPath}`,
        },
        responseType: 'arraybuffer',
        timeout: 15000,
      }
    );

    const html = iconv.decode(Buffer.from(response.data), 'utf-8');
    return html;
  } catch (error) {
    console.error('Kategori listesi hatası:', error.message);
    return '';
  }
}

// Tüm türküleri toplu çek (arama "bir" geniş sonuç döner)
async function fetchAllTurkus(onProgress) {
  const allItems = new Map();

  // "bir" araması ~4500 türkü döndürüyor
  const searches = [
    { query: 'bir', category: '1' },
  ];

  for (const s of searches) {
    const { results } = await searchTurku(s.query, s.category);
    for (const item of results) {
      if (!allItems.has(item.id)) {
        allItems.set(item.id, item);
      }
    }
    if (onProgress) onProgress(allItems.size);
  }

  return [...allItems.values()];
}

module.exports = { searchTurku, getTurkuDetail, getCategory, fetchAllTurkus, parseTurkuList };
