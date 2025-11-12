// @ts-nocheck

import React, { useEffect, useMemo, useRef, useState } from "react";

// ===== SkillHunter — full site with 10 sections + Balance Wheel + PDF button
// Pure React + Tailwind; no external UI libs

// ------- Constants
const SECTION_IDS = [
  "cover",
  "intro",
  "map",
  "goals",
  "events",
  "skills",
  "reflection",
  "professions",
  "subjects",
  "passport",
  "balance",
];

const DEFAULT_SKILLS = [
  { key: "construction", label: "Конструирование" },
  { key: "3d", label: "3D-моделирование" },
  { key: "robotics", label: "Робототехника" },
  { key: "teamwork", label: "Командная работа" },
  { key: "problemsolving", label: "Решение задач" },
  { key: "research", label: "Исследования" },
];

const DEFAULT_BALANCE = {
  explainSeen: false,
  categories: [
    { key: 'study', label: 'Учёба', value: 6 },
    { key: 'health', label: 'Здоровье', value: 6 },
    { key: 'friends', label: 'Друзья', value: 6 },
    { key: 'family', label: 'Семья', value: 6 },
    { key: 'hobby', label: 'Хобби', value: 6 },
    { key: 'creativity', label: 'Творчество', value: 6 },
    { key: 'rest', label: 'Отдых', value: 6 },
    { key: 'help', label: 'Помощь другим', value: 6 }
  ]
};

const STORAGE_KEY = "skillhunter.v3"; // bump to migrate safely

// ------- Helpers
function deepSet(obj, path, value){
  let o = obj;
  for (let i = 0; i < path.length - 1; i++){
    const k = path[i];
    if (typeof o[k] !== 'object' || o[k] === null){ o[k] = {}; }
    o = o[k];
  }
  o[path[path.length-1]] = value;
  return obj;
}

function usePersistentState(defaultValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }, [value]);
  return [value, setValue];
}

