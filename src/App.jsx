import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  X, 
  Check, 
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Bot,
  Send,
  Sparkles,
  Download,
  Upload,
  Search,
  RotateCcw,
  Target,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function App() {
  // 1. Charger les données depuis le LocalStorage (vide par défaut si rien n'est sauvegardé)
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('mon_portefeuille_tx');
    return saved ? JSON.parse(saved) : []; // ⬅️ Modifié ici : tableau vide par défaut
  });

  const [monthlyBudgetLimit, setMonthlyBudgetLimit] = useState(() => {
    const savedLimit = localStorage.getItem('mon_portefeuille_limit');
    return savedLimit ? Number(savedLimit) : 1200;
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('mon_portefeuille_dark');
    return savedTheme ? JSON.parse(savedTheme) : false;
  });

  // États pour la création
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('Alimentation');

  // État pour la modification
  const [editingTx, setEditingTx] = useState(null);

  // État pour modifier l'objectif
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState(monthlyBudgetLimit);

  // États pour la Recherche et les Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Référence pour l'import de fichier caché
  const fileInputRef = useRef(null);

  // États pour le Chatbot Oumii
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'oumii',
      text: "Bonjour ! Je suis Oumii 🤖, votre assistant budget. Ajoutez vos premières opérations pour que je puisse vous aider à analyser vos finances !"
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('mon_portefeuille_tx', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('mon_portefeuille_limit', monthlyBudgetLimit);
  }, [monthlyBudgetLimit]);

  useEffect(() => {
    localStorage.setItem('mon_portefeuille_dark', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    if (isChatOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  // 2. Calculs du budget global
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const remainingBalance = totalIncome - totalExpense;

  const percentageRemaining = totalIncome > 0 
    ? Math.max(0, Math.round((remainingBalance / totalIncome) * 100)) 
    : 0;

  const expensePercentageOfLimit = monthlyBudgetLimit > 0 
    ? Math.min(100, Math.round((totalExpense / monthlyBudgetLimit) * 100)) 
    : 0;

  // 3. Filtrage dynamique des transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedTypeFilter === 'all' || tx.type === selectedTypeFilter;
    const matchesCategory = selectedCategoryFilter === 'all' || tx.category === selectedCategoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  // 4. Ajouter une transaction
  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!title || !amount) return;

    const newTx = {
      id: Date.now(),
      title,
      amount: parseFloat(amount),
      type,
      category,
      date: new Date().toISOString().split('T')[0]
    };

    setTransactions([newTx, ...transactions]);
    setTitle('');
    setAmount('');
  };

  // 5. Supprimer une transaction
  const handleDelete = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  // 6. Enregistrer la modification
  const handleUpdateTransaction = (e) => {
    e.preventDefault();
    if (!editingTx.title || !editingTx.amount) return;

    setTransactions(transactions.map(t => 
      t.id === editingTx.id ? { ...editingTx, amount: parseFloat(editingTx.amount) } : t
    ));
    setEditingTx(null);
  };

  // 7. Enregistrer le nouvel objectif
  const handleSaveLimit = (e) => {
    e.preventDefault();
    if (tempLimit > 0) {
      setMonthlyBudgetLimit(Number(tempLimit));
      setIsEditingLimit(false);
    }
  };

  // 8. Exporter / Importer les données
  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mon_portefeuille_sauvegarde_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportData = (e) => {
    const fileReader = new FileReader();
    if (e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target.result);
          if (Array.isArray(parsedData)) {
            setTransactions(parsedData);
            alert("Données importées avec succès !");
          } else {
            alert("Format de fichier invalide.");
          }
        } catch (error) {
          alert("Erreur lors de la lecture du fichier.");
        }
      };
    }
  };

  // 9. Logique d'Oumii
  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim()) return;

    const userMsg = { sender: 'user', text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    if (!textToSend) setInputMessage('');

    setTimeout(() => {
      let responseText = "";
      const lower = text.toLowerCase();

      if (lower.includes('analyse') || lower.includes('dépense') || lower.includes('depense')) {
        if (totalExpense === 0) {
          responseText = "Vous n'avez pas encore enregistré de dépenses !";
        } else {
          const topCategory = expenseData.sort((a,b) => b.value - a.value)[0];
          responseText = `Vos dépenses totales s'élèvent à ${totalExpense.toLocaleString('fr-FR')} € sur un objectif de ${monthlyBudgetLimit.toLocaleString('fr-FR')} €.\n\n` +
            `Votre plus gros poste est "${topCategory ? topCategory.name : 'N/A'}" (${topCategory ? topCategory.value.toLocaleString('fr-FR') : 0} €).`;
        }
      } 
      else if (lower.includes('économiser') || lower.includes('economiser') || lower.includes('conseil')) {
        if (totalExpense > monthlyBudgetLimit) {
          responseText = `Attention ! Vous avez dépassé votre objectif de dépenses de ${(totalExpense - monthlyBudgetLimit).toLocaleString('fr-FR')} €.`;
        } else if (percentageRemaining > 30) {
          responseText = `Excellente gestion ! Il vous reste ${percentageRemaining}% de vos revenus (${remainingBalance.toLocaleString('fr-FR')} €) et vous respectez votre plafond.`;
        } else {
          responseText = `Attention, il ne vous reste que ${percentageRemaining}% de vos revenus (${remainingBalance.toLocaleString('fr-FR')} €).`;
        }
      } 
      else if (lower.includes('50/30/20') || lower.includes('règle') || lower.includes('regle')) {
        const needs = Math.round(totalIncome * 0.5);
        const wants = Math.round(totalIncome * 0.3);
        const savings = Math.round(totalIncome * 0.2);
        responseText = `Règle 50/30/20 pour ${totalIncome.toLocaleString('fr-FR')} € :\n• 50% Besoins : ${needs} €\n• 30% Envies : ${wants} €\n• 20% Épargne : ${savings} €`;
      }
      else {
        responseText = `Je suis Oumii ! Votre reste disponible est de ${remainingBalance.toLocaleString('fr-FR')} € et votre plafond est fixé à ${monthlyBudgetLimit.toLocaleString('fr-FR')} €.`;
      }

      setMessages([...updatedMessages, { sender: 'oumii', text: responseText }]);
    }, 500);
  };

  // 10. Données pour le graphique
  const expenseData = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, curr) => {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
      return acc;
    }, []);

  const COLORS = ['#059669', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedTypeFilter('all');
    setSelectedCategoryFilter('all');
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between p-4 md:p-8 max-w-7xl mx-auto relative transition-colors duration-200 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
      <div>
        {/* Header avec Logo à gauche, Titre centré et Actions à droite */}
        <header className={`grid grid-cols-3 items-center pb-6 mb-8 border-b transition-colors ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          
          <div className="flex items-center justify-start">
            <img 
              src="/logo.png" 
              alt="Logo Mon Portefeuille" 
              className="h-12 w-auto object-contain"
            />
          </div>

          <div className="text-center">
            <h1 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Mon Portefeuille
            </h1>
            <p className={`text-xs md:text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Gérez votre budget facilement et en toute confidentialité
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2.5 border rounded-xl shadow-sm transition flex items-center justify-center ${isDarkMode ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              title={isDarkMode ? "Passer en mode clair" : "Passer en mode sombre"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            <button 
              onClick={handleExportData}
              className={`p-2.5 border rounded-xl shadow-sm transition flex items-center gap-1.5 text-xs font-medium ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              title="Sauvegarder (Exporter)"
            >
              <Download className="w-4 h-4 text-[#059669]" />
              <span className="hidden sm:inline">Sauvegarder</span>
            </button>

            <button 
              onClick={() => fileInputRef.current.click()}
              className={`p-2.5 border rounded-xl shadow-sm transition flex items-center gap-1.5 text-xs font-medium ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              title="Restaurer (Importer)"
            >
              <Upload className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Restaurer</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportData} 
              accept=".json" 
              className="hidden" 
            />
          </div>
        </header>

        {/* Cards de résumé */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          <div className={`border p-6 rounded-2xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <div className={`flex justify-between items-center mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="text-sm font-medium">Revenus</span>
              <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-50 text-[#059669]'}`}>
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-[#059669]">
              +{totalIncome.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>

          <div className={`border p-6 rounded-2xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <div className={`flex justify-between items-center mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="text-sm font-medium">Dépenses</span>
              <div className="p-1.5 bg-red-50 dark:bg-red-950/60 rounded-lg text-red-500">
                <ArrowDownRight className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-red-500">
              -{totalExpense.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>

          <div className={`border p-6 rounded-2xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200/80'}`}>
            <div className={`flex justify-between items-center mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="text-sm font-medium">Reste disponible</span>
              <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-50 text-[#059669]'}`}>
                <PiggyBank className="w-5 h-5" />
              </div>
            </div>
            <p className={`text-3xl font-extrabold ${remainingBalance >= 0 ? (isDarkMode ? 'text-white' : 'text-slate-900') : 'text-red-500'}`}>
              {remainingBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
            {totalIncome > 0 && (
              <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
                Il vous reste <span className="font-semibold text-[#059669]">{percentageRemaining}%</span> de votre budget.
              </p>
            )}
          </div>

        </div>

        {/* Objectif de Dépenses & Barre de Progression */}
        <div className={`border p-6 rounded-2xl shadow-sm mb-8 transition-colors ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200/80'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-emerald-50 text-[#059669] border-emerald-200'}`}>
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Objectif de dépenses mensuel</h3>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Plafond fixé à <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{monthlyBudgetLimit.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
                </p>
              </div>
            </div>

            <button 
              onClick={() => { setTempLimit(monthlyBudgetLimit); setIsEditingLimit(true); }}
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl transition font-medium ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
            >
              <Settings className="w-3.5 h-3.5" /> Modifier l'objectif
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Dépenses actuelles : {totalExpense.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</span>
              <span className={`${totalExpense > monthlyBudgetLimit ? 'text-red-500 font-bold' : (isDarkMode ? 'text-slate-300' : 'text-slate-600')}`}>
                {expensePercentageOfLimit}% du plafond
              </span>
            </div>
            <div className={`w-full h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <div 
                className={`h-full transition-all duration-500 ${
                  totalExpense > monthlyBudgetLimit 
                    ? 'bg-red-500' 
                    : expensePercentageOfLimit > 80 
                    ? 'bg-amber-500' 
                    : 'bg-[#059669]'
                }`}
                style={{ width: `${expensePercentageOfLimit}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Contenu principal en 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Formulaire & Graphique */}
          <div className="space-y-8">
            <div className={`border p-6 rounded-2xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200/80'}`}>
              <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                <PlusCircle className="w-5 h-5 text-[#059669]" /> Ajouter une opération
              </h2>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Titre</label>
                  <input 
                    type="text" 
                    placeholder="ex: Courses, Salaire..." 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] transition ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Montant (€)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className={`w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] transition ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                      required
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Type</label>
                    <select 
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className={`w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] transition ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    >
                      <option value="expense">Dépense</option>
                      <option value="income">Revenu</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Catégorie</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] transition ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  >
                    <option value="Alimentation">Alimentation</option>
                    <option value="Logement">Logement</option>
                    <option value="Transports">Transports</option>
                    <option value="Loisirs">Loisirs</option>
                    <option value="Revenu">Revenu</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#059669] hover:bg-[#047857] text-white font-semibold py-2.5 rounded-xl transition shadow-sm hover:shadow"
                >
                  Ajouter la transaction
                </button>
              </form>
            </div>

            {expenseData.length > 0 && (
              <div className={`border p-6 rounded-2xl shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200/80'}`}>
                <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  <PieChartIcon className="w-5 h-5 text-[#059669]" /> Répartition des dépenses
                </h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expenseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => `${value} €`}
                        contentStyle={{ 
                          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', 
                          border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0', 
                          borderRadius: '12px', 
                          color: isDarkMode ? '#fff' : '#000',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' 
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Historique des Transactions avec Recherche & Filtres */}
          <div className={`border p-6 rounded-2xl shadow-sm flex flex-col transition-colors ${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200/80'} lg:col-span-2`}>
            
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Historique des opérations</h2>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
                  {filteredTransactions.length} opération{filteredTransactions.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full border rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#059669] transition ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>

                <select 
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className={`border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#059669] transition ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  <option value="all">Tous les types</option>
                  <option value="expense">Dépenses uniquement</option>
                  <option value="income">Revenus uniquement</option>
                </select>

                <select 
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className={`border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#059669] transition ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  <option value="all">Toutes les catégories</option>
                  <option value="Alimentation">Alimentation</option>
                  <option value="Logement">Logement</option>
                  <option value="Transports">Transports</option>
                  <option value="Loisirs">Loisirs</option>
                  <option value="Revenu">Revenu</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[520px] pr-2">
              {filteredTransactions.length === 0 ? (
                <div className={`text-center py-12 rounded-2xl border border-dashed ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50/50 border-slate-200'}`}>
                  <p className="text-slate-400 text-sm mb-2">Aucune transaction pour le moment.</p>
                  <p className="text-xs text-slate-500">Utilisez le formulaire à gauche pour ajouter vos revenus et dépenses.</p>
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <div 
                    key={tx.id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition ${isDarkMode ? 'bg-slate-900/70 border-slate-700/60 hover:border-slate-600' : 'bg-slate-50/70 border-slate-200/60 hover:border-slate-300'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl ${tx.type === 'income' ? (isDarkMode ? 'bg-emerald-950 text-emerald-400' : 'bg-emerald-100 text-[#059669]') : (isDarkMode ? 'bg-red-950/60 text-red-400' : 'bg-red-100 text-red-500')}`}>
                        {tx.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{tx.title}</p>
                        <p className="text-xs text-slate-400">{tx.category} • {tx.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`font-bold mr-2 ${tx.type === 'income' ? 'text-[#059669]' : (isDarkMode ? 'text-slate-200' : 'text-slate-800')}`}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </span>

                      <button 
                        onClick={() => setEditingTx(tx)}
                        className={`p-1.5 rounded-lg transition ${isDarkMode ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800' : 'text-slate-400 hover:text-[#059669] hover:bg-emerald-50'}`}
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button 
                        onClick={() => handleDelete(tx.id)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Modale d'Édition de Transaction */}
      {editingTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-6 w-full max-w-md border shadow-xl ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className={`flex justify-between items-center mb-4 pb-3 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#059669]" /> Modifier la transaction
              </h3>
              <button 
                onClick={() => setEditingTx(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTransaction} className="space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Titre</label>
                <input 
                  type="text" 
                  value={editingTx.title}
                  onChange={(e) => setEditingTx({ ...editingTx, title: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] transition ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Montant (€)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editingTx.amount}
                    onChange={(e) => setEditingTx({ ...editingTx, amount: e.target.value })}
                    className={`w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] transition ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Type</label>
                  <select 
                    value={editingTx.type}
                    onChange={(e) => setEditingTx({ ...editingTx, type: e.target.value })}
                    className={`w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] transition ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  >
                    <option value="expense">Dépense</option>
                    <option value="income">Revenu</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Catégorie</label>
                <select 
                  value={editingTx.category}
                  onChange={(e) => setEditingTx({ ...editingTx, category: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] transition ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                >
                  <option value="Alimentation">Alimentation</option>
                  <option value="Logement">Logement</option>
                  <option value="Transports">Transports</option>
                  <option value="Loisirs">Loisirs</option>
                  <option value="Revenu">Revenu</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className={`flex-1 font-semibold py-2.5 rounded-xl transition ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[#059669] hover:bg-[#047857] text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale de Modification de l'Objectif */}
      {isEditingLimit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl p-6 w-full max-w-md border shadow-xl ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className={`flex justify-between items-center mb-4 pb-3 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-[#059669]" /> Définir l'objectif mensuel
              </h3>
              <button 
                onClick={() => setIsEditingLimit(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLimit} className="space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Plafond de dépenses maximum (€)</label>
                <input 
                  type="number" 
                  step="1"
                  min="1"
                  value={tempLimit}
                  onChange={(e) => setTempLimit(e.target.value)}
                  className={`w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#059669] transition ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsEditingLimit(false)}
                  className={`flex-1 font-semibold py-2.5 rounded-xl transition ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[#059669] hover:bg-[#047857] text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHATBOT FLOTTANT : OUMII */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isChatOpen ? (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="w-14 h-14 bg-[#059669] hover:bg-[#047857] text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 group relative"
            title="Parler à Oumii"
          >
            <Bot className="w-7 h-7" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-white rounded-full animate-pulse"></span>
          </button>
        ) : (
          <div className={`border shadow-2xl rounded-2xl w-[90vw] sm:w-96 h-[500px] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            
            <div className="bg-[#059669] text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full border border-white/20">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-none flex items-center gap-1.5">
                    Oumii <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                  </h3>
                  <span className="text-[11px] text-emerald-100">Assistant Budget</span>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="text-emerald-100 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className={`flex-1 p-4 overflow-y-auto space-y-3 ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50/50'}`}>
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-3 rounded-2xl text-xs whitespace-pre-line leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-[#059669] text-white rounded-br-none shadow-sm' 
                        : (isDarkMode ? 'bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-none shadow-sm' : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-none shadow-sm')
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className={`p-2 border-t flex gap-2 overflow-x-auto no-scrollbar ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
              <button 
                onClick={() => handleSendMessage("Analyse mes dépenses")}
                className={`text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap border transition ${isDarkMode ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800 hover:bg-emerald-900' : 'bg-emerald-50 text-[#059669] border-emerald-200/60 hover:bg-emerald-100'}`}
              >
                📊 Analyse mes dépenses
              </button>
              <button 
                onClick={() => handleSendMessage("Comment économiser ?")}
                className={`text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap border transition ${isDarkMode ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800 hover:bg-emerald-900' : 'bg-emerald-50 text-[#059669] border-emerald-200/60 hover:bg-emerald-100'}`}
              >
                💡 Conseils d'épargne
              </button>
              <button 
                onClick={() => handleSendMessage("Règle 50/30/20")}
                className={`text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap border transition ${isDarkMode ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800 hover:bg-emerald-900' : 'bg-emerald-50 text-[#059669] border-emerald-200/60 hover:bg-emerald-100'}`}
              >
                📐 Règle 50/30/20
              </button>
            </div>

            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
              className={`p-3 border-t flex gap-2 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
            >
              <input 
                type="text" 
                placeholder="Posez une question à Oumii..." 
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className={`flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#059669] transition ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
              />
              <button 
                type="submit"
                className="bg-[#059669] hover:bg-[#047857] text-white p-2 rounded-xl transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>
        )}
      </div>

      {/* Footer Centré */}
      <footer className={`pt-6 border-t flex justify-center items-center text-xs transition-colors ${isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
        <div>
          © {new Date().getFullYear()} Mon Portefeuille — Gestion de budget privée & rapide
        </div>
      </footer>
    </div>
  );
}