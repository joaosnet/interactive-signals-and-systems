import test from 'node:test';
import assert from 'node:assert/strict';

import { I18N } from '../js/i18n.js';

test('Traducoes: portugues, ingles e espanhol tem exatamente as mesmas chaves', () => {
  const pt = Object.keys(I18N.pt).sort();
  for (const lang of ['en', 'es']) {
    assert.deepEqual(Object.keys(I18N[lang]).sort(), pt, `chaves de ${lang}`);
  }
  for (const lang of ['pt', 'en', 'es']) {
    for (const [key, value] of Object.entries(I18N[lang])) {
      assert.equal(typeof value, 'string', `${lang}.${key}`);
      assert.ok(value.trim().length > 0, `${lang}.${key} vazio`);
    }
  }
});

test('Traducoes: o botao de idioma anuncia o proximo da roda pt, en, es', () => {
  assert.equal(I18N.pt.langBtn, 'EN');
  assert.equal(I18N.en.langBtn, 'ES');
  assert.equal(I18N.es.langBtn, 'PT');
});
