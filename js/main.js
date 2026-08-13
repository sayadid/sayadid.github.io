/* ============================================================
 * hexo-theme-claude 交互脚本
 * 明暗切换（手动 + 跟随系统 + 记忆 + Giscus 联动）、代码块工具
 * ============================================================ */
(function () {
	'use strict';

	var root = document.documentElement;

	/* ---------- 明暗主题 ---------- */

	function syncGiscus() {
		var box = document.getElementById('comments');
		var frame = document.querySelector('iframe.giscus-frame');
		if (!box || !frame) return;
		var theme = root.classList.contains('dark') ? box.dataset.themeDark : box.dataset.themeLight;
		frame.contentWindow.postMessage({ giscus: { setConfig: { theme: theme } } }, 'https://giscus.app');
	}

	function applyTheme(dark, persist) {
		root.classList.toggle('dark', dark);
		if (persist) {
			try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) { /* 无痕模式等 */ }
		}
		syncGiscus();
	}

	var toggle = document.getElementById('theme-toggle');
	if (toggle) {
		toggle.addEventListener('click', function () {
			applyTheme(!root.classList.contains('dark'), true);
		});
	}

	// 用户未手动选择过时，跟随系统明暗变化
	var media = window.matchMedia('(prefers-color-scheme: dark)');
	function onSystemChange(e) {
		var stored = null;
		try { stored = localStorage.getItem('theme'); } catch (err) { /* ignore */ }
		if (!stored) applyTheme(e.matches, false);
	}
	if (media.addEventListener) {
		media.addEventListener('change', onSystemChange);
	} else if (media.addListener) {
		media.addListener(onSystemChange); // 旧版 Safari
	}

	/* ---------- 代码块：语言标签 + 复制按钮 ---------- */

	var COPY_ICON = '<i class="fas fa-copy"></i>';

	document.querySelectorAll('figure.highlight').forEach(function (fig) {
		var lang = '';
		fig.classList.forEach(function (c) {
			if (c !== 'highlight') lang = c;
		});
		if (lang && lang !== 'plaintext' && lang !== 'plain') {
			var label = document.createElement('span');
			label.className = 'code-lang';
			label.textContent = lang;
			fig.appendChild(label);
		}

		var btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'code-copy';
		btn.setAttribute('aria-label', '复制代码');
		btn.innerHTML = COPY_ICON;
		btn.addEventListener('click', function () {
			// 只取代码列，排除行号
			var pre = fig.querySelector('td.code pre') || fig.querySelector('pre');
			if (!pre) return;
			copyText(pre.innerText, function () {
				btn.textContent = '已复制';
				btn.classList.add('copied');
				setTimeout(function () {
					btn.innerHTML = COPY_ICON;
					btn.classList.remove('copied');
				}, 1500);
			});
		});
		fig.appendChild(btn);
	});

	function copyText(text, onDone) {
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(text).then(onDone).catch(function () {
				fallbackCopy(text, onDone);
			});
		} else {
			fallbackCopy(text, onDone);
		}
	}

	function fallbackCopy(text, onDone) {
		var ta = document.createElement('textarea');
		ta.value = text;
		ta.style.position = 'fixed';
		ta.style.opacity = '0';
		document.body.appendChild(ta);
		ta.select();
		try {
			if (document.execCommand('copy')) onDone();
		} catch (e) { /* ignore */ }
		document.body.removeChild(ta);
	}
})();
