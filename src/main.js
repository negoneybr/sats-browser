const { app, BrowserWindow, WebContentsView, ipcMain, session, shell } = require('electron');
const path = require('node:path');

let win;
const tabs = new Map();
let activeId = null;
let nextId = 1;
const HOME = 'https://desenvolvimento-da-rede-sats.vercel.app';

function safeUrl(input) {
  const value = String(input || '').trim();
  if (!value) return HOME;
  if (/^(javascript|file|data):/i.test(value)) return 'https://www.google.com/search?q=' + encodeURIComponent(value);
  if (/^https?:\/\//i.test(value)) return value;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(value) && !value.includes(' ')) return 'https://' + value;
  return 'https://www.google.com/search?q=' + encodeURIComponent(value);
}
function createWindow() {
  win = new BrowserWindow({ width: 1440, height: 900, minWidth: 800, minHeight: 560, backgroundColor: '#101014', title: 'SATS Browser',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
  win.loadFile(path.join(__dirname, 'index.html'));
  win.on('resize', layoutActive);
  win.on('closed', () => { win = null; for (const t of tabs.values()) t.view.webContents.close(); tabs.clear(); activeId = null; });
}
function sendState() {
  if (!win || win.isDestroyed()) return;
  win.webContents.send('tabs:state', { tabs: [...tabs.values()].map(t => ({id:t.id,title:t.title||'Nova aba',url:t.url,active:t.id===activeId,loading:t.loading})), activeId });
}
function layoutActive() {
  if (!win || !activeId) return;
  const tab = tabs.get(activeId); if (!tab) return;
  const [width,height] = win.getContentSize();
  tab.view.setBounds({x:0,y:124,width,height:Math.max(100,height-124)});
}
function activateTab(id) {
  const tab = tabs.get(Number(id)); if (!tab || !win) return;
  if (activeId && tabs.has(activeId)) win.contentView.removeChildView(tabs.get(activeId).view);
  activeId = tab.id; win.contentView.addChildView(tab.view); layoutActive(); sendState();
}
function navigate(id, raw) {
  const tab = tabs.get(Number(id)); if (!tab) return;
  const url = safeUrl(raw); tab.url = url; tab.view.webContents.loadURL(url).catch(() => {}); sendState();
}
function createTab(url = HOME) {
  if (!win) return;
  const id = nextId++;
  const view = new WebContentsView({webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,partition:'persist:sats-browser'}});
  const tab = {id,view,title:'SATS',url:HOME,loading:false}; tabs.set(id,tab);
  view.webContents.setWindowOpenHandler(({url}) => { createTab(url); return {action:'deny'}; });
  view.webContents.on('page-title-updated',(_e,title)=>{tab.title=title;sendState();});
  view.webContents.on('did-start-loading',()=>{tab.loading=true;sendState();});
  view.webContents.on('did-stop-loading',()=>{tab.loading=false;tab.url=view.webContents.getURL();sendState();});
  view.webContents.on('did-navigate',(_e,url)=>{tab.url=url;sendState();});
  view.webContents.on('did-navigate-in-page',(_e,url)=>{tab.url=url;sendState();});
  view.webContents.on('will-navigate',(event,url)=>{if(!/^https?:\/\//i.test(url)) event.preventDefault();});
  activateTab(id); navigate(id,url);
}
function activeTab(){return tabs.get(activeId);}
app.whenReady().then(()=>{
  session.fromPartition('persist:sats-browser').setPermissionRequestHandler((_wc,permission,callback)=>{
    callback(new Set(['fullscreen','media','notifications','clipboard-read']).has(permission));
  });
  createWindow(); win.webContents.once('did-finish-load',()=>createTab(HOME));
  app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0){createWindow();win.webContents.once('did-finish-load',()=>createTab(HOME));}});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
ipcMain.handle('tab:new',(_e,url)=>createTab(url||HOME));
ipcMain.handle('tab:activate',(_e,id)=>activateTab(id));
ipcMain.handle('tab:close',(_e,id)=>{
  id=Number(id);const tab=tabs.get(id);if(!tab)return;
  if(win&&activeId===id)win.contentView.removeChildView(tab.view);
  tab.view.webContents.close();tabs.delete(id);
  if(activeId===id){activeId=null;const next=[...tabs.keys()].pop();if(next)activateTab(next);else createTab(HOME);}
  sendState();
});
ipcMain.handle('nav:go',(_e,url)=>{if(activeTab())navigate(activeId,url);});
ipcMain.handle('nav:back',()=>{const t=activeTab();if(t?.view.webContents.canGoBack())t.view.webContents.goBack();});
ipcMain.handle('nav:forward',()=>{const t=activeTab();if(t?.view.webContents.canGoForward())t.view.webContents.goForward();});
ipcMain.handle('nav:reload',()=>{const t=activeTab();if(t)t.view.webContents.reload();});
ipcMain.handle('nav:home',()=>{if(activeTab())navigate(activeId,HOME);});
ipcMain.handle('external:open',(_e,url)=>shell.openExternal(safeUrl(url)));
ipcMain.handle('nav:state',()=>{const t=activeTab();return t?{url:t.view.webContents.getURL(),back:t.view.webContents.canGoBack(),forward:t.view.webContents.canGoForward()}:null;});