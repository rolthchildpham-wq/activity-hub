const fs = require('fs');
const vm = require('vm');

let count = 0;
for (const file of ['sports/badminton/index.html', 'sports/vnext/index.html']) {
  const html = fs.readFileSync(file, 'utf8');
  let local = 0;
  for (const match of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/application\/json/i.test(match[1])) continue;
    local += 1;
    count += 1;
    new vm.Script(match[2], {filename: `${file}#inline-${local}`});
  }
}

console.log('H117_INLINE_SYNTAX_OK', count);
