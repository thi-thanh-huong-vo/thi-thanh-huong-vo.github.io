(function(){
  var boxes=document.querySelectorAll('.ls-search'); if(!boxes.length) return;
  var IDX=null, loading=false, waiters=[];
  function load(cb){ if(IDX){cb();return;} waiters.push(cb); if(loading) return; loading=true;
    var s=document.createElement('script'); s.src='search-index.js?v=1';
    s.onload=function(){ IDX=window.LS_INDEX||[]; IDX.forEach(prep); waiters.forEach(function(f){f();}); };
    document.head.appendChild(s); }
  function norm(t){ return (t||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/₂/g,'2').replace(/₃/g,'3').replace(/[–—\-]/g,' ').replace(/\s+/g,' '); }
  function prep(p){ p.n=[0,1].map(function(k){ return { t:norm(p.t[k]), d:norm(p.d[k]),
      s:p.s[k].map(function(sec){ return {id:sec[0], h:sec[1], x:sec[2], nh:norm(sec[1]), nx:norm(sec[2])}; }) }; }); }
  function lang(){ return document.documentElement.lang==='en'?1:0; }
  var NAMES={proc:['Chế tạo bán dẫn','Processing'],dev:['Linh kiện','Devices'],nano:['Vật liệu nano','Nanomaterials'],cad:['AutoCAD','AutoCAD'],tcad:['TCAD','TCAD']};
  function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function snippet(x,nx,term){ var i=nx.indexOf(term); if(i<0) return esc(x.slice(0,140))+(x.length>140?'…':'');
    var a=Math.max(0,i-60), b=Math.min(x.length,i+term.length+90);
    return (a>0?'…':'')+esc(x.slice(a,i))+'<mark>'+esc(x.slice(i,i+term.length))+'</mark>'+esc(x.slice(i+term.length,b))+(b<x.length?'…':''); }
  function search(q,scope){
    var terms=norm(q).split(/\s+/).filter(function(t){return t.length>1;}); if(!terms.length) return [];
    var k=lang(), out=[], phrase=norm(q).trim().replace(/\s+/g,' '), multi=terms.length>1;
    IDX.forEach(function(p){
      if(scope.indexOf(p.c)<0) return;
      var L=p.n[k], best=null, pageScore=0, all=true;
      terms.forEach(function(t){ var inPage=L.t.indexOf(t)>=0||L.d.indexOf(t)>=0||L.s.some(function(s){return s.nh.indexOf(t)>=0||s.nx.indexOf(t)>=0;}); if(!inPage) all=false; });
      if(!all) return;
      terms.forEach(function(t){ if(L.t.indexOf(t)>=0) pageScore+=12; if(L.d.indexOf(t)>=0) pageScore+=4; }); if(multi&&L.t.indexOf(phrase)>=0) pageScore+=20;
      L.s.forEach(function(s){ var sc=0; terms.forEach(function(t){ if(s.nh.indexOf(t)>=0) sc+=6; var m=s.nx.split(t).length-1; sc+=Math.min(m,5); }); if(multi){ if(s.nh.indexOf(phrase)>=0) sc+=12; sc+=Math.min(s.nx.split(phrase).length-1,4)*5; }
        if(sc>0&&(!best||sc>best.sc)) best={sc:sc,s:s}; });
      out.push({p:p,score:pageScore+(best?best.sc:0),sec:best?best.s:null,term:(multi&&best&&best.s.nx.indexOf(phrase)>=0)?phrase:terms[0]});
    });
    out.sort(function(a,b){return b.score-a.score;}); return out.slice(0,12);
  }
  boxes.forEach(function(box){
    var inp=box.querySelector('input'), res=box.querySelector('.ls-results'), scope=(box.dataset.scope||'').split(',');
    function ph(){ inp.placeholder=lang()?inp.dataset.en:inp.dataset.vi; }
    ph(); new MutationObserver(function(){ ph(); if(inp.value) run(); }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    function run(){ var q=inp.value.trim(); if(q.length<2){ res.innerHTML=''; return; }
      load(function(){ var r=search(q,scope), k=lang();
        if(!r.length){ res.innerHTML='<p class="ls-none">'+(k?'No results. Try another keyword.':'Không tìm thấy. Hãy thử từ khóa khác.')+'</p>'; return; }
        res.innerHTML=r.map(function(o){ var p=o.p, sec=o.sec, href=p.u+(sec&&sec.id?'#'+(k?'e-':'v-')+sec.id:'');
          return '<a class="ls-hit" href="'+href+'"><span class="ls-tag">'+NAMES[p.c][k]+'</span><span class="ls-t">'+esc(p.t[k])+'</span>'+
            (sec&&sec.h?'<span class="ls-h">› '+esc(sec.h)+'</span>':'')+
            '<span class="ls-x">'+(sec?snippet(sec.x,sec.nx,o.term):esc(p.d[k]))+'</span></a>'; }).join(''); }); }
    var tm; inp.addEventListener('input',function(){ clearTimeout(tm); tm=setTimeout(run,150); });
    inp.addEventListener('focus',function(){ load(function(){}); });
  });
})();
