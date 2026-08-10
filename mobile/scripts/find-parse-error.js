const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const root = path.join(__dirname, '..');
const files = (fs.existsSync(path.join(root, 'src')) ? walk(path.join(root, 'src')) : []).concat([path.join(root, 'App.tsx')]);
const exts = ['.js', '.jsx', '.ts', '.tsx'];

for (const f of files) {
  if (!exts.includes(path.extname(f))) continue;
  try {
    const code = fs.readFileSync(f, 'utf8');
    parser.parse(code, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'typescript',
        'classProperties',
        'decorators-legacy',
        'optionalChaining',
        'nullishCoalescingOperator',
        'numericSeparator',
        'objectRestSpread',
      ],
    });
  } catch (err) {
    console.error('Parse error in file:', f);
    console.error(err.message);
    console.error(err.stack);
    process.exit(1);
  }
}
console.log('No parse errors detected');
