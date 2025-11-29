(function () {
    const banner = document.getElementById('cookie-banner');
    const acceptBtn = document.getElementById('cookie-accept');
    const rejectBtn = document.getElementById('cookie-reject');

    if (!banner) return;

    const consent = localStorage.getItem('qt-cookie-consent');

    if (!consent) {
        banner.classList.remove('hidden');
    } else {
        // Load scripts now if user previously accepted
        if (consent === "accepted") loadOptionalScripts();
    }

    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('qt-cookie-consent', 'accepted');
        banner.classList.add('hidden');
        loadOptionalScripts();
    });

    rejectBtn.addEventListener('click', () => {
        localStorage.setItem('qt-cookie-consent', 'rejected');
        banner.classList.add('hidden');
        // Do NOT load optional scripts
    });

    function loadOptionalScripts() {
        // Example: Google Analytics
        const ga = document.createElement('script');
        ga.src = "https://www.googletagmanager.com/gtag/js?id=G-XXXX";
        ga.async = true;
        document.head.appendChild(ga);

        const gaConfig = document.createElement('script');
        gaConfig.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXX');
        `;
        document.head.appendChild(gaConfig);

        // Ads (AdSense) only IF user accepted
        const ads = document.createElement('script');
        ads.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
        ads.setAttribute("data-ad-client", "YOUR-AD-CLIENT-ID");
        ads.async = true;
        document.head.appendChild(ads);
    }
})();
