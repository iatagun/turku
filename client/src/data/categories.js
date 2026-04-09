// Analiz formu kategorileri ve seçenekleri (GÜNCEL Excel'den)
export const ANALYSIS_CATEGORIES = {
  konu: {
    title: '1. Türkünün Konusu',
    type: 'multi',
    options: [
      'Anlatı Türküsü',
      'Aşk – Gurbet Türküsü',
      'Çocuk Türküsü',
      'Değer Aktarıcı Türkü',
      'Dini – Tasavvufi Türkü',
      'İş – Emek Türküsü',
      'Kırık Hava; Barak',
      'Oyun Türküsü; Horon, Zeybek, Kaşık Havası, Halay',
      'Uzun Hava; Bozlak, Ağıt, Hoyrat',
      'Diğer',
      'Emin değilim. Alan uzmanları karar versin.',
    ],
  },

  kullanilabilirlik: {
    title: '2. Ders Kitabında / Sınıf Ortamında Kullanılabilirlik Düzeyi',
    type: 'single',
    options: [
      'Doğrudan kullanılabilir; kelime açıklamasına bile gerek duyulmaz.',
      'Bilinmeyen kelime açıklanarak kullanılabilir.',
      'İçerdiği kavram ve bağlamı açıklanarak kullanılabilir.',
      'Tarihsel bağlamı ve hikâyesi öğretilip açıklanarak kullanılabilir.',
      'Ders kitabında / sınıf ortamında kullanılamaz.',
    ],
  },

  somutluk: {
    title: '3. Somutluk - Soyutluk Düzeyi',
    type: 'single',
    options: [
      'Düşük Seviyede Soyutluk',
      'Orta Seviyede Soyutluk',
      'Yüksek Seviyede Soyutluk',
      'Emin değilim. Alan uzmanları karar versin.',
    ],
  },

  tema: {
    title: '4. Türkünün Teması / Duygusal Niteliği',
    type: 'multi',
    options: [
      'Neşe / Sevinç / Coşkunluk',
      'Hüzün / Keder / Üzüntü',
      'Yalnızlık',
      'Hasret / Özlem',
      'Öfke / İsyan / Hiddet',
      'Kabulleniş / Kadercilik',
      'Aşk / Sevda',
      'İhtiyat / Beklenti / İlgi',
      'Hayret / Şaşkınlık',
      'Hayranlık / Güven / Kabulleniş',
      'Karma',
    ],
  },

  toplumsal_islev: {
    title: '5. Toplumsal İşlev',
    type: 'multi',
    options: [
      'Eğlence / Eğlendirme',
      'Ağa / Köylü İlişkileri',
      'Kültürel Aktarım',
      'Kimlik ve Aidiyet',
      'Dayanışma / Yardımlaşma',
      'Anma / Hatırlama / Yad Etme',
      'Gurbet Duygusu',
      'Ahlaki Normlar / Toplumsal Roller',
    ],
  },

  olumsuz_icerik: {
    title: '6. Olumsuz İçerik Kategorisi',
    type: 'multi',
    options: [
      'Argo Söylem',
      'Alkol / Zararlı Alışkanlık İmgesi',
      'Ayrımcı / Ötekileştirici İfade / Öz-Değer Aşındırma',
      'Cinsiyet Rolleri ve Kalıp Yargılar',
      'Kimi Meslek Erbabına Olumsuz Bakış',
      'Hüzün / Yoğun Duygusal İçerik',
      'Şiddet / Fiziksel Zarar İmgesi',
      'Batıl İnanış / Hurafe',
      'Toplumsal Çatışma / Sert Söylem',
    ],
  },

  sinif_duzeyi: {
    title: '7. İlk Kez Öğretilebileceği Sınıf Düzeyi',
    type: 'grade',
    kademeler: [
      { value: 'Okul Öncesi', siniflar: [] },
      { value: 'İlkokul', siniflar: ['1. Sınıf', '2. Sınıf', '3. Sınıf', '4. Sınıf'] },
      { value: 'Ortaokul', siniflar: ['5. Sınıf', '6. Sınıf', '7. Sınıf', '8. Sınıf'] },
      { value: 'Lise', siniflar: ['9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf'] },
      { value: 'Üniversite', siniflar: [] },
      { value: 'Hiçbiri', siniflar: [] },
    ],
  },

  erdem_deger: {
    title: '8. Erdem-Değer-Eylem Çerçevesi',
    type: 'values',
    degerler: [
      'D1. Adalet', 'D2. Aile Bütünlüğü', 'D3. Çalışkanlık', 'D4. Dostluk',
      'D5. Duyarlılık', 'D6. Dürüstlük', 'D7. Estetik', 'D8. Mahremiyet',
      'D9. Merhamet', 'D10. Mütevazılık', 'D11. Özgürlük', 'D12. Sabır',
      'D13. Sağlıklı Yaşam', 'D14. Saygı', 'D15. Sevgi', 'D16. Sorumluluk',
      'D17. Tasarruf', 'D18. Temizlik', 'D19. Vatanseverlik', 'D20. Yardımseverlik',
    ],
    iliskiler: ['Anlamsal Uyum', 'Karşıtlık (Tezat) İlişkisi'],
  },

  ilgili_alan: {
    title: '9. İlgili Alan / Branş',
    type: 'multi',
    options: [
      'Aile ve Tüketici Hizmetleri', 'Beden Eğitimi', 'Bilişim Teknolojileri',
      'Biyoloji', 'Coğrafya', 'Çocuk Gelişimi ve Eğitimi',
      'Din Kültürü ve Ahlâk Bilgisi', 'El Sanatları Teknolojisi',
      'Felsefe', 'Felsefe Grubu: Sosyoloji', 'Fen Bilimleri', 'Fizik',
      'Görsel Sanatlar', 'Grafik ve Fotoğraf',
      'İlköğretim Matematik', 'İngilizce', 'Kimya',
      'Matematik', 'Müzik', 'Okul Öncesi', 'Özel Eğitim',
      'Psikoloji', 'Rehberlik', 'Sağlık Bilgisi',
      'Sanat Tarihi', 'Sınıf Öğretmenliği', 'Sosyal Bilgiler',
      'Tarih', 'Teknoloji ve Tasarım', 'Tiyatro',
      'Türk Dili ve Edebiyatı', 'Türkçe',
    ],
  },

  cefr: {
    title: '10. CEFR Tematik Alanı',
    type: 'multi',
    options: [
      'Aile ve Sosyal İlişkiler',
      'Bilim ve Teknoloji',
      'Doğa ve Çevre',
      'Din, İnanç ve Değerler',
      'Duygu ve Düşünce İfadesi',
      'Eğitim',
      'Günlük Yaşam',
      'Hobi, Spor ve Boş Zaman Faaliyetleri',
      'Kamusal ve Toplumsal Yaşam',
      'Kişisel Bilgi Verme ve Tanışma',
      'Kültür ve Sanat',
      'Meslekler ve İş Hayatı',
      'Sağlık ve Beden',
      'Seyahat ve Gezi',
      'Tarih ve Zaman',
      'Yemek, Yiyecek ve İçecek',
      'Yerler ve Mekânlar',
      'Diğer',
    ],
  },
};
