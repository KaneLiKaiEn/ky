export interface PreviewResult {
  html_content?: string;
  style_content?: string;
  script_content?: string;
}
export interface FrameOptions {
  bridgeId?: string;
  fit?: boolean;
  background?: string;
  color?: string;
}
/** Escape script terminators in JSON; returned markup is executed only inside the preview frame. */
export function previewDocument(
  result: PreviewResult,
  scripts: string[],
  errorColor: string,
  options: FrameOptions = {},
): string {
  const data = JSON.stringify({ result, scripts, errorColor, options }).replace(
    /</g,
    "\\u003c",
  );
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;min-height:100%;}#preview-error{white-space:pre-wrap;padding:16px;font:14px sans-serif}</style></head><body><div id="preview-error" role="alert" hidden></div><script>
  const data = ${data};
  const send = (action, payload) => {if(data.options.bridgeId) parent.postMessage({kind:'board-preview',channel:data.options.bridgeId,action,payload}, '*');};
  window.handleLinkRefresh = (argCode,argValue,argText,source) => send('cascade',{argCode,argValue,argText,source});
  window.handleShowBoard = (boardId,args) => send('board',{boardId,args});
  document.documentElement.style.background = data.options.background || 'transparent';
  document.documentElement.style.color = data.options.color || 'inherit';
  document.getElementById('preview-error').style.color = data.errorColor;
  const showError = (message) => {const node=document.getElementById('preview-error');node.hidden=false;node.textContent='预览失败：'+message;};
  window.addEventListener('error', event => showError(event.message || '脚本运行错误'));
  window.addEventListener('unhandledrejection', event => showError(String(event.reason)));
  (async () => {
    try {
      const content=document.createElement('div'); content.innerHTML=data.result.html_content || ''; document.body.appendChild(content);
      const style=document.createElement('style'); style.textContent=data.result.style_content || ''; document.head.appendChild(style);
      if(data.options.fit){const fit=document.createElement('style');fit.textContent='html,body{height:100%;overflow:hidden}body>div:not(#preview-error){height:100%;width:100%}body>div:not(#preview-error)>:first-child{width:100%!important;height:100%!important;box-sizing:border-box}svg{max-width:100%;max-height:100%}';document.head.appendChild(fit);}
      for (const url of data.scripts) await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=url;script.onload=resolve;script.onerror=()=>reject(new Error('无法加载资源 '+url));document.head.appendChild(script);});
      for(const old of [...content.querySelectorAll('script')]){
        const script=document.createElement('script');for(const attr of old.attributes)script.setAttribute(attr.name,attr.value);script.textContent=old.textContent;
        old.remove();
        if(script.src || script.type==='module') await new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=()=>reject(new Error('内容脚本加载失败'));document.body.appendChild(script);});
        else document.body.appendChild(script);
      }
      const script=document.createElement('script'); script.textContent=data.result.script_content || '';document.body.appendChild(script);
      window.addEventListener('resize',()=>{if(window.echarts)for(const node of document.querySelectorAll('[_echarts_instance_]'))window.echarts.getInstanceByDom(node)?.resize();});
    } catch(error) { showError(error.message || String(error)); }
  })();
  </script></body></html>`;
}
