import { useState, useEffect, useCallback, useRef } from "react";
import upgradesData from "./upgrades";
import translations from "./translations";

// Importando assets direto
import CookieImg from "./assets/cookie.png";
import BackgroundMusic from "./assets/bg.mp3";
import ClickSound from "./assets/click.mp3"; // som de clique

function App() {
  const [cookies, setCookies] = useState(0);
  const [totalFarmed, setTotalFarmed] = useState(0);
  const [activeTab, setActiveTab] = useState("cpc");
  const [upgrades, setUpgrades] = useState(upgradesData);
  const [lang, setLang] = useState("en");
  const audioRef = useRef();
  const clickRef = useRef();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const t = (key) => translations[lang][key] || key;

  // --- SAVE / LOAD ---
    const saveGame = useCallback((newState) => {
    const data = {
      cookies: newState?.cookies ?? cookies,
      totalFarmed: newState?.totalFarmed ?? totalFarmed,
      upgrades: newState?.upgrades ?? upgrades,
      lang: newState?.lang ?? lang,
    };
    localStorage.setItem("cookieClickerSave", JSON.stringify(data));
  }, [cookies, totalFarmed, upgrades, lang]);

  useEffect(() => {
      const saved = localStorage.getItem("cookieClickerSave");
      if (saved) {
        const data = JSON.parse(saved);

        // Mesclar upgrades salvos com os novos
        const mergedUpgrades = upgradesData.map(u => {
          const savedUpgrade = data.upgrades?.find(su => su.id === u.id);
          return savedUpgrade ? { ...u, level: savedUpgrade.level, cost: savedUpgrade.cost } : u;
        });

        setCookies(data.cookies ?? 0);
        setTotalFarmed(data.totalFarmed ?? 0);
        setUpgrades(mergedUpgrades);
        setLang(data.lang ?? "en");
      }
    }, []);

    const handleButtonClick = (e, callback) => {
    const btn = e.currentTarget;
    btn.classList.add("click-animate");

    // Remove a classe depois da animação
    setTimeout(() => {
      btn.classList.remove("click-animate");
    }, 200);

    // Executa o callback original do botão
    if (callback) callback();
  };

  const handleClickAnimation = (e, callback) => {
    const el = e.currentTarget;
    el.classList.add("click-animate");

    setTimeout(() => {
      el.classList.remove("click-animate");
    }, 200);

    if (callback) callback();
  };

  // --- MENSAGENS ALEATORIAS ---
  useEffect(() => {
  const interval = setInterval(() => {
    setCurrentMessageIndex(prev => {
      const msgs = translations[lang].messages || [];
      return msgs.length ? (prev + 1) % msgs.length : 0;
    });
  }, 5000); // troca a cada 5 segundos
  return () => clearInterval(interval);
}, [lang]);

  // --- SOM DE CLIQUE ---
  const playClick = () => {
    if (clickRef.current) {
      clickRef.current.volume = 0.2; // 20% do volume
      clickRef.current.currentTime = 0; // reseta para tocar desde o começo
      clickRef.current.play();
    }
  };

  // --- CpC / CpS ---
  const cpc = upgrades
    .filter(u => u.type === "cpc")
    .reduce(
      (sum, u) =>
        sum + (u.level > 0 ? Math.floor(u.baseGain * Math.pow(u.gainMultiplier, u.level - 1)) : 0),
      1
    );

  const cps = upgrades
    .filter(u => u.type === "cps")
    .reduce(
      (sum, u) =>
        sum + (u.level > 0 ? Math.floor(u.baseGain * Math.pow(u.gainMultiplier, u.level - 1)) : 0),
      0
    );

  // --- Auto ganho CpS ---
    useEffect(() => {
    const interval = setInterval(() => {
      if (cps > 0) {
        setCookies(prev => {
          const newCookies = prev + cps;
          saveGame({ cookies: newCookies });
          return newCookies;
        });
        setTotalFarmed(prev => {
          const newTotal = prev + cps;
          saveGame({ totalFarmed: newTotal });
          return newTotal;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [cps, saveGame]); // ✅ adicionado


  // --- Clique ---
  const clickCookie = () => {
    if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play();
      };
    setCookies(prev => {
      const newCookies = prev + cpc;
      saveGame({ cookies: newCookies });
      return newCookies;
    });
    setTotalFarmed(prev => {
      const newTotal = prev + cpc;
      saveGame({ totalFarmed: newTotal });
      return newTotal;
    });

  };

  // --- Comprar upgrade ---
  const buyUpgrade = (id) => {
    const upgrade = upgrades.find(u => u.id === id);
    if (upgrade && cookies >= upgrade.cost) {
      setCookies(c => {
        const newCookies = c - upgrade.cost;
        saveGame({ cookies: newCookies });
        return newCookies;
      });

      setUpgrades(prev => {
        const newUpgrades = prev.map(u =>
          u.id === id ? { ...u, level: u.level + 1, cost: Math.floor(u.cost * u.costMultiplier) } : u
        );
        saveGame({ upgrades: newUpgrades });
        return newUpgrades;
      });
    }
  };

  // --- Mudar idioma ---
  const changeLang = (newLang) => {
    setLang(newLang);
    saveGame({ lang: newLang });
  };

  // --- Reset completo ---
  const resetGame = () => {
    setCookies(0);
    setTotalFarmed(0);
    setUpgrades(upgradesData);
    setLang("en");
    localStorage.removeItem("cookieClickerSave");
  };

  return (

    <div style={{ display: "grid", gridTemplateColumns: "45% 35% 20%", width: "100vw", height: "100vh", background: "#181616ff", color: "#eee", fontFamily: "monospace", alignContent: "center", alignItems: "center"}}>
      {/* Esquerda */}

      <audio ref={clickRef} src={ClickSound} />

      <audio ref={audioRef} src={BackgroundMusic} loop volume="0.2"/>

      <div style={{ maxHeight: "100vh", overflowY: "auto", boxSizing: "border-box", padding: "15px", borderRight: "1px transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <h2>{t("cookieTitle")}</h2>
        <p style={{ fontSize: "15px", margin: "5px"}}>{t("currentCookies")}</p>
        <p style={{ fontSize: "30px", margin: "5px"}}>{cookies}</p>
        <img
        src={CookieImg}       // sua imagem do cookie
        alt="Cat"
        onClick={(e) => handleClickAnimation(e, () => {playClick(); clickCookie();})}             // mantém o clique funcionando
        style={{
          paddingTop: "20px",
          width: "300px",                 // tamanho da imagem
          height: "300px",
          cursor: "pointer",              // muda o cursor igual botão
        }}
      />
      
      <div style={{ marginTop: "100px", fontStyle: "italic", color: "#dadadaff", background: "#242424ff", inlineSize: "400px", padding: "15px", textAlign: "center", maxHeight: "100vh", boxSizing: "border-box" }}>
          {translations[lang].messages?.[currentMessageIndex]}
        </div>

      </div>

      {/* Meio */}
      <div style={{
        padding: "20px",
        borderRight: "1px transparent",
        display: "flex",
        flexDirection: "column",
        maxHeight: "100vh",       // Limita a altura da div ao tamanho da tela
        overflowY: "auto",        // Ativa barra de rolagem vertical
        boxSizing: "border-box",   // Garante que padding não aumente a altura
      }}>

        {/* TÍTULO DE UPGRADES */}
        <h2>{t("upgrades")}</h2>
        <div style={{ display: "flex", gap: "5px", marginBottom: "20px", padding: "0px"}}>
          <button onClick={() => setActiveTab("cpc")} style={{ padding: "5px 10px", background: activeTab === "cpc" ? "#444" : "#222", color: "#eee", border: "1px solid #666", cursor: "pointer" }}>{t("tabCpc")}</button>
          <button onClick={() => setActiveTab("cps")} style={{ padding: "5px 10px", background: activeTab === "cps" ? "#444" : "#222", color: "#eee", border: "1px solid #666", cursor: "pointer" }}>{t("tabCps")}</button>
        </div>
        
        {/* BOX DE UPGRADES */}
        <div style={{ paddingRight: "30px", flexDirection: "column", maxHeight: "100vh", overflowY: "auto", boxSizing: "border-box",}}>
        {upgrades.filter(u => u.type === activeTab).map(u => (
          <div key={u.id} style={{ marginBottom: "15px", padding: "10px", border: "1px solid #444" }}>
            <h3>{translations[lang][`upgrade_${u.id}_name`] || u.name}</h3>
            <p>{translations[lang][`upgrade_${u.id}_desc`] || u.description}</p>
            <p>{t("level")}: {u.level}</p>
            <p>{t("currentGen")}: {u.level > 0 ? Math.floor(u.baseGain * Math.pow(u.gainMultiplier, u.level - 1)) : 0}</p>
            <p>{t("cost")}: {u.cost} {t("cat")}</p>
            <button onClick={(e) => handleButtonClick(e, () => {playClick(); buyUpgrade(u.id)})} disabled={cookies < u.cost} style={{ padding: "5px 10px", background: cookies >= u.cost ? "#42704eff" : "#741c1cff", color: "#eee", border: "1px solid #666", cursor: cookies >= u.cost ? "pointer" : "not-allowed" }}><span className="material-icons">arrow_upward</span></button>
          </div>

        ))}

        </div>
      </div>

      {/* Direita */}
      <div style={{ maxHeight: "100vh", overflowY: "auto", boxSizing: "border-box", padding: "20px", paddingRight: "30px", display: "flex", flexDirection: "column", alignContent: "center", alignItems: "center"}}>
        <h2>{t("stats")}</h2>
        <p>CpC: {cpc}</p>
        <p>CpS: {cps}</p>
        <p>{t("totalFarmed")}: {totalFarmed}</p>

        <h3 style={{paddingTop:"10px"}}>{t("lang")}</h3>
        <div>
          {["en","pt"].map(l => (
            <button key={l} onClick={() => changeLang(l)} style={{ marginRight: "5px" }}>{l.toUpperCase()}</button>
          ))}
        </div>

        <h3 style={{ marginTop: "40px" }}>{t("settings")}</h3>
        <button onClick={resetGame}>{t("reset")}</button>

        <div style={{marginTop: "50px"}}> Support | <a href="https://x.com/heervsz" target="_blank" rel="noopener noreferrer">
            X/Twitter</a> | <a href="https://instagram.com/heervsz" target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>

      </div>
    </div>
  );
}

export default App;
