'use strict';
// Protótipo de apresentação: sem imports da aplicação, APIs, sockets ou comandos.
const sceneRoot=document.getElementById('scene');
const definitions=`
<defs>
 <linearGradient id="water" x1="0" y1="0" x2=".8" y2="1"><stop stop-color="var(--water-top)"/><stop offset="1" stop-color="var(--water-deep)"/></linearGradient>
 <linearGradient id="waterwall" x1="0" y1="0" x2="0" y2="1"><stop stop-color="var(--water-top)" stop-opacity=".8"/><stop offset="1" stop-color="var(--water-deep)" stop-opacity=".3"/></linearGradient>
 <linearGradient id="tank" x1="0" y1="0" x2="1" y2=".1"><stop stop-color="var(--metal-dark)"/><stop offset=".42" stop-color="var(--tank-side)"/><stop offset=".7" stop-color="var(--tank-top)"/><stop offset="1" stop-color="var(--metal-dark)"/></linearGradient>
 <linearGradient id="earth" x1="0" y1="0" x2="0" y2="1"><stop stop-color="var(--soil-top)"/><stop offset="1" stop-color="var(--soil-side)"/></linearGradient>
 <radialGradient id="ambient"><stop stop-color="var(--cyan)" stop-opacity=".12"/><stop offset="1" stop-color="var(--cyan)" stop-opacity="0"/></radialGradient>
 <filter id="soft-shadow" x="-.4" y="-.4" width="1.8" height="2"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="var(--shadow)"/></filter>
 <g id="reed"><path d="M0 0Q-4-12-2-23M2 0Q9-15 15-17M-3-1Q-10-10-13-12" fill="none" stroke="var(--leaf)" stroke-width="2" stroke-linecap="round"/></g>
 <g id="plant"><path d="M0 0v-14" stroke="var(--leaf)" stroke-width="2"/><path d="M0-7C-15-5-20-16-14-20C-5-23 1-16 0-7Z" fill="var(--leaf)"/><path d="M0-11C-3-21 6-30 13-26C20-19 11-10 0-11Z" fill="var(--leaf-light)"/><path d="M-1-10Q-8-13-13-19M0-12Q5-16 12-24" fill="none" stroke="var(--leaf-light)" stroke-opacity=".45" stroke-width=".8"/></g>
 <g id="river-art">
  <path d="M0 87Q30 65 59 82T119 80T177 59Q208 41 237 60L281 87L274 117Q229 101 201 121T144 141T87 133T28 152L0 136Z" fill="var(--ground-side)"/>
  <path d="M0 75Q30 53 59 70T119 68T177 47Q208 29 237 48L281 75L274 105Q229 89 201 109T144 129T87 121T28 140L0 124Z" fill="var(--ground-top)"/>
  <path d="M0 86Q27 66 61 82T121 80T181 60Q209 41 235 60L280 86L275 96Q233 81 201 100T144 120T86 112T28 130L0 116Z" fill="url(#water)" stroke="var(--cyan)" stroke-opacity=".3"/>
  <path d="M0 110Q25 94 60 105T126 104T182 83T244 81" class="water-line decorative-wave" fill="none" stroke="var(--cyan)" stroke-width="1.3" opacity=".55"/>
  <path d="M12 90Q35 79 57 91M90 96Q116 101 139 89M169 82Q194 66 210 68M233 76l25 9" class="water-line" fill="none" stroke="var(--cyan)" stroke-width="1.3" opacity=".65"/>
  <path d="M0 119Q28 102 65 116T132 114T188 93T275 98" fill="none" stroke="var(--cyan)" stroke-opacity=".18"/>
  <use href="#reed" x="38" y="72"/><use href="#reed" x="174" y="49"/><use href="#reed" x="237" y="53"/>
  <ellipse cx="74" cy="134" rx="14" ry="5" fill="var(--metal-dark)"/><ellipse cx="228" cy="109" rx="10" ry="4" fill="var(--metal-dark)"/>
 </g>
 <g id="well-art">
  <path d="M10 52 101 6 203 58 111 106Z" fill="var(--ground-top)"/>
  <path d="M10 52 111 106V225L10 171Z" fill="url(#earth)"/><path d="M111 106 203 58V178L111 225Z" fill="var(--soil-side)"/>
  <path d="M11 81 110 133 202 86M11 108 110 160 202 113M11 139 110 191 202 145" fill="none" stroke="var(--soil-top)" stroke-width="2" opacity=".5"/>
  <path d="M31 97l15 8m-7 20 18 10m81 12 18-9m-100 26 12 7m-39-26 8 4m126-42 14-7" stroke="var(--soil-top)" stroke-width="2" opacity=".6"/>
  <path d="M75 52V170C75 186 133 186 133 170V52" fill="var(--base)" stroke="var(--metal-light)" stroke-opacity=".6" stroke-width="2"/>
  <path d="M77 131V170C77 184 131 184 131 170V131" fill="url(#waterwall)"/>
  <ellipse cx="104" cy="131" rx="27" ry="10" fill="var(--water-top)" opacity=".8"/><path d="M84 132q19 7 40 0" class="water-line decorative-wave" fill="none" stroke="var(--cyan)" stroke-width="1.3" opacity=".55"/>
  <ellipse cx="104" cy="52" rx="34" ry="14" fill="var(--metal-dark)" stroke="var(--metal-light)" stroke-width="3"/>
  <ellipse cx="104" cy="52" rx="26" ry="9" fill="var(--base)"/><path d="M104 53V170" stroke="var(--pipe)" stroke-width="5"/>
  <path d="M104 53 125 42 150 53" stroke="var(--pipe)" stroke-width="5" fill="none" stroke-linejoin="round"/>
  <path d="M66 42 102 24 145 44" fill="none" stroke="var(--leaf)" stroke-opacity=".3"/>
 </g>
 <g id="tower-art">
  <ellipse cx="99" cy="255" rx="83" ry="21" fill="var(--shadow)" opacity=".35"/>
  <path d="M52 113 40 244M146 113 160 244M44 220 156 220M43 237 150 137M52 138 158 237M49 168H153" fill="none" stroke="var(--metal-light)" stroke-width="5" stroke-linejoin="round"/>
  <path d="M80 122 77 255M119 122 121 255" stroke="var(--metal-dark)" stroke-width="6"/>
  <path d="M22 42V108C22 151 176 151 176 108V42" fill="url(#tank)" stroke="var(--metal-light)" stroke-width="1.5"/>
  <path d="M27 73V108C27 144 171 144 171 108V73" fill="url(#waterwall)" opacity=".65"/>
  <ellipse cx="99" cy="73" rx="72" ry="22" fill="var(--water-top)" opacity=".7"/><path d="M45 74q53 26 109-1" class="water-line decorative-wave" fill="none" stroke="var(--cyan)" stroke-width="1.3" opacity=".55"/>
  <ellipse cx="99" cy="42" rx="77" ry="25" fill="var(--tank-top)" stroke="var(--metal-light)" stroke-width="1.5"/>
  <ellipse cx="99" cy="40" rx="55" ry="17" fill="none" stroke="var(--metal-light)" stroke-opacity=".6"/>
  <ellipse cx="99" cy="39" rx="17" ry="6" fill="var(--metal-dark)" stroke="var(--metal-light)"/>
  <path d="M29 56q70 39 140 0M25 103q72 40 148 0" fill="none" stroke="var(--metal-light)" stroke-opacity=".4"/>
  <path d="M153 104h29v92h18" fill="none" stroke="var(--pipe)" stroke-width="5" stroke-linejoin="round"/>
  <path d="M28 251h28M145 251h28" stroke="var(--metal-light)" stroke-width="4"/>
 </g>
 <g id="farm-art">
  <path d="M3 95 174 7 310 77 137 171Z" fill="var(--soil-top)"/>
  <path d="M3 95v19l134 75v-18Z" fill="var(--soil-front)"/><path d="M137 171 310 77v20l-173 92Z" fill="var(--soil-side)"/>
  <path d="m17 95 158-80M44 110 201 29M73 126 230 44M100 141 257 58M127 156 285 73" stroke="var(--soil-side)" stroke-width="13" stroke-linecap="round" opacity=".6"/>
  <path d="m17 96 158-80M45 111 202 30M74 127 231 45M101 142 258 59M128 157 286 74" stroke="var(--ground-top)" stroke-width="2" stroke-linecap="round"/>
  <g id="crop-rows"></g>
  <path d="m0 116 137 76 180-97" stroke="var(--pipe)" stroke-width="4" fill="none" stroke-linejoin="round"/>
  <path d="m35 135 158-80m-128 97 157-83m-126 101 155-84" stroke="var(--pipe)" stroke-width="1.5" stroke-opacity=".6"/>
 </g>
 <g id="motor-art">
  
  <path d="m5 37 46 23 41-21-45-22Z" fill="var(--metal-dark)"/>
  <path d="M0 25h19M73 25h27" stroke="var(--pipe)" stroke-width="7"/>
  <path d="M37 10 58 0 83 13V34L60 45 37 33Z" fill="var(--metal-dark)" stroke="var(--metal-light)" stroke-width="1.2"/>
  <path d="m39 11 22 12 21-10-23-12Z" fill="var(--metal-light)"/>
  <path d="m63 25 16-8m-16 14 16-8m-16 14 16-8" stroke="var(--pipe)" opacity=".5"/>
  <ellipse cx="34" cy="27" rx="20" ry="21" fill="var(--metal-dark)" stroke="var(--metal-light)" stroke-width="2"/>
  <ellipse cx="34" cy="27" rx="11" ry="12" fill="none" stroke="var(--pipe)" stroke-opacity=".7"/>
  <path d="m28 20 12 14m0-14L28 34" stroke="var(--pipe)" stroke-width="1.2"/>
 </g>
</defs>`;
const desktop=`<svg class="scene scene-desktop" viewBox="0 0 1120 430" role="img" aria-labelledby="desktop-title desktop-desc">
<title id="desktop-title">Circuito hídrico ilustrativo em uma paisagem integrada</title><desc id="desktop-desc">Rio com curvas, poço em corte, caixa elevada e cultivo em perspectiva. Três bombas nas tubulações. Valores ilustrativos: rio 80%, poço 35%, caixa 60%, solo 38%. Não são medições.</desc>
${definitions}
<ellipse cx="560" cy="275" rx="550" ry="155" fill="url(#ambient)"/>
<path d="M20 277 194 168 380 185 558 141 766 171 1093 253 932 369 605 386 314 338Z" class="ground-side" opacity=".55"/>
<path d="M20 268 194 159 380 176 558 132 766 162 1093 244 932 360 605 377 314 329Z" class="ground-top" opacity=".5"/>
<path d="m214 174 142 76 191-98 192 103 202-95M315 327l199-104 214 113 181-92" fill="none" stroke="var(--metal-light)" stroke-opacity=".13"/>
<use href="#river-art" transform="translate(5 160) scale(1.1)"/>
<use href="#well-art" transform="translate(350 151) scale(.9)"/>
<use href="#tower-art" transform="translate(580 30) scale(1.05)"/>
<use href="#farm-art" transform="translate(802 183) scale(.95)"/>
<g class="pipe-base"><path d="M220 261H260L280 277H386V204H443"/><path d="M485 199H505L523 220H606V85H665"/><path d="M790 236H775V253H856L887 273V291"/></g>
<g class="pipe-core"><path d="M220 261H260L280 277H386V204H443"/><path d="M485 199H505L523 220H606V85H665"/><path d="M790 236H775V253H856L887 273V291"/></g>
<g data-pump="1" data-pump-state="off"><use href="#motor-art" transform="translate(280 259) scale(.72)"/><text x="292" y="329" class="scene-number">B01</text></g>
<g data-pump="2" data-pump-state="off"><use href="#motor-art" transform="translate(523 202) scale(.72)"/><text x="536" y="273" class="scene-number">B02</text></g>
<g data-pump="3" data-pump-state="off"><use href="#motor-art" transform="translate(783 235) scale(.72)"/><text x="793" y="307" class="scene-number">B03</text></g>
<g><text x="30" y="101" class="scene-number">01 / ORIGEM</text><text x="30" y="127" class="scene-title">Rio</text><text x="30" y="151" class="scene-sub">Curso de água</text><text x="196" y="127" class="scene-value">80%</text><path d="M168 143v38l-25 20" class="scene-callout"/></g>
<g><text x="350" y="76" class="scene-number">02 / RESERVA</text><text x="350" y="102" class="scene-title">Poço</text><text x="350" y="126" class="scene-sub">Corte subterrâneo</text><text x="491" y="103" class="scene-value">35%</text><path d="M440 133v35" class="scene-callout"/></g>
<g><text x="803" y="42" class="scene-number">03 / DISTRIBUIÇÃO</text><text x="803" y="68" class="scene-title">Caixa elevada</text><text x="803" y="92" class="scene-value">60% · exemplo</text><path d="M794 71h-28l-22 17" class="scene-callout"/></g>
<g><text x="924" y="133" class="scene-number">04 / CULTIVO</text><text x="924" y="159" class="scene-title">Plantação</text><text x="924" y="182" class="scene-sub">Solo 38% · relativo</text></g>
<g class="scene-sub"><text x="88" y="384">Rio → Poço</text><text x="390" y="409">Poço → Caixa</text><text x="850" y="409">Caixa → Plantação</text></g>
</svg>`;
const tablet=`<svg class="scene scene-tablet" viewBox="0 0 700 610" role="img" aria-labelledby="tablet-title tablet-desc">
<title id="tablet-title">Circuito ilustrativo recomposto em duas faixas para tablet</title><desc id="tablet-desc">Rio e poço na faixa superior, caixa elevada e plantação na faixa inferior; percurso contínuo e três bombas. Todos os valores são exemplos.</desc>
<path d="M5 178 153 89 541 87 681 172 573 294 612 505 343 586 12 477 71 351Z" fill="var(--ground-top)" opacity=".35"/>
<use href="#river-art" transform="translate(8 80) scale(.9)"/>
<use href="#well-art" transform="translate(428 73) scale(.83)"/>
<use href="#tower-art" transform="translate(395 304) scale(.9)"/>
<use href="#farm-art" transform="translate(8 365) scale(1.03)"/>
<g class="pipe-base"><path d="M205 166H290V188H514V116"/><path d="M552 117H656V328H556V342H483"/><path d="M575 480H300V510H159V558"/></g>
<g class="pipe-core"><path d="M205 166H290V188H514V116"/><path d="M552 117H656V328H556V342H483"/><path d="M575 480H300V510H159V558"/></g>
<g data-pump="1" data-pump-state="off"><use href="#motor-art" transform="translate(300 169) scale(.75)"/><text x="309" y="238" class="scene-number">B01</text></g>
<g data-pump="2" data-pump-state="off"><use href="#motor-art" transform="translate(581 309) scale(.75)"/><text x="590" y="377" class="scene-number">B02</text></g>
<g data-pump="3" data-pump-state="off"><use href="#motor-art" transform="translate(300 461) scale(.75)"/><text x="310" y="530" class="scene-number">B03</text></g>
<text x="20" y="36" class="scene-number">01 / ORIGEM</text><text x="20" y="63" class="scene-title">Rio · 80%</text><text x="20" y="267" class="scene-sub">Curso de água</text>
<text x="439" y="29" class="scene-number">02 / RESERVA</text><text x="439" y="56" class="scene-title">Poço · 35%</text><text x="440" y="270" class="scene-sub">Corte subterrâneo</text>
<text x="353" y="295" class="scene-number">03 / DISTRIBUIÇÃO</text><text x="342" y="323" class="scene-title">Caixa elevada · 60%</text>
<text x="18" y="320" class="scene-number">04 / CULTIVO</text><text x="18" y="347" class="scene-title">Plantação</text><text x="18" y="587" class="scene-sub">Solo 38% · escala relativa · exemplo</text>
</svg>`;
// No celular a cena é recomposta, não uma miniatura da composição horizontal.
const mobile=`<svg class="scene scene-mobile" viewBox="0 0 350 920" role="img" aria-labelledby="mobile-title mobile-desc">
<title id="mobile-title">Circuito ilustrativo em percurso vertical</title><desc id="mobile-desc">As mesmas quatro etapas e três bombas, reorganizadas verticalmente para celular. Todos os valores são exemplos.</desc>
<path d="M18 91 127 44 321 269 290 402 118 485 40 641 329 779 283 878 48 749 6 612 85 431 248 334Z" fill="var(--ground-top)" opacity=".25"/>
<use href="#river-art" transform="translate(0 71) scale(.71)"/>
<use href="#well-art" transform="translate(143 245) scale(.78)"/>
<use href="#tower-art" transform="translate(1 466) scale(.83)"/>
<use href="#farm-art" transform="translate(63 714) scale(.88)"/>
<g class="pipe-base"><path d="M159 144H182V194H262V286H260"/><path d="M260 286H307V410H135V508H95"/><path d="M167 629H174V675H240V760H209V779"/></g>
<g class="pipe-core"><path d="M159 144H182V194H262V286H260"/><path d="M260 286H307V410H135V508H95"/><path d="M167 629H174V675H240V760H209V779"/></g>
<g data-pump="1" data-pump-state="off"><use href="#motor-art" transform="translate(196 177) scale(.66)"/><text x="269" y="200" class="scene-number">B01</text></g>
<g data-pump="2" data-pump-state="off"><use href="#motor-art" transform="translate(143 393) scale(.66)"/><text x="146" y="457" class="scene-number">B02</text></g>
<g data-pump="3" data-pump-state="off"><use href="#motor-art" transform="translate(174 658) scale(.66)"/><text x="254" y="679" class="scene-number">B03</text></g>
<g><text x="15" y="30" class="scene-number">01 / ORIGEM</text><text x="15" y="56" class="scene-title">Rio</text><text x="218" y="82" class="scene-value">80%</text><text x="218" y="106" class="scene-sub">Exemplo</text><text x="15" y="201" class="scene-sub">Curso de água</text></g>
<g><text x="15" y="283" class="scene-number">02 / RESERVA</text><text x="15" y="310" class="scene-title">Poço</text><text x="15" y="338" class="scene-value">35%</text><text x="15" y="362" class="scene-sub">Em corte</text></g>
<g><text x="202" y="509" class="scene-number">03 / DISTRIBUIÇÃO</text><text x="202" y="537" class="scene-title">Caixa elevada</text><text x="202" y="565" class="scene-value">60%</text><text x="202" y="589" class="scene-sub">Exemplo</text></g>
<g><text x="15" y="714" class="scene-number">04 / CULTIVO</text><text x="15" y="741" class="scene-title">Plantação</text><text x="15" y="897" class="scene-sub">Solo 38% · escala relativa · exemplo</text></g>
</svg>`;
sceneRoot.innerHTML=desktop+tablet+mobile;
// Halos fora dos símbolos: seletores de estado não atravessam a árvore <use>.
sceneRoot.querySelectorAll('[data-pump]').forEach(group=>{
 const icon=group.querySelector('use'),halo=document.createElementNS('http://www.w3.org/2000/svg','ellipse');
 for(const [key,value] of Object.entries({class:'pump-halo',cx:'41',cy:'25',rx:'53',ry:'34',fill:'none',transform:icon.getAttribute('transform')}))halo.setAttribute(key,value);
 group.prepend(halo);
});

