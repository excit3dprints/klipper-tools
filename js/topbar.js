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
        { href: 'pin-mapper/',     label: 'Pin Mapper' },
        { href: 'pa-calc/',       label: 'PA Calculator' },
        { href: 'pa-tuner/',      label: 'PA Tuner' },
        { href: 'motor-sym/',     label: 'Stepper Sim' },
    ];

    const currentPath = window.location.pathname;
    const isInSubDir = TOOLS.some(t => currentPath.includes('/' + t.href)) || currentPath.includes('/motor-sym/');
    const homeHref = isInSubDir ? '../' : './';

    const navLinks = TOOLS.map(function (tool) {
        const isActive = !tool.external && (currentPath.includes('/' + tool.href));
        
        let adjustedHref = tool.href;
        if (isInSubDir) {
            // Check if the link points to the directory we are currently in
            const currentDir = currentPath.split('/').filter(Boolean).pop();
            const targetDir = tool.href.replace('/', '');
            adjustedHref = (currentDir === targetDir) ? './' : '../' + tool.href;
        }

        const cls = 'tool-nav-link' + (isActive ? ' active' : '');
        const extra = tool.external ? ' target="_blank"' : '';
        return '<a href="' + adjustedHref + '" class="' + cls + '"' + extra + '>' + tool.label + '</a>';
    }).join('\n            ');

    const html = [
        '<div class="app-topbar">',
        '    <div class="app-brand">',
        '        <a href="' + homeHref + '" class="brand-link">',
        '            <h1>&#10022; Klipper Tools</h1>',
        '        </a>',
        '        <div class="subtitle">Excit3D Community</div>',
        '    </div>',
        '    <nav class="tool-nav">',
        '        ' + navLinks,
        '        <a href="' + homeHref + '" class="tool-nav-link tool-nav-home">&#8592; All Tools</a>',
        '    </nav>',
        '</div>',
    ].join('\n');

    // Insert the topbar exactly where this <script> tag sits, then remove the tag.
    var s = document.currentScript;
    s.insertAdjacentHTML('beforebegin', html);
    s.parentNode.removeChild(s);
}());
