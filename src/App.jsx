import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Menu, 
  Bell, 
  LogOut, 
  BookOpen, 
  Calendar, 
  Briefcase, 
  Users, 
  DollarSign, 
  Monitor, 
  ChevronDown, 
  ChevronRight,
  ExternalLink,
  Clock,
  Menu as MenuIcon,
  MessageCircle,
  Send,
  Sparkles,
  X,
  Loader2,
  Bot,
  Lock,
  Eye,
  Sun,
  Moon,
  Contrast,
  ArrowLeft,
  CreditCard,
  MapPin,
  Utensils,
  Dumbbell
} from 'lucide-react';

// --- GEMINI API UTILITY ---
const callGemini = async (prompt, systemInstruction = "") => {
  const apiKey = ""; // API Key provided by runtime environment
  
  // Exponential backoff retry logic
  const maxRetries = 3;
  const delays = [1000, 2000, 4000];

  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: systemInstruction 
              ? { parts: [{ text: systemInstruction }] } 
              : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble thinking right now. Gig 'em anyway!";
    } catch (error) {
      if (i === maxRetries) {
        console.error("Gemini API Failed:", error);
        return "Sorry, I'm having trouble connecting to the Aggie network. Please try again later.";
      }
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
};

const HowdyPortal = () => {
  // --- THEME STATE ---
  const [theme, setTheme] = useState('light'); // 'light', 'dark', 'contrast'
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // --- THEME CONFIGURATION ---
  const themes = {
    light: {
      type: 'light',
      bg: 'bg-gray-50',
      paper: 'bg-white',
      sidebar: 'bg-white border-gray-200',
      header: 'bg-white border-gray-200',
      text: 'text-slate-800',
      textSec: 'text-gray-500',
      accent: 'bg-[#500000]', // Aggie Maroon
      accentText: 'text-[#500000]',
      border: 'border-gray-200',
      hover: 'hover:bg-gray-50',
      icon: 'text-gray-400',
      input: 'bg-gray-50 border-gray-200 text-slate-800',
      cardHover: 'hover:shadow-md hover:border-red-100',
      buttonPrimary: 'bg-[#500000] text-white hover:bg-red-900',
      activeNav: 'bg-[#500000] text-white',
      inactiveNav: 'text-gray-600 hover:bg-gray-50 hover:text-[#500000]'
    },
    dark: {
      type: 'dark',
      bg: 'bg-slate-950',
      paper: 'bg-slate-900',
      sidebar: 'bg-slate-900 border-slate-800',
      header: 'bg-slate-900 border-slate-800',
      text: 'text-slate-100',
      textSec: 'text-slate-400',
      accent: 'bg-red-800',
      accentText: 'text-red-400',
      border: 'border-slate-800',
      hover: 'hover:bg-slate-800',
      icon: 'text-slate-500',
      input: 'bg-slate-950 border-slate-700 text-slate-100 focus:border-red-500',
      cardHover: 'hover:shadow-lg hover:shadow-black/20 hover:border-slate-700',
      buttonPrimary: 'bg-red-800 text-white hover:bg-red-700',
      activeNav: 'bg-red-900 text-white',
      inactiveNav: 'text-slate-400 hover:bg-slate-800 hover:text-red-400'
    },
    contrast: {
      type: 'contrast',
      bg: 'bg-black',
      paper: 'bg-black border-2 border-yellow-400',
      sidebar: 'bg-black border-r-4 border-yellow-400',
      header: 'bg-black border-b-4 border-yellow-400',
      text: 'text-yellow-400 font-bold',
      textSec: 'text-white',
      accent: 'bg-yellow-400',
      accentText: 'text-yellow-400',
      border: 'border-white',
      hover: 'hover:bg-gray-900',
      icon: 'text-yellow-400',
      input: 'bg-black border-2 border-yellow-400 text-yellow-400 placeholder:text-yellow-200',
      cardHover: 'hover:bg-gray-900',
      buttonPrimary: 'bg-yellow-400 text-black border-2 border-white hover:bg-yellow-300 font-bold',
      activeNav: 'bg-yellow-400 text-black border-2 border-white',
      inactiveNav: 'text-yellow-400 border-2 border-transparent hover:border-yellow-400'
    }
  };

  const t = themes[theme]; // Current theme shortcut

  // --- APP STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' or category ID
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Home');
  const [expandedMenu, setExpandedMenu] = useState({
    Academics: false,
    Registration: false,
    Resources: false,
    'Social Life': false,
    'Finance & Tuition': false
  });
  
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchContainerRef = useRef(null);

  // Modal State
  const [showPayModal, setShowPayModal] = useState(false);

  // --- AI FEATURES STATE ---
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'system', text: "Howdy! I'm your AI assistant. Ask me about registration, bus routes, or campus traditions!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isLoggedIn) {
        scrollToBottom();
    }
  }, [chatMessages, chatOpen, isLoggedIn]);

  // Focus management for chat opening
  useEffect(() => {
    if (chatOpen && chatInputRef.current) {
      setTimeout(() => chatInputRef.current.focus(), 100);
    }
  }, [chatOpen]);

  // --- HANDLERS ---

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setChatOpen(false); // Close chat on logout
    setSidebarOpen(true); // Reset sidebar
    setTheme('light'); // Reset theme
    setCurrentView('dashboard');
    setSearchQuery(""); // Clear search
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput("");
    setIsChatLoading(true);

    const systemPrompt = `You are Howdy Bot, a helpful, spirited AI assistant for Texas A&M University students. 
    You use Aggie terminology (Howdy, Gig 'em, Good Bull, Redass) naturally but not excessively. 
    You are knowledgeable about: 
    - Course registration (add/drop, waitlists)
    - Campus resources (Evans Library, MSC, bus routes)
    - Traditions (Midnight Yell, Silver Taps, Muster)
    - Academic advice (keep it general).
    Keep your answers concise and helpful for a web interface.`;

    const aiResponse = await callGemini(userMsg, systemPrompt);

    setChatMessages(prev => [...prev, { role: 'system', text: aiResponse }]);
    setIsChatLoading(false);
  };

  const toggleMenu = (category) => {
    setExpandedMenu(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleNavClick = (id) => {
    setActiveCategory(id);
    setCurrentView(id);
    if (!sidebarOpen) setSidebarOpen(true);
    setExpandedMenu(prev => ({...prev, [id]: true}));
  };

  const handleCardClick = (link) => {
    // Special case for Finance Modal demo
    if (link.id === 'Finance & Tuition') {
      setShowPayModal(true);
      return;
    }

    // Default navigation behavior
    setActiveCategory(link.id);
    setCurrentView(link.id);
    setSidebarOpen(true);
    setExpandedMenu(prev => ({...prev, [link.id]: true}));
  };

  // --- SEARCH LOGIC ---
  const navItems = [
    { 
      id: 'Academics', 
      icon: <BookOpen size={18} aria-hidden="true" />, 
      subItems: ['UGDP', 'Aggie Schedule Builder', 'View Grades', 'View Schedule'] 
    },
    { 
      id: 'Registration', 
      icon: <Calendar size={18} aria-hidden="true" />, 
      subItems: ['Search Classes', 'Add/Drop', 'Registration Status'] 
    },
    { 
      id: 'Resources', 
      icon: <Briefcase size={18} aria-hidden="true" />, 
      subItems: ['Library', 'Transport', 'IT Help'] 
    },
    { 
      id: 'Social Life', 
      icon: <Users size={18} aria-hidden="true" />, 
      subItems: ['Campus Events', 'Student Orgs', 'Rec Sports', 'MSC Box Office'] 
    },
    { 
      id: 'Finance & Tuition', 
      icon: <DollarSign size={18} aria-hidden="true" />, 
      subItems: ['Pay Bill', 'Financial Aid Portal', '1098-T Tax Form', 'Scholarships'] 
    },
    { id: 'Campus Services', icon: <Monitor size={18} aria-hidden="true" />, subItems: ['Housing Portal', 'Dining & Meal Plans', 'Parking Services'] },
  ];

  // Synonyms for intuitive searching
  const synonyms = {
    'money': 'Finance & Tuition',
    'pay': 'Finance & Tuition',
    'bill': 'Finance & Tuition',
    'cost': 'Finance & Tuition',
    'food': 'Dining & Meal Plans',
    'eat': 'Dining & Meal Plans',
    'dorm': 'Housing Portal',
    'room': 'Housing Portal',
    'gym': 'Rec Sports',
    'workout': 'Rec Sports',
    'bus': 'Transport',
    'car': 'Parking Services',
    'help': 'IT Help',
    'wifi': 'IT Help',
    'book': 'Library',
    'study': 'Library'
  };

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = [];

    // 1. Check direct matches in nav items and subitems
    navItems.forEach(category => {
      // Category Match
      if (category.id.toLowerCase().includes(query)) {
        results.push({ 
          type: 'Category', 
          title: category.id, 
          id: category.id, 
          icon: category.icon,
          action: () => handleNavClick(category.id)
        });
      }
      // Sub-item Match
      category.subItems.forEach(sub => {
        if (sub.toLowerCase().includes(query)) {
           results.push({ 
             type: 'Service', 
             title: sub, 
             subtitle: category.id,
             id: category.id, // Parent ID for navigation
             action: () => handleNavClick(category.id) 
           });
        }
      });
    });

    // 2. Check Synonyms
    Object.keys(synonyms).forEach(key => {
      if (key.includes(query)) {
        // Find the mapped item (could be category or sub-item)
        const targetName = synonyms[key];
        // Try to find if it's a category
        const catMatch = navItems.find(n => n.id === targetName);
        if (catMatch) {
          results.push({ 
            type: 'Suggestion', 
            title: catMatch.id, 
            subtitle: `Matches "${key}"`,
            id: catMatch.id,
            action: () => handleNavClick(catMatch.id)
          });
        } else {
            // Must be a subitem, find parent
            navItems.forEach(n => {
                if (n.subItems.includes(targetName)) {
                    results.push({
                        type: 'Suggestion',
                        title: targetName,
                        subtitle: `Matches "${key}"`,
                        id: n.id,
                        action: () => handleNavClick(n.id)
                    })
                }
            })
        }
      }
    });

    // Remove duplicates
    const uniqueResults = results.filter((v,i,a)=>a.findIndex(v2=>(v2.title===v.title))===i);

    setSearchResults(uniqueResults);
  }, [searchQuery]);


  // --- DATA ---
  const newsItems = [
    {
      title: "New Ticket Pull System Rolling Out",
      desc: "The new online ticketing system for football games is now live for seniors.",
      tag: "Sports",
      time: "2h ago"
    },
    {
      title: "Aggie Scheduler Revamps Planned",
      desc: "Maintenance and UI bug fixes scheduled for the upcoming weekend.",
      tag: "System",
      time: "5h ago"
    },
    {
      title: "Campus Construction Update",
      desc: "Road closures at MSC intersection starting this Friday through Sunday.",
      tag: "Alert",
      time: "1d ago"
    },
    {
      title: "Registration Opens Nov 8th",
      desc: "Prepare your schedule ahead of time. Check your time slot in the dashboard.",
      tag: "Academic",
      time: "2d ago"
    }
  ];

  const quickLinks = [
    { id: 'Academics', title: "Academics", icon: <BookOpen size={32} aria-hidden="true" />, desc: "View courses, grades, schedules, and degree progress." },
    { id: 'Registration', title: "Registration", icon: <Calendar size={32} aria-hidden="true" />, desc: "Plan and register for classes, manage waitlists." },
    { id: 'Resources', title: "Resources", icon: <Briefcase size={32} aria-hidden="true" />, desc: "Find advising, tutoring, counseling, and career services." },
    { id: 'Social Life', title: "Social Life", icon: <Users size={32} aria-hidden="true" />, desc: "Explore campus events, student orgs, and activities." },
    { id: 'Finance & Tuition', title: "Finance & Tuition", icon: <DollarSign size={32} aria-hidden="true" />, desc: "Pay tuition, manage financial aid, and billing details." },
    { id: 'Campus Services', title: "Campus Services", icon: <Monitor size={32} aria-hidden="true" />, desc: "Access housing, dining, parking, and IT support tools." },
  ];

  // --- RENDER LOGIN SCREEN (PRESERVED BUT THEME AWARE) ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-slate-800">
        {/* Login Header */}
        <header className="bg-[#500000] h-20 px-4 md:px-8 flex items-center justify-between shadow-md z-10" role="banner">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white rounded text-[#500000] flex items-center justify-center font-bold text-xl shadow-sm" aria-hidden="true">
               A&M
             </div>
             <span className="font-bold text-xl text-white tracking-tight">Howdy Portal</span>
           </div>
           <a href="#" className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded px-2 py-1">
             <Lock size={14} aria-hidden="true" />
             Secure Login
           </a>
        </header>

        {/* Main Login Area */}
        <div className="flex-1 flex items-center justify-center p-4" role="main">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Left Side - Hero/Branding */}
            <div className="w-full md:w-1/2 bg-gradient-to-br from-[#500000] to-[#300000] p-12 text-white flex flex-col justify-between relative overflow-hidden group">
               {/* Decorative Elements - Hidden from Screen Readers */}
               <div className="absolute top-[-50px] left-[-50px] w-40 h-40 rounded-full border-4 border-white/10 group-hover:scale-110 transition-transform duration-700" aria-hidden="true"></div>
               <div className="absolute bottom-[-20px] right-[-20px] w-60 h-60 rounded-full bg-white/5 group-hover:scale-105 transition-transform duration-700" aria-hidden="true"></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" aria-hidden="true"></div>
               
               <div className="z-10 mt-6 md:mt-12">
                 <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">Welcome to Aggieland</h2>
                 <p className="text-red-100 text-lg leading-relaxed font-light">
                   Access your grades, schedule, financial aid, and campus resources in one unified dashboard.
                 </p>
               </div>

               <div className="z-10 mt-8">
                 <div className="flex items-center gap-2 text-sm text-red-200 bg-black/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm" role="status">
                   <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" aria-hidden="true"></div>
                   System Normal: All services operational
                 </div>
               </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white relative">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Central Authentication</h3>
                <p className="text-gray-500 text-sm">Log in with your NetID and password to access the portal.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5" aria-label="Login Form">
                <div>
                  <label htmlFor="netid" className="block text-sm font-semibold text-gray-700 mb-2">NetID</label>
                  <input 
                    id="netid"
                    type="text" 
                    placeholder="e.g. reveille"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#500000]/20 focus:border-[#500000] outline-none transition-all bg-gray-50 focus:bg-white"
                    required
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password</label>
                    <a href="#" className="text-xs text-[#500000] hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-[#500000] rounded px-1">Forgot Password?</a>
                  </div>
                  <input 
                    id="password"
                    type="password" 
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#500000]/20 focus:border-[#500000] outline-none transition-all bg-gray-50 focus:bg-white"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember" className="rounded border-gray-300 text-[#500000] focus:ring-[#500000]" />
                  <label htmlFor="remember" className="text-sm text-gray-600">Remember me for 7 days</label>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#500000] text-white font-bold py-3 rounded-lg hover:bg-red-900 transition-all transform active:scale-[0.98] shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 group focus:outline-none focus:ring-4 focus:ring-[#500000]/40"
                >
                  Log In <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                  By logging in, you agree to the <a href="#" className="underline hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#500000] rounded">Acceptable Use Policy</a>.
                </p>
                <div className="mt-4 text-xs text-gray-400 flex justify-center gap-4">
                   <a href="#" className="hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#500000] rounded px-1">Parent Access</a>
                   <span aria-hidden="true">•</span>
                   <a href="#" className="hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#500000] rounded px-1">Help Desk</a>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // --- RENDER DASHBOARD (When Logged In) ---
  return (
    <div className={`flex h-screen font-sans overflow-hidden relative transition-colors duration-300 ${t.bg} ${t.text}`}>
      
      {/* Sidebar Navigation */}
      <aside 
        className={`${sidebarOpen ? 'w-72' : 'w-20'} ${t.sidebar} flex flex-col transition-all duration-300 shadow-sm z-20 flex-shrink-0 border-r`}
        aria-label="Main Navigation"
      >
        <div className={`h-24 flex items-center justify-center border-b ${t.border} p-6`}>
          <div className="flex items-center gap-3 w-full">
            <div className={`w-12 h-12 ${t.accent} rounded text-white flex items-center justify-center font-bold text-xl flex-shrink-0 transition-colors`} aria-hidden="true">
              A&M
            </div>
            {sidebarOpen && (
              <span className={`font-bold text-xl tracking-tight ${t.accentText}`}>Howdy Portal</span>
            )}
          </div>
        </div>

        {/* Search Bar Container */}
        <div className="p-4 relative" ref={searchContainerRef}>
          <div className="relative group">
            <Search className={`absolute left-3 top-2.5 ${t.icon}`} size={18} aria-hidden="true" />
            {sidebarOpen ? (
              <div className="relative">
                <input 
                  type="text" 
                  aria-label="Search resourcesi"
                  placeholder="Search, select, and gig 'em"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSidebarOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        setSearchQuery("");
                        e.currentTarget.blur();
                    }
                  }}
                  className={`w-full ${t.input} rounded-lg pl-10 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#500000]/20 transition-all`}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setSidebarOpen(true)}
                aria-label="Open Search"
                className={`w-full h-10 ${t.input} rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#500000]`}
              >
                <Search size={18} className={t.icon} />
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          {searchQuery && sidebarOpen && (
            <div className={`absolute top-full left-4 right-4 mt-2 ${t.paper} border ${t.border} rounded-xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2`}>
               {searchResults.length > 0 ? (
                 <div className="py-2">
                   <div className={`px-4 py-2 text-xs font-bold uppercase tracking-wider ${t.textSec}`}>
                      Search Results
                   </div>
                   {searchResults.map((result, idx) => (
                     <button
                       key={idx}
                       onClick={() => {
                         result.action();
                         setSearchQuery(""); // Clear search on click
                       }}
                       className={`w-full text-left px-4 py-3 hover:${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-50'} flex items-center gap-3 transition-colors border-b ${t.border} last:border-0`}
                     >
                       <div className={`p-2 rounded-lg ${t.accent} text-white`}>
                          {result.type === 'Category' ? (result.icon || <BookOpen size={16}/>) : <ChevronRight size={16}/>}
                       </div>
                       <div>
                         <p className={`text-sm font-bold ${t.text}`}>{result.title}</p>
                         {result.subtitle && <p className={`text-xs ${t.textSec}`}>{result.subtitle}</p>}
                       </div>
                     </button>
                   ))}
                 </div>
               ) : (
                 <div className="p-8 text-center">
                    <p className={`text-sm ${t.textSec}`}>No results found for "{searchQuery}"</p>
                 </div>
               )}
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1" aria-label="Sidebar Menu">
          {navItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => {
                   if (sidebarOpen) {
                     // Set active state for navigation
                     setActiveCategory(item.id);
                     setCurrentView(item.id);
                     // Toggle menu
                     toggleMenu(item.id);
                   } else {
                     setSidebarOpen(true);
                     // If opening sidebar, expand this item
                     setActiveCategory(item.id);
                     setCurrentView(item.id);
                     setExpandedMenu(prev => ({...prev, [item.id]: true}));
                   }
                }}
                aria-expanded={expandedMenu[item.id]}
                aria-haspopup="true"
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#500000] ${
                  activeCategory === item.id 
                    ? t.activeNav 
                    : t.inactiveNav
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {sidebarOpen && <span className="font-medium text-sm">{item.id}</span>}
                </div>
                {sidebarOpen && item.subItems.length > 0 && (
                  expandedMenu[item.id] 
                    ? <ChevronDown size={14} className={activeCategory === item.id ? 'text-current' : t.textSec} aria-hidden="true" /> 
                    : <ChevronRight size={14} className={t.textSec} aria-hidden="true" />
                )}
              </button>
              
              {sidebarOpen && expandedMenu[item.id] && item.subItems.length > 0 && (
                <div className={`ml-9 mt-1 space-y-1 border-l-2 ${t.border} pl-2`}>
                  {item.subItems.map((sub, idx) => (
                    <a 
                      key={idx} 
                      href="#" 
                      className={`block px-3 py-2 text-sm rounded transition-colors focus:outline-none focus:ring-2 focus:ring-[#500000] ${
                        theme === 'contrast' 
                        ? 'text-yellow-400 hover:underline' 
                        : `${t.textSec} hover:text-[#500000] hover:bg-red-50 dark:hover:bg-slate-800 dark:hover:text-red-400`
                      }`}
                    >
                      {sub}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className={`p-4 border-t ${t.border}`}>
          <button 
            onClick={handleLogout}
            aria-label="Log Out"
            className={`flex items-center gap-3 transition-colors w-full p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#500000] ${
              theme === 'contrast' 
              ? 'text-yellow-400 hover:underline' 
              : 'text-gray-500 hover:text-[#500000] hover:bg-red-50 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <LogOut size={18} aria-hidden="true" />
            {sidebarOpen && <span className="text-sm font-medium">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col h-full overflow-hidden ${t.bg} relative transition-colors duration-300`} role="main">
        
        {/* Header */}
        <header className={`h-20 border-b ${t.header} flex items-center justify-between px-8 flex-shrink-0 shadow-sm z-10 transition-colors`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
              className={`p-2 rounded-lg ${t.icon} hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#500000]`}
            >
              <MenuIcon size={20} aria-hidden="true" />
            </button>
            <h1 className={`text-xl font-semibold ${t.text}`}>
              {currentView === 'dashboard' ? 'Howdy Home Page' : currentView}
            </h1>
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            
            {/* Theme Toggle Menu */}
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className={`p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#500000] ${t.icon}`}
                aria-label="Display Settings"
                aria-expanded={showThemeMenu}
              >
                <Eye size={20} />
              </button>
              
              {showThemeMenu && (
                <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-xl border ${t.border} ${t.paper} p-2 z-50 animate-in fade-in slide-in-from-top-2`}>
                  <button 
                    onClick={() => { setTheme('light'); setShowThemeMenu(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${theme === 'light' ? t.activeNav : t.inactiveNav}`}
                  >
                    <Sun size={16} /> Light Mode
                  </button>
                  <button 
                    onClick={() => { setTheme('dark'); setShowThemeMenu(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${theme === 'dark' ? t.activeNav : t.inactiveNav}`}
                  >
                    <Moon size={16} /> Dark Mode
                  </button>
                  <button 
                    onClick={() => { setTheme('contrast'); setShowThemeMenu(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${theme === 'contrast' ? t.activeNav : t.inactiveNav}`}
                  >
                    <Contrast size={16} /> High Contrast
                  </button>
                </div>
              )}
            </div>

            <button 
              className={`relative p-2 ${t.icon} hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#500000]`}
              aria-label="Notifications - 1 Unread"
            >
              <Bell size={20} aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" aria-hidden="true"></span>
            </button>
            <div className={`flex items-center gap-3 pl-6 border-l ${t.border}`}>
              <div className="text-right hidden md:block">
                <p className={`text-sm font-bold ${t.text}`}>Howdy, Reveille!</p>
                <p className={`text-xs ${t.textSec}`}>UIN: 123004567</p>
              </div>
              <div 
                className={`w-10 h-10 ${theme === 'contrast' ? 'bg-yellow-400 text-black border-2 border-white' : 'bg-gray-200 text-gray-600 border-2 border-white'} rounded-full flex items-center justify-center font-bold shadow-sm`}
                aria-label="User Profile Picture"
                role="img"
              >
                RC
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* --- DASHBOARD VIEW --- */}
            {currentView === 'dashboard' && (
              <>
                {/* News Section */}
                <section aria-labelledby="news-heading">
                  <div className="flex items-center justify-between mb-6">
                    <h2 id="news-heading" className={`text-3xl font-bold ${t.accentText} tracking-tight`}>Campus News</h2>
                    <button className={`text-sm font-medium ${t.accentText} hover:underline flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-[#500000] rounded px-1`}>
                      View All News <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {newsItems.map((news, idx) => (
                      <article 
                        key={idx} 
                        className={`${t.paper} p-6 rounded-xl shadow-sm border ${t.border} ${t.cardHover} transition-all duration-300 group`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            theme === 'contrast' ? 'bg-white text-black border border-white' :
                            news.tag === 'Alert' ? 'bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100' :
                            news.tag === 'Sports' ? 'bg-orange-200 text-orange-900 dark:bg-orange-800 dark:text-orange-100' :
                            'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100'
                          }`}>
                            {news.tag}
                          </span>
                          <div className={`flex items-center ${t.textSec} text-xs gap-1`}>
                            <Clock size={12} aria-hidden="true" />
                            {news.time}
                          </div>
                        </div>
                        <h3 className={`text-lg font-bold ${t.text} group-hover:${t.accentText} transition-colors mb-2`}>
                          {news.title}
                        </h3>
                        <p className={`text-sm ${t.textSec} leading-relaxed mb-4`}>
                          {news.desc}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>

                {/* Dashboard Quick Links */}
                <section aria-labelledby="dashboard-heading">
                  <h2 id="dashboard-heading" className={`text-xl font-bold ${t.text} mb-6 flex items-center gap-2`}>
                    <span className={`w-1 h-6 ${t.accent} rounded-full block`} aria-hidden="true"></span>
                    Your Dashboard
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quickLinks.map((link, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleCardClick(link)}
                        className={`${t.paper} rounded-xl p-6 border ${t.border} shadow-sm ${t.cardHover} hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-[#500000]`}
                      >
                        <div className={`absolute top-0 left-0 w-1 h-full ${t.accent} opacity-0 group-hover:opacity-100 transition-opacity`} aria-hidden="true"></div>
                        
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-lg transition-colors ${
                            theme === 'contrast' 
                            ? 'bg-yellow-400 text-black' 
                            : 'bg-red-200 text-[#500000] dark:bg-red-800 dark:text-red-100 group-hover:bg-[#500000] group-hover:text-white'
                          }`}>
                            {link.icon}
                          </div>
                          <ExternalLink size={16} className={`${t.textSec} group-hover:${t.accentText} transition-colors`} aria-hidden="true" />
                        </div>
                        
                        <h3 className={`text-xl font-bold ${t.text} mb-2 group-hover:${t.accentText} transition-colors`}>
                          {link.title}
                        </h3>
                        <p className={`text-sm ${t.textSec} leading-relaxed`}>
                          {link.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* --- DETAIL VIEW (When clicking a card) --- */}
            {currentView !== 'dashboard' && (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                 {/* Back Button */}
                 <button 
                   onClick={() => setCurrentView('dashboard')}
                   className={`flex items-center gap-2 mb-6 text-sm font-bold ${t.accentText} hover:opacity-80 transition-opacity`}
                 >
                   <ArrowLeft size={16} /> Back to Dashboard
                 </button>

                 <div className={`${t.paper} border ${t.border} rounded-xl p-8 shadow-sm`}>
                    <div className="flex items-center gap-4 mb-8">
                       <div className={`p-4 rounded-xl ${t.accent} text-white`}>
                          {quickLinks.find(q => q.id === currentView)?.icon || <BookOpen size={24}/>}
                       </div>
                       <div>
                         <h2 className={`text-3xl font-bold ${t.text}`}>{currentView}</h2>
                         <p className={`${t.textSec}`}>Select a service to proceed.</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {navItems.find(n => n.id === currentView)?.subItems.map((subItem, idx) => (
                         <div key={idx} className={`p-6 border ${t.border} rounded-lg hover:border-[#500000] cursor-pointer group transition-all`}>
                            <h3 className={`font-bold text-lg ${t.text} group-hover:${t.accentText} transition-colors flex items-center justify-between`}>
                              {subItem}
                              <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h3>
                         </div>
                       ))}
                       {(!navItems.find(n => n.id === currentView)?.subItems.length) && (
                         <div className={`col-span-2 p-8 text-center border-2 border-dashed ${t.border} rounded-xl`}>
                            <p className={`${t.textSec}`}>No specific services listed for this category yet.</p>
                         </div>
                       )}
                    </div>
                 </div>
               </div>
            )}

            {/* AI Assistant Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 pb-12">
               <div className={`${t.accent} rounded-xl p-6 text-white col-span-1 lg:col-span-3 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg relative overflow-hidden ${theme === 'contrast' ? 'border-4 border-white' : ''}`}>
                 <div className="absolute top-0 right-0 p-8 opacity-10" aria-hidden="true">
                    <Sparkles size={120} />
                 </div>
                 <div className="z-10">
                   <h3 className={`text-xl font-bold mb-1 flex items-center gap-2 ${theme === 'contrast' ? 'text-black' : 'text-white'}`}>
                     <Sparkles size={20} className={theme === 'contrast' ? 'text-black' : 'text-yellow-400'} aria-hidden="true" />
                     Need help navigating?
                   </h3>
                   <p className={`text-sm ${theme === 'contrast' ? 'text-black font-bold' : 'text-red-100'}`}>Our AI assistant can help you find resources, explain registration, or find bus routes.</p>
                 </div>
                 <button 
                  onClick={() => setChatOpen(true)}
                  className={`${theme === 'contrast' ? 'bg-black text-yellow-400 border-2 border-white' : 'bg-white text-[#500000]'} px-6 py-3 rounded-lg font-bold hover:opacity-90 transition-colors whitespace-nowrap z-10 shadow-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white`}
                 >
                   <MessageCircle size={18} aria-hidden="true" />
                   Ask Howdy Bot
                 </button>
               </div>
            </div>

          </div>
        </div>

        {/* --- MODALS --- */}
        {/* Pay Bill Modal */}
        {showPayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`w-full max-w-md ${t.paper} rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-300 border ${t.border}`}>
              <div className={`${t.accent} p-6 text-white flex justify-between items-start`}>
                 <div>
                   <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                     <CreditCard size={20} /> Pay Tuition & Fees
                   </h3>
                   <p className="text-xs text-white/80">Secure Payment Portal</p>
                 </div>
                 <button onClick={() => setShowPayModal(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                   <X size={20} />
                 </button>
              </div>
              
              <div className="p-6 space-y-6">
                 <div className={`text-center p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border ${t.border}`}>
                    <p className={`text-sm ${t.textSec} mb-1`}>Total Balance Due</p>
                    <p className={`text-4xl font-bold ${t.text}`}>$4,520.00</p>
                    <p className="text-xs text-red-500 font-medium mt-1">Due Date: Oct 15, 2025</p>
                 </div>

                 <div className="space-y-3">
                    <button className={`w-full py-3 rounded-lg font-bold ${t.buttonPrimary} shadow-md`}>
                       Pay Full Amount
                    </button>
                    <button className={`w-full py-3 rounded-lg font-bold border ${t.border} ${t.text} hover:bg-gray-50 dark:hover:bg-slate-800`}>
                       Enroll in Payment Plan
                    </button>
                 </div>
              </div>
              
              <div className={`p-4 bg-gray-50 dark:bg-slate-800 border-t ${t.border} text-center`}>
                 <p className={`text-xs ${t.textSec}`}> payments processed securely via Flywire</p>
              </div>
            </div>
          </div>
        )}

        {/* --- HOWDY BOT CHAT INTERFACE --- */}
        {/* Floating Action Button (visible if chat is closed) */}
        {!chatOpen && (
          <button 
            onClick={() => setChatOpen(true)}
            aria-label="Open Chat Assistant"
            className={`absolute bottom-6 right-6 w-14 h-14 ${t.accent} ${theme === 'contrast' ? 'text-black border-2 border-white' : 'text-white'} rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-30 group focus:outline-none focus:ring-4 focus:ring-[#500000]/40`}
          >
            <MessageCircle size={28} aria-hidden="true" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500"></span>
            </span>
          </button>
        )}

        {/* Chat Window */}
        {chatOpen && (
          <div 
            className={`absolute bottom-6 right-6 w-96 h-[500px] ${t.paper} rounded-2xl shadow-2xl border ${t.border} flex flex-col z-40 animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden`}
            role="dialog"
            aria-label="Howdy Bot Chat Window"
          >
            {/* Chat Header */}
            <div className={`${t.accent} p-4 flex items-center justify-between ${theme === 'contrast' ? 'text-black border-b-2 border-white' : 'text-white'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${theme === 'contrast' ? 'bg-black' : 'bg-white/20'} rounded-full flex items-center justify-center backdrop-blur-sm`}>
                  <Bot size={18} className={theme === 'contrast' ? 'text-yellow-400' : 'text-white'} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Howdy Bot</h3>
                  <p className={`text-xs ${theme === 'contrast' ? 'text-black font-bold' : 'text-red-200'} flex items-center gap-1`}>
                    <span className="w-2 h-2 bg-green-400 rounded-full block" aria-hidden="true"></span> Online
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                aria-label="Close Chat"
                className="p-1 hover:opacity-50 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${t.bg}`} aria-live="polite">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? `${t.accent} ${theme === 'contrast' ? 'text-black border-2 border-white' : 'text-white'} rounded-br-none shadow-md` 
                      : `${t.paper} ${t.text} border ${t.border} rounded-bl-none shadow-sm`
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className={`${t.paper} p-3 rounded-2xl rounded-bl-none border ${t.border} shadow-sm flex items-center gap-2`}>
                    <Loader2 size={16} className={`animate-spin ${t.accentText}`} aria-hidden="true" />
                    <span className={`text-xs ${t.textSec}`}>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={`p-3 ${t.paper} border-t ${t.border}`}>
              <div className={`flex items-center gap-2 ${theme === 'contrast' ? 'bg-black' : theme === 'dark' ? 'bg-slate-800' : 'bg-gray-100'} p-2 rounded-full border ${t.border} focus-within:ring-2 focus-within:ring-[#500000]/20 transition-all`}>
                <input 
                  ref={chatInputRef}
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question..."
                  aria-label="Chat Message Input"
                  className={`flex-1 bg-transparent px-3 text-sm focus:outline-none ${t.text} placeholder:${t.textSec}`}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !chatInput.trim()}
                  aria-label="Send Message"
                  className={`p-2 ${t.accent} ${theme === 'contrast' ? 'text-black' : 'text-white'} rounded-full hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#500000] focus:ring-offset-1`}
                >
                  <Send size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="text-center mt-2">
                <p className={`text-[10px] ${t.textSec}`}>AI can make mistakes. Check important info.</p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default HowdyPortal;