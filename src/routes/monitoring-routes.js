const {Router}=require('express');
const {monitoringController}=require('../controllers/monitoring-controller');
const wrap=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
function monitoringRoutes(context,master){const router=Router(),c=monitoringController(context);
 for(const [path,fn] of [['/estado',c.current],['/leituras/atuais',c.current],['/leituras',c.history],['/leituras/historico',c.history],['/leituras.csv',c.csv],['/eventos',c.events],['/acionamentos',c.actions],['/configuracoes',c.settings],['/clima',c.weather]])router.get(path,wrap(fn));
 router.put('/configuracoes',master,wrap(c.saveSettings));router.post('/simulacao',master,wrap(c.simulation));router.post('/bombas/:id',master,wrap(c.pump));router.post('/rega',master,wrap(c.irrigate));router.delete('/rega',master,wrap(c.stop));router.post('/modo',master,wrap(c.mode));router.post('/limiares',master,wrap(c.thresholds));router.post('/calibracao',master,wrap(c.calibrate));
 return router;
}
module.exports={monitoringRoutes};
