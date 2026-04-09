import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { ANALYSIS_CATEGORIES } from '../data/categories';

export default function AnalysisForm() {
  const { id, turkuId } = useParams();
  const navigate = useNavigate();
  const isNew = !!turkuId;
  const [turku, setTurku] = useState(null);
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState({});

  const [form, setForm] = useState({
    konu: [],
    kullanilabilirlik: '',
    somutluk: '',
    tema: [],
    toplumsal_islev: [],
    olumsuz_icerik: [],
    sinif_duzeyi: { kademe: '', sinif: '' },
    erdem_deger: [],
    ilgili_alan: [],
    cefr: [],
    anahtar_kelimeler: '',
    notlar: '',
  });

  useEffect(() => {
    if (isNew) {
      api.get(`/turku/${turkuId}`).then(res => setTurku(res.data)).catch(() => toast.error('Türkü bilgisi alınamadı.'));
    } else if (id) {
      api.get(`/analyses/${id}`).then(res => {
        const a = res.data;
        setForm({
          konu: a.konu || [],
          kullanilabilirlik: a.kullanilabilirlik || '',
          somutluk: a.somutluk || '',
          tema: a.tema || [],
          toplumsal_islev: a.toplumsal_islev || [],
          olumsuz_icerik: a.olumsuz_icerik || [],
          sinif_duzeyi: a.sinif_duzeyi || { kademe: '', sinif: '' },
          erdem_deger: a.erdem_deger || [],
          ilgili_alan: a.ilgili_alan || [],
          cefr: a.cefr || [],
          anahtar_kelimeler: a.anahtar_kelimeler || '',
          notlar: a.notlar || '',
        });
        setTurku({ id: a.turku_id, name: a.turku_adi, trt_no: a.trt_no, region: a.region, lyrics: a.lyrics });
      }).catch(() => toast.error('Analiz bulunamadı.'));
    }
  }, [id, turkuId, isNew]);

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleMulti = (field, value) => {
    setForm(prev => {
      const arr = prev[field] || [];
      return { ...prev, [field]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const setSingle = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const setGrade = (kademe, sinif = '') => {
    setForm(prev => ({ ...prev, sinif_duzeyi: { kademe, sinif } }));
  };

  const toggleErdemDeger = (deger) => {
    setForm(prev => {
      const existing = prev.erdem_deger.find(e => e.deger === deger);
      if (existing) {
        return { ...prev, erdem_deger: prev.erdem_deger.filter(e => e.deger !== deger) };
      }
      return { ...prev, erdem_deger: [...prev.erdem_deger, { deger, iliski: 'Anlamsal Uyum' }] };
    });
  };

  const setErdemIliski = (deger, iliski) => {
    setForm(prev => ({
      ...prev,
      erdem_deger: prev.erdem_deger.map(e => e.deger === deger ? { ...e, iliski } : e),
    }));
  };

  const handleSave = async (status = 'draft') => {
    setSaving(true);
    try {
      const payload = { ...form, status, turku_id: turku?.id || turkuId, turku_name: turku?.name || '' };
      let res;
      if (isNew) {
        res = await api.post('/analyses', payload);
        toast.success(status === 'completed' ? 'Analiz tamamlandı!' : 'Taslak kaydedildi!');
        navigate(`/analysis/${res.data.id}`, { replace: true });
      } else {
        res = await api.put(`/analyses/${id}`, payload);
        toast.success(status === 'completed' ? 'Analiz tamamlandı!' : 'Kaydedildi!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Kaydetme hatası.');
    } finally {
      setSaving(false);
    }
  };

  const renderMultiSelect = (key, category) => (
    <div className="checkbox-group">
      {category.options.map(opt => (
        <label key={opt} className={`checkbox-item ${(form[key] || []).includes(opt) ? 'selected' : ''}`}>
          <input type="checkbox" checked={(form[key] || []).includes(opt)} onChange={() => toggleMulti(key, opt)} />
          {opt}
        </label>
      ))}
    </div>
  );

  const renderSingleSelect = (key, category) => (
    <div className="radio-group">
      {category.options.map(opt => (
        <label key={opt} className={`radio-item ${form[key] === opt ? 'selected' : ''}`}>
          <input type="radio" name={key} checked={form[key] === opt} onChange={() => setSingle(key, opt)} />
          {opt}
        </label>
      ))}
    </div>
  );

  const renderGradeSelect = () => {
    const cat = ANALYSIS_CATEGORIES.sinif_duzeyi;
    return (
      <div className="grade-selector">
        {cat.kademeler.map(k => (
          <div key={k.value} className={`grade-group ${form.sinif_duzeyi?.kademe === k.value ? 'selected' : ''}`}>
            <label>
              <input type="radio" name="kademe" checked={form.sinif_duzeyi?.kademe === k.value}
                onChange={() => setGrade(k.value, '')} style={{ marginRight: 8 }} />
              {k.value}
            </label>
            {k.siniflar.length > 0 && form.sinif_duzeyi?.kademe === k.value && (
              <div className="grade-sublist">
                {k.siniflar.map(s => (
                  <button key={s} type="button"
                    className={form.sinif_duzeyi?.sinif === s ? 'active' : ''}
                    onClick={() => setGrade(k.value, s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderErdemDeger = () => {
    const cat = ANALYSIS_CATEGORIES.erdem_deger;
    return (
      <table className="values-table">
        <thead>
          <tr>
            <th style={{ width: 40 }}>Seç</th>
            <th>Değer</th>
            <th>Anlam İlişkisi</th>
          </tr>
        </thead>
        <tbody>
          {cat.degerler.map(d => {
            const selected = form.erdem_deger.find(e => e.deger === d);
            return (
              <tr key={d} style={{ background: selected ? '#FFF0EB' : 'white' }}>
                <td style={{ textAlign: 'center' }}>
                  <input type="checkbox" checked={!!selected} onChange={() => toggleErdemDeger(d)} />
                </td>
                <td style={{ fontWeight: selected ? 600 : 400 }}>{d}</td>
                <td>
                  {selected && (
                    <div style={{ display: 'flex', gap: 12 }}>
                      {cat.iliskiler.map(il => (
                        <label key={il} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: '0.85rem' }}>
                          <input type="radio" name={`erdem-${d}`} checked={selected.iliski === il}
                            onChange={() => setErdemIliski(d, il)} />
                          {il}
                        </label>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  if (!turku && !isNew && !id) return <div className="loading">Yükleniyor...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{isNew ? '📝 Yeni Analiz' : '✏️ Analiz Düzenle'}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => navigate(-1)}>← Geri</button>
          <button className="btn btn-accent" onClick={() => handleSave('draft')} disabled={saving}>
            💾 Taslak Kaydet
          </button>
          <button className="btn btn-secondary" onClick={() => handleSave('completed')} disabled={saving}>
            ✅ Tamamla & Kaydet
          </button>
        </div>
      </div>

      {turku && (
        <div className="turku-info">
          <h2>🎵 {turku.name}</h2>
          <div className="info-grid">
            {turku.trt_no && <div className="info-item"><strong>TRT No:</strong> {turku.trt_no}</div>}
            {turku.region && <div className="info-item"><strong>Yöre:</strong> {turku.region}</div>}
            {turku.city && <div className="info-item"><strong>İl:</strong> {turku.city}</div>}
            {turku.source_person && <div className="info-item"><strong>Kaynak Kişi:</strong> {turku.source_person}</div>}
            {turku.compiler && <div className="info-item"><strong>Derleyen:</strong> {turku.compiler}</div>}
          </div>
          {turku.lyrics && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>📜 Türkü Sözleri</summary>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem', marginTop: 8, padding: 12, background: 'white', borderRadius: 6 }}>
                {turku.lyrics}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* 1. Türkünün Konusu */}
      <Section title={ANALYSIS_CATEGORIES.konu.title} sectionKey="konu" open={openSections} toggle={toggleSection}>
        {renderMultiSelect('konu', ANALYSIS_CATEGORIES.konu)}
      </Section>

      {/* 2. Kullanılabilirlik Düzeyi */}
      <Section title={ANALYSIS_CATEGORIES.kullanilabilirlik.title} sectionKey="kullanilabilirlik" open={openSections} toggle={toggleSection}>
        {renderSingleSelect('kullanilabilirlik', ANALYSIS_CATEGORIES.kullanilabilirlik)}
      </Section>

      {/* 3. Somutluk-Soyutluk */}
      <Section title={ANALYSIS_CATEGORIES.somutluk.title} sectionKey="somutluk" open={openSections} toggle={toggleSection}>
        {renderSingleSelect('somutluk', ANALYSIS_CATEGORIES.somutluk)}
      </Section>

      {/* 4. Tema / Duygusal Nitelik */}
      <Section title={ANALYSIS_CATEGORIES.tema.title} sectionKey="tema" open={openSections} toggle={toggleSection}>
        {renderMultiSelect('tema', ANALYSIS_CATEGORIES.tema)}
      </Section>

      {/* 5. Toplumsal İşlev */}
      <Section title={ANALYSIS_CATEGORIES.toplumsal_islev.title} sectionKey="toplumsal_islev" open={openSections} toggle={toggleSection}>
        {renderMultiSelect('toplumsal_islev', ANALYSIS_CATEGORIES.toplumsal_islev)}
      </Section>

      {/* 6. Olumsuz İçerik */}
      <Section title={ANALYSIS_CATEGORIES.olumsuz_icerik.title} sectionKey="olumsuz_icerik" open={openSections} toggle={toggleSection}>
        {renderMultiSelect('olumsuz_icerik', ANALYSIS_CATEGORIES.olumsuz_icerik)}
      </Section>

      {/* 7. Sınıf Düzeyi */}
      <Section title={ANALYSIS_CATEGORIES.sinif_duzeyi.title} sectionKey="sinif_duzeyi" open={openSections} toggle={toggleSection}>
        {renderGradeSelect()}
      </Section>

      {/* 8. Erdem-Değer-Eylem */}
      <Section title={ANALYSIS_CATEGORIES.erdem_deger.title} sectionKey="erdem_deger" open={openSections} toggle={toggleSection}>
        {renderErdemDeger()}
      </Section>

      {/* 9. İlgili Alan/Branş */}
      <Section title={ANALYSIS_CATEGORIES.ilgili_alan.title} sectionKey="ilgili_alan" open={openSections} toggle={toggleSection}>
        {renderMultiSelect('ilgili_alan', ANALYSIS_CATEGORIES.ilgili_alan)}
      </Section>

      {/* 10. CEFR */}
      <Section title={ANALYSIS_CATEGORIES.cefr.title} sectionKey="cefr" open={openSections} toggle={toggleSection}>
        {renderMultiSelect('cefr', ANALYSIS_CATEGORIES.cefr)}
      </Section>

      {/* 11. Anahtar Kelimeler */}
      <Section title="11. Anahtar Kelimeler" sectionKey="anahtar" open={openSections} toggle={toggleSection}>
        <div className="form-group">
          <label>Anahtar Kelimeler</label>
          <input type="text" value={form.anahtar_kelimeler} onChange={e => setForm({ ...form, anahtar_kelimeler: e.target.value })}
            placeholder="Virgülle ayırarak yazın: sevda, gurbet, ayrılık..." />
          <div className="hint">Birden fazla anahtar kelimeyi virgülle ayırın.</div>
        </div>
        <div className="form-group">
          <label>Ek Notlar</label>
          <textarea value={form.notlar} onChange={e => setForm({ ...form, notlar: e.target.value })}
            placeholder="Bu analiz hakkında eklemek istediğiniz notlar..." />
        </div>
      </Section>

      {/* Alt kaydet butonları */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', padding: '24px 0 48px' }}>
        <button className="btn btn-accent btn-lg" onClick={() => handleSave('draft')} disabled={saving}>
          💾 Taslak Kaydet
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => handleSave('completed')} disabled={saving}>
          ✅ Analizi Tamamla & Kaydet
        </button>
      </div>
    </div>
  );
}

function Section({ title, sectionKey, open, toggle, children }) {
  const isOpen = open[sectionKey] !== false; // default open
  return (
    <div className="analysis-section">
      <div className="analysis-section-header" onClick={() => toggle(sectionKey)}>
        <span>{title}</span>
        <span>{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && <div className="analysis-section-body">{children}</div>}
    </div>
  );
}
