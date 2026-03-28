/**
 * topbar.js — single source of truth for the tool nav.
 *
 * To add a new tool: append an entry to TOOLS below.
 * External tools get `external: true`; they open in a new tab and are never
 * marked active.
 *
 * Usage: place <script src="js/topbar.js"></script> in <body> where the
 * .app-topbar markup used to live. The script replaces itself in-place.
 */
(function () {
    const TOOLS = [
        { href: 'pin-mapper.html',                      label: 'Pin Mapper' },
        { href: 'pa-calc.html',                         label: 'PA Calculator' },
        { href: 'pa-tuner.html',                        label: 'PA Tuner' },
        { href: 'https://alextverdyy.github.io/SMS_Web/', label: 'Stepper Sim', external: true },
    ];

    const page = window.location.pathname.split('/').pop() || 'index.html';

    const navLinks = TOOLS.map(function (tool) {
        const isActive = !tool.external && tool.href === page;
        const cls = 'tool-nav-link' + (isActive ? ' active' : '');
        const extra = tool.external ? ' target="_blank"' : '';
        return '<a href="' + tool.href + '" class="' + cls + '"' + extra + '>' + tool.label + '</a>';
    }).join('\n            ');

    const html = [
        '<div class="app-topbar">',
        '    <div class="app-brand">',
        '        <a href="index.html" class="brand-link">',
        '            <h1>&#10022; Klipper Tools</h1>',
        '        </a>',
        '        <div class="subtitle">Excit3D Community</div>',
        '    </div>',
        '    <nav class="tool-nav">',
        '        ' + navLinks,
        '        <a href="index.html" class="tool-nav-link tool-nav-home">&#8592; All Tools</a>',
        '    </nav>',
        '</div>',
    ].join('\n');

    // Insert the topbar exactly where this <script> tag sits, then remove the tag.
    var s = document.currentScript;
    s.insertAdjacentHTML('beforebegin', html);
    s.parentNode.removeChild(s);
}());
