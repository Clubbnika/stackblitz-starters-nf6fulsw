"use client";

import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

// --- Оголошення Типів ---
type Category = 'салати' | 'сендвічі' | 'супи' | 'десерти' | 'основні страви' | 'гарніри';
type Provider = 'GUD FUD' | 'Healthy lunch' | 'Власноруч';
type RandomFocus = 'all' | 'low_cal' | 'favorite';

interface Dish {
  id: string;
  name: string;
  category: Category;
  provider: Provider;
  calories: number;
  tasteRating: number;
}

// Конфіг з ОНОВЛЕНИМ правильним посиланням на базу даних
const firebaseConfig = {
  apiKey: 'AIzaSyD3s0uLj2sp2cE218ti0Q1gK3jOFBZDXrI',
  authDomain: 'nikmenu-9a6f0.firebaseapp.com',
  databaseURL: 'https://nikmenu-9a6f0-default-rtdb.firebaseio.com', // <-- Твій новий лінк
  projectId: 'nikmenu-9a6f0',
  storageBucket: 'nikmenu-9a6f0.firebasestorage.app',
  messagingSenderId: '667053801751',
  appId: '1:667053801751:web:c657209aa3d56cb77f3752',
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const CATEGORIES: Category[] = ['салати', 'сендвічі', 'супи', 'десерти', 'основні страви', 'гарніри'];
const PROVIDERS: Provider[] = ['GUD FUD', 'Healthy lunch', 'Власноруч'];

export default function App() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('салати');
  const [provider, setProvider] = useState<Provider>('Власноруч');
  const [calories, setCalories] = useState<number>(300);
  const [tasteRating, setTasteRating] = useState<number>(5);

  const [search, setSearch] = useState('');
  const [currentProviderFilter, setCurrentProviderFilter] = useState<Provider>('Власноруч');
  const [randomFocus, setRandomFocus] = useState<RandomFocus>('all');

  const [randomMenu, setRandomMenu] = useState<(Dish | null)[]>([null, null, null, null]);
  const [lockedSlots, setLockedSlots] = useState<boolean[]>([false, false, false, false]);

  useEffect(() => {
    const dishesRef = ref(db, 'dishes');
    const unsubscribe = onValue(dishesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedDishes: Dish[] = Object.values(data);
        setDishes(loadedDishes.reverse());
      } else {
        setDishes([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const syncWithFirebase = (updatedDishes: Dish[]) => {
    const dishesObject: Record<string, Dish> = {};
    updatedDishes.forEach((d) => {
      dishesObject[d.id] = d;
    });
    set(ref(db, 'dishes'), dishesObject);
  };

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newDish: Dish = {
      id: 'dish_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      category,
      provider,
      calories: Number(calories) || 0,
      tasteRating: tasteRating,
    };

    const updated = [newDish, ...dishes];
    setDishes(updated);
    syncWithFirebase(updated);

    setName('');
    setCalories(300);
    setTasteRating(5);
  };

  const handleDeleteDish = (id: string) => {
    const updated = dishes.filter((d) => d.id !== id);
    setDishes(updated);
    syncWithFirebase(updated);
    setRandomMenu(randomMenu.map((d) => (d?.id === id ? null : d)));
  };

  const generateRandomMenu = () => {
    let pool = dishes.filter((d) => d.provider === currentProviderFilter);

    if (pool.length === 0) {
      alert(`У базі немає страв для: "${currentProviderFilter}"`);
      return;
    }

    if (randomFocus === 'favorite') {
      pool = pool.filter((d) => d.tasteRating >= 8);
      if (pool.length === 0) {
        pool = dishes.filter((d) => d.provider === currentProviderFilter);
      }
    } else if (randomFocus === 'low_cal') {
      pool = [...pool].sort((a, b) => a.calories - b.calories);
    }

    const newMenu = [...randomMenu];
    const usedCategoryNames = new Set<string>();

    newMenu.forEach((dish, index) => {
      if (lockedSlots[index] && dish) {
        if (dish.provider !== currentProviderFilter) {
          const updatedLocks = [...lockedSlots];
          updatedLocks[index] = false;
          setLockedSlots(updatedLocks);
          newMenu[index] = null;
        } else {
          usedCategoryNames.add(dish.category);
        }
      }
    });

    for (let i = 0; i < 4; i++) {
      if (lockedSlots[i]) continue;

      const availableDishes = pool.filter((d) => !usedCategoryNames.has(d.category));

      if (availableDishes.length === 0) {
        newMenu[i] = null;
        continue;
      }

      let selectedDish: Dish;

      if (randomFocus === 'low_cal') {
        const topLowCal = availableDishes.slice(0, 3);
        selectedDish = topLowCal[Math.floor(Math.random() * topLowCal.length)];
      } else {
        const totalWeight = availableDishes.reduce((acc, d) => acc + d.tasteRating, 0);
        let randomNum = Math.random() * totalWeight;
        selectedDish = availableDishes[0];

        for (const dish of availableDishes) {
          randomNum -= dish.tasteRating;
          if (randomNum <= 0) {
            selectedDish = dish;
            break;
          }
        }
      }

      newMenu[i] = selectedDish;
      usedCategoryNames.add(selectedDish.category);
    }

    setRandomMenu(newMenu);
  };

  const toggleLock = (index: number) => {
    if (!randomMenu[index]) return;
    const updated = [...lockedSlots];
    updated[index] = !updated[index];
    setLockedSlots(updated);
  };

  const filteredDishes = dishes.filter(
    (dish) =>
      dish.name.toLowerCase().includes(search.toLowerCase()) ||
      dish.category.toLowerCase().includes(search.toLowerCase()) ||
      dish.provider.toLowerCase().includes(search.toLowerCase())
  );

  const totalMenuCalories = randomMenu.reduce((sum, d) => sum + (d ? d.calories : 0), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFF] flex flex-col items-center justify-center font-mono border-[8px] border-[#FF3399]">
        <div className="p-6 bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000] text-center space-y-4">
          <div className="text-xl font-black uppercase tracking-wider animate-bounce">LOADING...</div>
          <div className="text-xs font-bold text-neutral-500">CONNECTING TO DATABASE</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-[#FFF] text-black py-12 px-4 md:px-8 font-mono antialiased selection:bg-[#FF3399] selection:text-white"
      style={{
        backgroundImage: 'linear-gradient(#F0F0F0 1px, transparent 1px), linear-gradient(90deg, #F0F0F0 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    >
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* ХЕДЕР */}
        <header className="bg-[#FF3399] border-4 border-black p-6 shadow-[6px_6px_0px_0px_#000] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="text-white space-y-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase">
              MARKETING IS OUR ART? NO, MENU IS! 🦖
            </h1>
            <p className="text-xs md:text-sm font-bold tracking-wide text-black bg-white px-2 py-0.5 w-fit border-2 border-black">
              SUCCESS IS YOUR REALITY / DAILY PLANNER
            </p>
          </div>
          <div className="bg-[#00CC66] text-white border-2 border-black rounded-none px-4 py-1.5 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000] w-fit">
            ● DATABASE CONNECTED
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ФОРМА ДОДАННЯ СТРАВИ */}
          <div className="bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] h-fit space-y-6">
            <div className="bg-black text-white px-4 py-2 -mx-6 -mt-6 font-black text-sm uppercase tracking-wider flex justify-between items-center">
              <span>[ LET'S START! ]</span>
              <span>🍳</span>
            </div>

            <form onSubmit={handleAddDish} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wide text-neutral-500">_ НАЗВА СТРАВИ</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="напр., Авокадо-тост"
                  className="w-full px-4 py-2.5 border-4 border-black font-bold text-sm bg-white focus:outline-none focus:bg-[#FF3399]/10 transition-colors placeholder:text-neutral-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wide text-neutral-500">_ КАТЕГОРІЯ</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className="w-full px-2 py-2.5 border-4 border-black font-bold text-sm bg-white focus:outline-none cursor-pointer capitalize"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase tracking-wide text-neutral-500">_ КАЛОРІЇ</label>
                  <input
                    type="number"
                    min="0"
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border-4 border-black font-bold text-sm bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase tracking-wide text-neutral-500 block">_ ДЖЕРЕЛО ЇЖІ</label>
                <div className="flex flex-col gap-2">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProvider(p)}
                      className={`w-full py-2 px-3 text-xs font-black text-left border-2 border-black transition-all ${
                        provider === p
                          ? 'bg-[#FF3399] text-white translate-x-1 shadow-[2px_2px_0px_0px_#000]'
                          : 'bg-white text-black hover:bg-neutral-100'
                      }`}
                    >
                      {provider === p ? '► ' : '  '} {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-black">
                  <span className="text-neutral-500 uppercase tracking-wide">_ СМАК (РЕТРО РЕЙТИНГ)</span>
                  <span className="bg-[#00CC66] text-white px-2 border-2 border-black font-bold">{tasteRating}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={tasteRating}
                  onChange={(e) => setTasteRating(parseInt(e.target.value))}
                  className="w-full accent-black h-2 bg-neutral-200 border-2 border-black cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-[#00CC66] text-white font-black py-3 px-4 border-4 border-black hover:bg-[#00B359] active:translate-y-1 active:shadow-none transition-all shadow-[4px_4px_0px_0px_#000] text-sm uppercase tracking-widest"
              >
                ЗБЕРЕГТИ В ХМАРУ ++
              </button>
            </form>
          </div>

          {/* РАНДОМАЙЗЕР */}
          <div className="lg:col-span-2 bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-4 border-dashed border-black p-4 bg-neutral-50">
                <div className="space-y-1">
                  <label className="block text-xs font-black uppercase tracking-wide text-neutral-500">_ КРИТЕРІЙ ВИБОРУ ДЖЕРЕЛА</label>
                  <select
                    value={currentProviderFilter}
                    onChange={(e) => setCurrentProviderFilter(e.target.value as Provider)}
                    className="w-full px-3 py-2 border-2 border-black bg-white text-sm font-black focus:outline-none"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-black uppercase tracking-wide text-neutral-500">_ АЛГОРИТМ ГЕНЕРАЦІЇ</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['all', 'low_cal', 'favorite'] as RandomFocus[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setRandomFocus(f)}
                        className={`py-2 text-[10px] font-black uppercase border-2 border-black transition-all ${
                          randomFocus === f ? 'bg-[#FF3399] text-white shadow-[2px_2px_0px_0px_#000]' : 'bg-white text-black hover:bg-neutral-100'
                        }`}
                      >
                        {f === 'all' ? 'Баланс' : f === 'low_cal' ? 'Легке' : 'Смачне'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-b-4 border-black pb-4">
                <div>
                  <h3 className="text-xs font-black text-neutral-500 uppercase tracking-wide">_ МЕНЮ НА СЬОГОДНІ</h3>
                  {totalMenuCalories > 0 && (
                    <p className="text-sm font-black mt-1">
                      РАЗОМ: <span className="bg-[#FF3399] text-white px-2 py-0.5 border-2 border-black">{totalMenuCalories} ККАЛ</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={generateRandomMenu}
                  className="bg-[#FF3399] text-white font-black py-2.5 px-5 border-4 border-black hover:bg-opacity-90 active:translate-y-0.5 shadow-[4px_4px_0px_0px_#000] text-xs uppercase tracking-wider"
                >
                  🎲 ГЕНЕРУВАТИ МЕНЮ
                </button>
              </div>

              {/* СЛОТИ МЕНЮ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {randomMenu.map((dish, idx) => (
                  <div
                    key={idx}
                    className={`p-4 border-4 border-black transition-all relative ${
                      dish
                        ? 'bg-white shadow-[4px_4px_0px_0px_#000]'
                        : 'border-dashed bg-neutral-50 flex items-center justify-center h-28'
                    }`}
                  >
                    {dish ? (
                      <div className="space-y-2 pr-10">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9px] font-black bg-black text-white px-2 py-0.5 uppercase">
                            {dish.category}
                          </span>
                          <span className="text-[9px] font-black bg-[#FF3399]/20 text-black border-2 border-[#FF3399] px-1.5">
                            🔥 {dish.calories} ккал
                          </span>
                        </div>
                        <h4 className="font-black text-sm truncate uppercase tracking-tight">{dish.name}</h4>
                        <div className="text-xs font-bold text-neutral-600">
                          РЕЙТИНГ СМАКУ: <span className="text-[#00CC66] font-black">{dish.tasteRating}/10</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleLock(idx)}
                          className={`absolute top-4 right-4 w-8 h-8 border-2 border-black flex items-center justify-center font-black text-xs transition-all ${
                            lockedSlots[idx] ? 'bg-[#00CC66] text-white shadow-[2px_2px_0px_0px_#000]' : 'bg-neutral-100 text-black hover:bg-neutral-200'
                          }`}
                        >
                          {lockedSlots[idx] ? '🔒' : '🔓'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider">[ Порожній слот ]</span>
                    )}
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* ХМАРНА БАЗА СТРАВ */}
        <div className="bg-white p-6 border-4 border-black shadow-[6px_6px_0px_0px_#000] space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b-4 border-black pb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🗂️</span>
              <h2 className="text-lg font-black uppercase tracking-tight">
                ХМАРНА БАЗА СТРАВ <span className="bg-[#FF3399] text-white px-2 border-2 border-black ml-1">{dishes.length}</span>
              </h2>
            </div>
            <input
              type="text"
              placeholder="Шукати страву..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72 px-4 py-2 border-4 border-black font-bold text-sm bg-white focus:outline-none"
            />
          </div>

          {filteredDishes.length === 0 ? (
            <div className="text-center py-10 font-bold uppercase tracking-wider text-neutral-400">
              [ НІЧОГО НЕ ЗНАЙДЕНО АБО БАЗА ПОРОЖНЯ ]
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="p-4 border-4 border-black bg-white shadow-[4px_4px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000] transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[9px] font-black bg-neutral-100 text-black border-2 border-black px-2 py-0.5 uppercase truncate">
                        {dish.category}
                      </span>
                      <span className="text-[9px] font-black bg-[#FF3399] text-white px-2 py-0.5 uppercase truncate">
                        {dish.provider}
                      </span>
                    </div>
                    <h3 className="font-black text-sm uppercase truncate tracking-tight">{dish.name}</h3>
                    <div className="flex justify-between items-center text-xs border-t-2 border-dashed border-black pt-2">
                      <span className="font-bold">🔥 {dish.calories} ккал</span>
                      <span className="font-bold">⭐ {dish.tasteRating}/10</span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleDeleteDish(dish.id)}
                      className="text-[10px] bg-black text-white px-2 py-1 font-black uppercase hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      ВИДАЛИТИ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}