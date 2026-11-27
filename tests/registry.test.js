import test from 'node:test';
import assert from 'node:assert/strict';

import { registerModule, listModules, setModuleOrder, getModule } from '../js/modules/registry.js';

test('Registro: a ordem do seletor vem da lista declarada, nao da ordem de registro', () => {
  // Registra fora de ordem, como acontece quando os arquivos se importam entre si
  for (const id of ['t-c', 't-a', 't-extra', 't-b']) registerModule({ id, hash: id });
  setModuleOrder(['t-a', 't-b', 't-c']);
  assert.deepEqual(listModules().map((m) => m.id), ['t-a', 't-b', 't-c', 't-extra']);
  assert.equal(getModule('t-b').hash, 't-b');
  assert.throws(() => registerModule({ id: 't-a' }), /duplicado/);
  assert.throws(() => registerModule({}), /sem id/);
});
