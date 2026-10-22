import {Application} from '@splinetool/runtime';
import {openSpline} from '../../src/core/adapters.mjs';
export const mountSpline=(stage,context)=>openSpline(stage,{...context,SplineApplication:Application});
