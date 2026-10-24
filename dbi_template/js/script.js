"use strict";

/* Update only this object to personalize the page. */
const PROFILE = {
    firstName: "Emmanuelle",
    lastName: "Villaranda",
    title: "Car Sales Consultant",
    company: "Auto Connect",
    phone: "+639612192189",
    email: "emmanuellevillaranda@gmail.com",
    address: "Your Showroom Address",
    facebook: "https://facebook.com/YOUR_PAGE",
    messenger: "https://m.me/YOUR_USERNAME",
    instagram: "https://instagram.com/YOUR_USERNAME",
    tiktok: "https://tiktok.com/@YOUR_USERNAME"
};

const $ = id => document.getElementById(id);

const fullName = `${PROFILE.firstName} ${PROFILE.lastName}`;
const initials =
`${PROFILE.firstName[0] || ""}${PROFILE.lastName[0] || ""}`.toUpperCase();

const phoneURI = PROFILE.phone.replace(/[^\+\d]/g, "");

// Populate Profile
document.title = `${fullName} | ${PROFILE.title}`;
$("year").textContent = new Date().getFullYear();
$("profileName").textContent = fullName;
$("footerName").textContent = fullName;
$("profileRole").textContent = PROFILE.title;
$("companyTop").textContent = PROFILE.company.toUpperCase();
$("brandInitials").textContent = initials;

$("phoneText").textContent = PROFILE.phone;
$("emailText").textContent = PROFILE.email;
$("addressText").textContent = PROFILE.address;

// URLs
const mapURL =
`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(PROFILE.address)}`;

const emailURL =
`mailto:${PROFILE.email}?subject=${encodeURIComponent("Vehicle inquiry")}`;

const smsURL =
`sms:${phoneURI}?&body=${encodeURIComponent(
`Hi ${PROFILE.firstName}, I am interested in a vehicle.`
)}`;

const links = {
    phoneDetail: `tel:${phoneURI}`,
    emailDetail: `mailto:${PROFILE.email}`,
    mapDetail: mapURL,
    callAction: `tel:${phoneURI}`,
    smsAction: smsURL,
    emailAction: emailURL,
    messengerAction: PROFILE.messenger,
    mapAction: mapURL,
    facebook: PROFILE.facebook,
    messenger: PROFILE.messenger,
    instagram: PROFILE.instagram,
    tiktok: PROFILE.tiktok,
    mobileCall: `tel:${phoneURI}`,
    mobileSms: smsURL,
    mobileMessenger: PROFILE.messenger
};

Object.entries(links).forEach(([id, href]) => {
    $(id).href = href;
});

// Reveal Animation
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

if ("IntersectionObserver" in window && !reduced) {
    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                io.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll(".reveal")
        .forEach(el => io.observe(el));
} else {
    document.querySelectorAll(".reveal")
        .forEach(el => el.classList.add("visible"));
}

/* Gallery */
const gallery = $("gallery");
const cards = [...gallery.children];
const dots = $("dots");

let index = 0;
let timer;

cards.forEach((_, i) => {
    const button = document.createElement("button");
    button.className = `dot${i === 0 ? " active" : ""}`;
    button.type = "button";
    button.setAttribute("aria-label", `Show vehicle ${i + 1}`);

    button.addEventListener("click", () => go(i));

    dots.appendChild(button);
});

const dotButtons = [...dots.children];
const status = $("galleryStatus");

function updateUI() {
    dotButtons.forEach((dot, i) => {
        dot.classList.toggle("active", i === index);
        dot.setAttribute(
            "aria-current",
            i === index ? "true" : "false"
        );
    });

    status.textContent =
        `Showing vehicle ${index + 1} of ${cards.length}`;
}

function go(i) {
    index = (i + cards.length) % cards.length;

    gallery.scrollTo({
        left: cards[index].offsetLeft - gallery.offsetLeft,
        behavior: reduced ? "auto" : "smooth"
    });

    updateUI();
}

function start() {
    if (reduced || cards.length < 2) return;

    clearInterval(timer);

    timer = setInterval(() => {
        go(index + 1);
    }, 4200);
}

function stop() {
    clearInterval(timer);
}

start();
updateUI();

gallery.addEventListener("pointerenter", stop);
gallery.addEventListener("pointerleave", start);
gallery.addEventListener("touchstart", stop, { passive: true });
gallery.addEventListener("touchend", start, { passive: true });
gallery.addEventListener("focusin", stop);
gallery.addEventListener("focusout", start);

gallery.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") {
        e.preventDefault();
        stop();
        go(index + 1);
    }

    if (e.key === "ArrowLeft") {
        e.preventDefault();
        stop();
        go(index - 1);
    }
});

gallery.addEventListener(
    "scroll",
    () => {
        clearTimeout(gallery._t);

        gallery._t = setTimeout(() => {
            const nearest = cards.reduce(
                (best, card, i) =>
                    Math.abs(card.offsetLeft - gallery.scrollLeft) < best.d
                        ? {
                            i,
                            d: Math.abs(
                                card.offsetLeft - gallery.scrollLeft
                            )
                        }
                        : best,
                { i: 0, d: Infinity }
            );

            index = nearest.i;
            updateUI();
        }, 100);
    },
    { passive: true }
);

document.addEventListener(
    "visibilitychange",
    () => document.hidden ? stop() : start()
);

/* Save Contact */
const esc = value =>
    String(value)
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/,/g, "\\,")
        .replace(/;/g, "\\;");

$("saveContact").addEventListener("click", () => {
    const vCard = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${esc(PROFILE.lastName)};${esc(PROFILE.firstName)};;;`,
        `FN:${esc(fullName)}`,
        `ORG:${esc(PROFILE.company)}`,
        `TITLE:${esc(PROFILE.title)}`,
        `TEL;TYPE=CELL:${esc(PROFILE.phone)}`,
        `EMAIL;TYPE=INTERNET:${esc(PROFILE.email)}`,
        `ADR;TYPE=WORK:;;${esc(PROFILE.address)};;;;`,
        `URL:${esc(PROFILE.facebook)}`,
        "END:VCARD"
    ].join("\r\n");

    const url = URL.createObjectURL(
        new Blob([vCard], {
            type: "text/vcard;charset=utf-8"
        })
    );

    const a = document.createElement("a");
    a.href = url;
    a.download =
        `${PROFILE.firstName}-${PROFILE.lastName}.vcf`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(
        () => URL.revokeObjectURL(url),
        1000
    );

    const toast = $("toast");
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
});