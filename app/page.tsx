'use client';

import React, { useState, useEffect } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, remove, update } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyD3s0uLj2sp2cE218ti0Q1gK3jOFBZDXrI',
  authDomain: 'nikmenu-9a6f0.firebaseapp.com',
  databaseURL: "https://nikmenu-9a6f0-default-rtdb.firebaseio.com",
  projectId: 'nikmenu-9a6f0',
  storageBucket: 'nikmenu-9a6f0.firebasestorage.app',
  messagingSenderId: '667053801751',
  appId: '1:667053801751:web:c657209aa3d56cb77f3752',
};

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
  isWishList?: boolean;
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
  const [randomMenu, setRandomMenu] = useState<Meal[]>([]);
  const [lockedSlots, setLockedSlots] = useState<Record<number, boolean>>({});
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(false);

  const providers = ['GUD FUD', 'Healthy lunch'];
  const categoriesList = ['Основна страва', 'Гарнір', 'Салати', 'Супи', 'Сендвічі', 'Десерти'];

  const checkIsWishlist = (meal: Meal): boolean => !!meal.isWishlist || !!meal.isWishList;

  useEffect(() => {
    const dishesRef = ref(db, 'dishes');
    return onValue(dishesRef, (snapshot) => {
      setIsDatabaseConnected(true);
      const data = snapshot.val();
      setMeals(data ? Object.entries(data).map(([id, value]: [string, any]) => ({ id, ...value })) : []);
    }, () => setIsDatabaseConnected(false));
  }, []);

  const getWeightedRandom = (items: Meal[]): Meal => {
    const totalWeight = items.reduce((sum, m) => sum + (m.rating || 1), 0);
    let random = Math.random() * totalWeight;
    for (const item of items) {
      random -= (item.rating || 1);
      if (random <= 0) return item;
    }
    return items[items.length - 1];
  };

  const generateMenu = (forceFull: boolean = false) => {
    const ratedMeals = meals.filter(m => !checkIsWishlist(m));
    if (ratedMeals.length === 0) return;

    // Створюємо масив на 4 слоти (як у твоєму дизайні)
    let newMenu = forceFull ? new Array(4).fill(null) : (randomMenu.length > 0 ? [...randomMenu] : new Array(4).fill(null));
    if (forceFull) setLockedSlots({});

    const updatedMenu = newMenu.map((meal, i) => {
      if (lockedSlots[i] && meal) return meal;
      const randomCat = categoriesList[Math.floor(Math.random() * categoriesList.length)];
      const candidates = ratedMeals.filter(m => m.category === randomCat);
      return candidates.length > 0 ? getWeightedRandom(candidates) : getWeightedRandom(ratedMeals);
    });
    setRandomMenu(updatedMenu);
  };

  const toggleLock = (index: number) => setLockedSlots(prev => ({ ...prev, [index]: !prev[index] }));

  const handleAddMeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    push(ref(db, 'dishes'), { name, category, calories: calories || 0, provider, rating: isWishlist ? 0 : rating, isWishlist });
    setName(''); setCalories(''); setIsWishlist(false);
  };

  const handleDeleteMeal = (id: string) => { if (confirm('Видалити?')) remove(ref(db, `dishes/${id}`)); };

  const handleApproveWishlistMeal = (id: string, userRating: number) => {
    update(ref(db, `dishes/${id}`), { isWishlist: false, isWishList: false, rating: userRating });
  };

  return (
    <div className="min-h-screen bg-[#FFF0F5] text-black font-mono p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ЛІВА ЧАСТИНА (Твій оригінальний дизайн) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="border-4 border-black bg-[#FF1493] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white text-center">
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wider">MARKETING IS OUR ART? <br /> NO, MENU IS! 🦖</h1>
            <div className="mt-4 inline-block bg-white text-black font-bold px-3 py-1 border-2 border-black uppercase text-sm">SUCCESS IS YOUR REALITY / DAILY PLANNER</div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <span className={`w-3 h-3 rounded-full border border-black ${isDatabaseConnected ? 'bg-[#00FF7F]' : 'bg-red-500'}`}></span>
              <span className="text-xs font-bold uppercase bg-black text-white px-2 py-0.5">{isDatabaseConnected ? 'DATABASE CONNECTED' : 'DATABASE DISCONNECTED'}</span>
            </div>
          </div>

          <form onSubmit={handleAddMeal} className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4">
            <h2 className="text-lg font-black uppercase bg-black text-white px-2 py-1 inline-block self-start">[ ДОДАТИ СТРАВУ ]</h2>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Назва страви</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="напр., Авокадо-тост" className="w-full p-2 border-2 border-black font-bold focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Категорія</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border-2 border-black font-bold bg-white">{categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Калорії</label>
                <input type="text" value={calories} onChange={(e) => setCalories(Number(e.target.value))} placeholder="300" className="w-full p-2 border-2 border-black font-bold" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Джерело їжі</label>
              <div className="flex gap-2">{providers.map(p => <button key={p} type="button" onClick={() => setProvider(p)} className={`flex-1 p-2 border-2 border-black font-bold text-sm ${provider === p ? 'bg-[#FF1493] text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}>{p}</button>)}</div>
            </div>
            {!isWishlist && (
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Оцінка смаку: {rating}/5</label>
                <input type="range" min="1" max="5" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full accent-black" />
              </div>
            )}
            <label className="flex items-center gap-3 bg-[#FFF0F5] p-3 border-2 border-black cursor-pointer">
              <input type="checkbox" checked={isWishlist} onChange={(e) => setIsWishlist(e.target.checked)} className="w-5 h-5 accent-[#FF1493]" />
              <span className="text-xs font-black uppercase text-black">📌 Ще не куштувала (хочу замовити)</span>
            </label>
            <button type="submit" className="w-full bg-[#00FF7F] text-black font-black p-3 border-4 border-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Зберегти у базу даних</button>
          </form>

          {/* ГЕНЕРАТОР З ЗАМОЧКАМИ */}
          <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-lg font-black uppercase mb-4">[ ГЕНЕРАТОР МЕНЮ ]</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={() => generateMenu(true)} className="bg-[#FFFF00] font-black p-2 border-2 border-black text-xs uppercase">🎲 Новий пак</button>
              <button onClick={() => generateMenu(false)} className="bg-[#00FF7F] font-black p-2 border-2 border-black text-xs uppercase">⚡ Вільні слоти</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {randomMenu.map((meal, i) => (
                <div key={i} className={`p-2 border-2 ${lockedSlots[i] ? 'border-[#FF1493]' : 'border-black'} flex justify-between items-center`}>
                  <span className="text-[10px] font-bold">{meal?.name || "..."}</span>
                  <button onClick={() => toggleLock(i)} className="text-xs">{lockedSlots[i] ? '🔒' : '🔓'}</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ПРАВА ЧАСТИНА (Твій оригінальний дизайн) */}
        <div className="lg:col-span-7 border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex gap-2 mb-6">
            <button onClick={() => setActiveTab('rated')} className={`flex-1 p-3 border-4 font-black uppercase text-sm ${activeTab === 'rated' ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(255,20,147,1)]' : 'bg-white'}`}>🥗 Оцінені ({meals.filter(m => !checkIsWishlist(m)).length})</button>
            <button onClick={() => setActiveTab('wishlist')} className={`flex-1 p-3 border-4 font-black uppercase text-sm ${activeTab === 'wishlist' ? 'bg-[#FF1493] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white'}`}>📌 Планую спробувати ({meals.filter(m => checkIsWishlist(m)).length})</button>
          </div>
          <div className="space-y-3">
            {meals.filter(m => activeTab === 'wishlist' ? checkIsWishlist(m) : !checkIsWishlist(m)).map(m => (
              <div key={m.id} className="p-4 border-2 border-black flex justify-between items-center gap-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="font-black text-xs uppercase">{m.name} <span className="text-[10px] bg-black text-white px-1">({m.category})</span></div>
                <div className="flex gap-2">
                  {activeTab === 'wishlist' ? [1,2,3,4,5].map(n => <button key={n} onClick={() => handleApproveWishlistMeal(m.id!, n)} className="text-[10px] font-bold border border-black px-1">{n}★</button>) : <span className="text-[#FF1493] font-black">{'★'.repeat(m.rating)}</span>}
                  <button onClick={() => handleDeleteMeal(m.id!)} className="bg-black text-white px-2 font-bold text-xs">❌</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}