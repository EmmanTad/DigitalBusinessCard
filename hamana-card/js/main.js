/* Hamana Homes – Digital Business Card
   1. Carousels (house photos + video tours)
   2. Auto-advance for the house photos
   3. Save Contact (vCard)
   4. Send Email (mail app, with fallback)
*/
(function () {
  "use strict";

  /* ---------- Contact details (edit here) ---------- */
  var CONTACT = {
    firstName: "Aileen",
    lastName: "Lacson",
    title: "Sales Manager",
    org: "Hamana Homes Pampanga",
    phone: "+639956608762",
    email: "aileenlacson.hamanahomes@gmail.com",
    url: "https://www.facebook.com/aileenlacson.business",
    street: "Hamana Homes",
    city: "Magalang",
    region: "Pampanga",
    zip: "2011",
    country: "Philippines",
    photo: "images/avatar.jpg",
    emailSubject: "Inquiry about Hamana Homes Magalang",
    emailBody:
      "Hi Aileen,\r\n\r\nI'm interested in Hamana Homes in Magalang, Pampanga. Please send me more details.\r\n\r\nThank you!"
  };

  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(message, actions, ms) {
    var el = $("toast");
    if (!el) return;
    clearTimeout(toastTimer);
    el.textContent = "";
    var p = document.createElement("div");
    p.textContent = message;
    el.appendChild(p);
    if (actions && actions.length) {
      var row = document.createElement("div");
      row.className = "acts";
      actions.forEach(function (a) { row.appendChild(a); });
      el.appendChild(row);
    }
    el.hidden = false;
    toastTimer = setTimeout(function () { el.hidden = true; }, ms || 6000);
  }

  function linkAction(label, href) {
    var a = document.createElement("a");
    a.textContent = label;
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    return a;
  }

  function buttonAction(label, fn) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.onclick = fn;
    return b;
  }

  /* ---------- 1. Carousels ---------- */
  function carousel(trackId, dotsId) {
    var track = $(trackId), dots = $(dotsId);
    if (!track || !dots) return; // never let a missing element break the rest of the page

    [].forEach.call(track.children, function (slide, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Slide " + (i + 1));
      b.onclick = function () {
        track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: "smooth" });
      };
      dots.appendChild(b);
    });

    function update() {
      var i = Math.round(track.scrollLeft / (track.firstElementChild.offsetWidth + 14));
      [].forEach.call(dots.children, function (b, j) { b.className = j === i ? "on" : ""; });
      [].forEach.call(track.querySelectorAll("video"), function (v, j) { if (j !== i) v.pause(); });
    }
    track.addEventListener("scroll", update);
    update();
  }

  carousel("track", "dots");
  carousel("track2", "dots2");

  /* ---------- 2. Auto-advance house photos ---------- */
  (function autoAdvance() {
    var track = $("track");
    if (!track || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var stopped = false, visible = true, i = 0, n = track.children.length;

    ["pointerdown", "wheel", "touchstart"].forEach(function (evt) {
      track.addEventListener(evt, function () { stopped = true; }, { passive: true });
    });
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (r) { visible = r[0].isIntersecting; }).observe(track);
    }
    setInterval(function () {
      if (stopped || !visible) return;
      i = (i + 1) % n;
      var s = track.children[i];
      track.scrollTo({ left: s.offsetLeft - track.offsetLeft, behavior: "smooth" });
    }, 4200);
  })();

  /* ---------- 3. Save Contact (vCard) ---------- */
  var photoB64 = null;

  // Preload the profile photo so it can be embedded in the contact (works when served over http/https).
  (function preloadPhoto() {
    if (!/^https?:$/.test(location.protocol)) return; // fetch() is blocked on file://
    try {
      fetch(CONTACT.photo)
        .then(function (r) { return r.ok ? r.blob() : Promise.reject(); })
        .then(function (blob) {
          var fr = new FileReader();
          fr.onload = function () { photoB64 = String(fr.result).split(",")[1] || null; };
          fr.readAsDataURL(blob);
        })
        .catch(function () { /* e.g. opened from file:// – contact is saved without photo */ });
    } catch (e) { /* ignore */ }
  })();

  function esc(v) {
    return String(v).replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  }

  // vCard lines must be folded at 75 characters (continuation lines start with a space)
  function fold(line) {
    var out = [];
    while (line.length > 75) {
      out.push(line.slice(0, 75));
      line = " " + line.slice(75);
    }
    out.push(line);
    return out.join("\r\n");
  }

  function buildVCard() {
    var c = CONTACT;
    var lines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      "N:" + esc(c.lastName) + ";" + esc(c.firstName) + ";;;",
      "FN:" + esc(c.firstName + " " + c.lastName),
      "ORG:" + esc(c.org),
      "TITLE:" + esc(c.title),
      "TEL;TYPE=CELL,VOICE:" + c.phone,
      "EMAIL;TYPE=INTERNET,WORK:" + c.email,
      "URL:" + c.url,
      "ADR;TYPE=WORK:;;" + esc(c.street) + ";" + esc(c.city) + ";" + esc(c.region) + ";" + c.zip + ";" + esc(c.country)
    ];
    if (photoB64) lines.push("PHOTO;ENCODING=b;TYPE=JPEG:" + photoB64);
    lines.push("END:VCARD");
    return lines.map(fold).join("\r\n") + "\r\n";
  }

  function downloadBlob(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a); // must be in the DOM for Firefox / some mobile browsers
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
  }

  function saveContact() {
    var filename = CONTACT.firstName + "-" + CONTACT.lastName + ".vcf";
    var blob = new Blob([buildVCard()], { type: "text/vcard;charset=utf-8" });
    var isTouch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

    // On phones the share sheet offers "Contacts" directly – the most reliable way to add the card.
    if (isTouch && navigator.canShare && window.File) {
      var file = new File([blob], filename, { type: "text/vcard" });
      if (navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: CONTACT.firstName + " " + CONTACT.lastName })
          .catch(function (err) {
            if (err && err.name === "AbortError") return; // user closed the sheet
            downloadBlob(blob, filename);
            toast("Contact file downloaded. Open it to add " + CONTACT.firstName + " to your contacts.");
          });
        return;
      }
    }

    downloadBlob(blob, filename);
    toast("Contact file downloaded. Open it to add " + CONTACT.firstName + " to your contacts.");
  }

  var saveBtn = $("save");
  if (saveBtn) saveBtn.addEventListener("click", saveContact);

  /* ---------- 4. Send Email ---------- */
  var emailBtn = $("email");
  if (emailBtn) {
    emailBtn.addEventListener("click", function () {
      // Let the mailto: link open the default mail app. If nothing happens
      // (no mail app set up, or the page is in a restricted view) offer alternatives.
      var left = false;
      function onLeave() { left = true; }
      window.addEventListener("blur", onLeave, { once: true });
      document.addEventListener("visibilitychange", onLeave, { once: true });

      setTimeout(function () {
        window.removeEventListener("blur", onLeave);
        document.removeEventListener("visibilitychange", onLeave);
        if (left) return;

        var gmail =
          "https://mail.google.com/mail/?view=cm&fs=1" +
          "&to=" + encodeURIComponent(CONTACT.email) +
          "&su=" + encodeURIComponent(CONTACT.emailSubject) +
          "&body=" + encodeURIComponent(CONTACT.emailBody);

        toast("No email app opened. Send it another way:", [
          linkAction("Open Gmail", gmail),
          buttonAction("Copy email address", function () {
            var done = function () { toast("Copied: " + CONTACT.email, null, 3000); };
            if (navigator.clipboard && navigator.clipboard.writeText) {
              navigator.clipboard.writeText(CONTACT.email).then(done, function () {
                toast(CONTACT.email, null, 8000);
              });
            } else {
              toast(CONTACT.email, null, 8000);
            }
          })
        ], 9000);
      }, 1500);
    });
  }
})();
