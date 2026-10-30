(() => {
    "use strict";
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const store = {
        get(k, f) { try { const v = localStorage.getItem(k); return v === null ? f : JSON.parse(v); } catch { return f; } },
        set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } }
    };

    /* ---------- Header, progress bar, active link ---------- */
    const top = $("#top");
    const bar = $("#progress");
    const onScroll = () => {
        top.classList.toggle("is-scrolled", scrollY > 8);
        const max = document.documentElement.scrollHeight - innerHeight;
        bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });

    const nav = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            $$(".top__nav a").forEach(a => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
        });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["about", "stories", "wishes", "gallery"].forEach(id => nav.observe(document.getElementById(id)));

    /* ---------- Scroll reveal ---------- */
    if ("IntersectionObserver" in window && !reduce) {
        const rv = new IntersectionObserver((entries, o) => {
            entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-visible"); o.unobserve(e.target); } });
        }, { threshold: 0.15 });
        $$(".reveal").forEach(el => rv.observe(el));
    } else {
        $$(".reveal").forEach(el => el.classList.add("is-visible"));
    }

    /* ---------- Photo fallbacks ---------- */
    $$("img[data-fallback]").forEach(img => {
        const holder = img.closest("[data-initial], .portrait");
        const mark = () => {
            const ok = img.complete && img.naturalWidth > 0;
            holder.classList.toggle("has-image", ok);
            holder.classList.toggle("no-photo", img.complete && !ok);
        };
        img.addEventListener("load", mark);
        img.addEventListener("error", () => { holder.classList.remove("has-image"); holder.classList.add("no-photo"); });
        mark();
    });

    /* ---------- Shooting stars + wishes ---------- */
    const layer = $("#shootingLayer");
    const line = $("#wishLine");
    const messages = [
        "A little flower for a beautiful story. 🌸",
        "May this universe always hold kindness. 🦋",
        "Every story leaves a little stardust. ♡",
        "May every new chapter bring something beautiful. 🌼",
        "The sky looks brighter with your wish. ⭐",
        "Let your favourite memories bloom. 🪻"
    ];
    const rand = arr => arr[Math.floor(Math.random() * arr.length)];

    function shootingStars(n = 3) {
        if (reduce) return;
        for (let i = 0; i < n; i++) {
            setTimeout(() => {
                const s = document.createElement("span");
                s.className = "shoot" + (i % 2 ? " shoot--sea" : "");
                s.style.setProperty("--top", Math.random() * 40 + "%");
                s.style.setProperty("--left", Math.random() * 55 + "%");
                layer.appendChild(s);
                s.addEventListener("animationend", () => s.remove(), { once: true });
            }, i * 260);
        }
    }

    let count = store.get("jsl-count", 0);
    let wishes = store.get("jsl-wishes", []);
    if (!Array.isArray(wishes)) wishes = [];

    const sky = $("#wishSky"), empty = $("#wishEmpty"), clear = $("#clearWishes");
    const input = $("#wishInput"), err = $("#wishError"), chars = $("#charCount");

    function renderCount() {
        $("#wishCount").textContent = count;
        $("#heroCount").textContent = count;
    }

    function addStar(w, animate) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "wish-star" + (animate ? "" : " static");
        b.textContent = "✦";
        b.style.left = w.x + "%";
        b.style.top = w.y + "%";
        const t = document.createElement("span");
        t.className = "wish-star__text";
        t.textContent = w.text; // user text stays plain text
        b.appendChild(t);
        b.addEventListener("click", e => {
            e.stopPropagation();
            $$(".wish-star.is-open").forEach(s => s !== b && s.classList.remove("is-open"));
            b.classList.toggle("is-open");
        });
        sky.appendChild(b);
    }

    function renderSky(newIndex = -1) {
        $$(".wish-star", sky).forEach(s => s.remove());
        wishes.forEach((w, i) => addStar(w, i === newIndex));
        empty.hidden = wishes.length > 0;
        clear.hidden = wishes.length === 0;
    }

    function spot() {
        for (let a = 0; a < 12; a++) {
            const x = 12 + Math.random() * 76, y = 20 + Math.random() * 62;
            if (!wishes.some(w => Math.hypot(w.x - x, w.y - y) < 12)) return { x, y };
        }
        return { x: 12 + Math.random() * 76, y: 20 + Math.random() * 62 };
    }

    function registerWish() {
        count++;
        store.set("jsl-count", count);
        renderCount();
        line.innerHTML = "";
        line.append(rand(messages) + "  Wishes sent: ");
        const s = document.createElement("strong");
        s.id = "wishCount";
        s.textContent = count;
        line.append(s);
    }

    input.addEventListener("input", () => {
        chars.textContent = `${input.value.length} / ${input.maxLength}`;
        err.textContent = "";
    });

    $("#wishForm").addEventListener("submit", e => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) { err.textContent = "Write a few words first."; input.focus(); return; }
        wishes.push({ text, ...spot() });
        if (wishes.length > 24) wishes.shift();
        store.set("jsl-wishes", wishes);
        renderSky(wishes.length - 1);
        registerWish();
        shootingStars(3);
        input.value = "";
        chars.textContent = `0 / ${input.maxLength}`;
    });

    $("#shootBtn").addEventListener("click", () => { registerWish(); shootingStars(3); });
    $("#heroWish").addEventListener("click", () => {
        registerWish();
        shootingStars(3);
        $("#wishes").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    });
    clear.addEventListener("click", () => { wishes = []; store.set("jsl-wishes", wishes); renderSky(); });
    document.addEventListener("click", () => $$(".wish-star.is-open").forEach(s => s.classList.remove("is-open")));

    renderCount();
    renderSky();

    /* ---------- Constellation ---------- */
    const stories = [
        { meta: "2022 · Fantasy romance", title: "Vice Versa", tag: "Puen & Talay",
          text: "A journey through parallel universes follows Puen and Talay as they try to find their way home while discovering an unexpected connection." },
        { meta: "2023 · Special episodes", title: "Our Skyy 2", tag: "Puen & Talay",
          text: "Return to the Vice Versa universe for another chapter with Puen and Talay, revisiting their relationship after the original series." },
        { meta: "2023 · Drama romance", title: "Last Twilight", tag: "Mhok & Day",
          text: "Mhok becomes Day's caretaker. As the two learn to understand one another, they discover hope, courage, and new ways of seeing the world." },
        { meta: "2025 · Fantasy romance", title: "My Magic Prophecy", tag: "In & Thapfah",
          text: "Tarot reader In crosses paths with ICU doctor Thapfah after predicting danger in his future. Fate brings the two together in an unexpected journey." },
        { meta: "2026 · Announced project", title: "I Will Always Save You", tag: "Upcoming project",
          text: "Police lieutenant Pongpuen is assigned to protect Pepper, a musician who becomes a witness. Their complicated history adds another layer to the story." },
        { meta: "A little extra", title: "Music & Memories", tag: "Soundtrack appreciation",
          text: "Their shared series also have memorable soundtracks. Revisit the music that helped bring their on-screen stories to life." }
    ];

    const stars = $$(".star");
    const panel = $("#panel");

    function show(i, animate = true) {
        const s = stories[i];
        stars.forEach((el, k) => el.setAttribute("aria-pressed", String(k === i)));
        $("#pMeta").textContent = s.meta;
        $("#pTitle").textContent = s.title;
        $("#pText").textContent = s.text;
        $("#pTag").textContent = s.tag;
        if (animate && !reduce) { panel.classList.remove("swap"); void panel.offsetWidth; panel.classList.add("swap"); }
    }
    stars.forEach(el => el.addEventListener("click", () => show(+el.dataset.i)));
    show(0, false);

    const map = $("#map");
    if (!reduce && "IntersectionObserver" in window) {
        map.classList.add("pre");
        const io = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) return;
            map.classList.remove("pre");
            map.classList.add("draw");
            setTimeout(() => map.classList.remove("draw"), 2800);
            io.disconnect();
        }, { threshold: 0.4 });
        io.observe(map);
    }

    /* ---------- Lightbox ---------- */
    const lb = $("#lightbox"), lbImg = $("#lbImg"), lbPhoto = $("#lbPhoto");
    let opener = null;

    $$(".frame__open").forEach(btn => {
        btn.addEventListener("click", () => {
            opener = btn;
            const img = $("img", btn);
            $("#lbTitle").textContent = btn.dataset.title;
            $("#lbText").textContent = btn.dataset.caption;
            lbPhoto.dataset.initial = $(".frame__img", btn).dataset.initial;
            lbPhoto.classList.remove("has-image", "no-photo");
            if (img.complete && img.naturalWidth > 0) {
                lbImg.src = img.currentSrc || img.src;
                lbImg.alt = img.alt;
                lbPhoto.classList.add("has-image");
            } else {
                lbImg.removeAttribute("src");
                lbPhoto.classList.add("no-photo");
            }
            lb.showModal();
        });
    });
    $("#lbClose").addEventListener("click", () => lb.close());
    lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });
    lb.addEventListener("close", () => opener && opener.focus());

    /* ---------- Surprise ---------- */
    const sBtn = $("#surpriseBtn"), sBox = $("#surprise");
    sBtn.addEventListener("click", () => {
        const show = sBox.hidden;
        sBox.hidden = !show;
        sBtn.setAttribute("aria-expanded", String(show));
        sBtn.textContent = show ? "Keep this little wish ♡" : "Open a little surprise ♡";
        if (show) shootingStars(3);
    });
})();
