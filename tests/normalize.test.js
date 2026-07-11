import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stableId, stripHtml, isLittleKidRelevant, ageMonthsFromText, etIso, centroid, pick } from '../scripts/lib/normalize.js';

test('stableId is deterministic and prefixed', () => {
  assert.equal(stableId('sie', 'abc', '2026-07-20'), stableId('sie', 'abc', '2026-07-20'));
  assert.notEqual(stableId('sie', 'abc', '2026-07-20'), stableId('sie', 'abc', '2026-07-21'));
  assert.match(stableId('sie', 'x'), /^sie-[0-9a-f]{10}$/);
});

test('stripHtml flattens tags and entities', () => {
  assert.equal(stripHtml('<p>Kids &amp; Families</p>'), 'Kids & Families');
});

test('little-kid relevance gate', () => {
  assert.ok(isLittleKidRelevant('Toddler Story Time'));
  assert.ok(isLittleKidRelevant('Baby Lap Time'));
  assert.ok(isLittleKidRelevant('Fun for Kids & Families'));
  assert.ok(!isLittleKidRelevant('Evening lecture for adults 21+'));
  assert.ok(!isLittleKidRelevant('Teen coding club'));
  assert.ok(!isLittleKidRelevant('Family wine tasting')); // exclusion wins
  assert.ok(!isLittleKidRelevant('Watercolor basics'));
});

test('age range parsing in months', () => {
  assert.deepEqual(ageMonthsFromText('For children aged 18-36 months'), { min: 18, max: 36 });
  assert.deepEqual(ageMonthsFromText('ages 2-5'), { min: 24, max: 60 });
  assert.deepEqual(ageMonthsFromText('birth to 5'), { min: 0, max: 60 });
  assert.deepEqual(ageMonthsFromText('5 and under'), { min: 0, max: 60 });
  assert.deepEqual(ageMonthsFromText('all ages welcome'), { min: 0, max: null });
  assert.equal(ageMonthsFromText('a lecture for adults'), null);
});

test('etIso appends an ET offset and passes through offsets', () => {
  assert.equal(etIso('2026-07-20 10:30:00'), '2026-07-20T10:30:00-04:00'); // EDT
  assert.equal(etIso('2026-01-20T10:30:00'), '2026-01-20T10:30:00-05:00'); // EST
  assert.equal(etIso('2026-07-20T10:30:00-04:00'), '2026-07-20T10:30:00-04:00');
  assert.ok(!isNaN(Date.parse(etIso('2026-07-20')))); // date-only gets a time
});

test('centroid handles points and polygons', () => {
  assert.deepEqual(centroid({ type: 'Point', coordinates: [-77, 38.9] }), { lat: 38.9, lon: -77 });
  const c = centroid({ type: 'Polygon', coordinates: [[[-77, 38.88], [-76.98, 38.88], [-76.98, 38.9], [-77, 38.9], [-77, 38.88]]] });
  assert.ok(Math.abs(c.lon - -76.99) < 1e-9 && Math.abs(c.lat - 38.89) < 1e-9);
});

test('pick is case-insensitive and skips empties', () => {
  assert.equal(pick({ FACILITY_NAME: '', Name: 'Rosedale Pool' }, ['FACILITY_NAME', 'NAME']), 'Rosedale Pool');
  assert.equal(pick({ a: 1 }, ['b']), null);
});
