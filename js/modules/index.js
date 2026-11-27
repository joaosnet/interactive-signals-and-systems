// Para adicionar um módulo: crie o arquivo com registerModule({...}), importe-o
// aqui e ponha o id dele em MODULE_ORDER, na posição em que deve aparecer.
import './convolution.js';
import './dconv.js';
import './fourier.js';
import './ctft.js';
import './dtft.js';
import './dft.js';
import './laplace.js';
import './z.js';
import { setModuleOrder } from './registry.js';

/** Ordem dos módulos no seletor e nos atalhos '[' e ']'. */
export const MODULE_ORDER = ['convolution', 'dconv', 'fourier', 'ctft', 'dtft', 'dft', 'laplace', 'ztransform'];
setModuleOrder(MODULE_ORDER);

export * from './registry.js';
