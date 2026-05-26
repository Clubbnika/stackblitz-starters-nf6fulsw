'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, remove, update } from 'firebase/database';

// Твій конфіг Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyD3s0uLj2sp2cE218ti0Q1gK3jOFBZDXrI',
  authDomain: 'nikmenu-9a6f0.firebaseapp.com',
  databaseURL: "https://nikmenu-9a6f0-default-rtdb.firebaseio.com",
    projectId: 'nikmenu-9a6f0',
  storageBucket: 'nikmenu-9a6f0.firebasestorage.app',
  messagingSenderId: '667053801751',
  appId: '1:667053801751:web:c657209aa3d56cb77f3752',
};

// Безпечна ініціалізація для Next.js (щоб додаток не видавав помилку при перезавантаженні сторінки)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

interface Meal {
  id?: string;
  name: string;
  category: string;
  calories: number | '';
  provider: string;
  rating: number;
  isWishlist?: boolean;
}

export default function SmartMenuPlanner() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Основна страва');
  const [calories, setCalories] = useState<number | ''>('');
  const [provider, setProvider] = useState('GUD FUD');
  const [rating, setRating] = useState(5);
  const [isWishlist, setIsWishlist] = useState(false);

  const [activeTab, setActiveTab] = useState<'rated' | 'wishlist'>('rated');
  const [limitType, setLimitType] = useState<'four' | 'three'>('four');
  const [randomMenu, setRandomMenu] = useState<Meal[]>([]);
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);

  const providers = ['GUD FUD', 'Healthy lunch'];
  const categoriesList = ['Основна страва', 'Гарнір', 'Салати', 'Супи', 'Сендвічі', 'Десерти'];

  // Завантаження даних
  useEffect(() => {
    try {
      const mealsRef = ref(db, 'meals');
      const unsubscribe = onValue(mealsRef, (snapshot) => {
        setIsDatabaseConnected(true);
        const data = snapshot.val();
        if (data) {
          const loadedMeals: Meal[] = Object.entries(data).map(([id, value]: [string, any]) => ({
            id,
            ...value,
          }));
          setMeals(loadedMeals);
        } else {
          setMeals([]);
        }
      }, (error) => {
        console.error("Firebase connection error:", error);
        setIsDatabaseConnected(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.error("Firebase init catch:", err);
      setIsDatabaseConnected(false);
    }
  }, []);

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const mealsRef = ref(db, 'meals');
    const newMeal: Meal = {
      name: name.trim(),
      category,
      calories: calories === '' ? 0 : calories,
      provider,
      rating: isWishlist ? 0 : rating,
      isWishlist: isWishlist,
    };

    push(mealsRef, newMeal);
    setName('');
    setCalories('');
    setIsWishlist(false);
  };

  const handleDeleteMeal = (id: string) => {
    if (confirm('Видалити цю страву?')) {
      remove(ref(db, `meals/${id}`));
    }
  };

  const handleApproveWishlistMeal = (id: string, userRating: number) => {
    update(ref(db, `meals/${id}`), {
      isWishlist: false,
      rating: userRating
    });
  };

  const generateMenu = () => {
    const ratedMeals = meals.filter(m => !m.isWishlist);
    const byCategory: Record<string, Meal[]> = {};
    categoriesList.forEach(cat => {
      byCategory[cat] = ratedMeals.filter(m => m.category === cat);
    });

    const selected: Meal[] = [];
    const pullRandom = (catName: string, count: number) => {
      const available = [...(byCategory[catName] || [])];
      for (let i = 0; i < count; i++) {
        if (available.length > 0) {
          const idx = Math.floor(Math.random() * available.length);
          selected.push(available.splice(idx, 1)[0]);
        }
      }
    };

    if (limitType === 'four') {
      const shuffledCategories = [...categoriesList].sort(() => 0.5 - Math.random()).slice(0, 4);
      shuffledCategories.forEach(cat => pullRandom(cat, 1));
    } else {
      const allowedSlots: string[] = [];
      for (let i = 0; i < 2; i++) {
        allowedSlots.push('Салати', 'Сендвічі', 'Супи', 'Десерти');
      }
      allowedSlots.push('Основна страва', 'Гарнір');

      const finalSlots = allowedSlots.sort(() => 0.5 - Math.random()).slice(0, 3);
      const counts = finalSlots.reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(counts).forEach(([cat, count]) => {
        pullRandom(cat, count);
      });
    }
    setRandomMenu(selected);
  };

  return (
    <div className="min-h-screen bg-[#FFF0F5] text-black font-mono p-4 md:p-8 flex flex-col items-center面">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ЛІВА ЧАСТИНА */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="border-4 border-black bg-[#FF1493] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white text-center">
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider">
              MARKETING IS OUR ART? <br /> NO, MENU IS! 🦖
            </h1>
            <div className="mt-4 inline-block bg-white text-black font-bold px-3 py-1 border-2 border-black uppercase text-sm">
              SUCCESS IS YOUR REALITY / DAILY PLANNER
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className={`w-3 h-3 rounded-full border border-black ${isDatabaseConnected ? 'bg-[#00FF7F]' : 'bg-red-500'}`}></span>
              <span className="text-xs font-bold uppercase bg-black text-white px-2 py-0.5">
                {isDatabaseConnected ? 'DATABASE CONNECTED' : 'DATABASE DISCONNECTED'}
              </span>
            </div>
          </div>

          <form onSubmit={handleAddMeal} className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
            <h2 className="text-lg font-black uppercase bg-black text-white px-2 py-1 inline-block self-start">[ ДОДАТИ СТРАВУ ]</h2>
            
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Назва страви</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="напр., Авокадо-тост" 
                className="w-full p-2 border-2 border-black font-bold focus:outline-none focus:bg-[#FFF0F5]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Категорія</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2 border-2 border-black font-bold focus:outline-none bg-white"
                >
                  {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Калорії</label>
                <input 
                  type="text" 
                  value={calories}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCalories(val === '' ? '' : Number(val));
                  }}
                  placeholder="300" 
                  className="w-full p-2 border-2 border-black font-bold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase mb-1">Джерело їжі</label>
              <div className="flex gap-2">
                {providers.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={`flex-1 p-2 border-2 border-black font-bold text-sm transition-all ${provider === p ? 'bg-[#FF1493] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {!isWishlist && (
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Оцінка смаку: {rating}/5</label>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  value={rating} 
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full accent-black"
                />
              </div>
            )}

            <label className="flex items-center gap-3 bg-[#FFF0F5] p-3 border-2 border-black cursor-pointer">
              <input 
                type="checkbox" 
                checked={isWishlist} 
                onChange={(e) => setIsWishlist(e.target.checked)}
                className="w-5 h-5 accent-[#FF1493]"
              />
              <span className="text-xs font-black uppercase text-black">📌 Ще не куштувала (хочу замовити)</span>
            </label>

            <button type="submit" className="w-full bg-[#00FF7F] text-black font-black p-3 border-4 border-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Зберегти у базу даних
            </button>
          </form>

          <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
            <h2 className="text-lg font-black uppercase bg-black text-white px-2 py-1 inline-block self-start">[ ГЕНЕРАТОР МЕНЮ ]</h2>
            <div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setLimitType('four')}
                  className={`p-2 text-left border-2 border-black font-bold text-xs ${limitType === 'four' ? 'bg-[#FF1493] text-white' : 'bg-gray-50'}`}
                >
                  🎰 Варіант 1: Обрати "4" страви (по 1 з кат.)
                </button>
                <button
                  type="button"
                  onClick={() => setLimitType('three')}
                  className={`p-2 text-left border-2 border-black font-bold text-xs ${limitType === 'three' ? 'bg-[#FF1493] text-white' : 'bg-gray-50'}`}
                >
                  🎰 Варіант 2: Обрати "3" страви (до 2 з кат.)
                </button>
              </div>
            </div>

            <button type="button" onClick={generateMenu} className="w-full bg-[#FFFF00] text-black font-black p-3 border-4 border-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              🎲 Згенерувати випадкове меню
            </button>

            {randomMenu.length > 0 && (
              <div className="mt-2 p-3 bg-[#FFF0F5] border-2 border-black flex flex-col gap-2">
                {randomMenu.map((meal, i) => (
                  <div key={i} className="text-xs font-bold border-b border-black last:border-0 pb-1 flex justify-between">
                    <span>⚡ {meal.name} <span className="text-gray-500">({meal.category})</span></span>
                    <span className="bg-black text-white px-1">{meal.provider}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ПРАВА ЧАСТИНА */}
        <div className="lg:col-span-7 border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('rated')}
              className={`flex-1 p-3 border-4 border-black font-black uppercase text-sm tracking-wider ${activeTab === 'rated' ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(255,20,147,1)]' : 'bg-white text-black'}`}
            >
              🥗 Оцінені ({meals.filter(m => !m.isWishlist).length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('wishlist')}
              className={`flex-1 p-3 border-4 border-black font-black uppercase text-sm tracking-wider ${activeTab === 'wishlist' ? 'bg-[#FF1493] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black'}`}
            >
              📌 Планую спробувати ({meals.filter(m => !!m.isWishlist).length})
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-[700px] overflow-y-auto pr-2">
            {meals
              .filter(meal => activeTab === 'wishlist' ? !!meal.isWishlist : !meal.isWishlist)
              .map((meal) => (
                <div key={meal.id} className="p-4 border-2 border-black flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <div>
                    <div className="font-black text-base uppercase flex items-center gap-2">
                      {meal.name} <span className="text-[10px] bg-black text-white px-2">{meal.category}</span>
                    </div>
                    <div className="text-xs font-bold text-gray-700 flex gap-3 mt-1">
                      <span>🔥 {meal.calories} ккал</span> <span>📦 {meal.provider}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    {!meal.isWishlist ? (
                      <div className="flex text-[#FF1493] text-lg font-black">
                        {(() => {
                          const displayRating = meal.rating > 5 ? Math.round(meal.rating / 2) : meal.rating;
                          const safeRating = Math.max(0, Math.min(5, displayRating || 0));
                          return <>{'★'.repeat(safeRating)}{'☆'.repeat(5 - safeRating)}</>;
                        })()}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-white p-1 border border-black">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleApproveWishlistMeal(meal.id!, num)}
                            className="hover:text-[#FF1493] font-black text-xs px-1 border border-gray-200 bg-gray-50"
                          >
                            {num}★
                          </button>
                        ))}
                      </div>
                    )}
                    <button type="button" onClick={() => handleDeleteMeal(meal.id!)} className="bg-black text-white font-bold px-2 py-1 text-xs">❌</button>
                  </div>
                </div>
              ))}
          </div>
        </div>

      </div>
    </div>
  );
}