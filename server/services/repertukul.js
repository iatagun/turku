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

// Slug sayfasından türkü detay + sözlerini çek
async function getTurkuDetail(slug) {
  try {
    const response = await axios.get(`${BASE_URL}/${slug}`, {
      responseType: 'arraybuffer',
      timeout: 15000,
    });

    const html = iconv.decode(Buffer.from(response.data), 'utf-8');
    const $ = cheerio.load(html);

    const detail = {
      slug,
      name: '',
      trt_no: '',
      region: '',
      city: '',
      district_village: '',
      source_person: '',
      compiler: '',
      notator: '',
      performer: '',
      musical_type: '',
      modal_scale: '',
      subject_type: '',
      lyrics: '',
    };

    // #tcerceve1: meta veri tablosu
    const nameEl = $('#tcerceve1 font.normalbuyukbaslik');
    if (nameEl.length) detail.name = nameEl.text().trim();

    // Tablo satırlarından meta verileri çek
    $('#tcerceve1 tr').each((_, tr) => {
      const cells = $(tr).find('td');
      if (cells.length < 3) return;
      const label = $(cells[1]).text().trim().toLowerCase();
      const value = $(cells[2]).text().replace(/\u00a0/g, ' ').trim();
      if (!value) return;

      if (label.includes('repertuar no')) detail.trt_no = value;
      else if (label.includes('yöresi') || label.includes('ili')) detail.region = value;
      else if (label.includes('ilçesi') || label.includes('köyü')) detail.district_village = value;
      else if (label.includes('kaynak')) detail.source_person = value;
      else if (label.includes('derleyen')) detail.compiler = value;
      else if (label.includes('notaya')) detail.notator = value;
      else if (label.includes('icra') || label.includes('İcra')) detail.performer = value;
      else if (label.includes('makam')) detail.modal_scale = value;
      else if (label.includes('konusu') || label.includes('türü')) detail.subject_type = value;
    });

    // Kategori (Kırık Havalar, Uzun Havalar vb.)
    const categoryEl = $('font.normalbuyuk2');
    if (categoryEl.length) detail.musical_type = categoryEl.first().text().trim();

    // #tcerceve2: sözler — "TÜRKÜNÜN SÖZLERİ" başlığının altında
    const tcerceve2 = $('#tcerceve2');
    if (tcerceve2.length) {
      // font.normalkucuk inside tcerceve2 after "TÜRKÜNÜN SÖZLERİ"
      const lyricsFont = tcerceve2.find('font.normalbuyukbaslik font.normalkucuk');
      if (lyricsFont.length) {
        // <br> etiketlerini newline'a çevir
        let lyricsHtml = lyricsFont.html();
        detail.lyrics = lyricsHtml
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .trim();
      }
    }

    return detail;
  } catch (error) {
    console.error('Repertukul detay hatası:', error.message, slug);
    return null;
  }
}

// Belirli bir süre bekle (rate limiting)
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Toplu söz çekme — slug'ları olan ama sözü olmayan türküler için
async function fetchAllLyrics(turkuRepo, onProgress) {
  const turkus = turkuRepo.findWithoutLyrics(5000);
  const total = turkus.length;
  let fetched = 0;
  let failed = 0;

  for (const turku of turkus) {
    try {
      const detail = await getTurkuDetail(turku.slug);
      if (detail && detail.lyrics) {
        turkuRepo.updateLyricsAndMeta(turku.id, detail);
        fetched++;
      } else {
        // Söz yok ama sayfaya erişildi — boş lyrics işaretle
        turkuRepo.markNoLyrics(turku.id);
        failed++;
      }
    } catch (err) {
      failed++;
    }

    if (onProgress) onProgress({ fetched, failed, total, current: fetched + failed });
    // Sunucuya yük bindirmemek için 500ms bekle
    await sleep(500);
  }

  return { fetched, failed, total };
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

module.exports = { searchTurku, getTurkuDetail, getCategory, fetchAllTurkus, fetchAllLyrics, parseTurkuList };
