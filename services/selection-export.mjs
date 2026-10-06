export const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

async function embedImage(path) {
  const response = await fetch(path);
  if (!response.ok) throw Error('Image unavailable');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(Error('Image unreadable'));
    reader.readAsDataURL(blob);
  });
}

// parts are immutable, source-reviewed HTML; release validation pins the dataset.
export async function buildSelectionDocument(questions, loadImage = embedImage) {
  if (!questions.length) throw Error('Empty selection');
  const images = new Map();
  const sections = [];
  for (const question of questions) {
    let body = question.parts.join('');
    for (const [, path] of body.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)) {
      if (!images.has(path)) {
        const data = await loadImage(path);
        if (!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data)) throw Error('Invalid image');
        images.set(path, data);
      }
      body = body.replaceAll(`src="${path}"`, `src="${images.get(path)}"`);
    }
    sections.push(`<section><h2>${escape(question.groupName)} · ${escape(question.type)} · 原题 ${question.sourceNumber}</h2>${body}</section>`);
  }
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>钢筋混凝土梁 · 选题单</title><style>body{max-width:800px;margin:40px auto;padding:0 20px;font:18px/1.8 "Songti SC",SimSun,serif}h1{font-size:28px}h2{font:16px/1.5 sans-serif}section{padding:24px 0;border-top:1px solid #ddd;break-inside:avoid}img{max-width:100%;height:auto}math{font-size:1em}</style></head><body><h1>钢筋混凝土梁 · 选题单</h1>${sections.join('')}</body></html>`;
}
