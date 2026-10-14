import type { KitDoc } from './types';
import { shaderBackgroundPresets } from './shaderBackgrounds';
export const backgrounds = shaderBackgroundPresets.filter(p => ['amber-pulse','cyber-teal','forest-mist'].includes(p.id));
export const rolePresets = [
 {id:'i-am-speaking',label:'Speaking',prefix:'I AM',headline:'Speaking'},
 {id:'i-am-attending',label:'Attending',prefix:'I AM',headline:'Attending'},
 {id:'i-am-hosting',label:'Hosting',prefix:'I AM',headline:'Hosting'},
 {id:'custom',label:'Your own words',prefix:'LET’S MAKE',headline:'Something useful'},
];
export function createDoc():KitDoc {return {
 templateId:'custom',customTemplate:{prefix:'LET’S MAKE',headline:'Something useful'},backgroundId:'forest-mist',background:null,
 companyLogo:{image:null},eventLogo:{image:null},photo:{image:null,offsetX:0,offsetY:0,scale:1,visible:false},
 eventName:{text:'A small idea, made real.',visible:true},name:{text:'The Sunday Studio',visible:true},
 title:{text:'Creative experiments · Copenhagen',visible:true},company:{text:'',visible:false},
 textColor:'#ffffff',aspect:'square',font:'sans',composition:'poster',headlineScale:1,
};}
