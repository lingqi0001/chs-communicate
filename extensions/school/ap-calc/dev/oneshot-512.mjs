// one-shot independent verification of topic 5.12 geometry via headless Chrome CDP
const PORT = 9333;
const SH = 'http://127.0.0.1:8907/extensions/school/ap-calc/AP%20Calculus%20Visual%20Lab.html';

const put = await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(SH)}`, { method: 'PUT' });
const tab = await put.json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });

let id = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((res) => {
    const n = ++id;
    pending.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
});
ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};

await send('Page.enable');
await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Page.navigate', { url: SH });
await new Promise(r => setTimeout(r, 6000));

const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result && r.result.exceptionDetails) return 'EXC ' + JSON.stringify(r.result.exceptionDetails).slice(0, 400);
    return r.result && r.result.result ? r.result.result.value : JSON.stringify(r.result).slice(0, 400);
};

console.log('probe 5.11 + 5.12 ->');
console.log(await ev(`import('/extensions/school/ap-calc/dev/probe.mjs?r=own1').then(m=>m.run(['5.11','5.12'],{detail:'all'})).then(x=>JSON.stringify(x))`));
ws.close();
