const fs=require('node:fs'),path=require('node:path');
class SettingsService{
 constructor({file,flows=[null,null,null]}={}){this.file=file;this.flows=flows;if(file&&fs.existsSync(file)){const data=JSON.parse(fs.readFileSync(file,'utf8'));this.validate(data.vazoes_l_min);this.flows=data.vazoes_l_min;}}
 validate(flows){if(!Array.isArray(flows)||flows.length!==3||flows.some(v=>v!==null&&(typeof v!=='number'||!Number.isFinite(v)||v<=0||v>1000)))throw Object.assign(new Error('Informe três vazões em L/min positivas ou null para não calibrada.'),{status:400});}
 get(){return {vazoes_l_min:[...this.flows],estimativa:true,rotulo:'ESTIMATIVA — sem medidor de vazão',calibracao_por_bomba:this.flows.map(v=>v!==null)};}
 save(flows){this.validate(flows);if(this.file){fs.mkdirSync(path.dirname(this.file),{recursive:true});const temp=this.file+'.tmp';fs.writeFileSync(temp,JSON.stringify({vazoes_l_min:flows}),{mode:0o600});fs.renameSync(temp,this.file);}this.flows=[...flows];return this.get();}
}
module.exports={SettingsService};
