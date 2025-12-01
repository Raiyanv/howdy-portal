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
  Lock
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

const App = () => {
  // --- LOGIN STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Home');
  const [expandedMenu, setExpandedMenu] = useState({
    Academics: true,
    Registration: false,
    Resources: false,
    'Social Life': false,
    'Finance & Tuition': false
  });

  // --- AI FEATURES STATE ---
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'system', text: "Howdy! I'm your AI assistant. Ask me about registration, bus routes, or campus traditions!" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // State for "Smart Brief" on news items
  const [newsAnalysis, setNewsAnalysis] = useState({}); // { newsIndex: "analysis text" }
  const [loadingNewsIndex, setLoadingNewsIndex] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isLoggedIn) {
        scrollToBottom();
    }
  }, [chatMessages, chatOpen, isLoggedIn]);

  // --- HANDLERS ---

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setChatOpen(false); // Close chat on logout
    setSidebarOpen(true); // Reset sidebar
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

  const handleSmartBrief = async (newsItem, index) => {
    if (newsAnalysis[index]) {
      // Toggle off if already showing
      const newAnalysis = { ...newsAnalysis };
      delete newAnalysis[index];
      setNewsAnalysis(newAnalysis);
      return;
    }

    setLoadingNewsIndex(index);
    
    const prompt = `Analyze this news headline and description for a Texas A&M student: 
    Headline: "${newsItem.title}"
    Description: "${newsItem.desc}"
    
    Tell me "Why this matters" in 1-2 short sentences. Focus on the practical impact on a student's day-to-day life.`;

    const analysis = await callGemini(prompt);
    
    setNewsAnalysis(prev => ({ ...prev, [index]: analysis }));
    setLoadingNewsIndex(null);
  };

  const toggleMenu = (category) => {
    setExpandedMenu(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // --- DATA ---
  const navItems = [
    { 
      id: 'Academics', 
      icon: <BookOpen size={18} />, 
      subItems: ['UGDP', 'Aggie Schedule Builder', 'View Grades', 'View Schedule'] 
    },
    { 
      id: 'Registration', 
      icon: <Calendar size={18} />, 
      subItems: ['Search Classes', 'Add/Drop', 'Registration Status'] 
    },
    { 
      id: 'Resources', 
      icon: <Briefcase size={18} />, 
      subItems: ['Library', 'Transport', 'IT Help'] 
    },
    { 
      id: 'Social Life', 
      icon: <Users size={18} />, 
      subItems: ['Campus Events', 'Student Orgs', 'Rec Sports', 'MSC Box Office'] 
    },
    { 
      id: 'Finance & Tuition', 
      icon: <DollarSign size={18} />, 
      subItems: ['Pay Bill', 'Financial Aid Portal', '1098-T Tax Form', 'Scholarships'] 
    },
    { id: 'Campus Services', icon: <Monitor size={18} />, subItems: ['Housing Portal', 'Dining & Meal Plans', 'Parking Services'] },
  ];

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
    { title: "Academics", icon: <BookOpen size={32} />, desc: "View courses, grades, schedules, and degree progress." },
    { title: "Registration", icon: <Calendar size={32} />, desc: "Plan and register for classes, manage waitlists." },
    { title: "Resources", icon: <Briefcase size={32} />, desc: "Find advising, tutoring, counseling, and career services." },
    { title: "Social Life", icon: <Users size={32} />, desc: "Explore campus events, student orgs, and activities." },
    { title: "Finance & Tuition", icon: <DollarSign size={32} />, desc: "Pay tuition, manage financial aid, and billing details." },
    { title: "Campus Services", icon: <Monitor size={32} />, desc: "Access housing, dining, parking, and IT support tools." },
  ];

  // --- RENDER LOGIN SCREEN ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-slate-800">
        {/* Login Header */}
        <header className="bg-[#500000] h-20 px-4 md:px-8 flex items-center justify-between shadow-md z-10">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white rounded text-[#500000] flex items-center justify-center font-bold text-xl shadow-sm">
               A&M
             </div>
             <span className="font-bold text-xl text-white tracking-tight">Howdy Portal</span>
           </div>
           <a href="#" className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors">
             <Lock size={14} />
             Secure Login
           </a>
        </header>

        {/* Main Login Area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[550px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Left Side - Hero/Branding */}
            <div className="w-full md:w-1/2 bg-gradient-to-br from-[#500000] to-[#300000] p-12 text-white flex flex-col justify-between relative overflow-hidden group">
               {/* Decorative Elements */}
               <div className="absolute top-[-50px] left-[-50px] w-40 h-40 rounded-full border-4 border-white/10 group-hover:scale-110 transition-transform duration-700"></div>
               <div className="absolute bottom-[-20px] right-[-20px] w-60 h-60 rounded-full bg-white/5 group-hover:scale-105 transition-transform duration-700"></div>
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
               
               <div className="z-10 mt-6 md:mt-12">
                 <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">Welcome to Aggieland</h2>
                 <p className="text-red-100 text-lg leading-relaxed font-light">
                   Access your grades, schedule, financial aid, and campus resources in one unified dashboard.
                 </p>
               </div>

               <div className="z-10 mt-8">
                 <div className="flex items-center gap-2 text-sm text-red-200 bg-black/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                   <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
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

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">NetID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. reveille"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#500000]/20 focus:border-[#500000] outline-none transition-all bg-gray-50 focus:bg-white"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Password</label>
                    <a href="#" className="text-xs text-[#500000] hover:underline font-medium">Forgot Password?</a>
                  </div>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#500000]/20 focus:border-[#500000] outline-none transition-all bg-gray-50 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember" className="rounded border-gray-300 text-[#500000] focus:ring-[#500000]" />
                  <label htmlFor="remember" className="text-sm text-gray-600">Remember me for 7 days</label>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-[#500000] text-white font-bold py-3 rounded-lg hover:bg-red-900 transition-all transform active:scale-[0.98] shadow-lg shadow-red-900/20 flex items-center justify-center gap-2 group"
                >
                  Log In <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400">
                  By logging in, you agree to the <a href="#" className="underline hover:text-gray-600">Acceptable Use Policy</a>.
                </p>
                <div className="mt-4 text-xs text-gray-400 flex justify-center gap-4">
                   <a href="#" className="hover:text-gray-600">Parent Access</a>
                   <span>•</span>
                   <a href="#" className="hover:text-gray-600">Help Desk</a>
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
    <div className="flex h-screen bg-gray-50 font-sans text-slate-800 overflow-hidden relative">
      
      {/* Sidebar Navigation */}
      <aside 
        className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-sm z-20 flex-shrink-0`}
      >
        <div className="h-24 flex items-center justify-center border-b border-gray-100 p-6">
          <div className="flex items-center gap-3 w-full">
            <div className="w-12 h-12 bg-[#500000] rounded text-white flex items-center justify-center font-bold text-xl flex-shrink-0">
              A&M
            </div>
            {sidebarOpen && (
              <span className="font-bold text-xl tracking-tight text-[#500000]">Howdy Portal</span>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-[#500000]" size={18} />
            {sidebarOpen ? (
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#500000]/20 focus:border-[#500000] transition-all"
              />
            ) : (
              <div className="w-full h-10 bg-gray-50 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-100">
                <Search size={18} className="text-gray-400" />
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
          {navItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => sidebarOpen ? toggleMenu(item.id) : setSidebarOpen(true)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                  activeCategory === item.id 
                    ? 'bg-[#500000] text-white' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#500000]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  {sidebarOpen && <span className="font-medium text-sm">{item.id}</span>}
                </div>
                {sidebarOpen && item.subItems.length > 0 && (
                  expandedMenu[item.id] 
                    ? <ChevronDown size={14} className={activeCategory === item.id ? 'text-white' : 'text-gray-400'} /> 
                    : <ChevronRight size={14} className="text-gray-400" />
                )}
              </button>
              
              {sidebarOpen && expandedMenu[item.id] && item.subItems.length > 0 && (
                <div className="ml-9 mt-1 space-y-1 border-l-2 border-gray-100 pl-2">
                  {item.subItems.map((sub, idx) => (
                    <a 
                      key={idx} 
                      href="#" 
                      className="block px-3 py-2 text-sm text-gray-500 hover:text-[#500000] rounded hover:bg-red-50 transition-colors"
                    >
                      {sub}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 text-gray-500 hover:text-[#500000] transition-colors w-full p-2 rounded-lg hover:bg-red-50"
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="text-sm font-medium">Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8F9FA] relative">
        
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8 flex-shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <MenuIcon size={20} />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              Howdy Home Page
            </h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-800">Howdy, Reveille!</p>
                <p className="text-xs text-gray-500">UIN: 123004567</p>
              </div>
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold border-2 border-white shadow-sm">
                RC
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto space-y-8">

            {/* News Section */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-[#500000] tracking-tight">Campus News</h2>
                <button className="text-sm font-medium text-[#500000] hover:underline flex items-center gap-1">
                  View All News <ChevronRight size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {newsItems.map((news, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-red-100 transition-all duration-300 group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        news.tag === 'Alert' ? 'bg-red-100 text-red-700' :
                        news.tag === 'Sports' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        {news.tag}
                      </span>
                      <div className="flex items-center text-gray-400 text-xs gap-1">
                        <Clock size={12} />
                        {news.time}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#500000] transition-colors mb-2">
                      {news.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-4">
                      {news.desc}
                    </p>
                    
                    {/* Gemini Smart Brief Button */}
                    <button 
                      onClick={(e) => { e.preventDefault(); handleSmartBrief(news, idx); }}
                      className="flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full w-fit"
                    >
                      {loadingNewsIndex === idx ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Sparkles size={14} />
                      )}
                      {newsAnalysis[idx] ? "Hide Smart Brief" : "Smart Brief"}
                    </button>

                    {/* AI Analysis Result */}
                    {newsAnalysis[idx] && (
                      <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-900 animate-in fade-in slide-in-from-top-2">
                        <div className="flex gap-2 items-start">
                          <Bot size={16} className="mt-0.5 flex-shrink-0" />
                          <p>{newsAnalysis[idx]}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Dashboard Quick Links */}
            <section>
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#500000] rounded-full block"></span>
                Your Dashboard
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quickLinks.map((link, idx) => (
                  <div 
                    key={idx}
                    className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#500000] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-red-50 rounded-lg text-[#500000] group-hover:bg-[#500000] group-hover:text-white transition-colors">
                        {link.icon}
                      </div>
                      <ExternalLink size={16} className="text-gray-300 group-hover:text-[#500000] transition-colors" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-[#500000] transition-colors">
                      {link.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {link.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* AI Assistant Banner */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4 pb-12">
               <div className="bg-[#500000] rounded-xl p-6 text-white col-span-1 lg:col-span-3 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles size={120} />
                 </div>
                 <div className="z-10">
                   <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                     <Sparkles size={20} className="text-yellow-400" />
                     Need help navigating?
                   </h3>
                   <p className="text-red-100 text-sm">Our AI assistant can help you find resources, explain registration, or find bus routes.</p>
                 </div>
                 <button 
                  onClick={() => setChatOpen(true)}
                  className="bg-white text-[#500000] px-6 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors whitespace-nowrap z-10 shadow-lg flex items-center gap-2"
                 >
                   <MessageCircle size={18} />
                   Ask Howdy Bot
                 </button>
               </div>
            </div>

          </div>
        </div>

        {/* --- HOWDY BOT CHAT INTERFACE --- */}
        {/* Floating Action Button (visible if chat is closed) */}
        {!chatOpen && (
          <button 
            onClick={() => setChatOpen(true)}
            className="absolute bottom-6 right-6 w-14 h-14 bg-[#500000] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-30 group"
          >
            <MessageCircle size={28} />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500"></span>
            </span>
          </button>
        )}

        {/* Chat Window */}
        {chatOpen && (
          <div className="absolute bottom-6 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-40 animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden">
            {/* Chat Header */}
            <div className="bg-[#500000] p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Howdy Bot</h3>
                  <p className="text-xs text-red-200 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full block"></span> Online
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setChatOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#500000] text-white rounded-br-none shadow-md' 
                      : 'bg-white text-gray-700 border border-gray-200 rounded-bl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl rounded-bl-none border border-gray-200 shadow-sm flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-[#500000]" />
                    <span className="text-xs text-gray-400">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-gray-100">
              <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-[#500000]/20 focus-within:border-[#500000] transition-all">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask a question..."
                  className="flex-1 bg-transparent px-3 text-sm focus:outline-none text-gray-700 placeholder:text-gray-400"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="p-2 bg-[#500000] text-white rounded-full hover:bg-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="text-center mt-2">
                <p className="text-[10px] text-gray-400">AI can make mistakes. Check important info.</p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;