// Cinco fileiras, seis plantas por fileira: ilustração fixa, sem inferir saúde.
const cropRows=document.getElementById('crop-rows');
for(let row=0;row<5;row++)for(let col=0;col<6;col++){
 const plant=document.createElementNS('http://www.w3.org/2000/svg','use');
 plant.setAttribute('href','#plant');plant.setAttribute('transform',`translate(${28+row*28+col*25} ${93+row*15-col*13}) scale(.78)`);cropRows.append(plant);
}
const pumpDeck=document.getElementById('pump-deck');
const functions=['Captação','Transferência','Irrigação'],routes=['Rio → Poço','Poço → Caixa','Caixa → Plantação'];
functions.forEach((name,i)=>{
 const article=document.createElement('article');article.className='pump-module';article.dataset.module=String(i+1);article.dataset.state='off';
 article.innerHTML=`<header class="pump-title"><span class="pump-code">B0${i+1}</span><h4>${name}</h4></header><p class="pump-route">${routes[i]}</p><div class="pump-confirmed">Desligada · confirmação ilustrativa</div><div class="command-line"><label class="duration">Duração (s)<input type="number" value="4" disabled aria-label="Duração ilustrativa da bomba ${i+1}"></label><button class="start" type="button" disabled>Ligar</button><button type="button" disabled>Desligar</button></div><p class="pump-feedback">Controles desativados nesta prévia.</p>${i===2?'<details><summary>Avançado · duração em minutos</summary><p>O conversor existente será preservado na integração. Este protótipo não executa operações.</p></details>':''}`;
 pumpDeck.append(article);
});
document.getElementById('preview-state').addEventListener('change',event=>{
 const selection=event.target.value;
 document.querySelectorAll('.pump-module').forEach(module=>{
  const id=Number(module.dataset.module),state=selection==='unknown'?'unknown':selection==='confirmed'&&id===2?'confirmed':(selection==='pending'||selection==='blocked')&&id===3?selection:'off';
  module.dataset.state=state;
  const labels={off:'Desligada · confirmação ilustrativa',confirmed:'Ligada · confirmação ilustrativa',pending:'Desligada · pedido em espera (exemplo)',blocked:'Desligada · comando bloqueado (exemplo)',unknown:'Sem dados · exemplo'};
  module.querySelector('.pump-confirmed').textContent=labels[state];
  module.querySelector('.pump-feedback').textContent=state==='pending'?'Exemplo de pedido pendente. Não implica bomba ligada.':state==='blocked'?'Exemplo: controlador bloqueou o pedido. Nenhuma trava foi alterada.':state==='unknown'?'Exemplo de telemetria ausente. Não conservar o último valor.':'Controles desativados nesta prévia.';
  document.querySelectorAll(`[data-pump="${id}"]`).forEach(pump=>pump.dataset.pumpState=state);
 });
});
const menu=document.getElementById('navigation'),openButton=document.getElementById('menu-open'),backdrop=document.getElementById('backdrop');
function closeMenu(){document.body.classList.remove('menu-open');openButton.setAttribute('aria-expanded','false');backdrop.hidden=true;openButton.focus();}
openButton.addEventListener('click',()=>{document.body.classList.add('menu-open');openButton.setAttribute('aria-expanded','true');backdrop.hidden=false;document.getElementById('menu-close').focus();});
document.getElementById('menu-close').addEventListener('click',closeMenu);backdrop.addEventListener('click',closeMenu);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('menu-open'))closeMenu();});
document.getElementById('theme').addEventListener('click',()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';});
