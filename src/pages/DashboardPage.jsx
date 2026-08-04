import UserMenu from '../components/UserMenu';
import Footer from '../components/Footer';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock, AlertTriangle, LogOut, Plus, Edit2, Trash2, X, Printer, Mail, Download, Home } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUT_CONFIG = {
  a_faire: { label: 'À faire', color: 'bg-gray-100 text-gray-600', icon: Clock },
  en_cours: { label: 'En cours', color: 'bg-amber-100 text-amber-700', icon: Clock },
  terminee: { label: 'Terminée', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  manquee: { label: 'Manquée', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
};

const PERIODICITES = [
  { value: 'quotidien', label: 'Quotidien' },
  { value: 'hebdomadaire', label: 'Hebdomadaire' },
  { value: 'mensuel', label: 'Mensuel' },
  { value: 'a_la_demande', label: 'À la demande' },
];

const CHECKS_DISPONIBLES = [
  { value: 'binaire', label: 'Oui / Non' },
  { value: 'quantite', label: 'Quantité (seuil)' },
  { value: 'temperature', label: 'Température (plage)' },
  { value: 'peremption', label: 'Date de péremption' },
  { value: 'numero', label: 'Numéro / Référence' },
];

function ModeleModal({ existing, metiers, onClose, onSaved }) {
  const [form, setForm] = useState(existing ? {
    nom: existing.nom, description: existing.description || '', periodicite: existing.periodicite,
    metier_responsable_id: existing.metier_responsable_id || '', heure_limite: existing.heure_limite || ''
  } : { nom: '', description: '', periodicite: 'quotidien', metier_responsable_id: '', heure_limite: '' });
  const [items, setItems] = useState(existing?.items || []);
  const [metiersAlerte, setMetiersAlerte] = useState([]);
  const [loading, setLoading] = useState(false);

  const addItem = () => setItems(p => [...p, { libelle: '', checks: ['binaire'], seuil_min: '', temperature_min: '', temperature_max: '', emplacement: '' }]);
  const updateItem = (idx, field, value) => setItems(p => p.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  const removeItem = async (idx) => {
    const item = items[idx];
    if (item.id) {
      try { await api.delete(`/modeles/items/${item.id}`); } catch { toast.error('Erreur suppression point'); return; }
    }
    setItems(p => p.filter((_, i) => i !== idx));
  };

  const save = async () => {
    if (!form.nom) { toast.error('Nom requis'); return; }
    if (!existing && items.length === 0) { toast.error('Ajoutez au moins un point à vérifier'); return; }
    setLoading(true);
    try {
      if (existing) {
        await api.patch(`/modeles/${existing.id}`, form);
        for (const item of items) {
          if (!item.id) {
            await api.post(`/modeles/${existing.id}/items`, item);
          }
        }
      } else {
        await api.post('/modeles', { ...form, items, metiers_alerte: metiersAlerte });
      }
      toast.success(existing ? 'Vérification modifiée' : 'Vérification créée');
      onSaved();
      onClose();
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900">{existing ? 'Modifier' : 'Nouvelle'} vérification</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Nom</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.nom} onChange={e => setForm(p => ({...p, nom: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Périodicité</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.periodicite} onChange={e => setForm(p => ({...p, periodicite: e.target.value}))}>
                {PERIODICITES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Heure limite</label>
              <input type="time" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.heure_limite} onChange={e => setForm(p => ({...p, heure_limite: e.target.value}))} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Métier responsable</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" value={form.metier_responsable_id} onChange={e => setForm(p => ({...p, metier_responsable_id: e.target.value}))}>
              <option value="">— Aucun —</option>
              {metiers.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
          </div>
          {!existing && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Alerter en cas de retard</label>
              <div className="flex flex-wrap gap-2">
                {metiers.map(m => (
                  <label key={m.id} className={`text-xs px-3 py-1.5 rounded-full cursor-pointer border ${metiersAlerte.includes(m.id) ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    <input type="checkbox" className="hidden" checked={metiersAlerte.includes(m.id)} onChange={e => setMetiersAlerte(p => e.target.checked ? [...p, m.id] : p.filter(id => id !== m.id))} />
                    {m.nom}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Points à vérifier</p>
            <button onClick={addItem} className="text-xs px-3 py-1.5 rounded-lg text-white flex items-center gap-1" style={{ background: '#4A2C2A' }}>
              <Plus size={14} /> Ajouter
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="Libellé" value={item.libelle} onChange={e => updateItem(idx, 'libelle', e.target.value)} disabled={!!item.id} />
                  <button onClick={() => removeItem(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                </div>
                {!item.id && (
                  <>
                    <input className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs" placeholder="Emplacement" value={item.emplacement} onChange={e => updateItem(idx, 'emplacement', e.target.value)} />
                    <div className="flex flex-wrap gap-1.5">
                      {CHECKS_DISPONIBLES.map(c => (
                        <label key={c.value} className={`text-xs px-2 py-1 rounded-full cursor-pointer border ${(item.checks || []).includes(c.value) ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-gray-200 text-gray-500'}`}>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={(item.checks || []).includes(c.value)}
                            onChange={e => {
                              const current = item.checks || [];
                              const next = e.target.checked ? [...current, c.value] : current.filter(v => v !== c.value);
                              updateItem(idx, 'checks', next.length > 0 ? next : ['binaire']);
                            }}
                          />
                          {c.label}
                        </label>
                      ))}
                    </div>
                    {(item.checks || []).includes('quantite') && (
                      <input type="number" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs" placeholder="Seuil minimum" value={item.seuil_min} onChange={e => updateItem(idx, 'seuil_min', e.target.value)} />
                    )}
                    {(item.checks || []).includes('temperature') && (
                      <div className="grid grid-cols-2 gap-2">
                        <input type="number" className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs" placeholder="Temp. min °C" value={item.temperature_min} onChange={e => updateItem(idx, 'temperature_min', e.target.value)} />
                        <input type="number" className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs" placeholder="Temp. max °C" value={item.temperature_max} onChange={e => updateItem(idx, 'temperature_max', e.target.value)} />
                      </div>
                    )}
                  </>
                )}
                {item.id && <p className="text-xs text-gray-400">{(item.checks || []).map(c => CHECKS_DISPONIBLES.find(x => x.value === c)?.label).join(' · ')}</p>}
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucun point ajouté</p>}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={save} disabled={loading} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: '#4A2C2A' }}>
            {loading ? 'Enregistrement...' : existing ? 'Enregistrer' : 'Créer'}
          </button>
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600">Annuler</button>
        </div>
      </div>
    </div>
  );
}


const SAINTS = ["Marie","Basile","Genevieve","Odilon","Edouard","Melaine","Raymond","Lucien","Alix","Guillaume","Paulin","Tatiana","Yvette","Nina","Remi","Marcel","Roseline","Prisca","Marius","Sebastien","Agnes","Vincent","Barnard","Francois","Ananie","Paule","Angele","Thomas","Gildas","Martine","Marcelle","Ella","Theophane","Blaise","Veronique","Agathe","Gaston","Eugenie","Jacqueline","Apolline","Arnaud","Heloise","Felix","Beatrice","Valentin","Claude","Julienne","Alexis","Bernadette","Gabin","Aimee","Pierre-Damien","Isabelle","Lazare","Modeste","Romeo","Nestor","Honorine","Romain","Auguste","Aubin","Charles","Guenole","Casimir","Olive","Colette","Felicite","Jean","Francoise","Vivien","Rosine","Justine","Rodrigue","Mathilde","Louise","Benedicte","Patrice","Cyrille","Joseph","Herbert","Clemence","Lea","Victorien","Catherine","Humbert","Larissa","Habib","Gontran","Gwladys","Amedee","Benjamin","Hugues","Sandrine","Richard","Isidore","Irene","Marcellin","Jean-Baptiste","Julie","Gauthier","Fulbert","Stanislas","Jules","Ida","Maxime","Paterne","Benoit-Joseph","Anicet","Parfait","Emma","Odette","Anselme","Alexandre","Georges","Fidele","Marc","Alida","Zita","Valerie","Catherine","Robert","Jeremie","Boris","Philippe","Sylvain","Judith","Prudence","Gisele","Desire","Pacome","Solange","Estelle","Achille","Rolande","Matthias","Denise","Honore","Pascal","Eric","Yves","Bernardin","Constantin","Emile","Didier","Donatien","Sophie","Berenger","Augustin","Germain","Aymard","Ferdinand","Perrine","Justin","Blandine","Kevin","Clotilde","Igor","Norbert","Gilbert","Medard","Diane","Landry","Barnabe","Guy","Antoine","Elisee","Germaine","Jean-Francois","Herve","Leonce","Romuald","Silvere","Rodolphe","Alban","Audrey","Jean-Baptiste","Prosper","Anthelme","Fernand","Irenee","Pierre","Martial","Thierry","Martinien","Thomas","Florent","Antoine","Mariette","Raoul","Thibaut","Amandine","Ulrich","Benoit","Olivier","Henri","Camille","Donald","Carmen","Charlotte","Frederic","Arsene","Marina","Victor","Marie-Madeleine","Brigitte","Christine","Jacques","Anne","Nathalie","Samson","Marthe","Juliette","Ignace","Alphonse","Julien","Lydie","Jean-Marie","Abel","Octavien","Gaetan","Dominique","Amour","Laurent","Claire","Clarisse","Hippolyte","Evrard","Marie","Armel","Hyacinthe","Helene","Jean-Eudes","Bernard","Christophe","Fabrice","Rose","Barthelemy","Louis","Natacha","Monique","Augustin","Sabine","Fiacre","Aristide","Gilles","Ingrid","Gregoire","Rosalie","Raissa","Bertrand","Reine","Adrien","Alain","Ines","Adelphe","Apollinaire","Aime","Cyprien","Roland","Edith","Renaud","Nadege","Emilie","Davy","Matthieu","Maurice","Constant","Thecle","Hermann","Come","Vincent","Venceslas","Michel","Jerome","Therese","Leger","Gerard","Francois","Fleur","Bruno","Serge","Pelagie","Denis","Ghislain","Firmin","Wilfried","Geraud","Juste","Aurelie","Edwige","Baudouin","Luc","Rene","Adeline","Celine","Elodie","Jean","Florentin","Crepin","Dimitri","Emeline","Simon","Narcisse","Bienvenue","Quentin","Harold","Oceane","Hubert","Charles","Sylvie","Bertille","Carine","Geoffroy","Theodore","Leon","Martin","Christian","Brice","Sidoine","Albert","Marguerite","Elisabeth","Aude","Tanguy","Edmond","Rufus","Cecile","Clement","Flora","Catherine","Delphine","Severin","Jacques","Saturnin","Andre","Florence","Viviane","Xavier","Barbara","Gerald","Nicolas","Ambroise","Elfried","Pierre","Romaric","Daniel","Corentin","Lucie","Odile","Ninon","Alice","Gael","Gatien","Urbain","Theophile","Pierre","Francoise-Xaviere","Armand","Adele","Emmanuel","Etienne","Jean","Gaspard","David","Roger","Sylvestre"];

function getSaintDuJour() {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  let day = Math.floor(diff / oneDay);
  const isBissextile = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0));
  if (!isBissextile && day >= 59) day++;
  return SAINTS[Math.min(day, SAINTS.length - 1)] || '';
}

export default function DashboardPage() {
  const { user, isManager, isAdmin, isRealAdmin, viewAs, setViewAs } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('aujourdhui');
  const [executions, setExecutions] = useState([]);
  const [modeles, setModeles] = useState([]);
  const [metiers, setMetiers] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalModele, setModalModele] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [filtreModeles, setFiltreModeles] = useState([]);
  const [filtreDateDebut, setFiltreDateDebut] = useState('');
  const [filtreDateFin, setFiltreDateFin] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailDest, setEmailDest] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const loadAujourdhui = () => {
    api.get('/executions/du-jour').then(({ data }) => setExecutions(data)).catch(() => toast.error('Erreur'));
  };

  const loadModeles = async () => {
    try {
      const [m, met] = await Promise.all([
        api.get('/modeles'),
        fetch('/sso/api/apps/metiers/all', { headers: { Authorization: `Bearer ${localStorage.getItem('sso_token')}` } }).then(r => r.json())
      ]);
      setModeles(m.data);
      setMetiers(met);
    } catch { toast.error('Erreur de chargement'); }
  };

  const loadHistorique = () => {
    const params = new URLSearchParams();
    if (filtreModeles.length > 0) params.set('modele_ids', filtreModeles.join(','));
    if (filtreDateDebut) params.set('date_debut', filtreDateDebut);
    if (filtreDateFin) params.set('date_fin', filtreDateFin);
    api.get(`/executions/historique/all?${params.toString()}`).then(({ data }) => setHistorique(data)).catch(() => toast.error('Erreur'));
    if (modeles.length === 0) loadModeles();
  };

  useEffect(() => {
    setLoading(true);
    if (tab === 'aujourdhui') loadAujourdhui();
    if (tab === 'verifications') loadModeles();
    if (tab === 'historique') loadHistorique();
    setLoading(false);
  }, [tab, filtreModeles, filtreDateDebut, filtreDateFin]);

  const genererPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Historique des verifications - Mes Verifs', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Genere le ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [['Verification', 'Date', 'Non-conformites']],
      body: historique.map(h => [h.modele_nom, new Date(h.date_prevue).toLocaleDateString('fr-FR'), h.non_conformites]),
      headStyles: { fillColor: [74, 44, 42] },
    });
    return doc;
  };

  const telechargerPdf = () => {
    const doc = genererPdf();
    doc.save(`historique-verifs-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const envoyerParEmail = async () => {
    if (!emailDest) { toast.error('Adresse email requise'); return; }
    setSendingEmail(true);
    try {
      const doc = genererPdf();
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      await api.post('/historique/email', {
        destinataire: emailDest,
        pdf_base64: pdfBase64,
        titre: 'Historique des verifications - Mes Verifs'
      });
      toast.success('Email envoye');
      setShowEmailModal(false);
      setEmailDest('');
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur envoi'); }
    finally { setSendingEmail(false); }
  };

  const supprimerModele = async (id, nom) => {
    if (!window.confirm(`Supprimer "${nom}" ? Cette action est irreversible.`)) return;
    try {
      await api.delete(`/modeles/${id}`);
      toast.success('Vérification supprimée');
      loadModeles();
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
  };

  const isLate = (exec) => {
    if (!exec.heure_limite || exec.statut === 'terminee') return false;
    const now = new Date();
    const [h, m] = exec.heure_limite.split(':');
    const limite = new Date();
    limite.setHours(parseInt(h), parseInt(m), 0);
    return now > limite;
  };

  const enAttente = executions.filter(e => e.statut !== 'terminee');
  const terminees = executions.filter(e => e.statut === 'terminee');

  const tabs = [
    { id: 'aujourdhui', label: "Aujourd'hui" },
    ...(isManager() ? [{ id: 'verifications', label: 'Vérifications' }] : []),
    ...(isManager() ? [{ id: 'historique', label: 'Historique' }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 pt-4 pb-4">
        <div className="rounded-2xl px-5 py-4 mb-4 text-white print:hidden" style={{ background: 'linear-gradient(135deg, #3A2020, #5C3A37)' }}>
          <div className="flex sm:grid sm:grid-cols-3 items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img src="https://monaec.fr/logo-aec.jpg" alt="Arc en Ciel" className="h-10 sm:h-12 rounded-lg shrink-0" />
              <div className="min-w-0">
                <h1 className="text-base font-bold truncate">Bonjour, {user?.prenom}</h1>
                <p className="text-xs leading-tight hidden sm:block" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  <br />Nous fêtons les {getSaintDuJour()}
                </p>
              </div>
            </div>
            <div className="text-center font-bold text-base hidden sm:block">Mes Vérifs</div>
            <div className="flex justify-end items-center gap-2">
              <a href="/" className="hidden sm:block p-2 rounded-lg text-white hover:bg-white/10" title="Retour au portail">
                <Home size={18} />
              </a>
              <UserMenu user={user} onLogout={() => { localStorage.removeItem('sso_token'); localStorage.removeItem('sso_user'); localStorage.removeItem('sso_apps'); window.location.href = '/'; }} isRealAdmin={isRealAdmin} viewAs={viewAs} setViewAs={setViewAs} />
            </div>
          </div>
          <p className="text-xs mt-2 sm:hidden truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} — Nous fêtons les {getSaintDuJour()}
          </p>
        </div>

        {tabs.length > 1 && (
          <div className="mb-4 print:hidden">
            <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'text-white' : 'text-gray-500'}`}
                  style={tab === t.id ? { background: '#4A2C2A' } : {}}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {tab === 'aujourdhui' && (
          <>
            <div className="mb-4">
              <h1 className="text-lg font-bold text-gray-900">Aujourd'hui</h1>
              <p className="text-sm text-gray-400">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            {enAttente.length === 0 && terminees.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400"><p>Aucune vérification prévue aujourd'hui</p></div>
            )}
            {enAttente.length > 0 && (
              <div className="space-y-3 mb-6">
                {enAttente.map(exec => {
                  const late = isLate(exec);
                  const config = late ? { label: 'En retard', color: 'bg-red-100 text-red-700', icon: AlertTriangle } : STATUT_CONFIG[exec.statut];
                  const Icon = config.icon;
                  return (
                    <button key={exec.id} onClick={() => navigate(`/execution/${exec.id}`)} className="w-full bg-white rounded-xl p-4 text-left shadow-sm border-2 border-transparent hover:border-yellow-600 transition-all flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{exec.modele_nom}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{exec.heure_limite ? `À faire avant ${exec.heure_limite}` : 'À faire'}</p>
                      </div>
                      <span className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1 ${config.color}`}>
                        <Icon size={13} /> {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {terminees.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Terminées</p>
                <div className="space-y-2">
                  {terminees.map(exec => (
                    <div key={exec.id} className="bg-white rounded-xl p-3 flex items-center justify-between opacity-70">
                      <span className="text-sm text-gray-700">{exec.modele_nom}</span>
                      <CheckCircle2 size={16} className="text-green-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'verifications' && (
          <>
            <div className="flex justify-end mb-4">
              <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: '#4A2C2A' }}>
                <Plus size={16} /> Nouvelle vérification
              </button>
            </div>
            <div className="space-y-3">
              {modeles.map(m => (
                <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{m.nom}</p>
                    <p className="text-xs text-gray-400 mt-1 capitalize">{m.periodicite.replace('_', ' ')} {m.heure_limite && `· avant ${m.heure_limite}`}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={async () => { const { data } = await api.get(`/modeles/${m.id}`); setModalModele(data); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"><Edit2 size={15} /></button>
                    {isAdmin() && <button onClick={() => supprimerModele(m.id, m.nom)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"><Trash2 size={15} /></button>}
                  </div>
                </div>
              ))}
              {modeles.length === 0 && <div className="bg-white rounded-xl p-8 text-center text-gray-400">Aucune vérification configurée</div>}
            </div>
          </>
        )}

        {tab === 'historique' && (
          <>
            <div className="flex justify-between items-center mb-4 print:hidden flex-wrap gap-2">
              <h1 className="text-lg font-bold text-gray-900">Historique</h1>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-gray-300 text-gray-600">
                  <Printer size={15} /> Imprimer
                </button>
                <button onClick={telechargerPdf} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-gray-300 text-gray-600">
                  <Download size={15} /> Telecharger PDF
                </button>
                <button onClick={() => setShowEmailModal(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-white" style={{ background: '#4A2C2A' }}>
                  <Mail size={15} /> Envoyer par email
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 mb-4 shadow-sm print:hidden space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Vérifications</label>
                <div className="flex flex-wrap gap-2">
                  {modeles.map(m => (
                    <label key={m.id} className={`text-xs px-3 py-1.5 rounded-full cursor-pointer border ${filtreModeles.includes(m.id) ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                      <input type="checkbox" className="hidden" checked={filtreModeles.includes(m.id)} onChange={e => setFiltreModeles(p => e.target.checked ? [...p, m.id] : p.filter(id => id !== m.id))} />
                      {m.nom}
                    </label>
                  ))}
                  {modeles.length === 0 && <span className="text-xs text-gray-400">Chargement...</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Depuis le</label>
                  <input type="date" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" value={filtreDateDebut} onChange={e => setFiltreDateDebut(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Jusqu'au</label>
                  <input type="date" className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-sm" value={filtreDateFin} onChange={e => setFiltreDateFin(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Vérification</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Non-conformités</th>
                  </tr>
                </thead>
                <tbody>
                  {historique.map(h => (
                    <tr key={h.id} className="border-b border-gray-50">
                      <td className="px-4 py-3 text-gray-900">{h.modele_nom}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(h.date_prevue).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        {parseInt(h.non_conformites) > 0 ? (
                          <span className="text-red-600 font-medium">{h.non_conformites}</span>
                        ) : (
                          <span className="text-green-600">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {historique.length === 0 && <div className="p-8 text-center text-gray-400">Aucune vérification terminée</div>}
            </div>
          </>
        )}
      </main>
      <Footer appSource="Mes Vérifs" />

      {showNew && <ModeleModal metiers={metiers} onClose={() => setShowNew(false)} onSaved={loadModeles} />}
      {modalModele && <ModeleModal existing={modalModele} metiers={metiers} onClose={() => setModalModele(null)} onSaved={loadModeles} />}

      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Envoyer par email</h2>
              <button onClick={() => setShowEmailModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Adresse email</label>
            <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4" placeholder="destinataire@exemple.fr" value={emailDest} onChange={e => setEmailDest(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={envoyerParEmail} disabled={sendingEmail} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ background: '#4A2C2A' }}>
                {sendingEmail ? 'Envoi...' : 'Envoyer'}
              </button>
              <button onClick={() => setShowEmailModal(false)} className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-600">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
