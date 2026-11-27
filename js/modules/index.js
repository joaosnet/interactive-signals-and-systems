// A ordem dos imports é a ordem dos módulos no seletor e nos atalhos '[' e ']'.
// Para adicionar um módulo: crie o arquivo com registerModule({...}) e importe-o aqui.
import './convolution.js';
import './dconv.js';
import './fourier.js';
import './ctft.js';
import './dtft.js';
import './dft.js';
import './laplace.js';
import './z.js';

export * from './registry.js';
