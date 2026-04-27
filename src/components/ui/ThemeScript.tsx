export function ThemeScript() {
  const script = `(function(){try{var s=JSON.parse(localStorage.getItem('ap-ui')||'{}');var t=s?.state?.theme||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})();`
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
