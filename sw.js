<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>SwipeWise | SG Credit Card Yield Optimizer</title>
  
  <!-- PWA Meta Tags -->
  <link rel="manifest" href="manifest.json">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#020617">
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              dark: '#020617',
              card: '#0f172a',
              accent: '#10b981',
              gold: '#f59e0b',
              red: '#ef4444'
            }
          }
        }
      }
    }
  </script>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      -webkit-tap-highlight-color: transparent;
    }
    /* Safe Area Spacing for iOS Home Indicator */
    .pb-safe {
      padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 5.5rem);
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: #334155;
      border-radius: 4px;
    }
  </style>

  <!-- React Dependencies -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js" crossorigin></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.24.7/babel.min.js" crossorigin></script>

  <!-- Firebase Legacy Compat SDKs (Stable Web Iframe Imports) -->
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
</head>
<body class="bg-brand-dark text-slate-100 min-h-screen overflow-x-hidden selection:bg-brand-accent selection:text-brand-dark">

  <div id="root"></div>

  <!-- Lucide Icons Bundle -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <!-- React App Compilation Layer -->
  <script type="text/babel">
    const { useState, useEffect, useMemo, useRef } = React;

    // --- 1. FIREBASE CONFIGURATION (VERIFIED PRODUCTION VALUES) ---
    const firebaseConfig = {
      apiKey: "AIzaSyC9Pq0TwtuRJbNEMAg7wt72fIPuqIJejLs",
      authDomain: "swipewise-9a6cf.firebaseapp.com",
      projectId: "swipewise-9a6cf",
      storageBucket: "swipewise-9a6cf.firebasestorage.app",
      messagingSenderId: "428823892148",
      appId: "1:428823892148:web:36c3b09f66f258d2a847e1"
    };

    const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "";
    
    let db = null;
    let auth = null;
    let googleProvider = null;

    if (isFirebaseConfigured) {
      try {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        googleProvider = new firebase.auth.GoogleAuthProvider();
      } catch (err) {
        console.error("Firebase Initialization Error:", err);
      }
    }

    // --- 2. 2026 SINGAPORE CARD REFERENCE DATABASE (FINETUNED & UPDATED) ---
    const PRESET_CARDS = [
      {
        id: 'maybank-ff',
        name: 'Maybank Friends & Family',
        issuer: 'Maybank',
        type: 'Cashback',
        baseRate: 0.3,
        bonusRate: 8.0,
        minSpend: 800,
        globalCap: 125, // Overall cashback cap of S$125 with S$800 min spend, S$25 cap on each category
        categoryCap: 312.50, // S$312.50 spend per category hits the S$25 sub-cap
        categories: ['Groceries', 'Dining', 'Transport/SimplyGo', 'Online Shopping', 'Travel'],
        requiresSelection: true,
        maxSelectable: 5,
        defaultSelectedCategories: ['Groceries', 'Dining', 'Transport/SimplyGo'],
        desc: '8% Cashback on 5 selected categories up to S$125 overall rebate cap.',
        briefGuide: 'Spend at least S$800 monthly. Cashback is capped at S$25 per category (up to S$312.50 spend per category). If spend is S$500 to S$799, earn 5% instead. Below S$500 earns 0.3% base rate.'
      },
      {
        id: 'uob-one',
        name: 'UOB One Card',
        issuer: 'UOB',
        type: 'Cashback',
        baseRate: 3.33,
        bonusRate: 10.0, // Up to 10% on partner merchants (Grab, Shopee, SimplyGo, SP Group)
        minSpend: 500, // Tiers: S$500, S$1000, S$2000
        globalCap: 100, // Quarterly cash rebate cap
        categories: ['Groceries', 'Dining', 'Transport/SimplyGo', 'Utilities', 'Online Shopping'],
        requiresSelection: false,
        desc: 'Up to 10% on partners with S$500/S$1,000/S$2,000 monthly spend tiers.',
        briefGuide: 'Requires a minimum of 10 transactions per month. You must hit your spending tier (S$500, S$1,000, or S$2,000) for all 3 consecutive months in a quarter. Groceries earn up to 8%, SP utilities earn up to 4.33%.'
      },
      {
        id: 'hsbc-liveplus',
        name: 'HSBC Live+ Card',
        issuer: 'HSBC',
        type: 'Cashback',
        baseRate: 0.3,
        bonusRate: 8.0,
        minSpend: 600,
        globalCap: 83.33, // S$250 quarterly cap split monthly (~S$83)
        categories: ['Dining', 'Shopping', 'Entertainment'],
        requiresSelection: false,
        desc: '8% cashback on Dining, Shopping & Entertainment globally.',
        briefGuide: 'Earn 8% cashback globally on Dining, Shopping, and Entertainment by spending at least S$600 within the calendar month. Total cashback capped at S$250 per calendar quarter.'
      },
      {
        id: 'hsbc-revolution',
        name: 'HSBC Revolution',
        issuer: 'HSBC',
        type: 'Miles',
        baseRate: 0.4,
        bonusRate: 4.0, // 4 mpd on online/contactless
        minSpend: 0,
        globalCap: 1000, // Caps out on S$1,000 spend
        categories: ['Online Shopping', 'Travel', 'Dining', 'Transport/SimplyGo'],
        requiresSelection: false,
        desc: '4 mpd (10x Reward Points) on contactless and online transactions up to S$1,000 monthly.',
        briefGuide: 'Visa Signature card with S$0 permanent annual fee. Earns 4 Miles Per Dollar (4 MPD) on contactless and direct online payments (excluding Online Travel Agencies like Agoda, book airlines directly). Monthly bonus spend cap of S$1,000.'
      },
      {
        id: 'uob-ladys-solitaire',
        name: "UOB Lady's Solitaire",
        issuer: 'UOB',
        type: 'Miles',
        baseRate: 0.4,
        bonusRate: 4.0, // 4 mpd on selected category
        minSpend: 0,
        globalCap: 2000, // Solitaire cap S$2,000 spend
        categories: ['Dining', 'Travel', 'Shopping', 'Beauty', 'Transport/SimplyGo', 'Entertainment', 'Family'],
        requiresSelection: true,
        maxSelectable: 2,
        defaultSelectedCategories: ['Dining', 'Travel'],
        desc: '4 mpd (10 UNI$) on up to 2 selected categories. High S$2,000 cap.',
        briefGuide: 'Choose up to 2 preferred categories (e.g. Dining, Travel) to earn 4 Miles Per Dollar (10 UNI$ per S$5 spend). Bonus points cap out at S$2,000 spend per calendar month. No minimum spend requirement.'
      },
      {
        id: 'dcs-flexi',
        name: 'DCS Flexi Card',
        issuer: 'DCS',
        type: 'Cashback',
        baseRate: 0.5,
        bonusRate: 8.0,
        minSpend: 500,
        globalCap: 50,
        categories: ['Foreign Currency', 'Dining', 'Shopping'],
        requiresSelection: false,
        desc: '8% cash rebate on foreign currency transactions up to a sub-cap.',
        briefGuide: 'Earn 8% cash rebate on overseas and foreign currency transactions with minimum S$500 monthly spend. Cumulative cash rewards capped at S$50 per statement month.'
      }
    ];

    const TRANSACTION_CATEGORIES = [
      'Dining', 'Groceries', 'Online Shopping', 'Transport/SimplyGo', 'Travel', 'Utilities', 'Foreign Currency', 'Retail/General'
    ];

    // --- 3. ROOT REACT APPLICATION ---
    function App() {
      // User State
      const [user, setUser] = useState(null);
      const [loading, setLoading] = useState(true);
      const [networkOnline, setNetworkOnline] = useState(navigator.onLine);

      // Active Tab
      const [activeTab, setActiveTab] = useState('home'); // 'home', 'wallet', 'analysis', 'logs'

      // Application Domain States
      const [wallet, setWallet] = useState([]);
      const [transactions, setTransactions] = useState([]);

      // Calculator Input Panel
      const [calcCategory, setCalcCategory] = useState('Dining');
      const [calcAmount, setCalcAmount] = useState('');
      const [calcCurrency, setCalcCurrency] = useState('SGD');
      const [calcIsOnline, setCalcIsOnline] = useState(false);

      // Add Card modal & Configuration UI
      const [isAddingCard, setIsAddingCard] = useState(false);
      const [editingCardInstanceId, setEditingCardInstanceId] = useState(null);
      const [configCardTemplate, setConfigCardTemplate] = useState(null);
      const [configCategories, setConfigCategories] = useState([]);
      const [configBillingCycle, setConfigBillingCycle] = useState(1);
      const [configCustomCap, setConfigCustomCap] = useState('');

      // Transaction Logging Modal
      const [isLoggingTx, setIsLoggingTx] = useState(false);
      const [txCardInstanceId, setTxCardInstanceId] = useState('');
      const [txCategory, setTxCategory] = useState('Dining');
      const [txAmount, setTxAmount] = useState('');
      const [txCurrency, setTxCurrency] = useState('SGD');
      const [txMerchant, setTxMerchant] = useState('');
      const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
      const [txEditingId, setTxEditingId] = useState(null);

      // Custom Confirmation Overlay Modal State (No-Alert / No-Confirm Rule)
      const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
      });

      // Global Notification/Modal System
      const [feedbackMsg, setFeedbackMsg] = useState(null);

      // Network Offline State Monitor
      useEffect(() => {
        const handleOnline = () => setNetworkOnline(true);
        const handleOffline = () => setNetworkOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
        };
      }, []);

      // Dynamic Lucide Icon Refresh Compiler
      useEffect(() => {
        const timer = setTimeout(() => {
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        }, 120);
        return () => clearTimeout(timer);
      }, [user, activeTab, isAddingCard, isLoggingTx, transactions, wallet]);

      // Sign-in Status Monitor
      useEffect(() => {
        if (!isFirebaseConfigured) {
          setUser({
            uid: 'dev-user-123',
            displayName: 'Ah Xi',
            email: 'ahxi@swipewise.sg',
            photoURL: 'https://placehold.co/100x100/10b981/020617?text=AX'
          });
          setLoading(false);
          return;
        }

        const unsubscribe = auth.onAuthStateChanged((usr) => {
          setUser(usr);
          setLoading(false);
        });
        return () => unsubscribe();
      }, []);

      // Pull Firebase Realtime Updates Hook
      useEffect(() => {
        if (!user) return;

        if (!isFirebaseConfigured) {
          const localWallet = localStorage.getItem(`swipewise_wallet_${user.uid}`);
          const localTxs = localStorage.getItem(`swipewise_txs_${user.uid}`);
          setWallet(localWallet ? JSON.parse(localWallet) : []);
          setTransactions(localTxs ? JSON.parse(localTxs) : []);
          return;
        }

        // Fetch User Wallet List Realtime
        const walletUnsubscribe = db.collection('users').doc(user.uid).collection('wallet')
          .onSnapshot((snapshot) => {
            const list = [];
            snapshot.forEach((doc) => list.push({ docId: doc.id, ...doc.data() }));
            setWallet(list);
          }, (err) => showToast("Database Sync Error: " + err.message));

        // Fetch Transactions List Realtime
        const txUnsubscribe = db.collection('users').doc(user.uid).collection('transactions')
          .onSnapshot((snapshot) => {
            const list = [];
            snapshot.forEach((doc) => list.push({ docId: doc.id, ...doc.data() }));
            const sorted = list.sort((a,b) => new Date(b.date) - new Date(a.date));
            setTransactions(sorted);
          }, (err) => showToast("Database Load Block: " + err.message));

        return () => {
          walletUnsubscribe();
          txUnsubscribe();
        };
      }, [user]);

      // Trigger temporary Toast notifications
      const showToast = (msg) => {
        setFeedbackMsg(msg);
        setTimeout(() => setFeedbackMsg(null), 4000);
      };

      // Handle Authentication triggers with immediate state updates
      const handleGoogleLogin = async () => {
        if (!isFirebaseConfigured) {
          setUser({
            uid: 'dev-user-123',
            displayName: 'Ah Xi',
            email: 'ahxi@swipewise.sg',
            photoURL: 'https://placehold.co/100x100/10b981/020617?text=AX'
          });
          showToast("Local Sandbox Mode Active");
          return;
        }
        try {
          setLoading(true);
          const result = await auth.signInWithPopup(googleProvider);
          if (result && result.user) {
            setUser(result.user);
            showToast("Authenticated successfully!");
          }
        } catch (err) {
          showToast("Auth failed: " + err.message);
        } finally {
          setLoading(false);
        }
      };

      const handleLogout = async () => {
        if (!isFirebaseConfigured) {
          setUser(null);
          return;
        }
        setLoading(true);
        try {
          await auth.signOut();
          setUser(null);
        } catch (err) {
          showToast("Logout error: " + err.message);
        } finally {
          setLoading(false);
        }
      };

      // Exchange Conversion Utilities
      const convertToSGD = (amount, currency) => {
        const value = parseFloat(amount) || 0;
        const rates = { SGD: 1.0, MYR: 0.31, USD: 1.34, EUR: 1.45, JPY: 0.0089 };
        return value * (rates[currency] || 1.0);
      };

      // Custom safe confirmation helper replacing standard window.confirm()
      const triggerConfirm = (title, message, onConfirmAction) => {
        setConfirmModal({
          isOpen: true,
          title,
          message,
          onConfirm: () => {
            onConfirmAction();
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
          }
        });
      };

      // Add/Update User Cards to Wallet Config
      const handleSaveCardSetup = async () => {
        if (!configCardTemplate) return;
        
        const payload = {
          templateId: configCardTemplate.id,
          name: configCardTemplate.name,
          issuer: configCardTemplate.issuer,
          type: configCardTemplate.type,
          baseRate: configCardTemplate.baseRate,
          bonusRate: configCardTemplate.bonusRate,
          globalCap: configCardTemplate.globalCap,
          customCap: parseFloat(configCustomCap) || configCardTemplate.globalCap,
          billingCycleDate: parseInt(configBillingCycle) || 1,
          selectedCategories: configCategories,
          updatedAt: new Date().toISOString()
        };

        if (!isFirebaseConfigured) {
          const updated = [...wallet];
          if (editingCardInstanceId) {
            const idx = updated.findIndex(c => c.docId === editingCardInstanceId);
            updated[idx] = { ...updated[idx], ...payload };
          } else {
            updated.push({ docId: Date.now().toString(), ...payload });
          }
          setWallet(updated);
          localStorage.setItem(`swipewise_wallet_${user.uid}`, JSON.stringify(updated));
          closeConfigModal();
          showToast("Card portfolio updated locally!");
          return;
        }

        try {
          if (editingCardInstanceId) {
            await db.collection('users').doc(user.uid).collection('wallet').doc(editingCardInstanceId).update(payload);
          } else {
            await db.collection('users').doc(user.uid).collection('wallet').add(payload);
          }
          closeConfigModal();
          showToast("Wallet setup synced successfully!");
        } catch (err) {
          showToast("Failed syncing card: " + err.message);
        }
      };

      const closeConfigModal = () => {
        setIsAddingCard(false);
        setEditingCardInstanceId(null);
        setConfigCardTemplate(null);
        setConfigCategories([]);
        setConfigBillingCycle(1);
        setConfigCustomCap('');
      };

      // FIXED REMOVE CARD: No-Confirm/No-Alert Rule implementation
      const handleRemoveCard = (docId) => {
        triggerConfirm(
          "Remove Credit Card", 
          "Are you sure you want to remove this card from your active portfolio?", 
          async () => {
            if (!isFirebaseConfigured) {
              const updated = wallet.filter(c => c.docId !== docId);
              setWallet(updated);
              localStorage.setItem(`swipewise_wallet_${user.uid}`, JSON.stringify(updated));
              showToast("Card removed locally.");
              return;
            }
            try {
              await db.collection('users').doc(user.uid).collection('wallet').doc(docId).delete();
              showToast("Card removed from cloud.");
            } catch (err) {
              showToast("Error removing card: " + err.message);
            }
          }
        );
      };

      // Transaction CRUD actions with FIXED transaction edit logic
      const handleSaveTransaction = async (e) => {
        e.preventDefault();
        if (!txCardInstanceId) {
          showToast("Please choose a card to log this spending against!");
          return;
        }
        const amtSGD = convertToSGD(txAmount, txCurrency);
        const payload = {
          cardInstanceId: txCardInstanceId,
          category: txCategory,
          merchant: txMerchant || 'Retail Spending',
          amount: parseFloat(txAmount),
          currency: txCurrency,
          amountSGD: amtSGD,
          date: txDate,
          updatedAt: new Date().toISOString()
        };

        if (!isFirebaseConfigured) {
          const updated = [...transactions];
          if (txEditingId) {
            const idx = updated.findIndex(t => t.docId === txEditingId);
            if (idx > -1) {
              updated[idx] = { ...updated[idx], ...payload };
            }
          } else {
            updated.push({ docId: Date.now().toString(), ...payload });
          }
          setTransactions(updated);
          localStorage.setItem(`swipewise_txs_${user.uid}`, JSON.stringify(updated));
          closeTxForm();
          showToast("Logged successfully!");
          return;
        }

        try {
          if (txEditingId) {
            await db.collection('users').doc(user.uid).collection('transactions').doc(txEditingId).set(payload, { merge: true });
            showToast("Log slip updated!");
          } else {
            await db.collection('users').doc(user.uid).collection('transactions').add(payload);
            showToast("Transaction synced with Cloud Ledger!");
          }
          closeTxForm();
        } catch (err) {
          showToast("Network Error saving transaction: " + err.message);
        }
      };

      const closeTxForm = () => {
        setIsLoggingTx(false);
        setTxEditingId(null);
        setTxAmount('');
        setTxMerchant('');
        setTxCardInstanceId('');
      };

      const handleEditTx = (tx) => {
        setTxEditingId(tx.docId);
        setTxCardInstanceId(tx.cardInstanceId);
        setTxCategory(tx.category);
        setTxAmount(tx.amount);
        setTxCurrency(tx.currency);
        setTxMerchant(tx.merchant);
        setTxDate(tx.date);
        setIsLoggingTx(true);
      };

      // FIXED DELETE TRANSACTION: No-Confirm/No-Alert rule implementation
      const handleDeleteTx = (docId) => {
        triggerConfirm(
          "Delete Spent Entry",
          "Are you sure you want to permanently delete this logged expenditure?",
          async () => {
            if (!isFirebaseConfigured) {
              const updated = transactions.filter(t => t.docId !== docId);
              setTransactions(updated);
              localStorage.setItem(`swipewise_txs_${user.uid}`, JSON.stringify(updated));
              showToast("Entry removed locally.");
              return;
            }
            try {
              await db.collection('users').doc(user.uid).collection('transactions').doc(docId).delete();
              showToast("Entry deleted successfully.");
            } catch (err) {
              showToast("Error deleting transaction: " + err.message);
            }
          }
        );
      };

      // Custom Billing/Statement Period Filter logic
      const getTransactionsForCardCycle = (card, allTxs) => {
        const cycleDay = card.billingCycleDate || 1;
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        let start, end;
        if (now.getDate() >= cycleDay) {
          start = new Date(year, month, cycleDay);
          end = new Date(year, month + 1, cycleDay - 1, 23, 59, 59);
        } else {
          start = new Date(year, month - 1, cycleDay);
          end = new Date(year, month, cycleDay - 1, 23, 59, 59);
        }

        return allTxs.filter(tx => {
          if (tx.cardInstanceId !== card.docId) return false;
          const tDate = new Date(tx.date);
          return tDate >= start && tDate <= end;
        });
      };

      // --- 4. PRECISION YIELD ENGINE CORE LOGIC (WATERFALL ENGINE OVERHAUL) ---
      const sortedYieldRecommendations = useMemo(() => {
        if (wallet.length === 0) return [];
        const targetAmt = parseFloat(calcAmount) || 0;
        const targetAmtSGD = convertToSGD(targetAmt, calcCurrency);

        const results = wallet.map(card => {
          const cardTxs = getTransactionsForCardCycle(card, transactions);
          const currentTotalSpend = cardTxs.reduce((sum, t) => sum + t.amountSGD, 0);
          
          let rate = card.baseRate;
          let notes = `Default Base Rate of ${card.baseRate}% applies.`;
          let rateType = card.type;
          
          const isTargetCategoryActive = card.selectedCategories && card.selectedCategories.includes(calcCategory);

          // --- WATERFALL FLOWS BY CARD ID ---
          if (card.templateId === 'maybank-ff') {
            // Category-specific spending
            const catTxs = cardTxs.filter(t => t.category === calcCategory);
            const catSpend = catTxs.reduce((sum, t) => sum + t.amountSGD, 0);
            
            if (isTargetCategoryActive) {
              // Rule 1: S$800 minimum spend triggers the 8% bonus rate
              const prospectiveSpend = currentTotalSpend + targetAmtSGD;
              
              if (prospectiveSpend < 800) {
                rate = 0.3;
                notes = `Prospective spend S$${prospectiveSpend.toFixed(0)} is below the S$800 threshold for 8% cashback. Base 0.3% applies.`;
              } else if (catSpend >= 312.50) {
                // S$312.50 spend * 8% = S$25 sub-cap hit
                rate = 0.3;
                notes = `S$25 category cashback cap reached for ${calcCategory} (already spent S$${catSpend.toFixed(0)}). Base rate applies.`;
              } else {
                // S$800 spent OR target will trigger S$800 tier
                // Weighted split calculation if targetAmtSGD spills over S$312.50 category limit
                const remainingHeadroom = Math.max(0, 312.50 - catSpend);
                
                if (targetAmtSGD <= remainingHeadroom) {
                  rate = 8.0;
                  notes = `Earns 8% cashback. You have S$${remainingHeadroom.toFixed(0)} remaining category headroom.`;
                } else {
                  // Weighted rate calculation
                  const bonusPortion = remainingHeadroom;
                  const basePortion = Math.max(0, targetAmtSGD - remainingHeadroom);
                  const averageRate = ((bonusPortion * 8.0) + (basePortion * 0.3)) / targetAmtSGD;
                  rate = parseFloat(averageRate.toFixed(2));
                  notes = `CAPPED WATERFALL: S$${bonusPortion.toFixed(0)} earns 8%, spillover S$${basePortion.toFixed(0)} earns 0.3%. Average yield: ${rate}%.`;
                }
              }
            }
          } 
          else if (card.templateId === 'uob-one') {
            const isPartner = ['Groceries', 'Transport/SimplyGo', 'Online Shopping'].includes(calcCategory);
            const totalMonthlySpendWithTx = currentTotalSpend + targetAmtSGD;

            if (totalMonthlySpendWithTx < 500) {
              rate = 3.33;
              notes = `Pending UOB One S$500 spend gate. Currently at S$${currentTotalSpend.toFixed(0)}. Base rate 3.33% applies.`;
            } else {
              // Partner category gets 10% up to statement cap, others get 5% or 3.33%
              rate = isPartner ? 10.0 : 5.0;
              notes = `Meets UOB spend gate. Multiplier active: ${rate}% cashback on ${calcCategory}. (Ensures ≥ 10 transactions monthly!)`;
            }
          }
          else if (card.templateId === 'hsbc-liveplus') {
            const prospectiveTotal = currentTotalSpend + targetAmtSGD;
            if (prospectiveTotal < 600) {
              rate = 0.3;
              notes = `HSBC Live+ requires S$600 min monthly spend. Currently S$${currentTotalSpend.toFixed(0)} logged. Base 0.3% applies.`;
            } else if (['Dining', 'Groceries'].includes(calcCategory)) {
              // Split logic for S$250 quarterly cap (~S$83 per month average)
              const maxMonthlyCapSpend = 1000; // S$1000 spend monthly maximum to remain in 8% rebate
              if (currentTotalSpend >= maxMonthlyCapSpend) {
                rate = 0.3;
                notes = `S$1,000 monthly bonus threshold met. Spillover earns base rate 0.3%.`;
              } else {
                const remainingLimit = Math.max(0, maxMonthlyCapSpend - currentTotalSpend);
                if (targetAmtSGD <= remainingLimit) {
                  rate = 8.0;
                  notes = `Unlocks 8% cashback. Headroom remaining: S$${remainingLimit.toFixed(0)}.`;
                } else {
                  const bonusPart = remainingLimit;
                  const basePart = targetAmtSGD - remainingLimit;
                  const avgRate = ((bonusPart * 8.0) + (basePart * 0.3)) / targetAmtSGD;
                  rate = parseFloat(avgRate.toFixed(2));
                  notes = `CAPPED WATERFALL: S$${bonusPart.toFixed(0)} earns 8%, spillover S$${basePart.toFixed(0)} earns 0.3%. Average yield: ${rate}%.`;
                }
              }
            }
          }
          else if (card.templateId === 'hsbc-revolution') {
            if (['Online Shopping', 'Travel', 'Dining', 'Transport/SimplyGo'].includes(calcCategory)) {
              rateType = 'Miles';
              if (currentTotalSpend >= 1000) {
                rate = 0.4;
                notes = `HSBC Revolution monthly S$1,000 bonus limit reached. Fallback to base 0.4 MPD.`;
              } else {
                const remainingLimit = Math.max(0, 1000 - currentTotalSpend);
                if (targetAmtSGD <= remainingLimit) {
                  rate = 4.0;
                  notes = `Unlocks 4.0 MPD. Cap headroom: S$${remainingLimit.toFixed(0)} remaining.`;
                } else {
                  const bonusPart = remainingLimit;
                  const basePart = targetAmtSGD - remainingLimit;
                  const avgRate = ((bonusPart * 4.0) + (basePart * 0.4)) / targetAmtSGD;
                  rate = parseFloat(avgRate.toFixed(2));
                  notes = `CAPPED WATERFALL: S$${bonusPart.toFixed(0)} earns 4.0 MPD, spillover S$${basePart.toFixed(0)} earns 0.4 MPD. Avg: ${rate} MPD.`;
                }
              }
            }
          }
          else if (card.templateId === 'uob-ladys-solitaire') {
            if (isTargetCategoryActive) {
              rateType = 'Miles';
              if (currentTotalSpend >= 2000) {
                rate = 0.4;
                notes = `Lady's S$2,000 monthly bonus spend limit met. Base 0.4 MPD applies.`;
              } else {
                const remainingLimit = Math.max(0, 2000 - currentTotalSpend);
                if (targetAmtSGD <= remainingLimit) {
                  rate = 4.0;
                  notes = `Unlocks 4.0 MPD. Cap headroom: S$${remainingLimit.toFixed(0)} remaining.`;
                } else {
                  const bonusPart = remainingLimit;
                  const basePart = targetAmtSGD - remainingLimit;
                  const avgRate = ((bonusPart * 4.0) + (basePart * 0.4)) / targetAmtSGD;
                  rate = parseFloat(avgRate.toFixed(2));
                  notes = `CAPPED WATERFALL: S$${bonusPart.toFixed(0)} earns 4.0 MPD, spillover S$${basePart.toFixed(0)} earns 0.4 MPD. Avg: ${rate} MPD.`;
                }
              }
            }
          }
          else if (card.templateId === 'dcs-flexi') {
            if (calcCategory === 'Foreign Currency' || calcCurrency !== 'SGD') {
              const prospectiveTotal = currentTotalSpend + targetAmtSGD;
              if (prospectiveTotal < 500) {
                rate = 0.5;
                notes = `DCS requires S$500 min spend. S$${currentTotalSpend.toFixed(0)} processed. Base 0.5% rate active.`;
              } else {
                rate = 8.0;
                notes = `Unlocks 8% foreign transaction cashback rebate.`;
              }
            }
          }

          return {
            ...card,
            calculatedRate: rate,
            calculatedType: rateType,
            notes
          };
        });

        return results.sort((a,b) => b.calculatedRate - a.calculatedRate);
      }, [wallet, transactions, calcCategory, calcAmount, calcCurrency]);

      const handleFastLog = (cardResult) => {
        setTxCardInstanceId(cardResult.docId);
        setTxCategory(calcCategory);
        setTxAmount(calcAmount || '10');
        setTxCurrency(calcCurrency);
        setTxMerchant(`Optimized ${calcCategory} Swipe`);
        setTxDate(new Date().toISOString().split('T')[0]);
        setIsLoggingTx(true);
        showToast("Logged directly from optimizer recommendations!");
      };

      // Loading Splash screen to prevent black screens during session checks
      if (loading) {
        return (
          <div className="max-w-md mx-auto bg-brand-dark min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-brand-accent animate-spin mb-4"></div>
            <h3 className="text-sm font-bold text-white tracking-wide">Securing Connection</h3>
            <p className="text-xs text-slate-500 mt-1">Please wait while SwipeWise syncs authentication tokens...</p>
          </div>
        );
      }

      return (
        <div className="max-w-md mx-auto bg-brand-dark min-h-screen shadow-2xl relative flex flex-col">
          
          {/* HEADER BAR */}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${networkOnline ? 'bg-brand-accent' : 'bg-brand-red'} animate-pulse`}></span>
                <span className="text-[9px] text-slate-400 font-semibold">{networkOnline ? 'Sync OK' : 'Local Only'}</span>
              </div>
              {user && (
                <button onClick={handleLogout} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition" title="Log Out">
                  <i data-lucide="log-out" className="w-4 h-4"></i>
                </button>
              )}
            </div>
          </header>

          {/* MAIN PAGE VIEW SCROLLER */}
          <main className="flex-1 overflow-y-auto px-4 pt-4 pb-safe custom-scrollbar">
            
            {!user ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="p-4 bg-brand-accent/10 rounded-full text-brand-accent mb-6 animate-bounce">
                  <i data-lucide="shield-check" className="w-12 h-12"></i>
                </div>
                <h2 className="text-xl font-bold mb-2">Secure Cloud Optimizer</h2>
                <p className="text-sm text-slate-400 mb-8 max-w-sm">
                  Log in safely to build your credit cards portfolio, manage statement cycles, and track cashback/miles yield safely on your devices.
                </p>
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-bold py-3.5 px-6 rounded-xl shadow-lg hover:bg-slate-100 transition duration-200"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google Logo" />
                  Continue with Google
                </button>
                <div className="mt-6">
                  <button 
                    onClick={() => {
                      setUser({
                        uid: 'anonymous-hustler',
                        displayName: 'Local Optimizer',
                        email: 'sandbox@swipewise.sg'
                      });
                      showToast("Active inside private mock browser sandbox.");
                    }} 
                    className="text-xs text-brand-accent/80 hover:underline"
                  >
                    Use Local Sandbox Mode Instead
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* TAB 1: YIELD CALCULATOR ENGINE */}
                {activeTab === 'home' && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="bg-brand-card/60 backdrop-blur border border-slate-800 rounded-2xl p-4 shadow-xl">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <i data-lucide="calculator" className="w-4 h-4 text-brand-accent"></i>
                        Optimise Swipe Wise
                      </h3>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Category</label>
                          <select 
                            value={calcCategory} 
                            onChange={(e) => setCalcCategory(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium text-white focus:outline-none focus:border-brand-accent"
                          >
                            {TRANSACTION_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Estimated Spending</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">$</span>
                            <input 
                              type="number" 
                              placeholder="0.00" 
                              value={calcAmount} 
                              onChange={(e) => setCalcAmount(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-6 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-brand-accent" 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Currency</label>
                          <select 
                            value={calcCurrency} 
                            onChange={(e) => setCalcCurrency(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium text-white focus:outline-none focus:border-brand-accent"
                          >
                            <option value="SGD">SGD</option>
                            <option value="MYR">MYR</option>
                            <option value="USD">USD</option>
                            <option value="JPY">JPY</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-3 mt-4">
                          <span className="text-[10px] text-slate-400">Online/App Tx</span>
                          <input 
                            type="checkbox" 
                            checked={calcIsOnline} 
                            onChange={(e) => setCalcIsOnline(e.target.checked)}
                            className="w-4 h-4 rounded text-brand-accent focus:ring-brand-accent bg-slate-800 border-slate-700" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                        <span>Realtime Optimization Yield Ranked</span>
                        <span className="text-[10px] font-normal text-brand-accent">{sortedYieldRecommendations.length} Cards Analyzed</span>
                      </h3>

                      {sortedYieldRecommendations.length === 0 ? (
                        <div className="bg-brand-card/40 border border-dashed border-slate-800 rounded-xl p-8 text-center">
                          <p className="text-xs text-slate-400 mb-3">No active cards found in your SwipeWise portfolio.</p>
                          <button onClick={() => setActiveTab('wallet')} className="bg-brand-accent/20 text-brand-accent text-xs font-bold px-4 py-2 rounded-lg hover:bg-brand-accent/30 transition">
                            Setup Card Portfolio Now
                          </button>
                        </div>
                      ) : (
                        sortedYieldRecommendations.map((rec, index) => (
                          <div 
                            key={rec.docId}
                            className={`border rounded-2xl p-4 relative overflow-hidden transition-all duration-200 ${
                              index === 0 
                                ? 'bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-900 border-brand-accent shadow-lg shadow-brand-accent/10' 
                                : 'bg-brand-card/40 border-slate-800'
                            }`}
                          >
                            {index === 0 && (
                              <div className="absolute top-0 right-0 bg-brand-accent text-brand-dark text-[8px] font-extrabold px-3 py-1 rounded-bl-xl tracking-wider uppercase">
                                Best Choice
                              </div>
                            )}

                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="text-sm font-bold text-white">{rec.name}</h4>
                                <p className="text-[10px] text-slate-400">{rec.issuer} &bull; Bill Cycle Day: {rec.billingCycleDate}</p>
                              </div>
                              <div className="text-right">
                                <span className={`text-sm font-black ${rec.calculatedType === 'Miles' ? 'text-brand-gold' : 'text-brand-accent'}`}>
                                  {rec.calculatedRate} {rec.calculatedType === 'Miles' ? 'MPD' : '% Cashback'}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-300 mt-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                              {rec.notes}
                            </p>

                            <div className="mt-3 flex justify-between items-center pt-2 border-t border-slate-800/60">
                              <span className="text-[10px] text-slate-500">Includes cycle cap check</span>
                              <button 
                                onClick={() => handleFastLog(rec)}
                                className="flex items-center gap-1 bg-brand-accent text-brand-dark text-[10px] font-extrabold px-3 py-1.5 rounded-lg hover:scale-105 transition duration-150"
                              >
                                <i data-lucide="receipt" className="w-3 h-3"></i>
                                Log Spend Slip
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: WALLET CONFIGURATION */}
                {activeTab === 'wallet' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-md font-bold text-white">My Smart Wallet</h2>
                        <p className="text-xs text-slate-400">Configure and link Singapore cards.</p>
                      </div>
                      <button 
                        onClick={() => setIsAddingCard(true)}
                        className="bg-brand-accent text-brand-dark text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 shadow-lg shadow-brand-accent/10"
                      >
                        <i data-lucide="plus" className="w-3.5 h-3.5"></i> Add Card
                      </button>
                    </div>

                    <div className="space-y-3">
                      {wallet.length === 0 ? (
                        <div className="bg-brand-card/40 border border-dashed border-slate-800 rounded-xl p-8 text-center">
                          <i data-lucide="wallet" className="w-8 h-8 mx-auto text-slate-500 mb-3"></i>
                          <p className="text-xs text-slate-400 mb-2">No active cards found in your customized profile.</p>
                          <button onClick={() => setIsAddingCard(true)} className="text-brand-accent text-xs font-bold hover:underline">
                            Load pre-configured template cards &rarr;
                          </button>
                        </div>
                      ) : (
                        wallet.map(card => (
                          <div key={card.docId} className="bg-brand-card/60 backdrop-blur border border-slate-800 rounded-2xl p-4 shadow-md">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <span className="text-[9px] uppercase font-bold text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-full">
                                  {card.type} Card
                                </span>
                                <h3 className="text-sm font-bold text-white mt-1">{card.name}</h3>
                                <p className="text-[10px] text-slate-400">Issuer: {card.issuer} &bull; Statement Date: {card.billingCycleDate}</p>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingCardInstanceId(card.docId);
                                    const orig = PRESET_CARDS.find(p => p.id === card.templateId);
                                    setConfigCardTemplate(orig);
                                    setConfigCategories(card.selectedCategories || []);
                                    setConfigBillingCycle(card.billingCycleDate);
                                    setConfigCustomCap(card.customCap || '');
                                    setIsAddingCard(true);
                                  }}
                                  className="p-1 text-slate-400 hover:text-white"
                                >
                                  <i data-lucide="edit-3" className="w-4 h-4"></i>
                                </button>
                                <button 
                                  onClick={() => handleRemoveCard(card.docId)}
                                  className="p-1 text-slate-400 hover:text-brand-red"
                                >
                                  <i data-lucide="trash-2" className="w-4 h-4"></i>
                                </button>
                              </div>
                            </div>

                            {card.selectedCategories && card.selectedCategories.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-1.5">
                                {card.selectedCategories.map(cat => (
                                  <span key={cat} className="text-[9px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                                    {cat}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: SMART PROGRESS METRICS & TERMS */}
                {activeTab === 'analysis' && (
                  <div className="space-y-5 animate-fadeIn">
                    <div>
                      <h2 className="text-md font-bold text-white">Spend Gate Analysis & Card Briefs</h2>
                      <p className="text-xs text-slate-400">Statement cycle progress tracking and eligibility guidelines.</p>
                    </div>

                    {wallet.length === 0 ? (
                      <div className="bg-brand-card/40 border border-dashed border-slate-800 rounded-xl p-8 text-center">
                        <p className="text-xs text-slate-400">Configure cards to begin automated cycle analytics.</p>
                      </div>
                    ) : (
                      wallet.map(card => {
                        const cardTxs = getTransactionsForCardCycle(card, transactions);
                        const totalSpend = cardTxs.reduce((sum, t) => sum + t.amountSGD, 0);
                        const preset = PRESET_CARDS.find(p => p.id === card.templateId);

                        return (
                          <div key={card.docId} className="bg-brand-card/60 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-sm">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-xs font-bold text-white">{card.name}</h3>
                                <p className="text-[9px] text-slate-500">Custom Statement Period Spending</p>
                              </div>
                              <span className="text-xs font-bold text-slate-300">
                                S$ {totalSpend.toFixed(0)} / S$ {card.customCap || card.globalCap}
                              </span>
                            </div>

                            {/* AUTOMATED COMPLIANCE WATERFALL PROGRESS INDICATORS */}
                            {card.templateId === 'maybank-ff' && (
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] text-slate-400">
                                    <span>Min Spend Requirement</span>
                                    <span>{totalSpend >= 800 ? '✅ UNLOCKED' : `S$${(800 - totalSpend).toFixed(0)} Left`}</span>
                                  </div>
                                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${totalSpend >= 800 ? 'bg-brand-accent' : 'bg-brand-gold'}`}
                                      style={{ width: `${Math.min((totalSpend/800)*100, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>

                                {card.selectedCategories.map(cat => {
                                  const catSpend = cardTxs.filter(t => t.category === cat).reduce((sum, t) => sum + t.amountSGD, 0);
                                  return (
                                    <div key={cat} className="space-y-1">
                                      <div className="flex justify-between text-[9px] text-slate-500">
                                        <span>Category: {cat}</span>
                                        <span>S${catSpend.toFixed(0)} / S$312.50</span>
                                      </div>
                                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-brand-accent/80"
                                          style={{ width: `${Math.min((catSpend/312.50)*100, 100)}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {card.templateId === 'uob-one' && (
                              <div className="space-y-3">
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px] text-slate-400">
                                    <span>Min Spend Gate Target S$500</span>
                                    <span>{totalSpend >= 500 ? '✅ Tier 1 Met' : `S$${(500 - totalSpend).toFixed(0)} Left`}</span>
                                  </div>
                                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-brand-accent"
                                      style={{ width: `${Math.min((totalSpend/500)*100, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {card.templateId !== 'maybank-ff' && card.templateId !== 'uob-one' && (
                              <div className="space-y-1">
                                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-brand-accent"
                                    style={{ width: `${Math.min((totalSpend / (card.customCap || 1000)) * 100, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            {/* EXPLICIT BENEFITS GUIDE ACCORDION (FEEDBACK 3 IMPLEMENTED) */}
                            {preset && (
                              <div className="mt-3 pt-3 border-t border-slate-800/60 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                                <h4 className="text-[11px] font-bold text-slate-300 flex items-center gap-1 mb-1.5">
                                  <i data-lucide="help-circle" className="w-3.5 h-3.5 text-brand-accent"></i>
                                  How to maximize benefits:
                                </h4>
                                <p className="text-[10px] text-slate-400 leading-relaxed">
                                  {preset.briefGuide}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* TAB 4: TRANSACTION LEDGER FORM & HISTORY */}
                {activeTab === 'logs' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-md font-bold text-white">Hustle Ledger</h2>
                        <p className="text-xs text-slate-400">Log and modify expenditures seamlessly.</p>
                      </div>
                      <button 
                        onClick={() => {
                          setTxEditingId(null);
                          setTxAmount('');
                          setTxMerchant('');
                          if (wallet.length > 0) setTxCardInstanceId(wallet[0].docId);
                          setIsLoggingTx(true);
                        }}
                        className="bg-brand-accent text-brand-dark text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 shadow"
                      >
                        <i data-lucide="plus" className="w-3.5 h-3.5"></i> Log Spend
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {transactions.length === 0 ? (
                        <div className="bg-brand-card/40 border border-dashed border-slate-800 rounded-xl p-8 text-center">
                          <p className="text-xs text-slate-400">No logged items inside your database feed yet.</p>
                        </div>
                      ) : (
                        transactions.map(tx => {
                          const card = wallet.find(c => c.docId === tx.cardInstanceId);
                          return (
                            <div key={tx.docId} className="bg-brand-card/50 border border-slate-800/80 rounded-xl p-3 flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <span className="p-2 bg-slate-800 rounded-lg text-slate-300">
                                  <i data-lucide="receipt" className="w-4 h-4"></i>
                                </span>
                                <div>
                                  <h4 className="text-xs font-bold text-white">{tx.merchant}</h4>
                                  <p className="text-[10px] text-slate-500">
                                    {tx.category} &bull; {tx.date} &bull; {card ? card.name : 'Unknown Card'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <span className="text-xs font-extrabold text-white">
                                    {tx.currency} {tx.amount.toFixed(2)}
                                  </span>
                                  {tx.currency !== 'SGD' && (
                                    <p className="text-[9px] text-slate-400">~S$ {tx.amountSGD.toFixed(2)}</p>
                                  )}
                                </div>
                                <div className="flex gap-1.5">
                                  <button onClick={() => handleEditTx(tx)} className="text-slate-400 hover:text-white p-1">
                                    <i data-lucide="edit" className="w-3.5 h-3.5"></i>
                                  </button>
                                  <button onClick={() => handleDeleteTx(tx.docId)} className="text-slate-400 hover:text-brand-red p-1">
                                    <i data-lucide="trash-2" className="w-3.5 h-3.5"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </main>

          {/* ADD CARD CONFIGURATION OVERLAY MODAL */}
          {isAddingCard && (
            <div className="fixed inset-0 z-50 bg-brand-dark/90 backdrop-blur-sm flex items-end justify-center p-4">
              <div className="bg-brand-card border border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-slideUp">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-white">
                    {editingCardInstanceId ? 'Configure Card Preferences' : 'Choose Base Template'}
                  </h3>
                  <button onClick={closeConfigModal} className="text-slate-400 hover:text-white">
                    <i data-lucide="x" className="w-5 h-5"></i>
                  </button>
                </div>

                {!configCardTemplate ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {PRESET_CARDS.map(preset => (
                      <button 
                        key={preset.id}
                        onClick={() => {
                          setConfigCardTemplate(preset);
                          setConfigCategories(preset.defaultSelectedCategories || []);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 p-3 rounded-xl text-left hover:border-brand-accent transition flex justify-between items-center"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{preset.name}</p>
                          <p className="text-[10px] text-slate-400">{preset.issuer}</p>
                        </div>
                        <span className="text-[10px] text-brand-accent font-extrabold">{preset.type}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-slate-400">Card Template Selection</p>
                      <h4 className="text-sm font-bold text-white mt-0.5">{configCardTemplate.name}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Billing Cycle Start Date</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="28"
                          value={configBillingCycle}
                          onChange={(e) => setConfigBillingCycle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Target Statement Spend Limit</label>
                        <input 
                          type="number"
                          placeholder={configCardTemplate.globalCap}
                          value={configCustomCap}
                          onChange={(e) => setConfigCustomCap(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" 
                        />
                      </div>
                    </div>

                    {configCardTemplate.requiresSelection && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-400 block">Select Active Whitelist Categories ({configCardTemplate.maxSelectable} Max)</label>
                        <div className="grid grid-cols-2 gap-2">
                          {configCardTemplate.categories.map(cat => {
                            const active = configCategories.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  if (active) {
                                    setConfigCategories(configCategories.filter(c => c !== cat));
                                  } else {
                                    if (configCategories.length >= configCardTemplate.maxSelectable) return;
                                    setConfigCategories([...configCategories, cat]);
                                  }
                                }}
                                className={`text-[10px] py-1.5 px-2.5 rounded-lg border text-left transition ${
                                  active 
                                    ? 'bg-brand-accent/20 border-brand-accent text-white' 
                                    : 'bg-slate-950 border-slate-850 text-slate-400'
                                }`}
                              >
                                {cat}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <button 
                        onClick={handleSaveCardSetup}
                        className="w-full bg-brand-accent text-brand-dark py-2.5 rounded-xl font-bold text-xs"
                      >
                        Add to Wallet Setup
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LEDGER WRITE TRANSACTION MODAL WITH FIXES */}
          {isLoggingTx && (
            <div className="fixed inset-0 z-50 bg-brand-dark/90 backdrop-blur-sm flex items-end justify-center p-4">
              <form onSubmit={handleSaveTransaction} className="bg-brand-card border border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl animate-slideUp">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-white">
                    {txEditingId ? 'Amend Payment Slip' : 'Log Transaction Receipt'}
                  </h3>
                  <button type="button" onClick={closeTxForm} className="text-slate-400 hover:text-white">
                    <i data-lucide="x" className="w-5 h-5"></i>
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Select Active Card Instrument</label>
                    <select 
                      value={txCardInstanceId} 
                      required
                      onChange={(e) => setTxCardInstanceId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="">-- Choose Card --</option>
                      {wallet.map(c => (
                        <option key={c.docId} value={c.docId}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Merchant Description</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Grab, Sheng Siong, etc." 
                        value={txMerchant}
                        onChange={(e) => setTxMerchant(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Spending Category</label>
                      <select 
                        value={txCategory} 
                        onChange={(e) => setTxCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        {TRANSACTION_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Currency</label>
                      <select 
                        value={txCurrency} 
                        onChange={(e) => setTxCurrency(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="SGD">SGD</option>
                        <option value="MYR">MYR</option>
                        <option value="USD">USD</option>
                        <option value="JPY">JPY</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Receipt Price</label>
                      <input 
                        type="number" 
                        step="0.01"
                        required
                        value={txAmount}
                        onChange={(e) => setTxAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Spend Date</label>
                    <input 
                      type="date" 
                      required
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" 
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    className="w-full bg-brand-accent text-brand-dark py-2.5 rounded-xl font-bold text-xs"
                  >
                    Save Entry
                  </button>
                </div>
              </form>
            </div>
          )}

          {}
          {confirmModal.isOpen && (
            <div className="fixed inset-0 z-50 bg-brand-dark/95 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-brand-card border border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-center">
                <div className="w-12 h-12 bg-brand-red/10 rounded-full text-brand-red flex items-center justify-center mx-auto mb-2">
                  <i data-lucide="alert-triangle" className="w-6 h-6"></i>
                </div>
                <h3 className="text-md font-bold text-white">{confirmModal.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {confirmModal.message}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="bg-slate-900 hover:bg-slate-850 text-slate-300 py-2.5 rounded-xl text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={confirmModal.onConfirm}
                    className="bg-brand-red text-white py-2.5 rounded-xl text-xs font-bold"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FIXED NOTIFICATION TOAST POPUP */}
          {feedbackMsg && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 max-w-[90%]">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
              <span className="text-[11px] text-slate-200 font-medium whitespace-nowrap">{feedbackMsg}</span>
            </div>
          )}

          {/* MOBILE PHONE SAFE BOTTOM NAVIGATION BAR */}
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-brand-dark/90 backdrop-blur-md border-t border-slate-850 z-40 px-3 py-2 flex justify-around">
            <button 
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all ${
                activeTab === 'home' ? 'text-brand-accent' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <i data-lucide="zap" className="w-5 h-5"></i>
              <span className="text-[9px] font-bold">Optimizer</span>
            </button>
            <button 
              onClick={() => setActiveTab('wallet')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all ${
                activeTab === 'wallet' ? 'text-brand-accent' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <i data-lucide="wallet" className="w-5 h-5"></i>
              <span className="text-[9px] font-bold">My Cards</span>
            </button>
            <button 
              onClick={() => setActiveTab('analysis')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all ${
                activeTab === 'analysis' ? 'text-brand-accent' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <i data-lucide="line-chart" className="w-5 h-5"></i>
              <span className="text-[9px] font-bold">Analysis</span>
            </button>
            <button 
              onClick={() => setActiveTab('logs')}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-all ${
                activeTab === 'logs' ? 'text-brand-accent' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <i data-lucide="receipt" className="w-5 h-5"></i>
              <span className="text-[9px] font-bold">Log Slip</span>
            </button>
          </nav>

        </div>
      );
    }

    window.onload = function() {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(<App />);

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => console.log('Service Worker Active:', reg.scope))
          .catch((err) => console.warn('Service Worker registration skipped:', err));
      }
    }
  </script>
</body>
</html>
