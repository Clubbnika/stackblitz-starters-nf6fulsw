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
    let newMenu = forceFull ? new Array(4).fill(null) : [...randomMenu];
    if (forceFull) setLockedSlots({});
    const updatedMenu = newMenu.map((meal, i) => {
      if (lockedSlots[i] && meal) return meal;
      const randomCat = categoriesList[Math.floor(Math.random() * categoriesList.length)];
      const candidates = ratedMeals.filter(m => m.category === randomCat);
      return candidates.length > 0 ? getWeightedRandom(candidates) : getWeightedRandom(ratedMeals);
    });
    setRandomMenu(updatedMenu);
  };

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
        {/* ЛІВА ЧАСТИНА: Генератор та Форма */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="font-black uppercase mb-4">[ 🎲 ГЕНЕРАТОР ]</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={() => generateMenu(true)} className="bg-[#FFFF00] font-black p-2 border-2 border-black text-[10px]">НОВИЙ ПАК</button>
              <button onClick={() => generateMenu(false)} className="bg-[#00FF7F] font-black p-2 border-2 border-black text-[10px]">ВІЛЬНІ СЛОТИ</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {randomMenu.map((meal, i) => (
                <div key={i} className={`p-2 border-2 ${lockedSlots[i] ? 'border-[#FF1493]' : 'border-black'} flex justify-between items-center text-[10px]`}>
                  <div className="truncate font-bold">{meal?.name || "..."}</div>
                  <button onClick={() => setLockedSlots(prev => ({...prev, [i]: !prev[i]}))}>{lockedSlots[i] ? '🔒' : '🔓'}</button>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddMeal} className="border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2">
            <input placeholder="Назва" value={name} onChange={e => setName(e.target.value)} className="border-2 border-black p-2 font-bold" />
            <div className="grid grid-cols-2 gap-2">
              <select value={category} onChange={e => setCategory(e.target.value)} className="border-2 border-black p-2">{categoriesList.map(c => <option key={c}>{c}</option>)}</select>
              <input type="number" placeholder="Ккал" value={calories} onChange={e => setCalories(Number(e.target.value))} className="border-2 border-black p-2" />
            </div>
            <div className="flex gap-2">
              {providers.map(p => <button key={p} type="button" onClick={() => setProvider(p)} className={`flex-1 p-2 border-2 ${provider === p ? 'bg-[#FF1493] text-white' : ''}`}>{p}</button>)}
            </div>
            <input type="range" min="1" max="5" value={rating} onChange={e => setRating(Number(e.target.value))} className="accent-black" />
            <label className="flex items-center gap-2"><input type="checkbox" checked={isWishlist} onChange={e => setIsWishlist(e.target.checked)} /> ПЛАНУЮ СПРОБУВАТИ</label>
            <button type="submit" className="bg-[#00FF7F] font-black p-3 uppercase border-2 border-black">Додати</button>
          </form>
        </div>

        {/* ПРАВА ЧАСТИНА: Списки */}
        <div className="lg:col-span-7 border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex gap-2 mb-6">
            <button onClick={() => setActiveTab('rated')} className={`flex-1 p-3 border-4 font-black ${activeTab === 'rated' ? 'bg-black text-white' : ''}`}>ОЦІНЕНІ ({meals.filter(m => !checkIsWishlist(m)).length})</button>
            <button onClick={() => setActiveTab('wishlist')} className={`flex-1 p-3 border-4 font-black ${activeTab === 'wishlist' ? 'bg-[#FF1493] text-white' : ''}`}>БАЖАЮ ({meals.filter(m => checkIsWishlist(m)).length})</button>
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {meals.filter(m => activeTab === 'wishlist' ? checkIsWishlist(m) : !checkIsWishlist(m)).map(m => (
              <div key={m.id} className="border-2 border-black p-3 flex justify-between items-center text-xs">
                <span>{m.name} <span className="font-bold">({m.category})</span></span>
                {activeTab === 'wishlist' ? (
                  <div className="flex gap-1">{[1,2,3,4,5].map(n => <button key={n} onClick={() => handleApproveWishlistMeal(m.id!, n)}>{n}★</button>)}</div>
                ) : (
                   <div className="flex text-[#FF1493] font-bold">{'★'.repeat(m.rating)}</div>
                )}
                <button onClick={() => handleDeleteMeal(m.id!)}>❌</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}