// ------- App
export default function SkillHunterApp(){
  const [data, setData] = usePersistentState({
    cover: { name: "", classSchool: "", year: "2025/26", photo: "", projectUrl: "", showQR: true },
    intro: { interests: "", handsOn: "", likedTopics: "", strengths: "", toBoost: "", motto: "", avatar: "" },
    partners: [
      { name: "Севкабель", blurb: "Канатная и кабельная промышленность.", url: "https://sevcableport.ru/" },
      { name: "Кировский завод", blurb: "Машиностроение, тяжёлая промышленность.", url: "https://kzgroup.ru/" },
      { name: "ASCON", blurb: "CAD/PLM решения, КОМПАС-3D.", url: "https://ascon.ru/" },
      { name: "СПбПУ", blurb: "Политех, инженерное образование.", url: "https://spbstu.ru/" },
      { name: "ИТМО", blurb: "IT, фотоника, робототехника.", url: "https://itmo.ru/" },
      { name: "ГУАП", blurb: "Авиаприборостроение, электроника.", url: "https://guap.ru/" },
    ],
    goals: { skill: "", profession: "", person: "", target: "", mentorSign: "" },
    events: [blankEvent()],
    skills: DEFAULT_SKILLS.reduce((acc, s) => { acc[s.key] = { tried:false, mastered:false, want:false }; return acc; }, {}),
    reflection: { favorite: "", mostInteresting: "", unexpected: "", feltEngineer: "", nextTry: "", collage: "" },
    professions: Array.from({length:5}, ()=>({ title:"", does:"", where:"", knowledge:"", why:"" })),
    subjects: { track:"", clubs:"", nextYear:"", teacherSign:"", parentSign:"" },
    passport: { name: "", class: "", skills: "", interests: "", achievements: "", mentorSign: "", date: "" },
    balance: DEFAULT_BALANCE,
  });

  // migrate if balance missing (older local saves)
  useEffect(() => {
    if (!data.balance || !Array.isArray(data.balance.categories)) {
      setData(prev => ({ ...prev, balance: DEFAULT_BALANCE }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fileInputRef = useRef(null);

  const totalMastered = useMemo(()=>Object.values(data.skills).filter(s=>s.mastered).length,[data.skills]);
  const progressPct = useMemo(()=>Math.round((totalMastered/DEFAULT_SKILLS.length)*100),[totalMastered]);
  const level = progressPct < 34 ? "Новичок" : progressPct < 67 ? "Исследователь" : "Инженер";

  function update(path, value){ setData(prev => deepSet({...prev}, path, value)); }
  function addEvent(){ setData(prev => ({...prev, events:[...prev.events, blankEvent()]})); }
  function removeEvent(idx){ setData(prev => ({...prev, events: prev.events.filter((_,i)=>i!==idx)})); }

  function exportJson(){
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `skillhunter_${new Date().toISOString().slice(0,10)}.json`; a.click();
    URL.revokeObjectURL(url);
  }
  function importJson(ev){
    const f = ev.target.files?.[0]; if(!f) return;
    const r = new FileReader();
    r.onload = () => { try { setData(JSON.parse(r.result)); } catch { alert('Неверный JSON'); } };
    r.readAsText(f);
  }

  return (
    
    <div className="min-h-screen bg-white text-slate-900">
      <HeaderBar progressPct={progressPct} level={level} onExport={exportJson} onImport={()=>fileInputRef.current?.click()} onPrint={()=>window.print()} />

      <div className="flex">
        <SideNav />
        <main className="flex-1 p-4 lg:p-8 space-y-10" style={{backgroundImage:"radial-gradient(circle at 10% 10%, rgba(37,99,235,0.06) 0 40%, transparent 41%), radial-gradient(circle at 90% 20%, rgba(249,115,22,0.08) 0 35%, transparent 36%), radial-gradient(circle at 20% 90%, rgba(37,99,235,0.06) 0 35%, transparent 36%)"}}>
          <Section id="cover"><Cover data={data.cover} onChange={(k,v)=>update(['cover',k],v)} fileInputRef={fileInputRef} importJson={importJson} /></Section>
          <Section id="intro"><Intro data={data.intro} onChange={(k,v)=>update(['intro',k],v)} /></Section>
          <Section id="map"><MapSpb partners={data.partners} onChange={(v)=>update(['partners'], v)} projectUrl={data.cover.projectUrl} showQR={data.cover.showQR} /></Section>
          <Section id="goals"><Goals data={data.goals} onChange={(k,v)=>update(['goals',k],v)} /></Section>
          <Section id="events"><Events data={data.events} onChange={(i,k,v)=>update(['events',i,k],v)} addEvent={addEvent} removeEvent={removeEvent} /></Section>
          <Section id="skills"><SkillMap skills={data.skills} setSkills={(v)=>update(['skills'], v)} /></Section>
          <Section id="reflection"><Reflection data={data.reflection} onChange={(k,v)=>update(['reflection',k],v)} /></Section>
          <Section id="professions"><Professions data={data.professions} onChange={(i,k,v)=>update(['professions',i,k],v)} /></Section>
          <Section id="subjects"><Subjects data={data.subjects} onChange={(k,v)=>update(['subjects',k],v)} /></Section>
          <Section id="passport"><Passport data={data.passport} onChange={(k,v)=>update(['passport',k],v)} /></Section>

          <Section id="balance"><BalanceWheel data={data.balance} onChange={(v)=>update(['balance'], v)} /></Section>
        </main>
      </div>

      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={importJson} />
    </div>
  );
}

// ------- UI pieces
function HeaderBar({ progressPct, level, onExport, onImport, onPrint }){
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/90 border-b print:hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center gap-3">
        <span className="text-2xl">🤖</span>
        <h1 className="text-xl font-bold">СкиллХантер — Мой инженерный путь</h1>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm rounded-full bg-blue-600 text-white px-3 py-1">Прогресс: {progressPct}%</span>
          <span className="text-sm rounded-full bg-orange-500 text-white px-3 py-1">Уровень: {level}</span>
          <Button variant="secondary" onClick={onImport}>⬆️ Импорт</Button>
          <Button onClick={onExport}>⬇️ Экспорт</Button>
          {/* PDF: печать → "Сохранить как PDF" */}
          <Button variant="outline" onClick={onPrint}>📄 Скачать PDF</Button>
        </div>
      </div>
    </header>
  );
}

function SideNav(){
  return (
    <nav className="hidden lg:block w-64 border-r sticky top-12 h-[calc(100vh-48px)] overflow-auto p-4">
      <ul className="space-y-2">
        {SECTION_IDS.map((id,i)=> (
          <li key={id}>
            <a href={`#${id}`} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-slate-50 group">
              <span>{i+1}. {labelOf(id)}</span>
              <span className="opacity-0 group-hover:opacity-100 transition">›</span>
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-6 text-xs text-slate-500">Цвета: синий/оранжевый, акценты шестерёнками и схемами.</div>
    </nav>
  );
}

function Section({ id, children }){
  return <section id={id} className="scroll-mt-20">{children}</section>;
}

function Card({ children, className }){ return <div className={`bg-white border rounded-2xl shadow ${className||''}`}>{children}</div>; }
function CardHeader({ children, className }){ return <div className={`p-4 border-b ${className||''}`}>{children}</div>; }
function CardTitle({ children, className }){ return <div className={`text-2xl font-semibold flex items-center gap-2 ${className||''}`}>{children}</div>; }
function CardContent({ children, className }){ return <div className={`p-4 ${className||''}`}>{children}</div>; }

function Button({ children, onClick, variant }){
  const base = "px-3 py-2 rounded-xl text-sm font-medium";
  const style = variant === 'outline' ? "border"
    : variant === 'secondary' ? "bg-slate-100 hover:bg-slate-200"
    : "bg-blue-600 hover:bg-blue-700 text-white";
  return <button onClick={onClick} className={`${base} ${style}`}>{children}</button>;
}

function Input({ value, onChange, placeholder }){ return <input value={value} onChange={onChange} placeholder={placeholder} className="w-full border rounded-xl px-3 py-2"/> }
function Textarea({ value, onChange, placeholder, rows=3, className }){ return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} className={`w-full border rounded-xl px-3 py-2 ${className||''}`}/> }
function Label({ children, className }){ return <label className={`text-sm text-slate-600 ${className||''}`}>{children}</label> }
function Checkbox({ checked, onChange }){ return <input type="checkbox" checked={checked} onChange={(e)=>onChange(e.target.checked)} /> }

// ------- Sections content
function Cover({ data, onChange }){
  const photoRef = useRef(null);
  return (
    <Card className="shadow-xl">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>⚙️ 1. Обложка</CardTitle>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={data.showQR} onChange={(e)=>onChange('showQR', e.target.checked)} />
          <Label className="text-sm">Показывать QR</Label>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <Label>ФИ ученика</Label>
            <Input value={data.name} onChange={(e)=>onChange('name', e.target.value)} placeholder="Иванов Иван"/>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Класс, школа</Label>
                <Input value={data.classSchool} onChange={(e)=>onChange('classSchool', e.target.value)} placeholder="7А, Школа №..."/>
              </div>
              <div>
                <Label>Учебный год</Label>
                <Input value={data.year} onChange={(e)=>onChange('year', e.target.value)} placeholder="2025/26"/>
              </div>
            </div>
            <Label>Сайт проекта (для QR)</Label>
            <Input value={data.projectUrl} onChange={(e)=>onChange('projectUrl', e.target.value)} placeholder="https://..."/>
          </div>
          <div>
            <div className="flex items-center gap-4">
              <div className="w-40 h-40 rounded-2xl bg-slate-100 border flex items-center justify-center overflow-hidden">
                {data.photo ? <img src={data.photo} alt="Фото" className="w-full h-full object-cover"/> : <div className="text-slate-400 text-center px-2">Фото / наклейка</div>}
              </div>
              <div className="space-x-2">
                <Button variant="secondary" onClick={()=>photoRef.current?.click()}>⬆️ Загрузить</Button>
                <Button variant="outline" onClick={()=>onChange('photo','')}>🗑 Удалить</Button>
                <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e)=>handleImage(e, (url)=>onChange('photo', url))}/>
              </div>
            </div>
            {data.showQR && data.projectUrl && (
              <div className="mt-4">
                <Label>QR с сайтом проекта</Label>
                <div className="mt-2 bg-white inline-block p-2 rounded-xl border">
                  <img alt="QR" width="120" height="120" src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(data.projectUrl)}`} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-slate-600 flex items-start gap-2 mt-2">
          <span className="mt-0.5">🧩</span>
          <p>Дизайн: шестерёнки, робот‑маскот, линии схем, синие/оранжевые акценты. Шрифты: Poppins / Rubik / Nunito.</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Intro({ data, onChange }){
  const avatarRef = useRef(null);
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle>🤖 2. Старт: Знакомство с собой</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <TextField label="Что мне интересно?" value={data.interests} onChange={(v)=>onChange('interests', v)} />
            <TextField label="Что я люблю делать руками?" value={data.handsOn} onChange={(v)=>onChange('handsOn', v)} />
            <TextField label="Какие темы или задачи мне нравятся?" value={data.likedTopics} onChange={(v)=>onChange('likedTopics', v)} />
            <TextField label="Мои сильные стороны" value={data.strengths} onChange={(v)=>onChange('strengths', v)} />
            <TextField label="Навыки, которые хочу прокачать" value={data.toBoost} onChange={(v)=>onChange('toBoost', v)} />
            <TextField label="Мой девиз инженера" value={data.motto} onChange={(v)=>onChange('motto', v)} placeholder="Короткий девиз" />
          </div>
          <div className="space-y-2">
            <Label>Фото/аватар или мини‑комикс</Label>
            <div className="w-full aspect-square bg-slate-100 rounded-2xl border flex items-center justify-center overflow-hidden">
              {data.avatar ? <img src={data.avatar} alt="Аватар" className="w-full h-full object-cover"/> : <div className="text-slate-400 text-center px-2">Загрузите изображение</div>}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={()=>avatarRef.current?.click()}>⬆️ Загрузить</Button>
              <Button variant="outline" onClick={()=>onChange('avatar','')}>🗑 Удалить</Button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e)=>handleImage(e, (url)=>onChange('avatar', url))}/>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TextField({ label, value, onChange, placeholder }){
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Textarea rows={3} value={value} placeholder={placeholder} onChange={(e)=>onChange(e.target.value)} />
    </div>
  );
}

function MapSpb({ partners, onChange, projectUrl, showQR }){
  function updatePartner(i, key, value){ const next = partners.slice(); next[i] = { ...next[i], [key]: value }; onChange(next); }
  function add(){ onChange([...partners, { name:"", blurb:"", url:"" }]); }
  function remove(i){ onChange(partners.filter((_,idx)=>idx!==i)); }
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle>🗺 3. Карта профессий региона — «Инженерный Петербург»</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            {partners.map((p,i)=> (
              <div key={i} className="grid grid-cols-12 gap-2 items-center bg-slate-50 border rounded-xl p-3">
                <div className="col-span-4"><Input value={p.name} onChange={(e)=>updatePartner(i,'name',e.target.value)} placeholder="Название / партнёр"/></div>
                <div className="col-span-5"><Input value={p.blurb} onChange={(e)=>updatePartner(i,'blurb',e.target.value)} placeholder="Коротко о компании"/></div>
                <div className="col-span-3 flex gap-2">
                  <Input value={p.url} onChange={(e)=>updatePartner(i,'url',e.target.value)} placeholder="URL"/>
                  <Button variant="outline" onClick={()=>remove(i)}>🗑</Button>
                </div>
              </div>
            ))}
            <Button onClick={add}>➕ Добавить партнёра</Button>
          </div>
          <div className="space-y-2">
            <Label>Мини‑карта города (условная)</Label>
            <div className="rounded-2xl border overflow-hidden">
              <svg viewBox="0 0 200 200" className="w-full h-[220px]">
                <rect width="200" height="200" fill="#f8fafc"/>
                <path d="M10 50 L190 50 M10 100 L190 100 M10 150 L190 150 M50 10 L50 190 M100 10 L100 190 M150 10 L150 190" stroke="#e2e8f0" strokeWidth="2"/>
                {partners.slice(0,8).map((p,i)=> (
                  <circle key={i} cx={(i%4)*50+25} cy={Math.floor(i/4)*50+75} r="7" fill={i%2?"#2563eb":"#f97316"}>
                    <title>{p.name}</title>
                  </circle>
                ))}
              </svg>
            </div>
            {showQR && projectUrl && (
              <div className="pt-2">
                <Label>QR: сайт проекта</Label>
                <div className="bg-white inline-block p-2 rounded-xl border">
                  <img alt="QR" width="110" height="110" src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(projectUrl)}`} />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-slate-600">Совет: фон можно сделать в Canva как карту Петербурга с иконками.</div>
      </CardContent>
    </Card>
  );
}

function Goals({ data, onChange }){
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle>🎯 4. Мои цели — «Мой трек навыков»</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        <Field label="Навык, который хочу освоить" value={data.skill} onChange={(v)=>onChange('skill', v)} />
        <Field label="Профессия, которую хочу узнать ближе" value={data.profession} onChange={(v)=>onChange('profession', v)} />
        <Field label="С кем хочу познакомиться (инженер, мастер, эксперт)" value={data.person} onChange={(v)=>onChange('person', v)} />
        <Field label="Цель на этот трек" value={data.target} onChange={(v)=>onChange('target', v)} />
        <Field label="Подпись педагога/наставника" value={data.mentorSign} onChange={(v)=>onChange('mentorSign', v)} />
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange }){
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input value={value} onChange={(e)=>onChange(e.target.value)} />
    </div>
  );
}

function blankEvent(){
  return { place:"", task:"", skills:{ construction:false, "3d":false, robotics:false, teamwork:false, problemsolving:false, research:false }, interesting:"", insight:"", badge:"", mentorSign:"", level:"Новичок" };
}

function Events({ data, onChange, addEvent, removeEvent }){
  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle>📅 5. Страница события (шаблон, 8–10 раз)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((ev, idx)=> (
          <div key={idx} className="border rounded-2xl p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Моя инженерная миссия № {idx+1}</h3>
              <select className="border rounded-xl px-2 py-1" value={ev.level} onChange={(e)=>onChange(idx,'level', e.target.value)}>
                <option>Новичок</option>
                <option>Исследователь</option>
                <option>Инженер</option>
              </select>
              <Button variant="outline" onClick={()=>removeEvent(idx)}>🗑</Button>
            </div>

            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <Field label="Где я был(а)?" value={ev.place} onChange={(v)=>onChange(idx,'place', v)} />
              <Field label="Что я делал(а)?" value={ev.task} onChange={(v)=>onChange(idx,'task', v)} />
            </div>

            <div className="mt-3">
              <Label>Какие навыки попробовал(а)?</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {DEFAULT_SKILLS.map(s=> (
                  <label key={s.key} className="flex items-center gap-2 bg-white rounded-xl border px-3 py-2">
                    <Checkbox checked={ev.skills[s.key]} onChange={(v)=>onChange(idx,'skills',{...ev.skills,[s.key]: v})} />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <TextField label="Что было интересным / сложным?" value={ev.interesting} onChange={(v)=>onChange(idx,'interesting', v)} />
              <TextField label="Что я понял(а) об инженерии?" value={ev.insight} onChange={(v)=>onChange(idx,'insight', v)} />
            </div>

            <div className="grid md:grid-cols-2 gap-3 mt-3">
              <Field label="Новая метка (ачивка)" value={ev.badge} onChange={(v)=>onChange(idx,'badge', v)} />
              <Field label="Подпись эксперта / наставника" value={ev.mentorSign} onChange={(v)=>onChange(idx,'mentorSign', v)} />
            </div>
          </div>
        ))}
        {data.length < 10 && <Button onClick={addEvent}>➕ Добавить страницу события</Button>}
      </CardContent>
    </Card>
  );
}

function SkillMap({ skills, setSkills }){
  const mastered = Object.values(skills).filter(s=>s.mastered).length;
  const progress = Math.round((mastered / DEFAULT_SKILLS.length) * 100);
  return (
    <Card className="shadow-xl">
      <CardHeader><CardTitle>🗂 6. Моя карта навыков (Skill Map)</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b"><th className="py-2">Навык</th><th className="py-2">Пробовал</th><th className="py-2">Освоил</th><th className="py-2">Хочу развить</th></tr>
            </thead>
            <tbody>
              {DEFAULT_SKILLS.map(s=> (
                <tr key={s.key} className="border-b last:border-0">
                  <td className="py-2 font-medium">{s.label}</td>
                  {["tried","mastered","want"].map(flag => (
                    <td key={flag} className="py-2"><input type="checkbox" checked={skills[s.key][flag]} onChange={(e)=>setSkills({ ...skills, [s.key]: { ...skills[s.key], [flag]: e.target.checked } })} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Label>Прогресс освоения</Label>
          <div className="flex items-center gap-3 mt-1">
            <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-600" style={{width: `${progress}%`}}/></div>
            <span className="text-sm rounded-full bg-blue-600 text-white px-2 py-0.5">{progress}%</span>
          </div>
          <div className="mt-2 text-sm text-slate-600">Мини‑уровни: <span className="px-2 py-0.5 rounded bg-slate-800 text-white">Новичок</span> → <span className="px-2 py-0.5 rounded bg-blue-600 text-white">Исследователь</span> → <span className="px-2 py-0.5 rounded bg-orange-500 text-white">Инженер</span></div>
        </div>
      </CardContent>
    </Card>
  );
}

function Reflection({ data, onChange }){
  return (
    <Card className="shadow-xl">
      <CardHeader><CardTitle>🧠 7. Рефлексия — «Мои инженерные открытия»</CardTitle></CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        <TextField label="Что мне понравилось больше всего?" value={data.favorite} onChange={(v)=>onChange('favorite', v)} />
        <TextField label="Какая профессия показалась самой интересной?" value={data.mostInteresting} onChange={(v)=>onChange('mostInteresting', v)} />
        <TextField label="Что оказалось неожиданным?" value={data.unexpected} onChange={(v)=>onChange('unexpected', v)} />
        <TextField label="Где я почувствовал(а) себя инженером?" value={data.feltEngineer} onChange={(v)=>onChange('feltEngineer', v)} />
        <TextField label="Что хочу попробовать дальше?" value={data.nextTry} onChange={(v)=>onChange('nextTry', v)} />
        <div className="space-y-1">
          <Label>Место для рисунка / коллажа</Label>
          <ImageDrop value={data.collage} onChange={(url)=>onChange('collage', url)} placeholder="Загрузите изображение"/>
        </div>
      </CardContent>
    </Card>
  );
}

function Professions({ data, onChange }){
  return (
    <Card className="shadow-xl">
      <CardHeader><CardTitle>🧾 8. Мои 5 профессий</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b"><th className="py-2">#</th><th className="py-2">Профессия</th><th className="py-2">Чем занимается</th><th className="py-2">Где работает</th><th className="py-2">Что нужно знать</th><th className="py-2">Почему мне подходит</th></tr>
          </thead>
          <tbody>
            {data.map((row,i)=> (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2 pr-2">{i+1}</td>
                <td className="py-2 pr-2"><Input value={row.title} onChange={(e)=>onChange(i,'title', e.target.value)} placeholder="Инженер‑конструктор"/></td>
                <td className="py-2 pr-2"><Input value={row.does} onChange={(e)=>onChange(i,'does', e.target.value)} placeholder="Проектирует детали..."/></td>
                <td className="py-2 pr-2"><Input value={row.where} onChange={(e)=>onChange(i,'where', e.target.value)} placeholder="Заводы, КБ"/></td>
                <td className="py-2 pr-2"><Input value={row.knowledge} onChange={(e)=>onChange(i,'knowledge', e.target.value)} placeholder="САПР, физика..."/></td>
                <td className="py-2 pr-2"><Input value={row.why} onChange={(e)=>onChange(i,'why', e.target.value)} placeholder="Нравится создавать..."/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function Subjects({ data, onChange }){
  return (
    <Card className="shadow-xl">
      <CardHeader><CardTitle>📚 9. Мой учебный трек</CardTitle></CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        <Field label="Предметы, которые помогут мне стать инженером" value={data.track} onChange={(v)=>onChange('track', v)} />
        <Field label="Кружки и направления, куда хочу записаться" value={data.clubs} onChange={(v)=>onChange('clubs', v)} />
        <Field label="Цели на следующий год" value={data.nextYear} onChange={(v)=>onChange('nextYear', v)} />
        <Field label="Подпись педагога" value={data.teacherSign} onChange={(v)=>onChange('teacherSign', v)} />
        <Field label="Подпись родителя" value={data.parentSign} onChange={(v)=>onChange('parentSign', v)} />
      </CardContent>
    </Card>
  );
}

function Passport({ data, onChange }){
  return (
    <Card className="shadow-xl">
      <CardHeader><CardTitle>🏁 10. Проф‑паспорт СкиллХантера (финал)</CardTitle></CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        <Field label="Имя" value={data.name} onChange={(v)=>onChange('name', v)} />
        <Field label="Класс" value={data.class} onChange={(v)=>onChange('class', v)} />
        <Field label="Навыки, которые я освоил(а)" value={data.skills} onChange={(v)=>onChange('skills', v)} />
        <Field label="Профессии, которые мне интересны" value={data.interests} onChange={(v)=>onChange('interests', v)} />
        <TextField label="Мои достижения" value={data.achievements} onChange={(v)=>onChange('achievements', v)} />
        <Field label="Подпись педагога‑наставника" value={data.mentorSign} onChange={(v)=>onChange('mentorSign', v)} />
        <Field label="Дата" value={data.date} onChange={(v)=>onChange('date', v)} />
        <div className="md:col-span-2">
          <Label>Наклейка/QR «Junior SkillHunter»</Label>
          <div className="mt-2 flex items-center gap-3">
            <span className="px-3 py-1 rounded-xl bg-orange-500 text-white">🧠⚙️ Junior SkillHunter</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 11. Balance Wheel for kids
function BalanceWheel({ data, onChange }){
  const radius = 120; // px
  const max = 10;
  const categories = (data && Array.isArray(data.categories)) ? data.categories : DEFAULT_BALANCE.categories;

  function setValue(i, val){
    const v = Math.max(0, Math.min(max, Number(val)));
    const next = { ...(data || DEFAULT_BALANCE), categories: categories.map((c,idx)=> idx===i ? {...c, value:v} : c) };
    if (typeof onChange === 'function') onChange(next);
  }

  function pointFor(idx, value){
    const angle = (Math.PI * 2 * idx / categories.length) - Math.PI/2; // start at top
    const r = (value / max) * radius;
    const x = 150 + r * Math.cos(angle);
    const y = 150 + r * Math.sin(angle);
    return `${x},${y}`;
  }

  const polygon = categories.map((c,i)=> pointFor(i, c.value)).join(' ');

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle>🎡 11. Колесо баланса для детей</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 300 300" className="w-full max-w-md">
            <defs>
              <radialGradient id="g" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#bfdbfe" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.2"/>
              </radialGradient>
            </defs>
            <circle cx="150" cy="150" r={radius} fill="url(#g)" stroke="#e2e8f0"/>
            {[2,4,6,8,10].map((n,i)=> (
              <circle key={i} cx="150" cy="150" r={(n/max)*radius} fill="none" stroke="#e2e8f0"/>
            ))}
            {categories.map((c,i)=>{
              const a = (Math.PI * 2 * i / categories.length) - Math.PI/2;
              const x = 150 + radius * Math.cos(a);
              const y = 150 + radius * Math.sin(a);
              const lx = 150 + (radius+16) * Math.cos(a);
              const ly = 150 + (radius+16) * Math.sin(a);
              return (
                <g key={c.key}>
                  <line x1="150" y1="150" x2={x} y2={y} stroke="#e2e8f0"/>
                  <text x={lx} y={ly} fontSize="10" textAnchor={Math.cos(a)>0?"start":"end"} alignmentBaseline="middle">{c.label}</text>
                </g>
              );
            })}
            <polygon points={polygon} fill="#f97316" opacity="0.35" stroke="#f97316" strokeWidth="2"/>
          </svg>
        </div>
        <div className="space-y-4">
          <div className="text-sm text-slate-700 bg-slate-50 border rounded-xl p-3">
            <p className="font-medium mb-2">Как пользоваться:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Оцени каждую сферу от 0 до 10 (0 — совсем не уделяю внимания, 10 — всё отлично).</li>
              <li>Ползунки меняют форму «колеса». Чем ровнее круг, тем баланснее твой день.</li>
              <li>Выбери 1–2 сферы, где хочешь улучшиться на следующей неделе, и запланируй простые шаги.</li>
            </ol>
            <p className="mt-2 text-xs text-slate-500">Пример сфер: Учёба, Здоровье, Друзья, Семья, Хобби, Творчество, Отдых, Помощь другим.</p>
          </div>
          {categories.map((c,i)=> (
            <div key={c.key} className="grid grid-cols-6 items-center gap-2">
              <Label className="col-span-2">{c.label}</Label>
              <input className="col-span-3" type="range" min="0" max="10" value={c.value} onChange={(e)=>setValue(i, e.target.value)} />
              <Input value={c.value} onChange={(e)=>setValue(i, e.target.value)} />
            </div>
          ))}
          <div className="text-sm text-slate-600">Подсказка: не гонись за «10» сразу. Добавь по одному баллу в 1–2 сферах — это уже заметно.</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ImageDrop({ value, onChange, placeholder }){
  const inputRef = useRef(null);
  return (
    <div className="flex gap-2 items-center">
      <div className="w-40 h-40 bg-slate-100 rounded-2xl border overflow-hidden flex items-center justify-center">
        {value ? <img src={value} alt="collage" className="w-full h-full object-cover"/> : <span className="text-slate-400 text-center px-2">{placeholder}</span>}
      </div>
      <div className="space-x-2">
        <Button variant="secondary" onClick={()=>inputRef.current?.click()}>⬆️ Загрузить</Button>
        <Button variant="outline" onClick={()=>onChange('')}>🗑 Удалить</Button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e)=>handleImage(e, onChange)} />
      </div>
    </div>
  );
}

function handleImage(e, cb){ const file = e.target.files?.[0]; if(!file) return; const reader = new FileReader(); reader.onload = () => cb(reader.result); reader.readAsDataURL(file); }

function labelOf(id){
  switch(id){
    case 'cover': return 'Обложка';
    case 'intro': return 'Старт';
    case 'map': return 'Карта профессий региона';
    case 'goals': return 'Мои цели';
    case 'events': return 'Страница события';
    case 'skills': return 'Карта навыков';
    case 'reflection': return 'Рефлексия';
    case 'professions': return '5 профессий';
    case 'subjects': return 'Учебный трек';
    case 'passport': return 'Проф‑паспорт';
    case 'balance': return 'Колесо баланса';
    default: return id;
  }
}
